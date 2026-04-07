import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/lib/i18n";
import { InlineNotice } from "@/features/cml-core/components/CmlStateScreens";

export default function LoginPage() {
  const { signIn, authError } = useAuth();
  const { t } = useI18n();
  const [form, setForm] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await signIn(form);
    } catch (error) {
      setErrorMessage(error.message || t("errors.signInFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <Card className="border-slate-200 bg-white/95 shadow-lg">
        <CardHeader>
          <CardTitle>{t("login.title")}</CardTitle>
          <CardDescription>{t("login.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {authError?.type === "config" ? (
            <InlineNotice title={t("common.environmentWarning")} description={t("errors.missingConfig")} tone="warning" />
          ) : null}

          {errorMessage ? <InlineNotice title={t("errors.title")} description={errorMessage} tone="error" /> : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="login-email">{t("common.email")}</Label>
              <Input id="login-email" name="email" type="email" value={form.email} onChange={handleChange} autoComplete="email" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">{t("common.password")}</Label>
              <Input
                id="login-password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
            </div>

            <Button className="w-full" type="submit" disabled={isSubmitting || authError?.type === "config"}>
              {isSubmitting ? t("common.loading") : t("login.submit")}
            </Button>
          </form>

          <p className="text-sm text-slate-600">
            {t("login.createAccountPrompt")}{" "}
            <Link className="font-semibold text-slate-950 underline" to="/signup">
              {t("login.createAccountLink")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
