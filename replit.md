# Management Consultant CRM System

## Overview

This is a customer relationship management (CRM) system designed specifically for management consultants (中小企業診断士) in Japan. The application enables consultants to manage client information, track engagement history through "kartes" (medical record-style business consultations), maintain work logs, and export data for analysis. The system emphasizes efficiency, data density, and professional trustworthiness appropriate for Japanese business consulting contexts.

## Recent Changes

**October 9, 2025**
- Completed CSV export functionality with field selection and search filtering
- Implemented worklog (業務日誌) feature with date-based filtering and CRUD operations
- Added individual resource fetch endpoints for Person and Karte entities
- Enhanced apiRequest helper to return parsed JSON directly for improved error handling
- Fixed CSV export to properly emit headers even for empty result sets

## User Preferences

Preferred communication style: Simple, everyday language.

## Implemented Features

### Core Functionality
1. **Authentication**
   - Replit Auth (OIDC) integration for secure user authentication
   - Session-based authentication with PostgreSQL persistence
   - Automatic user profile synchronization

2. **Office Management (事業所管理)**
   - Create, read, update, delete office records
   - Advanced search with multiple filter criteria (code, name, representative)
   - Detailed office information including corporate data, contact info, industry classification
   - Support for engagement types (関与先, 旧関与先, セミナー系関与先, etc.)

3. **Person Management (個人情報管理)**
   - Manage individual contacts within offices
   - Extensive contact methods (phone, mobile, multiple emails, SNS)
   - Link persons to their respective offices

4. **Karte System (経営カルテ)**
   - Medical chart-style business consultation records
   - Track visit dates, titles, content, and next actions
   - Historical record of all consultations per office

5. **Worklog (業務日誌)**
   - Daily activity logs with date-based filtering
   - Time tracking (start time, end time, hours)
   - Office association for work records
   - Create, edit, and delete worklog entries

6. **CSV Export (CSV出力)**
   - Export office data with current search filters applied
   - Select from 30 available fields for export
   - Proper CSV formatting with Japanese headers
   - Excel-compatible UTF-8 encoding with BOM

### Technical Features
- Responsive design with Japanese language support
- Real-time data synchronization with React Query
- Type-safe forms with Zod validation
- Hierarchical query key structure for efficient cache invalidation
- Professional UI with Shadcn/ui components

## System Architecture

### Frontend Architecture

**Framework & Build Tool**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast hot module replacement
- Wouter for lightweight client-side routing instead of React Router

**UI Component System**
- Shadcn/ui components (New York style variant) built on Radix UI primitives
- Material Design principles adapted for Japanese business standards
- Tailwind CSS for utility-first styling with extensive custom design tokens
- Noto Sans JP font family for excellent Japanese character support

**State Management & Data Fetching**
- TanStack Query (React Query) v5 for server state management, caching, and data synchronization
- React Hook Form with Zod for type-safe form validation
- No global state management library - relies on React Query cache and local component state

**Design System Decisions**
- Custom color palette emphasizing professional blue (HSL 211 100% 35%) for trust and credibility
- Light mode primary with optional dark mode support
- Information-dense layouts prioritizing clarity over decoration
- Consistent spacing and elevation system using CSS custom properties for hover/active states

### Backend Architecture

**Server Framework**
- Express.js with TypeScript for REST API endpoints
- Session-based authentication using express-session with PostgreSQL session store
- Modular route registration pattern separating auth, office, person, karte, and worklog endpoints

**API Design Pattern**
- RESTful API structure with resource-based routing (/api/offices, /api/persons, /api/kartes, /api/worklogs)
- Consistent error handling middleware with status code normalization
- Request logging middleware capturing method, path, status, duration, and response preview
- Authentication middleware (isAuthenticated) protecting all data endpoints

**Database Layer**
- Drizzle ORM for type-safe database queries and schema management
- Storage abstraction layer (IStorage interface) separating business logic from database implementation
- Support for complex queries including search filters, office-person relationships, and date-based worklog retrieval

### Database Schema

**Core Tables**
- `users` - User authentication and profile data (Replit Auth integration)
- `offices` - Client company information including corporate details, contact info, industry classification
- `persons` - Individual contacts within offices with extensive contact methods (phone, mobile, multiple emails, SNS)
- `kartes` - Consultation records linking to offices with visit dates, titles, content, and next actions
- `worklogs` - Daily activity logs with time tracking and office relationships
- `sessions` - PostgreSQL-backed session storage for authentication

**Schema Design Patterns**
- UUID primary keys using PostgreSQL's gen_random_uuid()
- Timestamp tracking (createdAt, updatedAt) on core entities
- Normalized data structure with foreign key relationships (officeId references)
- Flexible text fields using varchar for Japanese content
- Drizzle-Zod integration for automatic schema validation

### Authentication & Authorization

**Replit Auth Integration**
- OpenID Connect (OIDC) based authentication via Replit's identity provider
- Passport.js strategy for OAuth flow handling
- Session management with PostgreSQL persistence for scalability
- User profile synchronization (email, name, profile image) from OIDC claims

**Session Management**
- 7-day session TTL with secure, httpOnly cookies
- Connect-pg-simple for PostgreSQL session storage
- Automatic user upsert on successful authentication
- Session secret from environment variables for security

### External Dependencies

**Database**
- Neon Serverless PostgreSQL as the primary database (via @neondatabase/serverless)
- Connection string provided via DATABASE_URL environment variable
- Drizzle Kit for schema migrations and database push operations

**Authentication Service**
- Replit OIDC provider (configurable via ISSUER_URL environment variable)
- Client credentials (REPL_ID) for OAuth application identification
- Session secret management via SESSION_SECRET environment variable

**Development Tools**
- Replit-specific Vite plugins for runtime error overlays, cartographer, and dev banner
- ESBuild for server-side code bundling in production
- TypeScript compiler for type checking (noEmit mode)

**UI Component Libraries**
- Radix UI component primitives (dialog, dropdown, popover, select, etc.)
- Lucide React for consistent iconography
- date-fns for date formatting and manipulation
- class-variance-authority (CVA) for component variant management

**Development Environment Detection**
- REPL_ID and REPLIT_DOMAINS environment variables for Replit-specific features
- NODE_ENV for environment-specific configuration (development vs production)
- Conditional plugin loading based on environment