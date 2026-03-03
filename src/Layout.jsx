import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plane, Package, Home, Menu, X, Globe, LogOut, MessageSquare, User as UserIcon, Bell, Sparkles, Bookmark, Shield, Handshake, Sun, Moon, Activity, Headphones, Truck, FileText, Bus, ArrowLeft, ChevronDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import SavedItemsBackgroundMonitor from "@/components/SavedItemsBackgroundMonitor";
import { checkAndFlagUsers, updateTrustScores } from "@/components/AutoFlagSystem";
import WelcomeOnboarding from "@/components/WelcomeOnboarding";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import OfflineDetector from "@/components/OfflineDetector";
import { usePermissions } from "@/components/permissions/usePermissions";
import AIChatbot from "@/components/chatbot/AIChatbot";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import MobileTouchMenu from "@/components/MobileTouchMenu";
import MobileHeader from "@/components/mobile/MobileHeader";
import { AnimatePresence, motion } from "framer-motion";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = React.useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [theme, setTheme] = React.useState(() => {
    const stored = localStorage.getItem('carrymatch-theme');
    if (stored) return stored;
    
    // Check system preference if no stored value
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });
  const [systemThemeOverride, setSystemThemeOverride] = React.useState(false);

  const permissions = usePermissions(user);

  React.useEffect(() => {
    // Remove any existing favicons
    const existingFavicons = document.querySelectorAll("link[rel*='icon']");
    existingFavicons.forEach(favicon => favicon.remove());

    // Add appropriate favicon based on theme
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/png';
    favicon.href = theme === 'dark'
      ? 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69099ae0c2ff264b7aca7e74/7c60efa9d_favicondark.png'
      : 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69099ae0c2ff264b7aca7e74/3aec54047_Faviconlight.png';
    document.head.appendChild(favicon);

    // Add apple touch icon
    const appleTouchIcon = document.createElement('link');
    appleTouchIcon.rel = 'apple-touch-icon';
    appleTouchIcon.href = theme === 'dark'
      ? 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69099ae0c2ff264b7aca7e74/7c60efa9d_favicondark.png'
      : 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69099ae0c2ff264b7aca7e74/3aec54047_Faviconlight.png';
    document.head.appendChild(appleTouchIcon);

    // Add PWA manifest inline
    const existingManifest = document.querySelector("link[rel='manifest']");
    if (!existingManifest) {
      const manifestData = {
        name: "CarryMatch - Bus Booking & Package Delivery",
        short_name: "CarryMatch",
        description: "Book bus tickets and ship packages across cities",
        start_url: "/",
        display: "standalone",
        background_color: "#1a1a2e",
        theme_color: "#9EFF00",
        orientation: "portrait-primary",
        icons: [
          {
            src: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69099ae0c2ff264b7aca7e74/7c60efa9d_favicondark.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69099ae0c2ff264b7aca7e74/7c60efa9d_favicondark.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ],
        categories: ["travel", "transportation", "business"]
      };
      const manifestBlob = new Blob([JSON.stringify(manifestData)], { type: 'application/json' });
      const manifestURL = URL.createObjectURL(manifestBlob);
      const manifest = document.createElement('link');
      manifest.rel = 'manifest';
      manifest.href = manifestURL;
      document.head.appendChild(manifest);
    }

    // Add PWA meta tags
    const viewport = document.querySelector("meta[name='viewport']");
    if (!viewport) {
      const viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      viewportMeta.content = 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes';
      document.head.appendChild(viewportMeta);
    }

    const themeColorMeta = document.querySelector("meta[name='theme-color']");
    if (!themeColorMeta) {
      const themeMeta = document.createElement('meta');
      themeMeta.name = 'theme-color';
      themeMeta.content = '#9EFF00';
      document.head.appendChild(themeMeta);
    }

    const appleMobileCapable = document.querySelector("meta[name='apple-mobile-web-app-capable']");
    if (!appleMobileCapable) {
      const appleMeta = document.createElement('meta');
      appleMeta.name = 'apple-mobile-web-app-capable';
      appleMeta.content = 'yes';
      document.head.appendChild(appleMeta);
    }

    const appleStatusBar = document.querySelector("meta[name='apple-mobile-web-app-status-bar-style']");
    if (!appleStatusBar) {
      const statusMeta = document.createElement('meta');
      statusMeta.name = 'apple-mobile-web-app-status-bar-style';
      statusMeta.content = 'black-translucent';
      document.head.appendChild(statusMeta);
    }

    // Register service worker for PWA
    if ('serviceWorker' in navigator && !navigator.serviceWorker.controller) {
      const swCode = `
        const CACHE_NAME = 'carrymatch-v1';
        self.addEventListener('install', (e) => {
          e.waitUntil(caches.open(CACHE_NAME));
          self.skipWaiting();
        });
        self.addEventListener('activate', (e) => {
          e.waitUntil(
            caches.keys().then((names) => 
              Promise.all(names.map((n) => n !== CACHE_NAME ? caches.delete(n) : null))
            )
          );
          self.clients.claim();
        });
        self.addEventListener('fetch', (e) => {
          e.respondWith(
            fetch(e.request)
              .then((res) => {
                const clone = res.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
                return res;
              })
              .catch(() => caches.match(e.request))
          );
        });
      `;
      const blob = new Blob([swCode], { type: 'application/javascript' });
      const swURL = URL.createObjectURL(blob);
      navigator.serviceWorker.register(swURL).catch(() => {});
    }

    // Update document class for theme
    document.documentElement.className = theme;

    // Store preference
    localStorage.setItem('carrymatch-theme', theme);
  }, [theme]);

  // Sync with system preference on load if not overridden
  React.useEffect(() => {
    if (!systemThemeOverride && typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        setTheme(e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [systemThemeOverride]);

  // Sync theme class on <html> for Tailwind dark mode and child pages
  React.useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('dark', 'light');
    html.classList.add(theme);
    localStorage.setItem('carrymatch-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setSystemThemeOverride(true); // Mark that user manually overrode system preference
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  React.useEffect(() => {
    const authPromise = base44.auth.me();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Auth timeout')), 10000)
    );
    Promise.race([authPromise, timeoutPromise])
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  // Run auto-flag system periodically
  React.useEffect(() => {
    if (!user || user.role !== 'admin') return;

    // Run on mount
    checkAndFlagUsers();
    updateTrustScores();

    // Run every 30 minutes
    const interval = setInterval(() => {
      checkAndFlagUsers();
      updateTrustScores();
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, [user]);

  // Add viewport height fix for mobile browsers
  React.useEffect(() => {
    // Fix for mobile viewport height (accounts for address bar)
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);

    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);

  // Get unread message count
  const { data: unreadMessageCount = 0 } = useQuery({
    queryKey: ['unread-messages', user?.email],
    queryFn: async () => {
      if (!user) return 0;

      const conv1 = await base44.entities.Conversation.filter({
        participant_1_email: user.email
      });

      const conv2 = await base44.entities.Conversation.filter({
        participant_2_email: user.email
      });

      const totalUnread = [...conv1, ...conv2].reduce((sum, conv) => {
        return sum + (conv.participant_1_email === user.email
          ? conv.unread_count_participant_1
          : conv.unread_count_participant_2);
      }, 0);

      return totalUnread;
    },
    enabled: !!user,
    refetchInterval: 30000,
    staleTime: 20000
  });

  // Get unread notification count
  const { data: unreadNotificationCount = 0 } = useQuery({
    queryKey: ['unread-notifications', user?.email],
    queryFn: async () => {
      if (!user) return 0;
      const notifications = await base44.entities.Notification.filter({
        user_email: user.email,
        is_read: false
      });
      return notifications.length;
    },
    enabled: !!user,
    refetchInterval: 30000,
    staleTime: 20000
  });

  // Check if user is vendor staff
  const { data: isVendorStaff = false } = useQuery({
    queryKey: ['is-vendor-staff', user?.email],
    queryFn: async () => {
      if (!user) return false;
      try {
        const staff = await base44.entities.VendorStaff.filter({ email: user.email });
        return staff.length > 0;
      } catch (e) {
        return false;
      }
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000
  });

  // Primary nav items (always visible in top bar)
  const primaryNavItems = [
    { name: "Home", path: createPageUrl("Home"), icon: Home },
    { name: "Browse Trips", path: createPageUrl("BrowseTrips"), icon: Plane },
    { name: "Browse Requests", path: createPageUrl("BrowseRequests"), icon: Package },
    { name: "Bus Tickets", path: createPageUrl("BusSearch"), icon: Bus },
  ];

  // "My" items — shown in user dropdown on desktop, inline on mobile
  const myItems = user ? [
    { name: "My Trips", path: createPageUrl("MyTrips"), icon: Plane },
    { name: "My Requests", path: createPageUrl("MyRequests"), icon: Package },
    { name: "Smart Matches", path: createPageUrl("SmartMatches"), icon: Sparkles },
    { name: "My Matches", path: createPageUrl("MyMatches"), icon: Handshake },
    { name: "Saved Items", path: createPageUrl("SavedItems"), icon: Bookmark },
  ] : [];

  // Admin/staff items — shown in user dropdown on desktop
  const staffItems = permissions.isStaff ? [
    { name: "Admin Dashboard", path: createPageUrl("AdminDashboard"), icon: Shield, requirePermission: 'can_access_admin_dashboard' },
    { name: "Admin Listings", path: createPageUrl("AdminListings"), icon: FileText },
    { name: "Analytics", path: createPageUrl("AdminAnalytics"), icon: Activity, requirePermission: 'can_view_analytics' },
    { name: "Verifications", path: createPageUrl("AdminVerifications"), icon: Shield, requirePermission: 'can_verify_users' },
  ].filter(item => !item.requirePermission || permissions.hasPermission(item.requirePermission)) : [];

  // Utility items with badges (icon-only in header, full in mobile)
  const utilityItems = user ? [
    { name: "Messages", path: createPageUrl("Messages"), icon: MessageSquare, badge: unreadMessageCount },
    { name: "Notifications", path: createPageUrl("Notifications"), icon: Bell, badge: unreadNotificationCount },
  ] : [];

  // All items combined (used for mobile sidebar)
  const allNavigationItems = user
    ? [...primaryNavItems, ...myItems, ...utilityItems, ...staffItems]
    : primaryNavItems;

  // Mobile-only NavLinks (keeps the Sheet sidebar working)
  const MobileNavLinks = ({ onClose = () => {} }) => {
    const groups = [
      { label: null, items: primaryNavItems },
      ...(myItems.length > 0 ? [{ label: "My Items", items: myItems }] : []),
      ...(utilityItems.length > 0 ? [{ label: null, items: utilityItems }] : []),
      ...(staffItems.length > 0 ? [{ label: "Admin", items: staffItems }] : []),
    ];

    return (
      <>
        {groups.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && (
              <div className={`my-2 h-px ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />
            )}
            {group.label && (
              <span className={`px-4 py-1 text-xs font-semibold uppercase tracking-wider ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {group.label}
              </span>
            )}
            {group.items.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative ${
                  location.pathname === item.path
                    ? theme === 'dark'
                      ? 'bg-[#9EFF00]/10 text-[#9EFF00]'
                      : 'bg-[#9EFF00]/20 text-[#1A1A1A]'
                    : theme === 'dark'
                      ? 'text-gray-300 hover:text-white hover:bg-white/5'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="font-medium">{item.name}</span>
                {item.badge > 0 && (
                  <Badge className="ml-auto bg-[#9EFF00] text-[#1A1A1A] text-xs px-2 py-0.5">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            ))}
          </React.Fragment>
        ))}
      </>
    );
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]'
              : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
          }`}>
            {user && <SavedItemsBackgroundMonitor user={user} />}
            {user && <WelcomeOnboarding user={user} />}

            {/* Offline Detector */}
            <OfflineDetector />

            {/* PWA Install Prompt */}
            <PWAInstallPrompt />

            {/* Mobile Header */}
            <MobileHeader theme={theme} />

      <style>{`
              :root.dark {
                --primary: #9EFF00;
                --primary-dark: #7ACC00;
                --accent: #9EFF00;
                --dark-bg: #1a1a2e;
                --card-bg: rgba(255, 255, 255, 0.05);
              }

              :root.light {
                --primary: #9EFF00;
                --primary-dark: #7ACC00;
                --accent: #9EFF00;
                --light-bg: #F9FAFB;
                --card-bg: rgba(255, 255, 255, 0.8);
              }

              html, body {
                overscroll-behavior: none;
                padding-top: env(safe-area-inset-top);
              }

              button, nav a, [role="navigation"] a {
                user-select: none;
              }

              @media (max-width: 768px) {
                main {
                  padding-top: 56px;
                  padding-bottom: env(safe-area-inset-bottom);
                }
              }

        /* Mobile-specific optimizations */
        @media (max-width: 768px) {
          input, select, textarea {
            font-size: 16px !important;
          }

          html {
            -webkit-overflow-scrolling: touch;
          }

          .min-h-screen {
            min-height: calc(var(--vh, 1vh) * 100);
          }

          button, a {
            min-height: 44px;
            min-width: 44px;
          }

          html {
            -webkit-text-size-adjust: 100%;
            text-size-adjust: 100%;
          }

          .safe-area-inset {
            padding-top: env(safe-area-inset-top);
            padding-bottom: env(safe-area-inset-bottom);
            padding-left: env(safe-area-inset-left);
            padding-right: env(safe-area-inset-right);
          }
        }

        @media (display-mode: standalone) {
          .pwa-hide {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* Header - Hidden on mobile */}
      <header
        data-testid="desktop-header"
        className={`hidden md:block fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b transition-colors duration-300 ${
          theme === 'dark'
            ? 'bg-[#1a1a2e]/90 border-white/10'
            : 'bg-white/80 border-gray-200'
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-6 lg:px-8">
          <div className="flex items-center h-16 gap-8">
            {/* Left: Logo */}
            <Link to={createPageUrl("Home")} className="flex-shrink-0 flex items-center group">
              <img
                src={theme === 'dark'
                  ? 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69099ae0c2ff264b7aca7e74/65b2ef5f6_LogoDark.png'
                  : 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69099ae0c2ff264b7aca7e74/31e7876f4_Logolight.png'
                }
                alt="CarryMatch"
                className="h-9 w-auto transform group-hover:scale-105 transition-transform duration-200"
              />
            </Link>

            {/* Center: Primary Navigation */}
            <nav data-testid="primary-nav" className="hidden md:flex items-center gap-1" role="navigation" aria-label="Primary navigation">
              {primaryNavItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    location.pathname === item.path
                      ? theme === 'dark'
                        ? 'bg-[#9EFF00]/10 text-[#9EFF00]'
                        : 'bg-[#9EFF00]/20 text-[#1A1A1A] font-semibold'
                      : theme === 'dark'
                        ? 'text-gray-300 hover:text-white hover:bg-white/5'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              ))}

              {/* Partner Link */}
              {(!user || isVendorStaff) && (
                <Link
                  to={createPageUrl("LogisticsPartners")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    theme === 'dark'
                      ? 'text-gray-300 hover:text-white hover:bg-white/5'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  <span>Partners</span>
                </Link>
              )}
            </nav>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right: Utilities + Account */}
            <div className="flex items-center gap-2" data-testid="header-right">
              {/* Utility icons (Messages, Notifications) — only when logged in */}
              {user && utilityItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${
                    location.pathname === item.path
                      ? theme === 'dark'
                        ? 'bg-[#9EFF00]/10 text-[#9EFF00]'
                        : 'bg-[#9EFF00]/20 text-[#1A1A1A]'
                      : theme === 'dark'
                        ? 'text-gray-400 hover:text-white hover:bg-white/5'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title={item.name}
                  aria-label={item.name}
                >
                  <item.icon className="w-[18px] h-[18px]" />
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold px-1 ring-2 ring-[#1a1a2e]">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </Link>
              ))}

              {/* Subtle divider before theme/account */}
              {user && (
                <div className={`w-px h-6 mx-1 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />
              )}

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                className={`group relative w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-yellow-400 hover:bg-white/5 active:scale-95'
                    : 'text-gray-500 hover:text-indigo-600 hover:bg-gray-100 active:scale-95'
                }`}
              >
                {theme === 'dark' ? (
                  <Sun className="w-[18px] h-[18px] group-hover:rotate-12 transition-transform duration-300" />
                ) : (
                  <Moon className="w-[18px] h-[18px] group-hover:-rotate-12 transition-transform duration-300" />
                )}
              </button>

              {user ? (
                /* ── Avatar Dropdown ── */
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      data-testid="user-menu-trigger"
                      className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full transition-all duration-200 group outline-none focus-visible:ring-2 focus-visible:ring-[#9EFF00]/50 ${
                        theme === 'dark'
                          ? 'hover:bg-white/5 active:bg-white/10'
                          : 'hover:bg-gray-100 active:bg-gray-200'
                      }`}
                      aria-label="Account menu"
                    >
                      <div className="relative">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center ring-2 ring-transparent group-hover:ring-white/20 transition-all">
                          <span className="text-white text-sm font-semibold">
                            {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#1a1a2e]" />
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform group-data-[state=open]:rotate-180 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    sideOffset={8}
                    className={`w-64 p-1 ${
                      theme === 'dark'
                        ? 'bg-[#1a1a2e] border-white/10'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    {/* User identity */}
                    <div className={`px-3 py-2.5 mb-1 rounded-md ${
                      theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'
                    }`}>
                      <p className={`text-sm font-semibold truncate ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {user.full_name || 'User'}
                      </p>
                      <p className={`text-xs truncate ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {user.email}
                      </p>
                    </div>

                    {/* Profile link */}
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to={createPageUrl("UserProfile", `email=${user.email}`)} className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>

                    {/* My Items group */}
                    {myItems.length > 0 && (
                      <>
                        <DropdownMenuSeparator className={theme === 'dark' ? 'bg-white/10' : ''} />
                        <DropdownMenuLabel className={`text-xs uppercase tracking-wider ${
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          My Items
                        </DropdownMenuLabel>
                        <DropdownMenuGroup>
                          {myItems.map((item) => (
                            <DropdownMenuItem key={item.name} asChild className="cursor-pointer">
                              <Link to={item.path} className="flex items-center gap-2">
                                <item.icon className="w-4 h-4" />
                                <span>{item.name}</span>
                              </Link>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuGroup>
                      </>
                    )}

                    {/* Admin group */}
                    {staffItems.length > 0 && (
                      <>
                        <DropdownMenuSeparator className={theme === 'dark' ? 'bg-white/10' : ''} />
                        <DropdownMenuLabel className={`text-xs uppercase tracking-wider ${
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          Admin
                        </DropdownMenuLabel>
                        <DropdownMenuGroup>
                          {staffItems.map((item) => (
                            <DropdownMenuItem key={item.name} asChild className="cursor-pointer">
                              <Link to={item.path} className="flex items-center gap-2">
                                <item.icon className="w-4 h-4" />
                                <span>{item.name}</span>
                              </Link>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuGroup>
                      </>
                    )}

                    {/* Logout */}
                    <DropdownMenuSeparator className={theme === 'dark' ? 'bg-white/10' : ''} />
                    <DropdownMenuItem
                      data-testid="logout-button"
                      onClick={() => base44.auth.logout()}
                      className={`cursor-pointer ${
                        theme === 'dark'
                          ? 'text-red-400 focus:text-red-300 focus:bg-red-500/10'
                          : 'text-red-600 focus:text-red-700 focus:bg-red-50'
                      }`}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button
                  onClick={() => base44.auth.redirectToLogin()}
                  className={`flex items-center gap-2 px-5 py-2 rounded-full font-semibold text-sm transition-all duration-300 active:scale-95 shadow-lg ${
                    theme === 'dark'
                      ? 'bg-white text-gray-900 hover:bg-gray-100 shadow-white/10 hover:shadow-white/20'
                      : 'bg-gray-900 text-white hover:bg-gray-800 shadow-gray-900/20 hover:shadow-gray-900/40'
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sheet Menu — no visible trigger; mobile nav is handled by MobileHeader + MobileTouchMenu bottom bar */}

      {/* Main Content */}
      <main className="min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-4rem)] md:mt-16 pb-20 md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
          >
            <ErrorBoundary fallbackMessage="This page encountered an error. Please try refreshing or go back home.">
              {children}
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer - Hidden on mobile */}
      <footer className={`hidden md:block border-t backdrop-blur-xl mt-20 transition-colors duration-300 ${
        theme === 'dark'
          ? 'border-white/5 bg-[#0A0A0A]/50'
          : 'border-gray-200 bg-white/50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="mb-4">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69099ae0c2ff264b7aca7e74/4080502d7_Logohorizontal.png"
                  alt="CarryMatch"
                  className="h-12 w-auto"
                />
              </div>
              <p className={`text-sm leading-relaxed mb-4 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                One Journey, Two Wins
              </p>
              <p className={`text-sm mb-6 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Operated by <span className="font-semibold text-[#9EFF00]">Lawtekno LLC</span>
                <br />
                Est. 2021, Maryland USA
              </p>
            </div>

            <div>
              <h3 className={`font-semibold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Quick Links
              </h3>
              <div className="space-y-2">
                <Link to={createPageUrl("FAQ")} className={`block text-sm ${
                  theme === 'dark' ? 'text-gray-400 hover:text-[#9EFF00]' : 'text-gray-600 hover:text-[#7ACC00]'
                } transition-colors`}>
                  FAQ
                </Link>
                <Link to={createPageUrl("BrowseTrips")} className={`block text-sm ${
                  theme === 'dark' ? 'text-gray-400 hover:text-[#9EFF00]' : 'text-gray-600 hover:text-[#7ACC00]'
                } transition-colors`}>
                  Browse Trips
                </Link>
                <Link to={createPageUrl("BrowseRequests")} className={`block text-sm ${
                  theme === 'dark' ? 'text-gray-400 hover:text-[#9EFF00]' : 'text-gray-600 hover:text-[#7ACC00]'
                } transition-colors`}>
                  Browse Requests
                </Link>
                <Link to={createPageUrl("DriverApp")} className={`block text-sm ${
                  theme === 'dark' ? 'text-gray-400 hover:text-[#9EFF00]' : 'text-gray-600 hover:text-[#7ACC00]'
                } transition-colors`}>
                  Driver App
                </Link>
              </div>
            </div>

            <div>
              <h3 className={`font-semibold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Legal & Support
              </h3>
              <div className="space-y-2">
                <a href="https://mycarrymatch.com/termsandconditions" target="_blank" rel="noopener noreferrer" className={`block text-sm ${
                  theme === 'dark' ? 'text-gray-400 hover:text-[#9EFF00]' : 'text-gray-600 hover:text-[#7ACC00]'
                } transition-colors`}>
                  Terms & Conditions
                </a>
                <a href="https://mycarrymatch.com/privacypolicy" target="_blank" rel="noopener noreferrer" className={`block text-sm ${
                  theme === 'dark' ? 'text-gray-400 hover:text-[#9EFF00]' : 'text-gray-600 hover:text-[#7ACC00]'
                } transition-colors`}>
                  Privacy Policy
                </a>
                <Link to={createPageUrl("ContactUs")} className={`block text-sm ${
                  theme === 'dark' ? 'text-gray-400 hover:text-[#9EFF00]' : 'text-gray-600 hover:text-[#7ACC00]'
                } transition-colors`}>
                  Contact Us
                </Link>
              </div>
            </div>
          </div>

          <div className={`mt-8 pt-8 border-t text-center text-sm ${
            theme === 'dark'
              ? 'border-white/5 text-gray-500'
              : 'border-gray-200 text-gray-600'
          }`}>
            © 2025 CarryMatch. All rights reserved.
          </div>
        </div>
      </footer>

      {/* AI Chatbot */}
      <AIChatbot />

      {/* Mobile Bottom Navigation */}
      {user && <MobileTouchMenu currentPath={location.pathname} user={user} unreadCount={unreadMessageCount + unreadNotificationCount} />}
      </div>
      );
      }