import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/lib/i18n";
import { InlineNotice } from "@/features/cml-core/components/CmlStateScreens";

export default function SignUpPage() {
  const { signUp, authError } = useAuth();
  const { t, language } = useI18n();
  const [form, setForm] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            preferred_language: language,
          },
        },
      });

      setSuccessMessage(t("signup.successBody"));
    } catch (error) {
      setErrorMessage(error.message || t("errors.signUpFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <Card className="border-slate-200 bg-white/95 shadow-lg">
        <CardHeader>
          <CardTitle>{t("signup.title")}</CardTitle>
          <CardDescription>{t("signup.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {authError?.type === "config" ? (
            <InlineNotice title={t("common.environmentWarning")} description={t("errors.missingConfig")} tone="warning" />
          ) : null}

          {successMessage ? <InlineNotice title={t("signup.successTitle")} description={successMessage} /> : null}

          {errorMessage ? <InlineNotice title={t("errors.title")} description={errorMessage} tone="error" /> : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="signup-email">{t("common.email")}</Label>
              <Input id="signup-email" name="email" type="email" value={form.email} onChange={handleChange} autoComplete="email" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password">{t("common.password")}</Label>
              <Input
                id="signup-password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            <Button className="w-full" type="submit" disabled={isSubmitting || authError?.type === "config"}>
              {isSubmitting ? t("common.loading") : t("signup.submit")}
            </Button>
          </form>

          <p className="text-sm text-slate-600">
            {t("signup.existingAccount")}{" "}
            <Link className="font-semibold text-slate-950 underline" to="/login">
              {t("signup.signInLink")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
