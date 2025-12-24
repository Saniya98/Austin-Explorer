# Overview

This is a family-friendly place discovery application that helps users find kid-friendly locations (playgrounds, parks, museums, galleries, science centers, planetariums) in their area using an interactive map interface. Users can search for places via OpenStreetMap's Overpass API, save their favorite locations, and mark places as visited.

The application follows a full-stack TypeScript architecture with React frontend and Express backend, using PostgreSQL for data persistence and Replit Auth for user authentication.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state caching and synchronization
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Mapping**: Leaflet with react-leaflet bindings for interactive maps
- **Build Tool**: Vite with custom plugins for Replit integration

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod schemas for validation
- **Authentication**: Replit Auth integration using OpenID Connect (OIDC) with Passport.js
- **Session Management**: PostgreSQL-backed sessions via `connect-pg-simple`

## Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Schema Location**: `shared/schema.ts` contains all database table definitions
- **Migrations**: Managed via `drizzle-kit push` command

## Key Design Patterns
- **Shared Types**: The `shared/` directory contains schemas and route definitions used by both frontend and backend, ensuring type safety across the stack
- **Storage Interface**: `server/storage.ts` implements an `IStorage` interface pattern for database operations, making it easier to swap implementations
- **Auth Isolation**: Authentication logic is isolated in `server/replit_integrations/auth/` for clean separation

## Build System
- **Development**: Vite dev server with HMR for frontend, tsx for backend
- **Production**: esbuild bundles the server with selective dependency bundling to optimize cold start times

# External Dependencies

## Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Tables**: `users`, `sessions` (for auth), `saved_places` (for user bookmarks)

## Authentication
- **Replit Auth**: OIDC-based authentication using Replit's identity provider
- **Required Environment Variables**: `ISSUER_URL`, `REPL_ID`, `SESSION_SECRET`, `DATABASE_URL`

## External APIs
- **OpenStreetMap Overpass API**: Used to search for points of interest (playgrounds, parks, museums, etc.) by category within a geographic bounding box

## Third-Party Libraries
- **Mapping**: Leaflet for map rendering, react-leaflet for React integration
- **UI**: Radix UI primitives, shadcn/ui components, Framer Motion for animations
- **Validation**: Zod for runtime type checking and API schema validation
- **Forms**: react-hook-form with Zod resolver for form handling