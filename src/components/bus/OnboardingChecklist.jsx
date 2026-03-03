import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, AlertCircle } from "lucide-react";

export default function OnboardingChecklist({ operator }) {
  const { data: branches = [] } = useQuery({
    queryKey: ['operator-branches', operator.id],
    queryFn: () => base44.entities.OperatorBranch.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['operator-templates', operator.id],
    queryFn: () => base44.entities.SeatMapTemplate.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['operator-vehicles', operator.id],
    queryFn: () => base44.entities.Vehicle.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['operator-routes-check', operator.id],
    queryFn: () => base44.entities.BusRoute.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const checks = [
    { 
      label: "Company Profile", 
      completed: !!operator.name && !!operator.phone && !!operator.email,
      description: "Basic company information"
    },
    { 
      label: "Station/Branch", 
      completed: branches.length > 0,
      description: `${branches.length} branch(es) added`
    },
    { 
      label: "Seat Map Template", 
      completed: templates.length > 0,
      description: `${templates.length} template(s) created`
    },
    { 
      label: "Vehicle", 
      completed: vehicles.length > 0,
      description: `${vehicles.length} vehicle(s) registered`
    },
    { 
      label: "Route", 
      completed: routes.length > 0,
      description: `${routes.length} route(s) configured`
    }
  ];

  const allCompleted = checks.every(c => c.completed);
  const completedCount = checks.filter(c => c.completed).length;

  return (
    <Card className="p-6 bg-white/5 border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">Setup Progress</h3>
        <Badge className={
          allCompleted 
            ? "bg-green-500/20 text-green-400 border-green-500/30"
            : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
        }>
          {completedCount}/{checks.length} Complete
        </Badge>
      </div>

      {operator.status === "pending" && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-300 font-semibold">Awaiting Admin Approval</p>
            <p className="text-xs text-gray-400">Complete all steps to expedite approval</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {checks.map((check, index) => (
          <div 
            key={index}
            className="flex items-start gap-3 p-3 rounded-lg bg-white/5"
          >
            {check.completed ? (
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <Circle className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <div className={`font-medium ${check.completed ? 'text-white' : 'text-gray-400'}`}>
                {check.label}
              </div>
              <div className="text-xs text-gray-500">{check.description}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}