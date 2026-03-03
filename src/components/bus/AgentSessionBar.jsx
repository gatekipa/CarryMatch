import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, MapPin, Clock, Lock } from "lucide-react";
import { format } from "date-fns";

export default function AgentSessionBar({ session, branch, staff, onLock, onEndSession }) {
  if (!session) return null;

  const duration = Math.floor((new Date() - new Date(session.session_start)) / 1000 / 60);
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  return (
    <Card className="mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-500/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-blue-400" />
            <div>
              <p className="text-xs text-gray-400">Agent</p>
              <p className="text-white font-semibold">{staff?.user_id?.split('@')[0] || 'You'}</p>
            </div>
          </div>

          {branch && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-400" />
              <div>
                <p className="text-xs text-gray-400">Branch</p>
                <p className="text-white font-medium">{branch.branch_name}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <div>
              <p className="text-xs text-gray-400">Shift Duration</p>
              <p className="text-white font-medium">{hours}h {minutes}m</p>
            </div>
          </div>

          <Badge className="bg-green-500/20 text-green-400">
            Session Active
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onLock}
            className="border-white/10"
          >
            <Lock className="w-4 h-4 mr-2" />
            Lock
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onEndSession}
            className="border-red-500/30 text-red-400"
          >
            End Shift
          </Button>
        </div>
      </div>
    </Card>
  );
}