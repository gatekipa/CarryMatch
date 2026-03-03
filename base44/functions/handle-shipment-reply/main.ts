import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { tracking_code, customer_email, customer_name, message } = await req.json();

    if (!tracking_code || !message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find the shipment
    const shipments = await base44.asServiceRole.entities.Shipment.filter({
      tracking_code: tracking_code
    });

    if (shipments.length === 0) {
      return Response.json({ error: 'Shipment not found' }, { status: 404 });
    }

    const shipment = shipments[0];

    // Create customer reply message
    const reply = await base44.asServiceRole.entities.ShipmentMessage.create({
      shipment_id: shipment.id,
      tracking_code: tracking_code,
      vendor_id: shipment.vendor_id,
      sender_type: 'CUSTOMER',
      sender_name: customer_name || shipment.recipient_name,
      sender_email: customer_email || shipment.recipient_email,
      recipient_type: 'VENDOR',
      message: message,
      status: 'SENT',
      notification_sent: true
    });

    // Get vendor to send notification
    const vendors = await base44.asServiceRole.entities.Vendor.list();
    const vendor = vendors.find(v => v.id === shipment.vendor_id);

    if (vendor && vendor.admin_user_email) {
      // Send notification to vendor admin
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: vendor.admin_user_email,
        subject: `Customer Reply: ${tracking_code}`,
        body: `
          <h2>Customer Reply Received</h2>
          <p><strong>Tracking Code:</strong> ${tracking_code}</p>
          <p><strong>From:</strong> ${customer_name || shipment.recipient_name}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
          <p>Reply directly in your dashboard to continue the conversation.</p>
        `
      });
    }

    return Response.json({ 
      success: true, 
      message: 'Reply received and vendor notified',
      reply_id: reply.id 
    });
  } catch (error) {
    console.error('Error handling shipment reply:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});