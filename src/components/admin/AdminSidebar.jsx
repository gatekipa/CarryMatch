import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, UsersRound, UserSearch, Tag, BarChart3,
  Settings2, AlertTriangle, ScrollText, ChevronLeft, ChevronRight, ShieldCheck
} from "lucide-react";

const SECTIONS = [
  { key: "overview",    label: "Overview",    icon: LayoutDashboard, permissions: [] },
  { key: "team",        label: "Team",        icon: UsersRound,      permissions: ["can_manage_team"] },
  { key: "customers",   label: "Customers",   icon: UserSearch,      permissions: [] },
  { key: "promos",      label: "Promos",      icon: Tag,             permissions: ["can_manage_promos"] },
  { key: "analytics",   label: "Analytics",   icon: BarChart3,       permissions: ["can_view_analytics"] },
  { key: "operations",  label: "Operations",  icon: Settings2,       permissions: ["can_manage_users", "can_verify_users"] },
  { key: "disputes",    label: "Disputes",    icon: AlertTriangle,   permissions: ["can_handle_disputes"] },
  { key: "audit",       label: "Audit Log",   icon: ScrollText,      permissions: ["can_view_audit_log"] },
];

export default function AdminSidebar({ activeSection, onSectionChange, permissions, collapsed, onToggle, badges = {} }) {
  const visibleSections = SECTIONS.filter(s => {
    if (s.permissions.length === 0) return true;
    return s.permissions.some(p => permissions.hasPermission(p));
  });

  return (
    <aside className={cn(
      "flex-shrink-0 border-r border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] transition-all duration-200",
      collapsed ? "w-16" : "w-56"
    )}>
      <div className="sticky top-0 h-screen flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#9EFF00] to-[#7ACC00] rounded-lg flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-4 h-4 text-[#1A1A1A]" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white truncate">Admin</h2>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">CarryMatch HQ</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {visibleSections.map(section => {
            const Icon = section.icon;
            const isActive = activeSection === section.key;
            const badge = badges[section.key];

            return (
              <button
                key={section.key}
                onClick={() => onSectionChange(section.key)}
                title={collapsed ? section.label : undefined}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg transition-all duration-150 text-left",
                  collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
                  isActive
                    ? "bg-[#9EFF00]/10 text-[#9EFF00] dark:text-[#9EFF00] font-semibold"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <Icon className={cn("w-[18px] h-[18px] flex-shrink-0", isActive && "text-[#9EFF00]")} />
                {!collapsed && (
                  <>
                    <span className="text-sm truncate flex-1">{section.label}</span>
                    {badge > 0 && (
                      <Badge className="bg-red-500 text-white text-[10px] px-1.5 min-w-[20px] justify-center">{badge}</Badge>
                    )}
                  </>
                )}
                {collapsed && badge > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-2 border-t border-gray-200 dark:border-white/10">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
