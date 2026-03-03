import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  QrCode,
  Layers,
  Bell,
  DollarSign,
  FileText,
  Package,
  AlertCircle,
  Route as RouteIcon,
  Shield,
  Settings,
  Users
} from "lucide-react";
import { motion } from "framer-motion";

export default function QuickActionsPanel({ permissions, vendorStaff, stats }) {
  const quickActions = [
    { 
      icon: Plus, 
      label: "New Shipment", 
      path: "VendorShipmentIntake", 
      color: "from-blue-500 to-cyan-500", 
      permission: "can_create_shipment",
      description: "Fast intake form"
    },
    { 
      icon: QrCode, 
      label: "Scan & Update", 
      path: "VendorScanUpdate", 
      color: "from-green-500 to-emerald-500", 
      permission: "can_update_status",
      description: "Update status"
    },
    { 
      icon: Layers, 
      label: "Manage Batches", 
      path: "VendorBatchManagement", 
      color: "from-purple-500 to-pink-500", 
      permission: "can_add_batch",
      description: "Create & lock batches",
      badge: stats.activeBatches?.open || 0
    },
    { 
      icon: Package, 
      label: "View Shipments", 
      path: "VendorShipments", 
      color: "from-indigo-500 to-purple-500",
      permission: null,
      description: "All shipments",
      badge: (stats.shipments?.received || 0) + (stats.shipments?.inTransit || 0)
    },
    { 
      icon: DollarSign, 
      label: "Payments", 
      path: "VendorShipmentPayments", 
      color: "from-yellow-500 to-orange-500", 
      permission: "can_view_amounts",
      description: "Record & track",
      badge: stats.alerts?.pendingPayment || 0
    },
    { 
      icon: DollarSign, 
      label: "Closeout", 
      path: "VendorCashierCloseout", 
      color: "from-emerald-500 to-green-600", 
      permission: "can_record_payment",
      description: "End of day"
    },
    { 
      icon: Bell, 
      label: "Notifications", 
      path: "VendorNotificationLogs", 
      color: "from-orange-500 to-red-500", 
      permission: "can_bulk_notify",
      description: "Bulk notify & logs"
    },
    { 
      icon: FileText, 
      label: "Reports", 
      path: "VendorReports", 
      color: "from-teal-500 to-cyan-500",
      permission: null,
      description: "Analytics & exports"
    },
    { 
      icon: AlertCircle, 
      label: "Issues", 
      path: "VendorIssues", 
      color: "from-red-500 to-pink-500",
      permission: null,
      description: "Delayed & on-hold",
      badge: (stats.alerts?.delayed || 0) + (stats.alerts?.onHold || 0)
    },
    { 
      icon: Shield, 
      label: "Claims", 
      path: "VendorInsuranceClaims", 
      color: "from-indigo-500 to-blue-500",
      permission: "can_view_amounts",
      description: "Insurance claims"
    },
    { 
      icon: RouteIcon, 
      label: "Routes", 
      path: "VendorRouteOptimization", 
      color: "from-green-500 to-teal-500",
      permission: "can_create_batches",
      description: "Optimize routes"
    },
    { 
      icon: Users, 
      label: "Staff", 
      path: "VendorStaffManagement", 
      color: "from-amber-500 to-yellow-500",
      permission: "can_manage_staff",
      description: "Manage team"
    },
    { 
      icon: Settings, 
      label: "Settings", 
      path: "VendorSettings", 
      color: "from-gray-500 to-zinc-600",
      permission: null,
      description: "Vendor config"
    }
  ];

  const filteredActions = quickActions.filter(action => 
    !action.permission || permissions.hasPermission(action.permission)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-8"
    >
      <Card className="p-6 bg-gradient-to-br from-white/5 to-white/10 border-white/10">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 sm:w-5 sm:h-5 text-[#9EFF00]" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10 gap-2 sm:gap-3">
          {filteredActions.map((action, index) => (
            <Link key={index} to={createPageUrl(action.path)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="group"
              >
                <Card className="p-3 sm:p-4 bg-white/5 border-white/10 hover:bg-white/10 transition-all cursor-pointer group text-center relative overflow-hidden h-full">
                  {action.badge > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5 z-10">
                      {action.badge}
                    </Badge>
                  )}
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${action.color} mx-auto mb-1.5 sm:mb-2 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-gray-300 group-hover:text-white transition-colors mb-0.5 sm:mb-1 leading-tight">
                    {action.label}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 group-hover:text-gray-400 transition-colors leading-tight hidden sm:block">
                    {action.description}
                  </p>
                </Card>
              </motion.div>
            </Link>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}