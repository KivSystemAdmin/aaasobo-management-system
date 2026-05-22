# aaasobo-management-system

## Setup

### shared

The `/shared` directory contains Zod schemas used between frontend and backend.

#### Install Packages

```sh
cd shared
npm install
```

### backend

#### Install Packages

```sh
cd backend
npm install
```

#### .env

Create the `.env` file in the `backend` directory with the following content:

```
# Environment variables declared in this file are automatically made available to Prisma.
# See the documentation for more detail: https://pris.ly/d/prisma-schema#accessing-environment-variables-from-the-schema

# Prisma supports the native connection string format for PostgreSQL, MySQL, SQLite, SQL Server, MongoDB and CockroachDB.
# See the documentation for all the connection string options: https://pris.ly/d/connection-strings

FRONTEND_ORIGIN="http://localhost:3000"
POSTGRES_PRISMA_URL="postgresql://postgres:summer@localhost:5432/mydb?schema=public"
POSTGRES_URL_NON_POOLING="postgresql://postgres:summer@localhost:5432/mydb?schema=public"
PORT=4000
KEY1="<generate_with_openssl_rand_hex_32>"
KEY2="<generate_with_openssl_rand_hex_32>"
RESEND_API_KEY="Dummy Resend API Key"
AUTH_SECRET="<generate_with_openssl_rand_hex_32>"
AUTH_SALT="next-auth.session-token"
BOOTSTRAP_ADMIN_EMAIL="admin@example.com"
BOOTSTRAP_ADMIN_NAME="Local Admin"
BOOTSTRAP_ADMIN_PASSWORD="<local_admin_password>"
```

Note that the following variables should be changed to match your local setup:

- `POSTGRES_PRISMA_URL`: postgres://<user>:<password>@localhost:<port>/<dbname>?schema=schema
- `POSTGRES_URL_NON_POOLING`
- `RESEND_API_KEY` is shared in the development team.
- `AUTH_SECRET` must match the frontend `AUTH_SECRET` (same value).
- `AUTH_SALT` must be `next-auth.session-token` (the session cookie name used by the frontend in this repo).
- `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_NAME`, and `BOOTSTRAP_ADMIN_PASSWORD` are used by `npm run db:bootstrap` to create the first admin only when it does not already exist. Do not commit real production credentials.

`KEY1` and `KEY2` are used for security purposes. They should be changed to a random string, for example, by running either of the following command:

```sh
openssl rand -hex 32
```

or

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Launch Database

If you are using Docker, you can launch the database with the following command:

```sh
npm run db:start
```

#### Prisma

Reset the local database, run migrations, and bootstrap required data:

```sh
npm run prisma:init
```

Run only the idempotent bootstrap seed for required production-safe data:

```sh
npm run db:bootstrap
```

Insert local dummy data explicitly when needed:

```sh
npm run seed:dummy
```

Vercel deploys run `npm run build`, which generates Prisma, applies migrations with `prisma migrate deploy`, and then runs the idempotent bootstrap seed.

#### Tests

```sh
cd backend
npm run test
```

Tests run in parallel using one PostgreSQL instance with one database per Vitest worker (databases are named `aaasobo_test_<workerId>` and are created/dropped automatically). Use Docker (Testcontainers), or set `TEST_DATABASE_URL` (or `POSTGRES_PRISMA_URL`/`DATABASE_URL` via `backend/.env`) to a reachable PostgreSQL instance; the configured DB user must be able to create/drop databases.

#### Start Server

```sh
npm run dev
```

The following message should be displayed:

```sh
$ npm run dev

> backend@1.0.0 dev
> nodemon --exec ts-node ./api/app.ts

[nodemon] 3.1.4
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: ts,json
[nodemon] starting `ts-node ./api/app.ts`
[Server]: http://localhost:4000
```

### frontend

#### Install Packages

```sh
cd frontend
npm install
```

#### .env

Create a `.env` file in the `frontend` directory with the following content:

```
NEXTAUTH_SECRET="<generate_with_openssl_rand_hex_32>"
AUTH_SECRET="<generate_with_openssl_rand_hex_32>"
AUTH_SALT="798ceed428885abab905b5291e9eb97b"
AUTH_TRUST_HOST=true
NEXT_PUBLIC_FRONTEND_ORIGIN="http://localhost:3000"

# Optional. Default is http://localhost:4000
BACKEND_ORIGIN="http://localhost:4000"

# Optional. Default is http://localhost:4000
NEXT_PUBLIC_BACKEND_ORIGIN="http://localhost:4000"
```

`NEXTAUTH_SECRET` and `AUTH_SECRET` should be randomly generated. See the backend section above.

#### Start Next.js

```sh
npm run dev
```

The frontend should be available at [http://localhost:3000](http://localhost:3000).

---

## 🧩 Folder Structure

This project is structured to separate concerns and make it easier to maintain and scale the application. Below is an overview of the key folders:

### 📂 `components/` Directory

The `components/` folder is organized into three main subfolders to promote code reusability and better organization.

#### 🧩 `elements/` – Small, Reusable UI Elements

Contains **generic**, low-level UI components that can be used across multiple features. These components are simple and don't contain any business logic. Examples include:

- `breadcrumb/` – A component for showing the page hierarchy.
- `buttons/` – Reusable button components with different styles.
- `loading/` – Components for showing loading states.
- `modal/` – A reusable modal dialog component.

#### 🔧 `features/` – Feature-Specific Components

This folder contains components that belong to specific application features and are used across multiple pages. They are more **complex** and include business logic or interact with backend data. Examples include:

- `calendar/` – The main calendar view.
- `classDetail/` – Displays detailed information about a class.
- `classesTable/` – A table for displaying and managing classes.

#### 🏗️ `layout/` – Layout & Navigation Components

This folder holds structural components that define the layout and navigation of the application. These include global elements used across the app, like side navigation bars. Examples:

- `sideNav/` – A sidebar navigation menu for the app.

---

### ✅ Example of the Folder Structure

```plaintext
components/
  elements/
    breadcrumb/
    buttons/
    loading/
    modal/
  features/
    calendar/
    classDetail/
    classesTable/
  layout/
    sideNav/
```

### 🛠️ `helper/` Directory

The `helper/` folder contains utility files and logic that assist with various aspects of the application, but aren't directly tied to the UI or core features. It's organized into three subfolders: `api/`, `data/`, and `utils`.

#### 🌐 `api/` – API Interaction Helpers

This folder contains functions that handle interactions with the backend controllers. These are typically service-like functions that facilitate communication between the frontend and the backend by calling specific controller actions.

- `adminsApi.ts` – Functions related to API calls for admin data, interacting with backend controllers.
- `customersApi.ts` – Functions related to API calls for customer data, interacting with backend controllers.

#### 🧮 `data/` – Static or Predefined Data

Contains files with static or predefined data that might be used throughout the application. These files store **non-dynamic data** like navigation links or fixed configurations.

- `data.ts` – Contains any general or shared data used across the app.
- `navLinks.ts` – Defines the navigation links structure for the app, used in the sidebar.

#### 🛠️ `utils/` – Utility Functions

This folder holds general utility functions that perform tasks like data formatting or other common operations. These functions are **reusable** across different parts of the application.

- `authenticationUtils.ts` – Functions for authentication-related tasks like password validation, token verification, etc.
- `dateUtils.ts` – Functions for working with dates, such as formatting, parsing, or manipulating date objects.

---

### ✅ Example of the Folder Structure

```plaintext
helper/
  api/
    adminsApi.ts
    customersApi.ts
  data/
    data.ts
    navLinks.ts
  utils/
    authenticationUtils.ts
    dateUtils.ts
```
