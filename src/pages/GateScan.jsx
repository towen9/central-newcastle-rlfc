import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Camera, Shield, LogOut, LayoutDashboard } from 'lucide-react';
import { toast } from 'sonner';
import jsQR from 'jsqr';
import { useClub } from '@/contexts/ClubContext';
import { UtilityCard, UtilityButton, StatusBanner, UtilityHeader } from '@/components/ui-kit';

export default function GateScan() {
  const { club } = useClub();
  const t = club.theme;
  const [user, setUser] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [checkInDenied, setCheckInDenied] = useState(false);
  const [checkInLastEntry, setCheckInLastEntry] = useState(false);
  const [checkInExhausted, setCheckInExhausted] = useState(false);
  const [scanCount, setScanCount] = useState(0);
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
          toast.error('Please log in');
          await base44.auth.redirectToLogin();
          return;
        }
        setUser(userData);
      } catch (error) {
        toast.error('Please log in');
        await base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

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
    setScanResult(null);
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
    isProcessingRef.current = true;
    try {
      let qrCode;
      try {
        const parsed = JSON.parse(qrData);
        qrCode = parsed.id;
      } catch {
        qrCode = qrData.replace('membership:', '').trim();
      }

      const response = await base44.functions.invoke('processScan', { qrCode });
      const result = response.data;

      if (result.type === 'success') {
        setScanResult(result);
        setCheckInSuccess(true);
        setScanCount(c => c + 1);
        setTimeout(() => {
          setCheckInSuccess(false);
          setScanResult(null);
          isProcessingRef.current = false;
          startScanningRef.current?.();
        }, 2500);
      } else if (result.type === 'supporter_last_entry') {
        setScanResult(result);
        setCheckInLastEntry(true);
        setScanCount(c => c + 1);
        setTimeout(() => {
          setCheckInLastEntry(false);
          setScanResult(null);
          isProcessingRef.current = false;
          startScanningRef.current?.();
        }, 4000);
      } else if (result.type === 'supporter_exhausted') {
        setScanResult(result);
        setCheckInExhausted(true);
        // No auto-dismiss — staff must acknowledge
      } else if (result.type === 'already_used') {
        setScanResult(result);
        setCheckInDenied(true);
        setTimeout(() => {
          setCheckInDenied(false);
          setScanResult(null);
          isProcessingRef.current = false;
          startScanningRef.current?.();
        }, 3000);
      } else {
        toast.error(result.detail || 'Entry denied');
        setTimeout(() => { isProcessingRef.current = false; startScanningRef.current?.(); }, 2500);
      }
    } catch (err) {
      const isOffline = !navigator.onLine || err.message?.toLowerCase().includes('network') || err.message?.toLowerCase().includes('fetch');
      if (isOffline) {
        toast.error('⚠️ No internet connection. Check your network and try again.');
        // Don't auto-restart on network errors — wait for staff to tap manually
        isProcessingRef.current = false;
      } else {
        toast.error('Scan failed: ' + err.message);
        setTimeout(() => { isProcessingRef.current = false; startScanningRef.current?.(); }, 2000);
      }
    }
  };

  useEffect(() => { return () => stopScanning(); }, []);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: '100dvh', background: t.bg0 }}>
        <Shield className="w-12 h-12 mb-3" style={{ color: t.gold }} />
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, fontFamily: t.fontBody }}>Loading...</p>
      </div>
    );
  }

  if (checkInSuccess && scanResult) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center z-50 px-6" style={{ background: t.bg0 }}>
        <div className="w-full max-w-sm space-y-5">
          <StatusBanner variant="valid" title="✅ LET 'EM IN!" subtitle={scanResult.passType} />
          {scanResult.photo && <img src={scanResult.photo} alt="" className="w-28 h-28 rounded-full object-cover border-4 mx-auto" style={{ borderColor: t.gold }} />}
          <p className="text-white text-2xl font-bold text-center">{scanResult.name}</p>
          <p className="text-white text-base text-center" style={{ opacity: 0.75 }}>{scanResult.detail}</p>
          <p className="text-white text-sm text-center" style={{ opacity: 0.7 }}>✅ {scanCount} scanned today</p>
        </div>
      </div>
    );
  }

  if (checkInLastEntry && scanResult) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center z-50 px-6 text-center" style={{ background: t.bg0 }}>
        <div className="w-full max-w-sm space-y-5">
          <StatusBanner variant="warning" title="⚠️ LAST ENTRY" />
          {scanResult.photo && <img src={scanResult.photo} alt="" className="w-28 h-28 rounded-full object-cover border-4 mx-auto" style={{ borderColor: '#F59E0B' }} />}
          <p className="text-white text-2xl font-bold text-center">{scanResult.name}</p>
          <p className="text-white text-base text-center max-w-xs mx-auto" style={{ opacity: 0.75 }}>{scanResult.detail}</p>
          <p className="text-white text-sm text-center" style={{ opacity: 0.7 }}>✅ Entry granted — auto-continue in 4s</p>
        </div>
      </div>
    );
  }

  if (checkInExhausted && scanResult) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center z-50 px-6 text-center" style={{ background: t.bg0 }}>
        <div className="w-full max-w-sm space-y-5">
          <StatusBanner variant="invalid" title="❌ NO ENTRIES REMAINING" />
          <p className="text-white text-2xl font-bold text-center">{scanResult.name}</p>
          <p className="text-white text-base text-center max-w-sm mx-auto" style={{ opacity: 0.85 }}>{scanResult.detail}</p>
          <UtilityButton variant="primary" onClick={() => {
            setCheckInExhausted(false);
            setScanResult(null);
            isProcessingRef.current = false;
            startScanningRef.current?.();
          }}>
            Acknowledge &amp; Continue
          </UtilityButton>
        </div>
      </div>
    );
  }

  if (checkInDenied && scanResult) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center z-50 px-6" style={{ background: t.bg0 }}>
        <div className="w-full max-w-sm space-y-5">
          <StatusBanner variant="invalid" title="🚫 DENY ENTRY" />
          <p className="text-white text-xl font-bold text-center">{scanResult.name}</p>
          <p className="text-white text-base text-center" style={{ opacity: 0.85 }}>{scanResult.detail}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: t.bg0, fontFamily: t.fontBody }}>
      <UtilityHeader
        title="Gate Scanner"
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
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{user.full_name}</p>
          {scanCount > 0 && (
            <span className="rounded-full px-4 py-1 text-sm font-bold" style={{ background: t.navy, color: t.green }}>
              ✅ {scanCount} scanned today
            </span>
          )}
        </div>

        {/* Camera viewport — solid card, feed stays full-contrast and unobstructed */}
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

        {!scanning ? (
          <UtilityButton variant="primary" onClick={startScanning}>
            <Camera className="w-6 h-6" />Start Scanning
          </UtilityButton>
        ) : (
          <div className="text-center py-4">
            <p className="animate-pulse text-base" style={{ color: 'rgba(255,255,255,0.6)' }}>Scanning for QR code...</p>
            <div className="mt-4">
              <UtilityButton variant="secondary" onClick={stopScanning}>Cancel</UtilityButton>
            </div>
          </div>
        )}

        {/* Accepts info — solid opaque card */}
        <UtilityCard>
          <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: t.gold }}>Accepts</span>
          <div className="mt-2 space-y-1" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }}>
            <p>• Supporter Pack (5 game entries)</p>
            <p>• Day Passes</p>
            <p>• Family & Premium memberships</p>
          </div>
        </UtilityCard>
      </div>
    </div>
  );
}