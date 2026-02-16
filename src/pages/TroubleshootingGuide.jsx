import React, { useState } from 'react';
import { ArrowLeft, AlertTriangle, Smartphone, Wifi, Battery, Camera, QrCode, CreditCard, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TroubleshootingGuide() {
  const [activeTab, setActiveTab] = useState('gate');

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
          <h1 className="text-2xl font-bold text-white">Troubleshooting Guide</h1>
          <p className="text-blue-200 text-sm mt-1">Quick fixes for common issues</p>
        </div>
      </div>

      <div className="px-5 -mt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="gate">Gate</TabsTrigger>
            <TabsTrigger value="canteen">Canteen</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
          </TabsList>

          {/* Gate Issues */}
          <TabsContent value="gate" className="space-y-4">
            <Card className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <QrCode className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-red-700">QR Code Won't Scan</h3>
                  <div className="mt-2 space-y-2 text-sm text-gray-700">
                    <p><strong>Cause:</strong> Poor lighting, damaged code, or low screen brightness</p>
                    <div className="bg-blue-50 rounded p-3 text-xs space-y-1">
                      <p><strong>Solutions:</strong></p>
                      <ul className="list-disc ml-4 space-y-1">
                        <li>Ask person to increase phone brightness to maximum</li>
                        <li>Have them refresh the app (close and reopen)</li>
                        <li>Move to better lighting if outdoors at night</li>
                        <li>Clean your device camera lens</li>
                        <li>Try holding device closer/further from code</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-amber-700">"Pass Already Used"</h3>
                  <div className="mt-2 space-y-2 text-sm text-gray-700">
                    <p><strong>Cause:</strong> Day pass has already been scanned for this event</p>
                    <div className="bg-amber-50 rounded p-3 text-xs space-y-1">
                      <p><strong>Solutions:</strong></p>
                      <ul className="list-disc ml-4 space-y-1">
                        <li>Check if this is a duplicate entry attempt (person already came in)</li>
                        <li>Verify the pass is for TODAY'S game (not an old pass)</li>
                        <li>If legitimate issue, contact admin to manually verify and override</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <CreditCard className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-red-700">"Membership Expired"</h3>
                  <div className="mt-2 space-y-2 text-sm text-gray-700">
                    <p><strong>Cause:</strong> Annual membership has lapsed</p>
                    <div className="bg-red-50 rounded p-3 text-xs space-y-1">
                      <p><strong>Solutions:</strong></p>
                      <ul className="list-disc ml-4 space-y-1">
                        <li>Politely inform them their membership needs renewal</li>
                        <li>Direct them to renew in the app (Membership tab)</li>
                        <li>Offer option to purchase a day pass for today</li>
                        <li>Club office can assist with immediate renewal if open</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <Users className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-blue-700">Person Has No Pass</h3>
                  <div className="mt-2 space-y-2 text-sm text-gray-700">
                    <p><strong>Cause:</strong> Not a member and hasn't purchased day pass</p>
                    <div className="bg-blue-50 rounded p-3 text-xs space-y-1">
                      <p><strong>Solutions:</strong></p>
                      <ul className="list-disc ml-4 space-y-1">
                        <li>Help them purchase day pass on their phone (show QR at gate)</li>
                        <li>Direct to gate cashier if cash payment preferred</li>
                        <li>Explain membership benefits if they're interested</li>
                        <li>Have promotional material ready to hand out</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Canteen Issues */}
          <TabsContent value="canteen" className="space-y-4">
            <Card className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <QrCode className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-red-700">Can't Scan Member QR</h3>
                  <div className="mt-2 space-y-2 text-sm text-gray-700">
                    <p><strong>Cause:</strong> Scanner not reading member's QR code</p>
                    <div className="bg-blue-50 rounded p-3 text-xs space-y-1">
                      <p><strong>Solutions:</strong></p>
                      <ul className="list-disc ml-4 space-y-1">
                        <li>Check your device camera is working properly</li>
                        <li>Ask member to increase brightness and hold steady</li>
                        <li>Have member refresh app (close and reopen)</li>
                        <li>If persistent: process at full price and note for admin to credit points later</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-amber-700">Discount Not Applying</h3>
                  <div className="mt-2 space-y-2 text-sm text-gray-700">
                    <p><strong>Cause:</strong> Scan successful but discount doesn't show</p>
                    <div className="bg-amber-50 rounded p-3 text-xs space-y-1">
                      <p><strong>Solutions:</strong></p>
                      <ul className="list-disc ml-4 space-y-1">
                        <li>Verify member has active (not expired) membership</li>
                        <li>Check if location discount is configured for this area</li>
                        <li>Manually calculate and apply standard discount</li>
                        <li>Note the issue and contact admin if recurring</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <CreditCard className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-blue-700">Transaction Failed to Record</h3>
                  <div className="mt-2 space-y-2 text-sm text-gray-700">
                    <p><strong>Cause:</strong> Network issue or system error</p>
                    <div className="bg-blue-50 rounded p-3 text-xs space-y-1">
                      <p><strong>Solutions:</strong></p>
                      <ul className="list-disc ml-4 space-y-1">
                        <li>Check your internet connection</li>
                        <li>Try submitting the transaction again</li>
                        <li>If still failing: note purchase details manually</li>
                        <li>Give member benefit of doubt - apply discount anyway</li>
                        <li>Report to admin to add transaction and points manually</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <Users className="w-6 h-6 text-purple-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-purple-700">Member Forgot Phone</h3>
                  <div className="mt-2 space-y-2 text-sm text-gray-700">
                    <p><strong>Cause:</strong> Member has no way to show QR code</p>
                    <div className="bg-purple-50 rounded p-3 text-xs space-y-1">
                      <p><strong>Solutions:</strong></p>
                      <ul className="list-disc ml-4 space-y-1">
                        <li>Process at full (non-member) price for this purchase</li>
                        <li>Suggest they bring phone next time for discount</li>
                        <li>If they know their membership number, admin can verify and credit points later</li>
                        <li>Be friendly - mistakes happen!</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Technical Issues */}
          <TabsContent value="technical" className="space-y-4">
            <Card className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <Wifi className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-red-700">No Internet Connection</h3>
                  <div className="mt-2 space-y-2 text-sm text-gray-700">
                    <p><strong>Cause:</strong> Wi-Fi down or mobile data not working</p>
                    <div className="bg-red-50 rounded p-3 text-xs space-y-1">
                      <p><strong>Solutions:</strong></p>
                      <ul className="list-disc ml-4 space-y-1">
                        <li>Check if Wi-Fi is connected and working</li>
                        <li>Try switching to mobile data if available</li>
                        <li>Restart your device</li>
                        <li>Check other devices - is it just yours or venue-wide?</li>
                        <li><strong>Fallback:</strong> Note entries/transactions manually on paper</li>
                        <li>Contact venue manager about Wi-Fi issue</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <Battery className="w-6 h-6 text-amber-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-amber-700">Device Battery Low/Dead</h3>
                  <div className="mt-2 space-y-2 text-sm text-gray-700">
                    <p><strong>Cause:</strong> Staff device running out of power</p>
                    <div className="bg-amber-50 rounded p-3 text-xs space-y-1">
                      <p><strong>Solutions:</strong></p>
                      <ul className="list-disc ml-4 space-y-1">
                        <li>Always keep charger and power bank available at station</li>
                        <li>Have backup device charged and ready</li>
                        <li>Rotate devices if multiple staff on duty</li>
                        <li><strong>Emergency:</strong> Use paper system until device charged</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <Smartphone className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-blue-700">App Frozen/Not Responding</h3>
                  <div className="mt-2 space-y-2 text-sm text-gray-700">
                    <p><strong>Cause:</strong> Software glitch or memory issue</p>
                    <div className="bg-blue-50 rounded p-3 text-xs space-y-1">
                      <p><strong>Solutions:</strong></p>
                      <ul className="list-disc ml-4 space-y-1">
                        <li><strong>Step 1:</strong> Force close app and reopen</li>
                        <li><strong>Step 2:</strong> Clear app from recent apps and restart</li>
                        <li><strong>Step 3:</strong> Restart your device</li>
                        <li><strong>Step 4:</strong> Clear browser cache if using web app</li>
                        <li>If recurring: report to admin - may need app update</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <Camera className="w-6 h-6 text-purple-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-purple-700">Camera Not Working</h3>
                  <div className="mt-2 space-y-2 text-sm text-gray-700">
                    <p><strong>Cause:</strong> App doesn't have camera permission or hardware issue</p>
                    <div className="bg-purple-50 rounded p-3 text-xs space-y-1">
                      <p><strong>Solutions:</strong></p>
                      <ul className="list-disc ml-4 space-y-1">
                        <li>Check device settings - ensure app has camera permission</li>
                        <li>Close other apps that might be using camera</li>
                        <li>Restart the app</li>
                        <li>Test camera in default camera app - if broken, use backup device</li>
                        <li>Clean camera lens</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-red-700">System-Wide Outage</h3>
                  <div className="mt-2 space-y-2 text-sm text-gray-700">
                    <p><strong>Cause:</strong> Server down or major technical failure</p>
                    <div className="bg-red-50 rounded p-3 text-xs space-y-1">
                      <p><strong>Emergency Procedures:</strong></p>
                      <ul className="list-disc ml-4 space-y-1">
                        <li><strong>Gate:</strong> Switch to paper ticketing/manual entry log</li>
                        <li><strong>Canteen:</strong> Process all sales at full price, note member names</li>
                        <li>Immediately notify club administrator</li>
                        <li>Post sign: "System temporarily down - bear with us"</li>
                        <li>Admin will credit points/discounts after system restored</li>
                        <li>Stay calm and professional with customers</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Emergency Protocol */}
        <Card className="p-6 bg-red-50 border-2 border-red-300 mt-6">
          <h2 className="text-xl font-bold mb-3 text-red-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            When All Else Fails
          </h2>
          <div className="space-y-3 text-sm text-red-900">
            <div className="bg-white rounded p-3">
              <p className="font-bold mb-1">1. STAY CALM</p>
              <p className="text-xs text-gray-700">Don't panic or frustrate customers - technical issues happen</p>
            </div>
            <div className="bg-white rounded p-3">
              <p className="font-bold mb-1">2. GO MANUAL</p>
              <p className="text-xs text-gray-700">Paper and pen - write down names, amounts, transaction details</p>
            </div>
            <div className="bg-white rounded p-3">
              <p className="font-bold mb-1">3. NOTIFY ADMIN</p>
              <p className="text-xs text-gray-700">Contact club administrator immediately via phone/text</p>
            </div>
            <div className="bg-white rounded p-3">
              <p className="font-bold mb-1">4. BE GENEROUS</p>
              <p className="text-xs text-gray-700">If in doubt, give benefit to the customer - better than bad experience</p>
            </div>
            <div className="bg-white rounded p-3">
              <p className="font-bold mb-1">5. RECONCILE LATER</p>
              <p className="text-xs text-gray-700">Admin can manually add points/transactions after issue resolved</p>
            </div>
          </div>
        </Card>

        {/* Quick Contact */}
        <Card className="p-6 mt-6">
          <h2 className="text-xl font-bold mb-3">Need More Help?</h2>
          <p className="text-sm text-gray-700 mb-3">Contact club administrator for:</p>
          <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc">
            <li>Recurring technical issues</li>
            <li>System-wide problems</li>
            <li>Manual transaction adjustments</li>
            <li>Training or clarification on procedures</li>
          </ul>
          <div className="mt-4 pt-4 border-t">
            <Link to={createPageUrl('GateStaffGuide')}>
              <button className="text-blue-600 text-sm underline mr-4">Gate Staff Guide</button>
            </Link>
            <Link to={createPageUrl('CanteenStaffGuide')}>
              <button className="text-blue-600 text-sm underline">Canteen Staff Guide</button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}