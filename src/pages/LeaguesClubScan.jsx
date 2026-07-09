import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Building2, Scan, LayoutDashboard } from 'lucide-react';
import jsQR from 'jsqr';
import clubConfig from '@/config/club.config';
import { UtilityCard, UtilityButton, StatusBanner, UtilityHeader } from '@/components/ui-kit';

const t = clubConfig.theme;

export default function LeaguesClubScan() {
  const [user, setUser] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const scanningRef = useRef(false);
  const pendingStreamRef = useRef(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      if (!userData || (userData.role !== 'admin' && userData.role !== 'leagues_staff')) {
        window.location.href = '/';
        return;
      }
      setUser(userData);
    };
    loadUser();
  }, []);

  useEffect(() => { return () => stopScanning(); }, []);

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
        scanningRef.current = true;
        scanQRCode();
      };
    }
  }, [scanning]);

  const stopScanning = () => {
    scanningRef.current = false;
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

    const scan = () => {
      if (!scanningRef.current) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          handleQRScanned(code.data);
          return;
        }
      }
      animationRef.current = requestAnimationFrame(scan);
    };
    scan();
  };

  const startScanning = async () => {
    setResult(null);
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
    } catch (err) {
      alert('Camera access denied. Use Safari on iPhone.');
    }
  };

  const handleQRScanned = async (qrData) => {
    stopScanning();
    try {
      const membership = await base44.entities.Membership.filter({ qr_code_id: qrData, status: 'active' });
      if (!membership || membership.length === 0) {
        setResult({ success: false, message: 'Invalid membership' });
        return;
      }
      const member = membership[0];

      // Check for duplicate scan today (AEST)
      const nowAEST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));
      const todayStart = new Date(nowAEST);
      todayStart.setHours(0, 0, 0, 0);

      const existingTransactions = await base44.entities.PointsTransaction.filter({
        membership_id: member.id,
        transaction_type: 'leagues_club'
      });
      const alreadyToday = existingTransactions.some(t => {
        if (!t.timestamp) return false;
        const tAEST = new Date(new Date(t.timestamp).toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));
        return tAEST >= todayStart;
      });

      if (alreadyToday) {
        setResult({ success: false, message: 'Already scanned at Leagues Club today' });
        return;
      }

      const pointsEarned = 10;
      await base44.entities.Membership.update(member.id, { points: (member.points || 0) + pointsEarned });
      await base44.entities.PointsTransaction.create({
        user_id: member.user_id,
        membership_id: member.id,
        points: pointsEarned,
        transaction_type: 'leagues_club',
        description: 'Leagues Club visit',
        location: 'Leagues Club',
        timestamp: new Date().toISOString()
      });

      setResult({
        success: true,
        message: `${pointsEarned} points awarded!`,
        memberName: member.user_name,
        newBalance: (member.points || 0) + pointsEarned
      });
    } catch (err) {
      setResult({ success: false, message: 'Error processing scan: ' + err.message });
    }
  };

  if (!user) return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: '100dvh', background: t.bg0 }}>
      <Building2 className="w-12 h-12 mb-3 animate-pulse" style={{ color: t.gold }} />
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, fontFamily: t.fontBody }}>Loading...</p>
    </div>
  );

  const isWarning = !result?.success && result?.message?.toLowerCase().includes('already');
  const bannerVariant = result?.success ? 'valid' : (isWarning ? 'warning' : 'invalid');

  return (
    <div style={{ minHeight: '100dvh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: t.bg0, fontFamily: t.fontBody }}>
      <UtilityHeader
        title="Leagues Club Scanner"
        right={
          <button onClick={() => window.location.href = '/AdminDashboard'} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white" style={{ background: t.navy, minHeight: 48 }}>
            <LayoutDashboard className="w-4 h-4" />Dashboard
          </button>
        }
      />

      <div className="px-5 py-6 space-y-4 max-w-md mx-auto">
        <p className="text-sm" style={{ color: t.gold, fontWeight: 600 }}>+10 points per visit</p>

        {!scanning && !result && (
          <UtilityButton variant="primary" onClick={startScanning}>
            <Scan className="w-6 h-6" />Start Scanning
          </UtilityButton>
        )}

        {scanning && (
          <div className="space-y-4">
            <UtilityCard style={{ padding: 0, overflow: 'hidden' }}>
              <div className="relative bg-black" style={{ aspectRatio: '1 / 1' }}>
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                <canvas ref={canvasRef} className="hidden" />
              </div>
            </UtilityCard>
            <UtilityButton variant="secondary" onClick={stopScanning}>Cancel</UtilityButton>
          </div>
        )}

        {result && (
          <UtilityCard>
            <StatusBanner variant={bannerVariant} title={result.message} />
            {result.success && (
              <div className="text-center space-y-2 mt-4">
                <p className="text-xl font-bold text-white">{result.memberName}</p>
                <p className="text-3xl font-extrabold" style={{ color: t.gold }}>{result.newBalance} Points</p>
              </div>
            )}
            <div className="mt-6">
              <UtilityButton variant="primary" onClick={() => { setResult(null); startScanning(); }}>
                Scan Next Member
              </UtilityButton>
            </div>
          </UtilityCard>
        )}
      </div>
    </div>
  );
}