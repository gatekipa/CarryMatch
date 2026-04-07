import React, { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Globe, LogOut, Menu, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/lib/i18n";
import { InlineNotice } from "@/features/cml-core/components/CmlStateScreens";
import { PublicFooter } from "@/features/cml-core/components/PublicFooter";
import {
  canEditSettings,
  canManageBranches,
  canEditNotificationSettings,
  canManageSubscription,
  canManageStaff,
} from "@/features/cml-core/lib/permissions";

const publicNavigationItems = [
  { href: "/", labelKey: "nav.landing" },
  { href: "/pricing", labelKey: "nav.pricing" },
  { href: "/partners/apply", labelKey: "nav.apply" },
  { href: "/track", labelKey: "nav.track" },
  { href: "/p2p", labelKey: "nav.p2p", badge: "nav.comingSoon" },
  { href: "/bus-tickets", labelKey: "nav.busTickets", badge: "nav.comingSoon" },
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

function LanguageSwitcher({ compact }) {
  const { language, setLanguage, t } = useI18n();
  return (
    <div className={`inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 ${compact ? "" : "shadow-sm"}`}>
      {!compact && (
        <span className="px-2 text-xs font-medium text-slate-500">
          <Globe className="mr-1 inline h-3.5 w-3.5" />
          {t("common.language")}
        </span>
      )}
      {["en", "fr"].map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => setLanguage(value)}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            language === value ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {value.toUpperCase()}
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

  const isVendorDashboard = accessState === "active_vendor";
  const staffRole = vendorStaff?.role ?? "staff";

  const navigationItems = isVendorDashboard
    ? [...publicNavigationItems, ...activeVendorNavigationItems.filter((item) => !item.permCheck || item.permCheck(staffRole))]
    : publicNavigationItems;

  // Add admin link if admin
  const allNavItems = adminUser
    ? [...navigationItems, { href: "/admin", labelKey: "nav.admin" }]
    : navigationItems;

  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  const handleSignOut = async () => { setMobileMenuOpen(false); await signOut(); };

  // -- PUBLIC HEADER (green accent, white bg) --
  const publicHeader = (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-8">
          {/* Mobile menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button type="button" className="rounded-lg border border-slate-200 p-2 text-slate-600 md:hidden" aria-label={t("nav.menu")}>
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-white p-0">
              <div className="flex flex-col gap-1 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
                    <Package className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-lg font-bold">CarryMatch</span>
                </div>
                <nav className="flex flex-col gap-1">
                  {allNavItems.map((item) => (
                    <NavLink key={item.href} to={item.href} onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) => `rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-brand text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                      {t(item.labelKey)}
                      {item.badge && <span className="ml-1.5 rounded-full bg-brand-lighter px-1.5 py-0.5 text-[10px] font-medium text-brand">{t(item.badge)}</span>}
                    </NavLink>
                  ))}
                </nav>
                <div className="my-3 border-t border-slate-200" />
                <LanguageSwitcher />
                <div className="mt-3 flex flex-col gap-2">
                  {isAuthenticated ? (
                    <Button variant="outline" onClick={handleSignOut} className="w-full justify-start"><LogOut className="mr-2 h-4 w-4" />{t("nav.logout")}</Button>
                  ) : (
                    <>
                      <Button asChild variant="ghost" className="w-full justify-start"><Link to="/login">{t("nav.login")}</Link></Button>
                      <Button asChild className="w-full justify-start bg-brand hover:bg-brand-hover text-white"><Link to="/signup">{t("nav.signup")}</Link></Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
              <Package className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">CarryMatch</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {publicNavigationItems.map((item) => (
              <NavLink key={item.href} to={item.href}
                className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? "bg-brand-lighter text-brand" : "text-slate-600 hover:text-slate-900"}`}>
                {t(item.labelKey)}
                {item.badge && <span className="ml-1 rounded bg-brand-lighter px-1.5 py-0.5 text-[9px] font-semibold text-brand">{t(item.badge)}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="hidden md:block"><LanguageSwitcher compact /></div>
          {isAuthenticated ? (
            <Button variant="outline" size="sm" onClick={handleSignOut}><LogOut className="mr-1.5 h-4 w-4" /><span className="hidden sm:inline">{t("nav.logout")}</span></Button>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button asChild variant="ghost" size="sm"><Link to="/login">{t("nav.login")}</Link></Button>
              <Button asChild size="sm" className="bg-brand hover:bg-brand-hover text-white"><Link to="/signup">{t("nav.signup")}</Link></Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );

  // -- VENDOR HEADER (slate dark theme, existing style) --
  const vendorHeader = (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button type="button" className="rounded-lg border border-slate-200 p-2 text-slate-600 md:hidden" aria-label={t("nav.menu")}>
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-white p-0">
              <div className="flex flex-col gap-1 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
                    <Package className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-lg font-bold">CarryMatch</span>
                </div>
                <nav className="flex flex-col gap-1">
                  {allNavItems.map((item) => (
                    <NavLink key={item.href} to={item.href} onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) => `rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                      {t(item.labelKey)}
                    </NavLink>
                  ))}
                </nav>
                <div className="my-3 border-t border-slate-200" />
                <LanguageSwitcher />
                <div className="mt-3">
                  <Button variant="outline" onClick={handleSignOut} className="w-full justify-start"><LogOut className="mr-2 h-4 w-4" />{t("nav.logout")}</Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
              <Package className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">CarryMatch</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {activeVendorNavigationItems.filter((item) => !item.permCheck || item.permCheck(staffRole)).map((item) => (
              <NavLink key={item.href} to={item.href}
                className={({ isActive }) => `rounded-full px-3 py-1.5 text-sm font-medium transition ${isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                {t(item.labelKey)}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:block"><LanguageSwitcher compact /></div>
          <Button variant="outline" size="sm" onClick={handleSignOut}><LogOut className="mr-1.5 h-4 w-4" /><span className="hidden sm:inline">{t("nav.logout")}</span></Button>
        </div>
      </div>
    </header>
  );

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      {isVendorDashboard ? vendorHeader : publicHeader}

      <main className={`flex-1 ${isVendorDashboard ? "bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.08),_transparent_40%)] bg-slate-50/50" : ""}`}>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
          {authError?.type === "config" && <InlineNotice title={t("common.environmentWarning")} description={t("errors.missingConfig")} tone="warning" />}
          <Outlet />
        </div>
      </main>

      {!isVendorDashboard && <PublicFooter />}
    </div>
  );
}
