
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, ArrowLeft, Upload, Loader2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { notifyDispute } from "../components/NotificationCreator";
import { toast } from "sonner";

export default function SubmitDispute() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const matchId = urlParams.get("match_id");
  const tripId = urlParams.get("trip_id");
  const requestId = urlParams.get("request_id");
  
  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [evidenceUrls, setEvidenceUrls] = useState([]);

  const [formData, setFormData] = useState({
    dispute_type: "other",
    description: "",
    respondent_email: "",
    respondent_name: ""
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {
      navigate(createPageUrl("Home"));
    });
  }, []);

  const ALLOWED_DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  const MAX_FILE_SIZE_MB = 10;

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate all files before uploading
    for (const file of files) {
      if (!ALLOWED_DOC_TYPES.includes(file.type)) {
        toast.error(`"${file.name}" is not allowed. Only PDF, JPEG, PNG, or WebP files are accepted.`);
        e.target.value = "";
        return;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`"${file.name}" is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
        e.target.value = "";
        return;
      }
    }

    setIsUploading(true);
    try {
      const uploadPromises = files.map(file =>
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const urls = results.map(r => r.file_url);
      setEvidenceUrls(prev => [...prev, ...urls]);
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Failed to upload some files. Please try again.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const dispute = await base44.entities.Dispute.create({
        match_id: matchId,
        trip_id: tripId,
        request_id: requestId,
        complainant_email: user.email,
        complainant_name: user.full_name || user.email,
        respondent_email: formData.respondent_email,
        respondent_name: formData.respondent_name,
        dispute_type: formData.dispute_type,
        description: formData.description,
        evidence_urls: evidenceUrls,
        status: "open",
        priority: formData.dispute_type === "no_show" || formData.dispute_type === "item_damaged" 
          ? "high" 
          : "medium"
      });

      // Notify the other party
      await notifyDispute(
        formData.respondent_email,
        user.full_name || user.email,
        dispute.id
      );

      navigate(createPageUrl("MyDisputes"));
    } catch (error) {
      console.error("Error submitting dispute:", error);
      toast.error("Failed to submit dispute. Please try again.");
    }
    setIsSubmitting(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 text-gray-300 hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Card className="p-8 bg-white/5 border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Submit Dispute</h1>
                <p className="text-gray-400">Report an issue with your match</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dispute Type */}
              <div>
                <Label className="text-gray-300">Type of Issue *</Label>
                <Select 
                  value={formData.dispute_type} 
                  onValueChange={(value) => setFormData({ ...formData, dispute_type: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="item_damaged">Item Damaged</SelectItem>
                    <SelectItem value="no_show">No Show</SelectItem>
                    <SelectItem value="wrong_item">Wrong Item Received</SelectItem>
                    <SelectItem value="late_delivery">Late Delivery</SelectItem>
                    <SelectItem value="payment_issue">Payment Issue</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Other Party Info */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Other Party Name *</Label>
                  <Input
                    required
                    value={formData.respondent_name}
                    onChange={(e) => setFormData({ ...formData, respondent_name: e.target.value })}
                    placeholder="Name"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Other Party Email *</Label>
                  <Input
                    required
                    type="email"
                    value={formData.respondent_email}
                    onChange={(e) => setFormData({ ...formData, respondent_email: e.target.value })}
                    placeholder="email@example.com"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="text-gray-300">Detailed Description *</Label>
                <Textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Please provide detailed information about what happened..."
                  rows={6}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Include dates, times, locations, and any other relevant details
                </p>
              </div>

              {/* Evidence Upload */}
              <div>
                <Label className="text-gray-300">Evidence (Photos/Documents)</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    id="evidence"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('evidence').click()}
                    disabled={isUploading}
                    className="border-white/10 text-gray-300 hover:text-white"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Files
                      </>
                    )}
                  </Button>
                  {evidenceUrls.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {evidenceUrls.map((url, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-green-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Evidence file {index + 1} uploaded</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Upload photos, screenshots, or documents that support your case
                </p>
              </div>

              {/* Warning */}
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-300">
                    <p className="font-semibold text-white mb-1">Important Notice</p>
                    <p>
                      False disputes may result in account suspension. Please ensure all information 
                      is accurate. Our team will review your dispute within 24-48 hours and contact 
                      both parties if additional information is needed.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1 border-white/10 text-gray-300 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Dispute"
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
