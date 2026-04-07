import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listVendorNotifications } from "@/features/cml-core/api/cmlNotifications";
import { BackToDashboardLink } from "@/features/cml-core/components/BackToDashboardLink";
import { InlineNotice } from "@/features/cml-core/components/CmlStateScreens";
import { getCustomerFacingUpdateLabelKey } from "@/features/cml-core/lib/customerUpdates";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/lib/i18n";

function formatCreatedAt(value, language) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat(language, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function NotificationRow({ notification }) {
  const { t, language } = useI18n();
  const eventLabelKey = getCustomerFacingUpdateLabelKey(
    { eventType: notification.event_type },
    notification.recipient_role,
  );
  const contactLines = [notification.recipient_phone, notification.recipient_email].filter(Boolean);
  const shipmentReference =
    notification.shipment?.tracking_number ?? notification.shipment_id ?? null;
  const batchReference = notification.batch?.batch_name ?? notification.batch_id ?? null;

  return (
    <article className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-950">{t(eventLabelKey)}</p>
          <p className="font-mono text-xs uppercase tracking-wide text-slate-500">
            {notification.event_type}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            {t(`notifications.plannedChannelOptions.${notification.planned_channel}`)}
          </span>
          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
            {t(`notifications.deliveryStatusOptions.${notification.delivery_status}`)}
          </span>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("notifications.createdAt")}
          </dt>
          <dd className="mt-1 text-slate-700">
            {formatCreatedAt(notification.created_at, language) ?? t("notifications.notAvailable")}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("notifications.recipientRole")}
          </dt>
          <dd className="mt-1 text-slate-700">
            {t(`notifications.recipientRoleOptions.${notification.recipient_role}`)}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("notifications.recipientName")}
          </dt>
          <dd className="mt-1 text-slate-700">
            {notification.recipient_name || t("notifications.notAvailable")}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("notifications.recipientContact")}
          </dt>
          <dd className="mt-1 space-y-1 text-slate-700">
            {contactLines.length > 0 ? (
              contactLines.map((contactLine) => <p key={contactLine}>{contactLine}</p>)
            ) : (
              <p>{t("notifications.notAvailable")}</p>
            )}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("notifications.shipmentReference")}
          </dt>
          <dd className="mt-1 text-slate-700">
            {shipmentReference ? (
              notification.shipment_id ? (
                <Link
                  to={`/shipments/${notification.shipment_id}`}
                  className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-700"
                >
                  {shipmentReference}
                </Link>
              ) : (
                shipmentReference
              )
            ) : (
              t("notifications.notAvailable")
            )}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("notifications.batchReference")}
          </dt>
          <dd className="mt-1 text-slate-700">
            {batchReference ? (
              notification.batch_id ? (
                <Link
                  to={`/batches/${notification.batch_id}`}
                  className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-700"
                >
                  {batchReference}
                </Link>
              ) : (
                batchReference
              )
            ) : (
              t("notifications.notAvailable")
            )}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("notifications.plannedChannel")}
          </dt>
          <dd className="mt-1 text-slate-700">
            {t(`notifications.plannedChannelOptions.${notification.planned_channel}`)}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("notifications.deliveryStatus")}
          </dt>
          <dd className="mt-1 text-slate-700">
            {t(`notifications.deliveryStatusOptions.${notification.delivery_status}`)}
          </dd>
        </div>
      </dl>
    </article>
  );
}

export default function NotificationLogPage() {
  const { t } = useI18n();
  const { vendor } = useAuth();
  const [notificationRows, setNotificationRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    if (!vendor?.id) {
      setNotificationRows([]);
      setIsLoading(false);
      setErrorMessage("");
      return () => {
        isMounted = false;
      };
    }

    const loadNotificationRows = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const nextNotificationRows = await listVendorNotifications(vendor.id);

        if (!isMounted) {
          return;
        }

        setNotificationRows(nextNotificationRows);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(error.message || t("errors.notificationLogLoadFailed"));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadNotificationRows();

    return () => {
      isMounted = false;
    };
  }, [t, vendor?.id]);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <BackToDashboardLink />
          <Button asChild variant="outline">
            <Link to="/notifications/settings">{t("notifications.openSettings")}</Link>
          </Button>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          {t("notifications.logTitle")}
        </h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">
          {t("notifications.logDescription")}
        </p>
      </section>

      {!vendor ? (
        <InlineNotice
          title={t("notifications.noVendorTitle")}
          description={t("notifications.noVendorBody")}
          tone="warning"
        />
      ) : null}

      {errorMessage ? (
        <InlineNotice title={t("errors.title")} description={errorMessage} tone="error" />
      ) : null}

      <Card className="border-slate-200 bg-white/95 shadow-lg">
        <CardHeader>
          <CardTitle>{t("notifications.logCardTitle")}</CardTitle>
          <CardDescription>{t("notifications.logCardDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-slate-600">{t("notifications.loadingBody")}</p>
          ) : null}

          {!isLoading && notificationRows.length === 0 ? (
            <InlineNotice
              title={t("notifications.emptyTitle")}
              description={t("notifications.emptyBody")}
            />
          ) : null}

          {!isLoading && notificationRows.length > 0 ? (
            <div className="space-y-4">
              {notificationRows.map((notification) => (
                <NotificationRow key={notification.id} notification={notification} />
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
