# Design Guidelines: Management Consultant CRM System

## Design Approach
**Selected Approach**: Design System - Material Design with Japanese Business Adaptation
**Justification**: This is a data-intensive enterprise application requiring clear information hierarchy, extensive form handling, and professional credibility. Material Design provides robust patterns for complex data entry while maintaining accessibility and user efficiency.

## Core Design Principles
- **Clarity over decoration**: Prioritize information density and scanability
- **Efficiency first**: Minimize clicks and cognitive load for frequent tasks
- **Professional trustworthiness**: Convey reliability appropriate for business consulting context
- **Japanese business standards**: Respect local conventions for enterprise applications

## Color Palette

**Light Mode** (Primary):
- Primary: 211 100% 35% (Deep professional blue)
- Secondary: 211 30% 25% (Muted slate for secondary actions)
- Surface: 0 0% 98% (Near white backgrounds)
- Background: 0 0% 95% (Page background)
- Border: 0 0% 88% (Subtle separators)
- Success: 142 70% 40%
- Warning: 38 92% 50%
- Error: 0 70% 50%

**Dark Mode** (Optional support):
- Primary: 211 100% 65%
- Surface: 220 15% 12%
- Background: 220 15% 8%

**Text Colors**:
- Primary text: 220 20% 15% (Near black)
- Secondary text: 220 10% 50% (Muted for labels)
- Disabled: 220 10% 70%

## Typography

**Font Families**:
- Primary: 'Noto Sans JP' (excellent Japanese character support)
- Monospace: 'Consolas', monospace (for codes and data)

**Scale**:
- Page Headers: text-2xl font-semibold (24px)
- Section Headers: text-lg font-medium (18px)
- Form Labels: text-sm font-medium (14px)
- Body Text: text-base (16px)
- Helper Text: text-sm text-secondary (14px)
- Data Values: text-base font-normal

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16 for consistent rhythm
- Component padding: p-4 to p-6
- Section spacing: space-y-6 to space-y-8
- Form field gaps: gap-4
- Card padding: p-6
- Page margins: px-6 py-8

**Container Widths**:
- Main content: max-w-7xl mx-auto
- Forms: max-w-4xl
- Search results: w-full
- Modals: max-w-2xl

**Grid System**:
- Form layouts: 2-column grid (grid-cols-2 gap-4)
- Search results: Single column list with hover states
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3

## Component Library

### Navigation
- **Top Navigation Bar**: Fixed header with logo, main menu items, user profile dropdown
- **Sidebar Navigation** (for main sections): Collapsible left sidebar with icons + text labels, active state highlighting
- **Breadcrumbs**: Display current location hierarchy, clickable path

### Forms & Data Entry
- **Input Fields**: Clear labels above inputs, helper text below, consistent border-radius-md, focus ring with primary color
- **Tabbed Sections**: Material-style tabs with underline indicator for Office Info sections (事業所情報, 個人情報, 指導履歴)
- **Select Dropdowns**: Native-styled selects with chevron icon, grouped options where applicable
- **Date Pickers**: Calendar popup with Japanese date format
- **Text Areas**: Auto-expanding for free-text fields like 離脱理由詳細
- **Radio Groups**: Vertical stacked for enterprise classifications (小規模事業者, 中小企業, etc.)
- **Checkboxes**: For CSV column selection with "Select All/Deselect All" buttons

### Data Display
- **Data Tables**: Striped rows, hover highlighting, sortable column headers, sticky header on scroll
- **Cards**: Subtle shadow (shadow-sm), rounded corners (rounded-lg), white background
- **Search Results List**: Compact rows showing 事業所コード, 事業所名, 業種, 関与区分, 代表者名 with click-to-view detail
- **Status Badges**: Pill-shaped badges for 関与区分 with color coding (関与先=green, 離脱=gray, etc.)

### Actions
- **Primary Buttons**: Filled with primary color, medium size (px-6 py-2.5)
- **Secondary Buttons**: Outlined with primary color border
- **Icon Buttons**: For edit, delete, export actions (size-10 with icon)
- **Button Groups**: Connected for related actions (保存/キャンセル)

### Feedback & Overlays
- **Audit Trail Display**: Timeline-style list showing user, action, timestamp
- **Confirmation Dialogs**: Centered modal with overlay backdrop for destructive actions
- **Toast Notifications**: Top-right positioned for success/error messages
- **Loading States**: Subtle spinner for async operations, skeleton screens for data loading

### Dashboard Components
- **Information Cards**: Recent activities, quick stats, important notices
- **Quick Action Panel**: Frequently used functions (新規登録, 検索, CSV出力)

## Accessibility & Standards
- Maintain WCAG AA contrast ratios (4.5:1 for normal text)
- Consistent focus indicators (2px ring with offset)
- All interactive elements minimum 44px touch target
- Dark mode toggle in user settings (if implemented)
- Keyboard navigation support throughout

## Images & Assets
**Icons**: Use Material Icons (via CDN) for consistency - file, person, business, search, download, edit, delete, calendar, check_circle
**No Hero Image**: This is a utility application - login page uses simple centered form with company logo

## Animations
**Minimal & Purposeful**:
- Tab transitions: Simple fade (150ms)
- Dropdown open/close: Scale-y transform (200ms ease-out)
- Toast notifications: Slide-in from right (300ms)
- NO decorative animations - focus on instant responsiveness