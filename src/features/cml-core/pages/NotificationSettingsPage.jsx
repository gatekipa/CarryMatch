import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  NOTIFICATION_CHANNEL_OPTIONS,
  normalizeNotificationChannel,
  saveVendorNotificationSettings,
} from "@/features/cml-core/api/cmlNotifications";
import { BackToDashboardLink } from "@/features/cml-core/components/BackToDashboardLink";
import { InlineNotice } from "@/features/cml-core/components/CmlStateScreens";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/lib/i18n";

export default function NotificationSettingsPage() {
  const { t } = useI18n();
  const { vendor, refreshOnboardingData } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [defaultChannel, setDefaultChannel] = useState("whatsapp");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setNotificationsEnabled(vendor?.notifications_enabled ?? true);
    setDefaultChannel(normalizeNotificationChannel(vendor?.notification_default_channel));
  }, [vendor?.notification_default_channel, vendor?.notifications_enabled]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!vendor?.id) {
      setErrorMessage(t("notifications.noVendorBody"));
      return;
    }

    setIsSubmitting(true);

    try {
      await saveVendorNotificationSettings({
        vendorId: vendor.id,
        notificationsEnabled,
        notificationDefaultChannel: defaultChannel,
      });
      await refreshOnboardingData();
      setSuccessMessage(t("notifications.saveSuccess"));
    } catch (error) {
      setErrorMessage(error.message || t("errors.notificationSettingsSaveFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <BackToDashboardLink />
          <Button asChild variant="outline">
            <Link to="/notifications/log">{t("notifications.openLog")}</Link>
          </Button>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          {t("notifications.settingsTitle")}
        </h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">
          {t("notifications.settingsDescription")}
        </p>
      </section>

      {successMessage ? (
        <InlineNotice title={t("notifications.settingsTitle")} description={successMessage} />
      ) : null}

      {errorMessage ? (
        <InlineNotice title={t("errors.title")} description={errorMessage} tone="error" />
      ) : null}

      {!vendor ? (
        <InlineNotice
          title={t("notifications.noVendorTitle")}
          description={t("notifications.noVendorBody")}
          tone="warning"
        />
      ) : null}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <Card className="border-slate-200 bg-white/95 shadow-lg">
          <CardHeader>
            <CardTitle>{t("notifications.settingsCardTitle")}</CardTitle>
            <CardDescription>{t("notifications.settingsCardDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="space-y-1">
                <Label htmlFor="notifications-enabled" className="text-sm font-semibold text-slate-950">
                  {t("notifications.notificationsEnabled")}
                </Label>
                <p className="text-xs leading-5 text-slate-500">
                  {t("notifications.notificationsEnabledHelp")}
                </p>
              </div>
              <Switch
                id="notifications-enabled"
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
                disabled={!vendor || isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notification-default-channel">
                {t("notifications.defaultPlannedChannel")}
              </Label>
              <Select
                value={defaultChannel}
                onValueChange={setDefaultChannel}
                disabled={!vendor || isSubmitting}
              >
                <SelectTrigger id="notification-default-channel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTIFICATION_CHANNEL_OPTIONS.map((channelOption) => (
                    <SelectItem key={channelOption} value={channelOption}>
                      {t(`notifications.plannedChannelOptions.${channelOption}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                {t("notifications.defaultPlannedChannelHelp")}
              </p>
            </div>

            <InlineNotice
              title={t("notifications.recordingNoticeTitle")}
              description={t("notifications.recordingNoticeBody")}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={!vendor || isSubmitting}>
                {isSubmitting ? t("common.saving") : t("notifications.saveButton")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-4 md:grid-cols-2">
          <Card className="border-slate-200 bg-white/95 shadow-lg">
            <CardHeader>
              <CardTitle>{t("notifications.metaPlaceholderTitle")}</CardTitle>
              <CardDescription>{t("notifications.metaPlaceholderBody")}</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-slate-200 bg-white/95 shadow-lg">
            <CardHeader>
              <CardTitle>{t("notifications.emailPlaceholderTitle")}</CardTitle>
              <CardDescription>{t("notifications.emailPlaceholderBody")}</CardDescription>
            </CardHeader>
          </Card>
        </section>
      </form>
    </div>
  );
}
