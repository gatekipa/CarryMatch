# CML V1 Screen Map

This document turns the approved CML V1 blueprint into a screen-by-screen product map for CarryMatch Phase 1 Vendor Logistics only.

Launch-core screens are marked `Launch Core`.
Phase 1 follow-on screens are marked `P1 Follow-On`.
For the current build, only the `Launch Core` screens are in scope.

## A. Public / unauthenticated screens

### A1. Landing Page (`Launch Core`)

1. Screen name: Landing Page
2. Who can access it: Anyone
3. Purpose of the screen: Explain what CarryMatch Logistics is and direct vendors to apply, sign up, sign in, or view pricing.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: product overview section, vendor types served section, key Phase 1 value points, CTA buttons for `Apply as Partner`, `Pricing`, and `Sign In`.
5. Empty state: Not applicable; this is a marketing page.
6. Error state: If marketing content cannot load, show a simple fallback message and keep `Apply as Partner`, `Pricing`, and `Sign In` visible.
7. Success state: User understands the product and can move into pricing or partner application.
8. Navigation entry point: Public site root.
9. What data/entities it reads: None required beyond static content.
10. What data/entities it writes: None.
11. Permissions or role restrictions: Public only; no vendor data visible.
12. Whether EN/FR translation is required at launch: Yes. Public-facing launch content must be bilingual.

### A2. Pricing Page (`Launch Core`)

1. Screen name: Pricing Page
2. Who can access it: Anyone
3. Purpose of the screen: Show Free and Pro tiers and explain Stripe and coupon-code subscription options.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: plan comparison table for Free and Pro; feature rows from the PRD; subscription collection methods section; CTA buttons for `Apply as Partner` and `Sign In`.
5. Empty state: If plan data is unavailable, show the current default plan cards and support contact.
6. Error state: If pricing data fails to load, show a clear fallback message and keep CTA buttons visible.
7. Success state: User understands plan differences and chooses to apply or sign in.
8. Navigation entry point: Landing page or public site navigation.
9. What data/entities it reads: `SubscriptionPlan` if plan data is dynamic; otherwise static pricing content.
10. What data/entities it writes: None.
11. Permissions or role restrictions: Public only.
12. Whether EN/FR translation is required at launch: Yes.

### A3. Partner Application Page (`Launch Core`)

1. Screen name: Partner Application Page
2. Who can access it: Unauthenticated users and authenticated users with no vendor record.
3. Purpose of the screen: Capture a new vendor application for review.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: company/business name, owner full name, phone number, WhatsApp number, email address, business type, primary corridors, estimated monthly shipment volume, office addresses, referral source, optional business registration number, optional social links, optional references, `Submit Application` button.
5. Empty state: Blank application form with helper text.
6. Error state: Validation errors on required fields, duplicate application message if already applied, and a general submit failure message if save fails.
7. Success state: Show that the application was submitted and direct the user to the application status page.
8. Navigation entry point: Landing page, pricing page, or auth gate redirect.
9. What data/entities it reads: Possibly existing `VendorApplication` for dedupe or resume.
10. What data/entities it writes: `VendorApplication`, `Auth user account` if sign-up is bundled in the same flow.
11. Permissions or role restrictions: Cannot be used by already active vendors; active vendors should be redirected into the app.
12. Whether EN/FR translation is required at launch: Yes.

### A4. Sign Up Page (`Launch Core`)

1. Screen name: Sign Up Page
2. Who can access it: Anyone not signed in.
3. Purpose of the screen: Create an account so the user can submit or manage a partner application.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: email, password, confirm password, optional link to `Apply as Partner`, `Create Account` button, `Sign In` link.
5. Empty state: Blank sign-up form.
6. Error state: Invalid email, weak password, password mismatch, duplicate account, or auth service unavailable.
7. Success state: Account created and user is routed into the application flow.
8. Navigation entry point: Landing page, pricing page, or partner application flow.
9. What data/entities it reads: `Auth user account` for duplicate-check behavior.
10. What data/entities it writes: `Auth user account`.
11. Permissions or role restrictions: Public only.
12. Whether EN/FR translation is required at launch: Yes.

### A5. Login Page (`Launch Core`)

1. Screen name: Login Page
2. Who can access it: Anyone not signed in.
3. Purpose of the screen: Authenticate an existing user and route them to the correct next screen.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: email, password, `Sign In` button, `Forgot Password` link if implemented, `Apply as Partner` link.
5. Empty state: Blank login form.
6. Error state: Invalid credentials, suspended account message, or auth service failure.
7. Success state: User is routed based on status: application form, application status, setup wizard, or vendor dashboard.
8. Navigation entry point: Landing page, pricing page, or direct URL.
9. What data/entities it reads: `Auth user account`, `VendorApplication`, `Vendor`, `VendorStaff`, `Subscription state record`.
10. What data/entities it writes: Auth session only.
11. Permissions or role restrictions: Public login only; no data visible before authentication.
12. Whether EN/FR translation is required at launch: Yes.

## B. Onboarding / application screens

### B1. Application Status Page (`Launch Core`)

1. Screen name: Application Status Page
2. Who can access it: Authenticated users with no active vendor account yet, including pending and rejected applicants.
3. Purpose of the screen: Tell the applicant where they stand and block dashboard access until approved.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: status card, submitted business details summary, review ETA message, rejection reason when relevant, `Reapply` button when rejected, support contact when suspended.
5. Empty state: If no application exists, show `Apply as Partner` CTA.
6. Error state: If application status cannot be loaded, show retry message and support contact.
7. Success state: Pending state reassures the user; approved state routes into setup; rejected state explains what to do next.
8. Navigation entry point: Post-application submit, post-login routing, or auth gate.
9. What data/entities it reads: `VendorApplication`, `Vendor`, `VendorStaff`.
10. What data/entities it writes: `VendorApplication` only if the user re-applies.
11. Permissions or role restrictions: Not for active vendor users; they should be redirected away.
12. Whether EN/FR translation is required at launch: Yes.

### B2. First-Login Setup Wizard (`Launch Core`)

1. Screen name: First-Login Setup Wizard
2. Who can access it: Approved vendor owner on first login after approval.
3. Purpose of the screen: Capture the minimum vendor configuration needed before real operations begin.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: vendor prefix, default origin country/city, destination branches, pricing model, rate per kg or flat fee per item, insurance mode, insurance rate or flat fee, minimum premium, company logo upload, Free / Pro subscription plan selection, coupon code entry, `Next`, `Back`, and `Finish Setup` actions.
5. Empty state: All fields start empty except values that can be pre-filled from the application.
6. Error state: Duplicate vendor prefix, invalid branch details, invalid pricing or insurance settings, invalid coupon code, or upload failure.
7. Success state: Vendor profile is activated for real use and the owner lands on the dashboard.
8. Navigation entry point: First successful login after approval.
9. What data/entities it reads: `VendorApplication`, `SubscriptionPlan`, `CouponCode`.
10. What data/entities it writes: `Vendor`, `Branch`, `VendorStaff` owner record updates, `CouponCode` usage state, `Subscription state record`.
11. Permissions or role restrictions: Owner only.
12. Whether EN/FR translation is required at launch: Yes.

## C. Vendor app core screens

### C1. Vendor Dashboard (`Launch Core`)

1. Screen name: Vendor Dashboard
2. Who can access it: Vendor Staff, Vendor Admin, Vendor Owner.
3. Purpose of the screen: Give the vendor a real-time operating center and fast access to core workflows.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: KPI cards for today's cut-offs, active batches, in transit, delivered this month, alerts/issues, and revenue; quick actions for `New Shipment`, `Scan & Update`, `Manage Batches`, `View Shipments`, `Payments`, `Notifications`, `Staff`, and `Settings`; optional branch and shipping-mode filters as a follow-on enhancement.
5. Empty state: Show `Create your first shipment` and `Create your first batch` CTAs when there is no activity yet.
6. Error state: If metrics fail to load, show retry controls while keeping quick actions available.
7. Success state: Vendor sees live operational counts and can jump directly into work.
8. Navigation entry point: Post-login landing page for active vendors.
9. What data/entities it reads: `Vendor`, `VendorStaff`, `Shipment`, `Batch`, `Notification`, `Subscription state record`.
10. What data/entities it writes: None directly from the dashboard itself.
11. Permissions or role restrictions: Staff should not see revenue details if the implementation separates that card by role.
12. Whether EN/FR translation is required at launch: Yes.

### C2. New Shipment Intake (`Launch Core`)

1. Screen name: New Shipment Intake
2. Who can access it: Vendor Staff, Vendor Admin, Vendor Owner.
3. Purpose of the screen: Let staff create a shipment in under 60 seconds.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: Step 1 origin and destination fields; Step 2 sender phone, name, WhatsApp, email, country, city; Step 3 receiver with the same fields; Step 4 contents description, weight, quantity, category, dimensions, volumetric weight, chargeable weight, estimated value, special handling, fragile toggle, hazardous toggle, reference number, photos; Step 5 base price, additional fees/discounts, insurance toggle, declared value, insurance mode, insurance rate/fee display, insurance premium, total, payment status; Step 6 summary and `Create Shipment`; frequent receivers section; customer history preview; actions `Next`, `Back`, and `Create Shipment`.
5. Empty state: New blank intake flow with vendor defaults pre-filled where available.
6. Error state: Required field validation, phone format errors, bad pricing data, invalid weight values, or create failure.
7. Success state: Shipment is saved, tracking number is generated, and WhatsApp notifications are triggered through the Meta Cloud API direct flow.
8. Navigation entry point: Dashboard quick action or shipment copy flow.
9. What data/entities it reads: `Vendor`, `Customer`, `Branch`, `VendorStaff`, `Subscription state record`.
10. What data/entities it writes: `Customer`, `Shipment`, `Notification`, `Shipment status history / tracking timeline`.
11. Permissions or role restrictions: Staff can create shipments but should not see advanced financial administration beyond the intake payment fields allowed by the PRD.
12. Whether EN/FR translation is required at launch: Yes.

### C3. Shipment Created Confirmation (`Launch Core`)

1. Screen name: Shipment Created Confirmation
2. Who can access it: Vendor Staff, Vendor Admin, Vendor Owner.
3. Purpose of the screen: Confirm that the shipment was created and offer the next operational actions.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: tracking number, sender and receiver summary, route, item description, total price, payment status, `Print Shipping Label`, `Create Another Shipment`, and `Back to Dashboard`.
5. Empty state: Not applicable if a shipment was just created; otherwise redirect away.
6. Error state: If confirmation data cannot load, show the tracking number if available and a link to the shipment detail page.
7. Success state: Staff can immediately print a label or create the next shipment.
8. Navigation entry point: Successful completion of the intake flow.
9. What data/entities it reads: `Shipment`, `Vendor`, `Customer`.
10. What data/entities it writes: None directly, except when a label-print action is triggered.
11. Permissions or role restrictions: Same access as shipment creation.
12. Whether EN/FR translation is required at launch: Yes.

### C4. Shipment List (`Launch Core`)

1. Screen name: Shipment List
2. Who can access it: Vendor Staff, Vendor Admin, Vendor Owner.
3. Purpose of the screen: Let the vendor find and review shipments quickly.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: search, filters for status, date, batch, corridor, and shipping mode; shipment table with tracking number, sender, receiver, route, status, payment status, batch, and created date; row action to open shipment detail.
5. Empty state: `No shipments yet` with a `New Shipment` CTA.
6. Error state: List load failure with retry.
7. Success state: User can search, filter, and open shipments without leaving the page.
8. Navigation entry point: Dashboard quick action or main nav.
9. What data/entities it reads: `Shipment`, `Batch`, `Customer`, `VendorStaff`.
10. What data/entities it writes: None directly from the list screen.
11. Permissions or role restrictions: Staff should be limited to own-branch shipment scope where that rule applies.
12. Whether EN/FR translation is required at launch: Yes.

### C5. Shipment Detail (`Launch Core`)

1. Screen name: Shipment Detail
2. Who can access it: Vendor Staff, Vendor Admin, Vendor Owner.
3. Purpose of the screen: Show the full shipment record and allow only valid next actions.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: shipment summary card, sender section, receiver section, parcel details section, pricing and payment section, batch section, current status and timeline, notes, allowed next-status action buttons only, payment recording controls, cancel action when allowed, edit action when allowed, print label action.
5. Empty state: If the shipment ID is missing or invalid, show `Shipment not found`.
6. Error state: Load failure, unauthorized edit attempt, invalid status transition attempt, or payment update failure.
7. Success state: Shipment updates save and the timeline reflects the latest state.
8. Navigation entry point: Shipment list, scan and update, batch screens, or created confirmation screen.
9. What data/entities it reads: `Shipment`, `Customer`, `Batch`, `Branch`, `Notification`, `Shipment status history / tracking timeline`.
10. What data/entities it writes: `Shipment`, `Notification`, `Shipment status history / tracking timeline`.
11. Permissions or role restrictions: Staff can update status but cannot edit shipment details after creation, cancel shipments, or record payments; Admin and Owner can do more based on the PRD matrix.
12. Whether EN/FR translation is required at launch: Yes.

### C6. Customer Lookup / CRM (`Launch Core`)

1. Screen name: Customer Lookup / CRM
2. Who can access it: Vendor Staff, Vendor Admin, Vendor Owner.
3. Purpose of the screen: Make phone-first customer memory real and reduce repeated data entry.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: phone search input, matched customer profile card, frequent receivers list, past shipments table, `Use for Sender`, and `Use for Receiver` actions.
5. Empty state: `No customer found for this phone number` plus action to continue with a new customer.
6. Error state: Search failure or history load failure with retry.
7. Success state: Customer and frequent receiver details fill the intake flow in one tap.
8. Navigation entry point: New Shipment intake, dashboard quick action, or P1 customer management area.
9. What data/entities it reads: `Customer`, `Shipment`.
10. What data/entities it writes: None.
11. Permissions or role restrictions: Staff can view limited history; Admin and Owner can view broader history.
12. Whether EN/FR translation is required at launch: Yes.

### C7. Scan & Update (`Launch Core`)

1. Screen name: Scan & Update
2. Who can access it: Vendor Staff, Vendor Admin, Vendor Owner.
3. Purpose of the screen: Open a shipment quickly by barcode or QR and update it fast.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: camera scanner area, manual tracking-number entry fallback, shipment result card, valid next-status action buttons, quick link to shipment detail.
5. Empty state: Scanner ready state with manual-entry option.
6. Error state: Camera unavailable, invalid code, no shipment found, or update failure.
7. Success state: Shipment opens immediately and the selected status change is saved.
8. Navigation entry point: Dashboard quick action, mobile/PWA quick access.
9. What data/entities it reads: `Shipment`, `Shipment status history / tracking timeline`.
10. What data/entities it writes: `Shipment`, `Notification`, `Shipment status history / tracking timeline`.
11. Permissions or role restrictions: Same shipment-status permission rules as shipment detail.
12. Whether EN/FR translation is required at launch: Yes.

### C8. Payments Tracking (`Launch Core`)

1. Screen name: Payments Tracking
2. Who can access it: Vendor Admin, Vendor Owner.
3. Purpose of the screen: Track paid, partial, and unpaid shipments and record payment details.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: filters for payment status and payment method, payments table with tracking number, sender, total, amount paid, amount due, payment status, payment method, paid-at date, and `Record Payment` action.
5. Empty state: `No payments to show` with links back to shipments.
6. Error state: Load failure or payment update failure with retry.
7. Success state: Payment status and amounts update correctly and reflect on the shipment.
8. Navigation entry point: Dashboard quick action or shipment detail.
9. What data/entities it reads: `Shipment`, `Customer`.
10. What data/entities it writes: `Shipment`.
11. Permissions or role restrictions: Staff cannot view pricing/payment info or record payments.
12. Whether EN/FR translation is required at launch: Yes.

### C9. Shipping Label Print (`Launch Core`)

1. Screen name: Shipping Label Print
2. Who can access it: Vendor Staff, Vendor Admin, Vendor Owner, subject to plan restrictions.
3. Purpose of the screen: Print single or batch labels with QR code and barcode.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: label preview, print format selector for 4x6 or A4, shipment label fields from the PRD, `Print Label`, `Download PDF`, and `Batch Print` where relevant; free-tier upgrade prompt if label printing is locked.
5. Empty state: `No printable shipment selected`.
6. Error state: Label generation failure, branding asset failure, or print/download failure.
7. Success state: PDF is generated and ready to print.
8. Navigation entry point: Shipment created confirmation, shipment detail, or batch screens.
9. What data/entities it reads: `Shipment`, `Vendor`, `Customer`, `Branch`, `Subscription state record`.
10. What data/entities it writes: None to core business records.
11. Permissions or role restrictions: Feature access depends on subscription tier; label content must respect vendor branding rules.
12. Whether EN/FR translation is required at launch: Yes. The PRD explicitly requires bilingual shipping label field headers.

### C10. Customer Management (`P1 Follow-On`)

1. Screen name: Customer Management
2. Who can access it: Vendor Admin, Vendor Owner; Staff may have limited access.
3. Purpose of the screen: View the full vendor-scoped customer base with history and notes.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: customer table, phone search, customer profile panel, shipment history, notes, frequent receivers, and optional export action if enabled later.
5. Empty state: `No customers yet`.
6. Error state: List or detail load failure.
7. Success state: Vendor can see repeat customers and manage notes.
8. Navigation entry point: Dashboard, CRM area, or shipment detail.
9. What data/entities it reads: `Customer`, `Shipment`.
10. What data/entities it writes: `Customer`.
11. Permissions or role restrictions: Customer records must always be vendor-scoped.
12. Whether EN/FR translation is required at launch: Not required if this screen ships later; yes if included in launch.

### C11. Closeout / End of Day (`P1 Follow-On`)

1. Screen name: Closeout / End of Day
2. Who can access it: Vendor Admin, Vendor Owner.
3. Purpose of the screen: Reconcile the day's shipments and payments.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: daily summary cards, payments summary, shipment count, outstanding balances, and `Generate Daily Summary`.
5. Empty state: `No activity for this day`.
6. Error state: Summary calculation failure.
7. Success state: Daily reconciliation summary is generated.
8. Navigation entry point: Dashboard quick action.
9. What data/entities it reads: `Shipment`, `Batch`.
10. What data/entities it writes: Possibly an exported summary or audit record if implemented.
11. Permissions or role restrictions: Staff cannot access.
12. Whether EN/FR translation is required at launch: Not required if this screen stays post-launch within Phase 1.

### C12. Reports & Analytics (`P1 Follow-On`)

1. Screen name: Reports & Analytics
2. Who can access it: Vendor Admin, Vendor Owner.
3. Purpose of the screen: Show revenue, shipment, corridor, batch, and mode performance.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: period filters, revenue cards, shipments by corridor, top customers, batch performance, shipping-mode breakdown, export action.
5. Empty state: `No report data yet`.
6. Error state: Analytics load failure.
7. Success state: Vendor can review performance and export reports.
8. Navigation entry point: Dashboard quick action.
9. What data/entities it reads: `Shipment`, `Batch`, `Customer`.
10. What data/entities it writes: Export file only if export is generated.
11. Permissions or role restrictions: Staff cannot access.
12. Whether EN/FR translation is required at launch: Not required if this screen stays post-launch within Phase 1.

### C13. Issues Management (`P1 Follow-On`)

1. Screen name: Issues Management
2. Who can access it: Vendor Admin, Vendor Owner.
3. Purpose of the screen: Track delayed, on-hold, or problem shipments.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: issue list, shipment link, issue status, notes, assignee, and resolution actions.
5. Empty state: `No open issues`.
6. Error state: Load or save failure.
7. Success state: Problems are logged and tracked to resolution.
8. Navigation entry point: Dashboard quick action or shipment detail.
9. What data/entities it reads: `Shipment`, `Notification`.
10. What data/entities it writes: Likely issue records or shipment notes once the follow-on implementation exists.
11. Permissions or role restrictions: Staff access not required by the PRD.
12. Whether EN/FR translation is required at launch: Not required if this screen stays post-launch within Phase 1.

### C14. Claims / Insurance (`P1 Follow-On`)

1. Screen name: Claims / Insurance
2. Who can access it: Vendor Admin, Vendor Owner.
3. Purpose of the screen: Handle insurance-related workflows for lost or damaged items.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: shipment lookup, declared value, insurance premium, claim notes, claim status, and vendor-side resolution actions.
5. Empty state: `No claims yet`.
6. Error state: Claim load or save failure.
7. Success state: Claim record or claim progress is saved.
8. Navigation entry point: Dashboard quick action or shipment detail.
9. What data/entities it reads: `Shipment`.
10. What data/entities it writes: Follow-on claims data and shipment notes once implemented.
11. Permissions or role restrictions: Staff access not required by the PRD.
12. Whether EN/FR translation is required at launch: Not required if this screen stays post-launch within Phase 1.

## D. Batch / pickup / collection screens

### D1. Batch List (`Launch Core`)

1. Screen name: Batch List
2. Who can access it: Vendor Staff, Vendor Admin, Vendor Owner.
3. Purpose of the screen: Show all batches and let the vendor open or create one.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: batch table with name, status, ETA, shipped date, arrived date, total parcels, collected count, and `Create Batch` action.
5. Empty state: `No batches yet` with a `Create Batch` CTA.
6. Error state: Load failure with retry.
7. Success state: User can open a batch and manage it.
8. Navigation entry point: Dashboard quick action.
9. What data/entities it reads: `Batch`.
10. What data/entities it writes: `Batch` when a new batch is created.
11. Permissions or role restrictions: All vendor roles can manage batches per the PRD.
12. Whether EN/FR translation is required at launch: Yes.

### D2. Batch Detail & Management (`Launch Core`)

1. Screen name: Batch Detail & Management
2. Who can access it: Vendor Staff, Vendor Admin, Vendor Owner.
3. Purpose of the screen: Manage a batch from creation through shipping.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: batch summary, shipment table, add/remove shipment controls, ETA field, `Lock Batch`, `Ship Batch`, and shipment counts; if included later, a `Print Manifest` shortcut.
5. Empty state: Empty batch with prompt to add pending shipments.
6. Error state: Invalid shipment add/remove, batch lock failure, ship failure, or ETA save failure.
7. Success state: Batch state changes are saved and related shipment states update correctly.
8. Navigation entry point: Batch list or dashboard quick action.
9. What data/entities it reads: `Batch`, `Shipment`, `Customer`.
10. What data/entities it writes: `Batch`, `Shipment`, `Notification`, `Shipment status history / tracking timeline`.
11. Permissions or role restrictions: All vendor roles can manage batches, but any financial side effects remain outside staff scope.
12. Whether EN/FR translation is required at launch: Yes.

### D3. Batch Arrival (`Launch Core`)

1. Screen name: Batch Arrival
2. Who can access it: Vendor Staff, Vendor Admin, Vendor Owner; especially destination staff.
3. Purpose of the screen: Mark a batch as arrived and prepare the pickup flow.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: pickup office selector, pickup address, opening hours, required ID, special instructions, `Mark Batch Arrived`, and confirmation of pickup notifications to receivers and senders.
5. Empty state: If no destination branch exists, show a clear message that branch setup is required first.
6. Error state: Missing pickup office data, arrival save failure, or notification trigger failure.
7. Success state: Batch is marked arrived and pickup notifications are sent.
8. Navigation entry point: Batch detail screen.
9. What data/entities it reads: `Batch`, `Branch`, `VendorStaff`, `Shipment`.
10. What data/entities it writes: `Batch`, `Shipment`, `Notification`, `Shipment status history / tracking timeline`.
11. Permissions or role restrictions: Destination staff can set arrival; actions must still stay within the PRD status rules.
12. Whether EN/FR translation is required at launch: Yes.

### D4. Batch Collection Dashboard (`Launch Core`)

1. Screen name: Batch Collection Dashboard
2. Who can access it: Vendor Staff, Vendor Admin, Vendor Owner.
3. Purpose of the screen: Manage receiver pickup after arrival and target only uncollected parcels for reminders.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: total parcels card, collected list, pending collection list, collection rate, days since arrival, `Send Reminder to Uncollected`, export list action, search by tracking number, receiver name, or phone number, proof photo capture, and `Mark as Collected`.
5. Empty state: If no shipments in the batch are awaiting collection, show `All parcels collected`.
6. Error state: Search failure, collection update failure, or reminder send failure.
7. Success state: Collected parcels move out of the pending list, proof photo is stored with the collection event, and reminders target only remaining uncollected receivers.
8. Navigation entry point: Batch detail after arrival or dashboard quick action for batches.
9. What data/entities it reads: `Batch`, `Shipment`, `Customer`, `Branch`, `Notification`.
10. What data/entities it writes: `Shipment`, `Notification`, `Shipment status history / tracking timeline`.
11. Permissions or role restrictions: Staff can mark collected; payment and broader reporting remain role-restricted elsewhere.
12. Whether EN/FR translation is required at launch: Yes.

### D5. Batch Manifest (`P1 Follow-On`)

1. Screen name: Batch Manifest
2. Who can access it: Vendor Staff, Vendor Admin, Vendor Owner.
3. Purpose of the screen: Produce a printable list of all items in a batch.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: manifest header, shipment table with sender, receiver, weight, tracking number, and destination, plus `Print` and `Download` actions.
5. Empty state: `No shipments in this batch`.
6. Error state: Manifest generation failure.
7. Success state: Manifest is printable and downloadable.
8. Navigation entry point: Batch detail screen.
9. What data/entities it reads: `Batch`, `Shipment`, `Customer`.
10. What data/entities it writes: None to core business data.
11. Permissions or role restrictions: Same as batch access.
12. Whether EN/FR translation is required at launch: Not required if this screen stays post-launch within Phase 1.

## E. Staff / settings / subscription screens

### E1. Staff Management (`Launch Core`)

1. Screen name: Staff Management
2. Who can access it: Vendor Owner only.
3. Purpose of the screen: Add, remove, and manage staff with role-based access.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: staff table with name or email, role, status, branch assignment, add staff form, change role action, activate/deactivate action, remove staff action.
5. Empty state: `No staff added yet` with `Add Staff` CTA.
6. Error state: Invite/save failure, duplicate email, invalid role change, or permission denial.
7. Success state: Staff member is added or updated and access rules take effect.
8. Navigation entry point: Dashboard quick action or settings area.
9. What data/entities it reads: `VendorStaff`, `Branch`, `Auth user account`.
10. What data/entities it writes: `VendorStaff`.
11. Permissions or role restrictions: Only Owner can manage staff.
12. Whether EN/FR translation is required at launch: Yes.

### E2. Vendor Settings: Company Profile & Default Origin (`Launch Core`)

1. Screen name: Vendor Settings: Company Profile & Default Origin
2. Who can access it: Vendor Owner only.
3. Purpose of the screen: Manage vendor identity and default shipping origin.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: company name, vendor prefix, logo upload, email, default origin country/city, UI language, `Save Settings`.
5. Empty state: Show current saved settings or guided empty prompts if setup is incomplete.
6. Error state: Duplicate vendor prefix, invalid logo upload, or save failure.
7. Success state: Settings save and immediately affect intake defaults and labels.
8. Navigation entry point: Dashboard quick action or settings nav.
9. What data/entities it reads: `Vendor`, `Subscription state record`.
10. What data/entities it writes: `Vendor`.
11. Permissions or role restrictions: Owner only.
12. Whether EN/FR translation is required at launch: Yes.

### E3. Branch Management (`Launch Core`)

1. Screen name: Branch Management
2. Who can access it: Vendor Owner only.
3. Purpose of the screen: Create and maintain origin and destination branch records.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: branch table, branch name, side, address, location link, phone, WhatsApp, opening hours, manager, required ID for pickup, special instructions, `Add Branch`, `Edit Branch`, and `Save`.
5. Empty state: `No branches configured yet` with `Add Branch` CTA.
6. Error state: Missing required branch fields, invalid phone or location link, or save failure.
7. Success state: Branch is saved and becomes available in batches, pickup, and notifications.
8. Navigation entry point: Setup wizard or settings nav.
9. What data/entities it reads: `Branch`, `VendorStaff`.
10. What data/entities it writes: `Branch`.
11. Permissions or role restrictions: Owner only.
12. Whether EN/FR translation is required at launch: Yes.

### E4. Pricing & Insurance Settings (`Launch Core`)

1. Screen name: Pricing & Insurance Settings
2. Who can access it: Vendor Owner only.
3. Purpose of the screen: Define the vendor's pricing and insurance defaults.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: pricing model selector, rate per kg, flat fee per item, default currency, insurance mode, insurance rate, insurance flat fee, minimum premium, examples or preview calculations, `Save Settings`.
5. Empty state: Guided first-time setup state with examples.
6. Error state: Invalid monetary values, conflicting settings, or save failure.
7. Success state: Intake auto-calculation uses the saved defaults.
8. Navigation entry point: Setup wizard or settings nav.
9. What data/entities it reads: `Vendor`.
10. What data/entities it writes: `Vendor`.
11. Permissions or role restrictions: Owner only.
12. Whether EN/FR translation is required at launch: Yes.

### E5. Notification Settings & Notification Log (`Launch Core`)

1. Screen name: Notification Settings & Notification Log
2. Who can access it: Vendor Owner for settings; Vendor Admin and Owner for log review.
3. Purpose of the screen: Configure outbound WhatsApp behavior through Meta Cloud API direct and review delivery results.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: linked CarryMatch logistics number display (read-only), company-owned Meta Business Manager / WhatsApp Business Account status summary, permanent system user token connection status, trigger toggles, message templates by trigger event, reminder schedule settings, email fallback section, notification log table with recipient, trigger, channel, status, sent time, and failure reason, `Save Settings`.
5. Empty state: No messages sent yet or no custom templates yet.
6. Error state: Template save failure, invalid schedule, or log load failure.
7. Success state: Notification settings save and logs show delivery states such as sent, delivered, read, or failed from Meta webhook events handled through Vercel API routes.
8. Navigation entry point: Dashboard quick action `Notifications` or settings nav.
9. What data/entities it reads: `Vendor`, `Notification`.
10. What data/entities it writes: `Vendor`, `Notification` settings data, reminder configuration stored with vendor settings.
11. Permissions or role restrictions: Staff should not change notification settings; log access can be limited by role if needed.
12. Whether EN/FR translation is required at launch: Yes.

### E6. Label Branding Settings (`Launch Core`)

1. Screen name: Label Branding Settings
2. Who can access it: Vendor Owner only.
3. Purpose of the screen: Control logo and branding on printable labels and branded notifications.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: logo upload, branding preview, vendor name display preview, plan-based feature messaging, `Save Branding`.
5. Empty state: Default CarryMatch branding preview.
6. Error state: Upload failure or unsupported file.
7. Success state: New branding appears on labels and allowed vendor-branded surfaces.
8. Navigation entry point: Settings nav or setup wizard.
9. What data/entities it reads: `Vendor`, `Subscription state record`.
10. What data/entities it writes: `Vendor`.
11. Permissions or role restrictions: Owner only; branded behavior depends on subscription tier.
12. Whether EN/FR translation is required at launch: Yes.

### E7. Subscription & Coupon Code (`Launch Core`)

1. Screen name: Subscription & Coupon Code
2. Who can access it: Vendor Owner only.
3. Purpose of the screen: Let the vendor subscribe, renew, or activate service with a coupon code.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: current plan card, days remaining, grace-period banner when relevant, Free / Pro plan options, Stripe checkout entry point, coupon code input, `Apply Coupon`, renewal reminders summary.
5. Empty state: Free-tier state with upgrade CTA.
6. Error state: Invalid or expired coupon code, payment failure, or subscription load failure.
7. Success state: Plan activates or renews and restrictions update immediately.
8. Navigation entry point: Setup wizard, settings nav, or subscription expiry banner.
9. What data/entities it reads: `SubscriptionPlan`, `CouponCode`, `Vendor`, `Subscription state record`.
10. What data/entities it writes: `CouponCode`, `Subscription state record`, possibly `Vendor` plan metadata.
11. Permissions or role restrictions: Owner only.
12. Whether EN/FR translation is required at launch: Yes.

## F. Admin screens

### F1. Vendor Application Review (`Launch Core`)

1. Screen name: Vendor Application Review
2. Who can access it: Super Admin and CML Admin.
3. Purpose of the screen: Review partner applications and approve, reject, or request more information.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: application queue table, application detail panel, company/business details, corridors, volume, office addresses, references, `Approve`, `Reject`, and `Request More Info` actions, rejection reason field.
5. Empty state: `No applications awaiting review`.
6. Error state: Queue load failure or approval/rejection save failure.
7. Success state: Application status updates and approval creates the vendor and owner record.
8. Navigation entry point: Admin area landing page.
9. What data/entities it reads: `VendorApplication`.
10. What data/entities it writes: `VendorApplication`, `Vendor`, `VendorStaff`, `Notification`.
11. Permissions or role restrictions: Admin-only; vendors cannot access.
12. Whether EN/FR translation is required at launch: Not strictly required. The PRD allows admin interfaces to launch English-only if needed.

### F2. Coupon Code Management (`Launch Core`)

1. Screen name: Coupon Code Management
2. Who can access it: Super Admin and CML Admin.
3. Purpose of the screen: Generate and track prepaid subscription coupon codes.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: code list, code format preview, plan binding for Free or Pro, duration, generated by, sold by agent, activation state, expiration, bulk generation action, single-code generation action.
5. Empty state: `No coupon codes generated yet`.
6. Error state: Generation failure or list load failure.
7. Success state: New codes are created and available for vendor activation.
8. Navigation entry point: Admin area.
9. What data/entities it reads: `CouponCode`, `SubscriptionPlan`.
10. What data/entities it writes: `CouponCode`.
11. Permissions or role restrictions: Admin-only.
12. Whether EN/FR translation is required at launch: Not strictly required. The PRD allows admin interfaces to launch English-only if needed.

### F3. Basic Vendor Oversight (`Launch Core`)

1. Screen name: Basic Vendor Oversight
2. Who can access it: Super Admin and CML Admin.
3. Purpose of the screen: Give platform admins limited cross-vendor visibility for oversight, dispute handling, and launch operations.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: vendor list, vendor status, subscription state, contact info, application state, and basic drill-in action to vendor profile or application history.
5. Empty state: `No vendors yet`.
6. Error state: Vendor list load failure.
7. Success state: Admin can monitor vendor onboarding and current account state.
8. Navigation entry point: Admin area.
9. What data/entities it reads: `Vendor`, `VendorStaff`, `VendorApplication`, `Subscription state record`.
10. What data/entities it writes: `Vendor` if status changes such as suspension are allowed here.
11. Permissions or role restrictions: Admin-only; this is the approved cross-vendor bypass area.
12. Whether EN/FR translation is required at launch: Not strictly required. The PRD allows admin interfaces to launch English-only if needed.

## G. Public tracking screen

### G1. Public Tracking Page (`Launch Core`)

1. Screen name: Public Tracking Page
2. Who can access it: Anyone with the tracking URL or QR code.
3. Purpose of the screen: Give sender or receiver a simple live view of shipment status without needing an account or app download.
4. Exact fields, sections, tables, cards, buttons, and actions on that screen: tracking number, shipment summary, origin and destination, shipping mode, current status with timestamp, full status history timeline, ETA if set, pickup office details when status is arrived or later, vendor contact info, optional input to search another tracking number.
5. Empty state: `Enter a tracking number` if the page supports direct lookup; otherwise not applicable.
6. Error state: `Tracking number not found` or general load failure.
7. Success state: Customer sees the latest status and pickup information clearly.
8. Navigation entry point: QR code on label, direct tracking link, or manual public URL entry.
9. What data/entities it reads: `Shipment`, `Shipment status history / tracking timeline`, `Branch`, `Vendor`.
10. What data/entities it writes: None.
11. Permissions or role restrictions: Public page must show only status timeline, ETA, pickup details, and vendor contact info; it must not show pricing, payment status, or vendor revenue.
12. Whether EN/FR translation is required at launch: Yes. The PRD treats the tracking page as launch-critical bilingual content.
