import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineNotice } from "@/features/cml-core/components/CmlStateScreens";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/lib/i18n";

export default function LoginPage() {
  const { signIn, authError } = useAuth();
  const { t } = useI18n();
  const [form, setForm] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const { error } = await signIn(form);
      if (error) throw error;
    } catch (err) {
      setErrorMessage(err.message || t("errors.signInFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand">
            <Package className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t("login.title")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("login.subtitle")}</p>
        </div>

        {authError?.type === "config" && <InlineNotice title={t("common.environmentWarning")} description={t("errors.missingConfig")} tone="warning" />}
        {errorMessage && <InlineNotice title={t("errors.title")} description={errorMessage} tone="error" />}

        <Card className="border-slate-200 shadow-lg">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("login.emailLabel")}</Label>
                <Input id="email" name="email" type="email" required value={form.email} onChange={handleChange} placeholder={t("login.emailPlaceholder")} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("login.passwordLabel")}</Label>
                <Input id="password" name="password" type="password" required value={form.password} onChange={handleChange} placeholder={t("login.passwordPlaceholder")} className="h-11" />
              </div>
              <Button type="submit" disabled={isSubmitting} className="h-11 w-full bg-brand text-white hover:bg-brand-hover">
                {isSubmitting ? t("common.saving") : t("login.submitButton")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500">
          {t("login.noAccount")}{" "}
          <Link to="/signup" className="font-medium text-brand hover:underline">{t("login.signupLink")}</Link>
        </p>
      </div>
    </div>
  );
}
