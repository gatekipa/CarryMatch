# CarryMatch CML -- Full Audit Report

**Date:** 2026-04-06
**Scope:** PRD v2.0 (Phase 1 Launch Core) vs. current codebase
**HANDOFF.md:** Does not exist in the repo.

---

## A. PRD vs Build -- Gap Analysis

### 4.1 Vendor Onboarding & Access Control

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 4.1.1-1 | Sign Up (email + password) | ✅ DONE | `SignUpPage.jsx` -- stores preferred_language in user metadata |
| 4.1.1-2 | Application Form (all fields) | 🟡 PARTIAL | `PartnerApplicationPage.jsx` -- has name, company, phone, WhatsApp, business type, volume, corridors, addresses, notes. **Missing:** business registration number, social media links, references, "How did you hear about us?" |
| 4.1.1-3 | Pending Review state | ✅ DONE | `ApplicationStatusPage.jsx` shows pending status |
| 4.1.1-4 | Admin Review (approve/reject/request info) | ❌ NOT BUILT | No admin panel exists. Admin actions must be done directly in the database |
| 4.1.1-5 | Approval triggers (WhatsApp + email welcome) | ❌ NOT BUILT | No WhatsApp/email sending implemented. Notification records are created in DB via trigger but never dispatched |
| 4.1.1-6 | Initial Setup Wizard | 🟡 PARTIAL | `SetupWizardPage.jsx` -- has prefix, origin, destinations, pricing model, insurance model, plan tier. **Missing:** company logo upload, coupon code entry |
| 4.1.2 | Access Control (9 states) | 🟡 PARTIAL | `cmlAccessState.js` implements 7 states: PUBLIC, NO_VENDOR_RECORD, APPLICATION_PENDING, APPLICATION_REJECTED, SETUP_REQUIRED, ACTIVE_VENDOR, SUSPENDED_VENDOR. **Missing:** subscription-expired (grace period), subscription-expired (past grace). No subscription enforcement exists at all |
| 4.1.3 | Vendor Pricing Model Config | ✅ DONE | per_kg, flat_fee, manual models with CHECK constraints in DB |

### 4.2 Vendor Dashboard

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| KPI Cards (P0) | Today's cut-offs, active batches, in transit, delivered, revenue | ❌ NOT BUILT | Dashboard is purely navigational links -- no live metrics or KPI cards |
| Branch + Mode Filters (P1) | Filter data by branch and shipping mode | ❌ NOT BUILT | |
| Quick Actions Grid (P0) | One-tap access to core features | 🟡 PARTIAL | Links to New Shipment, Scan, Batches, Settings, Notifications exist. **Missing:** View Shipments list, Payments, Closeout, Reports, Issues, Claims, Staff quick-action cards |
| Customize Layout (P2) | Rearrange/hide widgets | ❌ NOT BUILT | |

### 4.3 Customer Lookup & CRM

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| Phone-first lookup (P0) | Type phone, pull customer record | ✅ DONE | `NewShipmentIntakePage.jsx` -- looks up vendor_customers by phone |
| Frequent receivers (P0) | Show past receivers, one-tap select | ❌ NOT BUILT | No receiver history shown during intake |
| Customer history (P0) | View all past shipments for a sender | ❌ NOT BUILT | No customer detail/history page exists |
| Quick re-ship (P1) | Copy past shipment details | ❌ NOT BUILT | |
| Customer notes (P1) | Private notes per customer | ❌ NOT BUILT | |
| Contact import (P2) | CSV / phone contacts bulk import | ❌ NOT BUILT | |

### 4.4 Quick Intake Form

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| Step 1: Origin & Destination | Country/city/shipping mode | ✅ DONE | Destination branch select auto-fills country/city. Shipping mode selector present |
| Step 2: Sender Details | Phone lookup, name, WhatsApp, email, country, city | 🟡 PARTIAL | Phone + name + WhatsApp present. **Missing:** sender email, sender country, sender city fields |
| Step 3: Receiver Details | Same as sender + frequent receivers | 🟡 PARTIAL | Phone + name + WhatsApp present. **Missing:** receiver email, country, city as explicit fields (destination branch provides this). No frequent-receivers list |
| Step 4: Parcel Details | Description, weight, qty, category, dimensions, photos | 🟡 PARTIAL | Description, weight, qty, category present. **Missing:** dimensions (L/W/H), volumetric weight calc, chargeable weight calc, estimated value, special handling, fragile toggle, hazmat toggle, reference number, photo upload |
| Step 5: Pricing & Insurance | Base price, fees, insurance, total, payment | 🟡 PARTIAL | Base price (auto-calc), discount, total, payment status present. **Missing:** additional fees (repeatable label+amount array), insurance toggle, declared value, insurance premium calc, insurance fields entirely absent from intake |
| Step 6: Confirm & Create | Summary + create + post-actions | 🟡 PARTIAL | Creates shipment, generates tracking number, shows success card with label print. **Missing:** full summary preview before creation, WhatsApp confirmations not actually sent |
| 4.4.7 Shipping Labels (PRO) | QR + barcode label generation | 🟡 PARTIAL | `shippingLabel.js` generates PDF with QR code and all required fields. **Missing:** barcode (Code 128), batch print, 4-per-A4 layout, PRO gating (available to all users), vendor logo on label |
| 4.4.8 Self-Service Tracking Page | Public page via QR/URL | ✅ DONE | `PublicTrackingPage.jsx` -- shows status, timeline, ETA, vendor name, destination branch, route info. Fully i18n'd |

### 4.5 Batch Management

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| Create Batch (P0) | Group shipments into batch | ✅ DONE | `BatchDetailPage.jsx` -- create with name + ETA |
| Add/Remove from Batch (P0) | Select shipments to add/remove | ✅ DONE | Assignment panel on batch detail; also from shipment detail |
| Lock Batch (P0) | Freeze batch | ✅ DONE | Status transition open -> locked enforced |
| Ship Batch (P0) | Mark shipped, set departure, trigger notifications | 🟡 PARTIAL | Status transition locked -> shipped works; linked shipments move to in_transit. **Missing:** departure date field, WhatsApp notifications not dispatched |
| Batch Arrival (P0) | Mark arrived, trigger pickup notifications | 🟡 PARTIAL | Arrived status works. **Missing:** pickup office selection form (per PRD 4.5.2), WhatsApp notifications not dispatched |
| Batch ETA (P0) | Vendor enters ETA | ✅ DONE | ETA field on batch, propagated to shipment history |
| Batch Manifest (P1) | Printable item list | ❌ NOT BUILT | |
| Batch Collection Status (P0) | Real-time collected vs pending view | 🟡 PARTIAL | Collection marking works from batch detail. **Missing:** collection rate bar, "Send Reminder" button, days-since-arrival, export list |

**4.5.1 Branch Model**

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| Multiple branches per vendor | ✅ DONE | `BranchManagementPage.jsx` + `vendor_branches` table |
| Branch fields (name, side, address, etc.) | 🟡 PARTIAL | Has name, side (origin/destination), address, country, city. **Missing:** location link (Google Maps URL), phone, WhatsApp, opening hours, manager reference, required ID for pickup, special instructions |
| Dual-side management | ❌ NOT BUILT | Only vendor owner has RLS access; no staff access. No origin vs destination staff separation |

**4.5.2 Destination Arrival & Pickup Flow**

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| Batch Arrived form (pickup office, hours, ID) | ❌ NOT BUILT | Arrival is a simple status change, no pickup detail form |
| Pickup notifications to receivers | ❌ NOT BUILT | Notification records created in DB but never dispatched via WhatsApp |
| Collection process (search, verify, mark collected) | 🟡 PARTIAL | Mark-collected works from batch detail and scan page. **Missing:** receiver ID verification, collector name, photo of handover |
| Smart Pickup Reminders | ❌ NOT BUILT | No reminder scheduling system |

**4.5.3 Batch Collection Dashboard**

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| Collection stats (total, collected, pending, rate) | ❌ NOT BUILT | No dedicated collection dashboard view |
| Send Reminder button | ❌ NOT BUILT | |
| Export uncollected list | ❌ NOT BUILT | |

### 4.6 WhatsApp Notifications

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 9 automated triggers | 🟡 PARTIAL | DB trigger (`handle_vendor_shipment_notification_events`) creates notification records for shipment status changes. Maps to 8 event types. **BUT: No actual WhatsApp sending.** Meta Cloud API is not integrated. Records sit in `vendor_notifications` with `delivery_status = 'recorded'` forever |
| Notification settings (toggle, channel, templates) | 🟡 PARTIAL | `NotificationSettingsPage.jsx` has enabled toggle + default channel. **Missing:** customizable message templates, WhatsApp Business number config |
| Notification log | ✅ DONE | `NotificationLogPage.jsx` shows all notification records with status |
| Email fallback | ❌ NOT BUILT | |
| Template customization | ❌ NOT BUILT | |

### 4.7 Additional Features

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| Scan & Update (P0) | QR/barcode scan to update status | 🟡 PARTIAL | `ScanUpdatePage.jsx` has manual tracking lookup + QR scanner via BarcodeDetector API. Quick-collect action for ready shipments. **Missing:** barcode scanning (Code 128), full status update (only collection action available) |
| View Shipments (P0) | List with search/filters | 🟡 PARTIAL | `ShipmentDetailPage.jsx` exists for individual shipment view. **Missing:** dedicated shipment list page with search, filters (status/date/batch/corridor/mode) |
| Shipping Labels (P0) | Print labels with QR + barcode | 🟡 PARTIAL | Single-label PDF generation works. **Missing:** barcode, batch print, PRO gating |
| Payments Tracking (P0) | Record payments, filter paid/unpaid | 🟡 PARTIAL | Payment recording on `ShipmentDetailPage.jsx` works (amount, method, note). **Missing:** dedicated payments view, paid/unpaid filtering, payment history |
| Closeout / End of Day (P1) | Daily reconciliation | ❌ NOT BUILT | |
| Reports & Analytics (P1) | Revenue, shipments, customers, etc. | ❌ NOT BUILT | |
| Issues Management (P1) | Flag problem shipments | ❌ NOT BUILT | |
| Claims / Insurance (P1) | Insurance claims processing | ❌ NOT BUILT | |
| Staff Management (P0) | Add staff with roles | ❌ NOT BUILT | `vendor_staff` table exists but no UI for managing staff. RLS only allows owner access -- staff members cannot access data |
| Vendor Settings (P0) | Profile, origin, pricing, branches | ✅ DONE | `VendorSettingsPage.jsx` + `BranchManagementPage.jsx` cover core settings |
| Customer Management (P1) | Customer list with history | ❌ NOT BUILT | |

### 6. Subscription & Coupon System

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| Free vs Pro tier matrix | ❌ NOT BUILT | `plan_tier` field exists on vendor (free/pro) but **no enforcement** of tier limits anywhere (shipment count, staff count, label access, branch count, etc.) |
| Stripe integration | ❌ NOT BUILT | |
| Coupon code system | ❌ NOT BUILT | No coupon tables, no activation flow, no code generation |
| Grace period logic | ❌ NOT BUILT | |
| Renewal reminders | ❌ NOT BUILT | |

### 7.3 Bilingual (EN/FR i18n)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| i18n architecture | 🟡 PARTIAL | Custom context-based system in `i18n.jsx` (not react-i18next as PRD specifies). Inline dictionaries instead of separate JSON files |
| EN translations | ✅ DONE | All CML pages use `t()` function |
| FR translations | 🟡 PARTIAL | All keys have FR translations BUT many **lack proper French accented characters** (e.g., "Deconnexion" instead of correct accented form). ASCII approximations throughout |
| Language switcher | ✅ DONE | Toggle in header, persists to localStorage |
| Language detection | 🟡 PARTIAL | Defaults to EN. **Missing:** auto-detect from browser locale |
| Date/currency/number formatting | 🟡 PARTIAL | Uses `Intl.DateTimeFormat` and `Intl.NumberFormat` in some places. **Not consistently applied** across all pages |
| WhatsApp language logic | ❌ NOT BUILT | No per-recipient language preference system. No Francophone country code detection |
| Untranslated components | `ErrorBoundary.jsx` and `PageLoader.jsx` have hardcoded English strings |

### 7.6 Implementation Specs

| # | Spec | Status | Notes |
|---|------|--------|-------|
| 7.6.1 Tracking Number | ✅ DONE | Format `{PREFIX}-{YYMMDD}{RANDOM6}`, ambiguous chars excluded, collision retry (5 attempts), globally unique |
| 7.6.2 State Machine | 🟡 PARTIAL | Shipment statuses defined as CHECK constraint (12 values match PRD). Batch statuses have CHECK (8 values). **Missing:** valid-transition enforcement at DB level (only enforced in app code via `BATCH_STATUS_TRANSITIONS` map). No shipment-level transition map enforced |
| 7.6.3 Multi-Tenancy / Data Isolation | 🟡 PARTIAL | RLS enabled on all CML tables, vendor_id scoping via `owner_user_id = auth.uid()`. **Critical gap:** Only the vendor OWNER has RLS access. Staff/Admin roles in vendor_staff have zero DB-level access. Multi-user teams are broken |
| 7.6.4 Customer Record Scoping | ✅ DONE | `vendor_customers` has UNIQUE(vendor_id, phone). Same phone = separate records per vendor |
| 7.6.5 Phone Numbers E.164 | 🟡 PARTIAL | `PhoneNumberField` component stores E.164 via `libphonenumber-js`. **BUT:** no DB-level CHECK constraint on any phone column. Application-level only. If data enters via any other path (admin, migration, API), it won't be validated |
| 7.6.6 Photo Storage | ❌ NOT BUILT | No Supabase Storage bucket, no photo upload UI, no signed URLs |
| 7.6.7 Label Generation | 🟡 PARTIAL | Client-side PDF via jsPDF (not server-side Edge Function as PRD specifies). QR code present. **Missing:** barcode (Code 128), batch print, A4 layout, PRO branding logic |
| 7.6.8 Batch-Shipment Relationship | ✅ DONE | `shipment.batch_id` is source of truth. Batch detail rebuilds list from shipment query |
| 7.6.9 Insurance Logic | ❌ NOT BUILT | Insurance model fields exist on vendor but insurance is completely absent from intake form and shipment records |
| 7.6.10 Pricing in Cents | ❌ NOT DONE | All prices stored as `numeric(12,2)` (decimal dollars), **NOT integer cents** as PRD requires. Floating-point arithmetic used for money in JS |
| 7.6.11 Payment Recording | ✅ DONE | payment_status (paid/partial/unpaid), payment_method (6 options), amount_paid, payment_note, derived status calc |
| 7.6.12 Staff Permissions Matrix | ❌ NOT BUILT | No permission checks in UI or application layer. No role-based visibility. RLS only grants owner access |
| 7.6.13 Shipment Editing Rules | 🟡 PARTIAL | Status-based field locking not enforced in UI. All fields editable regardless of status. No edit audit log |
| 7.6.14 Notification Deduplication | ❌ NOT BUILT | No dedup logic. The notification trigger creates individual records per shipment |
| 7.6.15 Offline / PWA | 🟡 PARTIAL | Service worker registered, caches UI shell. manifest.json present. **But:** SW still references legacy base44 domain in API detection. Offline fallback is basic inline HTML |
| 7.6.16 Query Limits / Pagination | 🟡 PARTIAL | Some pages limit queries (notifications: 100). No systematic pagination on shipment or batch lists |
| 7.6.17 Coupon Code Edge Cases | ❌ NOT BUILT | No coupon system exists |

---

## B. UI/UX Assessment

### Page-by-Page Visual Polish Rating

| Page | Rating | Notes |
|------|--------|-------|
| LandingPage | 2/5 | Functional layout but developer-facing copy ("Phase 1 CML", "wires Supabase auth"). Not customer-ready |
| PricingPage | 3/5 | Clean two-column layout, i18n'd. Static, no interaction beyond navigation |
| SignUpPage | 3/5 | Clean card layout, proper validation. Standard shadcn/ui form |
| LoginPage | 3/5 | Same quality as signup. Functional |
| PartnerApplicationPage | 3/5 | Well-structured form with PhoneNumberField. Good validation UX |
| ApplicationStatusPage | 3/5 | Clear status display with appropriate styling per state |
| SetupWizardPage | 3/5 | Three-section layout works. Dynamic destination offices. Could use stepper UX |
| VendorDashboardPage | 2/5 | Just navigation links + debug info (access state, session email). No metrics. Developer-facing copy ("Intentional TODOs") |
| VendorSettingsPage | 3/5 | Functional form. Shows rate/fee fields even when irrelevant pricing model selected |
| NewShipmentIntakePage | 3/5 | Most complex page, well-organized sections. Success state is solid. Missing the 6-step wizard UX the PRD envisions |
| ShipmentDetailPage | 3/5 | Comprehensive detail view. Good contact cards, status timeline, payment form. Dense but functional |
| BatchListPage | 3/5 | Clean list with status badges. Summary stats at top |
| BatchDetailPage | 3/5 | Full batch management. Status transitions, shipment assignment, collection marking all work |
| PublicTrackingPage | 3/5 | Good public-facing page. Status timeline, ETA, vendor info. Clean and functional |
| NotificationLogPage | 2/5 | Basic table listing. No filtering, no pagination |
| NotificationSettingsPage | 2/5 | Toggle + dropdown only. Placeholder cards for Meta API config |
| ScanUpdatePage | 3/5 | QR scanner with camera preview. Manual lookup works. Quick collect is nice |
| BranchManagementPage | 3/5 | Dynamic branch list with add/remove. Clean |
| CmlAppShell (Header/Nav) | 2/5 | No mobile navigation (items hidden with no hamburger menu). Access state debug banner always shown |
| ErrorBoundary | 2/5 | Dark gradient style clashes with light app theme. Broken "Go Home" link (routes to `/Home` = 404) |
| PageLoader / QueryError | 2/5 | Dark theme components in a light-theme app. Hardcoded English |

### Top 10 UI Issues

1. **No mobile navigation.** Nav items are `hidden md:flex` with no hamburger/drawer menu. On mobile, users see only logo + language toggle + login. The app is unusable on mobile for authenticated vendors.

2. **Developer-facing copy throughout.** Landing page mentions "Phase 1 CML" and "Supabase auth". Dashboard says "Intentional TODOs" and shows access state/session email debug info. None of this is customer-ready.

3. **No KPI dashboard.** The vendor dashboard is just a list of links with no metrics, charts, or actionable data. A vendor cannot see their business at a glance.

4. **Inconsistent dark/light theme.** ErrorBoundary and QueryError use dark backgrounds (`#1a1a2e`, `bg-white/5`), while the rest of the app is light/slate. Dark mode CSS variables are defined in index.css but never activated.

5. **Intake form is a single long page, not a 6-step wizard.** PRD envisions a guided step-by-step intake experience. Current implementation is one scrollable form with sections. No progress indicator, no step navigation.

6. **No shipment list page.** Vendors have no way to browse/search/filter all their shipments. They can only access individual shipments via batch detail or scan lookup.

7. **Access state banner always visible.** Authenticated vendors see a debug banner showing their internal access state. This is developer info, not user-facing.

8. **Settings page shows irrelevant fields.** Rate-per-kg and flat-fee fields are always visible regardless of which pricing model is selected. Should conditionally show only relevant fields.

9. **French translations use ASCII instead of proper accents.** Throughout the FR translations, words that should have accented characters use plain ASCII equivalents. This looks unprofessional for French-speaking users.

10. **No loading skeletons or optimistic UI.** Pages show a spinner or "Loading..." text while data loads. No skeleton screens, no content placeholders, no progressive rendering. Feels generic rather than polished.

---

## C. Architecture Assessment

### i18n Setup

- **Library:** Custom React Context implementation (`src/lib/i18n.jsx`), NOT react-i18next as PRD specifies
- **Translation files:** No separate `en.json` / `fr.json` files. Both dictionaries are embedded inline in `i18n.jsx` (~1900+ lines)
- **Coverage:** ~95% of CML page strings are translated. Gaps: `ErrorBoundary.jsx` (hardcoded EN), `PageLoader.jsx` (hardcoded EN), `utils/index.ts` createPageUrl (hardcoded paths)
- **FR quality:** All keys have French values, but accent characters are systematically wrong (ASCII approximations instead of proper Unicode accented characters)
- **Language detection:** No browser locale auto-detection. Defaults to English
- **Switcher:** Present in header, works, persists to localStorage

### State Machine Enforcement (PRD 7.6.2)

- **Shipment statuses:** CHECK constraint on `vendor_shipments.status` allows 12 values (matches PRD: draft, pending, in_batch, in_transit, delayed, arrived, ready_for_pickup, out_for_last_mile_delivery, customs_hold, collected, returned, cancelled)
- **Batch statuses:** CHECK constraint on `vendor_batches.status` allows 8 values
- **Transition enforcement:** App-level only via `BATCH_STATUS_TRANSITIONS` map in `cmlBatches.js`. **No DB-level transition enforcement** (no trigger that validates old_status -> new_status). A direct DB update could skip invalid transitions
- **Shipment transitions:** No explicit transition map in code. Status is set by batch operations and collection, but there is no guard preventing arbitrary status changes via the API

### Vendor Data Isolation (PRD 7.6.3)

- **RLS:** Enabled on all CML tables. Policies check `vendors.owner_user_id = auth.uid()`
- **App-level:** All API queries include `.eq("vendor_id", vendorId)`
- **CRITICAL GAP:** RLS policies ONLY grant access to the vendor owner. Staff members (admin/staff roles in `vendor_staff`) have **ZERO database access** via RLS. The permissions system is owner-only. Multi-user vendor teams are completely broken at the DB level
- **Public tracking:** Properly isolated via RPC function that returns only safe fields (no pricing/payment data)

### Permissions Matrix (PRD 7.6.12)

- **NOT ENFORCED.** No role-based permission checks in UI or application layer. No conditional rendering based on staff role. No API-level role validation. The 16-action permission matrix from the PRD is not implemented at all.

### Phone Numbers E.164 (PRD 7.6.5)

- **Application layer:** `PhoneNumberField` component uses `libphonenumber-js` to parse and store E.164 format. Works correctly for form input.
- **Database layer:** All phone columns are plain `text` with **NO CHECK constraint** validating E.164 format. Any data entering outside the UI (admin operations, migrations, direct SQL) bypasses validation entirely.

### Prices in Cents (PRD 7.6.10)

- **NOT IMPLEMENTED.** All monetary columns are `numeric(12,2)` storing decimal dollar amounts (e.g., `15000.00` for $15,000.00 or `20.00` for $20.00). The PRD explicitly requires integer cents. JavaScript floating-point arithmetic is used for price calculations, which risks rounding errors.

---

## D. P2P + Bus Ticketing Module Status

### Phase 2: P2P Delivery

- **No routes, pages, or components exist** for P2P delivery
- **No database tables** specific to P2P (no traveler trips, no sender requests, no matching)
- The Wave 1 `trips` table has a `trip_kind` CHECK allowing `'traveler_listing'` which hints at P2P, but no P2P-specific logic exists in the React app
- **Status: Nothing built**

### Phase 3: Bus Ticketing

- **Wave 1 database tables exist** as a legacy schema from a prior platform (base44):
  - `bus_operators`, `operator_branches`, `bus_routes`, `vehicles`, `seat_map_templates`, `trips`, `trip_seat_inventory`, `orders`, `order_seats`, `tickets`, `seat_allocation_rules`, `seat_allocations`, `operator_staff`
  - These tables have RLS enabled but **only service_role has access** (no authenticated-user policies)
  - Most columns lack CHECK constraints on status/enum fields
  - Prices are decimal (not cents)
- **No React UI exists** for bus ticketing. No routes, pages, or components
- **Legacy base44 entity definitions** exist in `base44/entities/` (70+ .jsonc files) but these appear to be from a prior platform and are not used by the current React app
- **Status: Legacy DB schema exists but is inert. No UI, no API integration, no functional module**

---

## Summary of Critical Findings

| Priority | Finding |
|----------|---------|
| **P0 BLOCKER** | Staff/Admin roles have zero DB access via RLS -- multi-user vendor teams are broken |
| **P0 BLOCKER** | WhatsApp notifications are never actually sent -- records created but no Meta API integration |
| **P0 BLOCKER** | No mobile navigation -- app is unusable on mobile for authenticated vendors |
| **P0** | No admin panel -- cannot approve/reject vendor applications |
| **P0** | No shipment list page -- vendors cannot browse their shipments |
| **P0** | Prices stored as decimal, not integer cents (violates PRD 7.6.10) |
| **P0** | No subscription/tier enforcement -- Free and Pro are identical |
| **P1** | No staff management UI or permissions matrix |
| **P1** | Insurance completely absent from intake flow |
| **P1** | French translations have wrong accent characters |
| **P1** | State machine transitions not enforced at DB level |
| **P1** | Phone E.164 not enforced at DB level |
| **P2** | Dashboard has no metrics/KPIs |
| **P2** | Intake is a single form, not a 6-step wizard |
| **P2** | No reports, closeout, issues, claims features |
| **P2** | P2P and Bus Ticketing modules not started |
