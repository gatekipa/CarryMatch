import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  Search,
  FileText,
  Shield,
  Download,
  AlertCircle,
  Receipt
} from "lucide-react";
import { motion } from "framer-motion";
import { useVendorPermissions } from "@/components/vendor/useVendorPermissions";
import PaymentRecordDialog from "@/components/vendor/PaymentRecordDialog";
import InsuranceCertificate from "@/components/vendor/InsuranceCertificate";
import PaymentReports from "@/components/vendor/PaymentReports";

export default function VendorShipmentPayments() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [vendorStaff, setVendorStaff] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showInsuranceCert, setShowInsuranceCert] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setAuthChecked(true); }).catch(() => { setUser(null); setAuthChecked(true); });
  }, []);

  useEffect(() => {
    if (user) {
      base44.entities.VendorStaff.filter({ email: user.email, status: "ACTIVE" })
        .then(staff => {
          if (staff[0]) {
            setVendorStaff(staff[0]);
            return base44.entities.Vendor.filter({ id: staff[0].vendor_id });
          }
        })
        .then(vendors => {
          if (vendors) {
            setVendor(vendors?.[0]);
          }
        });
    }
  }, [user]);

  const permissions = useVendorPermissions(vendorStaff);

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ['vendor-shipments-payments', vendor?.id, searchQuery],
    queryFn: async () => {
      if (!vendor) return [];
      let query = { vendor_id: vendor.id };
      if (searchQuery) {
        query.tracking_code = { $regex: searchQuery, $options: "i" };
      }
      return await base44.entities.Shipment.filter(query, "-created_date", 50);
    },
    enabled: !!vendor
  });

  const filteredShipments = shipments.filter(s => 
    !searchQuery || s.tracking_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.sender_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.recipient_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authChecked && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center max-w-md">
          <h3 className="text-xl font-bold text-white mb-2">Sign In Required</h3>
          <p className="text-gray-400 text-sm mb-5">Sign in with your vendor account to access this page.</p>
          <button onClick={() => base44.auth.redirectToLogin()} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!user || !vendorStaff || !vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-12 bg-white/5 border-white/10 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </Card>
      </div>
    );
  }

  if (!permissions.canViewMoney) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-12 bg-white/5 border-white/10 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h3 className="text-2xl font-bold text-white mb-2">Access Denied</h3>
          <p className="text-gray-400">You don't have permission to view payments</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Payments & Insurance</h1>
              <p className="text-gray-400">Manage offline payments and insurance</p>
            </div>
          </div>

          <Tabs defaultValue="shipments" className="space-y-6">
            <TabsList className="bg-white/5 border-white/10">
              <TabsTrigger value="shipments">
                <Receipt className="w-4 h-4 mr-2" />
                Shipments
              </TabsTrigger>
              <TabsTrigger value="reports">
                <FileText className="w-4 h-4 mr-2" />
                Reports
              </TabsTrigger>
            </TabsList>

            <TabsContent value="shipments">
              <Card className="p-4 bg-white/5 border-white/10 mb-6">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search by tracking code, sender, or recipient..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
              </Card>

              {isLoading ? (
                <Card className="p-12 bg-white/5 border-white/10 text-center">
                  <p className="text-gray-400">Loading shipments...</p>
                </Card>
              ) : filteredShipments.length === 0 ? (
                <Card className="p-12 bg-white/5 border-white/10 text-center">
                  <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                  <p className="text-gray-400">No shipments found</p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredShipments.map((shipment, index) => (
                    <motion.div
                      key={shipment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition-all">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-white font-mono">{shipment.tracking_code}</h3>
                              <Badge className={
                                shipment.payment_status === "PAID" ? "bg-green-500/20 text-green-300" :
                                shipment.payment_status === "PARTIAL" ? "bg-yellow-500/20 text-yellow-300" :
                                "bg-red-500/20 text-red-300"
                              }>
                                {shipment.payment_status}
                              </Badge>
                              {shipment.insurance_enabled && (
                                <Badge className="bg-blue-500/20 text-blue-300">
                                  <Shield className="w-3 h-3 mr-1" />
                                  Insured
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-400 mb-2">{shipment.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span>{shipment.sender_name} → {shipment.recipient_name}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-2xl font-bold text-white">
                              {shipment.currency} {shipment.total_amount.toFixed(2)}
                            </p>
                            {shipment.payment_status === "PAID" && shipment.amount_paid > 0 && (
                              <p className="text-xs text-green-400">Paid: {shipment.currency} {shipment.amount_paid.toFixed(2)}</p>
                            )}
                            {shipment.payment_method && (
                              <p className="text-xs text-gray-500 mt-1">{shipment.payment_method}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {permissions.hasPermission('can_record_payment') && shipment.payment_status !== "PAID" && (
                            <Button
                              onClick={() => {
                                setSelectedShipment(shipment);
                                setShowPaymentDialog(true);
                              }}
                              size="sm"
                              className="bg-[#9EFF00] text-[#1A1A1A] font-bold"
                            >
                              <DollarSign className="w-4 h-4 mr-1" />
                              Record Payment
                            </Button>
                          )}
                          {shipment.payment_status === "PAID" && (
                            <Button
                              onClick={() => {
                                setSelectedShipment(shipment);
                                setShowPaymentDialog(true);
                              }}
                              size="sm"
                              variant="outline"
                              className="border-white/10 text-gray-300"
                            >
                              <Receipt className="w-4 h-4 mr-1" />
                              View Receipt
                            </Button>
                          )}
                          {shipment.insurance_enabled && (
                            <Button
                              onClick={() => {
                                setSelectedShipment(shipment);
                                setShowInsuranceCert(true);
                              }}
                              size="sm"
                              variant="outline"
                              className="border-white/10 text-gray-300"
                            >
                              <Shield className="w-4 h-4 mr-1" />
                              Insurance Cert
                            </Button>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="reports">
              <PaymentReports vendor={vendor} vendorStaff={vendorStaff} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {selectedShipment && showPaymentDialog && (
        <PaymentRecordDialog
          shipment={selectedShipment}
          vendor={vendor}
          vendorStaff={vendorStaff}
          onClose={() => {
            setShowPaymentDialog(false);
            setSelectedShipment(null);
          }}
        />
      )}

      {selectedShipment && showInsuranceCert && (
        <InsuranceCertificate
          shipment={selectedShipment}
          vendor={vendor}
          onClose={() => {
            setShowInsuranceCert(false);
            setSelectedShipment(null);
          }}
        />
      )}
    </div>
  );
}