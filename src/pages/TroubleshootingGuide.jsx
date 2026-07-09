import React, { useState } from 'react';
import { AlertTriangle, Smartphone, Wifi, Battery, Camera, QrCode, CreditCard, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import clubConfig from '@/config/club.config';
import { UtilityCard, UtilityHeader } from '@/components/ui-kit';

const t = clubConfig.theme;

const bodyText = {
  color: 'rgba(255,255,255,0.75)',
  fontFamily: t.fontBody,
  fontSize: 17,
  lineHeight: 1.6,
};

const solutionBox = {
  borderRadius: 8,
  padding: 12,
  marginTop: 8,
};

const solutionText = {
  color: 'rgba(255,255,255,0.6)',
  fontFamily: t.fontBody,
  fontSize: 15,
  lineHeight: 1.6,
};

const issueTitle = {
  fontFamily: t.fontBody,
  fontSize: 18,
  fontWeight: 700,
};

function IssueCard({ icon, iconColor, titleColor, title, cause, solutions, boxBg }) {
  return (
    <UtilityCard>
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0" style={{ color: iconColor }}>{icon}</div>
        <div className="flex-1">
          <h3 className="font-bold" style={{ ...issueTitle, color: titleColor }}>{title}</h3>
          <div className="mt-2 space-y-2">
            <p style={bodyText}><strong>Cause:</strong> {cause}</p>
            <div style={{ ...solutionBox, background: boxBg || t.navy }}>
              <p style={{ ...solutionText, fontWeight: 700, color: t.gold }}>Solutions:</p>
              <ul className="list-disc ml-4 space-y-1 mt-1" style={solutionText}>
                {solutions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </UtilityCard>
  );
}

export default function TroubleshootingGuide() {
  const [activeTab, setActiveTab] = useState('gate');

  return (
    <div className="pb-8" style={{ minHeight: '100dvh', background: t.bg0, fontFamily: t.fontBody }}>
      <UtilityHeader
        title="Troubleshooting Guide"
        onBack={() => window.location.href = createPageUrl('AdminDashboard')}
      />

      <div className="px-5 py-6 space-y-6">
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Quick fixes for common issues</p>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="gate">Gate</TabsTrigger>
            <TabsTrigger value="canteen">Canteen</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
          </TabsList>

          {/* Gate Issues */}
          <TabsContent value="gate" className="space-y-4">
            <IssueCard
              icon={<QrCode className="w-6 h-6" />}
              iconColor="#f87171"
              titleColor="#f87171"
              title="QR Code Won't Scan"
              cause="Poor lighting, damaged code, or low screen brightness"
              solutions={[
                'Ask person to increase phone brightness to maximum',
                'Have them refresh the app (close and reopen)',
                'Move to better lighting if outdoors at night',
                'Clean your device camera lens',
                'Try holding device closer/further from code',
              ]}
            />

            <IssueCard
              icon={<AlertTriangle className="w-6 h-6" />}
              iconColor="#FBBF24"
              titleColor="#FBBF24"
              title={'"Pass Already Used"'}
              cause="Day pass has already been scanned for this event"
              solutions={[
                'Check if this is a duplicate entry attempt (person already came in)',
                "Verify the pass is for TODAY'S game (not an old pass)",
                'If legitimate issue, contact admin to manually verify and override',
              ]}
              boxBg="#7C2D12"
            />

            <IssueCard
              icon={<CreditCard className="w-6 h-6" />}
              iconColor="#f87171"
              titleColor="#f87171"
              title={'"Membership Expired"'}
              cause="Annual membership has lapsed"
              solutions={[
                'Politely inform them their membership needs renewal',
                'Direct them to renew in the app (Membership tab)',
                'Offer option to purchase a day pass for today',
                'Club office can assist with immediate renewal if open',
              ]}
              boxBg="#7F1D1D"
            />

            <IssueCard
              icon={<Users className="w-6 h-6" />}
              iconColor={t.cyan}
              titleColor={t.cyan}
              title="Person Has No Pass"
              cause="Not a member and hasn't purchased day pass"
              solutions={[
                'Help them purchase day pass on their phone (show QR at gate)',
                'Direct to gate cashier if cash payment preferred',
                "Explain membership benefits if they're interested",
                'Have promotional material ready to hand out',
              ]}
            />
          </TabsContent>

          {/* Canteen Issues */}
          <TabsContent value="canteen" className="space-y-4">
            <IssueCard
              icon={<QrCode className="w-6 h-6" />}
              iconColor="#f87171"
              titleColor="#f87171"
              title="Can't Scan Member QR"
              cause="Scanner not reading member's QR code"
              solutions={[
                'Check your device camera is working properly',
                'Ask member to increase brightness and hold steady',
                'Have member refresh app (close and reopen)',
                'If persistent: process at full price and note for admin to credit points later',
              ]}
            />

            <IssueCard
              icon={<AlertTriangle className="w-6 h-6" />}
              iconColor="#FBBF24"
              titleColor="#FBBF24"
              title="Discount Not Applying"
              cause="Scan successful but discount doesn't show"
              solutions={[
                'Verify member has active (not expired) membership',
                'Check if location discount is configured for this area',
                'Manually calculate and apply standard discount',
                'Note the issue and contact admin if recurring',
              ]}
              boxBg="#7C2D12"
            />

            <IssueCard
              icon={<CreditCard className="w-6 h-6" />}
              iconColor={t.cyan}
              titleColor={t.cyan}
              title="Transaction Failed to Record"
              cause="Network issue or system error"
              solutions={[
                'Check your internet connection',
                'Try submitting the transaction again',
                'If still failing: note purchase details manually',
                'Give member benefit of doubt - apply discount anyway',
                'Report to admin to add transaction and points manually',
              ]}
            />

            <IssueCard
              icon={<Users className="w-6 h-6" />}
              iconColor="#C084FC"
              titleColor="#C084FC"
              title="Member Forgot Phone"
              cause="Member has no way to show QR code"
              solutions={[
                'Process at full (non-member) price for this purchase',
                'Suggest they bring phone next time for discount',
                'If they know their membership number, admin can verify and credit points later',
                'Be friendly - mistakes happen!',
              ]}
              boxBg="#581C87"
            />
          </TabsContent>

          {/* Technical Issues */}
          <TabsContent value="technical" className="space-y-4">
            <IssueCard
              icon={<Wifi className="w-6 h-6" />}
              iconColor="#f87171"
              titleColor="#f87171"
              title="No Internet Connection"
              cause="Wi-Fi down or mobile data not working"
              solutions={[
                'Check if Wi-Fi is connected and working',
                'Try switching to mobile data if available',
                'Restart your device',
                'Check other devices - is it just yours or venue-wide?',
                'Fallback: Note entries/transactions manually on paper',
                'Contact venue manager about Wi-Fi issue',
              ]}
              boxBg="#7F1D1D"
            />

            <IssueCard
              icon={<Battery className="w-6 h-6" />}
              iconColor="#FBBF24"
              titleColor="#FBBF24"
              title="Device Battery Low/Dead"
              cause="Staff device running out of power"
              solutions={[
                'Always keep charger and power bank available at station',
                'Have backup device charged and ready',
                'Rotate devices if multiple staff on duty',
                'Emergency: Use paper system until device charged',
              ]}
              boxBg="#7C2D12"
            />

            <IssueCard
              icon={<Smartphone className="w-6 h-6" />}
              iconColor={t.cyan}
              titleColor={t.cyan}
              title="App Frozen/Not Responding"
              cause="Software glitch or memory issue"
              solutions={[
                'Step 1: Force close app and reopen',
                'Step 2: Clear app from recent apps and restart',
                'Step 3: Restart your device',
                'Step 4: Clear browser cache if using web app',
                'If recurring: report to admin - may need app update',
              ]}
            />

            <IssueCard
              icon={<Camera className="w-6 h-6" />}
              iconColor="#C084FC"
              titleColor="#C084FC"
              title="Camera Not Working"
              cause="App doesn't have camera permission or hardware issue"
              solutions={[
                'Check device settings - ensure app has camera permission',
                'Close other apps that might be using camera',
                'Restart the app',
                'Test camera in default camera app - if broken, use backup device',
                'Clean camera lens',
              ]}
              boxBg="#581C87"
            />

            <IssueCard
              icon={<AlertTriangle className="w-6 h-6" />}
              iconColor="#f87171"
              titleColor="#f87171"
              title="System-Wide Outage"
              cause="Server down or major technical failure"
              solutions={[
                'Gate: Switch to paper ticketing/manual entry log',
                'Canteen: Process all sales at full price, note member names',
                'Immediately notify club administrator',
                'Post sign: "System temporarily down - bear with us"',
                'Admin will credit points/discounts after system restored',
                'Stay calm and professional with customers',
              ]}
              boxBg="#7F1D1D"
            />
          </TabsContent>
        </Tabs>

        {/* Emergency Protocol */}
        <UtilityCard style={{ borderColor: 'rgba(220,38,38,0.40)' }}>
          <h2 className="mb-3 flex items-center gap-2" style={{ color: '#f87171', fontFamily: t.fontDisplay, fontSize: 20, fontWeight: 800 }}>
            <AlertTriangle className="w-6 h-6" />
            When All Else Fails
          </h2>
          <div className="space-y-3">
            <div className="rounded-lg p-3" style={{ background: t.navy }}>
              <p className="font-bold mb-1" style={{ color: '#FFFFFF', fontSize: 17 }}>1. STAY CALM</p>
              <p style={solutionText}>Don't panic or frustrate customers - technical issues happen</p>
            </div>
            <div className="rounded-lg p-3" style={{ background: t.navy }}>
              <p className="font-bold mb-1" style={{ color: '#FFFFFF', fontSize: 17 }}>2. GO MANUAL</p>
              <p style={solutionText}>Paper and pen - write down names, amounts, transaction details</p>
            </div>
            <div className="rounded-lg p-3" style={{ background: t.navy }}>
              <p className="font-bold mb-1" style={{ color: '#FFFFFF', fontSize: 17 }}>3. NOTIFY ADMIN</p>
              <p style={solutionText}>Contact club administrator immediately via phone/text</p>
            </div>
            <div className="rounded-lg p-3" style={{ background: t.navy }}>
              <p className="font-bold mb-1" style={{ color: '#FFFFFF', fontSize: 17 }}>4. BE GENEROUS</p>
              <p style={solutionText}>If in doubt, give benefit to the customer - better than bad experience</p>
            </div>
            <div className="rounded-lg p-3" style={{ background: t.navy }}>
              <p className="font-bold mb-1" style={{ color: '#FFFFFF', fontSize: 17 }}>5. RECONCILE LATER</p>
              <p style={solutionText}>Admin can manually add points/transactions after issue resolved</p>
            </div>
          </div>
        </UtilityCard>

        {/* Quick Contact */}
        <UtilityCard>
          <h2 className="mb-3" style={{ color: '#FFFFFF', fontFamily: t.fontDisplay, fontSize: 20, fontWeight: 800 }}>Need More Help?</h2>
          <p className="mb-3" style={bodyText}>Contact club administrator for:</p>
          <ul className="space-y-1 ml-4 list-disc" style={bodyText}>
            <li>Recurring technical issues</li>
            <li>System-wide problems</li>
            <li>Manual transaction adjustments</li>
            <li>Training or clarification on procedures</li>
          </ul>
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <Link to={createPageUrl('GateStaffGuide')}>
              <button className="underline mr-4" style={{ color: t.cyan, fontSize: 15 }}>Gate Staff Guide</button>
            </Link>
            <Link to={createPageUrl('CanteenStaffGuide')}>
              <button className="underline" style={{ color: t.cyan, fontSize: 15 }}>Canteen Staff Guide</button>
            </Link>
          </div>
        </UtilityCard>
      </div>
    </div>
  );
}