import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ScrollText, Search, User, Shield, Package, Truck, CreditCard,
  Clock, AlertTriangle, CheckCircle, Settings2, Tag
} from "lucide-react";
import { motion } from "framer-motion";

const ACTION_COLORS = {
  CREATE: "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400",
  UPDATE: "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400",
  DELETE: "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400",
  ADMIN_ACTION: "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400",
};

const ENTITY_ICONS = {
  SHIPMENT: Package, PAYMENT: CreditCard, VENDOR: Truck,
  BATCH: Package, STAFF: User, USER: User, PROMO: Tag,
};

export default function AuditSection({ isAuthorized }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");

  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: ["sa-audit-logs"],
    queryFn: () => base44.entities.AuditLog.list("-created_date", 200),
    enabled: isAuthorized
  });

  const filtered = auditLogs.filter(log => {
    if (entityFilter !== "all" && log.entity_type !== entityFilter) return false;
    if (actionFilter !== "all" && log.action !== actionFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (log.entity_id || "").toLowerCase().includes(term) ||
             (log.performed_by || "").toLowerCase().includes(term) ||
             (log.details || "").toLowerCase().includes(term);
    }
    return true;
  });

  // Entity type counts
  const entityTypes = [...new Set(auditLogs.map(l => l.entity_type).filter(Boolean))];
  const actionTypes = [...new Set(auditLogs.map(l => l.action).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Audit Log</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Track all admin and system actions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Entries</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{auditLogs.length}</p>
        </Card>
        <Card className="p-3 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
          <p className="text-xs text-gray-500 dark:text-gray-400">Creates</p>
          <p className="text-xl font-bold text-green-500">{auditLogs.filter(l => l.action === "CREATE").length}</p>
        </Card>
        <Card className="p-3 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
          <p className="text-xs text-gray-500 dark:text-gray-400">Updates</p>
          <p className="text-xl font-bold text-blue-500">{auditLogs.filter(l => l.action === "UPDATE").length}</p>
        </Card>
        <Card className="p-3 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
          <p className="text-xs text-gray-500 dark:text-gray-400">Deletes</p>
          <p className="text-xl font-bold text-red-500">{auditLogs.filter(l => l.action === "DELETE").length}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by entity ID, user, or details..."
            className="pl-10 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white" />
        </div>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-[140px] bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-white dark:bg-[#1A1A2E] border-gray-200 dark:border-white/10">
            <SelectItem value="all">All Entities</SelectItem>
            {entityTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[130px] bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-white dark:bg-[#1A1A2E] border-gray-200 dark:border-white/10">
            <SelectItem value="all">All Actions</SelectItem>
            {actionTypes.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="py-12 text-center text-gray-400">Loading audit logs...</div>
      ) : (
        <div className="space-y-2">
          {filtered.slice(0, 100).map((log, i) => {
            const EntityIcon = ENTITY_ICONS[log.entity_type] || Settings2;
            const actionColor = ACTION_COLORS[log.action] || ACTION_COLORS.UPDATE;

            return (
              <motion.div key={log.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.01 }}>
                <Card className="p-3 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:shadow-sm transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <EntityIcon className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-[10px] ${actionColor}`}>{log.action}</Badge>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{log.entity_type}</span>
                        {log.entity_id && <span className="text-xs text-gray-400 font-mono truncate max-w-[120px]">{log.entity_id}</span>}
                      </div>
                      {log.details && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{log.details}</p>}
                      <div className="flex items-center gap-3 mt-1">
                        {log.performed_by && (
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <User className="w-3 h-3" /> {log.performed_by}
                          </span>
                        )}
                        {log.created_date && (
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {new Date(log.created_date).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">No audit logs found</div>
          )}
          {filtered.length > 100 && (
            <p className="text-center text-xs text-gray-400">Showing first 100 of {filtered.length}</p>
          )}
        </div>
      )}
    </div>
  );
}
