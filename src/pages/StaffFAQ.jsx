import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Printer } from 'lucide-react';
import clubConfig from '@/config/club.config';
import { UtilityButton, UtilityHeader } from '@/components/ui-kit';

const t = clubConfig.theme;

export default function StaffFAQ() {
  return (
    <div className="min-h-screen bg-white">
      {/* Screen-only header */}
      <div className="print:hidden">
        <UtilityHeader
          onBack={() => window.location.href = createPageUrl('AdminDashboard')}
          right={
            <UtilityButton variant="secondary" onClick={() => window.print()} style={{ width: 'auto', minHeight: 48, fontSize: 14, padding: '8px 16px' }}>
              <Printer className="w-4 h-4" /> Print / Save PDF
            </UtilityButton>
          }
        />
      </div>

      <style>{`
        @media print {
          body { margin: 0; }
          @page { margin: 15mm; size: A4; }
        }
      `}</style>

      {/* Printable content */}
      <div className="max-w-3xl mx-auto px-8 py-10 print:py-0 print:px-0">

        {/* Title */}
        <div className="text-center mb-8 border-b-4 border-[#1a365d] pb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ba172da6c09d1e1650bd/6b3832f4a_Butcherboyslogo.jpg"
              alt="Central Newcastle RLFC"
              className="w-14 h-14 rounded-full object-contain border-2 border-[#1a365d]"
            />
            <div className="text-left">
              <h1 className="text-2xl font-extrabold text-[#1a365d]">Central Newcastle RLFC</h1>
              <p className="text-gray-500 text-sm font-semibold uppercase tracking-widest">2026 Staff Reference Guide</p>
            </div>
          </div>
          <p className="text-gray-600 text-sm mt-2">Membership types, benefits & troubleshooting — keep this handy on game day</p>
        </div>

        {/* ── SECTION 1: Membership Tiers ── */}
        <section className="mb-8">
          <h2 className="text-lg font-extrabold text-[#1a365d] uppercase tracking-wide mb-4 border-b-2 border-[#1a365d] pb-1">
            1. Membership Tiers — What Each Member Gets
          </h2>

          {/* Supporter Pack */}
          <div className="mb-5 rounded-lg border-2 border-blue-300 overflow-hidden">
            <div className="bg-blue-700 text-white px-4 py-2 flex items-center justify-between">
              <span className="font-bold text-base">Supporter Pack — $40</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-semibold">5 GAME PACK</span>
            </div>
            <div className="px-4 py-3 bg-blue-50">
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <div className="flex items-center gap-2"><span className="text-green-600 font-bold">✓</span> Entry to any 5 home games</div>
                <div className="flex items-center gap-2"><span className="text-green-600 font-bold">✓</span> Sponsor deals &amp; discounts</div>
                <div className="flex items-center gap-2"><span className="text-red-500 font-bold">✗</span> <span className="text-gray-500">Rewards / points system</span></div>
                <div className="flex items-center gap-2"><span className="text-red-500 font-bold">✗</span> <span className="text-gray-500">Merchandise discount</span></div>
                <div className="flex items-center gap-2"><span className="text-red-500 font-bold">✗</span> <span className="text-gray-500">Members-only events</span></div>
              </div>
              <div className="mt-2 bg-amber-100 border border-amber-300 rounded px-3 py-1.5 text-xs text-amber-800 font-semibold">
                ⚠ Gate scanner automatically blocks entry after 5 uses — the system handles this
              </div>
            </div>
          </div>

          {/* Family Membership */}
          <div className="mb-5 rounded-lg border-2 border-purple-300 overflow-hidden">
            <div className="bg-purple-700 text-white px-4 py-2 flex items-center justify-between">
              <span className="font-bold text-base">Family Membership — $100</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-semibold">FAMILY PASS</span>
            </div>
            <div className="px-4 py-3 bg-purple-50">
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <div className="flex items-center gap-2"><span className="text-green-600 font-bold">✓</span> Season entry — unlimited games</div>
                <div className="flex items-center gap-2"><span className="text-green-600 font-bold">✓</span> Up to 4 individual passes (family)</div>
                <div className="flex items-center gap-2"><span className="text-green-600 font-bold">✓</span> Reward points (primary holder)</div>
                <div className="flex items-center gap-2"><span className="text-green-600 font-bold">✓</span> Sponsor deals &amp; discounts</div>
                <div className="flex items-center gap-2"><span className="text-red-500 font-bold">✗</span> <span className="text-gray-500">Merchandise discount</span></div>
                <div className="flex items-center gap-2"><span className="text-red-500 font-bold">✗</span> <span className="text-gray-500">Members-only events</span></div>
              </div>
              <div className="mt-2 bg-blue-50 border border-blue-200 rounded px-3 py-1.5 text-xs text-blue-800">
                📌 Each family member has their own QR code — scan each one individually at the gate
              </div>
            </div>
          </div>

          {/* Premium Membership */}
          <div className="mb-5 rounded-lg border-2 border-amber-400 overflow-hidden">
            <div className="bg-amber-600 text-white px-4 py-2 flex items-center justify-between">
              <span className="font-bold text-base">Premium Membership — $120</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-semibold">★ BEST VALUE</span>
            </div>
            <div className="px-4 py-3 bg-amber-50">
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <div className="flex items-center gap-2"><span className="text-green-600 font-bold">✓</span> Season entry — all 8 home games</div>
                <div className="flex items-center gap-2"><span className="text-green-600 font-bold">✓</span> 20% merch discount (1× per season)</div>
                <div className="flex items-center gap-2"><span className="text-green-600 font-bold">✓</span> Full rewards &amp; points system</div>
                <div className="flex items-center gap-2"><span className="text-green-600 font-bold">✓</span> Members-only events</div>
                <div className="flex items-center gap-2"><span className="text-green-600 font-bold">✓</span> Exclusive Supporter Hat included</div>
                <div className="flex items-center gap-2"><span className="text-green-600 font-bold">✓</span> All sponsor deals &amp; discounts</div>
              </div>
            </div>
          </div>

          {/* Old Butchers */}
          <div className="mb-5 rounded-lg border-2 border-yellow-400 overflow-hidden">
            <div className="bg-gray-900 text-yellow-400 px-4 py-2 flex items-center justify-between">
              <span className="font-bold text-base">Old Butchers Membership — $70</span>
              <span className="text-xs bg-white/10 text-yellow-300 px-2 py-0.5 rounded-full font-semibold">LEGACY</span>
            </div>
            <div className="px-4 py-3 bg-yellow-50">
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <div className="flex items-center gap-2"><span className="text-green-600 font-bold">✓</span> Season entry — all 8 home games</div>
                <div className="flex items-center gap-2"><span className="text-green-600 font-bold">✓</span> 20% merch discount (1× per season)</div>
                <div className="flex items-center gap-2"><span className="text-green-600 font-bold">✓</span> Full rewards &amp; points system</div>
                <div className="flex items-center gap-2"><span className="text-green-600 font-bold">✓</span> Old Butchers Day — exclusive area + 4 beer tokens</div>
                <div className="flex items-center gap-2"><span className="text-green-600 font-bold">✓</span> Digital Honour Roll listing</div>
                <div className="flex items-center gap-2"><span className="text-green-600 font-bold">✓</span> All sponsor deals &amp; discounts</div>
              </div>
            </div>
          </div>

          {/* Day Pass */}
          <div className="mb-5 rounded-lg border-2 border-gray-300 overflow-hidden">
            <div className="bg-gray-600 text-white px-4 py-2 flex items-center justify-between">
              <span className="font-bold text-base">Day Pass — $8</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-semibold">SINGLE GAME</span>
            </div>
            <div className="px-4 py-3 bg-gray-50">
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <div className="flex items-center gap-2"><span className="text-green-600 font-bold">✓</span> Entry to 1 game (single-use QR)</div>
                <div className="flex items-center gap-2"><span className="text-red-500 font-bold">✗</span> <span className="text-gray-500">No rewards or points</span></div>
                <div className="flex items-center gap-2"><span className="text-red-500 font-bold">✗</span> <span className="text-gray-500">No merch discount</span></div>
                <div className="flex items-center gap-2"><span className="text-red-500 font-bold">✗</span> <span className="text-gray-500">No member benefits</span></div>
              </div>
              <div className="mt-2 bg-gray-100 border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-700">
                📌 QR is single-use only. Once scanned, it cannot be used again.
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 2: Quick Reference ── */}
        <section className="mb-8">
          <h2 className="text-lg font-extrabold text-[#1a365d] uppercase tracking-wide mb-4 border-b-2 border-[#1a365d] pb-1">
            2. Quick Reference — Benefits at a Glance
          </h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#1a365d] text-white">
                <th className="text-left px-3 py-2 font-semibold">Benefit</th>
                <th className="text-center px-3 py-2 font-semibold">Supporter<br/><span className="font-normal text-blue-200 text-xs">$40</span></th>
                <th className="text-center px-3 py-2 font-semibold">Family<br/><span className="font-normal text-blue-200 text-xs">$100</span></th>
                <th className="text-center px-3 py-2 font-semibold">Premium<br/><span className="font-normal text-blue-200 text-xs">$120</span></th>
                <th className="text-center px-3 py-2 font-semibold">Old Butchers<br/><span className="font-normal text-blue-200 text-xs">$70</span></th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Gate Entry', '5 games', 'Unlimited', 'Unlimited', 'Unlimited'],
                ['Sponsor Deals', '✓', '✓', '✓', '✓'],
                ['Rewards / Points', '✗', '✓', '✓', '✓'],
                ['20% Merch Discount', '✗', '✗', '✓ (1× season)', '✓ (1× season)'],
                ['Members-only Events', '✗', '✗', '✓', '✓'],
                ['Old Butchers Day', '✗', '✗', '✗', '✓'],
                ['Honour Roll', '✗', '✗', '✗', '✓'],
              ].map(([benefit, ...cols], i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2 font-medium text-gray-800 border border-gray-200">{benefit}</td>
                  {cols.map((val, j) => (
                    <td key={j} className={`px-3 py-2 text-center border border-gray-200 ${val === '✗' ? 'text-red-400' : val === '✓' ? 'text-green-600 font-bold' : 'text-gray-700'}`}>
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* ── SECTION 3: Gate Scanning ── */}
        <section className="mb-8">
          <h2 className="text-lg font-extrabold text-[#1a365d] uppercase tracking-wide mb-4 border-b-2 border-[#1a365d] pb-1">
            3. Gate Scanning — How It Works
          </h2>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex gap-3 items-start">
              <span className="bg-[#1a365d] text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
              <div>
                <p className="font-semibold">Open the Gate Scanner</p>
                <p className="text-gray-600 text-sm">Log in as Gate Staff, then open the Gate Scan page. Keep camera pointing at the gate.</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="bg-[#1a365d] text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
              <div>
                <p className="font-semibold">Scan the member's QR code</p>
                <p className="text-gray-600 text-sm">Ask them to open their app and show their pass. Hold their phone steady in front of the camera.</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="bg-[#1a365d] text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
              <div>
                <p className="font-semibold">Read the screen</p>
                <p className="text-gray-600 text-sm"><strong className="text-green-700">GREEN = Let them in.</strong> <strong className="text-red-600">RED = Deny entry</strong> (reason shown on screen). The system automatically restarts scanning after each result.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 4: Troubleshooting ── */}
        <section className="mb-8">
          <h2 className="text-lg font-extrabold text-[#1a365d] uppercase tracking-wide mb-4 border-b-2 border-[#1a365d] pb-1">
            4. Common Issues &amp; Fixes
          </h2>
          <div className="space-y-3">
            {[
              {
                issue: '"Already checked in today"',
                color: 'border-red-400 bg-red-50',
                heading: 'text-red-800',
                fix: 'This person has already been scanned today. They cannot enter again on the same membership scan. If it seems wrong, check with an admin.',
              },
              {
                issue: '"All 5 game entries used" (Supporter Pack)',
                color: 'border-red-400 bg-red-50',
                heading: 'text-red-800',
                fix: 'Their 5-game Supporter Pack is fully used for the season. Direct them to purchase a Day Pass ($8) or upgrade to a full membership.',
              },
              {
                issue: '"Membership not active"',
                color: 'border-red-400 bg-red-50',
                heading: 'text-red-800',
                fix: 'Their membership is expired or pending admin approval. Direct them to purchase a Day Pass for today.',
              },
              {
                issue: '"Day Pass already used"',
                color: 'border-red-400 bg-red-50',
                heading: 'text-red-800',
                fix: 'Day passes are single-use only. Once scanned, they cannot be re-used. If there has been an error, contact admin.',
              },
              {
                issue: 'QR Code won\'t scan',
                color: 'border-amber-400 bg-amber-50',
                heading: 'text-amber-800',
                fix: 'Ask the member to: (1) Increase their phone brightness to maximum. (2) Hold the phone steady. (3) Refresh/reload their app. If it still won\'t scan, note their name and contact admin.',
              },
              {
                issue: 'No QR code / doesn\'t have the app',
                color: 'border-amber-400 bg-amber-50',
                heading: 'text-amber-800',
                fix: 'Help them open the app on their phone. If they\'re a paid-up member, their QR code will be on the Home screen after logging in. If they haven\'t logged in before, they\'ll need to sign in with their purchase email.',
              },
              {
                issue: 'App / scanner not loading',
                color: 'border-gray-400 bg-gray-50',
                heading: 'text-gray-800',
                fix: 'Force close and reopen the app/browser. Check your internet connection. If persistent, contact admin and record entries manually (name + pass type) for reconciliation later.',
              },
            ].map(({ issue, color, heading, fix }, i) => (
              <div key={i} className={`border-l-4 rounded-r-lg px-4 py-3 ${color}`}>
                <p className={`font-bold text-sm mb-1 ${heading}`}>❓ {issue}</p>
                <p className="text-sm text-gray-700">→ {fix}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 5: Merch Discount ── */}
        <section className="mb-8">
          <h2 className="text-lg font-extrabold text-[#1a365d] uppercase tracking-wide mb-4 border-b-2 border-[#1a365d] pb-1">
            5. Merchandise Discount (Merch Scanner)
          </h2>
          <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-4 space-y-2 text-sm text-gray-700">
            <p><strong>Who gets it?</strong> Premium Members, Old Butchers Members — 20% off, once per season.</p>
            <p><strong>Who doesn't?</strong> Supporter Pack, Family Membership, Day Pass holders — no merch discount.</p>
            <p><strong>How to apply it:</strong> Scan their QR code on the Merch Scanner page. The app will tell you if the discount is available or already used. Enter the purchase amount and tap "Apply Discount + Record."</p>
            <p><strong>Already used?</strong> The scanner shows a warning. Charge full price — the season discount is one-time only.</p>
          </div>
        </section>

        {/* ── Footer ── */}
        <div className="border-t-2 border-gray-200 pt-5 text-center text-xs text-gray-400">
          <p>Central Newcastle RLFC · 2026 Season · Staff Reference Guide</p>
          <p className="mt-1">For system access issues, contact your club administrator · charlestown-rl-community-app-1e1650bd.base44.app</p>
        </div>

      </div>
    </div>
  );
}