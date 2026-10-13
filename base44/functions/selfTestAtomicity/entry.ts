// TEMPORARY (Sprint 0 verification, 13 Oct 2026). Deleted straight after use.
// Measures how Base44's entity store behaves under concurrent requests, so the
// Sprint 0 race fixes rely on observed behaviour rather than assumptions.
// Touches only Counter rows whose key starts with "selftest:<run>" and deletes them.
// Round 3: by-id patterns the functions will use, paced to stay under the rate limit.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const TOKEN = 'f6a3862c0c421800fdaa857ebbb9a723';
const N = 8;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function burst<T>(n: number, task: (i: number) => Promise<T>) {
  const results = await Promise.allSettled(Array.from({ length: n }, (_, i) => task(i)));
  const won = results.filter((r) => r.status === 'fulfilled' && (r as any).value?.updated === 1).length;
  const limited = results.filter((r) => r.status === 'rejected' && /rate limit/i.test(String((r as any).reason?.message))).length;
  const other = results
    .filter((r) => r.status === 'rejected' && !/rate limit/i.test(String((r as any).reason?.message)))
    .map((r: any) => String(r.reason?.message || r.reason).slice(0, 120));
  await sleep(3000);
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
  const out: Record<string, unknown> = { run, N };
  const made: string[] = [];
  const mk = async (data: Record<string, unknown>) => {
    const row = await C.create(data);
    made.push(row.id);
    return row;
  };
  const get = async (id: string) => (await C.get(id)) || {};

  try {
    if (want('nulls')) {
      const r = await mk({ key: `${run}:null`, value: null });
      const s: Record<string, unknown> = { stored: (await get(r.id)).value ?? 'missing' };
      try {
        const x = await C.updateMany({ id: r.id }, { $inc: { value: 1 } });
        s.inc_on_null = { ok: true, updated: x?.updated, after: (await get(r.id)).value };
      } catch (e) {
        s.inc_on_null = { ok: false, error: String((e as Error)?.message).slice(0, 200) };
      }
      await C.update(r.id, { value: null });
      s.after_update_null = (await get(r.id)).value ?? 'missing';
      const n1 = await C.updateMany({ id: r.id, value: null }, { $set: { value: 0 } });
      s.set_where_null = { updated: n1?.updated, after: (await get(r.id)).value };
      const n2 = await C.updateMany({ id: r.id, probe: null }, { $set: { probe: 1 } });
      s.set_where_missing = { updated: n2?.updated, after: (await get(r.id)).probe };
      const n3 = await C.updateMany({ id: r.id }, { $inc: { probe2: 2 } });
      s.inc_missing = { updated: n3?.updated, after: (await get(r.id)).probe2 };
      const n4 = await C.updateMany({ id: r.id, value: null }, { $set: { value: 99 } });
      s.null_query_vs_number = { updated: n4?.updated, after: (await get(r.id)).value };
      const n5 = await C.updateMany({ id: r.id, stage: { $in: [null, '', 'none'] } }, { $set: { stage: 't24_sent' } });
      const n6 = await C.updateMany({ id: r.id, stage: { $in: [null, '', 'none'] } }, { $set: { stage: 'oops' } });
      s.in_with_null = { first: n5?.updated, second: n6?.updated, after: (await get(r.id)).stage };
      out.nulls = s;
      await sleep(3000);
    }

    if (want('spend')) {
      const r = await mk({ key: `${run}:spend`, value: 3 });
      const b = await burst(N, () => C.updateMany({ id: r.id, value: { $gte: 1 } }, { $inc: { value: -1 } }));
      out.spend = { ...b, final: (await get(r.id)).value, expect: 'won 3, final 0' };
    }

    if (want('inc')) {
      const r = await mk({ key: `${run}:inc`, value: 0 });
      const b = await burst(N, () => C.updateMany({ id: r.id }, { $inc: { value: 2 } }));
      out.inc = { ...b, final: (await get(r.id)).value, expect: `final ${2 * N} when nothing is limited` };
    }

    if (want('flag')) {
      const r = await mk({ key: `${run}:flag`, value: 0 });
      const b = await burst(N, (i) => C.updateMany({ id: r.id, sent_at: null }, { $set: { sent_at: `t${i}` } }));
      out.flag = { ...b, expect: 'won 1' };
    }

    if (want('gate')) {
      const r = await mk({ key: `${run}:gate`, value: 0, gate_day: '2026-10-12', gate_entries: 1 });
      const today = '2026-10-13';
      const b = await burst(N, async () => {
        await C.updateMany({ id: r.id, gate_day: { $ne: today } }, { $set: { gate_day: today, gate_entries: 0 } });
        return C.updateMany({ id: r.id, gate_day: today, gate_entries: { $lt: 2 } }, { $inc: { gate_entries: 1 } });
      });
      const g = await get(r.id);
      out.gate = { ...b, entries: g.gate_entries, day: g.gate_day, expect: 'won 2, entries 2' };
    }

    if (want('cooldown')) {
      const r = await mk({ key: `${run}:cool`, value: 0 });
      const today = '2026-10-13';
      const now = Date.now();
      const b = await burst(N, async () => {
        await C.updateMany({ id: r.id, bar_day: { $ne: today } }, { $set: { bar_day: today, bar_count: 0, bar_last_at: 0 } });
        return C.updateMany(
          { id: r.id, bar_day: today, bar_count: { $lt: 10 }, bar_last_at: { $lte: now - 600000 } },
          { $set: { bar_last_at: now }, $inc: { bar_count: 1, value: 5 } },
        );
      });
      const g = await get(r.id);
      out.cooldown = { ...b, value: g.value, count: g.bar_count, expect: 'won 1, value 5, count 1' };
    }

    if (want('array')) {
      const r = await mk({ key: `${run}:loc`, value: 0 });
      const today = '2026-10-13';
      const b = await burst(N, async () => {
        await C.updateMany({ id: r.id, ci_day: { $ne: today } }, { $set: { ci_day: today, ci_locs: [] } });
        return C.updateMany({ id: r.id, ci_day: today, ci_locs: { $ne: 'DEMO-BAR' } }, { $push: { ci_locs: 'DEMO-BAR' } });
      });
      const other = await C.updateMany({ id: r.id, ci_day: today, ci_locs: { $ne: 'DEMO-CANTEEN' } }, { $push: { ci_locs: 'DEMO-CANTEEN' } });
      out.array = { ...b, second_location: other?.updated, locs: (await get(r.id)).ci_locs, expect: 'won 1, second 1, locs [BAR, CANTEEN]' };
    }
  } catch (e) {
    out.fatal = String((e as Error)?.message).slice(0, 300);
  } finally {
    for (const id of made) {
      await C.delete(id).catch(() => {});
      await sleep(200);
    }
    const left = (await C.list('-created_date', 200).catch(() => [])) || [];
    out.leftover_selftest_rows = left.filter((r: any) => String(r.key || '').startsWith('selftest:')).length;
  }
  console.log('selftest', JSON.stringify(out));
  return Response.json(out);
});
