# CLAUDE.md

This file provides guidance to Claude when working with code in this repository.

## About AaasoBo!

AaasoBo! is an online English conversation service run by a Japanese NPO that targets children worldwide. The name means "let's have fun" in Japanese, reflecting the core philosophy of learning English through enjoyable experiences rather than traditional teaching methods.

## Business Context

### User Types
- **Customers**: Guardians who subscribe to the service
- **Instructors**: Teachers who conduct classes
- **Admins**: AaasoBo! staff who manage operations and analytics

### Key Workflows
- Customers: Create account → Subscribe → Register weekly classes → Attend sessions
- Instructors: Create account → Admin sets schedule → Conduct booked sessions

## Development Commands

### Backend
- **Setup**: `cd backend && npm install`
- **Development**: `npm run dev` (starts with nodemon and ts-node)
- **Database**:
  - Start PostgreSQL: `npm run db:start` (Docker container)
  - Initialize/Reset DB: `npm run prisma:init` (runs migrations + bootstrap)
  - Apply migrations: `npm run db:migrate` (production-safe migration deploy)
  - Bootstrap required data: `npm run db:bootstrap` (idempotent, production-safe seed)
  - Insert dummy data: `npm run seed:dummy` (manual local/demo seed)
- **Testing**: `npm run test` (Vitest)
- **Unused Code Check**: `npm run lint:unused`
- **Formatting**: `npm run format` (Prettier + Prisma format)
- **Build**: `npm run build` (installs shared dependencies, generates Prisma client, applies migrations, and bootstraps required data)

### Frontend
- **Setup**: `cd frontend && npm install`
- **Development**: `npm run dev` (Next.js dev server)
- **Build**: `npm run build`
- **Linting**: `npm run lint`
- **Unused Code Check**: `npm run lint:unused`
- **Formatting**: `npm run format`

## Architecture Overview

Full-stack class management system with separate backend and frontend applications.

### Backend
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens
- **Structure**: Routes → Controllers → Services

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **Styling**: SCSS modules
- **Authentication**: NextAuth.js
- **Structure**: Component-based with clear separation
  - `app/components/elements/`: Reusable UI components
  - `app/components/features/`: Business-specific components
  - `app/components/layouts/`: Layout and navigation components

## Development Guidelines

### Branch Strategy
- Use `develop` as the base branch for all new pull requests.
- Open and merge pull requests into `develop` (not `main`).
- `main` is a release branch: only merge `develop` into `main` via pull request.

### Code Quality
- Always run `npm run format` before committing changes
- Run `npm run lint` on frontend for code quality checks
- Run `npm run lint:unused` to detect dead code and unused exports in both backend and frontend
- Keep code self-explanatory and avoid unnecessary comments
- Run tests and builds before committing
