import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bus, Building, MapPin, Phone, Mail, Upload, CheckCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE_MB = 5;

export default function BusOperatorSignup() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);

  const [operatorData, setOperatorData] = useState({
    name: "",
    legal_name: "",
    phone: "",
    email: "",
    logo_url: "",
    hq_city: "",
    main_station_name: "",
    payout_method: "momo",
    payout_details_encrypted: ""
  });

  const [branchData, setBranchData] = useState({
    branch_name: "",
    city: "",
    address_text: "",
    contact_phone: "",
    is_primary: true
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: existingOperator } = useQuery({
    queryKey: ['my-bus-operator', user?.email],
    queryFn: async () => {
      const ops = await base44.entities.BusOperator.filter({ created_by: user.email });
      return ops[0];
    },
    enabled: !!user
  });

  useEffect(() => {
    if (existingOperator) {
      navigate(createPageUrl("VendorBusDashboard"));
    }
  }, [existingOperator, navigate]);

  const uploadLogo = async (file) => {
    if (!file) return;

    const resetFileInput = () => {
      const input = document.getElementById('logo-upload');
      if (input) input.value = '';
    };

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Invalid file type. Please upload a JPEG, PNG, or WebP image.");
      resetFileInput();
      return;
    }

    // Validate file size
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large. Maximum size is ${MAX_IMAGE_SIZE_MB}MB.`);
      resetFileInput();
      return;
    }

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setOperatorData({ ...operatorData, logo_url: result.file_url });
      toast.success("Logo uploaded!");
    } catch (error) {
      toast.error("Upload failed");
    }
    setUploading(false);
  };

  const createOperatorMutation = useMutation({
    mutationFn: async () => {
      // Validate required fields
      if (!operatorData.name.trim()) throw new Error("Company name is required");
      if (!operatorData.phone.trim()) throw new Error("Phone number is required");
      if (!operatorData.email.trim()) throw new Error("Email is required");
      if (!operatorData.hq_city.trim()) throw new Error("Headquarters city is required");
      if (!branchData.branch_name.trim()) throw new Error("Primary branch name is required");
      if (!branchData.city.trim()) throw new Error("Branch city is required");

      const slug = operatorData.name.trim().toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const operator = await base44.entities.BusOperator.create({
        ...operatorData,
        public_slug: slug,
        status: "pending",
        created_by: user.email
      });

      const branch = await base44.entities.OperatorBranch.create({
        operator_id: operator.id,
        ...branchData
      });

      // Create owner staff record so user can access management pages
      await base44.entities.OperatorStaff.create({
        operator_id: operator.id,
        user_id: user.email,
        staff_role: "vendor_bus_operator",
        status: "active"
      });

      return { operator, branch };
    },
    onSuccess: () => {
      toast.success("Application submitted for approval!");
      navigate(createPageUrl("VendorBusDashboard"));
    },
    onError: (error) => {
      toast.error("Submission failed: " + error.message);
    }
  });

  if (!user) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Hero */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Bus className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                Register Your Bus Agency
              </h1>
              <p className="text-gray-400 text-lg max-w-xl mx-auto">
                Join CarryMatch to sell bus tickets online, manage your fleet, track your drivers, and grow your passenger base.
              </p>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { icon: "🎫", title: "Online Ticket Sales", desc: "Sell tickets 24/7 with real-time seat availability" },
                { icon: "📊", title: "Fleet Management", desc: "Manage routes, vehicles, drivers, and manifests" },
                { icon: "💰", title: "Revenue Tracking", desc: "Daily closeouts, reports, and promo tools" }
              ].map((b, i) => (
                <Card key={i} className="p-5 bg-white/5 border-white/10 text-center">
                  <div className="text-3xl mb-2">{b.icon}</div>
                  <h3 className="text-white font-semibold text-sm mb-1">{b.title}</h3>
                  <p className="text-gray-400 text-xs">{b.desc}</p>
                </Card>
              ))}
            </div>

            {/* Auth Card */}
            <Card className="p-8 bg-white/5 border-white/10 text-center max-w-md mx-auto">
              <h3 className="text-xl font-bold text-white mb-2">Get Started</h3>
              <p className="text-gray-400 text-sm mb-6">
                Create an account or sign in to register your bus agency. It only takes a few minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => base44.auth.redirectToLogin()}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6"
                >
                  Create Account / Sign In
                </Button>
              </div>
              <p className="text-gray-500 text-xs mt-4">
                You'll be redirected to create an account or sign in, then brought back here to complete your registration.
              </p>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Register Your Bus Company</h1>
            <p className="text-gray-400">Join CarryMatch and start selling tickets online</p>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-400' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-blue-500' : 'bg-gray-700'
              }`}>
                {step > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <span className="text-sm font-medium">Company Info</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-500" />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-400' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-blue-500' : 'bg-gray-700'
              }`}>
                {step > 2 ? <CheckCircle className="w-5 h-5" /> : '2'}
              </div>
              <span className="text-sm font-medium">Station/Branch</span>
            </div>
          </div>

          <Card className="p-8 bg-white/5 border-white/10 backdrop-blur-sm">
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Company Information</h2>
                
                <div>
                  <Label className="text-gray-300">Company Name *</Label>
                  <Input
                    value={operatorData.name}
                    onChange={(e) => setOperatorData({...operatorData, name: e.target.value})}
                    placeholder="e.g., Express Voyages"
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>

                <div>
                  <Label className="text-gray-300">Legal Name (Optional)</Label>
                  <Input
                    value={operatorData.legal_name}
                    onChange={(e) => setOperatorData({...operatorData, legal_name: e.target.value})}
                    placeholder="Legal registered name"
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Phone *</Label>
                    <Input
                      value={operatorData.phone}
                      onChange={(e) => setOperatorData({...operatorData, phone: e.target.value})}
                      placeholder="+237 xxx xxx xxx"
                      className="bg-white/5 border-white/10 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Email *</Label>
                    <Input
                      type="email"
                      value={operatorData.email}
                      onChange={(e) => setOperatorData({...operatorData, email: e.target.value})}
                      placeholder="contact@company.com"
                      className="bg-white/5 border-white/10 text-white mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-gray-300">Headquarters City</Label>
                  <Input
                    value={operatorData.hq_city}
                    onChange={(e) => setOperatorData({...operatorData, hq_city: e.target.value})}
                    placeholder="e.g., Douala"
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>

                <div>
                  <Label className="text-gray-300">Company Logo</Label>
                  <input
                    type="file"
                    id="logo-upload"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={(e) => uploadLogo(e.target.files[0])}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('logo-upload').click()}
                    disabled={uploading}
                    className="w-full border-white/10 text-gray-300 mt-2"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? "Uploading..." : operatorData.logo_url ? "✓ Logo uploaded" : "Upload Logo"}
                  </Button>
                </div>

                <Button
                  onClick={() => setStep(2)}
                  disabled={!operatorData.name || !operatorData.phone || !operatorData.email}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600"
                >
                  Next: Add Station
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Main Station/Branch</h2>

                <div>
                  <Label className="text-gray-300">Station Name *</Label>
                  <Input
                    value={branchData.branch_name}
                    onChange={(e) => setBranchData({...branchData, branch_name: e.target.value})}
                    placeholder="e.g., Douala Central Station"
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>

                <div>
                  <Label className="text-gray-300">City *</Label>
                  <Input
                    value={branchData.city}
                    onChange={(e) => setBranchData({...branchData, city: e.target.value})}
                    placeholder="e.g., Douala"
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>

                <div>
                  <Label className="text-gray-300">Address</Label>
                  <Textarea
                    value={branchData.address_text}
                    onChange={(e) => setBranchData({...branchData, address_text: e.target.value})}
                    placeholder="Full station address"
                    className="bg-white/5 border-white/10 text-white mt-2"
                    rows={3}
                  />
                </div>

                <div>
                  <Label className="text-gray-300">Contact Phone</Label>
                  <Input
                    value={branchData.contact_phone}
                    onChange={(e) => setBranchData({...branchData, contact_phone: e.target.value})}
                    placeholder="+237 xxx xxx xxx"
                    className="bg-white/5 border-white/10 text-white mt-2"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 border-white/10"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => createOperatorMutation.mutate()}
                    disabled={!branchData.branch_name || !branchData.city || createOperatorMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600"
                  >
                    {createOperatorMutation.isPending ? "Submitting..." : "Submit for Approval"}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}