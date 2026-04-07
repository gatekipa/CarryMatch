import React, { useEffect, useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { InlineNotice } from "@/features/cml-core/components/CmlStateScreens";
import { loadVendorCustomerDetail, updateVendorCustomer, listCustomerShipments } from "@/features/cml-core/api/cmlCustomers";
import { canEditCustomers } from "@/features/cml-core/lib/permissions";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/lib/i18n";

export default function CustomerDetailPage() {
  const { customerId } = useParams();
  const { vendor, vendorStaff } = useAuth();
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const staffRole = vendorStaff?.role ?? "staff";

  const [customer, setCustomer] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [form, setForm] = useState({ fullName: "", email: "", whatsappNumber: "", preferredLanguage: "en", notes: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!vendor?.id || !customerId) return;
    let isActive = true;
    setIsLoading(true);
    setErrorMessage("");

    Promise.all([
      loadVendorCustomerDetail(vendor.id, customerId),
      listCustomerShipments(vendor.id, customerId),
    ])
      .then(([customerData, shipmentData]) => {
        if (!isActive) return;
        setCustomer(customerData);
        setShipments(shipmentData);
        if (customerData) {
          setForm({
            fullName: customerData.full_name || "",
            email: customerData.email || "",
            whatsappNumber: customerData.whatsapp_number || "",
            preferredLanguage: customerData.preferred_language || "en",
            notes: customerData.notes || "",
          });
        }
      })
      .catch((error) => {
        if (!isActive) return;
        setErrorMessage(error?.message || "Failed to load customer.");
      })
      .finally(() => { if (isActive) setIsLoading(false); });

    return () => { isActive = false; };
  }, [vendor?.id, customerId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const updated = await updateVendorCustomer(vendor.id, customerId, {
        full_name: form.fullName.trim(),
        email: form.email.trim(),
        whatsapp_number: form.whatsappNumber.trim(),
        preferred_language: form.preferredLanguage,
        notes: form.notes.trim(),
      });
      setCustomer(updated);
      setSuccessMessage(t("customerDetail.saveSuccess"));
    } catch (error) {
      setErrorMessage(error?.message || "Failed to save.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(language === "fr" ? "fr-FR" : "en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
    return (dateString) => {
      if (!dateString) return "\u2014";
      try { return fmt.format(new Date(dateString)); } catch { return dateString; }
    };
  }, [language]);

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-slate-500">{t("common.loadingShort")}</div>;
  }

  if (!customer) {
    return <InlineNotice title={t("customerDetail.notFound")} description={t("customerDetail.notFoundBody")} tone="warning" />;
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/customers">{"\u2190"} {t("customerDetail.backToList")}</Link>
        </Button>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              {customer.full_name || customer.phone}
            </h1>
            <p className="mt-1 text-base text-slate-600">{customer.phone}</p>
          </div>
          <Button asChild>
            <Link to={`/shipments/new?senderPhone=${encodeURIComponent(customer.phone)}`}>
              {t("customerDetail.newShipment")}
            </Link>
          </Button>
        </div>
      </section>

      {errorMessage ? <InlineNotice title={t("errors.title")} description={errorMessage} tone="error" /> : null}
      {successMessage ? <InlineNotice title={t("customerDetail.saveSuccess")} description="" /> : null}

      {canEditCustomers(staffRole) ? (
        <Card className="border-slate-200 bg-white/95 shadow-lg">
          <CardHeader>
            <CardTitle>{t("customerDetail.editSection")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t("customerDetail.name")}</Label>
                  <Input id="fullName" name="fullName" value={form.fullName} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("customerDetail.email")}</Label>
                  <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">{t("customerDetail.whatsapp")}</Label>
                  <Input id="whatsappNumber" name="whatsappNumber" value={form.whatsappNumber} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferredLanguage">{t("customerDetail.preferredLanguage")}</Label>
                  <Select value={form.preferredLanguage} onValueChange={(v) => setForm((prev) => ({ ...prev, preferredLanguage: v }))}>
                    <SelectTrigger id="preferredLanguage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Francais</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">{t("customerDetail.notes")}</Label>
                <Textarea id="notes" name="notes" value={form.notes} onChange={handleChange} rows={3} />
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("common.saving") : t("common.save")}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-slate-200 bg-white/95 shadow-lg">
        <CardHeader>
          <CardTitle>{t("customerDetail.shipments")}</CardTitle>
          <CardDescription>{t("customerDetail.shipmentsDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {shipments.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-slate-500">{t("customerDetail.noShipments")}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("customerDetail.colTracking")}</TableHead>
                    <TableHead>{t("customerDetail.colRole")}</TableHead>
                    <TableHead>{t("customerDetail.colRoute")}</TableHead>
                    <TableHead>{t("customerDetail.colStatus")}</TableHead>
                    <TableHead>{t("customerDetail.colDate")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.map((s) => (
                    <TableRow key={s.id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/shipments/${s.id}`)}>
                      <TableCell className="font-mono text-sm font-medium">{s.tracking_number}</TableCell>
                      <TableCell className="text-sm capitalize">
                        {s.sender_customer_id === customerId && s.receiver_customer_id === customerId
                          ? t("customerDetail.roleBoth")
                          : s.sender_customer_id === customerId
                            ? t("customerDetail.roleSender")
                            : t("customerDetail.roleReceiver")}
                      </TableCell>
                      <TableCell className="text-sm">{s.origin_city || "\u2014"} {"\u2192"} {s.destination_city || "\u2014"}</TableCell>
                      <TableCell className="text-sm">{s.status}</TableCell>
                      <TableCell className="text-sm text-slate-500">{formatDate(s.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
