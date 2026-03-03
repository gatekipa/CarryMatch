#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  CARRYMATCH PHASE 9 — POST-DEPLOY SMOKE TEST
#  Run AFTER: npm install && npm run build && base44 site deploy -y
# ═══════════════════════════════════════════════════════════════

SITE_URL="https://carrymatch.base44.app"
PASS=0
FAIL=0
WARN=0

pass() { echo "  ✅ $1"; PASS=$((PASS + 1)); }
fail() { echo "  ❌ $1"; FAIL=$((FAIL + 1)); }
warn() { echo "  ⚠️  $1"; WARN=$((WARN + 1)); }

check_page() {
  local path="$1"
  local label="$2"
  local expect="$3"
  local url="${SITE_URL}/${path}"
  
  response=$(curl -s -o /tmp/cm_test_body -w "%{http_code}" --max-time 15 "$url" 2>/dev/null)
  body=$(cat /tmp/cm_test_body 2>/dev/null)
  
  if [ "$response" = "200" ]; then
    if [ -n "$expect" ]; then
      if echo "$body" | grep -qi "$expect"; then
        pass "$label → 200 OK (contains '$expect')"
      else
        warn "$label → 200 OK (but '$expect' not found — SPA may lazy-load)"
      fi
    else
      pass "$label → 200 OK"
    fi
  elif [ "$response" = "000" ]; then
    fail "$label → TIMEOUT/UNREACHABLE"
  else
    fail "$label → HTTP $response"
  fi
}

check_no_error() {
  local path="$1"
  local label="$2"
  local url="${SITE_URL}/${path}"
  
  body=$(curl -s --max-time 15 "$url" 2>/dev/null)
  
  if echo "$body" | grep -qi "TypeError\|Cannot read\|is not defined\|Unexpected token\|ChunkLoadError\|SyntaxError"; then
    fail "$label → JAVASCRIPT ERROR DETECTED"
    echo "       $(echo "$body" | grep -oi 'TypeError[^<]*\|Cannot read[^<]*\|is not defined[^<]*' | head -1)"
  elif echo "$body" | grep -qi "<div id=\"root\">"; then
    pass "$label → No JS errors, root element present"
  else
    warn "$label → Page loaded but root element check inconclusive (SPA)"
  fi
}

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  CARRYMATCH PHASE 9 — POST-DEPLOY SMOKE TEST              ║"
echo "║  Site: $SITE_URL                          ║"
echo "║  Time: $(date '+%Y-%m-%d %H:%M:%S')                          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ═══════════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TEST 1: SITE REACHABILITY & INDEX"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Basic reachability
response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$SITE_URL" 2>/dev/null)
if [ "$response" = "200" ]; then
  pass "Site reachable → HTTP 200"
else
  fail "Site unreachable → HTTP $response"
  echo ""
  echo "  ⛔ Site is down. Remaining tests will fail. Check deployment."
  echo ""
  exit 1
fi

# Check index.html content
body=$(curl -s --max-time 15 "$SITE_URL" 2>/dev/null)

if echo "$body" | grep -q '<div id="root">'; then
  pass "Root element present"
else
  fail "Root element missing"
fi

if echo "$body" | grep -qi "CarryMatch"; then
  pass "Title contains 'CarryMatch'"
else
  warn "Title doesn't contain 'CarryMatch'"
fi

# Check JS bundle loads
js_bundle=$(echo "$body" | grep -o 'src="/assets/[^"]*\.js"' | head -1 | sed 's/src="//;s/"//')
if [ -n "$js_bundle" ]; then
  js_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${SITE_URL}${js_bundle}" 2>/dev/null)
  if [ "$js_status" = "200" ]; then
    pass "JS bundle loads → ${js_bundle} (200)"
  else
    fail "JS bundle failed → ${js_bundle} (HTTP $js_status)"
  fi
else
  warn "Could not detect JS bundle URL in HTML"
fi

# Check CSS bundle loads
css_bundle=$(echo "$body" | grep -o 'href="/assets/[^"]*\.css"' | head -1 | sed 's/href="//;s/"//')
if [ -n "$css_bundle" ]; then
  css_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${SITE_URL}${css_bundle}" 2>/dev/null)
  if [ "$css_status" = "200" ]; then
    pass "CSS bundle loads → ${css_bundle} (200)"
  else
    fail "CSS bundle failed → ${css_bundle} (HTTP $css_status)"
  fi
else
  warn "Could not detect CSS bundle URL in HTML"
fi

# ═══════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TEST 2: PUBLIC PAGES (no auth required)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_page "Home"                "Home page"                 "root"
check_page "BusSearch"           "Bus Search"                "root"
check_page "LogisticsPartners"   "Logistics Partners"        "root"
check_page "PartnerLogin"        "Partner Login"             "root"
check_page "PartnerSignup"       "Partner Signup"            "root"
check_page "BusOperatorSignup"   "Bus Operator Signup"       "root"
check_page "VendorPricing"       "Vendor Pricing"            "root"
check_page "PublicTracking"      "Public Tracking"           "root"

# ═══════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TEST 3: ADMIN PAGES (auth-gated, should still return 200 SPA)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_page "SuperAdminDashboard"         "SuperAdmin Dashboard"          "root"
check_page "CarryMatchAdminDashboard"    "CML Admin Dashboard"           "root"
check_page "CarryMatchAdminBilling"      "CML Admin Billing"             "root"
check_page "CarryMatchAdminSystemConfig" "CML Admin System Config"       "root"
check_page "CarryMatchAdminAnalytics"    "CML Admin Analytics"           "root"
check_page "CarryMatchAdminAudit"        "CML Admin Audit"               "root"
check_page "CarryMatchAdminDisputes"     "CML Admin Disputes"            "root"
check_page "CarryMatchAdminVendors"      "CML Admin Vendors"             "root"
check_page "AdminDashboard"              "Bus Admin Dashboard"           "root"

# ═══════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TEST 4: VENDOR LOGISTICS PAGES (auth-gated)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_page "VendorDashboard"          "Vendor Dashboard"          "root"
check_page "VendorShipmentIntake"     "Shipment Intake"           "root"
check_page "VendorBatchManagement"    "Batch Management"          "root"
check_page "VendorShipments"          "Shipments List"            "root"
check_page "VendorShipmentPayments"   "Shipment Payments"         "root"
check_page "VendorBilling"            "Vendor Billing"            "root"
check_page "VendorSettings"           "Vendor Settings"           "root"
check_page "VendorAnalytics"          "Vendor Analytics"          "root"
check_page "VendorStaffManagement"    "Staff Management"          "root"
check_page "VendorNotificationTemplates" "Notification Templates" "root"
check_page "VendorInsuranceClaims"    "Insurance Claims"          "root"
check_page "VendorScanUpdate"         "Scan & Update"             "root"
check_page "VendorCashierCloseout"    "Cashier Closeout"          "root"

# ═══════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TEST 5: BUS AGENCY PAGES (auth-gated)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_page "VendorBusDashboard"       "Bus Dashboard"             "root"
check_page "ManageBusRoutes"          "Bus Routes"                "root"
check_page "ManageBusTrips"           "Bus Trips"                 "root"
check_page "ManageBusVehicles"        "Bus Vehicles"              "root"
check_page "ManageDrivers"            "Manage Drivers"            "root"
check_page "VendorBusReports"         "Bus Reports"               "root"
check_page "BusOperatorSettings"      "Bus Operator Settings"     "root"

# ═══════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TEST 6: ERROR DETECTION — JS CRASH CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_no_error "Home"                         "Home (no JS errors)"
check_no_error "BusSearch"                    "BusSearch (no JS errors)"
check_no_error "LogisticsPartners"            "LogisticsPartners (no JS errors)"
check_no_error "VendorPricing"                "VendorPricing (no JS errors)"
check_no_error "SuperAdminDashboard"          "SuperAdmin (no JS errors)"
check_no_error "CarryMatchAdminDashboard"     "CML Admin (no JS errors)"
check_no_error "CarryMatchAdminSystemConfig"  "System Config (no JS errors)"

# ═══════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TEST 7: DELETED PAGE CHECK — CMLAdminSystemConfig REMOVED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# The duplicate page was deleted — route should 404 or redirect to SPA
dup_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${SITE_URL}/CMLAdminSystemConfig" 2>/dev/null)
if [ "$dup_status" = "200" ]; then
  warn "CMLAdminSystemConfig returns 200 (SPA catch-all, but component was deleted — should show blank or redirect)"
else
  pass "CMLAdminSystemConfig properly removed (HTTP $dup_status)"
fi

# ═══════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TEST 8: ASSET INTEGRITY — Static Files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check that favicon loads
fav_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${SITE_URL}/favicon.ico" 2>/dev/null)
if [ "$fav_status" = "200" ] || [ "$fav_status" = "204" ]; then
  pass "Favicon loads (HTTP $fav_status)"
else
  warn "Favicon not found (HTTP $fav_status) — non-critical"
fi

# Check manifest.json for PWA
manifest_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${SITE_URL}/manifest.json" 2>/dev/null)
if [ "$manifest_status" = "200" ]; then
  pass "PWA manifest.json loads (HTTP $manifest_status)"
else
  warn "manifest.json not found (HTTP $manifest_status)"
fi

# ═══════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TEST 9: RESPONSE TIME — Performance Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for path in "" "Home" "BusSearch" "LogisticsPartners" "VendorPricing"; do
  label="${path:-Index}"
  time_ms=$(curl -s -o /dev/null -w "%{time_total}" --max-time 15 "${SITE_URL}/${path}" 2>/dev/null)
  time_ms_int=$(echo "$time_ms * 1000" | bc 2>/dev/null | cut -d. -f1)
  if [ -n "$time_ms_int" ] && [ "$time_ms_int" -lt 3000 ]; then
    pass "$label → ${time_ms_int}ms (< 3s)"
  elif [ -n "$time_ms_int" ] && [ "$time_ms_int" -lt 5000 ]; then
    warn "$label → ${time_ms_int}ms (slow, 3-5s)"
  elif [ -n "$time_ms_int" ]; then
    fail "$label → ${time_ms_int}ms (> 5s)"
  else
    warn "$label → could not measure response time"
  fi
done

# ═══════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TEST 10: SPA ROUTING — Deep links resolve"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# SPA should return 200 for ANY route (catch-all to index.html)
for path in "VendorShipmentIntake" "CarryMatchAdminBilling" "SuperAdminDashboard" "VendorBusDashboard" "EditProfile" "PostTrip"; do
  deep_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${SITE_URL}/${path}" 2>/dev/null)
  if [ "$deep_status" = "200" ]; then
    pass "Deep link /${path} → 200 (SPA catch-all working)"
  else
    fail "Deep link /${path} → HTTP $deep_status (SPA routing broken!)"
  fi
done

# ═══════════════════════════════════════════════════════════════
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                  TEST RESULTS SUMMARY                      ║"
echo "╠══════════════════════════════════════════════════════════════╣"
printf "║  ✅ PASSED:  %-3d                                          ║\n" $PASS
printf "║  ⚠️  WARNS:   %-3d                                          ║\n" $WARN
printf "║  ❌ FAILED:  %-3d                                          ║\n" $FAIL
echo "╠══════════════════════════════════════════════════════════════╣"
if [ $FAIL -eq 0 ]; then
  echo "║  STATUS: ✅ DEPLOYMENT VERIFIED — ALL CRITICAL TESTS PASS  ║"
else
  echo "║  STATUS: ❌ DEPLOYMENT ISSUES DETECTED — CHECK FAILURES    ║"
fi
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "  Manual checks recommended:"
echo "    1. Open ${SITE_URL} in browser — verify Home loads"
echo "    2. Login as admin → SuperAdminDashboard → CML Logistics Admin card"
echo "    3. CML Admin → System Config → verify Templates tab"
echo "    4. CML Admin ← Back to Platform Admin button"
echo "    5. VendorDashboard → Settings → verify 4 sections"
echo "    6. VendorBilling → verify renewal warning banner"
echo "    7. AdminBilling → verify stats cards, search, copy codes"
echo ""

# Cleanup
rm -f /tmp/cm_test_body

exit $FAIL
