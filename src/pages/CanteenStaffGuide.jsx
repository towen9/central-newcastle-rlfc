import React from 'react';
import { ArrowLeft, ShoppingBag, Scan, Trophy, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useClub, getClubConfig } from '@/contexts/ClubContext';
import { UtilityCard, UtilityHeader } from '@/components/ui-kit';

const t = getClubConfig().theme;

const bodyText = {
  color: 'rgba(255,255,255,0.75)',
  fontFamily: t.fontBody,
  fontSize: 17,
  lineHeight: 1.6,
};

const smallText = {
  color: 'rgba(255,255,255,0.6)',
  fontFamily: t.fontBody,
  fontSize: 15,
  lineHeight: 1.5,
};

const hint = {
  color: 'rgba(255,255,255,0.5)',
  fontFamily: t.fontBody,
  fontSize: 15,
  lineHeight: 1.5,
};

const sectionTitle = {
  color: '#FFFFFF',
  fontFamily: t.fontDisplay,
  fontSize: 20,
  fontWeight: 800,
};

const stepTitle = {
  color: '#FFFFFF',
  fontFamily: t.fontBody,
  fontSize: 18,
  fontWeight: 700,
};

export default function CanteenStaffGuide() {
  const { club } = useClub();
  const t = club.theme;
  return (
    <div className="pb-8" style={{ minHeight: '100dvh', background: t.bg0, fontFamily: t.fontBody }}>
      <UtilityHeader
        title="Canteen Staff Guide"
        onBack={() => window.location.href = createPageUrl('AdminDashboard')}
      />

      <div className="px-5 py-6 space-y-6">
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Bar & Food Service Instructions</p>

        {/* Quick Start */}
        <UtilityCard>
          <h2 className="mb-4 flex items-center gap-2" style={sectionTitle}>
            <ShoppingBag className="w-6 h-6" style={{ color: t.gold }} />
            Quick Start
          </h2>
          <ol className="space-y-3">
            <li className="flex gap-3" style={bodyText}>
              <span className="font-bold" style={{ color: t.gold }}>1.</span>
              <span>Open the <strong>Canteen Staff Login</strong> page</span>
            </li>
            <li className="flex gap-3" style={bodyText}>
              <span className="font-bold" style={{ color: t.gold }}>2.</span>
              <span>Keep the <strong>Bar Scan</strong> page open during service</span>
            </li>
            <li className="flex gap-3" style={bodyText}>
              <span className="font-bold" style={{ color: t.gold }}>3.</span>
              <span>Scan member QR codes to apply discounts and award points</span>
            </li>
            <li className="flex gap-3" style={bodyText}>
              <span className="font-bold" style={{ color: t.gold }}>4.</span>
              <span>Process payment and complete the transaction</span>
            </li>
          </ol>
        </UtilityCard>

        {/* Transaction Flow */}
        <UtilityCard>
          <h2 className="mb-4" style={sectionTitle}>Transaction Process</h2>
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: t.royal, color: '#fff' }}>1</div>
                <h3 className="font-bold" style={stepTitle}>Take the Order</h3>
              </div>
              <p className="ml-10" style={smallText}>Get customer's food/drink order as normal</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: t.royal, color: '#fff' }}>2</div>
                <h3 className="font-bold" style={stepTitle}>Ask if They're a Member</h3>
              </div>
              <div className="ml-10 space-y-2">
                <p style={smallText}>"Are you a club member?"</p>
                <div className="rounded-lg p-3" style={{ background: '#14532D', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <p className="font-medium" style={{ color: t.green, fontSize: 15 }}>✓ Yes, I'm a member</p>
                  <p className="mt-1" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>→ Proceed to Step 3: Scan their QR code</p>
                </div>
                <div className="rounded-lg p-3" style={{ background: t.navy, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <p className="font-medium text-white" style={{ fontSize: 15 }}>✗ No membership</p>
                  <p className="mt-1" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>→ Skip to Step 5: Process at full price</p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: t.royal, color: '#fff' }}>3</div>
                <h3 className="font-bold flex items-center gap-2" style={stepTitle}>
                  <Scan className="w-5 h-5" style={{ color: t.gold }} />
                  Scan Member QR Code
                </h3>
              </div>
              <div className="ml-10 space-y-2">
                <p style={smallText}>Ask member to show their QR code from Home screen</p>
                <div className="rounded-lg p-3" style={{ background: t.navy, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <p className="font-bold" style={{ color: t.gold, fontSize: 14 }}>Scanning Tips:</p>
                  <ul className="mt-1 space-y-1 ml-4 list-disc" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
                    <li>Hold device steady, 15-20cm from QR code</li>
                    <li>Ensure good lighting</li>
                    <li>Ask member to increase screen brightness if needed</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: t.royal, color: '#fff' }}>4</div>
                <h3 className="font-bold flex items-center gap-2" style={stepTitle}>
                  <DollarSign className="w-5 h-5" style={{ color: t.gold }} />
                  Apply Discount
                </h3>
              </div>
              <div className="ml-10 space-y-2">
                <p style={smallText}>Screen will show member's discount and new price</p>
                <div className="rounded-lg p-3" style={{ background: '#7C2D12', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <p className="font-medium" style={{ color: '#FBBF24', fontSize: 15 }}>Example:</p>
                  <p className="mt-1" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Original: $25.00</p>
                  <p style={{ color: t.green, fontSize: 14 }}>Member Discount: -$2.50 (10%)</p>
                  <p className="font-bold text-white mt-1" style={{ fontSize: 15 }}>Final Price: $22.50</p>
                </div>
                <p className="italic" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Discount percentage may vary by location/tier</p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: t.royal, color: '#fff' }}>5</div>
                <h3 className="font-bold" style={stepTitle}>Enter Purchase Amount</h3>
              </div>
              <div className="ml-10 space-y-2">
                <p style={smallText}>Type in the final amount customer will pay</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>System automatically records transaction details</p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: t.green, color: '#fff' }}>6</div>
                <h3 className="font-bold flex items-center gap-2" style={stepTitle}>
                  <Trophy className="w-5 h-5" style={{ color: t.gold }} />
                  Points Awarded!
                </h3>
              </div>
              <div className="ml-10 space-y-2">
                <p style={smallText}>Member automatically receives points based on purchase</p>
                <div className="rounded-lg p-3" style={{ background: '#14532D', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <p className="font-bold" style={{ color: t.green, fontSize: 14 }}>Points Guide (typical):</p>
                  <ul className="mt-1 space-y-1 ml-4 list-disc" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
                    <li>$1 spent = 1 point</li>
                    <li>Bonus points may apply during special promotions</li>
                    <li>Member can check their balance in the app</li>
                  </ul>
                </div>
                <p className="italic" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Let them know they earned points with their purchase!</p>
              </div>
            </div>
          </div>
        </UtilityCard>

        {/* Member Benefits */}
        <UtilityCard>
          <h2 className="mb-4" style={sectionTitle}>What Members Get</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: t.green }} />
              <div>
                <p className="font-medium text-white" style={{ fontSize: 17 }}>Member Discounts</p>
                <p style={smallText}>Percentage off at bar, canteen & merchandise</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Trophy className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: t.gold }} />
              <div>
                <p className="font-medium text-white" style={{ fontSize: 17 }}>Points on Purchases</p>
                <p style={smallText}>Earn points redeemable for rewards</p>
              </div>
            </div>
          </div>
        </UtilityCard>

        {/* Common Scenarios */}
        <UtilityCard>
          <h2 className="mb-4" style={sectionTitle}>Common Scenarios</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-bold" style={{ color: t.cyan, fontSize: 17 }}>💳 "I forgot my phone"</h3>
              <p className="mt-1" style={bodyText}>Member doesn't have QR code available</p>
              <p className="mt-1 pl-4" style={hint}>→ Process at full price (non-member rate)</p>
              <p className="pl-4" style={hint}>→ Suggest they bring phone next time for discount</p>
            </div>

            <div>
              <h3 className="font-bold" style={{ color: t.cyan, fontSize: 17 }}>🤝 "Can I buy for my friend?"</h3>
              <p className="mt-1" style={bodyText}>Member buying for non-member friend</p>
              <p className="mt-1 pl-4" style={hint}>→ Discount applies to member's purchase only</p>
              <p className="pl-4" style={hint}>→ Process two separate transactions if needed</p>
            </div>

            <div>
              <h3 className="font-bold" style={{ color: t.cyan, fontSize: 17 }}>❓ "What are points worth?"</h3>
              <p className="mt-1" style={bodyText}>Member asking about their points balance</p>
              <p className="mt-1 pl-4" style={hint}>→ Direct them to Points & Rewards tab in the app</p>
              <p className="pl-4" style={hint}>→ Mention they can redeem for free drinks, merchandise, etc.</p>
            </div>

            <div>
              <h3 className="font-bold" style={{ color: '#FBBF24', fontSize: 17 }}>⚠️ QR Code Won't Scan</h3>
              <p className="mt-1" style={bodyText}>Technical scanning issue</p>
              <p className="mt-1 pl-4" style={hint}>→ Ask them to refresh the app</p>
              <p className="pl-4" style={hint}>→ Check your device camera/lighting</p>
              <p className="pl-4" style={hint}>→ Last resort: process as non-member and log manually</p>
            </div>

            <div>
              <h3 className="font-bold" style={{ color: '#f87171', fontSize: 17 }}>❌ "Membership Expired"</h3>
              <p className="mt-1" style={bodyText}>Scan shows expired membership</p>
              <p className="mt-1 pl-4" style={hint}>→ Politely inform them membership needs renewal</p>
              <p className="pl-4" style={hint}>→ They can renew in the app or at club office</p>
              <p className="pl-4" style={hint}>→ Process at full price until renewed</p>
            </div>
          </div>
        </UtilityCard>

        {/* Best Practices */}
        <UtilityCard>
          <h2 className="mb-4" style={sectionTitle}>Best Practices</h2>
          <ul className="space-y-2">
            <li className="flex items-start gap-2" style={bodyText}>
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: t.green }} />
              <span><strong>Always ask</strong> if they're a member before processing payment</span>
            </li>
            <li className="flex items-start gap-2" style={bodyText}>
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: t.green }} />
              <span><strong>Let them know</strong> they earned points after each purchase</span>
            </li>
            <li className="flex items-start gap-2" style={bodyText}>
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: t.green }} />
              <span><strong>Encourage sign-ups</strong> - "Did you know members save 10% plus earn rewards?"</span>
            </li>
            <li className="flex items-start gap-2" style={bodyText}>
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: t.green }} />
              <span><strong>Keep device charged</strong> and ready during busy periods</span>
            </li>
            <li className="flex items-start gap-2" style={bodyText}>
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: t.green }} />
              <span><strong>Be patient</strong> with first-time digital users</span>
            </li>
          </ul>
        </UtilityCard>

        {/* Promoting Membership */}
        <UtilityCard>
          <h2 className="mb-3" style={sectionTitle}>💡 Help Grow Membership</h2>
          <p className="mb-3" style={bodyText}>When serving non-members, casually mention the benefits:</p>
          <div className="rounded-lg p-3" style={{ background: t.navy, border: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="italic" style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15 }}>
              "Just so you know, if you become a member you'd save 10% on all your purchases plus earn points for free drinks and rewards. It pays for itself quickly!"
            </p>
          </div>
        </UtilityCard>

        {/* Emergency Contact */}
        <UtilityCard style={{ borderColor: 'rgba(220,38,38,0.40)' }}>
          <h2 className="mb-2 flex items-center gap-2" style={{ ...sectionTitle, color: '#f87171' }}>
            <AlertCircle className="w-6 h-6" />
            Need Help?
          </h2>
          <p style={{ color: 'rgba(252,165,165,0.85)', fontSize: 17, lineHeight: 1.5 }}>If you encounter technical issues during service, contact the club administrator</p>
          <Link to={createPageUrl('TroubleshootingGuide')}>
            <button className="mt-3 underline font-medium" style={{ color: '#f87171', fontSize: 15 }}>
              View Full Troubleshooting Guide →
            </button>
          </Link>
        </UtilityCard>
      </div>
    </div>
  );
}