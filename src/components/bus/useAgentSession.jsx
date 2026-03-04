import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useAgentSession(user, operator) {
  const queryClient = useQueryClient();
  const [isLocked, setIsLocked] = useState(false);
  const [currentStaff, setCurrentStaff] = useState(null);

  const { data: staff } = useQuery({
    queryKey: ['agent-staff', user?.email, operator?.id],
    queryFn: async () => {
      const staffArr = await base44.entities.OperatorStaff.filter({
        user_id: user.email,
        operator_id: operator.id,
        status: "active"
      });
      return staffArr[0];
    },
    enabled: !!user && !!operator
  });

  const { data: activeSession } = useQuery({
    queryKey: ['active-session', user?.email],
    queryFn: async () => {
      const sessions = await base44.entities.AgentSession.filter({
        staff_user_id: user.email,
        session_end: null
      });
      return sessions[0];
    },
    enabled: !!user,
    refetchInterval: 30000
  });

  const { data: sessionBranch } = useQuery({
    queryKey: ['session-branch', activeSession?.branch_id],
    queryFn: async () => {
      const branches = await base44.entities.OperatorBranch.filter({ id: activeSession.branch_id });
      return branches[0];
    },
    enabled: !!activeSession
  });

  useEffect(() => {
    setCurrentStaff(staff);
  }, [staff]);

  const verifyPinMutation = useMutation({
    mutationFn: async (pin) => {
      if (!currentStaff || !currentStaff.pin_hash) {
        throw new Error("No PIN set for this account");
      }

      // Simple hash comparison (in production, use proper bcrypt)
      const hash = btoa(pin);
      if (hash !== currentStaff.pin_hash) {
        throw new Error("Invalid PIN");
      }

      return true;
    }
  });

  const startSessionMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.AgentSession.create({
        staff_user_id: user.email,
        operator_id: operator.id,
        branch_id: data.branch_id,
        session_start: new Date().toISOString(),
        opening_cash_xaf: data.opening_cash_xaf || 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-session'] });
      toast.success("Shift started!");
    }
  });

  const endSessionMutation = useMutation({
    mutationFn: async (closingData) => {
      if (!activeSession) throw new Error("No active session");
      
      return await base44.entities.AgentSession.update(activeSession.id, {
        session_end: new Date().toISOString(),
        closing_cash_xaf: closingData?.closing_cash_xaf,
        total_sales_xaf: closingData?.total_sales_xaf
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-session'] });
      toast.success("Shift ended");
    }
  });

  const lock = () => setIsLocked(true);

  const unlock = async (pin) => {
    await verifyPinMutation.mutateAsync(pin);
    setIsLocked(false);
  };

  return {
    isLocked,
    lock,
    unlock,
    staff: currentStaff,
    activeSession,
    sessionBranch,
    startSession: startSessionMutation.mutate,
    endSession: endSessionMutation.mutate,
    isStartingSession: startSessionMutation.isPending,
    isEndingSession: endSessionMutation.isPending,
    hasActiveSession: !!activeSession
  };
}