import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Ticket, Camera, LogOut, LayoutDashboard, Shield } from 'lucide-react';
import { toast } from 'sonner';
import jsQR from 'jsqr';
import { useClub } from '@/contexts/ClubContext';
import { UtilityCard, UtilityButton, StatusBanner, UtilityHeader } from '@/components/ui-kit';

export default function EventScanner() {
  const { club } = useClub();
  const t = club.theme;
  const [user, setUser] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [resultType, setResultType] = useState(null); // 'success' | 'error'
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
        if (!userData || (userData.role !== 'admin' && userData.role !== 'gate_staff')) {
          toast.error('Access denied');
          base44.auth.redirectToLogin(window.location.href);
          return;
        }
        setUser(userData);
      } catch {
        base44.auth.redirectToLogin(window.location.href);
      }
    };
    loadUser();
  }, []);

  useEffect(() => { return () => stopScanning(); }, []);

  // Attach stream only after scanning=true has rendered the video element
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

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (pendingStreamRef.current) {
      pendingStreamRef.current.getTracks().forEach(t => t.stop());
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

  const startScanning = async () => {
    isProcessingRef.current = false;
    setScanResult(null);
    setResultType(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      pendingStreamRef.current = stream;
      setScanning(true);
    } catch {
      toast.error('Camera access denied. Use Safari on iPhone.');
    }
  };

  startScanningRef.current = startScanning;

  const handleQRScanned = async (qrData) => {
    stopScanning();
    try {
      // ticket_id is the raw QR value (UUID)
      const ticketId = qrData.trim();

      const response = await base44.functions.invoke('processEventScan', {
        ticket_id: ticketId,
        scanned_by: user?.email || ''
      });
      const result = response.data;

      if (result.success) {
        setScanResult(result);
        setResultType('success');
        setScanCount(c => c + 1);
        setTimeout(() => {
          setScanResult(null);
          setResultType(null);
          isProcessingRef.current = false;
          startScanningRef.current?.();
        }, 3000);
      } else {
        setScanResult(result);
        setResultType('error');
        setTimeout(() => {
          setScanResult(null);
          setResultType(null);
          isProcessingRef.current = false;
          startScanningRef.current?.();
        }, 3500);
      }
    } catch (err) {
      const isOffline = !navigator.onLine || err.message?.toLowerCase().includes('network') || err.message?.toLowerCase().includes('fetch');
      if (isOffline) {
        toast.error('⚠️ No internet — check connection before scanning');
        isProcessingRef.current = false;
      } else {
        toast.error('Scan error: ' + err.message);
        setTimeout(() => { isProcessingRef.current = false; startScanningRef.current?.(); }, 2000);
      }
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: '100dvh', background: t.bg0 }}>
        <Shield className="w-12 h-12 mb-3" style={{ color: t.gold }} />
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, fontFamily: t.fontBody }}>Loading...</p>
      </div>
    );
  }

  // Success full-screen
  if (resultType === 'success' && scanResult) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center z-50 px-6" style={{ background: t.bg0 }}>
        <div className="w-full max-w-sm space-y-5">
          <StatusBanner variant="valid" title="✅ WELCOME IN!" subtitle={scanResult.purchaser_name} />
          <p className="text-base text-center" style={{ color: 'rgba(255,255,255,0.7)' }}>{scanResult.message}</p>
          <p className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.5)' }}>✅ {scanCount} admitted today</p>
        </div>
      </div>
    );
  }

  // Error full-screen
  if (resultType === 'error' && scanResult) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center z-50 px-6 text-center" style={{ background: t.bg0 }}>
        <div className="w-full max-w-sm space-y-5">
          <StatusBanner variant="invalid" title="🚫 DENIED" />
          {scanResult.purchaser_name && <p className="text-white text-xl font-bold text-center">{scanResult.purchaser_name}</p>}
          <p className="text-base text-center" style={{ color: 'rgba(255,255,255,0.7)' }}>{scanResult.error}</p>
          {scanResult.scanned_at && (
            <p className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Previously scanned: {new Date(scanResult.scanned_at).toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: t.bg0, fontFamily: t.fontBody }}>
      <UtilityHeader
        title="Event Scanner"
        right={
          <>
            <button onClick={() => window.location.href = '/AdminDashboard'} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white" style={{ background: t.navy, minHeight: 48 }}>
              <LayoutDashboard className="w-4 h-4" />
            </button>
            <button onClick={() => base44.auth.logout()} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white" style={{ background: t.navy, minHeight: 48 }}>
              <LogOut className="w-4 h-4" />
            </button>
          </>
        }
      />

      <div className="px-5 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: t.gold }}>Ladies Long Lunch Entry</p>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{user.full_name}</span>
        </div>
        {scanCount > 0 && (
          <span className="inline-block rounded-full px-4 py-1 text-sm font-bold" style={{ background: t.navy, color: t.green }}>
            ✅ {scanCount} admitted today
          </span>
        )}

        {/* Camera viewfinder — feed stays full-contrast and unobstructed */}
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
            <p className="animate-pulse text-base" style={{ color: 'rgba(255,255,255,0.6)' }}>Scanning for ticket QR code...</p>
            <div className="mt-4">
              <UtilityButton variant="secondary" onClick={stopScanning}>Cancel</UtilityButton>
            </div>
          </div>
        )}

        <UtilityCard>
          <p className="font-bold mb-1" style={{ color: t.gold }}>📋 Instructions</p>
          <div className="space-y-1 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
            <p>• Scan each guest's Ladies Long Lunch ticket QR code</p>
            <p>• Green screen = admit the guest</p>
            <p>• Red screen = deny entry (check message)</p>
            <p className="mt-2 text-xs" style={{ color: t.cyan }}>Use Safari on iPhone. Each ticket is single-use.</p>
          </div>
        </UtilityCard>
      </div>
    </div>
  );
}