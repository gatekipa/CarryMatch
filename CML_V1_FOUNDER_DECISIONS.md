# CML V1 Founder Decisions

## A. Must decide before coding

### Decision 1

1. Decision name: Final launch-core cut line
2. Approved decision: Strict launch-core only
3. Why this is locked now: The build checklist, screen map, and acceptance criteria only stay stable if the first release stays inside the agreed launch-core boundary.
4. What this means for the build: The team builds only the launch-core screens and modules already listed for CML V1 and does not pull later items into day one.
5. Risk if changed later: The first release will expand mid-build, delivery will slip, and testing will lose focus.

### Decision 2

1. Decision name: Day-one subscription tiers
2. Approved decision: Free + Pro only
3. Why this is locked now: Pricing, onboarding, coupon handling, and account access rules need one stable commercial model before implementation starts.
4. What this means for the build: Phase 1 CML launch is built around Free and Pro only, without adding Enterprise launch requirements.
5. Risk if changed later: Pricing, coupon setup, renewal logic, and access gating may need rework.

### Decision 3

1. Decision name: Collection proof photo in launch-core
2. Approved decision: Proof photo at launch
3. Why this is locked now: The collection flow and proof-of-pickup behavior need a fixed launch rule before screens and storage handling are built.
4. What this means for the build: Batch collection is built with proof photo included in the launch-core flow.
5. Risk if changed later: The pickup flow, storage behavior, and testing scope will need to be reopened.

### Decision 4

1. Decision name: Meta Business Manager and WhatsApp Business Account owner
2. Approved decision: Company-owned Meta Business Manager and WhatsApp Business Account set up now for launch
3. Why this is locked now: Meta Cloud API direct is the approved WhatsApp path, so ownership of the real launch setup cannot stay ambiguous.
4. What this means for the build: The team will implement WhatsApp against a company-owned Meta setup, not a founder-personal account or third-party account.
5. Risk if changed later: Meta setup, template approval, webhook ownership, and launch testing may all need to be reworked.

### Decision 5

1. Decision name: Launch WhatsApp phone number
2. Approved decision: One dedicated CarryMatch logistics number for all Phase 1 CML vendors
3. Why this is locked now: Notification templates, testing, operations, and customer-facing messaging all depend on one real launch number.
4. What this means for the build: Phase 1 CML notifications are built around one shared CarryMatch logistics number for launch.
5. Risk if changed later: Template approval, test flows, customer messaging, and support instructions may all need to change.

### Decision 6

1. Decision name: Meta webhook location
2. Approved decision: Vercel API routes
3. Why this is locked now: Direct Meta delivery status handling needs one fixed backend entry point before notification implementation starts.
4. What this means for the build: Meta webhooks for Phase 1 CML will terminate in Vercel API routes.
5. Risk if changed later: Notification backend work, verification flow, and deployment setup may need to be redesigned.

### Decision 7

1. Decision name: Meta launch token strategy
2. Approved decision: Permanent system user token from the start
3. Why this is locked now: Direct Meta integration should not be built around a temporary credential path that has to be replaced before launch.
4. What this means for the build: Phase 1 CML WhatsApp work starts on the production-style token approach from day one.
5. Risk if changed later: Credential handling, operational setup, and test environments may all need rework.

## B. Can decide during build

### Decision 1

1. Decision name: Email fallback provider
2. Why a decision is still needed: Phase 1 CML still includes email fallback when WhatsApp cannot be used, but the provider is not locked yet.
3. Options:
   - Resend
   - SendGrid
4. Recommended default option: Resend
5. Impact if not decided now: Core shipment and batch work can continue, but the notification fallback path cannot be finished end to end.

### Decision 2

1. Decision name: Hosting path for launch
2. Why a decision is still needed: The PRD still allows either Vercel or Supabase Hosting, and one launch path will need to be chosen before deployment is finalized.
3. Options:
   - Vercel
   - Supabase Hosting
4. Recommended default option: Vercel
5. Impact if not decided now: Product and backend work can continue, but deployment setup and launch runbooks will stay provisional.

### Decision 3

1. Decision name: Meta template submission and approval owner
2. Why a decision is still needed: With Meta Cloud API direct, someone must actively own template submission, approval follow-up, and template changes.
3. Options:
   - Founder owns it directly through launch
   - Founder assigns one named operations owner
   - Shared ownership across several people
4. Recommended default option: Founder owns it directly through launch
5. Impact if not decided now: Template approval work can stall and delay real notification testing.

### Decision 4

1. Decision name: Month 1 to Month 2 WhatsApp timeline after the Meta-direct change
2. Why a decision is still needed: The PRD timeline was written before the Meta-direct scope change was approved, so the schedule now needs a direct re-check.
3. Options:
   - Keep the current Month 1 to Month 2 timeline unchanged
   - Re-baseline the WhatsApp timeline after Meta setup is confirmed
   - Keep launch-core dates but move some WhatsApp work into a later subphase
4. Recommended default option: Re-baseline the WhatsApp timeline after Meta setup is confirmed
5. Impact if not decided now: The team may plan against a timeline that does not match the new setup and approval work.
