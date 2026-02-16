import React from 'react';
import { ArrowLeft, ShoppingBag, Scan, Trophy, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';

export default function CanteenStaffGuide() {
  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-[#1a365d] pt-safe pb-6">
        <div className="px-5 py-4">
          <Link to={createPageUrl('AdminDashboard')}>
            <button className="text-white mb-4 flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              Back to Admin
            </button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Canteen Staff Guide</h1>
          <p className="text-blue-200 text-sm mt-1">Bar & Food Service Instructions</p>
        </div>
      </div>

      <div className="px-5 -mt-4 space-y-6">
        {/* Quick Start */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-blue-600" />
            Quick Start
          </h2>
          <ol className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="font-bold text-blue-600">1.</span>
              <span>Open the <strong>Canteen Staff Login</strong> page</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600">2.</span>
              <span>Keep the <strong>Bar Scan</strong> page open during service</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600">3.</span>
              <span>Scan member QR codes to apply discounts and award points</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600">4.</span>
              <span>Process payment and complete the transaction</span>
            </li>
          </ol>
        </Card>

        {/* Transaction Flow */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Transaction Process</h2>
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                <h3 className="font-bold">Take the Order</h3>
              </div>
              <p className="text-sm text-gray-600 ml-10">Get customer's food/drink order as normal</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                <h3 className="font-bold">Ask if They're a Member</h3>
              </div>
              <div className="ml-10 space-y-2">
                <p className="text-sm text-gray-600">"Are you a club member?"</p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-green-900">✓ Yes, I'm a member</p>
                  <p className="text-xs text-green-700 mt-1">→ Proceed to Step 3: Scan their QR code</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900">✗ No membership</p>
                  <p className="text-xs text-gray-700 mt-1">→ Skip to Step 5: Process at full price</p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                <h3 className="font-bold flex items-center gap-2">
                  <Scan className="w-5 h-5" />
                  Scan Member QR Code
                </h3>
              </div>
              <div className="ml-10 space-y-2">
                <p className="text-sm text-gray-600">Ask member to show their QR code from Home screen</p>
                <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-900">
                  <strong>Scanning Tips:</strong>
                  <ul className="mt-1 space-y-1 ml-4 list-disc">
                    <li>Hold device steady, 15-20cm from QR code</li>
                    <li>Ensure good lighting</li>
                    <li>Ask member to increase screen brightness if needed</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">4</div>
                <h3 className="font-bold flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Apply Discount
                </h3>
              </div>
              <div className="ml-10 space-y-2">
                <p className="text-sm text-gray-600">Screen will show member's discount and new price</p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-amber-900">Example:</p>
                  <p className="text-xs text-gray-700 mt-1">Original: $25.00</p>
                  <p className="text-xs text-green-700">Member Discount: -$2.50 (10%)</p>
                  <p className="text-sm font-bold text-gray-900 mt-1">Final Price: $22.50</p>
                </div>
                <p className="text-xs text-gray-600 italic">Discount percentage may vary by location/tier</p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">5</div>
                <h3 className="font-bold">Enter Purchase Amount</h3>
              </div>
              <div className="ml-10 space-y-2">
                <p className="text-sm text-gray-600">Type in the final amount customer will pay</p>
                <p className="text-xs text-gray-500">System automatically records transaction details</p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">6</div>
                <h3 className="font-bold flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Points Awarded!
                </h3>
              </div>
              <div className="ml-10 space-y-2">
                <p className="text-sm text-gray-600">Member automatically receives points based on purchase</p>
                <div className="bg-green-50 rounded-lg p-3 text-xs text-green-900">
                  <strong>Points Guide (typical):</strong>
                  <ul className="mt-1 space-y-1 ml-4 list-disc">
                    <li>$1 spent = 1 point</li>
                    <li>Bonus points may apply during special promotions</li>
                    <li>Member can check their balance in the app</li>
                  </ul>
                </div>
                <p className="text-xs text-gray-600 italic">Let them know they earned points with their purchase!</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Member Benefits */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
          <h2 className="text-xl font-bold mb-4">What Members Get</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Member Discounts</p>
                <p className="text-sm text-gray-600">Percentage off at bar, canteen & merchandise</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Trophy className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Points on Purchases</p>
                <p className="text-sm text-gray-600">Earn points redeemable for rewards</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Common Scenarios */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Common Scenarios</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-blue-700">💳 "I forgot my phone"</h3>
              <p className="text-sm text-gray-700 mt-1">Member doesn't have QR code available</p>
              <p className="text-xs text-gray-500 mt-1 pl-4">→ Process at full price (non-member rate)</p>
              <p className="text-xs text-gray-500 pl-4">→ Suggest they bring phone next time for discount</p>
            </div>

            <div>
              <h3 className="font-bold text-blue-700">🤝 "Can I buy for my friend?"</h3>
              <p className="text-sm text-gray-700 mt-1">Member buying for non-member friend</p>
              <p className="text-xs text-gray-500 mt-1 pl-4">→ Discount applies to member's purchase only</p>
              <p className="text-xs text-gray-500 pl-4">→ Process two separate transactions if needed</p>
            </div>

            <div>
              <h3 className="font-bold text-blue-700">❓ "What are points worth?"</h3>
              <p className="text-sm text-gray-700 mt-1">Member asking about their points balance</p>
              <p className="text-xs text-gray-500 mt-1 pl-4">→ Direct them to Points & Rewards tab in the app</p>
              <p className="text-xs text-gray-500 pl-4">→ Mention they can redeem for free drinks, merchandise, etc.</p>
            </div>

            <div>
              <h3 className="font-bold text-amber-700">⚠️ QR Code Won't Scan</h3>
              <p className="text-sm text-gray-700 mt-1">Technical scanning issue</p>
              <p className="text-xs text-gray-500 mt-1 pl-4">→ Ask them to refresh the app</p>
              <p className="text-xs text-gray-500 pl-4">→ Check your device camera/lighting</p>
              <p className="text-xs text-gray-500 pl-4">→ Last resort: process as non-member and log manually</p>
            </div>

            <div>
              <h3 className="font-bold text-red-700">❌ "Membership Expired"</h3>
              <p className="text-sm text-gray-700 mt-1">Scan shows expired membership</p>
              <p className="text-xs text-gray-500 mt-1 pl-4">→ Politely inform them membership needs renewal</p>
              <p className="text-xs text-gray-500 pl-4">→ They can renew in the app or at club office</p>
              <p className="text-xs text-gray-500 pl-4">→ Process at full price until renewed</p>
            </div>
          </div>
        </Card>

        {/* Best Practices */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Best Practices</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Always ask</strong> if they're a member before processing payment</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Let them know</strong> they earned points after each purchase</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Encourage sign-ups</strong> - "Did you know members save 10% plus earn rewards?"</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Keep device charged</strong> and ready during busy periods</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Be patient</strong> with first-time digital users</span>
            </li>
          </ul>
        </Card>

        {/* Promoting Membership */}
        <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50">
          <h2 className="text-xl font-bold mb-3">💡 Help Grow Membership</h2>
          <p className="text-sm text-gray-700 mb-3">When serving non-members, casually mention the benefits:</p>
          <div className="bg-white rounded-lg p-3 border border-amber-200">
            <p className="text-sm text-gray-800 italic">
              "Just so you know, if you become a member you'd save 10% on all your purchases plus earn points for free drinks and rewards. It pays for itself quickly!"
            </p>
          </div>
        </Card>

        {/* Emergency Contact */}
        <Card className="p-6 bg-red-50 border-red-200">
          <h2 className="text-xl font-bold mb-2 text-red-900 flex items-center gap-2">
            <AlertCircle className="w-6 h-6" />
            Need Help?
          </h2>
          <p className="text-sm text-red-800">If you encounter technical issues during service, contact the club administrator</p>
          <Link to={createPageUrl('TroubleshootingGuide')}>
            <button className="mt-3 text-sm text-red-700 underline font-medium">
              View Full Troubleshooting Guide →
            </button>
          </Link>
        </Card>
      </div>
    </div>
  );
}