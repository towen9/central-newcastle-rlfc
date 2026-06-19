import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.role !== 'gate_staff')) {
      return Response.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const { ticket_id, scanned_by } = await req.json();

    if (!ticket_id) {
      return Response.json({ success: false, error: 'No ticket ID provided' }, { status: 400 });
    }

    const tickets = await base44.asServiceRole.entities.EventTicket.filter({ ticket_id });
    const ticket = tickets[0] || null;

    if (!ticket) {
      return Response.json({ success: false, error: 'Ticket not found' });
    }

    if (ticket.status === 'used') {
      return Response.json({
        success: false,
        error: 'Ticket already scanned',
        scanned_at: ticket.scanned_at,
        purchaser_name: ticket.purchaser_name
      });
    }

    if (ticket.status === 'refunded') {
      return Response.json({ success: false, error: 'This ticket has been refunded' });
    }

    // Mark as used
    await base44.asServiceRole.entities.EventTicket.update(ticket.id, {
      status: 'used',
      scanned_at: new Date().toISOString(),
      scanned_by: scanned_by || user.email
    });

    console.log('processEventScan: ticket used', ticket_id, 'by', scanned_by || user.email);

    return Response.json({
      success: true,
      purchaser_name: ticket.purchaser_name,
      event_name: ticket.event_name,
      message: 'Welcome! Enjoy the Ladies Long Lunch 💙'
    });

  } catch (error) {
    console.error('processEventScan error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});