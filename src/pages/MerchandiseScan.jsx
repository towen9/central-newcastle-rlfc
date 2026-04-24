import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { ShoppingBag, CheckCircle, XCircle, Scan, LogOut, LayoutDashboard, Tag, AlertTriangle, Ban } from 'lucide-react';
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
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animRef = useRef(null);
  const canvasRef = useRef(null);
  const isProcessingRef = useRef(false);
  const scanLoopRef = useRef(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        if (!userData) {
          await base44.auth.redirectToLogin();
          return;
        }
        setUser(userData);
      } catch {
        await base44.auth.redirectToLogin();
      }
    };
    loadUser();
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    setScanning(false);
  };

  const startScanning = async () => {
    isProcessingRef.current = false;
    setResult(null);
    setMember(null);
    setPurchaseAmount('');
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setScanning(true);
      // Wait for the video element to be in the DOM after setScanning(true)
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', '');
          videoRef.current.setAttribute('autoplay', '');
          videoRef.current.muted = true;
          videoRef.current.play().then(() => {
            requestAnimationFrame(scanLoopRef.current);
          }).catch(() => {
            requestAnimationFrame(scanLoopRef.current);
          });
        }
      }, 100);
    } catch {
      alert('Camera access denied. Use Safari on iPhone.');
    }
  };

  const scanLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || isProcessingRef.current) return;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) {
        isProcessingRef.current = true;
        handleQRScanned(code.data);
        return;
      }
    }
    animRef.current = requestAnimationFrame(scanLoopRef.current);
  };
  scanLoopRef.current = scanLoop;

  const handleQRScanned = async (qrData) => {
    stopCamera();
    try {
      let qrCode;
      try { const p = JSON.parse(qrData); qrCode = p.id; } catch { qrCode = qrData.replace('membership:', '').trim(); }
      const res = await base44.functions.invoke('processMerchScan', { qrCode });
      const data = res.data;
      if (data.type === 'member_found') {
        setMember(data);
      } else if (data.type === 'no_discount') {
        setResult({ success: false, blocked: true, memberName: data.memberName, tierName: data.tierName, message: data.message });
      } else {
        setResult({ success: false, message: data.message || 'Membership not found' });
      }
    } catch (err) {
      setResult({ success: false, message: 'Scan failed: ' + err.message });
    }
  };

  const handleProcessPurchase = async (applyDiscount) => {
    if (!purchaseAmount || isNaN(parseFloat(purchaseAmount)) || parseFloat(purchaseAmount) <= 0) {
      alert('Please enter a valid purchase amount');
      return;
    }
    setProcessing(true);
    try {
      const res = await base44.functions.invoke('processMerchScan', {
        qrCode: member.memberId,
        purchaseAmount: parseFloat(purchaseAmount),
        applyDiscount
      });
      const data = res.data;
      if (data.type === 'success') {
        setResult({ success: true, ...data });
        setMember(null);
        setPurchaseAmount('');
      } else {
        setResult({ success: false, message: data.message });
        setMember(null);
      }
    } catch (err) {
      setResult({ success: false, message: 'Error: ' + err.message });
    } finally {
      setProcessing(false);
    }
  };

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <ShoppingBag className="w-8 h-8 animate-pulse text-blue-400" />
    </div>
  );

  if (result?.success) {
    return (
      <div className="fixed inset-0 bg-emerald-700 flex flex-col items-center justify-center z-50 px-6">
        <CheckCircle className="w-24 h-24 text-white mb-4" />
        <p className="text-white text-3xl font-extrabold mb-1">Purchase Recorded!</p>
        <p className="text-emerald-100 text-xl font-semibold mb-6">{result.memberName}</p>
        <div className="bg-white/10 rounded-2xl p-5 w-full max-w-xs space-y-2 text-center">
          <p className="text-emerald-100 text-sm">{result.tierName}</p>
          <div className="flex justify-between text-white"><span>Original</span><span>${result.original?.toFixed(2)}</span></div>
          {result.discountApplied && (
            <div className="flex justify-between text-emerald-200"><span>Discount ({result.discountPct}%)</span><span>-${result.discountAmt?.toFixed(2)}</span></div>
          )}
          <div className="flex justify-between text-white font-bold border-t border-white/20 pt-2"><span>Final</span><span>${result.finalAmt?.toFixed(2)}</span></div>
          {result.pointsEarned > 0 && <p className="text-2xl font-bold text-blue-200 pt-2">+{result.pointsEarned} pts earned</p>}
          <p className="text-emerald-200 text-sm">Balance: {result.newBalance} pts</p>
        </div>
        <Button onClick={startScanning} className="mt-8 w-full max-w-xs bg-white text-emerald-700 font-bold">Scan Next Member</Button>
        <Button onClick={() => window.location.href = '/AdminDashboard'} variant="ghost" className="mt-3 w-full max-w-xs text-white/70">Back to Dashboard</Button>
      </div>
    );
  }

  if (result && !result.success) {
    return (
      <div className={`fixed inset-0 flex flex-col items-center justify-center z-50 px-6 ${result.blocked ? 'bg-orange-700' : 'bg-red-700'}`}>
        {result.blocked ? <Ban className="w-24 h-24 text-white mb-4" /> : <XCircle className="w-24 h-24 text-white mb-4" />}
        <p className="text-white text-2xl font-extrabold mb-2 text-center">{result.blocked ? 'No Discount' : 'Scan Failed'}</p>
        {result.memberName && <p className="text-white text-lg font-semibold mb-1">{result.memberName}</p>}
        {result.tierName && <p className="text-white/70 text-sm mb-4">{result.tierName}</p>}
        <p className="text-white/80 text-center text-sm mb-8">{result.message}</p>
        <Button onClick={startScanning} className="w-full max-w-xs bg-white text-red-700 font-bold">Try Again</Button>
        <Button onClick={() => window.location.href = '/AdminDashboard'} variant="ghost" className="mt-3 w-full max-w-xs text-white/70">Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', overflowY: 'auto', background: '#111827' }}>
      <div className="bg-[#1a365d] px-5" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)', paddingBottom: '16px' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">Merch Scanner</h1>
              <p className="text-blue-200 text-xs">Premium & Old Butchers only</p>
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={() => window.location.href = '/AdminDashboard'} className="flex items-center gap-1 bg-white/20 text-white rounded-xl px-3 py-2 text-sm font-medium active:bg-white/30" style={{ minHeight: '44px' }}>
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <button onClick={() => base44.auth.logout()} className="flex items-center bg-white/10 text-white rounded-xl px-3 py-2 active:bg-white/30" style={{ minHeight: '44px', minWidth: '44px' }}>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-4 max-w-md mx-auto">
        {!scanning && !member && (
          <>
            <button onClick={startScanning} className="w-full h-16 bg-blue-600 active:bg-blue-800 text-white text-lg font-bold rounded-xl flex items-center justify-center gap-3">
              <Scan className="w-6 h-6" /> Scan Member QR Code
            </button>
            <div className="bg-gray-800 rounded-xl p-4 text-sm text-gray-400">
              <p className="font-semibold text-white mb-2">✅ Eligible for 20% discount:</p>
              <p>• Premium Membership</p>
              <p>• Old Butchers Membership</p>
              <p>• Sponsor Season Pass</p>
              <p className="mt-3 text-orange-400 font-medium">⚠️ One use per season per member</p>
              <p className="mt-1 text-gray-500">Supporter Pack & Day Pass — no discount</p>
            </div>
          </>
        )}

        {scanning && (
          <div className="space-y-4">
            <div className="relative bg-black rounded-2xl overflow-hidden" style={{ aspectRatio: '1' }}>
              <video ref={videoRef} className="w-full h-full object-cover" playsInline autoPlay muted />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-56 border-4 border-white rounded-2xl opacity-80" />
              </div>
              <p className="absolute bottom-4 left-0 right-0 text-center text-white text-sm animate-pulse">Hold QR code inside the box</p>
            </div>
            <button onClick={stopCamera} className="w-full h-12 border border-white/30 text-white rounded-xl font-medium active:bg-white/10">Cancel</button>
          </div>
        )}

        {member && !result && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-2xl p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Member</p>
              <p className="text-2xl font-bold text-white">{member.memberName}</p>
              <p className="text-blue-300 text-sm mt-1">{member.tierName}</p>
              <p className="text-gray-400 text-sm">{member.points} pts balance</p>
            </div>
            {member.discountUsed ? (
              <div className="bg-orange-900/60 border border-orange-600 rounded-xl p-4 flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-orange-400 shrink-0" />
                <div>
                  <p className="font-semibold text-orange-300">Discount already used this season</p>
                  <p className="text-orange-400 text-sm">Full price applies — still earns points</p>
                </div>
              </div>
            ) : (
              <div className="bg-green-900/60 border border-green-600 rounded-xl p-4 flex items-center gap-3">
                <Tag className="w-6 h-6 text-green-400 shrink-0" />
                <div>
                  <p className="font-semibold text-green-300">{member.discountPct}% discount available!</p>
                  <p className="text-green-400 text-sm">1 use per season — not yet redeemed ✅</p>
                </div>
              </div>
            )}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Purchase Amount ($)</label>
              <Input type="number" min="0" step="0.01" placeholder="0.00" value={purchaseAmount} onChange={e => setPurchaseAmount(e.target.value)} className="bg-gray-800 border-gray-600 text-white text-2xl h-14 text-center" />
            </div>
            {purchaseAmount && !isNaN(parseFloat(purchaseAmount)) && parseFloat(purchaseAmount) > 0 && (
              <div className="bg-gray-800 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-300"><span>Original</span><span>${parseFloat(purchaseAmount).toFixed(2)}</span></div>
                {!member.discountUsed && <div className="flex justify-between text-green-400"><span>Discount ({member.discountPct}%)</span><span>-${(parseFloat(purchaseAmount) * member.discountPct / 100).toFixed(2)}</span></div>}
                <div className="flex justify-between text-white font-bold border-t border-gray-600 pt-2">
                  <span>Final</span>
                  <span>${(member.discountUsed ? parseFloat(purchaseAmount) : parseFloat(purchaseAmount) * (1 - member.discountPct / 100)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-blue-400">
                  <span>Points earned</span>
                  <span>+{Math.floor(member.discountUsed ? parseFloat(purchaseAmount) : parseFloat(purchaseAmount) * (1 - member.discountPct / 100))} pts</span>
                </div>
              </div>
            )}
            <div className="space-y-3 pb-10">
              {!member.discountUsed && (
                <button onClick={() => handleProcessPurchase(true)} disabled={processing || !purchaseAmount} className="w-full h-14 bg-green-600 active:bg-green-800 disabled:opacity-50 text-white text-base font-bold rounded-xl flex items-center justify-center gap-2">
                  <Tag className="w-5 h-5" /> Apply {member.discountPct}% Discount & Record
                </button>
              )}
              <button onClick={() => handleProcessPurchase(false)} disabled={processing || !purchaseAmount} className="w-full h-12 border border-white/30 text-white rounded-xl font-medium disabled:opacity-50 active:bg-white/10">
                Full Price & Record
              </button>
              <button onClick={() => { setMember(null); startScanning(); }} className="w-full h-10 text-gray-500 text-sm">
                Cancel — Scan Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}