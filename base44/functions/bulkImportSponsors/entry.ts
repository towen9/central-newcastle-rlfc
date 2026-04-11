import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { sponsors } = await req.json();
    if (!sponsors || !Array.isArray(sponsors) || sponsors.length === 0) {
      return Response.json({ error: 'No sponsors provided' }, { status: 400 });
    }

    const results = [];

    for (const sponsor of sponsors) {
      try {
        // Check if sponsor already exists by name
        const existing = await base44.asServiceRole.entities.Sponsor.filter({ name: sponsor.name });

        if (existing && existing.length > 0) {
          // Update existing sponsor
          await base44.asServiceRole.entities.Sponsor.update(existing[0].id, {
            ...(sponsor.contact_email && { contact_email: sponsor.contact_email }),
            ...(sponsor.contact_phone && { contact_phone: sponsor.contact_phone }),
            ...(sponsor.website && { website: sponsor.website }),
            ...(sponsor.description && { description: sponsor.description }),
            ...(sponsor.logo_url && { logo_url: sponsor.logo_url }),
            is_active: true,
          });
          results.push({ name: sponsor.name, status: 'updated' });
        } else {
          // Create new sponsor
          await base44.asServiceRole.entities.Sponsor.create({
            name: sponsor.name,
            contact_email: sponsor.contact_email || '',
            contact_phone: sponsor.contact_phone || '',
            website: sponsor.website || '',
            description: sponsor.description || '',
            logo_url: sponsor.logo_url || '',
            is_active: true,
            sort_order: 999,
          });
          results.push({ name: sponsor.name, status: 'created' });
        }
      } catch (err) {
        console.error(`Failed to import sponsor ${sponsor.name}:`, err);
        results.push({ name: sponsor.name, status: 'error', error: err.message });
      }
    }

    return Response.json({ results });
  } catch (error) {
    console.error('Bulk import sponsors error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});