import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Camera, CheckCircle, XCircle, Shield, LogOut, LayoutDashboard } from 'lucide-react';
import { toast } from 'sonner';
import jsQR from 'jsqr';
import clubConfig from '@/config/club.config';
import Eyebrow from '@/components/ui-kit/Eyebrow';
import GoldButton from '@/components/ui-kit/GoldButton';

const t = clubConfig.theme;

export default function GateScan() {
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
      <div className="fixed inset-0 flex flex-col items-center justify-center z-50 px-6" style={{ background: '#16a34a' }}>
        <CheckCircle className="w-32 h-32 text-white mb-6" />
        <p className="text-white text-4xl font-extrabold mb-2" style={{ fontFamily: t.fontDisplay }}>✅ LET 'EM IN!</p>
        {scanResult.photo && <img src={scanResult.photo} alt="" className="w-24 h-24 rounded-full object-cover border-4 border-white mb-3 mt-2" />}
        <p className="text-white text-2xl font-semibold">{scanResult.name}</p>
        <p className="text-white text-base mt-1" style={{ opacity: 0.85 }}>{scanResult.passType}</p>
        <p className="text-white text-base mt-1" style={{ opacity: 0.75 }}>{scanResult.detail}</p>
        <p className="text-white text-sm mt-4" style={{ opacity: 0.7 }}>✅ {scanCount} scanned today</p>
      </div>
    );
  }

  if (checkInLastEntry && scanResult) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center z-50 px-6 text-center" style={{ background: '#f59e0b' }}>
        <p className="text-6xl mb-4" style={{ color: '#1a1303' }}>⚠️</p>
        <p className="text-3xl font-extrabold mb-3" style={{ color: '#1a1303', fontFamily: t.fontDisplay }}>LAST ENTRY</p>
        {scanResult.photo && <img src={scanResult.photo} alt="" className="w-24 h-24 rounded-full object-cover border-4 mb-3" style={{ borderColor: '#1a1303' }} />}
        <p className="text-2xl font-semibold" style={{ color: '#1a1303' }}>{scanResult.name}</p>
        <p className="text-base mt-3 max-w-xs" style={{ color: '#1a1303', opacity: 0.85 }}>{scanResult.detail}</p>
        <p className="text-sm mt-4" style={{ color: '#1a1303', opacity: 0.7 }}>✅ Entry granted — auto-continue in 4s</p>
      </div>
    );
  }

  if (checkInExhausted && scanResult) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center z-50 px-6 text-center" style={{ background: '#dc2626' }}>
        <p className="text-white text-6xl mb-4">❌</p>
        <p className="text-white text-3xl font-extrabold mb-3" style={{ fontFamily: t.fontDisplay }}>NO ENTRIES REMAINING</p>
        <p className="text-white text-2xl font-semibold">{scanResult.name}</p>
        <p className="text-white text-base mt-3 max-w-sm" style={{ opacity: 0.85 }}>{scanResult.detail}</p>
        <button
          onClick={() => {
            setCheckInExhausted(false);
            setScanResult(null);
            isProcessingRef.current = false;
            startScanningRef.current?.();
          }}
          className="mt-8 bg-white text-red-700 font-bold px-8 py-4 text-lg rounded-xl"
          style={{ minHeight: 56 }}
        >
          Acknowledge &amp; Continue
        </button>
      </div>
    );
  }

  if (checkInDenied && scanResult) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center z-50 px-6" style={{ background: '#dc2626' }}>
        <XCircle className="w-32 h-32 text-white mb-6" />
        <p className="text-white text-4xl font-extrabold mb-2" style={{ fontFamily: t.fontDisplay }}>🚫 DENY ENTRY</p>
        <p className="text-white text-xl font-semibold">{scanResult.name}</p>
        <p className="text-white text-base mt-2" style={{ opacity: 0.85 }}>{scanResult.detail}</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: t.bg0, fontFamily: t.fontBody }}>
      {/* Header */}
      <div style={{ paddingTop: 'env(safe-area-inset-top, 0px)', background: t.bg1, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="px-5 py-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Shield className="w-10 h-10" style={{ color: t.gold }} />
              <div>
                <Eyebrow color={t.gold}>Gate Entry</Eyebrow>
                <h1 className="text-white text-xl font-bold mt-0.5" style={{ fontFamily: t.fontDisplay }}>Gate Scanner</h1>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{user.full_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => window.location.href = '/AdminDashboard'} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)', minHeight: 40 }}>
                <LayoutDashboard className="w-4 h-4" />Dashboard
              </button>
              <button onClick={() => base44.auth.logout()} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)', minHeight: 40 }}>
                <LogOut className="w-4 h-4" />Logout
              </button>
            </div>
          </div>
          {scanCount > 0 && (
            <div className="mt-2 rounded-full px-4 py-1 inline-block text-sm font-semibold" style={{ background: t.navy, color: t.green }}>
              ✅ {scanCount} scanned today
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-6 space-y-4">
        {/* Camera viewport — solid card, feed stays full-contrast and unobstructed */}
        <div className="overflow-hidden" style={{ borderRadius: 16, background: t.bg1, border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="relative aspect-square bg-black">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            {!scanning && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'black' }}>
                <Camera className="w-16 h-16" style={{ color: 'rgba(255,255,255,0.3)' }} />
              </div>
            )}
          </div>
        </div>

        {!scanning ? (
          <GoldButton onClick={startScanning} fullWidth style={{ fontSize: 18, padding: '16px 24px', minHeight: 56 }}>
            <Camera className="w-6 h-6" />Start Scanning
          </GoldButton>
        ) : (
          <div className="text-center py-4">
            <p className="animate-pulse text-base" style={{ color: 'rgba(255,255,255,0.6)' }}>Scanning for QR code...</p>
            <button onClick={stopScanning} className="mt-4 rounded-xl px-6 py-3 text-sm font-semibold text-white" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.20)', minHeight: 48 }}>
              Cancel
            </button>
          </div>
        )}

        {/* Accepts info — solid opaque card */}
        <div className="p-4" style={{ borderRadius: 16, background: t.bg1, border: '1px solid rgba(255,255,255,0.08)' }}>
          <Eyebrow color={t.gold}>Accepts</Eyebrow>
          <div className="mt-2 space-y-1" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }}>
            <p>• Supporter Pack (5 game entries)</p>
            <p>• Day Passes</p>
            <p>• Family & Premium memberships</p>
          </div>
        </div>
      </div>
    </div>
  );
}