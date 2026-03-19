# Management Consultant CRM System

## Overview

This CRM system is designed for management consultants (中小企業診断士) in Japan. It facilitates client information management, tracks engagement history via "kartes" (business consultation records), maintains work logs, and enables data export for analysis. The system prioritizes efficiency, data density, and professional trustworthiness to align with Japanese business consulting standards. It also includes features for managing subsidy programs, tracking visit reminders, and providing health snapshots of client engagements.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

*   **Framework & Build Tool:** React 18 with TypeScript and Vite. Wouter for lightweight routing.
*   **UI Component System:** Shadcn/ui (New York style) built on Radix UI primitives, Tailwind CSS for styling, and Noto Sans JP for Japanese character support.
*   **State Management & Data Fetching:** TanStack Query (React Query) v5 for server state management and caching. React Hook Form with Zod for type-safe form validation.
*   **Design System Decisions:** Custom professional blue color palette, light mode primary with dark mode support, information-dense layouts, and consistent spacing.

### Backend Architecture

*   **Server Framework:** Express.js with TypeScript for REST API endpoints. Session-based authentication using `express-session` with a PostgreSQL session store.
*   **API Design Pattern:** RESTful API with resource-based routing, consistent error handling, request logging, and authentication middleware.
*   **Database Layer:** Drizzle ORM for type-safe queries and schema management. An `IStorage` interface abstracts database implementation.
*   **Core Functionality:**
    *   **Authentication:** Replit Auth (OIDC) integration, session-based authentication with PostgreSQL persistence, automatic user profile synchronization.
    *   **Office Management:** CRUD operations for client offices, advanced search, detailed corporate and contact information, support for various engagement types.
    *   **Person Management:** Management of individual contacts within offices, extensive contact methods, linked to offices.
    *   **Karte System:** Medical chart-style business consultation records, including visit dates, titles, content, next actions, and a hierarchical guidance classification system with cascading selection UI.
    *   **Worklog:** Daily activity logs with date-based filtering, time tracking, office association, CRUD operations, and integrated karte display.
    *   **CSV Export:** Export office data with selected fields and search filters, Excel-compatible UTF-8 encoding.
    *   **Subsidy Program Management:** Comprehensive management of subsidy programs, including status tracking, multi-URL support, and linkage to offices.
    *   **Visit Reminders:** Tracks upcoming visits with a dashboard and a detailed view, urgency-based color coding.
    *   **Health Snapshot:** Provides an overview of client engagement health (healthy, warning, critical) with detailed statistics and filtering.
    *   **Invoice Management:** Complete invoice creation system with Invoice制度対応 (Japanese qualified invoice system compliance), 10%/8% tax rate support, auto-numbering (INV-YYYYMM-####), payment tracking (消込) with auto-status updates, Gmail integration for sending invoices, print view with @media print CSS for A4 output, and PDF download (jsPDF). Note: Print view fully supports Japanese text; PDF uses basic fonts and is best for simple layouts.
    *   **Company Settings:** User-specific business information including invoice registration number (T+13 digits), bank account details for invoices, and default payment terms.
    *   **Industry Classification (日本標準産業分類):** Cascading 3-level dropdown (大分類 A-T → 中分類 99 items → 小分類 ~530 items) based on 日本標準産業分類第4版. Static data embedded in `client/src/lib/industry-classifications.ts`. Displayed in office detail as breadcrumb-style label.
    *   **URL Scraping:** `POST /api/offices/scrape-url` endpoint uses cheerio to extract company name, address, phone numbers, email, and suggested industry classification from a website URL. "URLから情報取得" button in the office form auto-fills fields.

### Database Schema

*   **Core Tables:** `users`, `offices`, `persons`, `kartes`, `worklogs`, `sessions`, `company_settings`, `invoices`, `invoice_items`, `payments`.
*   **Industry Classification:** `offices` table includes `industry_category_major` (大分類, A-T), `industry_category_middle` (中分類, 2-digit), `industry_category_minor` (小分類, 3-digit) for 日本標準産業分類第4版 support.
*   **Schema Design:** UUID primary keys, `createdAt`/`updatedAt` timestamps, normalized data structures with foreign key relationships, flexible text fields for Japanese content, Drizzle-Zod integration for schema validation.

### Authentication & Authorization

*   **Replit Auth Integration:** OpenID Connect (OIDC) via Replit's identity provider, Passport.js strategy, and PostgreSQL-backed session management.
*   **Session Management:** 7-day session TTL with secure, httpOnly cookies, `connect-pg-simple` for session storage, automatic user upsert.

## External Dependencies

*   **Database:** Neon Serverless PostgreSQL (`@neondatabase/serverless`) for primary data storage.
*   **Authentication Service:** Replit OIDC provider.
*   **UI Component Libraries:** Radix UI, Lucide React for iconography, `date-fns` for date manipulation, `class-variance-authority` (CVA) for component variants.