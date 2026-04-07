# CML V1 Launch-Core Checklist

## 1. Included in launch-core

1. [ ] Name: Landing Page  
Why it is launch-core: It is the public front door for vendors and the first step into pricing, sign-in, and partner application.  
Depends on what: Final Phase 1 CML messaging, public navigation, bilingual copy.  
Done when: A visitor can understand what CarryMatch Logistics does and can click through to pricing, sign in, or apply as a partner in English and French.

2. [ ] Name: Pricing Page  
Why it is launch-core: The PRD requires public pricing and subscription understanding before vendor onboarding can work.  
Depends on what: Final Free / Pro plan definitions and coupon-code explanation.  
Done when: A visitor can clearly compare Free and Pro, understand Stripe versus coupon-code payment, and move into application or sign-in without confusion.

3. [ ] Name: Sign Up Page  
Why it is launch-core: A vendor cannot apply or operate without first creating an account.  
Depends on what: Auth model, validation rules, and basic post-sign-up routing.  
Done when: A new user can create an account successfully, sees clear validation errors if something is wrong, and is routed into the onboarding flow.

4. [ ] Name: Login Page  
Why it is launch-core: Existing users must be able to get back into the correct part of the product based on their current status.  
Depends on what: Auth model, access-state routing rules, vendor/application lookup logic.  
Done when: A user can sign in and is sent to the right next screen: application form, application status, setup wizard, or vendor dashboard.

5. [ ] Name: Partner Application Page  
Why it is launch-core: The PRD says access is gated and vendors must apply before they can use the dashboard.  
Depends on what: VendorApplication data model, required application fields, sign-up/auth flow.  
Done when: A vendor can submit all required business details, sees validation errors if needed, and lands on a clear application-submitted state.

6. [ ] Name: Application Status Page  
Why it is launch-core: Applicants must be blocked from the dashboard until approved, and they need a clear pending/rejected state.  
Depends on what: VendorApplication status rules, auth routing, rejection reason handling.  
Done when: Pending users see an under-review state, rejected users see the rejection reason and a reapply option, and active vendors are redirected out.

7. [ ] Name: Admin Vendor Application Review  
Why it is launch-core: Someone must be able to approve vendors, otherwise no real vendor can get into the product.  
Depends on what: Admin roles, VendorApplication queue, approve/reject actions, vendor creation rules.  
Done when: A Super Admin or CML Admin can review an application, approve it, reject it with a reason, or request more info without touching the database manually.

8. [ ] Name: First-Login Setup Wizard  
Why it is launch-core: Approved vendors still need prefix, branch, pricing, insurance, branding, and subscription setup before operations begin.  
Depends on what: Vendor model, Branch model, Free / Pro subscription plan model, coupon-code flow, vendor prefix uniqueness rule.  
Done when: A newly approved owner can complete setup end to end and arrive on the dashboard with a usable vendor account.

9. [ ] Name: Vendor Dashboard  
Why it is launch-core: This is the operational home screen and the quickest path into daily work.  
Depends on what: Vendor access gating, shipment counts, batch counts, notifications summary, role-aware navigation.  
Done when: An active vendor can land on the dashboard, see live operational summary cards, and open the core actions from one place.

10. [ ] Name: Customer Lookup / CRM  
Why it is launch-core: Phone-based customer memory is one of the core Phase 1 promises in the PRD.  
Depends on what: Customer model, vendor-scoped customer lookup, shipment history lookup.  
Done when: Staff can enter a phone number and, if the customer exists for that vendor, see their basic profile, frequent receivers, and past shipments.

11. [ ] Name: New Shipment Intake  
Why it is launch-core: The intake flow is the center of the Phase 1 product and must work fast.  
Depends on what: Vendor settings defaults, Customer model, Shipment model, pricing logic, insurance logic, tracking-number generation rules.  
Done when: Staff can create a shipment from start to finish, get a valid tracking number, and save sender, receiver, parcel, pricing, and payment data correctly.

12. [ ] Name: Shipment Created Confirmation  
Why it is launch-core: Staff need a clear end state after intake so they can print a label, create the next shipment, or return to the dashboard.  
Depends on what: Successful shipment creation and tracking number generation.  
Done when: After creating a shipment, the user sees the saved shipment summary and can move straight to label printing, another shipment, or the dashboard.

13. [ ] Name: Shipment List  
Why it is launch-core: Vendors need a working list to find, filter, and review shipments after intake.  
Depends on what: Shipment model, batch links, vendor-scoped filtering, basic search and status filters.  
Done when: A vendor can open the shipment list, search by key fields, filter by core criteria, and open a shipment detail page.

14. [ ] Name: Shipment Detail  
Why it is launch-core: Shipment detail is where the vendor updates status, reviews data, and controls the operational record.  
Depends on what: Shipment model, status state machine, payment fields, timeline/history data, role restrictions.  
Done when: A vendor can view the full shipment record and only the valid next actions are shown for that shipment’s current status.

15. [ ] Name: Scan & Update  
Why it is launch-core: The PRD calls out scan-based updates as a primary operational shortcut.  
Depends on what: Shipment lookup by barcode/QR or tracking number, status update rules, camera/manual fallback behavior.  
Done when: A user can scan or manually enter a tracking number, pull up the right shipment, and apply a valid status update quickly.

16. [ ] Name: Shipping Label Print  
Why it is launch-core: Printable labels with QR code and barcode are a key Phase 1 value point in the PRD.  
Depends on what: Shipment data, vendor branding, QR generation, barcode generation, label PDF generation, plan restrictions.  
Done when: A valid shipment can generate a printable label in the required format and the QR code points to the public tracking page.

17. [ ] Name: Public Tracking Page  
Why it is launch-core: The PRD treats public tracking as a launch requirement and a major reason customers stop calling vendors.  
Depends on what: Public tracking URL structure, Shipment data, status timeline, pickup details, vendor contact info.  
Done when: Anyone with the tracking link can see shipment status, ETA, pickup details, and vendor contact info, but cannot see pricing, payment, or vendor revenue.

18. [ ] Name: Batch List  
Why it is launch-core: Phase 1 is built around grouping shipments into batches and moving them together.  
Depends on what: Batch model, batch status values, vendor-scoped batch querying.  
Done when: A vendor can create a batch, see all batches, and open a batch for further management.

19. [ ] Name: Batch Detail & Management  
Why it is launch-core: Vendors must be able to add/remove shipments, lock a batch, set ETA, and ship it.  
Depends on what: Batch model, Shipment model, shipment-to-batch relationship rules, notification trigger hooks.  
Done when: A vendor can add pending shipments to a batch, remove them safely, lock the batch, set ETA, and mark the batch as shipped.

20. [ ] Name: Batch Arrival  
Why it is launch-core: The pickup flow cannot begin until a batch can be marked as arrived with destination-office details.  
Depends on what: Branch model, Batch model, arrived-state rules, pickup notification trigger.  
Done when: A vendor can mark a batch as arrived, select the pickup branch, confirm pickup details, and trigger the correct arrival notifications.

21. [ ] Name: Batch Collection Dashboard  
Why it is launch-core: The PRD requires real-time pickup management and reminder targeting for uncollected parcels.  
Depends on what: Batch model, Shipment collected-state updates, proof-photo capture, reminder targeting logic, search by tracking/name/phone.  
Done when: Staff can see collected versus uncollected items, mark a parcel as collected with proof photo, and send reminders only to receivers who still have pending pickup.

22. [ ] Name: Payments Tracking  
Why it is launch-core: Vendors need payment records, and the PRD calls out this pain point directly.  
Depends on what: Shipment payment fields, payment status enum, role restrictions for financial access.  
Done when: An Admin or Owner can view paid/partial/unpaid shipments, record payment details, and see amount paid and amount due update correctly.

23. [ ] Name: Staff Management  
Why it is launch-core: The PRD explicitly says lack of staff management is a current problem.  
Depends on what: VendorStaff model, role matrix, branch assignment rules, owner-only permissions.  
Done when: An Owner can add staff, assign roles, assign branches if needed, activate/deactivate access, and those permissions change what staff can do.

24. [ ] Name: Vendor Settings: Company Profile & Default Origin  
Why it is launch-core: Vendor identity, prefix, logo, and default origin affect intake, labels, and onboarding completion.  
Depends on what: Vendor model, prefix uniqueness rule, logo upload support, language setting support.  
Done when: An Owner can save vendor identity settings and the saved values are reflected in intake defaults and branding.

25. [ ] Name: Branch Management  
Why it is launch-core: Pickup, arrival, and office operations all depend on having real branch records.  
Depends on what: Branch model, owner permissions, field validation for office details.  
Done when: An Owner can add and edit origin and destination branches with address, hours, phone, ID requirements, and special instructions.

26. [ ] Name: Pricing & Insurance Settings  
Why it is launch-core: Intake pricing and insurance defaults come from vendor settings in the PRD.  
Depends on what: Vendor pricing model, currency rule, insurance calculation rule, owner permissions.  
Done when: An Owner can save pricing and insurance defaults and those defaults automatically appear in the shipment intake flow.

27. [ ] Name: Notification Settings & Notification Log  
Why it is launch-core: WhatsApp-first communication and delivery visibility are required for Phase 1.  
Depends on what: Vendor notification settings, Notification model, reminder schedule rules, Meta Cloud API direct configuration, Vercel webhook handling, permanent system user token, and email fallback rules.  
Done when: An Owner can configure notification behavior for the dedicated CarryMatch logistics number and an Admin or Owner can see sent, delivered, read, and failed messages in a log fed by Meta delivery events.

28. [ ] Name: Label Branding Settings  
Why it is launch-core: The PRD ties label branding directly to the vendor experience and plan behavior.  
Depends on what: Vendor logo handling, subscription-tier rules, label generation.  
Done when: An Owner can upload branding assets and the allowed branding appears on labels and related branded surfaces.

29. [ ] Name: Subscription & Coupon Code  
Why it is launch-core: The PRD says launch includes Stripe plus coupon-code subscription activation, not one or the other.  
Depends on what: Free / Pro subscription plan setup, Stripe flow, coupon-code validation, grace-period rules, owner permissions.  
Done when: An Owner can see current Free or Pro plan status, pay online, enter a valid coupon code, and the account access state updates correctly.

30. [ ] Name: Admin Coupon Code Management  
Why it is launch-core: Coupon codes are part of the Phase 1 commercial model and must be created by admins.  
Depends on what: CouponCode model, Free / Pro subscription plan model, admin permissions.  
Done when: A Super Admin or CML Admin can generate single or bulk coupon codes tied to a launch plan and duration and can see their activation state later.

31. [ ] Name: Admin Vendor Oversight  
Why it is launch-core: Platform admins need limited cross-vendor oversight for launch operations, support, and account control.  
Depends on what: Vendor model, VendorApplication model, subscription-state data, admin permissions.  
Done when: A Super Admin or CML Admin can see vendor account state, application state, and subscription state from one admin view.

## 2. Build order

1. Sign Up Page
2. Login Page
3. Landing Page
4. Pricing Page
5. Partner Application Page
6. Application Status Page
7. Admin Vendor Application Review
8. First-Login Setup Wizard
9. Vendor Settings: Company Profile & Default Origin
10. Branch Management
11. Pricing & Insurance Settings
12. Subscription & Coupon Code
13. Admin Coupon Code Management
14. Vendor Dashboard
15. Customer Lookup / CRM
16. New Shipment Intake
17. Shipment Created Confirmation
18. Shipment List
19. Shipment Detail
20. Payments Tracking
21. Scan & Update
22. Batch List
23. Batch Detail & Management
24. Batch Arrival
25. Batch Collection Dashboard
26. Notification Settings & Notification Log
27. Shipping Label Print
28. Label Branding Settings
29. Staff Management
30. Admin Vendor Oversight
31. Public Tracking Page

## 3. Blockers before UI coding

- The Phase 1 launch slice must stay locked to strict launch-core only, with P1 items explicitly deferred.
- The launch commercial model must stay locked to Free + Pro only before pricing, onboarding, coupon, and subscription UI is built.
- The Phase 1 CML data model must be agreed: Vendor, VendorStaff, Branch, Customer, Shipment, Batch, Notification, SubscriptionPlan, CouponCode, VendorApplication, shipment status history, and subscription state.
- The canonical shipment status state machine must be locked before any shipment or batch UI is built.
- Tracking-number generation rules must be locked before intake or label UI is built.
- Collection proof photo must be treated as part of the launch-core pickup flow before batch collection UI is built.
- Vendor access states must be locked: unauthenticated, no vendor record, pending, rejected, active free, active paid, grace period, expired past grace, suspended.
- Role permissions must be locked for Staff, Admin, Owner, Super Admin, and CML Admin before dashboard, shipment, payment, staff, and admin screens are built.
- Vendor-scoped data-isolation rules must be locked before any list, detail, CRM, or admin UI is built.
- Pricing, insurance, and payment recording rules must be locked before intake and payments UI is built.
- The required bilingual copy system for EN/FR must be set before launch-core UI coding starts.
- A company-owned Meta Business Manager and WhatsApp Business Account must be set up for launch before notification UI and trigger flows are built.
- One dedicated CarryMatch logistics number for Phase 1 CML must be ready before WhatsApp template and notification testing work starts.
- The Phase 1 CML WhatsApp path is Meta Cloud API direct; there is no BSP-selection step in launch-core.
- Meta webhook handling must be built through Vercel API routes before delivery-status-driven notification flows are implemented.
- Meta token strategy must use a permanent system user token from the start before real WhatsApp integration work begins.
- The email fallback provider decision must be made before notification UI and trigger flows are built.
- The subscription path must be decided in implementation terms for the locked Free + Pro launch model: Stripe flow, coupon-code flow, grace-period behavior, and renewal behavior.
- The public tracking URL format and QR-code destination must be decided before shipping-label and public-tracking UI is built.

## 4. Later / not in launch-core

- Batch Manifest
- Closeout / End of Day
- Reports & Analytics
- Issues Management
- Claims / Insurance
- Customer Management full screen
- Broader admin tooling beyond core review, coupon management, and vendor oversight
- Dashboard branch + mode filters
- Quick re-ship from customer history
- Customer notes in CRM
