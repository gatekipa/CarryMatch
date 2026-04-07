# CML V1 Scope Change — WhatsApp Meta Cloud API Direct

## 1. Scope change summary

Phase 1 CML WhatsApp integration is no longer assumed to go through a Business Solution Provider.

The approved direction is now:

- use WhatsApp via Meta Cloud API direct
- keep WhatsApp as the primary notification channel for Phase 1 CML
- keep email fallback in scope
- keep the same Phase 1 CML product scope unless a later decision changes it

This is a delivery and architecture change, not a product-area expansion.

## 2. Previous assumption being replaced

The previous assumption being replaced is the BSP-based model described across the current project files:

- WhatsApp Business API would be used through a BSP
- provider examples included Twilio, 360dialog, and Interakt
- delivery receipts would come back from the BSP
- template management would be handled in a BSP-based flow
- notification sending was described as Edge Function -> BSP API -> WhatsApp message
- earlier founder-decision notes treated the open choice as "which BSP should we use?"

That assumption is now obsolete for Phase 1 CML.

## 3. New approved direction

The new approved direction is:

- CarryMatch Phase 1 CML will use Meta Cloud API direct for WhatsApp
- CarryMatch will integrate directly with Meta's WhatsApp Cloud API instead of routing through a BSP
- all current Phase 1 CML WhatsApp features stay in scope unless explicitly changed later
- all existing BSP-specific wording in project docs now needs to be replaced with Meta-direct wording

## 4. Files that must be updated next

These exact project files now need updates because of this change:

- `CarryMatch-PRD-v2.0.md`
- `CML_V1_BUILD_BLUEPRINT.md`
- `CML_V1_SCREEN_MAP.md`
- `CML_V1_LAUNCH_CORE_CHECKLIST.md`
- `CML_V1_FOUNDER_DECISIONS.md`

## 5. Build implications

Changing from BSP to Meta Cloud API direct means:

- CarryMatch now owns the direct integration with Meta instead of leaning on a BSP layer
- Meta app setup, WhatsApp Business Account setup, phone-number setup, webhook setup, and access-token handling become part of the project's direct implementation responsibility
- delivery status handling must now map directly from Meta webhook events into the `Notification` record flow
- message-template creation, submission, approval tracking, and maintenance now need to be handled against Meta's process directly
- any BSP-specific assumptions in docs, admin flows, setup notes, and launch blockers must be removed or rewritten
- notification error handling, retry behavior, and observability become more important because there is no BSP abstraction layer in the middle
- the team must confirm exactly where Meta webhook handling will live before coding resumes
- operational setup work may increase even if recurring vendor cost goes down

## 6. Risks introduced by this change

Real risks introduced by moving to Meta Cloud API direct:

- Meta setup and approval work may take longer than the team expected under the earlier BSP assumption
- CarryMatch now owns more operational complexity directly, including webhook handling, credential handling, and delivery-status processing
- template approval delays become a more direct launch risk because there is no BSP workflow cushioning that process
- if Meta app, business-account, or phone-number ownership is unclear, implementation can stall before any real notification testing happens
- a direct integration raises the cost of mistakes in token handling, webhook verification, and message-send troubleshooting
- current project files now disagree with the approved direction, so coding against stale docs would create avoidable rework

## 7. Decisions still needed because of this change

These are the new or changed decisions that now need to be made because Meta direct was chosen:

- Which Meta Business Manager / WhatsApp Business Account will own the launch setup
- Which WhatsApp phone number will be used for Phase 1 launch
- Where Meta webhooks will terminate for Phase 1 CML
  - Supabase Edge Functions
  - Vercel API routes
- How access tokens will be managed for launch
  - temporary token during early setup
  - permanent system user token for production
- Who will own template submission and approval tracking with Meta
- Whether the Month 1-2 WhatsApp timeline in the PRD still stands unchanged under the Meta-direct setup path

## 8. Recommendation for how to proceed

Strict update order before coding resumes:

1. Update `CarryMatch-PRD-v2.0.md` to replace BSP-specific WhatsApp assumptions with Meta Cloud API direct language
2. Update `CML_V1_FOUNDER_DECISIONS.md` so the old BSP-provider decision is removed and replaced with the new Meta-direct decisions
3. Update `CML_V1_BUILD_BLUEPRINT.md` so the integration section, blockers, and open questions no longer reference BSP provider selection
4. Update `CML_V1_SCREEN_MAP.md` so notification-related screens and admin/setup wording no longer imply BSP-managed delivery handling
5. Update `CML_V1_LAUNCH_CORE_CHECKLIST.md` so the pre-UI blockers and launch-core dependencies point to Meta direct instead of BSP selection
6. Re-check all five files for consistent WhatsApp wording
7. Only after those doc updates are complete should coding resume
