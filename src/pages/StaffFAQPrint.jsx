import React, { useEffect } from 'react';

export default function StaffFAQPrint() {
  useEffect(() => {
    // Auto-trigger print dialog after a short delay for render
    const timer = setTimeout(() => window.print(), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: white; font-family: Arial, Helvetica, sans-serif; }
        @media print {
          @page { margin: 12mm; size: A4; }
          .no-print { display: none !important; }
        }
        .page { max-width: 780px; margin: 0 auto; padding: 24px; color: #1a1a1a; font-size: 11px; line-height: 1.5; }
        h1 { font-size: 18px; color: #1a365d; font-weight: 900; }
        h2 { font-size: 12px; color: #1a365d; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 2px solid #1a365d; padding-bottom: 3px; margin-bottom: 10px; margin-top: 18px; }
        h3 { font-size: 11px; font-weight: bold; }
        .header { display: flex; align-items: center; gap: 14px; border-bottom: 4px solid #1a365d; padding-bottom: 12px; margin-bottom: 4px; }
        .header img { width: 52px; height: 52px; border-radius: 50%; border: 2px solid #1a365d; object-fit: contain; }
        .header-text p { color: #666; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2px; }
        .tier-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 4px; }
        .tier { border-radius: 6px; overflow: hidden; border: 1.5px solid; }
        .tier-header { padding: 6px 10px; display: flex; justify-content: space-between; align-items: center; }
        .tier-header span { font-weight: bold; font-size: 11px; color: white; }
        .tier-header .badge { font-size: 9px; background: rgba(255,255,255,0.25); color: white; padding: 1px 6px; border-radius: 20px; font-weight: 600; }
        .tier-body { padding: 7px 10px; }
        .tier-row { display: flex; align-items: flex-start; gap: 5px; font-size: 10px; margin-bottom: 2px; }
        .tick { color: #16a34a; font-weight: bold; flex-shrink: 0; }
        .cross { color: #dc2626; flex-shrink: 0; }
        .cross-text { color: #888; }
        .note { border-radius: 4px; padding: 4px 8px; font-size: 9px; margin-top: 6px; }

        .supporter { border-color: #93c5fd; }
        .supporter .tier-header { background: #1d4ed8; }
        .supporter .tier-body { background: #eff6ff; }

        .family { border-color: #c4b5fd; }
        .family .tier-header { background: #7c3aed; }
        .family .tier-body { background: #f5f3ff; }

        .premium { border-color: #fbbf24; }
        .premium .tier-header { background: #b45309; }
        .premium .tier-body { background: #fffbeb; }

        .oldbutchers { border-color: #fde047; }
        .oldbutchers .tier-header { background: #111827; }
        .oldbutchers .tier-body { background: #fefce8; }

        .daypass { border-color: #d1d5db; }
        .daypass .tier-header { background: #4b5563; }
        .daypass .tier-body { background: #f9fafb; }

        table { width: 100%; border-collapse: collapse; font-size: 10px; }
        th { background: #1a365d; color: white; padding: 5px 8px; text-align: center; font-size: 9.5px; }
        th.left { text-align: left; }
        td { padding: 4px 8px; border: 1px solid #e5e7eb; text-align: center; }
        td.left { text-align: left; font-weight: 600; color: #374151; }
        tr:nth-child(even) td { background: #f9fafb; }
        .yes { color: #16a34a; font-weight: bold; }
        .no { color: #dc2626; }

        .issue { border-left: 4px solid; border-radius: 0 5px 5px 0; padding: 6px 10px; margin-bottom: 7px; }
        .issue.red { border-color: #ef4444; background: #fef2f2; }
        .issue.amber { border-color: #f59e0b; background: #fffbeb; }
        .issue.grey { border-color: #9ca3af; background: #f9fafb; }
        .issue-title { font-weight: bold; font-size: 10.5px; margin-bottom: 2px; }
        .issue.red .issue-title { color: #991b1b; }
        .issue.amber .issue-title { color: #92400e; }
        .issue.grey .issue-title { color: #374151; }

        .merch-box { background: #f5f3ff; border: 1.5px solid #c4b5fd; border-radius: 6px; padding: 10px 12px; font-size: 10px; }
        .merch-box p { margin-bottom: 5px; }

        .steps { display: flex; flex-direction: column; gap: 7px; }
        .step { display: flex; gap: 10px; align-items: flex-start; }
        .step-num { background: #1a365d; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; flex-shrink: 0; margin-top: 1px; }

        .footer { border-top: 2px solid #e5e7eb; padding-top: 8px; text-align: center; color: #9ca3af; font-size: 9px; margin-top: 16px; }
        .print-btn { position: fixed; bottom: 20px; right: 20px; background: #1a365d; color: white; border: none; padding: 12px 20px; border-radius: 8px; font-size: 14px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 100; }
      `}</style>

      <button className="print-btn no-print" onClick={() => window.print()}>🖨️ Print / Save PDF</button>

      <div className="page">

        {/* Header */}
        <div className="header">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ba172da6c09d1e1650bd/6b3832f4a_Butcherboyslogo.jpg"
            alt="Central Newcastle RLFC"
          />
          <div className="header-text">
            <h1>Central Newcastle RLFC</h1>
            <p>2026 Staff Reference Guide — Membership, Benefits & Troubleshooting</p>
            <p style={{color:'#666', fontSize:'9px', marginTop:'2px'}}>Keep this handy on game day · For staff use only</p>
          </div>
        </div>

        {/* Section 1 */}
        <h2>1. Membership Tiers — What Each Member Gets</h2>
        <div className="tier-grid">

          <div className="tier supporter">
            <div className="tier-header">
              <span>Supporter Pack — $40</span>
              <span className="badge">5 GAME PACK</span>
            </div>
            <div className="tier-body">
              <div className="tier-row"><span className="tick">✓</span> Entry to any 5 home games</div>
              <div className="tier-row"><span className="tick">✓</span> Sponsor deals & discounts</div>
              <div className="tier-row"><span className="cross">✗</span> <span className="cross-text">No rewards or points</span></div>
              <div className="tier-row"><span className="cross">✗</span> <span className="cross-text">No merchandise discount</span></div>
              <div className="tier-row"><span className="cross">✗</span> <span className="cross-text">No members-only events</span></div>
              <div className="note" style={{background:'#fef9c3', border:'1px solid #fde047', color:'#713f12'}}>
                ⚠ Scanner blocks entry automatically after 5 uses
              </div>
            </div>
          </div>

          <div className="tier family">
            <div className="tier-header">
              <span>Family Membership — $100</span>
              <span className="badge">FAMILY</span>
            </div>
            <div className="tier-body">
              <div className="tier-row"><span className="tick">✓</span> Unlimited season entry</div>
              <div className="tier-row"><span className="tick">✓</span> Up to 4 individual QR passes</div>
              <div className="tier-row"><span className="tick">✓</span> Rewards points (primary holder)</div>
              <div className="tier-row"><span className="tick">✓</span> Sponsor deals & discounts</div>
              <div className="tier-row"><span className="cross">✗</span> <span className="cross-text">No merchandise discount</span></div>
              <div className="tier-row"><span className="cross">✗</span> <span className="cross-text">No members-only events</span></div>
              <div className="note" style={{background:'#ede9fe', border:'1px solid #c4b5fd', color:'#4c1d95'}}>
                📌 Each family member has their own QR — scan individually
              </div>
            </div>
          </div>

          <div className="tier premium">
            <div className="tier-header">
              <span>Premium Membership — $120</span>
              <span className="badge">★ BEST VALUE</span>
            </div>
            <div className="tier-body">
              <div className="tier-row"><span className="tick">✓</span> Unlimited season entry (all games)</div>
              <div className="tier-row"><span className="tick">✓</span> <strong>20% merch discount (once per season)</strong></div>
              <div className="tier-row"><span className="tick">✓</span> Full rewards & points system</div>
              <div className="tier-row"><span className="tick">✓</span> Members-only events</div>
              <div className="tier-row"><span className="tick">✓</span> Exclusive Premium Supporter Hat</div>
              <div className="tier-row"><span className="tick">✓</span> All sponsor deals & discounts</div>
            </div>
          </div>

          <div className="tier oldbutchers">
            <div className="tier-header" style={{background:'#111827'}}>
              <span>Old Butchers — $70</span>
              <span className="badge" style={{color:'#fde047'}}>LEGACY</span>
            </div>
            <div className="tier-body">
              <div className="tier-row"><span className="tick">✓</span> Unlimited season entry (all games)</div>
              <div className="tier-row"><span className="tick">✓</span> <strong>20% merch discount (once per season)</strong></div>
              <div className="tier-row"><span className="tick">✓</span> Full rewards & points system</div>
              <div className="tier-row"><span className="tick">✓</span> Old Butchers Day — exclusive area + 4 beer tokens</div>
              <div className="tier-row"><span className="tick">✓</span> Digital Honour Roll listing</div>
              <div className="tier-row"><span className="tick">✓</span> All sponsor deals & discounts</div>
            </div>
          </div>

        </div>

        {/* Day Pass (full width) */}
        <div className="tier daypass" style={{marginTop:'8px'}}>
          <div className="tier-header">
            <span>Day Pass — $8 &nbsp;(not a membership — single game only)</span>
            <span className="badge">ONE GAME</span>
          </div>
          <div className="tier-body" style={{display:'flex', gap:'20px', flexWrap:'wrap'}}>
            <div className="tier-row"><span className="tick">✓</span> Entry to 1 game</div>
            <div className="tier-row"><span className="cross">✗</span> <span className="cross-text">No rewards</span></div>
            <div className="tier-row"><span className="cross">✗</span> <span className="cross-text">No merch discount</span></div>
            <div className="tier-row"><span className="cross">✗</span> <span className="cross-text">QR is single-use — cannot be reused</span></div>
          </div>
        </div>

        {/* Section 2 - Table */}
        <h2>2. Quick Reference — Benefits at a Glance</h2>
        <table>
          <thead>
            <tr>
              <th className="left">Benefit</th>
              <th>Supporter<br/><span style={{fontWeight:'normal',fontSize:'8px'}}>$40</span></th>
              <th>Family<br/><span style={{fontWeight:'normal',fontSize:'8px'}}>$100</span></th>
              <th>Premium<br/><span style={{fontWeight:'normal',fontSize:'8px'}}>$120</span></th>
              <th>Old Butchers<br/><span style={{fontWeight:'normal',fontSize:'8px'}}>$70</span></th>
              <th>Day Pass<br/><span style={{fontWeight:'normal',fontSize:'8px'}}>$8</span></th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Gate Entry',          '5 games',  'Unlimited', 'Unlimited', 'Unlimited', '1 game'],
              ['Sponsor Deals',       '✓','✓','✓','✓','✗'],
              ['Rewards / Points',    '✗','✓','✓','✓','✗'],
              ['20% Merch Discount',  '✗','✗','✓ (1× season)','✓ (1× season)','✗'],
              ['Members-only Events', '✗','✗','✓','✓','✗'],
              ['Old Butchers Day',    '✗','✗','✗','✓','✗'],
            ].map(([label, ...vals], i) => (
              <tr key={i}>
                <td className="left">{label}</td>
                {vals.map((v, j) => (
                  <td key={j} className={v === '✓' || v.startsWith('✓') ? 'yes' : v === '✗' ? 'no' : ''}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Section 3 - Gate Scanning */}
        <h2>3. Gate Scanning — Step by Step</h2>
        <div className="steps">
          <div className="step">
            <div className="step-num">1</div>
            <div><strong>Log in as Gate Staff</strong> and open the Gate Scan page. Tap "Start Scanning" — camera will activate.</div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div><strong>Ask the member to show their QR code</strong> on their phone app (Home screen → tap the QR icon). Hold it steady in front of your camera.</div>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <div><strong style={{color:'#16a34a'}}>GREEN screen = Let them in.</strong> &nbsp;<strong style={{color:'#dc2626'}}>RED screen = Deny entry</strong> (reason is shown). The scanner resets automatically after each scan.</div>
          </div>
        </div>

        {/* Section 4 - Troubleshooting */}
        <h2>4. Common Issues & Fixes</h2>

        <div className="issue red">
          <div className="issue-title">❌ "Already checked in today"</div>
          <div>This person has already been scanned today. Politely explain each member can only check in once per game. If they believe it's an error, contact an admin.</div>
        </div>

        <div className="issue red">
          <div className="issue-title">❌ "All 5 game entries used" (Supporter Pack only)</div>
          <div>Their 5-game pack is fully used for the season. Direct them to purchase a Day Pass ($8) at the gate or upgrade to a full membership.</div>
        </div>

        <div className="issue red">
          <div className="issue-title">❌ "Membership not active"</div>
          <div>Membership is expired, pending, or cancelled. Direct them to purchase a Day Pass for today and renew online.</div>
        </div>

        <div className="issue red">
          <div className="issue-title">❌ "Day Pass already used"</div>
          <div>Day passes are single-use. Once scanned, they cannot be re-used. If this appears to be an error, contact admin immediately.</div>
        </div>

        <div className="issue amber">
          <div className="issue-title">⚠ QR code won't scan</div>
          <div>Ask the member to: (1) Increase phone brightness to maximum. (2) Hold their phone completely still. (3) Close and reopen the app to refresh the QR. If it still won't scan, note their name and membership type and contact admin.</div>
        </div>

        <div className="issue amber">
          <div className="issue-title">⚠ Member doesn't have the app / can't find their QR</div>
          <div>Help them open the app on their phone. They need to be logged in with their purchase email. Their QR code is on the Home screen. If they haven't set up the app yet, verify their ID against the member list and contact admin.</div>
        </div>

        <div className="issue grey">
          <div className="issue-title">🔘 App or scanner not loading</div>
          <div>Force-close and reopen the browser. Check internet connection. If the system is down, record entries manually (name + membership type) for reconciliation after the game.</div>
        </div>

        {/* Section 5 - Merch */}
        <h2>5. Merchandise Discount (Merch Scanner)</h2>
        <div className="merch-box">
          <p><strong>Who gets it?</strong> Premium Members and Old Butchers Members only — 20% off, one time per season.</p>
          <p><strong>Who doesn't get it?</strong> Supporter Pack, Family Membership, Day Pass — no merch discount applies.</p>
          <p><strong>How to use it:</strong> Open the Merch Scanner page → scan their QR code → enter the purchase amount → tap "Apply Discount + Record." The app confirms if the discount is available or has already been used.</p>
          <p style={{marginBottom:0}}><strong>Already used?</strong> The scanner shows a warning banner. Charge the full price — the discount is one-time per season and cannot be overridden by staff.</p>
        </div>

        {/* Footer */}
        <div className="footer">
          <p>Central Newcastle RLFC · Butcher Boys · 2026 Season · Staff Reference Guide</p>
          <p>For system access issues, contact your club administrator · charlestown-rl-community-app-1e1650bd.base44.app</p>
        </div>

      </div>
    </>
  );
}