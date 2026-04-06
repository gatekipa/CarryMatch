# Implementation Plan: Address Autocomplete, Upload Security & Console Error Fixes

## Overview
Three issues from the document:
1. **Address autocomplete** using OSM/Nominatim with optional business/POI results
2. **File upload security gating** — whitelist safe formats, block dangerous ones
3. **Console error fixes** — unsafe `[0]` accesses, missing null checks, unhandled promises

---

## Part 1: Address Autocomplete (Nominatim/OSM)

### New Component: `src/components/address/AddressAutocomplete.jsx`
- Follows the existing `CityAutocomplete` pattern (debounced input, dropdown, keyboard nav)
- Uses **Nominatim API** (`https://nominatim.openstreetmap.org/search`) — free, no API key needed, already using OSM tiles
- **Features:**
  - Debounced search (300ms) on user input (min 3 chars)
  - Returns addresses, cities, and optionally businesses/landmarks
  - Props: `value`, `onChange`, `onSelect`, `placeholder`, `label`, `required`, `countryCode` (optional ISO filter), `includePOI` (optional, enables businesses/landmarks)
  - `onSelect` callback returns structured object: `{ display_name, street, city, state, country, postcode, lat, lon }`
  - Keyboard navigation (arrow keys, Enter, Escape) + click selection
  - Accessible: ARIA combobox pattern (matching CityAutocomplete)
  - Styles: matches existing dark theme (`bg-white/5 border-white/10 text-white`)

### Integration Points (6 locations):

| File | Field(s) | Current | Change |
|------|----------|---------|--------|
| `PostRequest.jsx` | `pickup_address`, `delivery_address` | Plain `<Input>` | → `<AddressAutocomplete>` |
| `VendorShipmentIntake.jsx` | `sender_city`+`sender_country`, `recipient_city`+`recipient_country` | Two plain `<Input>` each | → Single `<AddressAutocomplete>` per person, fills city+country on select |
| `PartnerSignup.jsx` | `address` field | Plain `<Textarea>` | → `<AddressAutocomplete>` |
| `BusOperatorSignup.jsx` | `hq_city`, `branch city`, `address_text` | Plain `<Input>` / `<Textarea>` | → `<AddressAutocomplete>` for `hq_city` and `address_text` |
| `EditProfile.jsx` | `location` | Plain input in UserProfileEdit | → `<AddressAutocomplete>` with city-level focus |
| `BusOperatorSignup.jsx` (step 2) | branch `city` + `address_text` | Plain inputs | → `<AddressAutocomplete>` |

### Nominatim API Usage:
```
GET https://nominatim.openstreetmap.org/search
  ?q={query}
  &format=json
  &addressdetails=1
  &limit=5
  &countrycodes={countryCode}  // optional filter
```
- Rate limit: 1 request/second (enforced via debounce + abort controller)
- User-Agent header required (will use "CarryMatch/1.0")

---

## Part 2: File Upload Security

### New Utility: `src/utils/fileValidation.js`
Centralized file validation with:

```js
BLOCKED_EXTENSIONS = ['.exe','.bat','.cmd','.sh','.msi','.js','.vbs',
  '.ps1','.scr','.com','.pif','.jar','.py','.rb','.php',
  '.html','.htm','.svg','.zip','.rar','.7z','.tar','.gz']

SAFE_DOCUMENT_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
}

SAFE_IMAGE_TYPES = {
  'image/jpeg': ['.jpg','.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
}
```

- **`validateFile(file, { allowedCategories, maxSizeMB })`** — returns `{ valid, error }`
- Checks: extension whitelist, MIME type match, double extension detection (e.g. `photo.jpg.exe`), size limit
- Magic byte verification for images (JPEG: FF D8 FF, PNG: 89 50 4E 47, PDF: 25 50 44 46)

### Files to Update (all upload components — 13 files):
1. `MobileImageUpload.jsx` — add validateFile call
2. `ChatWindow.jsx` — add validateFile call
3. `GroupChatWindow.jsx` — add validateFile call
4. `EditProfile.jsx` — add validateFile call
5. `VerifyIdentity.jsx` — add validateFile call
6. `ApplyForVerification.jsx` — add validateFile call
7. `SubmitDispute.jsx` — add validateFile call
8. `LeaveReview.jsx` — add validateFile call
9. `VendorInsuranceClaims.jsx` — add validateFile call
10. `StatusUpdateModal.jsx` — add validateFile call
11. `BusOperatorSignup.jsx` — add validateFile call
12. `PartnerSignup.jsx` — add validateFile call
13. `BusOperatorSettings.jsx` — add validateFile call

Each component gets: `import { validateFile } from "@/utils/fileValidation"` and wraps existing validation with the shared utility.

---

## Part 3: Console Error Fixes

### Category A: Unsafe `[0]` Array Access (highest priority)

| File | Line Pattern | Fix |
|------|-------------|-----|
| `BusOperatorSignup.jsx` | `ops[0]` in useQuery | Add `ops.length > 0 ? ops[0] : null` |
| `useAgentSession.jsx` | `staffArr[0]`, `branches[0]` | Add length guards |
| `VendorShipmentIntake.jsx` | `staff[0].vendor_id` | Add `staff.length > 0` guard |
| `CreateBatchDialog.jsx` | `branches[0].id` | Add length guard + optional chain |
| `BusMarketingTools.jsx` | `branches[0]` fallback | Guard with `?? null` |
| `AdminDashboard.jsx` | Multiple `users[0]` | Add length checks |

### Category B: Missing Null Guards Before .map()/.filter()

| File | Issue | Fix |
|------|-------|-----|
| `TrackingDisplay.jsx` | `shipment.current_location.address` | Optional chain `shipment.current_location?.address` |
| `GroupChatWindow.jsx` | `participants.slice(0,3).map()` | Guard `(participants || []).slice(...)` |
| Various components | API responses used directly in .map() | Add `|| []` fallback |

### Category C: Fire-and-Forget Promises

| File | Issue | Fix |
|------|-------|-----|
| `GroupChatWindow.jsx` | `Promise.all(notifications)` not awaited | Add `await` or `.catch()` |
| `AdminDashboard.jsx` | `base44.auth.me().then().catch()` swallows | Add console.error in catch |

---

## Execution Order

1. Create `src/utils/fileValidation.js` utility
2. Create `src/components/address/AddressAutocomplete.jsx` component
3. Apply file validation to all 13 upload components
4. Integrate AddressAutocomplete into 6 address input locations
5. Apply console error fixes across ~8 files
6. Build, verify no errors
7. Commit and push to new branch, deploy

### Branch: `feature/address-autocomplete-upload-security`

---

## Risk Notes
- Nominatim has a **1 req/sec** rate limit — debounce + AbortController handles this
- File magic byte check reads first 4 bytes via FileReader — fast, no performance concern
- All changes are additive — existing functionality unchanged, just enhanced
