// TEMPORARY (Sprint 0 verification, 13 Oct 2026). Deleted straight after use.
// Measures how Base44's entity store behaves under concurrent requests, so the
// Sprint 0 race fixes rely on observed behaviour rather than assumptions.
// Touches only Counter rows whose key starts with "selftest:<run>" and deletes them.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const TOKEN = 'f6a3862c0c421800fdaa857ebbb9a723';
const N = 30;

async function settle<T>(tasks: Array<() => Promise<T>>) {
  return Promise.allSettled(tasks.map((t) => t()));
}
const okUpdated = (results: PromiseSettledResult<any>[]) =>
  results.filter((r) => r.status === 'fulfilled' && r.value?.updated === 1).length;
const errors = (results: PromiseSettledResult<any>[]) =>
  results.filter((r) => r.status === 'rejected').map((r: any) => String(r.reason?.message || r.reason).slice(0, 160));

Deno.serve(async (req) => {
  const body = await req.json().catch(() => ({}));
  if (body?.token !== TOKEN) return Response.json({ error: 'no' }, { status: 403 });
  const sb = createClientFromRequest(req).asServiceRole;
  const C = sb.entities.Counter;
  const run = `selftest:${Date.now()}`;
  const out: Record<string, unknown> = { run };
  const made: string[] = [];
  const mk = async (data: Record<string, unknown>) => {
    const row = await C.create(data);
    made.push(row.id);
    return row;
  };

  try {
    // 1. Compare-and-set by key, N at once. Exactly 1 should win.
    const r1 = await mk({ key: `${run}:cas`, value: 0 });
    const t1 = await settle(Array.from({ length: N }, (_, i) => () => C.updateMany({ key: `${run}:cas`, value: 0 }, { $set: { value: i + 1 } })));
    out.cas_by_key = { winners: okUpdated(t1), errors: errors(t1), final: (await C.get(r1.id))?.value };

    // 2. Same, by id (the functions query by id).
    await C.update(r1.id, { value: 0 });
    const t2 = await settle(Array.from({ length: N }, (_, i) => () => C.updateMany({ id: r1.id, value: 0 }, { $set: { value: i + 1 } })));
    out.cas_by_id = { winners: okUpdated(t2), errors: errors(t2), final: (await C.get(r1.id))?.value };

    // 3. Conditional decrement: balance 5, N spends of 1. Exactly 5 should win, never below 0.
    await C.update(r1.id, { value: 5 });
    const t3 = await settle(Array.from({ length: N }, () => () => C.updateMany({ id: r1.id, value: { $gte: 1 } }, { $inc: { value: -1 } })));
    out.spend = { winners: okUpdated(t3), errors: errors(t3), final: (await C.get(r1.id))?.value };

    // 4. Unconditional $inc, N at once: no lost updates expected.
    await C.update(r1.id, { value: 0 });
    const t4 = await settle(Array.from({ length: N }, () => () => C.updateMany({ id: r1.id }, { $inc: { value: 2 } })));
    out.inc_all = { winners: okUpdated(t4), errors: errors(t4), final: (await C.get(r1.id))?.value, expected: 2 * N };

    // 5. Nulls and missing fields.
    const r5 = await mk({ key: `${run}:null`, value: null });
    out.null_stored = (await C.get(r5.id))?.value ?? 'missing';
    try {
      const x = await C.updateMany({ id: r5.id }, { $inc: { value: 1 } });
      out.inc_on_null = { ok: true, updated: x?.updated, after: (await C.get(r5.id))?.value };
    } catch (e) {
      out.inc_on_null = { ok: false, error: String((e as Error)?.message).slice(0, 200) };
    }
    await C.update(r5.id, { value: null });
    const n1 = await C.updateMany({ id: r5.id, value: null }, { $set: { value: 0 } });
    out.set_where_null = { updated: n1?.updated, after: (await C.get(r5.id))?.value };
    const n2 = await C.updateMany({ id: r5.id, probe: null }, { $set: { probe: 1 } });
    out.set_where_missing = { updated: n2?.updated, after: (await C.get(r5.id))?.probe };
    const n3 = await C.updateMany({ id: r5.id }, { $inc: { probe2: 2 } });
    out.inc_missing = { updated: n3?.updated, after: (await C.get(r5.id))?.probe2 };
    const n4 = await C.updateMany({ id: r5.id, value: null }, { $set: { value: 99 } });
    out.null_query_does_not_match_numbers = { updated: n4?.updated, after: (await C.get(r5.id))?.value };

    // 6. Gate pattern: new-day reset then capped increment, family cap 2. Exactly 2 should win.
    const r6 = await mk({ key: `${run}:gate`, value: 0, gate_day: '2026-10-12', gate_entries: 1 });
    const today = '2026-10-13';
    const t6 = await settle(
      Array.from({ length: N }, () => async () => {
        await C.updateMany({ id: r6.id, gate_day: { $ne: today } }, { $set: { gate_day: today, gate_entries: 0 } });
        return C.updateMany({ id: r6.id, gate_day: today, gate_entries: { $lt: 2 } }, { $inc: { gate_entries: 1 } });
      }),
    );
    const g = await C.get(r6.id);
    out.gate = { winners: okUpdated(t6), errors: errors(t6), entries: g?.gate_entries, day: g?.gate_day };

    // 7. Cooldown with $or and null inside the query. Exactly 1 should win.
    const r7 = await mk({ key: `${run}:cool`, value: 0 });
    const now = Date.now();
    const t7 = await settle(
      Array.from({ length: N }, () => () =>
        C.updateMany(
          { id: r7.id, $or: [{ last_at: null }, { last_at: { $lte: now - 600000 } }] },
          { $set: { last_at: now }, $inc: { value: 5 } },
        ),
      ),
    );
    out.cooldown = { winners: okUpdated(t7), errors: errors(t7), final: (await C.get(r7.id))?.value };

    // 8. Once per location per day: $ne on an array plus $push. Exactly 1 should win.
    const r8 = await mk({ key: `${run}:loc`, value: 0, locs: [] });
    const t8 = await settle(Array.from({ length: N }, () => () => C.updateMany({ id: r8.id, locs: { $ne: 'gate' } }, { $push: { locs: 'gate' } })));
    out.array_once = { winners: okUpdated(t8), errors: errors(t8), locs: (await C.get(r8.id))?.locs };

    // 9. Concurrent creates of one key (the docs say there are no unique constraints).
    const t9 = await settle(Array.from({ length: 10 }, () => () => mk({ key: `${run}:dup`, value: 1 })));
    out.duplicate_creates = { created: t9.filter((r) => r.status === 'fulfilled').length, rows: ((await C.filter({ key: `${run}:dup` })) || []).length };
  } catch (e) {
    out.fatal = String((e as Error)?.message).slice(0, 300);
  } finally {
    for (const id of made) await C.delete(id).catch(() => {});
    const left = (await C.list('-created_date', 200).catch(() => [])) || [];
    out.leftover_selftest_rows = left.filter((r: any) => String(r.key || '').startsWith(run)).length;
  }
  console.log('selftest', JSON.stringify(out));
  return Response.json(out);
});
