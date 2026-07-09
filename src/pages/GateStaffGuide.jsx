import React from 'react';
import { ArrowLeft, CheckCircle, XCircle, UserCheck, Camera, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import clubConfig from '@/config/club.config';
import Eyebrow from '@/components/ui-kit/Eyebrow';

const t = clubConfig.theme;

const solidCard = {
  background: t.bg1,
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.08)',
};

const sectionTitle = {
  color: 'white',
  fontFamily: t.fontDisplay,
  fontSize: 20,
  fontWeight: 700,
};

const bodyText = {
  color: 'rgba(255,255,255,0.7)',
  fontFamily: t.fontBody,
  fontSize: 16,
};

const hint = {
  color: 'rgba(255,255,255,0.5)',
  fontFamily: t.fontBody,
  fontSize: 14,
};

export default function GateStaffGuide() {
  return (
    <div className="pb-8" style={{ minHeight: '100dvh', background: t.bg0, fontFamily: t.fontBody }}>
      {/* Header */}
      <div className="pt-safe pb-6" style={{ background: t.bg1, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="px-5 py-4">
          <Link to={createPageUrl('AdminDashboard')}>
            <button className="mb-4 flex items-center gap-2" style={{ color: t.gold, fontSize: 16, fontFamily: t.fontBody }}>
              <ArrowLeft className="w-5 h-5" />
              Back to Admin
            </button>
          </Link>
          <Eyebrow color={t.gold}>Staff Guide</Eyebrow>
          <h1 className="text-2xl font-bold text-white mt-1" style={{ fontFamily: t.fontDisplay }}>Gate Staff Guide</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Entry & Check-in Procedures</p>
        </div>
      </div>

      <div className="px-5 -mt-4 space-y-6">
        {/* Quick Start */}
        <div className="p-6" style={solidCard}>
          <h2 className="mb-4 flex items-center gap-2" style={sectionTitle}>
            <UserCheck className="w-6 h-6" style={{ color: t.gold }} />
            Quick Start
          </h2>
          <ol className="space-y-3">
            <li className="flex gap-3" style={bodyText}>
              <span className="font-bold" style={{ color: t.gold }}>1.</span>
              <span>Open the <strong>Gate Staff Login</strong> page on your device</span>
            </li>
            <li className="flex gap-3" style={bodyText}>
              <span className="font-bold" style={{ color: t.gold }}>2.</span>
              <span>Keep the <strong>Gate Scan</strong> page open and ready</span>
            </li>
            <li className="flex gap-3" style={bodyText}>
              <span className="font-bold" style={{ color: t.gold }}>3.</span>
              <span>Scan each person's QR code as they arrive</span>
            </li>
          </ol>
        </div>

        {/* Entry Types */}
        <div className="p-6" style={solidCard}>
          <h2 className="mb-4" style={sectionTitle}>Entry Types You'll See</h2>
          <div className="space-y-4">
            <div style={{ borderLeft: '4px solid #16a34a', paddingLeft: 16, padding: '8px 0 8px 16px' }}>
              <h3 className="font-bold" style={{ color: '#4ade80', fontSize: 16 }}>Active Members</h3>
              <p className="text-sm" style={bodyText}>Green badge with QR code on their membership pass</p>
              <p className="mt-1" style={hint}>✓ Free entry, points awarded automatically</p>
            </div>

            <div style={{ borderLeft: '4px solid #3b82f6', paddingLeft: 16, padding: '8px 0 8px 16px' }}>
              <h3 className="font-bold" style={{ color: '#60a5fa', fontSize: 16 }}>Day Pass Holders</h3>
              <p className="text-sm" style={bodyText}>Digital pass with unique QR code</p>
              <p className="mt-1" style={hint}>✓ Pre-paid online, verify photo if available</p>
            </div>

            <div style={{ borderLeft: '4px solid #f59e0b', paddingLeft: 16, padding: '8px 0 8px 16px' }}>
              <h3 className="font-bold" style={{ color: '#fbbf24', fontSize: 16 }}>Walk-ups (No Pass)</h3>
              <p className="text-sm" style={bodyText}>Direct them to purchase at gate or online</p>
              <p className="mt-1" style={hint}>→ Show them how to buy a Day Pass on their phone</p>
            </div>
          </div>
        </div>

        {/* Step-by-Step Process */}
        <div className="p-6" style={solidCard}>
          <h2 className="mb-4 flex items-center gap-2" style={sectionTitle}>
            <Camera className="w-6 h-6" style={{ color: t.gold }} />
            Scanning Process
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-bold mb-2" style={{ color: 'white', fontSize: 16 }}>Step 1: Position the QR Code</h3>
              <p className="mb-2" style={bodyText}>Ask the person to hold their phone steady with QR code visible</p>
              <div className="rounded-lg p-3" style={{ background: t.navy, ...hint }}>
                <strong>Tip:</strong> QR code should fill at least 1/3 of your camera view
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-2" style={{ color: 'white', fontSize: 16 }}>Step 2: Scan & Verify</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#4ade80' }} />
                  <div>
                    <p className="font-medium" style={{ color: '#4ade80', fontSize: 16 }}>Valid Entry ✓</p>
                    <p className="text-sm" style={bodyText}>Screen turns green with member/pass holder name</p>
                    <p className="mt-1" style={hint}>→ Wave them through</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#f87171' }} />
                  <div>
                    <p className="font-medium" style={{ color: '#f87171', fontSize: 16 }}>Invalid Entry ✗</p>
                    <p className="text-sm" style={bodyText}>Screen turns red with error message</p>
                    <p className="mt-1" style={hint}>→ Check the troubleshooting guide below</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-2" style={{ color: 'white', fontSize: 16 }}>Step 3: Award Points (Members Only)</h3>
              <p className="text-sm" style={bodyText}>Points are added automatically when a member checks in</p>
              <div className="rounded-lg p-3 mt-2" style={{ background: t.navy, color: t.cyan, fontSize: 14 }}>
                <strong>Note:</strong> Day pass holders don't earn points (unless they upgrade to membership)
              </div>
            </div>
          </div>
        </div>

        {/* Common Issues */}
        <div className="p-6" style={solidCard}>
          <h2 className="mb-4 flex items-center gap-2" style={sectionTitle}>
            <AlertTriangle className="w-6 h-6" style={{ color: t.gold }} />
            Common Issues
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-bold" style={{ color: '#f87171', fontSize: 16 }}>❌ "Pass Already Used"</h3>
              <p className="mt-1" style={bodyText}>Day pass has already been scanned today</p>
              <p className="mt-1 pl-4" style={hint}>→ Politely explain passes are single-use per event</p>
            </div>

            <div>
              <h3 className="font-bold" style={{ color: '#f87171', fontSize: 16 }}>❌ "Membership Expired"</h3>
              <p className="mt-1" style={bodyText}>Member's annual subscription has lapsed</p>
              <p className="mt-1 pl-4" style={hint}>→ Direct them to renew membership or purchase day pass</p>
            </div>

            <div>
              <h3 className="font-bold" style={{ color: '#f87171', fontSize: 16 }}>❌ QR Code Won't Scan</h3>
              <p className="mt-1" style={bodyText}>Code is blurry, damaged, or screen brightness too low</p>
              <p className="mt-1 pl-4" style={hint}>→ Ask them to increase brightness and hold steady</p>
              <p className="pl-4" style={hint}>→ Try having them refresh the QR code on their device</p>
            </div>

            <div>
              <h3 className="font-bold" style={{ color: '#fbbf24', fontSize: 16 }}>⚠️ No QR Code</h3>
              <p className="mt-1" style={bodyText}>Person doesn't have a membership or day pass</p>
              <p className="mt-1 pl-4" style={hint}>→ Help them purchase a day pass on their phone</p>
              <p className="pl-4" style={hint}>→ Show them the QR code at gate or club entrance</p>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="p-6" style={solidCard}>
          <h2 className="mb-4" style={sectionTitle}>Best Practices</h2>
          <ul className="space-y-2">
            <li className="flex items-start gap-2" style={bodyText}>
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: '#4ade80' }} />
              <span>Keep your device charged and brightness at maximum for scanning</span>
            </li>
            <li className="flex items-start gap-2" style={bodyText}>
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: '#4ade80' }} />
              <span>Be friendly and patient - some people are new to digital passes</span>
            </li>
            <li className="flex items-start gap-2" style={bodyText}>
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: '#4ade80' }} />
              <span>Have a backup plan: note names manually if system is down</span>
            </li>
            <li className="flex items-start gap-2" style={bodyText}>
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: '#4ade80' }} />
              <span>Encourage people to have their QR ready before reaching the gate</span>
            </li>
          </ul>
        </div>

        {/* Emergency Contact */}
        <div className="p-6" style={{ ...solidCard, border: '1px solid rgba(220,38,38,0.30)' }}>
          <h2 className="mb-2" style={{ ...sectionTitle, color: '#f87171' }}>Need Help?</h2>
          <p className="text-sm" style={{ color: 'rgba(252,165,165,0.8)', fontFamily: t.fontBody, fontSize: 16 }}>If you encounter persistent issues, contact the club administrator immediately</p>
          <Link to={createPageUrl('TroubleshootingGuide')}>
            <button className="mt-3 underline font-medium" style={{ color: '#f87171', fontSize: 14 }}>
              View Full Troubleshooting Guide →
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}