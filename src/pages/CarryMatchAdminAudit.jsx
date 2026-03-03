import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText,
  Search,
  Filter,
  Calendar,
  User,
  Package,
  DollarSign,
  Building2
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function CarryMatchAdminAudit() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEntityType, setFilterEntityType] = useState("all");
  const [filterAction, setFilterAction] = useState("all");

  useEffect(() => {
    base44.auth.me().then(user => {
      if (user.role !== "admin") navigate(createPageUrl("Home"));
      setUser(user);
    }).catch(() => navigate(createPageUrl("CarryMatchAdminLogin")));
  }, [navigate]);

  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: ['admin-audit-logs', filterEntityType, filterAction],
    queryFn: async () => {
      let query = {};
      if (filterEntityType !== "all") query.entity_type = filterEntityType;
      if (filterAction !== "all") query.action = filterAction;
      return await base44.entities.AuditLog.filter(query, "-created_date", 200);
    },
    enabled: !!user
  });

  const filteredLogs = auditLogs.filter(log =>
    !searchQuery ||
    log.entity_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.user_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const actionColors = {
    CREATE: "bg-green-500/20 text-green-300",
    UPDATE: "bg-blue-500/20 text-blue-300",
    DELETE: "bg-red-500/20 text-red-300"
  };

  const entityIcons = {
    SHIPMENT: Package,
    PAYMENT: DollarSign,
    VENDOR: Building2,
    BATCH: FileText,
    STAFF: User
  };

  if (!user) return null;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Audit Logs</h1>
              <p className="text-gray-400">System-wide activity tracking</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl("CarryMatchAdminDashboard"))}
              className="border-white/10 text-gray-300"
            >
              Back to Dashboard
            </Button>
          </div>

          {/* Filters */}
          <Card className="p-4 bg-white/5 border-white/10 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-[#9EFF00]" />
              <h3 className="font-bold text-white">Filters</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search entity ID or user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white"
                />
              </div>
              <Select value={filterEntityType} onValueChange={setFilterEntityType}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Entity Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  <SelectItem value="SHIPMENT">Shipments</SelectItem>
                  <SelectItem value="PAYMENT">Payments</SelectItem>
                  <SelectItem value="VENDOR">Vendors</SelectItem>
                  <SelectItem value="BATCH">Batches</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Audit Logs */}
          {isLoading ? (
            <Card className="p-12 bg-white/5 border-white/10 text-center">
              <p className="text-gray-400">Loading audit logs...</p>
            </Card>
          ) : filteredLogs.length === 0 ? (
            <Card className="p-12 bg-white/5 border-white/10 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <p className="text-gray-400">No audit logs found</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log, index) => {
                const EntityIcon = entityIcons[log.entity_type] || FileText;
                
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <Card className="p-4 bg-white/5 border-white/10">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <EntityIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className={actionColors[log.action]}>
                              {log.action}
                            </Badge>
                            <Badge className="bg-white/10 text-gray-300">
                              {log.entity_type}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {format(new Date(log.created_date), "MMM d, yyyy h:mm a")}
                            </span>
                          </div>
                          <div className="grid md:grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-400">Entity ID: </span>
                              <span className="text-white font-mono">{log.entity_id}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">User: </span>
                              <span className="text-white">{log.user_email}</span>
                            </div>
                            {log.changed_fields?.length > 0 && (
                              <div className="md:col-span-2">
                                <span className="text-gray-400">Changed: </span>
                                <span className="text-white">{log.changed_fields.join(", ")}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}