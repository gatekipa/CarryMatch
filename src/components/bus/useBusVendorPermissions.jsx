import { useQuery } from "@tanstack/react-query";
import { OperatorStaff } from "@/api/entities";

export function useBusVendorPermissions(user, operator) {
  const { data: staffRecord } = useQuery({
    queryKey: ['bus-staff-permissions', user?.email, operator?.id],
    queryFn: async () => {
      if (!user || !operator) return null;

      // The hook already receives auth-derived state from callers.
      // Future migration seam: keep this hook reading user/session data
      // from auth/context consumers and entity data from app-owned services.
      
      // Check if user is the operator owner
      if (operator.created_by === user.email) {
        return {
          operator_id: operator.id,
          user_id: user.email,
          staff_role: "vendor_bus_operator",
          status: "active"
        };
      }

      // Check if user is staff
      const staff = await OperatorStaff.filter({
        operator_id: operator.id,
        user_id: user.email,
        status: "active"
      });

      return staff[0] || null;
    },
    enabled: !!user && !!operator
  });

  const role = staffRecord?.staff_role || null;

  return {
    role,
    isOperator: role === "vendor_bus_operator",
    isAgent: role === "vendor_bus_agent",
    isCheckin: role === "vendor_bus_checkin",
    hasAccess: !!role,
    
    // Granular permissions
    can: {
      viewDashboard: !!role,
      manageRoutes: role === "vendor_bus_operator",
      manageVehicles: role === "vendor_bus_operator",
      manageTrips: role === "vendor_bus_operator",
      viewTrips: !!role,
      offlineSales: role === "vendor_bus_operator" || role === "vendor_bus_agent",
      checkin: role === "vendor_bus_operator" || role === "vendor_bus_checkin",
      viewManifest: !!role,
      marketingTools: role === "vendor_bus_operator" || role === "vendor_bus_agent",
      passengerCRM: role === "vendor_bus_operator" || role === "vendor_bus_agent",
      promoCodes: role === "vendor_bus_operator",
      closeout: role === "vendor_bus_operator" || role === "vendor_bus_agent",
      ratings: role === "vendor_bus_operator",
      settings: role === "vendor_bus_operator",
      reports: role === "vendor_bus_operator",
      manageSeatMaps: role === "vendor_bus_operator"
    }
  };
}
