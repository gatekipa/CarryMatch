import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shipment_id, template_type, manual_trigger } = await req.json();

    // Get shipment
    const shipments = await base44.asServiceRole.entities.Shipment.filter({ id: shipment_id });
    if (shipments.length === 0) {
      return Response.json({ error: 'Shipment not found' }, { status: 404 });
    }
    const shipment = shipments[0];

    // Get vendor
    const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: shipment.vendor_id });
    const vendor = vendors[0];

    // Permission check: verify caller is vendor staff
    const vendorStaff = await base44.asServiceRole.entities.VendorStaff.filter({
      email: user.email,
      vendor_id: shipment.vendor_id,
      status: 'ACTIVE'
    });
    if (vendorStaff.length === 0 && user.role !== 'admin') {
      return Response.json({ error: 'Permission denied: not vendor staff' }, { status: 403 });
    }

    // Get template
    const templates = await base44.asServiceRole.entities.ShipmentNotificationTemplate.filter({
      vendor_id: shipment.vendor_id,
      template_type: template_type,
      language: "EN",
      is_active: true
    });

    if (templates.length === 0) {
      return Response.json({ 
        error: 'No active template found for this event',
        skipped: true 
      }, { status: 200 });
    }

    const template = templates[0];

    // Prepare placeholders
    const placeholders = {
      tracking_code: shipment.tracking_code,
      vendor_name: vendor.display_name,
      sender_name: shipment.sender_name,
      recipient_name: shipment.recipient_name,
      sender_city: shipment.sender_city,
      recipient_city: shipment.recipient_city,
      status: shipment.status.replace(/_/g, ' '),
      eta: shipment.eta_date ? new Date(shipment.eta_date).toLocaleDateString('en-GB') : 'TBD',
      current_location: shipment.current_location || shipment.recipient_city
    };

    // Build recipient list
    const recipients = [];
    
    if (template.recipient_type === 'sender' || template.recipient_type === 'both') {
      if (shipment.sender_phone || shipment.sender_email) {
        recipients.push({
          type: 'sender',
          name: shipment.sender_name,
          phone: shipment.sender_phone,
          email: shipment.sender_email
        });
      }
    }
    
    if (template.recipient_type === 'recipient' || template.recipient_type === 'both') {
      if (shipment.recipient_phone || shipment.recipient_email) {
        recipients.push({
          type: 'recipient',
          name: shipment.recipient_name,
          phone: shipment.recipient_phone,
          email: shipment.recipient_email
        });
      }
    }

    if (recipients.length === 0) {
      return Response.json({ 
        error: 'No recipient contact information available',
        skipped: true 
      }, { status: 200 });
    }

    // Send notifications
    let sentCount = 0;
    const logs = [];

    for (const recipient of recipients) {
      let message = template.content_text;
      
      // Replace placeholders
      for (const [key, value] of Object.entries(placeholders)) {
        message = message.replace(new RegExp(`{${key}}`, 'g'), value);
      }

      // Send via each enabled channel
      for (const channel of template.enabled_channels) {
        try {
          // In production: integrate with SMS/Email/WhatsApp APIs
          // For now, simulate sending
          console.log(`[${channel.toUpperCase()}] To: ${recipient.phone || recipient.email}`);
          console.log(`Message: ${message}`);

          // Log notification
          const log = await base44.asServiceRole.entities.ShipmentNotificationLog.create({
            vendor_id: shipment.vendor_id,
            shipment_id: shipment.id,
            template_type: template_type,
            recipient_type: recipient.type,
            recipient_phone: recipient.phone || null,
            recipient_email: recipient.email || null,
            channel: channel,
            message_preview: message.substring(0, 100),
            sent_status: 'sent',
            triggered_by: manual_trigger ? 'manual' : 'auto',
            triggered_by_user: manual_trigger ? user.email : null
          });

          logs.push(log);
          sentCount++;
        } catch (error) {
          // Log failed notification
          await base44.asServiceRole.entities.ShipmentNotificationLog.create({
            vendor_id: shipment.vendor_id,
            shipment_id: shipment.id,
            template_type: template_type,
            recipient_type: recipient.type,
            recipient_phone: recipient.phone || null,
            recipient_email: recipient.email || null,
            channel: channel,
            message_preview: message.substring(0, 100),
            sent_status: 'failed',
            error_message: error.message,
            triggered_by: manual_trigger ? 'manual' : 'auto',
            triggered_by_user: manual_trigger ? user.email : null
          });
        }
      }
    }

    return Response.json({
      success: true,
      notifications_sent: sentCount,
      message: `Sent ${sentCount} notification${sentCount !== 1 ? 's' : ''}`
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});