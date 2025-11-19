# Management Consultant CRM System

## Overview

This is a customer relationship management (CRM) system designed specifically for management consultants (中小企業診断士) in Japan. The application enables consultants to manage client information, track engagement history through "kartes" (medical record-style business consultations), maintain work logs, and export data for analysis. The system emphasizes efficiency, data density, and professional trustworthiness appropriate for Japanese business consulting contexts.

## Recent Changes

**November 19, 2025**
- Implemented visit reminder feature with next visit date tracking
  - Added `nextVisitDate` field to kartes schema for tracking upcoming visits
  - Integrated next visit date input in karte creation/edit forms with calendar picker
  - Enhanced dashboard API to fetch reminders based on future visit dates only
  - Backend logic filters out past dates, selects earliest visit per office, sorts globally, and returns top 10
  - Dashboard displays both next visit date and next action for each reminder
  - User feedback: Feature working well and highly appreciated
- Implemented health snapshot detail page functionality
  - Created dedicated detail page at `/health-snapshot` accessible via "すべて表示" button on home dashboard
  - Comprehensive statistics display: total offices, healthy, warning, critical, and unknown counts
  - Status filtering with tabs: all, healthy, warning, critical, unknown
  - Full office list with engagement type, last visit date, and days since visit
  - Correct navigation to office detail page (`/office/:officeId/detail`)
  - SEO metadata (title and meta description) for improved discoverability
  - Dark mode support with appropriate color variants for all badges and status indicators
  - Comprehensive data-testid attributes for automated testing
- Created shared health status badge utility function
  - Added `getHealthStatusInfo` helper in `client/src/lib/utils.ts`
  - Returns label and dark-mode-aware className for health status badges
  - Shared between home.tsx and health-snapshot.tsx to reduce code duplication
  - Consistent badge styling: green (healthy), yellow (warning), red (critical)
- Implemented visit reminders detail page functionality
  - Created dedicated detail page at `/visit-reminders` accessible via "すべて表示" button in visit reminders card
  - Displays all upcoming visit reminders without the 10-item limit
  - API enhanced with `?all=true` query parameter for full list retrieval
  - Urgency-based badge color coding: red (overdue), orange (today), yellow (within 3 days), blue (within 7 days), gray (later)
  - Each reminder displays office name, karte title, next visit date, urgency badge, and next action
  - Click-through navigation to karte edit page (`/office/:officeId/karte/:karteId`)
  - SEO metadata with Open Graph tags for social media sharing
  - Dark mode support with appropriate color variants
  - Comprehensive data-testid attributes for automated testing
  - User feedback: Consistent "すべて表示" pattern appreciated for both health snapshot and visit reminders

**October 9, 2025**
- Completed CSV export functionality with field selection and search filtering
- Implemented worklog (業務日誌) feature with date-based filtering and CRUD operations
- Added individual resource fetch endpoints for Person and Karte entities
- Enhanced apiRequest helper to return parsed JSON directly for improved error handling
- Fixed CSV export to properly emit headers even for empty result sets
- Fixed Neon Serverless WebSocket configuration to enable database connectivity
- Implemented office code input validation: numeric-only, maximum 5 digits with real-time filtering
- Added "その他" (Other) option to company type selection
- Extended phone numbers from 1 to 5 fields (電話番号1〜5) with note fields for department/purpose
  - Note: Phone note fields are not included in CSV export as requested
- Updated 経営カルテ page to use registered offices instead of demo data
  - Office selection now pulls from actual registered offices via API
  - Karte history displays actual records for selected office
  - Created kartes are properly saved and linked to selected office
- Implemented hierarchical guidance classification system for kartes (指導分類)
  - Parsed CSV master data (11 guidance items, 65 categories, 324 contents) to JSON format
  - Added 3 new fields to kartes table: guidanceItem, guidanceCategory, guidanceContent
  - Implemented cascading selection UI: 指導事項 → 指導内容区分 → 指導内容
  - Fixed critical bug: preserved saved guidance values during karte edit operations
  - Uses useRef to track value changes and prevent unwanted resets on form.reset()
- Integrated kartes display in worklog page based on selected date
  - Added API endpoint GET /api/kartes?date={date} to fetch kartes by visit date
  - Worklog page displays kartes summary at the bottom when kartes exist for selected date
  - Each karte shows title, office name, content preview, and visit date
  - Clicking a karte navigates to the karte edit page for detailed view/editing

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
   - Hierarchical guidance classification system (指導分類):
     - 11 guidance items (指導事項): 経営革新, 経営一般, 情報化, 金融, 税務, 労働, 取引, 環境対策, 事業承継, 事業廃止, その他
     - 65 guidance categories (指導内容区分) filtered by selected item
     - 324 guidance contents (指導内容) filtered by selected category
     - Cascading selection UI preserves values during edit operations

5. **Worklog (業務日誌)**
   - Daily activity logs with date-based filtering
   - Time tracking (start time, end time, hours)
   - Office association for work records
   - Create, edit, and delete worklog entries
   - Integrated karte display: shows kartes for the selected date below worklog entries
   - Quick navigation to karte details from worklog page

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