// TEMPORARY (Sprint 0 verification, 13 Oct 2026). Deleted straight after use.
// Measures how Base44's entity store behaves under concurrent requests, so the
// Sprint 0 race fixes rely on observed behaviour rather than assumptions.
// Touches only Counter rows whose key starts with "selftest:<run>" and deletes them.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const TOKEN = 'f6a3862c0c421800fdaa857ebbb9a723';
const N = 10;
const TRIALS = 5;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function burst<T>(n: number, task: (i: number) => Promise<T>) {
  const results = await Promise.allSettled(Array.from({ length: n }, (_, i) => task(i)));
  const won = results.filter((r) => r.status === 'fulfilled' && (r as any).value?.updated === 1).length;
  const limited = results.filter((r) => r.status === 'rejected' && /rate limit/i.test(String((r as any).reason?.message))).length;
  const other = results
    .filter((r) => r.status === 'rejected' && !/rate limit/i.test(String((r as any).reason?.message)))
    .map((r: any) => String(r.reason?.message || r.reason).slice(0, 120));
  await sleep(1500);
  return { won, limited, other };
}

Deno.serve(async (req) => {
  const body = await req.json().catch(() => ({}));
  if (body?.token !== TOKEN) return Response.json({ error: 'no' }, { status: 403 });
  const only: string[] | null = Array.isArray(body?.only) ? body.only : null;
  const want = (name: string) => !only || only.includes(name);
  const sb = createClientFromRequest(req).asServiceRole;
  const C = sb.entities.Counter;
  const run = `selftest:${Date.now()}`;
  const out: Record<string, unknown> = { run, N, TRIALS };
  const made: string[] = [];
  const mk = async (data: Record<string, unknown>) => {
    const row = await C.create(data);
    made.push(row.id);
    return row;
  };
  const val = async (id: string, field = 'value') => (await C.get(id))?.[field];

  try {
    const r1 = await mk({ key: `${run}:cas`, value: 0 });

    if (want('cas_by_id')) {
      const trials = [];
      for (let t = 0; t < TRIALS; t++) {
        await C.update(r1.id, { value: 0 });
        const b = await burst(N, (i) => C.updateMany({ id: r1.id, value: 0 }, { $set: { value: i + 1 } }));
        trials.push(b);
      }
      out.cas_by_id = trials;
    }

    if (want('cas_by_key')) {
      const trials = [];
      for (let t = 0; t < 3; t++) {
        await C.update(r1.id, { value: 0 });
        const b = await burst(N, (i) => C.updateMany({ key: `${run}:cas`, value: 0 }, { $set: { value: i + 1 } }));
        trials.push(b);
      }
      out.cas_by_key = trials;
    }

    if (want('spend_by_id')) {
      const trials = [];
      for (let t = 0; t < 3; t++) {
        await C.update(r1.id, { value: 3 });
        const b = await burst(N, () => C.updateMany({ id: r1.id, value: { $gte: 1 } }, { $inc: { value: -1 } }));
        trials.push({ ...b, final: await val(r1.id), expectWon: 3 });
      }
      out.spend_by_id = trials;
    }

    if (want('inc_by_id')) {
      await C.update(r1.id, { value: 0 });
      const b = await burst(N, () => C.updateMany({ id: r1.id }, { $inc: { value: 2 } }));
      out.inc_by_id = { ...b, final: await val(r1.id), expected: 2 * (N - b.limited - b.other.length) };
    }

    if (want('nulls')) {
      const r5 = await mk({ key: `${run}:null`, value: null });
      const s: Record<string, unknown> = { stored: (await C.get(r5.id))?.value ?? 'missing' };
      try {
        const x = await C.updateMany({ id: r5.id }, { $inc: { value: 1 } });
        s.inc_on_null = { ok: true, updated: x?.updated, after: await val(r5.id) };
      } catch (e) {
        s.inc_on_null = { ok: false, error: String((e as Error)?.message).slice(0, 200) };
      }
      await C.update(r5.id, { value: null });
      s.after_update_null = (await C.get(r5.id))?.value ?? 'missing';
      const n1 = await C.updateMany({ id: r5.id, value: null }, { $set: { value: 0 } });
      s.set_where_null = { updated: n1?.updated, after: await val(r5.id) };
      const n2 = await C.updateMany({ id: r5.id, probe: null }, { $set: { probe: 1 } });
      s.set_where_missing = { updated: n2?.updated, after: await val(r5.id, 'probe') };
      const n3 = await C.updateMany({ id: r5.id }, { $inc: { probe2: 2 } });
      s.inc_missing = { updated: n3?.updated, after: await val(r5.id, 'probe2') };
      const n4 = await C.updateMany({ id: r5.id, value: null }, { $set: { value: 99 } });
      s.null_query_vs_number = { updated: n4?.updated, after: await val(r5.id) };
      out.nulls = s;
      await sleep(1000);
    }

    if (want('gate_by_id')) {
      const trials = [];
      for (let t = 0; t < 2; t++) {
        const r6 = await mk({ key: `${run}:gate${t}`, value: 0, gate_day: '2026-10-12', gate_entries: 1 });
        const today = '2026-10-13';
        const b = await burst(N, async () => {
          await C.updateMany({ id: r6.id, gate_day: { $ne: today } }, { $set: { gate_day: today, gate_entries: 0 } });
          return C.updateMany({ id: r6.id, gate_day: today, gate_entries: { $lt: 2 } }, { $inc: { gate_entries: 1 } });
        });
        const g = await C.get(r6.id);
        trials.push({ ...b, entries: g?.gate_entries, day: g?.gate_day, expectWon: 2 });
      }
      out.gate_by_id = trials;
    }

    if (want('cooldown_or')) {
      const trials = [];
      for (let t = 0; t < 2; t++) {
        const r7 = await mk({ key: `${run}:cool${t}`, value: 0 });
        const now = Date.now();
        const b = await burst(N, () =>
          C.updateMany(
            { id: r7.id, $or: [{ last_at: null }, { last_at: { $lte: now - 600000 } }] },
            { $set: { last_at: now }, $inc: { value: 5 } },
          ),
        );
        trials.push({ ...b, final: await val(r7.id), expectWon: 1 });
      }
      out.cooldown_or = trials;
    }

    if (want('array_once')) {
      const trials = [];
      for (let t = 0; t < 2; t++) {
        const r8 = await mk({ key: `${run}:loc${t}`, value: 0, locs: [] });
        const b = await burst(N, () => C.updateMany({ id: r8.id, locs: { $ne: 'gate' } }, { $push: { locs: 'gate' } }));
        trials.push({ ...b, locs: await val(r8.id, 'locs'), expectWon: 1 });
      }
      out.array_once = trials;
    }

    if (want('dup_creates')) {
      const results = await Promise.allSettled(Array.from({ length: 5 }, () => mk({ key: `${run}:dup`, value: 1 })));
      out.dup_creates = { created: results.filter((r) => r.status === 'fulfilled').length, rows: ((await C.filter({ key: `${run}:dup` })) || []).length };
      await sleep(1000);
    }
  } catch (e) {
    out.fatal = String((e as Error)?.message).slice(0, 300);
  } finally {
    for (const id of made) {
      await C.delete(id).catch(() => {});
      await sleep(150);
    }
    const left = (await C.list('-created_date', 200).catch(() => [])) || [];
    out.leftover_selftest_rows = left.filter((r: any) => String(r.key || '').startsWith('selftest:')).length;
  }
  console.log('selftest', JSON.stringify(out));
  return Response.json(out);
});
