import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Save, Info } from "lucide-react";
import { toast } from "sonner";

const TEMPLATE_TYPES = [
  { value: "purchase", label: "Purchase Confirmation", color: "bg-green-500/20 text-green-400" },
  { value: "boarding_reminder", label: "Boarding Reminder", color: "bg-blue-500/20 text-blue-400" },
  { value: "time_update", label: "Trip Time Update", color: "bg-yellow-500/20 text-yellow-400" },
  { value: "cancel", label: "Trip Canceled", color: "bg-red-500/20 text-red-400" },
  { value: "seat_change", label: "Seat Changed", color: "bg-purple-500/20 text-purple-400" }
];

const PLACEHOLDERS = [
  "{passenger_name}", "{route}", "{date}", "{time}", "{seat}", 
  "{ticket_code}", "{branch}", "{operator_phone}", "{operator_name}"
];

export default function MessageTemplates() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [templates, setTemplates] = useState({});

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: operator } = useQuery({
    queryKey: ['msg-operator', user?.email],
    queryFn: async () => {
      const ops = await base44.entities.BusOperator.filter({ created_by: user.email });
      return ops[0];
    },
    enabled: !!user
  });

  const { data: existingTemplates = [] } = useQuery({
    queryKey: ['message-templates', operator?.id],
    queryFn: () => base44.entities.MessageTemplate.filter({ operator_id: operator.id }),
    enabled: !!operator,
    onSuccess: (data) => {
      const templateMap = {};
      data.forEach(t => {
        templateMap[t.template_type] = t.content_text;
      });
      setTemplates(templateMap);
    }
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async ({ type, content }) => {
      const existing = existingTemplates.find(t => t.template_type === type);
      if (existing) {
        await base44.entities.MessageTemplate.update(existing.id, { content_text: content });
      } else {
        await base44.entities.MessageTemplate.create({
          operator_id: operator.id,
          template_type: type,
          content_text: content
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['message-templates']);
      toast.success("Template saved!");
    }
  });

  const getDefaultTemplate = (type) => {
    switch(type) {
      case "purchase":
        return "Hi {passenger_name}! Your ticket is confirmed for {route} on {date} at {time}. Seat: {seat}. Ticket code: {ticket_code}. Contact: {operator_phone}";
      case "boarding_reminder":
        return "Reminder: Your trip {route} departs {date} at {time}. Boarding at {branch}. Seat: {seat}. Ticket: {ticket_code}. See you soon!";
      case "time_update":
        return "Update: Your trip {route} departure time has changed to {time} on {date}. Seat: {seat}. Contact: {operator_phone}";
      case "cancel":
        return "Important: Your trip {route} scheduled for {date} at {time} has been canceled. Please contact {operator_phone} for refund.";
      case "seat_change":
        return "Update: Your seat has been changed to {seat} for {route} on {date} at {time}. Ticket: {ticket_code}";
      default:
        return "";
    }
  };

  if (!user || !operator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Message Templates</h1>
          <p className="text-gray-400">Customize WhatsApp/SMS notifications for passengers</p>
        </div>

        <Card className="p-6 bg-blue-500/10 border-blue-500/30 mb-8">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-300 font-semibold mb-2">Available Placeholders</p>
              <div className="flex flex-wrap gap-2">
                {PLACEHOLDERS.map(p => (
                  <Badge key={p} className="bg-blue-500/20 text-blue-300 font-mono text-xs">
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          {TEMPLATE_TYPES.map(({ value, label, color }) => (
            <Card key={value} className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-bold text-white">{label}</h3>
                </div>
                <Badge className={color}>{value}</Badge>
              </div>

              <div className="space-y-3">
                <Label className="text-gray-300">Message Content</Label>
                <Textarea
                  value={templates[value] || getDefaultTemplate(value)}
                  onChange={(e) => setTemplates({...templates, [value]: e.target.value})}
                  rows={4}
                  className="bg-white/5 border-white/10 text-white font-mono text-sm"
                  placeholder={getDefaultTemplate(value)}
                />
                
                <div className="flex justify-end">
                  <Button
                    onClick={() => saveTemplateMutation.mutate({ 
                      type: value, 
                      content: templates[value] || getDefaultTemplate(value) 
                    })}
                    disabled={saveTemplateMutation.isPending}
                    size="sm"
                    className="bg-blue-500"
                  >
                    <Save className="w-3 h-3 mr-2" />
                    Save Template
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}