import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "../components/hooks/useCurrentUser";
import { useBusOperator } from "../components/hooks/useBusOperator";
import LoadingCard from "../components/shared/LoadingCard";
import EmptyState from "../components/shared/EmptyState";
import QueryErrorFallback from "../components/shared/QueryErrorFallback";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bus, Route, Users, TrendingUp, AlertCircle, Printer, 
  Calendar, DollarSign, FileText, Truck, Settings,
  Tag, BarChart, MessageSquare, CreditCard
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import OnboardingChecklist from "../components/bus/OnboardingChecklist";
import { useBusVendorPermissions } from "../components/bus/useBusVendorPermissions";

export default function VendorBusDashboard() {
  const { user, loading: userLoading } = useCurrentUser();
  const { data: operator, error: operatorError, refetch: refetchOperator } = useBusOperator(user?.email);

  const permissions = useBusVendorPermissions(user, operator);

  if (userLoading) {
    return <LoadingCard message="Loading dashboard..." />;
  }

  if (!user) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Sign In Required"
        actionLabel="Sign In"
        onAction={() => base44.auth.redirectToLogin()}
      />
    );
  }

  if (operatorError) {
    return <QueryErrorFallback error={operatorError} onRetry={refetchOperator} title="Failed to load operator data" />;
  }

  if (!operator) {
    return (
      <EmptyState
        icon={Bus}
        title="Become a Bus Operator"
        description="Register your bus company to start selling tickets on CarryMatch"
        actionLabel="Register Company"
        onAction={() => window.location.href = createPageUrl("BusOperatorSignup")}
      />
    );
  }

  if (!permissions.hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-12 bg-white/5 border-white/10 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h3 className="text-2xl font-bold text-white mb-2">Access Denied</h3>
          <p className="text-gray-400">You don't have permission to access this operator's dashboard</p>
        </Card>
      </div>
    );
  }

  const operatorUrl = operator ? `${window.location.origin}${createPageUrl("BusOperatorPage", `slug=${operator.public_slug}`)}` : '';
  const qrCodeUrl = operator ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(operatorUrl)}` : '';

  const downloadQR = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `${operator.public_slug}-qr-code.png`;
    link.click();
  };

  const printPoster = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Book with ${operator.name}</title>
        <style>
          body { font-family: Arial; text-align: center; padding: 40px; }
          .logo { max-width: 200px; margin: 20px auto; }
          h1 { font-size: 48px; margin: 20px 0; }
          .qr { margin: 40px auto; }
          p { font-size: 24px; margin: 20px 0; }
          .url { font-size: 18px; color: #666; }
        </style>
      </head>
      <body>
        ${operator.logo_url ? `<img class="logo" src="${operator.logo_url}" alt="${operator.name}" />` : ''}
        <h1>${operator.name}</h1>
        <p>Scan to Book Your Ticket</p>
        <img class="qr" src="${qrCodeUrl}" width="400" height="400" />
        <p class="url">${operatorUrl}</p>
        <p>📞 ${operator.phone || ''} | 📧 ${operator.email || ''}</p>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Navigation items with permissions
  const navigationSections = [
    {
      title: "Core Operations",
      items: [
        { 
          name: "Routes & Templates", 
          path: permissions.can.manageRoutes ? createPageUrl("ManageBusRoutes") : null,
          icon: Route,
          permission: "manageRoutes",
          description: "Manage routes and seat templates"
        },
        { 
          name: "Vehicles", 
          path: permissions.can.manageVehicles ? createPageUrl("ManageBusVehicles") : null,
          icon: Bus,
          permission: "manageVehicles",
          description: "Manage your fleet"
        },
        { 
          name: "Trips", 
          path: permissions.can.manageTrips ? createPageUrl("ManageBusTrips") : (permissions.can.viewTrips ? createPageUrl("ManageBusTrips") : null),
          icon: Calendar,
          permission: "viewTrips",
          description: "Schedule and manage trips"
        },
        { 
          name: "Today's Departures", 
          path: permissions.can.viewTrips ? createPageUrl("TodayManifests") : null,
          icon: FileText,
          permission: "viewTrips",
          badge: "Quick",
          description: "Boarding dashboards for today"
        },
        { 
          name: "Recurring Services", 
          path: permissions.can.manageTrips ? createPageUrl("ManageRecurringServices") : null,
          icon: Calendar,
          permission: "manageTrips",
          description: "Auto-generate scheduled trips"
        },
      ]
    },
    {
      title: "Sales & Service",
      items: [
        { 
          name: "Passengers (CRM)", 
          path: permissions.can.passengerCRM ? createPageUrl("BusPassengerCRM") : null,
          icon: Users,
          permission: "passengerCRM",
          description: "Passenger database & lookup"
        },
        { 
          name: "Counter Sales", 
          path: permissions.can.offlineSales ? createPageUrl("VendorOfflineSales") : null,
          icon: DollarSign,
          permission: "offlineSales",
          badge: "Quick",
          description: "Sell tickets at counter"
        },
        { 
          name: "Message Passengers", 
          path: permissions.can.manageTrips ? createPageUrl("TripMessaging") : null,
          icon: MessageSquare,
          permission: "manageTrips",
          description: "Send trip updates"
        },
        { 
          name: "Driver Dispatcher", 
          path: permissions.can.manageTrips ? createPageUrl("DriverDispatcher") : null,
          icon: Truck,
          permission: "manageTrips",
          badge: "Live",
          description: "Real-time driver tracking"
        },
        { 
          name: "Drivers", 
          path: permissions.can.manageVehicles ? createPageUrl("ManageDrivers") : null,
          icon: Users,
          permission: "manageVehicles",
          description: "Driver profiles & incidents"
        },
        { 
          name: "Driver Performance", 
          path: permissions.can.reports ? createPageUrl("DriverPerformanceAnalytics") : null,
          icon: BarChart,
          permission: "reports",
          description: "Driver metrics & ratings"
        },
        { 
          name: "Driver Schedule", 
          path: permissions.can.manageTrips ? createPageUrl("DriverSchedule") : null,
          icon: Calendar,
          permission: "manageTrips",
          description: "Shifts & availability"
        },
      ]
    },
    {
      title: "Agency Growth Tools",
      items: [
        { 
          name: "Marketing Tools", 
          path: permissions.can.marketingTools ? createPageUrl("BusMarketingTools") : null,
          icon: Printer,
          permission: "marketingTools",
          description: "QR codes & posters"
        },
        { 
          name: "Promo Codes", 
          path: permissions.can.promoCodes ? createPageUrl("ManagePromoCodes") : null,
          icon: Tag,
          permission: "promoCodes",
          description: "Discount campaigns"
        },
        { 
          name: "Promo Analytics", 
          path: permissions.can.reports ? createPageUrl("PromoAnalytics") : null,
          icon: BarChart,
          permission: "reports",
          description: "Promo redemptions & impact"
        },
        { 
          name: "Referral Analytics", 
          path: permissions.can.reports ? createPageUrl("ReferralAnalytics") : null,
          icon: Users,
          permission: "reports",
          description: "Agent referral performance"
        },
        { 
          name: "Daily Closeout", 
          path: permissions.can.closeout ? createPageUrl("DailyCloseout") : null,
          icon: CreditCard,
          permission: "closeout",
          description: "End-of-day reconciliation"
        },
        { 
          name: "Ratings & Feedback", 
          path: permissions.can.ratings ? createPageUrl("BusRatings") : null,
          icon: MessageSquare,
          permission: "ratings",
          description: "Customer reviews"
        },
        { 
          name: "Message Templates", 
          path: permissions.can.settings ? createPageUrl("MessageTemplates") : null,
          icon: MessageSquare,
          permission: "settings",
          description: "WhatsApp/SMS templates"
        },
      ]
    },
    {
      title: "Analytics & Admin",
      items: [
        { 
          name: "ETA Monitor", 
          path: permissions.can.reports ? createPageUrl("ETAMonitor") : null,
          icon: TrendingUp,
          permission: "reports",
          badge: "Live",
          description: "Real-time ETA tracking & updates"
        },
        { 
          name: "Sales Reports", 
          path: permissions.can.reports ? createPageUrl("VendorBusReports") : null,
          icon: BarChart,
          permission: "reports",
          description: "Revenue & performance"
        },
        { 
          name: "Agent PINs", 
          path: permissions.can.settings ? createPageUrl("ManageAgentPINs") : null,
          icon: Users,
          permission: "settings",
          description: "Manage staff PINs"
        },
        { 
          name: "Settings", 
          path: permissions.can.settings ? createPageUrl("BusOperatorSettings") : null,
          icon: Settings,
          permission: "settings",
          description: "Company & preferences"
        },
        { 
          name: "Rebalance History", 
          path: permissions.can.reports ? createPageUrl("RebalanceHistory") : null,
          icon: BarChart,
          permission: "reports",
          description: "Seat reallocation events"
        },
        { 
          name: "Seat Reports", 
          path: permissions.can.reports ? createPageUrl("BusSeatReports") : null,
          icon: TrendingUp,
          permission: "reports",
          description: "Branch performance & insights"
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{operator.name}</h1>
              <p className="text-gray-400">Bus Operator Dashboard</p>
            </div>
            <Badge className={
              permissions.isOperator ? "bg-purple-500/20 text-purple-400" :
              permissions.isAgent ? "bg-blue-500/20 text-blue-400" :
              "bg-green-500/20 text-green-400"
            }>
              {permissions.isOperator ? "Operator Admin" : 
               permissions.isAgent ? "Counter Agent" : 
               "Check-in Staff"}
            </Badge>
          </div>
          {operator.status === 'pending' && (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 mt-2">
              <AlertCircle className="w-3 h-3 mr-1" />
              Pending Approval
            </Badge>
          )}
        </div>

        {/* Onboarding Checklist (operator admin only) */}
        {operator.status === 'pending' && permissions.isOperator && (
          <div className="mb-8">
            <OnboardingChecklist operator={operator} />
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <Route className="w-5 h-5 text-blue-400" />
              <span className="text-gray-400">Active Routes</span>
            </div>
            <div className="text-3xl font-bold text-white">0</div>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <Bus className="w-5 h-5 text-green-400" />
              <span className="text-gray-400">Vehicles</span>
            </div>
            <div className="text-3xl font-bold text-white">0</div>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-purple-400" />
              <span className="text-gray-400">Today's Bookings</span>
            </div>
            <div className="text-3xl font-bold text-white">0</div>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
              <span className="text-gray-400">Revenue (XAF)</span>
            </div>
            <div className="text-3xl font-bold text-white">0</div>
          </Card>
        </div>

        {/* Navigation Sections */}
        {navigationSections.map(section => {
          const visibleItems = section.items.filter(item => permissions.can[item.permission]);
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="mb-8">
              <h2 className="text-lg font-semibold text-gray-400 mb-4">{section.title}</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleItems.map(item => (
                  <Link key={item.name} to={item.path}>
                    <Card className="p-5 bg-white/5 border-white/10 hover:bg-white/10 transition-all group cursor-pointer">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <item.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white">{item.name}</h3>
                            {item.badge && (
                              <Badge className="bg-green-500/20 text-green-400 text-xs">
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{item.description}</p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}