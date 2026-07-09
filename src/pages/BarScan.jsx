import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Beer, Scan, LogOut, LayoutDashboard } from 'lucide-react';
import jsQR from 'jsqr';
import clubConfig from '@/config/club.config';
import { UtilityCard, UtilityButton, StatusBanner, UtilityHeader } from '@/components/ui-kit';

const t = clubConfig.theme;

export default function BarScan() {
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
      try {
        const userData = await base44.auth.me();
        if (!userData || (userData.role !== 'admin' && userData.role !== 'canteen_staff')) {
          window.location.href = '/CanteenStaffLogin';
          return;
        }
        setUser(userData);
      } catch (error) {
        window.location.href = '/CanteenStaffLogin';
      }
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
      // Route through backend function for reliable writes
      const response = await base44.functions.invoke('processScan', { qrCode: qrData, scanType: 'bar' });
      const data = response.data;

      if (data.type === 'success' || data.type === 'bar_success') {
        setResult({ success: true, message: `${data.pointsEarned || 5} points awarded!`, memberName: data.name || data.memberName, newBalance: data.newBalance });
      } else {
        setResult({ success: false, message: data.detail || data.message || 'Entry denied' });
      }
    } catch (err) {
      setResult({ success: false, message: 'Error processing scan' });
    }
  };

  const handleLogout = () => {
    base44.auth.logout('/CanteenStaffLogin');
  };

  if (!user) return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: '100dvh', background: t.bg0 }}>
      <Beer className="w-12 h-12 mb-3" style={{ color: t.gold }} />
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, fontFamily: t.fontBody }}>Loading...</p>
    </div>
  );

  const isWarning = !result?.success && result?.message?.toLowerCase().includes('already');
  const bannerVariant = result?.success ? 'valid' : (isWarning ? 'warning' : 'invalid');

  return (
    <div style={{ minHeight: '100dvh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: t.bg0, fontFamily: t.fontBody }}>
      <UtilityHeader
        title="Bar Scanner"
        right={
          <>
            <button onClick={() => window.location.href = '/AdminDashboard'} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white" style={{ background: t.navy, minHeight: 48 }}>
              <LayoutDashboard className="w-4 h-4" />Dashboard
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white" style={{ background: t.navy, minHeight: 48 }}>
              <LogOut className="w-4 h-4" />Logout
            </button>
          </>
        }
      />

      <div className="px-5 py-6 space-y-4 max-w-md mx-auto">
        <p className="text-sm" style={{ color: t.gold, fontWeight: 600 }}>+5 points per drink</p>

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