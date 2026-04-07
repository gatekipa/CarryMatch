# CML V1 Build Blueprint

This document turns the CarryMatch PRD into a practical Phase 1 build plan for Vendor Logistics (CML) only.

## 1. Phase 1 product goal

The Phase 1 goal is to launch CarryMatch Logistics (CML) as a bilingual web app for shipping vendors.

For the current build, Phase 1 is frozen to the launch-core slice only. The later Phase 1 follow-on items stay out until launch-core is complete and accepted.

In plain terms, V1 should let a vendor:

- apply and get approved
- set up their business, branches, pricing, insurance, and subscription
- create shipments quickly
- manage batches
- notify senders and receivers through WhatsApp
- print labels
- let customers track shipments online
- record payments
- capture proof photo at collection
- manage staff access

The PRD makes the business outcome clear: replace paper, memory, and manual WhatsApp chaos with a professional digital workflow that vendors can actually use every day.

The locked commercial model for this launch is Free + Pro only.

## 2. Exact user roles for Phase 1

These are the roles named in the PRD for Phase 1:

- Vendor Owner: full control of the vendor account, staff, branches, settings, subscription, and all operational data
- Vendor Admin: management access, including financials, reports, settings, and broader operational visibility
- Vendor Staff: operational access for intake, shipment updates, batches, and limited customer history
- Sender: customer dropping off a parcel; mainly interacts through receipts, tracking, and WhatsApp updates
- Receiver: customer collecting a parcel; mainly interacts through WhatsApp updates and the public tracking page
- Super Admin: platform-level admin for CarryMatch
- CML Admin: module-level admin for the logistics product

The PRD also gives exact permission boundaries:

- Staff can create shipments, view own-branch shipments, update shipment status, manage batches, and see limited customer history
- Staff cannot view pricing/payment info, record payments, manage staff, manage branches, change settings, or change subscription
- Admin can view all vendor shipments, edit shipments after creation, cancel shipments, record payments, and view reports
- Owner is the only vendor-side role that can manage staff, manage branches, change vendor settings, and change subscription

## 3. Exact modules/screens to build for V1

### Core launch screens from the PRD

This is the frozen launch-core build for Phase 1 CML.

- Landing page
- Pricing page
- Partner application page
- Sign up page
- Login page
- Application status page
  - under review
  - rejected with reason and reapply option
  - suspended account state
- First-login setup wizard
  - vendor prefix
  - default origin
  - destination branches
  - pricing model
  - insurance model
  - logo upload
  - subscription plan or coupon entry
- Vendor dashboard
  - KPI cards
  - quick actions
- New Shipment intake flow
  - Step 1: origin and destination
  - Step 2: sender details
  - Step 3: receiver details
  - Step 4: parcel details
  - Step 5: pricing and insurance
  - Step 6: confirm and create
- Shipment created confirmation screen
- Shipment list screen
- Shipment detail screen
  - valid next-status actions only
  - payment info
  - notes
  - tracking summary
- Customer lookup and CRM panel
  - phone-first lookup
  - frequent receivers
  - customer history
- Batch list screen
- Batch detail and management screen
  - create batch
  - add/remove shipments
  - lock batch
  - ship batch
  - set ETA
- Batch arrival screen
  - pickup office
  - pickup address
  - hours
  - ID requirements
  - special instructions
- Batch collection dashboard
  - total parcels
  - collected
  - pending collection
  - collection rate
  - proof photo at collection
  - send reminder
  - days since arrival
  - export list
- Scan and Update screen
- Payments tracking screen
- Staff management screen
- Vendor settings screens
  - company profile
  - default origin
  - insurance configuration
  - notification configuration
  - branches
  - label branding
  - subscription and coupon code
- Notification log and notification settings screen
- Shipping label print screen
  - single label
  - batch print
- Public tracking page

### Admin-side screens needed for Phase 1

- Vendor application review screen for Super Admin / CML Admin
- Coupon code generation and management screen
- Basic vendor oversight screen for platform admins

### Phase 1 items that are in the PRD but can follow after the core launch

These are still part of Phase 1, but they are not part of the frozen launch-core build:

- Batch manifest printable view
- Closeout / end-of-day summary
- Reports and analytics
- Issues management
- Claims / insurance workflow
- Customer management full screen
- Admin panel beyond the core review and coupon workflows

## 4. Exact entities/tables needed for V1

These are the main business records explicitly named in the PRD:

- Vendor
- VendorStaff
- Branch
- Customer
- Shipment
- Batch
- Notification
- SubscriptionPlan
- CouponCode
- VendorApplication

These support records are also needed to make the PRD work in a real app:

- Auth user account
  - because Vendor, VendorStaff, and VendorApplication all reference `user_id`
- Shipment status history / tracking timeline
  - because the public tracking page must show a full status timeline, not just the latest status
- Subscription state record
  - because the PRD requires free tier, paid tier, grace period, expiry, and coupon activation behavior

For V1, the Shipment record needs to carry more than basic parcel info. From the PRD it must also hold:

- tracking number
- sender and receiver references
- origin and destination
- parcel details
- weight and quantity
- category
- pricing data
- payment status
- notification channel
- insurance revenue
- shipment status
- collection fields

## 5. Exact status enums/state machines needed for V1

### Shipment status state machine

This is the most important state machine in the PRD:

- `draft` -> `pending`
- `pending` -> `in_batch`, `cancelled`
- `in_batch` -> `in_transit`, `pending`, `cancelled`
- `in_transit` -> `arrived`, `delayed`
- `delayed` -> `in_transit`, `arrived`
- `arrived` -> `collected`, `returned`
- `collected` -> terminal
- `returned` -> terminal
- `cancelled` -> terminal

The PRD is explicit that:

- shipment status must be an enum, not free text
- the UI must only show valid next actions
- there must not be a generic status dropdown

### Other required enums and states from the PRD

- Vendor status: `pending`, `active`, `suspended`
- Vendor application status: `pending`, `approved`, `rejected`
- Vendor staff role: `owner`, `admin`, `staff`
- Branch side: `origin`, `destination`
- Pricing model: `per_kg`, `flat_fee`, `manual`
- Insurance mode: `flat`, `percentage`
- Shipment payment status: `paid`, `partial`, `unpaid`
- Shipment payment method: `cash`, `zelle`, `cashapp`, `mobile_money`, `card`, `other`
- Batch status: `open`, `locked`, `shipped`, `arrived`, `collecting`, `completed`
- Notification channel: `whatsapp`, `email`
- Notification delivery status: `sent`, `delivered`, `read`, `failed`
- Coupon code status: `unused`, `active`, `expired`
- UI language / preferred language: `en`, `fr`
- Shipping mode: `air`, `sea`, `road-bus`

### Access/account states that must be enforced

The PRD also defines account access states even if they are not all stored as one enum:

- unauthenticated
- authenticated with no vendor record
- application pending
- application rejected
- vendor active on free tier
- vendor active on paid plan
- subscription expired in grace period
- subscription expired past grace period
- vendor suspended

## 6. Exact integrations needed for V1

The PRD calls for these integrations for Phase 1:

- Supabase
  - auth
  - PostgreSQL database
  - storage
  - edge functions
- Hosting
  - Vercel or Supabase Hosting
- Stripe
  - online subscription billing
- Coupon code subscription flow
  - for cash-based vendor subscriptions
- WhatsApp Cloud API direct
  - company-owned Meta Business Manager and WhatsApp Business Account for launch
  - one dedicated CarryMatch logistics number for all Phase 1 CML vendors
  - Meta webhook handling through Vercel API routes
  - permanent system user token from the start
- Email fallback provider
  - Resend or SendGrid
- QR code generation
  - for the public tracking page URL on labels
- Barcode generation
  - Code 128 for shipment labels
- PDF label generation
  - server-side generation for single and batch labels

## 7. What is explicitly OUT of V1

These items are clearly outside Phase 1 in the PRD:

- traveler trip posting
- sender delivery request posting
- trip and request matching
- traveler KYC
- in-app messaging for matched parties
- ratings and reviews
- full bus ticketing product
- route and schedule management for passenger ticketing
- seat selection and online bus ticket sales
- passenger manifests and QR ticket validation
- native mobile apps at launch
- multi-currency display
- WhatsApp payment links
- customer loyalty program
- public vendor profile
- WhatsApp chatbot for tracking

These items are also not part of the first core launch slice, even though they are still in Phase 1 later:

- closeout
- advanced reports
- issues management
- claims workflow
- broader admin tooling beyond review and coupon management

## 8. Recommended build order for the new app

1. Build the app shell, auth, bilingual setup, and role-aware routing.
2. Build vendor onboarding, application review, gated access, and application status pages.
3. Build the first-login setup wizard and core vendor settings for prefix, origin, branches, pricing, insurance, branding, and Free / Pro subscription setup.
4. Build customer lookup and CRM basics so the intake flow can actually save time.
5. Build shipment intake, tracking-number generation, and shipment creation.
6. Build shipment list, shipment detail, payment recording, and the exact shipment status state machine.
7. Build batch management, batch shipping, batch arrival, pickup flow, collection proof photo, and collection dashboard.
8. Build Meta Cloud API direct notification triggers, email fallback, and notification logs.
9. Build the public tracking page and shipping label generation.
10. Build staff management, permissions enforcement, and subscription handling.
11. Stop at launch-core. Do not start the Phase 1 follow-on items until launch-core is complete and accepted.

## 9. Launch blockers from the PRD

If these are not done, the product is not really meeting the Phase 1 PRD and the approved launch direction:

- Full bilingual support in English and French for the launch-critical experience
- Gated partner onboarding with application review and approval before dashboard access
- Shipment intake flow that can create a shipment fast and reliably
- Globally unique tracking number generation with the required format
- Canonical shipment status state machine with only valid next actions
- Vendor-scoped data isolation so one vendor can never see another vendor's data
- Working WhatsApp notification flow through Meta Cloud API direct, with approved templates and email fallback
- Company-owned Meta Business Manager and WhatsApp Business Account set up for launch
- One dedicated CarryMatch logistics number ready for Phase 1 CML
- Meta webhook handling in Vercel API routes
- Permanent system user token in place from the start
- Public tracking page that shows status, ETA, and pickup details but hides pricing and revenue
- Batch flow from create to ship to arrival to collection, including proof photo at collection
- Subscription collection path for launch, including Free + Pro, Stripe, and coupon code activation

## 10. Questions that still need founder decisions before coding

The PRD is strong, but these decisions still need a clear founder answer before build work starts:

- Which email fallback provider should be used first: Resend or SendGrid?
- Which hosting path should be used for launch: Vercel or Supabase Hosting?
- Who will own Meta template submission, approval follow-up, and template updates during launch?
- Does the Month 1 to Month 2 WhatsApp timeline still stand after the Meta Cloud API direct change, or should it be re-baselined?

The safest next step is to keep the build anchored to the frozen launch-core checklist before coding starts.
