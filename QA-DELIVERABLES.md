# Legacy Base44-Era Document

This file was produced during the Base44-era deployment of CarryMatch.
It is retained for historical reference during migration, but it should not be treated as the source of truth for the in-progress post-Base44 architecture.

# CarryMatch QA Deliverables

## 1. Consolidated QA Tracker

### FAILED Test Cases (deduped across both PDFs)

| TC ID | Title | Area | Impact | Bug ID | Status |
|-------|-------|------|--------|--------|--------|
| TC-005 | Invalid email allowed on signup | Auth | Major | BG-002 | FLAGGED (external SDK) |
| TC-014 | Reset password accepts old password | Auth | Medium | BG-010 | FLAGGED (external SDK) |
| TC-018 | Numbers allowed in first name | Profile | Minor | - | FIXED |
| TC-020 | Phone not auto-formatted with dashes | Profile | Minor | BG-015 | Already implemented |
| TC-024 | Phone number removable after required | Profile | Major | BG-017 | FIXED |
| TC-031 | Cannot publish trip with all fields | Post Trip | Major | - | FIXED (defensive handling) |
| TC-032 | Door-to-Airport delivery React error | Post Trip | Major | BG-025 | FIXED |
| TC-033 | Airport-to-Door delivery React error | Post Trip | Major | BG-025 | FIXED |
| TC-034 | Door-to-Door delivery React error | Post Trip | Major | BG-025 | FIXED |
| TC-036 | Airport suggestion doesn't populate | Post Request | Medium | BG-022 | FIXED |
| TC-038 | Cannot post request with all fields | Post Request | Major | BG-026 | FIXED |

### All Bugs (deduped across both bug sheets)

| Bug ID | Title | Impact | Root Cause | Files Changed | Status |
|--------|-------|--------|------------|---------------|--------|
| BG-001 | Sign-in page scrolled down | Minor | No scroll-to-top on navigation | NavigationTracker.jsx | FIXED |
| BG-002 | Invalid email allowed on signup | Major | base44 external auth | N/A | FLAGGED |
| BG-003 | OTP timer missing | Minor | base44 external auth | N/A | FLAGGED |
| BG-004 | Landing page animations laggy | Medium | Framer Motion perf | - | NOT ADDRESSED (perf tuning) |
| BG-005 | Day mode readability issues | Minor | No dark/light class on html | Layout.jsx | FIXED |
| BG-006 | Logout infinite auth loader | Major | No timeout on auth.me() | AuthContext.jsx, Layout.jsx | FIXED |
| BG-007 | Dashboard icon sizes | Minor | CSS styling | - | NOT ADDRESSED (minor cosmetic) |
| BG-008 | Dashboard headings not on one line | Minor | CSS styling | - | NOT ADDRESSED (minor cosmetic) |
| BG-009 | Nav not fixed on horizontal scroll | Major | Used sticky instead of fixed | Layout.jsx | FIXED |
| BG-010 | Password reset accepts old password | Medium | base44 external auth | N/A | FLAGGED |
| BG-011 | First name auto-filled from email | Minor | Code used email prefix as name | EditProfile.jsx | FIXED |
| BG-012 | DOB calendar shows current date | Medium | max attr set to today not 18y ago | EditProfile.jsx | FIXED |
| BG-013 | "Conversational" text clipped | Minor | Select trigger width too narrow | EditProfile.jsx | FIXED |
| BG-014 | Save changes React minified error | Major | languages_spoken sent as objects | EditProfile.jsx | FIXED |
| BG-015 | Phone not auto-formatted | Minor | formatPhoneWithDashes exists | Already implemented | N/A |
| BG-016 | "Other" country no name field | Medium | No custom country name input | EditProfile.jsx | FIXED |
| BG-017 | Phone removable after being required | Major | Only HTML required, no JS check | EditProfile.jsx | FIXED |
| BG-018 | Last name/DOB not shown on profile | Major | UserProfile didn't show DOB | UserProfile.jsx | FIXED |
| BG-019 | Profile picture not marked mandatory | Medium | Label missing required indicator | EditProfile.jsx | FIXED |
| BG-020 | Profile saved without picture | Major | No validation on picture field | EditProfile.jsx | FIXED |
| BG-021 | Upload pic missing from edit profile | Medium | EditProfile HAS upload section | Already implemented | N/A |
| BG-022 | Airport suggestion not populating | Medium | Input showed IATA only, not city | AirportAutocomplete.jsx | FIXED |
| BG-023 | Luggage space radio not highlighted | Minor | RadioGroupItem styling invisible | radio-group.jsx | FIXED |
| BG-024 | Price radio not highlighted | Minor | Same as BG-023 | radio-group.jsx | FIXED |
| BG-025 | Non-airport delivery React error | Major | Missing Array.isArray guards | TripDetails.jsx, BrowseTrips.jsx | FIXED |
| BG-026 | Shipment request posting failed | Major | Empty IATA fields sent to API | PostRequest.jsx | FIXED |

## 2. How to Run

### App Locally
```bash
npm install
npm run dev
# Opens at http://localhost:5173
```

### E2E Tests
```bash
# Install Playwright browsers (first time only)
npx playwright install chromium

# Run all tests (headed)
npx playwright test --headed

# Run all tests (headless)
npx playwright test

# Run specific suite
npx playwright test e2e/auth-flow.spec.js
npx playwright test e2e/profile-validation.spec.js
npx playwright test e2e/post-trip.spec.js
npx playwright test e2e/post-request.spec.js
npx playwright test e2e/navigation-layout.spec.js

# View test report
npx playwright show-report
```

### Unit Tests
```bash
npm run test
npm run test:watch
npm run test:coverage
```

### Environment
- Node.js 18+
- base44 SDK handles auth externally (no env vars needed for frontend)
- App ID: `699c559a151bdbb91b070898` (configured in `src/api/base44Client.js`)

## 3. Pattern Findings

### Pattern 1: Unsafe Array Access
- **Original**: BG-025 — `trip.delivery_services.map()` crashes when undefined
- **Found in**: `UserProfile.jsx` (languages_spoken, travel_preferences), `BrowseTrips.jsx` (delivery_services)
- **Fix**: Added `Array.isArray()` guards everywhere; used `(arr || []).map()` pattern

### Pattern 2: Auth Timeout Missing
- **Original**: BG-006 — logout causes infinite "checking authentication" loader
- **Found in**: `AuthContext.jsx`, `Layout.jsx`, and 50+ pages calling `base44.auth.me()` directly
- **Fix**: Added `Promise.race()` with 10s timeout in AuthContext and Layout. Individual pages already had `.catch()` handlers.

### Pattern 3: Form Validation Gaps
- **Original**: TC-018 — numbers in first name; BG-017 — phone removable; BG-020 — no picture required
- **Found in**: `PartnerSignup.jsx` (contactName accepts numbers, phone format not stripped)
- **Fix**: Added regex name validation and digit-stripping to phone validation in PartnerSignup. Added profile picture requirement and name/number stripping in EditProfile.

### Pattern 4: Radio Button Visibility
- **Original**: BG-023/BG-024 — weight/price radio not visually highlighted
- **Found in**: All RadioGroupItem usages across the app (global component)
- **Fix**: Updated `radio-group.jsx` to use brand color `#9EFF00` with `data-[state=checked]` border, making selection visible app-wide.

### Pattern 5: Navigation Position
- **Original**: BG-009 — nav moves on horizontal scroll
- **Found in**: Layout.jsx header using `sticky` instead of `fixed`
- **Fix**: Changed to `fixed top-0 left-0 right-0` and added `md:mt-16` to main content. Also added `window.scrollTo(0,0)` in NavigationTracker to fix BG-001.

## 4. Product Decisions Required

| Issue | Recommendation |
|-------|----------------|
| BG-002: Email validation on signup | base44 external auth handles signup. **Propose**: Add client-side email validation in a pre-signup form before redirecting to base44. |
| BG-003: OTP timer missing | base44 handles OTP. **Propose**: Request OTP timer feature from base44 SDK, or wrap their component with a timer overlay. |
| BG-010: Password reset accepts old password | base44 handles password reset. **Propose**: Report to base44 as a bug — password reset should reject the current password. |
| BG-004: Landing animations laggy | Performance issue with Framer Motion. **Propose**: Reduce animation complexity, add `will-change` CSS, or lazy-load animated sections below fold. |
| BG-007/BG-008: Dashboard icon sizes and heading layout | Pure cosmetic CSS tweaks. **Propose**: Fix in a separate styling pass with designer review. |

## 5. Test Results Summary

```
20 e2e tests: 20 passed, 0 failed
Build: Passes successfully
```

### Test Suites
| Suite | Tests | Coverage |
|-------|-------|----------|
| auth-flow.spec.js | 3 | BG-006, BG-002/TC-005 |
| navigation-layout.spec.js | 5 | BG-001, BG-005, BG-009 |
| profile-validation.spec.js | 5 | TC-018, BG-012, BG-017, BG-019, BG-020 |
| post-trip.spec.js | 4 | TC-028, BG-022, BG-023/24, BG-025 |
| post-request.spec.js | 3 | TC-035, TC-036, TC-037 |
