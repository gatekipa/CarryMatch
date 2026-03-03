import { base44 } from "@/api/base44Client";

export async function sendShipmentNotification({
  shipment,
  vendor,
  notificationType,
  additionalData = {}
}) {
  try {
    const { otp, eta, pickupLocation, delayReason, holdReason } = additionalData;

    // Determine notification details based on type
    let subject, body;

    switch (notificationType) {
      case "READY_PICKUP":
        subject = `📦 Package Ready for Pickup - ${shipment.tracking_code}`;
        body = `
Hi ${shipment.recipient_name},

Your package is ready for pickup!

Tracking Code: ${shipment.tracking_code}
${otp ? `One-Time PIN: ${otp}` : ''}
${pickupLocation ? `Pickup Location: ${pickupLocation}` : ''}

Please bring your OTP when collecting your package.

Questions? Contact ${vendor.display_name}
${vendor.primary_contact_phone || ''}
        `.trim();
        break;

      case "DELAYED":
        subject = `⏰ Package Delayed - ${shipment.tracking_code}`;
        body = `
Hi ${shipment.recipient_name},

Your package has been delayed.

Tracking Code: ${shipment.tracking_code}
${delayReason ? `Reason: ${delayReason}` : ''}
${eta ? `New Expected Arrival: ${eta}` : ''}

We apologize for the inconvenience. Track your shipment at:
[Tracking URL]

${vendor.display_name}
        `.trim();
        break;

      case "ON_HOLD":
        subject = `⚠️ Package On Hold - ${shipment.tracking_code}`;
        body = `
Hi ${shipment.recipient_name},

Your package is currently on hold.

Tracking Code: ${shipment.tracking_code}
${holdReason ? `Reason: ${holdReason}` : ''}

Please contact us to resolve this issue:
${vendor.primary_contact_phone || vendor.primary_contact_email || ''}

${vendor.display_name}
        `.trim();
        break;

      case "DELIVERED":
        subject = `✅ Package Delivered - ${shipment.tracking_code}`;
        body = `
Hi ${shipment.recipient_name},

Your package has been delivered!

Tracking Code: ${shipment.tracking_code}

Thank you for using ${vendor.display_name}!
        `.trim();
        break;

      default:
        return;
    }

    // Send via Email
    if (shipment.recipient_email) {
      try {
        await base44.integrations.Core.SendEmail({
          from_name: vendor.display_name,
          to: shipment.recipient_email,
          subject: subject,
          body: body
        });

        await base44.entities.ShipmentNotification.create({
          shipment_id: shipment.id,
          tracking_code: shipment.tracking_code,
          vendor_id: vendor.id,
          recipient_name: shipment.recipient_name,
          recipient_email: shipment.recipient_email,
          notification_type: notificationType,
          channel: "EMAIL",
          status: "SENT",
          message_subject: subject,
          message_body: body,
          sent_at: new Date().toISOString(),
          metadata: additionalData
        });
      } catch (error) {
        await base44.entities.ShipmentNotification.create({
          shipment_id: shipment.id,
          tracking_code: shipment.tracking_code,
          vendor_id: vendor.id,
          recipient_email: shipment.recipient_email,
          notification_type: notificationType,
          channel: "EMAIL",
          status: "FAILED",
          failure_reason: error.message,
          metadata: additionalData
        });
      }
    }

    // TODO: Send via WhatsApp (if vendor.whatsapp_number is configured)
    // TODO: Send via SMS (if vendor.sms_sender_id is configured)

    return true;
  } catch (error) {
    console.error("Notification error:", error);
    return false;
  }
}

export async function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}