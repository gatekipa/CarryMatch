# CML V1 Developer Handoff

## 1. Project purpose

CarryMatch Logistics (CML) Phase 1 is the vendor-side launch-core web app for shipping vendors.

The current app is a bilingual EN/FR React + Vite + Supabase build focused on:

- vendor onboarding and activation
- vendor business setup and branch setup
- shipment intake and tracking number generation
- batch creation and batch status operations
- receiving-side collection flow
- public tracking by tracking number
- internal notification event logging foundation
- shipping label generation
- scan/update retrieval by tracking number

This is not the broader CarryMatch marketplace, passenger ticketing, or Meta sending layer. The current repo is centered on the CML launch-core workflow only.

## 2. Current implementation status

What is already built and working now:

- App entry is [src/App.jsx](/C:/Users/nanye/Documents/CarryMatch/src/App.jsx), and the live app routes only through [src/features/cml-core/CmlRoutes.jsx](/C:/Users/nanye/Documents/CarryMatch/src/features/cml-core/CmlRoutes.jsx).
- Auth is wired to Supabase email/password auth through [src/lib/AuthContext.jsx](/C:/Users/nanye/Documents/CarryMatch/src/lib/AuthContext.jsx) and [src/lib/supabaseClient.js](/C:/Users/nanye/Documents/CarryMatch/src/lib/supabaseClient.js).
- Access-state gating is real and table-backed first, with legacy-profile fallback only where needed.
- Public routes exist for landing, pricing, sign up, login, partner application, and public tracking.
- Partner application submission is real and saved to Supabase.
- Rejected applications can be edited and resubmitted.
- Application status reads real saved application and vendor state.
- Approved vendors can complete the first-login setup wizard and become active vendors.
- Active vendors can manage company profile and destination branches.
- Shipment intake creates real vendor customers, real shipments, and real tracking numbers.
- Shipment detail loads real shipment data, linked batch data, destination branch data, status history, payment state, and label actions.
- Batch list and batch detail are real and vendor-scoped.
- Batch operations support batch creation, assignment, unassignment, ETA updates, and controlled status progression.
- Receiving-side flow supports `arrived`, `ready_for_pickup`, `out_for_last_mile_delivery`, and per-shipment `collected`.
- Public tracking is real and reads live shipment/timeline data through a public-safe Supabase RPC.
- Vendor notification log and vendor notification settings are built on top of real notification event records.
- Shipping label generation is real and tied to shipment/tracking data.
- Scan / Update supports manual tracking lookup and opens the real shipment quickly; browser-native QR scanning is attempted when supported.
- `npm run build` currently succeeds.

## 3. Main functional flows currently implemented

1. Auth and access-state routing
- Public user reaches `/`, `/pricing`, `/signup`, `/login`, `/partners/apply`, `/track`, and `/track/:trackingNumber`.
- Signed-in user is routed by access state to `/partners/apply`, `/application-status`, `/setup`, or `/dashboard`.
- Access states currently used are `public`, `no_vendor_record`, `application_pending`, `application_rejected`, `setup_required`, `active_vendor`, and `suspended_vendor`.

2. Partner onboarding
- Signed-in user with no vendor/application submits a real partner application from `/partners/apply`.
- Application is stored in `vendor_applications`.
- Rejected application can be reopened, edited, and resubmitted.
- Application status page reads the real application state and routes approved users into setup.

3. First-login vendor setup
- Approved vendor completes `/setup`.
- Setup creates or updates the `vendors` row.
- Setup creates destination branches in `vendor_branches`.
- Setup creates the owner link in `vendor_staff`.
- Setup activates the vendor and routes to `/dashboard`.

4. Active vendor business management
- Active vendor can open `/settings/company-profile`.
- Company profile saves company name, vendor prefix, default origin country, default origin city, pricing model, rate per kg, flat fee per item, and default currency.
- Active vendor can open `/settings/branches`.
- Branch management loads real destination branches and supports add, edit, and delete.

5. Shipment intake
- Active vendor opens `/shipments/new`.
- Sender lookup checks `vendor_customers` by phone inside vendor scope.
- Intake saves sender and receiver customer records.
- Intake requires a real destination branch and uses it to drive destination country and branch linkage.
- Intake generates a real tracking number from the vendor prefix.
- Intake saves a real `vendor_shipments` row.

6. Shipment operations from shipment detail
- Shipment detail is available at `/shipments/:shipmentId`.
- Detail page shows shipment data, linked batch, destination branch, payment summary, ETA, status history, and label action.
- Shipment detail can assign an unbatched shipment to an open batch.
- Shipment detail can create a new batch inline and assign the shipment.
- Shipment detail can remove a shipment from an open batch.
- Shipment detail can record partial/full payment on the real shipment row.

7. Batch operations
- Active vendor opens `/batches` and `/batches/:batchId`.
- Vendor can create a batch with name and ETA.
- Vendor can add pending shipments to an open batch.
- Vendor can remove shipments from an open batch.
- Batch statuses currently supported are:
  - `open`
  - `locked`
  - `shipped`
  - `delayed`
  - `customs_hold`
  - `arrived`
  - `ready_for_pickup`
  - `out_for_last_mile_delivery`
- Locked batches can be explicitly reopened back to `open`.
- Delayed/customs-hold batches require ETA updates.
- Batch status changes sync linked shipment statuses and append shipment history entries.

8. Receiving-side flow
- Batch detail provides receiving-side visibility for shipments in the batch.
- Vendor can move a batch into `ready_for_pickup` or `out_for_last_mile_delivery`.
- Vendor can mark an eligible shipment as `collected`.
- Shipment detail and timeline reflect the collected state.

9. Public tracking
- Public tracking is available at `/track` and `/track/:trackingNumber`.
- Public page shows safe shipment information only:
  - tracking number
  - shipment summary
  - origin
  - destination
  - destination branch
  - current status
  - customer-safe status/timeline labels
  - operational ETA when available
- Public page does not expose pricing, internal notes, or vendor-only actions.

10. Notifications foundation
- Operational events create real `vendor_notifications` records.
- Vendor can inspect those records at `/notifications/log`.
- Vendor can save basic notification defaults at `/notifications/settings`.
- No outbound Meta or email sending is implemented yet.

11. Shipping label and scan/update
- Vendor can generate a single printable shipment label from shipment detail or intake success state.
- Label includes QR code to the real public tracking route.
- Scan / Update page at `/scan-update` supports manual tracking lookup and opens the shipment fast.
- Browser-native QR scanning is attempted if `BarcodeDetector` is available; manual entry remains the reliable fallback.

## 4. Key repo areas and what they do

- [src/App.jsx](/C:/Users/nanye/Documents/CarryMatch/src/App.jsx)
  Root provider composition. Wraps error boundary, i18n, auth, React Query, and the CML route tree.

- [src/main.jsx](/C:/Users/nanye/Documents/CarryMatch/src/main.jsx)
  App bootstrap. Mounts React and registers `public/sw.js` in production.

- [src/features/cml-core/CmlRoutes.jsx](/C:/Users/nanye/Documents/CarryMatch/src/features/cml-core/CmlRoutes.jsx)
  Canonical route map for the current app. If a screen is not wired here, it is not part of the live CML build.

- [src/features/cml-core/pages](/C:/Users/nanye/Documents/CarryMatch/src/features/cml-core/pages)
  All current launch-core screens:
  - onboarding/auth pages
  - dashboard
  - vendor settings
  - branches
  - shipment intake
  - shipment detail
  - batch list/detail
  - notification log/settings
  - public tracking
  - scan/update

- [src/features/cml-core/api/cmlOnboarding.js](/C:/Users/nanye/Documents/CarryMatch/src/features/cml-core/api/cmlOnboarding.js)
  Onboarding data layer. Loads onboarding snapshot, submits/re-submits partner applications, saves setup wizard, saves vendor profile, and updates vendor branches.

- [src/features/cml-core/api/cmlShipments.js](/C:/Users/nanye/Documents/CarryMatch/src/features/cml-core/api/cmlShipments.js)
  Shipment/customer data layer. Handles customer lookup/save, shipment creation, tracking generation, shipment detail loading, payment updates, shipment history append, vendor shipment lookup by tracking number, and public tracking RPC access.

- [src/features/cml-core/api/cmlBatches.js](/C:/Users/nanye/Documents/CarryMatch/src/features/cml-core/api/cmlBatches.js)
  Batch data layer. Handles batch list/detail reads, create/update, status transitions, ETA updates, shipment-to-batch assignment, unassignment, shipment status sync, and collected action.

- [src/features/cml-core/api/cmlNotifications.js](/C:/Users/nanye/Documents/CarryMatch/src/features/cml-core/api/cmlNotifications.js)
  Vendor notification read/write layer. Reads `vendor_notifications` and saves vendor-level notification settings.

- [src/features/cml-core/components/CmlAppShell.jsx](/C:/Users/nanye/Documents/CarryMatch/src/features/cml-core/components/CmlAppShell.jsx)
  Shared shell, top-level navigation, sign-out, and language switch.

- [src/features/cml-core/components/CmlStateScreens.jsx](/C:/Users/nanye/Documents/CarryMatch/src/features/cml-core/components/CmlStateScreens.jsx)
  Shared fullscreen loader/error and inline notices used across the CML screens.

- [src/features/cml-core/components/PhoneNumberField.jsx](/C:/Users/nanye/Documents/CarryMatch/src/features/cml-core/components/PhoneNumberField.jsx)
  Shared phone capture component with country selector, formatting, and normalized storage values.

- [src/features/cml-core/lib/countries.js](/C:/Users/nanye/Documents/CarryMatch/src/features/cml-core/lib/countries.js)
  Country option builder and country-code normalization used by settings, branches, intake, and public display.

- [src/features/cml-core/lib/customerUpdates.js](/C:/Users/nanye/Documents/CarryMatch/src/features/cml-core/lib/customerUpdates.js)
  Maps internal operational events/statuses to customer-facing update language for public tracking and future notifications.

- [src/features/cml-core/lib/shippingLabel.js](/C:/Users/nanye/Documents/CarryMatch/src/features/cml-core/lib/shippingLabel.js)
  Client-side label generation helper. Builds printable label output and QR codes from the real shipment record.

- [src/lib/AuthContext.jsx](/C:/Users/nanye/Documents/CarryMatch/src/lib/AuthContext.jsx)
  Session bootstrap and refresh. Loads app-owned vendor/application data after auth and exposes the active user, vendor, branches, and access state.

- [src/lib/cmlAccessState.js](/C:/Users/nanye/Documents/CarryMatch/src/lib/cmlAccessState.js)
  Central access-state resolver. Determines routing from real vendor/application records first, with legacy metadata fallback second.

- [src/lib/i18n.jsx](/C:/Users/nanye/Documents/CarryMatch/src/lib/i18n.jsx)
  EN/FR translation registry and language context.

- [src/lib/supabaseClient.js](/C:/Users/nanye/Documents/CarryMatch/src/lib/supabaseClient.js)
  Supabase browser client creation from Vite env vars.

- [src/components/ui](/C:/Users/nanye/Documents/CarryMatch/src/components/ui)
  Shared UI primitives still used by the CML pages. These remain active even after the legacy route cleanup.

- [src/components/ErrorBoundary.jsx](/C:/Users/nanye/Documents/CarryMatch/src/components/ErrorBoundary.jsx)
  Global React error boundary still used by the live app.

- [src/lib/query-client.js](/C:/Users/nanye/Documents/CarryMatch/src/lib/query-client.js)
  Shared React Query client instance.

- [src/lib/utils.js](/C:/Users/nanye/Documents/CarryMatch/src/lib/utils.js)
  Shared `cn()` helper used by the UI primitives.

- [src/utils/index.ts](/C:/Users/nanye/Documents/CarryMatch/src/utils/index.ts)
  Still used by the error boundary for `createPageUrl`.

- [public/manifest.json](/C:/Users/nanye/Documents/CarryMatch/public/manifest.json) and [public/sw.js](/C:/Users/nanye/Documents/CarryMatch/public/sw.js)
  PWA assets currently still registered in production.

- [supabase/migrations](/C:/Users/nanye/Documents/CarryMatch/supabase/migrations)
  All forward-only schema history. Do not rewrite or delete applied files.

## 5. Supabase schema/migrations in use

Active migrations in the repo:

- `202604040001_wave1_core_tables.sql`
  Pre-existing legacy platform tables, including `user_profiles` and multiple bus/trip/order tables. Current CML flow only lightly touches `user_profiles` as a fallback path; most other tables are legacy.

- `202604040002_wave1_constraints_indexes.sql`
  Foreign keys, unique constraints, and indexes for the pre-existing wave1 tables.

- `202604040003_wave1_rls_scaffold.sql`
  RLS scaffold for the wave1 tables, largely service-role oriented.

- `202604040004_check_seat_allocation_support.sql`
  Legacy seat allocation support tables for bus workflows. Present in schema history but not used by the current CML route tree.

- `202604060001_cml_launch_core_onboarding.sql`
  Introduced the core CML onboarding tables:
  - `vendor_applications`
  - `vendors`
  - `vendor_staff`
  - `vendor_branches`
  Also added updated-at support, indexes, grants, and RLS.

- `202604060002_cml_vendor_branches_country.sql`
  Added `country_code` to `vendor_branches` for structured branch geography.

- `202604060003_cml_shipment_intake_foundation.sql`
  Added:
  - `vendor_customers`
  - `vendor_shipments`
  This is the foundation for shipment intake and customer lookup.

- `202604060004_cml_shipment_pricing_defaults.sql`
  Added vendor pricing-default fields and shipment pricing fields, including vendor default currency and shipment discount/total storage.

- `202604060005_cml_batch_management_foundation.sql`
  Added `vendor_batches`, shipment-to-batch linkage, and the initial batch status support.

- `202604060006_cml_batch_last_mile_status.sql`
  Extended controlled statuses to include `out_for_last_mile_delivery`.

- `202604060007_cml_shipment_destination_branch.sql`
  Added `destination_branch_id` to `vendor_shipments`.

- `202604060008_cml_vendor_branches_city.sql`
  Added `city` to `vendor_branches`.

- `202604060009_cml_shipment_status_history.sql`
  Added `vendor_shipment_status_history` for internal shipment timeline/history.

- `202604060010_cml_public_tracking_rpc.sql`
  Added the public-safe RPC `get_public_shipment_tracking(text)` used by the public tracking page.

- `202604060011_cml_public_tracking_eta.sql`
  Extended the public tracking RPC to return operational ETA from the linked batch.

- `202604060012_cml_shipment_history_eta_updated.sql`
  Extended shipment history support so ETA revisions can be recorded as `eta_updated`.

- `202604060013_cml_shipment_payment_recording.sql`
  Added shipment payment-recording fields:
  - `amount_paid`
  - `payment_method`
  - `payment_note`
  Also added constraints around payment values.

- `202604060014_cml_notification_events_foundation.sql`
  Added `vendor_notifications` plus trigger-based notification event recording for shipment/batch operational events.

- `202604060015_cml_notification_customer_update_mapping.sql`
  Extended notification event support to include `out_for_last_mile_delivery`.

- `202604060016_cml_vendor_notification_settings.sql`
  Added vendor-level notification settings fields on `vendors`:
  - `notifications_enabled`
  - `notification_default_channel`

- `202604060017_cml_launch_core_hardening.sql`
  Added the RLS/grant support needed for:
  - rejected application resubmission updates
  - owner branch updates

Practical note:

- The current CML app relies mainly on `202604060001` through `202604060017`.
- Do not skip or remove the earlier `20260404000x` migrations just because the current route tree is CML-focused; they are still part of the applied repo history.

## 6. Environment/runtime requirements

Minimum local requirements:

- Node.js and npm
- `npm install`
- `.env.local` with:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- A Supabase project with all migrations in [supabase/migrations](/C:/Users/nanye/Documents/CarryMatch/supabase/migrations) applied in order
- Supabase Email/Password auth enabled for the current onboarding/auth flow

Useful commands:

- `npm run dev`
- `npm run build`
- `npm run test`

Important runtime notes:

- The current browser app requires the two `VITE_` Supabase vars above.
- `.env.example` also contains `SUPABASE_SECRET_KEY`, `SUPABASE_DB_URL`, and `CHECK_SEAT_ALLOCATION_*`, but those are not required to render the current CML browser flow.
- Production build registers the service worker from [public/sw.js](/C:/Users/nanye/Documents/CarryMatch/public/sw.js).
- Shipping labels and public tracking URLs use the current browser origin, so deployed hostnames need to be correct.

## 7. What is still incomplete

Important areas that are not fully built yet:

- No admin review/approval UI for partner applications. Approval/rejection still requires direct data updates outside the current vendor app.
- No real vendor staff management flow or fully working non-owner staff experience.
- No subscription/coupon management flow in the live route tree.
- No full shipment list/search/filter screen for already-created shipments.
- No dedicated customer-management/CRM screen beyond phone-first lookup during intake.
- No full payments module/dashboard; payment updates exist only from shipment detail.
- No proof-photo capture flow for collected shipments.
- No WhatsApp Meta Cloud API direct sending yet.
- No email fallback sending yet.
- No notification template editor yet.
- No batch manifest printing or batch label printing flow yet.
- No full claims/issues/closeout/reporting modules yet.
- No public chatbot or proactive customer messaging.

## 8. Known limitations / caution areas

- Owner-first assumption is still real. [src/features/cml-core/api/cmlOnboarding.js](/C:/Users/nanye/Documents/CarryMatch/src/features/cml-core/api/cmlOnboarding.js) loads the main vendor row by `owner_user_id`, so non-owner staff is not yet a first-class path.
- Branch deletion needs care. `vendor_shipments.destination_branch_id` is linked to branches, so deleting a live branch can remove branch linkage from existing shipments.
- Destination branches are operationally important now. Shipment intake depends on them for destination selection.
- Shipment intake currently supports `unpaid` or `paid` at creation time. Partial payment is handled later from shipment detail, not at intake.
- Notification records are currently created by database-triggered event capture plus existing status-write logic. If you change status transitions or shipment update code, re-check both `vendor_shipment_status_history` and `vendor_notifications`.
- Public tracking is intentionally safe and limited. Do not expose pricing, payment internals, vendor revenue, internal notes, or vendor-only action controls there.
- Shipping label generation is client-side. Popup blocking and browser PDF behavior can affect UX, so test on real browsers.
- Scan / Update QR scanning depends on browser support for `BarcodeDetector`; manual entry is the guaranteed path.
- The repo still carries legacy migration history and some legacy dependencies in `package.json`. Do not assume a dependency is removable without verifying imports and a clean build.
- Build currently passes, but Vite warns about stale Browserslist/baseline data. Those warnings are non-blocking but still worth cleaning up later.

## 9. Recommended immediate next steps

The next practical priorities from the current state are:

1. Build the missing admin-side approval/rejection flow for `vendor_applications`, so onboarding no longer depends on manual database changes.
2. Build real vendor staff management and update access-state/data loading so non-owner staff can operate the app safely.
3. Build a shipment list/search page so vendors can reopen shipments without relying on batch pages, scan/update, or direct links.
4. Add proof-photo capture to the receiving-side collected flow.
5. Turn the existing notification foundation into real delivery plumbing, using the current `vendor_notifications` and vendor notification settings instead of creating a separate messaging system.
6. Add the remaining launch-core commercial/ops foundations that are still missing from the live route tree, especially subscription/coupon handling and any required vendor plan gating.

## 10. Rules for touching this repo

- Treat [src/features/cml-core](/C:/Users/nanye/Documents/CarryMatch/src/features/cml-core) as the live application surface. Do not reintroduce a second parallel page system.
- Do not delete or rewrite existing Supabase migration files. Add forward-only migrations.
- Do not casually rewrite [src/lib/AuthContext.jsx](/C:/Users/nanye/Documents/CarryMatch/src/lib/AuthContext.jsx), [src/lib/cmlAccessState.js](/C:/Users/nanye/Documents/CarryMatch/src/lib/cmlAccessState.js), or the `src/features/cml-core/api/*` helpers without retesting onboarding, intake, batch flow, public tracking, and notifications.
- Do not bypass vendor scoping. Every vendor-side read/write should stay scoped by `vendor_id` or the existing owner linkage pattern.
- Do not weaken public tracking safety. Keep pricing, internal notes, and internal ops controls out of the public view.
- Do not remove destination-branch-driven shipment intake unless you are replacing it with something equally structured and safe.
- Do not casually delete:
  - [src/components/ui](/C:/Users/nanye/Documents/CarryMatch/src/components/ui)
  - [src/components/ErrorBoundary.jsx](/C:/Users/nanye/Documents/CarryMatch/src/components/ErrorBoundary.jsx)
  - [src/lib/query-client.js](/C:/Users/nanye/Documents/CarryMatch/src/lib/query-client.js)
  - [src/lib/utils.js](/C:/Users/nanye/Documents/CarryMatch/src/lib/utils.js)
  - [src/lib/supabaseClient.js](/C:/Users/nanye/Documents/CarryMatch/src/lib/supabaseClient.js)
  - [src/utils/index.ts](/C:/Users/nanye/Documents/CarryMatch/src/utils/index.ts)
  - [public/manifest.json](/C:/Users/nanye/Documents/CarryMatch/public/manifest.json)
  - [public/sw.js](/C:/Users/nanye/Documents/CarryMatch/public/sw.js)
- Keep EN/FR translations updated in [src/lib/i18n.jsx](/C:/Users/nanye/Documents/CarryMatch/src/lib/i18n.jsx) for every user-facing change.
- If you change shipment or batch status behavior, also verify:
  - shipment history still records correctly
  - notification events still record correctly
  - public tracking still shows customer-safe status language
