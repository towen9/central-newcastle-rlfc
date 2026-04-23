import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { ShoppingBag, CheckCircle, XCircle, Scan, LogOut, LayoutDashboard, Tag, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import jsQR from 'jsqr';

export default function MerchandiseScan() {
  const [user, setUser] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [member, setMember] = useState(null);
  const [result, setResult] = useState(null);
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const scanningRef = useRef(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        if (!userData || (userData.role !== 'admin' && userData.role !== 'canteen_staff')) {
          window.location.href = '/CanteenStaffLogin';
          return;
        }
        setUser(userData);
      } catch {
        window.location.href = '/CanteenStaffLogin';
      }
    };
    loadUser();
  }, []);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setVideoStream(stream);
      scanningRef.current = true;
      setScanning(true);
      setResult(null);
      setMember(null);
      setPurchaseAmount('');
      const video = document.getElementById('merchScanVideo');
      video.srcObject = stream;
      video.play();
      scanQRCode(video);
    } catch {
      alert('Camera access denied');
    }
  };

  const stopScanning = () => {
    scanningRef.current = false;
    if (videoStream) {
      videoStream.getTracks().forEach(t => t.stop());
      setVideoStream(null);
    }
    setScanning(false);
  };

  const scanQRCode = (video) => {
    const canvas = document.getElementById('merchScanCanvas');
    const ctx = canvas.getContext('2d');
    const scan = () => {
      if (!scanningRef.current) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) { processScan(code.data); return; }
      }
      requestAnimationFrame(scan);
    };
    scan();
  };

  const processScan = async (qrData) => {
    stopScanning();
    try {
      const memberships = await base44.entities.Membership.filter({ qr_code_id: qrData, status: 'active' });
      if (!memberships || memberships.length === 0) {
        setResult({ success: false, message: 'Invalid or inactive membership' });
        return;
      }
      const m = memberships[0];

      // Load tier to get discount %
      const tiers = await base44.entities.MembershipTier.filter({ name: m.tier_name });
      const tier = tiers[0] || null;
      const discountPct = tier?.merchandise_discount || 0;

      // Check if discount already used this season (look for merch transactions with a discount)
      const membershipStart = m.start_date ? new Date(m.start_date) : new Date(new Date().getFullYear(), 0, 1);
      const allTransactions = await base44.entities.Transaction.filter({
        membership_id: m.id,
        transaction_type: 'merchandise'
      });
      const discountUsed = allTransactions.some(t =>
        t.discount_amount > 0 && new Date(t.timestamp) >= membershipStart
      );

      setMember({ ...m, discountPct, discountUsed });
    } catch (err) {
      setResult({ success: false, message: 'Error loading membership: ' + err.message });
    }
  };

  const handleProcessPurchase = async (applyDiscount) => {
    if (!purchaseAmount || isNaN(parseFloat(purchaseAmount)) || parseFloat(purchaseAmount) <= 0) {
      alert('Please enter a valid purchase amount');
      return;
    }
    if (applyDiscount && member.discountUsed) {
      alert('Discount already used this season');
      return;
    }
    setProcessing(true);
    try {
      const original = parseFloat(parseFloat(purchaseAmount).toFixed(2));
      const discountAmt = applyDiscount ? parseFloat((original * member.discountPct / 100).toFixed(2)) : 0;
      const finalAmt = parseFloat((original - discountAmt).toFixed(2));

      // Points: 1 point per dollar spent (final amount)
      const pointsEarned = Math.floor(finalAmt);

      await base44.entities.Transaction.create({
        user_id: member.user_id,
        membership_id: member.id,
        member_name: member.user_name,
        location: 'Merchandise',
        item_description: 'Merchandise purchase',
        original_amount: original,
        discount_amount: discountAmt,
        final_amount: finalAmt,
        discount_reason: applyDiscount ? `${member.discountPct}% member discount` : '',
        transaction_type: 'merchandise',
        timestamp: new Date().toISOString(),
        hour_of_day: new Date().getHours(),
        day_of_week: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()]
      });

      // Award points
      if (pointsEarned > 0) {
        await base44.entities.Membership.update(member.id, {
          points: (member.points || 0) + pointsEarned
        });
        await base44.entities.PointsTransaction.create({
          user_id: member.user_id,
          membership_id: member.id,
          points: pointsEarned,
          transaction_type: 'bar_purchase',
          description: `Merchandise purchase ($${finalAmt})`,
          location: 'Merchandise',
          timestamp: new Date().toISOString()
        });
      }

      setResult({
        success: true,
        memberName: member.user_name,
        original,
        discountAmt,
        finalAmt,
        pointsEarned,
        newBalance: (member.points || 0) + pointsEarned,
        discountApplied: applyDiscount
      });
      setMember(null);
      setPurchaseAmount('');
    } catch (err) {
      setResult({ success: false, message: 'Error processing purchase: ' + err.message });
    } finally {
      setProcessing(false);
    }
  };

  if (!user) return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-10 h-10 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold">Merch Scanner</h1>
              <p className="text-gray-400 text-sm">Season discount + points</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => window.location.href = '/AdminDashboard'} variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <LayoutDashboard className="w-4 h-4 mr-1" /> Dashboard
            </Button>
            <Button onClick={() => base44.auth.logout('/CanteenStaffLogin')} variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Start scan */}
        {!scanning && !member && !result && (
          <Button onClick={startScanning} className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-lg">
            <Scan className="w-6 h-6 mr-2" />
            Scan Member QR
          </Button>
        )}

        {/* Camera */}
        {scanning && (
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video id="merchScanVideo" className="w-full" />
              <div className="absolute inset-0 border-4 border-blue-400 opacity-50 pointer-events-none" />
            </div>
            <canvas id="merchScanCanvas" className="hidden" />
            <Button onClick={stopScanning} variant="outline" className="w-full text-white border-white/30">Cancel</Button>
          </div>
        )}

        {/* Member loaded — enter purchase amount */}
        {member && !result && (
          <div className="space-y-4">
            {/* Member info */}
            <div className="bg-gray-800 rounded-xl p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Member</p>
              <p className="text-xl font-bold">{member.user_name}</p>
              <p className="text-sm text-gray-400">{member.tier_name}</p>
            </div>

            {/* Discount status */}
            {member.discountPct > 0 ? (
              member.discountUsed ? (
                <div className="bg-orange-900/50 border border-orange-600 rounded-xl p-4 flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-orange-400 shrink-0" />
                  <div>
                    <p className="font-semibold text-orange-300">{member.discountPct}% discount already used</p>
                    <p className="text-orange-400 text-sm">Full price applies this season</p>
                  </div>
                </div>
              ) : (
                <div className="bg-green-900/50 border border-green-600 rounded-xl p-4 flex items-center gap-3">
                  <Tag className="w-6 h-6 text-green-400 shrink-0" />
                  <div>
                    <p className="font-semibold text-green-300">{member.discountPct}% discount available!</p>
                    <p className="text-green-400 text-sm">1 use per season — not yet redeemed</p>
                  </div>
                </div>
              )
            ) : (
              <div className="bg-gray-700 rounded-xl p-4">
                <p className="text-gray-400 text-sm">No merchandise discount on this tier</p>
              </div>
            )}

            {/* Purchase amount */}
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Purchase Amount ($)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={purchaseAmount}
                onChange={e => setPurchaseAmount(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white text-xl h-14"
              />
            </div>

            {/* Preview */}
            {purchaseAmount && !isNaN(parseFloat(purchaseAmount)) && parseFloat(purchaseAmount) > 0 && (
              <div className="bg-gray-800 rounded-xl p-4 space-y-1 text-sm">
                <div className="flex justify-between text-gray-400"><span>Original</span><span>${parseFloat(purchaseAmount).toFixed(2)}</span></div>
                {member.discountPct > 0 && !member.discountUsed && (
                  <div className="flex justify-between text-green-400"><span>Discount ({member.discountPct}%)</span><span>-${(parseFloat(purchaseAmount) * member.discountPct / 100).toFixed(2)}</span></div>
                )}
                <div className="flex justify-between font-bold text-white border-t border-gray-700 pt-2 mt-2">
                  <span>Points earned</span>
                  <span>+{Math.floor((member.discountPct > 0 && !member.discountUsed ? parseFloat(purchaseAmount) * (1 - member.discountPct / 100) : parseFloat(purchaseAmount)))} pts</span>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2">
              {member.discountPct > 0 && !member.discountUsed && (
                <Button
                  onClick={() => handleProcessPurchase(true)}
                  disabled={processing || !purchaseAmount}
                  className="w-full h-12 bg-green-600 hover:bg-green-700"
                >
                  <Tag className="w-4 h-4 mr-2" />
                  Apply {member.discountPct}% Discount + Record
                </Button>
              )}
              <Button
                onClick={() => handleProcessPurchase(false)}
                disabled={processing || !purchaseAmount}
                variant={member.discountPct > 0 && !member.discountUsed ? 'outline' : 'default'}
                className={`w-full h-12 ${member.discountPct > 0 && !member.discountUsed ? 'text-white border-white/30' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                Full Price + Record
              </Button>
              <Button onClick={() => setMember(null)} variant="ghost" className="w-full text-gray-400">Cancel</Button>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`p-6 rounded-xl ${result.success ? 'bg-green-900' : 'bg-red-900'}`}>
            {result.success ? (
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            ) : (
              <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            )}
            <h2 className="text-xl font-bold text-center mb-4">{result.success ? 'Purchase Recorded!' : result.message}</h2>
            {result.success && (
              <div className="space-y-2 text-center">
                <p className="text-lg font-semibold">{result.memberName}</p>
                {result.discountApplied && (
                  <p className="text-green-400">Discount applied: -${result.discountAmt.toFixed(2)}</p>
                )}
                <p className="text-white">Final: <span className="font-bold">${result.finalAmt.toFixed(2)}</span></p>
                {result.pointsEarned > 0 && (
                  <p className="text-2xl font-bold text-blue-400 mt-2">+{result.pointsEarned} points earned</p>
                )}
                <p className="text-gray-400 text-sm">Balance: {result.newBalance} pts</p>
              </div>
            )}
            <Button
              onClick={() => { setResult(null); startScanning(); }}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
            >
              Scan Next Member
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}