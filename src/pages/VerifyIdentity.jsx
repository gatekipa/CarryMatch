import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  ArrowLeft,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  FileCheck,
  Info,
  Phone,
  FileText,
  Camera,
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";
import { useQueryClient } from '@tanstack/react-query';

export default function VerifyIdentity() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [documentType, setDocumentType] = useState("passport");

  const [isDocumentUploading, setIsDocumentUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  const [verificationMethod, setVerificationMethod] = useState("id");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {
      navigate(createPageUrl("Home"));
    });
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        const updatedUser = await base44.auth.me();
        if (updatedUser.verification_status !== user.verification_status) {
          setUser(updatedUser);
        }
      } catch (error) {
        console.error("Error polling user status:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user]);

  const validateDocument = (file) => {
    const errors = [];
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push("File size must be less than 10MB");
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      errors.push("File must be JPG, PNG, or PDF format");
    }

    if (file.name.length > 100) {
      errors.push("File name is too long");
    }

    return errors;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const errors = validateDocument(file);
      if (errors.length > 0) {
        setValidationErrors(errors);
        setSelectedFile(null);
      } else {
        setValidationErrors([]);
        setSelectedFile(file);
      }
    } else {
      setSelectedFile(null);
      setValidationErrors([]);
    }
  };

  const uploadIdDocument = async () => {
    if (!selectedFile) {
      setValidationErrors(["Please select a document to upload."]);
      return;
    }

    setIsDocumentUploading(true);
    setValidationErrors([]);

    const errors = validateDocument(selectedFile);
    if (errors.length > 0) {
      setValidationErrors(errors);
      setIsDocumentUploading(false);
      return;
    }

    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: selectedFile });

      await base44.auth.updateMe({
        verification_document_uri: file_uri,
        verification_document_type: documentType,
        verification_status: "pending",
        verification_submitted_date: new Date().toISOString()
      });

      const adminUsers = await base44.entities.User.filter({ role: "admin" });
      for (const admin of adminUsers) {
        await base44.entities.Notification.create({
          user_email: admin.email,
          type: "system",
          title: "🆔 New Verification Request",
          message: `${user.full_name || user.email} submitted ID verification documents`,
          link_url: createPageUrl("AdminVerifications"),
          priority: "high"
        });
      }

      toast.success("Document uploaded successfully! Your verification is under review.");

      const updatedUser = await base44.auth.me();
      setUser(updatedUser);

      setTimeout(() => {
        navigate(createPageUrl("UserProfile", `email=${user.email}`));
      }, 2000);
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Failed to upload document. Please try again.");
    } finally {
      setIsDocumentUploading(false);
    }
  };

  const sendVerificationCode = async () => {
    if (!phoneNumber) {
      toast.error("Please enter a phone number.");
      return;
    }
    setSendingCode(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setCodeSent(true);
      toast.success("Verification code sent to your phone!");
    } catch (error) {
      console.error("Error sending verification code:", error);
      toast.error("Failed to send code. Please try again.");
    } finally {
      setSendingCode(false);
    }
  };

  const verifyPhoneCode = async () => {
    if (verificationCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.entities.User.update(user.id, {
        verification_status: "approved",
        is_verified: true,
        verification_approved_date: new Date().toISOString(),
        phone: phoneNumber
      });

      toast.success("Phone verified successfully!");
      queryClient.invalidateQueries(['current-user']);
      navigate(createPageUrl("UserProfile", `email=${user.email}`));
    } catch (error) {
      console.error("Error verifying phone code:", error);
      toast.error("Verification failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#9EFF00]" />
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (user.verification_status) {
      case "pending":
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
            <Clock className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400 font-semibold">Pending Review</span>
          </div>
        );
      case "approved":
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/30">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-semibold">Verified</span>
          </div>
        );
      case "rejected":
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400 font-semibold">Rejected</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-500/20 border border-gray-500/30">
            <Shield className="w-5 h-5 text-gray-400" />
            <span className="text-gray-400 font-semibold">Not Verified</span>
          </div>
        );
    }
  };

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
            onClick={() => navigate(createPageUrl("UserProfile", `email=${user.email}`))}
            className="mb-6 text-gray-300 hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>

          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">Identity Verification</h1>
            <p className="text-xl text-gray-400 mb-4">
              Build trust and unlock full platform features
            </p>
            {getStatusBadge()}
          </div>

          <AnimatePresence mode="wait">
            {user.verification_status === "approved" && (
              <motion.div
                key="approved-status"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="p-8 bg-white/5 border-white/10 text-center">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-2">You're Verified!</h2>
                  <p className="text-gray-400 mb-4">
                    Your identity was verified on {format(new Date(user.verification_approved_date), "MMM d, yyyy")}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <FileCheck className="w-4 h-4" />
                    <span>Document: {user.verification_document_type?.replace('_', ' ')}</span>
                  </div>
                </Card>
              </motion.div>
            )}

            {user.verification_status === "pending" && (
              <motion.div
                key="pending-status"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="p-8 bg-white/5 border-white/10 text-center">
                  <Clock className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-pulse" />
                  <h2 className="text-2xl font-bold text-white mb-2">Under Review</h2>
                  <p className="text-gray-400 mb-6">
                    Your verification documents are being reviewed by our admin team.
                    This usually takes 24-48 hours.
                  </p>
                  <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-left">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-gray-300">
                        <p className="mb-2">
                          <strong className="text-white">Submitted:</strong>{" "}
                          {format(new Date(user.verification_submitted_date), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                        <p>
                          <strong className="text-white">Document Type:</strong>{" "}
                          {user.verification_document_type?.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {(user.verification_status === "none" || user.verification_status === "rejected") && (
              <motion.div
                key="verification-flow"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                {user.verification_status === "rejected" && (
                  <Card className="p-8 bg-white/5 border-white/10 mb-8">
                    <div className="text-center mb-6">
                      <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-white mb-2">Verification Rejected</h2>
                      <p className="text-gray-400">
                        Your verification submission was not approved. Please review the reason and try again.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 mb-6">
                      <p className="text-sm font-semibold text-red-400 mb-2">Rejection Reason:</p>
                      <p className="text-gray-300">{user.verification_rejection_reason || "No reason provided"}</p>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-gray-400 mb-4">
                        Please choose a verification method below.
                      </p>
                    </div>
                  </Card>
                )}

                <Card className="p-8 bg-white/5 border-white/10 backdrop-blur-sm">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-white mb-2">Verify Your Identity</h1>
                      <p className="text-gray-400">Choose your preferred verification method</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4 mb-8 p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                      <div>
                        <div className="font-semibold text-white mb-1">3x More Matches</div>
                        <div className="text-xs text-gray-400">Priority in search results</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                      <div>
                        <div className="font-semibold text-white mb-1">Higher Trust Score</div>
                        <div className="text-xs text-gray-400">Instant +25 points boost</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                      <div>
                        <div className="font-semibold text-white mb-1">Verified Badge</div>
                        <div className="text-xs text-gray-400">Stand out from others</div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <Label className="text-white mb-4 block text-lg font-semibold">Choose Verification Method</Label>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Card
                        onClick={() => setVerificationMethod("id")}
                        className={`p-6 cursor-pointer transition-all ${
                          verificationMethod === "id"
                            ? 'bg-blue-500/20 border-blue-500 shadow-lg shadow-blue-500/20'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            verificationMethod === "id" ? 'bg-blue-500' : 'bg-white/10'
                          }`}>
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-white mb-1">Government ID</h3>
                            <p className="text-sm text-gray-400 mb-2">Upload passport, license, or ID</p>
                            <Badge className="bg-green-500/20 text-green-400 text-xs">Recommended</Badge>
                          </div>
                        </div>
                      </Card>

                      <Card
                        onClick={() => setVerificationMethod("phone")}
                        className={`p-6 cursor-pointer transition-all ${
                          verificationMethod === "phone"
                            ? 'bg-purple-500/20 border-purple-500 shadow-lg shadow-purple-500/20'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            verificationMethod === "phone" ? 'bg-purple-500' : 'bg-white/10'
                          }`}>
                            <Phone className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-white mb-1">Phone Number</h3>
                            <p className="text-sm text-gray-400 mb-2">SMS verification code</p>
                            <Badge className="bg-blue-500/20 text-blue-400 text-xs">Quick</Badge>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>

                  {verificationMethod === "id" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="id-form">
                      <form onSubmit={(e) => { e.preventDefault(); uploadIdDocument(); }} className="space-y-6">
                        <div>
                          <Label className="text-white mb-3 block">Document Type *</Label>
                          <Select value={documentType} onValueChange={setDocumentType} required>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                              <SelectValue placeholder="Select document type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="passport">Passport</SelectItem>
                              <SelectItem value="drivers_license">Driver's License</SelectItem>
                              <SelectItem value="national_id">National ID Card</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-white mb-3 block">Upload Document *</Label>
                          <div className={`border-2 border-dashed rounded-xl p-8 text-center hover:border-blue-500/50 transition-all cursor-pointer bg-white/5 ${validationErrors.length > 0 ? 'border-red-500/50' : 'border-white/20'}`}>
                            <input
                              type="file"
                              id="verification-doc-input"
                              ref={fileInputRef}
                              onChange={handleFileSelect}
                              accept="image/*,.pdf"
                              className="hidden"
                            />
                            <label htmlFor="verification-doc-input" className="w-full flex flex-col items-center justify-center">
                              {selectedFile ? (
                                <div className="flex items-center justify-center gap-3">
                                  <Camera className="w-8 h-8 text-green-400" />
                                  <div className="text-left">
                                    <div className="text-white font-medium">{selectedFile.name}</div>
                                    <div className="text-sm text-gray-400">Click to change</div>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                  <div className="text-white font-medium mb-1">Click to upload</div>
                                  <div className="text-sm text-gray-400">PNG, JPG or PDF (max 10MB)</div>
                                </div>
                              )}
                            </label>
                          </div>
                          {validationErrors.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30"
                            >
                              <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-semibold text-red-400 mb-2">Upload Error:</p>
                                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                                    {validationErrors.map((error, i) => (
                                      <li key={i}>{error}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>

                        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                          <div className="flex items-start gap-3">
                            <Lock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-300">
                              Your document is encrypted and securely stored. Only used for verification.
                            </p>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          disabled={isDocumentUploading || !selectedFile}
                          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-6 text-lg font-semibold"
                        >
                          {isDocumentUploading ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Shield className="w-5 h-5 mr-2" />
                              Submit for Verification
                            </>
                          )}
                        </Button>
                      </form>
                    </motion.div>
                  )}

                  {verificationMethod === "phone" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="phone-form" className="space-y-6">
                      {!codeSent ? (
                        <>
                          <div>
                            <Label className="text-white mb-3 block">Phone Number *</Label>
                            <Input
                              type="tel"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              placeholder="+1 (555) 123-4567"
                              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                            />
                            <p className="text-xs text-gray-400 mt-2">We'll send a 6-digit verification code</p>
                          </div>

                          <Button
                            onClick={sendVerificationCode}
                            disabled={sendingCode || phoneNumber.length < 10}
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white py-6 text-lg font-semibold"
                          >
                            {sendingCode ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Phone className="w-5 h-5 mr-2" />
                                Send Code
                              </>
                            )}
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                            <div className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-gray-300">
                                Code sent to <span className="font-semibold text-white">{phoneNumber}</span>
                              </p>
                            </div>
                          </div>

                          <div>
                            <Label className="text-white mb-3 block">Enter 6-Digit Code *</Label>
                            <Input
                              type="text"
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              placeholder="000000"
                              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-center text-2xl tracking-widest"
                              maxLength={6}
                            />
                          </div>

                          <Button
                            onClick={verifyPhoneCode}
                            disabled={isSubmitting || verificationCode.length !== 6}
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white py-6 text-lg font-semibold"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-5 h-5 mr-2" />
                                Verify Phone
                              </>
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            onClick={() => {
                              setCodeSent(false);
                              setVerificationCode("");
                            }}
                            className="w-full text-gray-400 hover:text-white"
                          >
                            Change Phone Number
                          </Button>
                        </>
                      )}
                    </motion.div>
                  )}

                  <div className="mt-8 p-4 rounded-lg bg-white/5 border border-white/10">
                    <h3 className="font-semibold text-white mb-3">Verification Requirements:</h3>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>Document must be valid and not expired</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>All information must be clearly visible</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>Verification typically takes 24-48 hours</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>You'll receive an email once approved</span>
                      </li>
                    </ul>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}