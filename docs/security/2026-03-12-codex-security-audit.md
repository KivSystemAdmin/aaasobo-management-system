# SYSTEM AUDIT REPORT

## Critical Vulnerabilities

### CV-01: Authentication bypass risk in NextAuth Credentials provider

**Current code (relevant excerpt):**

```ts
// frontend/auth.config.ts
Credentials({
  async authorize(credentials) {
    try {
      const userId = String(credentials.userId);
      const userType = credentials.userType as UserType;

      if (!userId || !userType) {
        console.warn(
          `Missing required credentials in authorize: userId:${userId}, userType:${userType}`,
        );
        return null;
      }

      // Returns identity without server-side password validation here
      return {
        id: userId,
        userType,
      };
    } catch (error) {
      console.error("Unexpected error in authorize:", error);
      return null;
    }
  },
}),
```

**Risk:** High-likelihood auth bypass if attacker can call the credentials callback directly with crafted `userId`/`userType`.

**Proposed solution (authoritative verification in `authorize`)**

```ts
// frontend/auth.config.ts (proposed)
import { z } from "zod";

const credentialSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  userType: z.enum(["admin", "customer", "instructor"]),
});

Credentials({
  async authorize(credentials) {
    const parsed = credentialSchema.safeParse(credentials);
    if (!parsed.success) return null;

    const res = await fetch(`${process.env.BACKEND_ORIGIN}/users/authenticate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = (await res.json()) as { id: number; userType?: UserType };
    return {
      id: String(data.id),
      userType: parsed.data.userType,
    };
  },
}),
```

**Additional hardening:**
- Accept only email/password/userType in credentials.
- Remove trust of client-provided user ID.
- Add IP/account rate limits on `/users/authenticate`.

---

### CV-02: Cross-site request abuse risk (cookie-based session without CSRF controls)

**Current code (relevant excerpts):**

```ts
// frontend/auth.config.ts
cookies: {
  sessionToken: {
    name: "next-auth.session-token",
    options: {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    },
  },
},
```

```ts
// backend/src/server.ts
server.use(express.json());
server.use(cookieParser());
// no CSRF middleware/token validation configured
```

**Risk:** Cross-site state-changing requests may carry cookies in production contexts if `SameSite=None` is required and CSRF controls are absent.

**Proposed solution (double-submit token style + strict origin checks):**

```ts
// backend/src/middlewares/csrf.middleware.ts (proposed)
import { Request, Response, NextFunction } from "express";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export const verifyCsrf = (req: Request, res: Response, next: NextFunction) => {
  if (SAFE_METHODS.has(req.method)) return next();

  const origin = req.headers.origin;
  const allowedOrigin = process.env.FRONTEND_ORIGIN;
  if (!origin || origin !== allowedOrigin) {
    return res.status(403).json({ message: "Invalid origin" });
  }

  const csrfCookie = req.cookies?.csrfToken;
  const csrfHeader = req.headers["x-csrf-token"];

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({ message: "CSRF validation failed" });
  }

  next();
};
```

```ts
// backend/src/server.ts (proposed)
import helmet from "helmet";
import { verifyCsrf } from "./middlewares/csrf.middleware";

server.use(helmet());
server.use(express.json());
server.use(cookieParser());
server.use(verifyCsrf);
```

**Additional hardening:**
- Use `SameSite=Lax` unless explicit cross-site requirement exists.
- Enforce anti-CSRF headers for all non-idempotent routes.

---

### CV-03: Secret-like values in repository docs (unsafe operational pattern)

**Current code (relevant excerpt from README):**

```env
KEY1=98b5b9c9ef24f4280561d95beb2ee54c00e81dfa1abc9d008b35b66e6c2095cc
KEY2=7e3caf8440ad740910137a1890940347c44a5258f73784e822d0d705a1db3b70
AUTH_SECRET="5e13a7ccb2e88d1a5c21dce34abbdc0c3d70f9c9dea9f994a4af4d5b7383caf5"
NEXTAUTH_SECRET="915bd2a1349be118cc299fef89b324b42d5c35a8dfabf3c272e96a1fafa05eeb"
```

**Risk:** Secret reuse/copy-paste into non-dev environments.

**Proposed solution (replace with placeholders + generation command):**

```env
KEY1="<generate_with_openssl_rand_hex_32>"
KEY2="<generate_with_openssl_rand_hex_32>"
AUTH_SECRET="<generate_with_openssl_rand_hex_32>"
NEXTAUTH_SECRET="<generate_with_openssl_rand_hex_32>"
```

```sh
openssl rand -hex 32
```

---

## High Risk Issues

### HR-01: No rate limiting on auth-sensitive endpoints

**Current code (routes registered without throttling middleware):**

```ts
// backend/src/routes/usersRouter.ts
const routeConfigs = {
  "/authenticate": [authenticateConfig],
  "/send-password-reset": [sendPasswordResetConfig],
  "/update-password": [updatePasswordConfig],
  "/verify-reset-token": [verifyResetTokenConfig],
} as const;
```

**Proposed solution (example with express-rate-limit):**

```ts
// backend/src/middlewares/rateLimit.middleware.ts (proposed)
import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many authentication attempts. Try again later." },
});

export const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many reset attempts. Try again later." },
});
```

```ts
// backend/src/routes/usersRouter.ts (proposed)
middleware: [authLimiter] // for /authenticate
middleware: [resetLimiter] // for reset token endpoints
```

---

### HR-02: Password reset/verification tokens stored in plaintext

**Current code (plaintext token persistence):**

```ts
// backend/src/services/passwordResetTokensService.ts
const token = uuidv4();
await prisma.passwordResetToken.create({
  data: {
    email,
    token,
    expires,
  },
});
```

```ts
// backend/src/services/verificationTokensService.ts
const token = uuidv4();
return db.verificationToken.create({
  data: { email, token, expires },
});
```

**Proposed solution (hash token at rest + constant-time compare):**

```ts
// backend/src/utils/tokenUtils.ts (proposed)
import { createHash, timingSafeEqual } from "crypto";

export const hashToken = (raw: string) =>
  createHash("sha256").update(raw, "utf8").digest("hex");

export const safeCompareHash = (a: string, b: string) => {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
};
```

```ts
// password reset create (proposed)
const rawToken = crypto.randomUUID();
const tokenHash = hashToken(rawToken);
await prisma.passwordResetToken.create({ data: { email, tokenHash, expires } });
// send rawToken only via email
```

```ts
// password reset verify (proposed)
const candidateHash = hashToken(rawTokenFromUser);
const record = await prisma.passwordResetToken.findFirst({ where: { email } });
if (!record || !safeCompareHash(record.tokenHash, candidateHash)) return null;
```

---

### HR-03: Sensitive token value logged in password update error path

**Current code:**

```ts
// backend/src/controllers/usersController.ts
console.error("Error updating password", {
  error,
  context: {
    token,
    userType,
    time: new Date().toISOString(),
  },
});
```

**Proposed solution (redact secrets):**

```ts
console.error("Error updating password", {
  error: error instanceof Error ? error.message : "unknown_error",
  context: {
    userType,
    tokenPresent: Boolean(token),
    time: new Date().toISOString(),
  },
});
```

---

### HR-04: Weak file-upload hardening for import endpoints

**Current code:**

```ts
// backend/src/middlewares/upload.middleware.ts
const importUpload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
});
```

**Proposed solution (allowlist + ZIP policy):**

```ts
const importUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMime = ["application/zip", "application/x-zip-compressed"];
    const allowedExt = /\.zip$/i.test(file.originalname);
    if (!allowedMime.includes(file.mimetype) || !allowedExt) {
      return cb(new Error("Only zip files are allowed"));
    }
    cb(null, true);
  },
});
```

**Additional controls:** inspect zip entries, reject nested archives, cap decompressed total size, and validate CSV schema before processing.

---

## Medium Issues

### MR-01: HTTP status mismatch in password-reset flows

**Current code:**

```ts
// backend/src/controllers/usersController.ts
return res.sendStatus(201); // send reset email
return res.sendStatus(201); // update password
```

```ts
// frontend/src/lib/api/usersApi.ts
if (response.status !== 200) {
  throw new Error(`HTTP Status: ${response.status} ${response.statusText}`);
}
```

**Proposed solution:**
- Option A: Backend returns `200` for idempotent success in these flows.
- Option B: Frontend accepts both `200` and `201`.

```ts
if (![200, 201].includes(response.status)) {
  throw new Error(`HTTP Status: ${response.status} ${response.statusText}`);
}
```

---

### MR-02: CORS configuration is fragile

**Current code:**

```ts
const allowedOrigin = process.env.FRONTEND_ORIGIN || "";
server.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  }),
);
```

**Proposed solution:**

```ts
const allowlist = (process.env.FRONTEND_ORIGINS ?? "")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

server.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      return allowlist.includes(origin)
        ? cb(null, true)
        : cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
```

---

### MR-03: Proxy trusts caller-supplied `backend-endpoint` header

**Current code:**

```ts
const backendEndpoint = req.headers.get("backend-endpoint");
const backendApiURL = `${process.env.BACKEND_ORIGIN}${backendEndpoint}`;
```

**Proposed solution (allowlist endpoint map):**

```ts
const endpointMap: Record<string, string> = {
  "get-admins": "/admins",
  "get-events": "/events",
  "get-classes": "/classes",
};

const key = req.headers.get("backend-endpoint-key") ?? "";
const endpoint = endpointMap[key];
if (!endpoint) {
  return new Response(JSON.stringify({ message: "Invalid endpoint" }), {
    status: 400,
  });
}

const backendApiURL = `${process.env.BACKEND_ORIGIN}${endpoint}`;
```

---

### MR-04: Raw error-object logging in cron and API paths

**Current code:**

```ts
console.error("Error during cron job (system status update) execution:", error);
```

**Proposed solution:**

```ts
console.error("cron_system_status_update_failed", {
  message: error instanceof Error ? error.message : "unknown_error",
  time: new Date().toISOString(),
});
```

---

## Low Issues

### LR-01: Manual cookie parsing in auth middleware

**Current code:**

```ts
token = req.headers.cookie
  ?.split("; ")
  .find((cookie) => cookie.startsWith(`${salt}=`))
  ?.split("=")[1];
```

**Proposed solution:**

```ts
const token = req.cookies?.[salt];
```

(Prefer standard parser usage and avoid header-string parsing branches unless strictly necessary.)

### LR-02: Dynamic import in auth hot path

**Current code:**

```ts
const { jwtVerify } = await import("jose");
```

**Proposed solution:**

```ts
import { jwtVerify } from "jose";
```

---

## Architecture Weaknesses

- Controller and API client files are oversized; business rules and transport logic are intermixed.
- Security controls are implemented ad-hoc per route instead of policy-based shared middleware.
- Frontend and backend auth boundaries are coupled through assumptions, not strict contracts.

### Proposed architecture pattern

1. **Security gateway middleware chain:**
   - `helmet` → `requestId` → `rateLimit` → `csrf` → `auth` → `routeHandler`.
2. **Service-level policy checks:**
   - Enforce authorization in services for defense-in-depth (not only route middleware).
3. **Unified API contract layer:**
   - Shared status + response schema constants consumed by both frontend and backend.

---

## Security Design Flaws

- Identity source of truth is weak in credentials flow.
- No abuse prevention baseline on authentication and password reset.
- Secret management hygiene in docs and logs is not production-safe.

### Proposed secure-by-default controls

- Mandatory rate-limit middleware for all auth-adjacent endpoints.
- Mandatory CSRF + origin checks for non-idempotent cookie-auth routes.
- Mandatory redaction utility for structured logging.
- Secrets policy in docs: placeholders only, never realistic values.

---

## Performance Concerns

- Duplicated proxy method handlers increase maintenance and parse overhead.
- Repetitive frontend fetch wrappers should be centralized.
- Large files slow review and increase defect density.

### Proposed solution

- Introduce a shared `apiClient` wrapper (timeout, status mapping, error normalization).
- Reduce proxy handler duplication with one internal dispatcher function.
- Split large controller/API files into feature modules.

---

## UX Problems

- Reset/update flows can show false errors due to status mismatch.
- Generic error messages increase support load.

### Proposed solution

- Align backend/frontend status contracts.
- Use a shared typed error envelope:

```ts
// shared/schemas/common (proposed)
{
  code: "RATE_LIMIT" | "VALIDATION_ERROR" | "UNAUTHORIZED" | "SERVER_ERROR";
  message: string;
  fieldErrors?: Record<string, string[]>;
  requestId?: string;
}
```

---

## Code Smells

- SRP violation in very large files.
- Repeated boilerplate and inconsistent error handling.
- Mixed concerns in controller layer.

### Proposed solution

- Extract use-case services (auth, reset, import, scheduling).
- Keep controllers thin (validate input → call service → map response).
- Add architecture lint rules (max file length, cyclomatic complexity thresholds).

---

## Recommended Fixes (Prioritized)

1. **Immediate (P0):** Fix credentials auth trust issue and remove token logging.
2. **Immediate (P0):** Add rate limiting on auth/reset endpoints.
3. **Immediate (P0):** Add CSRF + origin verification for state-changing routes.
4. **Near-term (P1):** Hash tokens at rest and implement constant-time comparison.
5. **Near-term (P1):** Harden upload pipeline (file allowlist + archive safety).
6. **Near-term (P1):** Align HTTP status contracts and shared error envelope.
7. **Mid-term (P2):** Refactor oversized modules and centralize API client logic.
8. **Mid-term (P2):** Replace README secret examples with placeholders.

---

## Suggested Refactoring Plan

### Sprint 1 (1 week): Security Hotfix
- Patch `authorize()` flow to server-validated credentials.
- Add `authLimiter` + `resetLimiter` middleware.
- Remove raw token logging.
- Accept 200/201 uniformly in reset flows until backend/frontend are aligned.

### Sprint 2 (1–2 weeks): Hardening
- Add CSRF middleware and strict origin checks.
- Add Helmet and baseline security headers.
- Introduce token hashing at rest for reset/verification token tables.
- Tighten file upload validation and archive handling.

### Sprint 3 (2 weeks): Reliability + Architecture
- Add shared API response contract and request ID tracing.
- Introduce `apiClient` wrapper and remove duplicated fetch boilerplate.
- Split large controllers/API clients into feature modules.

### Sprint 4 (ongoing): Security QA
- Add regression tests for:
  - Auth bypass attempts
  - Brute force protections
  - CSRF failures
  - Token replay and expiry
  - Upload validation edge cases

---

## Security Hardening Checklist

- [ ] Credentials provider validates credentials server-side.
- [ ] Login/reset endpoints are rate-limited.
- [ ] CSRF token verification enforced for state-changing operations.
- [ ] Origin/Referer checks enforced where appropriate.
- [ ] Reset/verification tokens hashed at rest.
- [ ] Sensitive data redacted in logs.
- [ ] Helmet + secure HTTP headers enabled.
- [ ] Upload MIME/extension allowlist + archive safety checks active.
- [ ] Proxy route uses endpoint allowlist (no raw passthrough).
- [ ] README uses placeholders for all secrets.
- [ ] Shared response contract used by frontend/backend.
- [ ] Security regression tests included in CI.

---

## Production Readiness Score

**Score: 4.4/10**

**Justification:**
- Positives: clear high-level separation and good use of shared schemas.
- Blockers: auth trust flaw, missing CSRF/rate-limit baseline, plaintext token persistence, and log/data handling weaknesses.
- Recommendation: do not treat as production-ready until P0/P1 remediations are completed and validated by automated security regression tests.
