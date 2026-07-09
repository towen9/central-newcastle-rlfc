import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { ShoppingBag, Camera, LogOut, LayoutDashboard, Tag, AlertTriangle, Ban } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import jsQR from 'jsqr';
import clubConfig from '@/config/club.config';
import { UtilityCard, UtilityButton, StatusBanner, UtilityHeader } from '@/components/ui-kit';

const t = clubConfig.theme;

export default function MerchandiseScan() {
  const [user, setUser] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [member, setMember] = useState(null);
  const [result, setResult] = useState(null);
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const isProcessingRef = useRef(false);
  const pendingStreamRef = useRef(null);
  const startScanningRef = useRef(null);

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
  }, []);

  useEffect(() => { return () => stopScanning(); }, []);

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (pendingStreamRef.current) {
      pendingStreamRef.current.getTracks().forEach(track => track.stop());
      pendingStreamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setScanning(false);
  };

  const scanQRCode = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code && !isProcessingRef.current) {
        isProcessingRef.current = true;
        handleQRScanned(code.data);
        return;
      }
    }
    animationRef.current = requestAnimationFrame(scanQRCode);
  };

  // FIX: attach stream only after scanning=true has rendered the video element
  useEffect(() => {
    if (scanning && pendingStreamRef.current && videoRef.current) {
      const video = videoRef.current;
      const stream = pendingStreamRef.current;
      streamRef.current = stream;
      pendingStreamRef.current = null;
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play();
        scanQRCode();
      };
    }
  }, [scanning]);

  const startScanning = async () => {
    isProcessingRef.current = false;
    setResult(null);
    setMember(null);
    setPurchaseAmount('');
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      pendingStreamRef.current = stream;
      setScanning(true);
    } catch (error) {
      toast.error('Camera access denied. Use Safari on iPhone.');
    }
  };

  startScanningRef.current = startScanning;

  const handleQRScanned = async (qrData) => {
    stopScanning();
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
    <div className="flex flex-col items-center justify-center" style={{ minHeight: '100dvh', background: t.bg0 }}>
      <ShoppingBag className="w-12 h-12 mb-3 animate-pulse" style={{ color: t.gold }} />
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, fontFamily: t.fontBody }}>Loading...</p>
    </div>
  );

  if (result?.success) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center z-50 px-6" style={{ background: t.bg0 }}>
        <div className="w-full max-w-sm space-y-5">
          <StatusBanner variant="valid" title="Purchase Recorded!" subtitle={result.memberName} />
          <div className="w-full space-y-2">
            <p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{result.tierName}</p>
            <div className="flex justify-between text-white"><span>Original</span><span>${result.original?.toFixed(2)}</span></div>
            {result.discountPct > 0 && (
              <div className="flex justify-between" style={{ color: t.green }}><span>Discount ({result.discountPct}%)</span><span>-${result.discountAmt?.toFixed(2)}</span></div>
            )}
            <div className="flex justify-between text-white font-bold border-t pt-2" style={{ borderColor: 'rgba(255,255,255,0.2)' }}><span>Final</span><span>${result.finalAmt?.toFixed(2)}</span></div>
            {result.pointsEarned > 0 && <p className="text-2xl font-bold text-center pt-2" style={{ color: t.cyan }}>+{result.pointsEarned} pts earned</p>}
            <p className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.5)' }}>Balance: {result.newBalance} pts</p>
          </div>
          <UtilityButton variant="primary" onClick={() => startScanningRef.current?.()}>Scan Next Member</UtilityButton>
          <UtilityButton variant="secondary" onClick={() => window.location.href = '/AdminDashboard'}>Back to Dashboard</UtilityButton>
        </div>
      </div>
    );
  }

  if (result && !result.success) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center z-50 px-6" style={{ background: t.bg0 }}>
        <div className="w-full max-w-sm space-y-5">
          <StatusBanner variant={result.blocked ? 'warning' : 'invalid'} title={result.blocked ? 'No Discount' : 'Scan Failed'} />
          {result.memberName && <p className="text-white text-lg font-semibold text-center">{result.memberName}</p>}
          {result.tierName && <p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{result.tierName}</p>}
          <p className="text-center text-base" style={{ color: 'rgba(255,255,255,0.7)' }}>{result.message}</p>
          <UtilityButton variant="primary" onClick={() => startScanningRef.current?.()}>Try Again</UtilityButton>
          <UtilityButton variant="secondary" onClick={() => window.location.href = '/AdminDashboard'}>Back to Dashboard</UtilityButton>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: t.bg0, fontFamily: t.fontBody }}>
      <UtilityHeader
        title="Merch Scanner"
        right={
          <>
            <button onClick={() => window.location.href = '/AdminDashboard'} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white" style={{ background: t.navy, minHeight: 48 }}>
              <LayoutDashboard className="w-4 h-4" />Dashboard
            </button>
            <button onClick={() => base44.auth.logout()} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white" style={{ background: t.navy, minHeight: 48 }}>
              <LogOut className="w-4 h-4" />Logout
            </button>
          </>
        }
      />

      <div className="px-5 py-6 space-y-4">
        <p className="text-sm" style={{ color: t.gold, fontWeight: 600 }}>Premium & Old Butchers only</p>

        {/* Camera — always in DOM, feed stays full-contrast and unobstructed */}
        <UtilityCard style={{ padding: 0, overflow: 'hidden' }}>
          <div className="relative aspect-square bg-black">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            {!scanning && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#000' }}>
                <Camera className="w-16 h-16" style={{ color: 'rgba(255,255,255,0.3)' }} />
              </div>
            )}
          </div>
        </UtilityCard>

        {!scanning && !member && (
          <>
            <UtilityButton variant="primary" onClick={startScanning}>
              <Camera className="w-6 h-6" />Scan Member QR Code
            </UtilityButton>
            <UtilityCard>
              <p className="font-bold mb-1" style={{ color: t.green }}>✅ Merch discounts:</p>
              <div className="space-y-1 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                <p>• Premium / Old Butchers / Sponsor — <strong style={{ color: '#fff' }}>20% first order</strong>, then 10%</p>
                <p>• Supporter Pack / Family — <strong style={{ color: '#fff' }}>10% always</strong></p>
                <p className="mt-2 font-medium" style={{ color: '#F59E0B' }}>⚠️ 20% is one-use per season — backend enforced</p>
                <p className="mt-1" style={{ color: t.cyan }}>Day Pass — no discount</p>
              </div>
            </UtilityCard>
          </>
        )}

        {scanning && (
          <div className="text-center py-4">
            <p className="animate-pulse text-base" style={{ color: 'rgba(255,255,255,0.6)' }}>Scanning for QR code...</p>
            <div className="mt-4">
              <UtilityButton variant="secondary" onClick={stopScanning}>Cancel</UtilityButton>
            </div>
          </div>
        )}

        {member && !result && (
          <div className="space-y-4">
            <UtilityCard>
              <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Member</p>
              <p className="text-2xl font-bold text-white">{member.memberName}</p>
              <p className="text-sm mt-1" style={{ color: t.cyan }}>{member.tierName}</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{member.points} pts balance</p>
            </UtilityCard>
            {member.discountUsed ? (
              <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: '#7C2D12', border: '2px solid #F59E0B' }}>
                <AlertTriangle className="w-6 h-6 flex-shrink-0" style={{ color: '#F59E0B' }} />
                <div>
                  <p className="font-semibold" style={{ color: '#FBBF24' }}>Discount already used this season</p>
                  <p className="text-sm" style={{ color: '#FCD34D' }}>Full price applies — still earns points</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: '#14532D', border: `2px solid ${t.green}` }}>
                <Tag className="w-6 h-6 flex-shrink-0" style={{ color: t.green }} />
                <div>
                  <p className="font-semibold" style={{ color: t.green }}>{member.discountPct}% discount available!</p>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>1 use per season — not yet redeemed ✅</p>
                </div>
              </div>
            )}
            <div>
              <label className="text-sm mb-2 block" style={{ color: 'rgba(255,255,255,0.6)' }}>Purchase Amount ($)</label>
              <Input type="number" min="0" step="0.01" placeholder="0.00" value={purchaseAmount} onChange={e => setPurchaseAmount(e.target.value)} className="text-2xl h-14 text-center" />
            </div>
            {purchaseAmount && !isNaN(parseFloat(purchaseAmount)) && parseFloat(purchaseAmount) > 0 && (
              <UtilityCard>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between" style={{ color: 'rgba(255,255,255,0.6)' }}><span>Original</span><span>${parseFloat(purchaseAmount).toFixed(2)}</span></div>
                  {!member.discountUsed && <div className="flex justify-between" style={{ color: t.green }}><span>Discount ({member.discountPct}%)</span><span>-${(parseFloat(purchaseAmount) * member.discountPct / 100).toFixed(2)}</span></div>}
                  <div className="flex justify-between text-white font-bold border-t pt-2" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                    <span>Final</span>
                    <span>${(member.discountUsed ? parseFloat(purchaseAmount) : parseFloat(purchaseAmount) * (1 - member.discountPct / 100)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between" style={{ color: t.cyan }}>
                    <span>Points earned</span>
                    <span>+{Math.floor(member.discountUsed ? parseFloat(purchaseAmount) : parseFloat(purchaseAmount) * (1 - member.discountPct / 100))} pts</span>
                  </div>
                </div>
              </UtilityCard>
            )}
            <div className="space-y-3 pb-10">
              {!member.discountUsed && (
                <UtilityButton variant="primary" onClick={() => handleProcessPurchase(true)} disabled={processing || !purchaseAmount}>
                  <Tag className="w-5 h-5" /> Apply {member.discountPct}% Discount & Record
                </UtilityButton>
              )}
              <UtilityButton variant="secondary" onClick={() => handleProcessPurchase(false)} disabled={processing || !purchaseAmount}>
                Full Price & Record
              </UtilityButton>
              <UtilityButton variant="secondary" onClick={() => { setMember(null); startScanningRef.current?.(); }}>
                Cancel — Scan Again
              </UtilityButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}