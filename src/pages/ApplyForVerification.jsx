import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Plane,
  Package,
  Shield,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  ArrowLeft,
  Loader2,
  Star,
  Award
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";

export default function ApplyForVerification() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("verified_traveler");
  const [experienceYears, setExperienceYears] = useState("");
  const [description, setDescription] = useState("");
  const [references, setReferences] = useState("");
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {
      base44.auth.redirectToLogin();
    });
  }, []);

  const { data: existingRequests = [] } = useQuery({
    queryKey: ['role-verification-requests', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.RoleVerificationRequest.filter({
        user_email: user.email
      }, "-created_date");
    },
    enabled: !!user
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.RoleVerificationRequest.create(data);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['role-verification-requests'] });
      
      // Notify admins
      const admins = await base44.entities.User.filter({ role: 'admin' });
      await Promise.all(admins.map(admin =>
        base44.entities.Notification.create({
          user_email: admin.email,
          type: "system",
          title: "🎯 New Role Verification Request",
          message: `${user.full_name || user.email} applied for ${selectedRole.replace('_', ' ')} verification`,
          link_url: createPageUrl("AdminVerifications"),
          priority: "high"
        })
      ));

      toast.success("Application submitted! We'll review within 24-48 hours.");
      navigate(createPageUrl("UserProfile", `email=${user.email}`));
    },
    onError: (error) => {
      console.error("Error submitting application:", error);
      toast.error("Failed to submit application");
    }
  });

  const ALLOWED_DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  const MAX_FILE_SIZE_MB = 10;

  const handleFileUpload = async (e, docType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_DOC_TYPES.includes(file.type)) {
      toast.error("Invalid file type. Please upload a PDF, JPEG, PNG, or WebP file.");
      e.target.value = "";
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      setUploadedDocuments(prev => [...prev, {
        type: docType,
        url: file_url,
        description: docType
      }]);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (uploadedDocuments.length === 0) {
      toast.error("Please upload at least one document");
      return;
    }

    if (!description.trim()) {
      toast.error("Please describe why you should be verified");
      return;
    }

    await createRequestMutation.mutateAsync({
      user_email: user.email,
      user_name: user.full_name || user.email,
      requested_role: selectedRole,
      status: "pending",
      supporting_documents: uploadedDocuments,
      application_details: {
        experience_years: parseInt(experienceYears) || 0,
        description: description.trim(),
        references: references.split(',').map(r => r.trim()).filter(Boolean)
      }
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center">
        <Card className="p-12 bg-white/5 border-white/10 text-center">
          <Loader2 className="w-16 h-16 mx-auto mb-4 text-[#9EFF00] animate-spin" />
          <h3 className="text-2xl font-bold text-white">Loading...</h3>
        </Card>
      </div>
    );
  }

  const pendingRequest = existingRequests.find(r => r.status === 'pending');
  const latestRequest = existingRequests[0];

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
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

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-3">Apply for Role Verification</h1>
            <p className="text-gray-400 text-lg">
              Get verified as a trusted traveler or shipper to unlock premium benefits
            </p>
          </div>

          {/* Show pending/approved status */}
          {pendingRequest && (
            <Card className="p-6 bg-yellow-500/10 border-yellow-500/30 mb-6">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-yellow-400" />
                <div>
                  <h3 className="font-semibold text-yellow-300 mb-1">Application Under Review</h3>
                  <p className="text-sm text-gray-300">
                    Your application for {pendingRequest.requested_role.replace('_', ' ')} is being reviewed. 
                    We'll notify you within 24-48 hours.
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Submitted: {format(new Date(pendingRequest.created_date), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {latestRequest?.status === 'approved' && (
            <Card className="p-6 bg-green-500/10 border-green-500/30 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <div>
                  <h3 className="font-semibold text-green-300 mb-1">Verification Approved!</h3>
                  <p className="text-sm text-gray-300">
                    Congratulations! You're now a {latestRequest.requested_role.replace('_', ' ')}.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {latestRequest?.status === 'rejected' && !pendingRequest && (
            <Card className="p-6 bg-red-500/10 border-red-500/30 mb-6">
              <div className="flex items-start gap-3">
                <XCircle className="w-6 h-6 text-red-400" />
                <div>
                  <h3 className="font-semibold text-red-300 mb-1">Application Rejected</h3>
                  <p className="text-sm text-gray-300 mb-2">
                    {latestRequest.rejection_reason || "Your previous application was not approved."}
                  </p>
                  <p className="text-xs text-gray-400">
                    You can submit a new application below.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Benefits Section */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Plane className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Verified Traveler</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  Priority listing in search results
                </li>
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  +20% trust score multiplier
                </li>
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  Special badge on your profile
                </li>
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  Increased match visibility
                </li>
              </ul>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Verified Shipper</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  Priority listing in search results
                </li>
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  +20% trust score multiplier
                </li>
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  Special badge on your profile
                </li>
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  Increased match visibility
                </li>
              </ul>
            </Card>
          </div>

          {!pendingRequest && (
            <Card className="p-8 bg-white/5 border-white/10">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label className="text-gray-300 mb-3 block text-lg font-semibold">
                    Select Role to Verify
                  </Label>
                  <RadioGroup value={selectedRole} onValueChange={setSelectedRole}>
                    <div className="grid md:grid-cols-2 gap-4">
                      <label
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedRole === 'verified_traveler'
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <RadioGroupItem value="verified_traveler" id="traveler" />
                        <div className="flex items-center gap-2">
                          <Plane className="w-5 h-5 text-blue-400" />
                          <span className="text-white font-medium">Verified Traveler</span>
                        </div>
                      </label>

                      <label
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedRole === 'verified_shipper'
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <RadioGroupItem value="verified_shipper" id="shipper" />
                        <div className="flex items-center gap-2">
                          <Package className="w-5 h-5 text-purple-400" />
                          <span className="text-white font-medium">Verified Shipper</span>
                        </div>
                      </label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-gray-300 mb-2 block">
                    Years of Experience (Optional)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    placeholder="e.g., 5"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <Label className="text-gray-300 mb-2 block">
                    Why should you be verified? *
                  </Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your experience, reliability, and why you'd make a great verified member..."
                    rows={5}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    required
                  />
                </div>

                <div>
                  <Label className="text-gray-300 mb-2 block">
                    References (Optional)
                  </Label>
                  <Input
                    value={references}
                    onChange={(e) => setReferences(e.target.value)}
                    placeholder="Comma-separated emails or profile links"
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    References from other CarryMatch users who can vouch for you
                  </p>
                </div>

                <div>
                  <Label className="text-gray-300 mb-3 block">
                    Supporting Documents *
                  </Label>
                  <div className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          onChange={(e) => handleFileUpload(e, "Travel History")}
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          className="hidden"
                          disabled={isUploading}
                        />
                        <div className="p-4 border-2 border-dashed border-white/20 rounded-lg hover:border-blue-400 hover:bg-blue-500/5 transition-all text-center">
                          <Upload className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                          <p className="text-sm text-gray-300">Travel History</p>
                          <p className="text-xs text-gray-500">Tickets, boarding passes</p>
                        </div>
                      </label>

                      <label className="cursor-pointer">
                        <input
                          type="file"
                          onChange={(e) => handleFileUpload(e, "Proof of Transactions")}
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          className="hidden"
                          disabled={isUploading}
                        />
                        <div className="p-4 border-2 border-dashed border-white/20 rounded-lg hover:border-purple-400 hover:bg-purple-500/5 transition-all text-center">
                          <Upload className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                          <p className="text-sm text-gray-300">Proof of Transactions</p>
                          <p className="text-xs text-gray-500">Receipts, screenshots</p>
                        </div>
                      </label>
                    </div>

                    {uploadedDocuments.length > 0 && (
                      <div className="space-y-2">
                        {uploadedDocuments.map((doc, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              <span className="text-sm text-gray-300">{doc.type}</span>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setUploadedDocuments(prev => prev.filter((_, i) => i !== idx))}
                              className="text-red-400 hover:text-red-300"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={createRequestMutation.isPending || isUploading || uploadedDocuments.length === 0 || !description.trim()}
                  className="w-full bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] hover:from-[#7ACC00] hover:to-[#9EFF00] text-[#1A1A1A] font-bold text-lg py-6"
                >
                  {createRequestMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting Application...
                    </>
                  ) : (
                    <>
                      <Award className="w-5 h-5 mr-2" />
                      Submit Application
                    </>
                  )}
                </Button>
              </form>
            </Card>
          )}

          {/* Application History */}
          {existingRequests.length > 0 && (
            <Card className="p-6 bg-white/5 border-white/10 mt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Application History</h3>
              <div className="space-y-3">
                {existingRequests.map(request => (
                  <div key={request.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {request.requested_role === 'verified_traveler' ? (
                          <Plane className="w-5 h-5 text-blue-400" />
                        ) : (
                          <Package className="w-5 h-5 text-purple-400" />
                        )}
                        <span className="text-white font-medium">
                          {request.requested_role.replace('_', ' ')}
                        </span>
                      </div>
                      <Badge className={
                        request.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        request.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }>
                        {request.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400">
                      Applied: {format(new Date(request.created_date), "MMM d, yyyy")}
                    </p>
                    {request.rejection_reason && (
                      <p className="text-sm text-red-300 mt-2">
                        Reason: {request.rejection_reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}