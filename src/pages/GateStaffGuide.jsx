import React from 'react';
import { ArrowLeft, CheckCircle, XCircle, UserCheck, Camera, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';

export default function GateStaffGuide() {
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
          <h1 className="text-2xl font-bold text-white">Gate Staff Guide</h1>
          <p className="text-blue-200 text-sm mt-1">Entry & Check-in Procedures</p>
        </div>
      </div>

      <div className="px-5 -mt-4 space-y-6">
        {/* Quick Start */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-blue-600" />
            Quick Start
          </h2>
          <ol className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="font-bold text-blue-600">1.</span>
              <span>Open the <strong>Gate Staff Login</strong> page on your device</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600">2.</span>
              <span>Keep the <strong>Gate Scan</strong> page open and ready</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600">3.</span>
              <span>Scan each person's QR code as they arrive</span>
            </li>
          </ol>
        </Card>

        {/* Entry Types */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Entry Types You'll See</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4 py-2">
              <h3 className="font-bold text-green-700">Active Members</h3>
              <p className="text-sm text-gray-600">Green badge with QR code on their membership pass</p>
              <p className="text-xs text-gray-500 mt-1">✓ Free entry, points awarded automatically</p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <h3 className="font-bold text-blue-700">Day Pass Holders</h3>
              <p className="text-sm text-gray-600">Digital pass with unique QR code</p>
              <p className="text-xs text-gray-500 mt-1">✓ Pre-paid online, verify photo if available</p>
            </div>

            <div className="border-l-4 border-amber-500 pl-4 py-2">
              <h3 className="font-bold text-amber-700">Walk-ups (No Pass)</h3>
              <p className="text-sm text-gray-600">Direct them to purchase at gate or online</p>
              <p className="text-xs text-gray-500 mt-1">→ Show them how to buy a Day Pass on their phone</p>
            </div>
          </div>
        </Card>

        {/* Step-by-Step Process */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Camera className="w-6 h-6 text-blue-600" />
            Scanning Process
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-bold mb-2">Step 1: Position the QR Code</h3>
              <p className="text-sm text-gray-600 mb-2">Ask the person to hold their phone steady with QR code visible</p>
              <div className="bg-gray-100 rounded-lg p-3 text-xs text-gray-700">
                <strong>Tip:</strong> QR code should fill at least 1/3 of your camera view
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-2">Step 2: Scan & Verify</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-700">Valid Entry ✓</p>
                    <p className="text-xs text-gray-600">Screen turns green with member/pass holder name</p>
                    <p className="text-xs text-gray-500 mt-1">→ Wave them through</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-700">Invalid Entry ✗</p>
                    <p className="text-xs text-gray-600">Screen turns red with error message</p>
                    <p className="text-xs text-gray-500 mt-1">→ Check the troubleshooting guide below</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-2">Step 3: Award Points (Members Only)</h3>
              <p className="text-sm text-gray-600">Points are added automatically when a member checks in</p>
              <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-900 mt-2">
                <strong>Note:</strong> Day pass holders don't earn points (unless they upgrade to membership)
              </div>
            </div>
          </div>
        </Card>

        {/* Common Issues */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            Common Issues
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-red-700">❌ "Pass Already Used"</h3>
              <p className="text-sm text-gray-700 mt-1">Day pass has already been scanned today</p>
              <p className="text-xs text-gray-500 mt-1 pl-4">→ Politely explain passes are single-use per event</p>
            </div>

            <div>
              <h3 className="font-bold text-red-700">❌ "Membership Expired"</h3>
              <p className="text-sm text-gray-700 mt-1">Member's annual subscription has lapsed</p>
              <p className="text-xs text-gray-500 mt-1 pl-4">→ Direct them to renew membership or purchase day pass</p>
            </div>

            <div>
              <h3 className="font-bold text-red-700">❌ QR Code Won't Scan</h3>
              <p className="text-sm text-gray-700 mt-1">Code is blurry, damaged, or screen brightness too low</p>
              <p className="text-xs text-gray-500 mt-1 pl-4">→ Ask them to increase brightness and hold steady</p>
              <p className="text-xs text-gray-500 pl-4">→ Try having them refresh the QR code on their device</p>
            </div>

            <div>
              <h3 className="font-bold text-amber-700">⚠️ No QR Code</h3>
              <p className="text-sm text-gray-700 mt-1">Person doesn't have a membership or day pass</p>
              <p className="text-xs text-gray-500 mt-1 pl-4">→ Help them purchase a day pass on their phone</p>
              <p className="text-xs text-gray-500 pl-4">→ Show them the QR code at gate or club entrance</p>
            </div>
          </div>
        </Card>

        {/* Best Practices */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Best Practices</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Keep your device charged and brightness at maximum for scanning</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Be friendly and patient - some people are new to digital passes</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Have a backup plan: note names manually if system is down</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Encourage people to have their QR ready before reaching the gate</span>
            </li>
          </ul>
        </Card>

        {/* Emergency Contact */}
        <Card className="p-6 bg-red-50 border-red-200">
          <h2 className="text-xl font-bold mb-2 text-red-900">Need Help?</h2>
          <p className="text-sm text-red-800">If you encounter persistent issues, contact the club administrator immediately</p>
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