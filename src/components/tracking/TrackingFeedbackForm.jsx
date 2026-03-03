import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Send, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function TrackingFeedbackForm({ shipment, vendor }) {
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    feedback_type: "INQUIRY",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);

  const submitFeedbackMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.TrackingFeedback.create({
        shipment_id: shipment.id,
        tracking_code: shipment.tracking_code,
        vendor_id: vendor.id,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        feedback_type: formData.feedback_type,
        message: formData.message,
        status: "PENDING"
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setFormData({
          customer_name: "",
          customer_email: "",
          customer_phone: "",
          feedback_type: "INQUIRY",
          message: ""
        });
      }, 3000);
    }
  });

  return (
    <Card className="p-6 bg-white/5 border-white/10">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-blue-400" />
        <h3 className="font-bold text-white">Have a Question or Issue?</h3>
      </div>

      {submitted ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8"
        >
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
          <h3 className="text-xl font-bold text-white mb-2">Feedback Submitted!</h3>
          <p className="text-gray-400">The vendor will review your message and respond soon.</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Your Name</Label>
              <Input
                value={formData.customer_name}
                onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                placeholder="John Doe"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Email</Label>
              <Input
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                placeholder="john@example.com"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Phone (Optional)</Label>
              <Input
                value={formData.customer_phone}
                onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                placeholder="+1234567890"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Type</Label>
              <Select value={formData.feedback_type} onValueChange={(v) => setFormData({...formData, feedback_type: v})}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INQUIRY">General Inquiry</SelectItem>
                  <SelectItem value="ISSUE">Report Issue</SelectItem>
                  <SelectItem value="COMPLAINT">Complaint</SelectItem>
                  <SelectItem value="COMPLIMENT">Compliment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-gray-300">Message *</Label>
            <Textarea
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              placeholder="Describe your question or issue..."
              className="bg-white/5 border-white/10 text-white"
              rows={4}
            />
          </div>

          <Button
            onClick={() => submitFeedbackMutation.mutate()}
            disabled={!formData.message || submitFeedbackMutation.isPending}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold"
          >
            {submitFeedbackMutation.isPending ? "Sending..." : "Send Message"}
            <Send className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </Card>
  );
}