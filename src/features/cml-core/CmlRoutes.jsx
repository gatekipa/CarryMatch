import React from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { CmlAppShell } from "@/features/cml-core/components/CmlAppShell";
import { FullscreenError, FullscreenLoader } from "@/features/cml-core/components/CmlStateScreens";
import ApplicationStatusPage from "@/features/cml-core/pages/ApplicationStatusPage";
import BatchDetailPage from "@/features/cml-core/pages/BatchDetailPage";
import BatchListPage from "@/features/cml-core/pages/BatchListPage";
import BranchManagementPage from "@/features/cml-core/pages/BranchManagementPage";
import LandingPage from "@/features/cml-core/pages/LandingPage";
import LoginPage from "@/features/cml-core/pages/LoginPage";
import NewShipmentIntakePage from "@/features/cml-core/pages/NewShipmentIntakePage";
import NotificationLogPage from "@/features/cml-core/pages/NotificationLogPage";
import NotificationSettingsPage from "@/features/cml-core/pages/NotificationSettingsPage";
import PartnerApplicationPage from "@/features/cml-core/pages/PartnerApplicationPage";
import PricingPage from "@/features/cml-core/pages/PricingPage";
import PublicTrackingPage from "@/features/cml-core/pages/PublicTrackingPage";
import ScanUpdatePage from "@/features/cml-core/pages/ScanUpdatePage";
import SetupWizardPage from "@/features/cml-core/pages/SetupWizardPage";
import SignUpPage from "@/features/cml-core/pages/SignUpPage";
import ShipmentDetailPage from "@/features/cml-core/pages/ShipmentDetailPage";
import VendorSettingsPage from "@/features/cml-core/pages/VendorSettingsPage";
import VendorDashboardPage from "@/features/cml-core/pages/VendorDashboardPage";
import { ACCESS_STATES, getDefaultRouteForAccessState } from "@/lib/cmlAccessState";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/lib/i18n";

function HomeEntryRoute() {
  const { isLoadingAuth, isAuthenticated, accessState, authError } = useAuth();
  const { t } = useI18n();

  if (isLoadingAuth) return <FullscreenLoader />;
  if (!isAuthenticated) return <LandingPage />;

  if (authError?.type === "config") {
    return <FullscreenError title={t("errors.title")} description={t("errors.missingConfig")} />;
  }

  return <Navigate replace to={getDefaultRouteForAccessState(accessState)} />;
}

function AuthScreenRoute() {
  const { isLoadingAuth, isAuthenticated, accessState } = useAuth();

  if (isLoadingAuth) return <FullscreenLoader />;
  if (isAuthenticated) return <Navigate replace to={getDefaultRouteForAccessState(accessState)} />;

  return <Outlet />;
}

function ProtectedRoute({ allowedStates }) {
  const location = useLocation();
  const { isLoadingAuth, isAuthenticated, accessState, authError } = useAuth();
  const { t } = useI18n();

  if (isLoadingAuth) return <FullscreenLoader />;

  if (authError?.type === "config") {
    return <FullscreenError title={t("errors.title")} description={t("errors.missingConfig")} />;
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/login" state={{ from: location.pathname }} />;
  }

  if (!allowedStates.includes(accessState)) {
    return <Navigate replace to={getDefaultRouteForAccessState(accessState)} />;
  }

  return <Outlet />;
}

function PartnerApplicationRoute() {
  const { isLoadingAuth, isAuthenticated, accessState } = useAuth();

  if (isLoadingAuth) return <FullscreenLoader />;
  if (!isAuthenticated) return <PartnerApplicationPage />;
  if (
    accessState === ACCESS_STATES.NO_VENDOR_RECORD ||
    accessState === ACCESS_STATES.APPLICATION_REJECTED
  ) {
    return <PartnerApplicationPage />;
  }

  return <Navigate replace to={getDefaultRouteForAccessState(accessState)} />;
}

function NotFoundRoute() {
  const { t } = useI18n();
  return <FullscreenError title={t("notFound.title")} description={t("notFound.body")} />;
}

export function CmlRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<CmlAppShell />}>
          <Route index element={<HomeEntryRoute />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="track" element={<PublicTrackingPage />} />
          <Route path="track/:trackingNumber" element={<PublicTrackingPage />} />
          <Route path="partners">
            <Route path="apply" element={<PartnerApplicationRoute />} />
          </Route>

          <Route element={<AuthScreenRoute />}>
            <Route path="signup" element={<SignUpPage />} />
            <Route path="login" element={<LoginPage />} />
          </Route>

          <Route
            element={
              <ProtectedRoute
                allowedStates={[
                  ACCESS_STATES.APPLICATION_PENDING,
                  ACCESS_STATES.APPLICATION_REJECTED,
                  ACCESS_STATES.SUSPENDED_VENDOR,
                ]}
              />
            }
          >
            <Route path="application-status" element={<ApplicationStatusPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedStates={[ACCESS_STATES.SETUP_REQUIRED]} />}>
            <Route path="setup" element={<SetupWizardPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedStates={[ACCESS_STATES.ACTIVE_VENDOR]} />}>
            <Route path="dashboard" element={<VendorDashboardPage />} />
            <Route path="batches">
              <Route index element={<BatchListPage />} />
              <Route path="new" element={<BatchDetailPage />} />
              <Route path=":batchId" element={<BatchDetailPage />} />
            </Route>
            <Route path="shipments">
              <Route path="new" element={<NewShipmentIntakePage />} />
              <Route path=":shipmentId" element={<ShipmentDetailPage />} />
            </Route>
            <Route path="scan-update" element={<ScanUpdatePage />} />
            <Route path="notifications">
              <Route path="log" element={<NotificationLogPage />} />
              <Route path="settings" element={<NotificationSettingsPage />} />
            </Route>
            <Route path="settings">
              <Route path="company-profile" element={<VendorSettingsPage />} />
              <Route path="branches" element={<BranchManagementPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundRoute />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
