import React, { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Globe, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/lib/i18n";
import { InlineNotice } from "@/features/cml-core/components/CmlStateScreens";
import {
  canEditSettings,
  canManageBranches,
  canEditNotificationSettings,
  canManageStaff,
  canManageSubscription,
} from "@/features/cml-core/lib/permissions";

const publicNavigationItems = [
  { href: "/", labelKey: "nav.landing" },
  { href: "/pricing", labelKey: "nav.pricing" },
  { href: "/p2p", labelKey: "nav.p2p", badge: "nav.comingSoon" },
  { href: "/bus-tickets", labelKey: "nav.busTickets", badge: "nav.comingSoon" },
  { href: "/partners/apply", labelKey: "nav.apply" },
];

const activeVendorNavigationItems = [
  { href: "/dashboard", labelKey: "nav.dashboard" },
  { href: "/shipments", labelKey: "nav.shipments" },
  { href: "/shipments/new", labelKey: "nav.newShipment" },
  { href: "/scan-update", labelKey: "nav.scanUpdate" },
  { href: "/batches", labelKey: "nav.batches" },
  { href: "/customers", labelKey: "nav.customers" },
  { href: "/notifications/log", labelKey: "nav.notificationLog" },
  { href: "/notifications/settings", labelKey: "nav.notificationSettings", permCheck: canEditNotificationSettings },
  { href: "/settings/company-profile", labelKey: "nav.companyProfile", permCheck: canEditSettings },
  { href: "/settings/branches", labelKey: "nav.branches", permCheck: canManageBranches },
  { href: "/settings/subscription", labelKey: "nav.subscription", permCheck: canManageSubscription },
  { href: "/settings/staff", labelKey: "nav.staff", permCheck: canManageStaff },
];

function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/90 p-1 shadow-sm">
      <span className="px-2 text-xs font-medium text-slate-500">
        <Globe className="mr-1 inline h-3.5 w-3.5" />
        {t("common.language")}
      </span>
      {["en", "fr"].map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => setLanguage(value)}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            language === value ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {t(value === "en" ? "common.english" : "common.french")}
        </button>
      ))}
    </div>
  );
}

export function CmlAppShell() {
  const { isAuthenticated, signOut, accessState, authError, profileWarning, vendorStaff, adminUser } = useAuth();
  const { t } = useI18n();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const staffRole = vendorStaff?.role ?? "staff";

  const adminNavigationItems = adminUser
    ? [{ href: "/admin", labelKey: "nav.admin" }]
    : [];

  const navigationItems =
    accessState === "active_vendor"
      ? [
          ...publicNavigationItems,
          ...activeVendorNavigationItems.filter(
            (item) => !item.permCheck || item.permCheck(staffRole),
          ),
          ...adminNavigationItems,
        ]
      : [...publicNavigationItems, ...adminNavigationItems];

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    setMobileMenuOpen(false);
    await signOut();
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.15),_transparent_40%),linear-gradient(180deg,_#f8fafc_0%,_#ffffff_100%)] text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-6">
            {/* Mobile hamburger menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-50 md:hidden"
                  aria-label={t("nav.menu")}
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-white p-0">
                <div className="flex flex-col gap-1 p-4">
                  <div className="mb-3 flex flex-col">
                    <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      {t("app.tagline")}
                    </span>
                    <span className="text-lg font-semibold tracking-tight">{t("app.brand")}</span>
                  </div>

                  <nav className="flex flex-col gap-1">
                    {navigationItems.map((item) => (
                      <NavLink
                        key={item.href}
                        to={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                            isActive
                              ? "bg-slate-900 text-white"
                              : "text-slate-600 hover:bg-slate-100"
                          }`
                        }
                      >
                        {t(item.labelKey)}
                        {item.badge ? (
                          <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                            {t(item.badge)}
                          </span>
                        ) : null}
                      </NavLink>
                    ))}
                  </nav>

                  <div className="my-3 border-t border-slate-200" />

                  <LanguageSwitcher />

                  <div className="mt-3 flex flex-col gap-2">
                    {isAuthenticated ? (
                      <Button variant="outline" onClick={handleSignOut} className="w-full justify-start">
                        <LogOut className="mr-2 h-4 w-4" />
                        {t("nav.logout")}
                      </Button>
                    ) : (
                      <>
                        <Button asChild variant="ghost" className="w-full justify-start">
                          <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                            {t("nav.login")}
                          </Link>
                        </Button>
                        <Button asChild className="w-full justify-start">
                          <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                            {t("nav.signup")}
                          </Link>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Link to="/" className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                {t("app.tagline")}
              </span>
              <span className="text-xl font-semibold tracking-tight">{t("app.brand")}</span>
            </Link>

            <nav className="hidden items-center gap-2 md:flex">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 text-sm font-medium transition ${
                      isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                    }`
                  }
                >
                  {t(item.labelKey)}
                  {item.badge ? (
                    <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                      {t(item.badge)}
                    </span>
                  ) : null}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>
            {isAuthenticated ? (
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t("nav.logout")}</span>
              </Button>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Button asChild variant="ghost">
                  <Link to="/login">{t("nav.login")}</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">{t("nav.signup")}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
        {authError?.type === "config" ? (
          <InlineNotice
            title={t("common.environmentWarning")}
            description={t("errors.missingConfig")}
            tone="warning"
          />
        ) : null}

        {profileWarning ? (
          <InlineNotice
            title={t("shell.currentState")}
            description={t("shell.profileFallback")}
            tone="neutral"
          />
        ) : null}

        {isAuthenticated ? (
          <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-sm">
            <span className="font-semibold text-slate-900">{t("shell.currentState")}:</span>{" "}
            {t(`accessState.${accessState}`)}
          </div>
        ) : null}

        <Outlet />
      </main>
    </div>
  );
}
