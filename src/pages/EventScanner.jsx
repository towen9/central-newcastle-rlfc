import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Ticket, CheckCircle, XCircle, Camera, LogOut, LayoutDashboard, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import jsQR from 'jsqr';

export default function EventScanner() {
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
      <div style={{ minHeight: '100dvh' }} className="bg-[#1a365d] flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto text-blue-300 mb-3" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Success full-screen
  if (resultType === 'success' && scanResult) {
    return (
      <div className="fixed inset-0 bg-emerald-500 flex flex-col items-center justify-center z-50 px-6 text-center">
        <CheckCircle className="w-32 h-32 text-white mb-6" />
        <p className="text-white text-4xl font-extrabold mb-2">✅ WELCOME IN!</p>
        <p className="text-emerald-100 text-2xl font-semibold mt-2">{scanResult.purchaser_name}</p>
        <p className="text-emerald-200 text-base mt-2">{scanResult.message}</p>
        <p className="text-emerald-300 text-xs mt-6">✅ {scanCount} admitted today</p>
      </div>
    );
  }

  // Error full-screen
  if (resultType === 'error' && scanResult) {
    return (
      <div className="fixed inset-0 bg-red-600 flex flex-col items-center justify-center z-50 px-6 text-center">
        <XCircle className="w-32 h-32 text-white mb-6" />
        <p className="text-white text-3xl font-extrabold mb-2">🚫 DENIED</p>
        {scanResult.purchaser_name && <p className="text-red-100 text-xl font-semibold mb-2">{scanResult.purchaser_name}</p>}
        <p className="text-red-200 text-base">{scanResult.error}</p>
        {scanResult.scanned_at && (
          <p className="text-red-300 text-sm mt-2">
            Previously scanned: {new Date(scanResult.scanned_at).toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney', hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: '#f9fafb' }}>
      {/* Header */}
      <div className="bg-[#1a365d] text-white" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="px-5 py-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Ticket className="w-10 h-10" />
              <div>
                <h1 className="text-xl font-bold">Event Scanner</h1>
                <p className="text-blue-200 text-sm">Ladies Long Lunch Entry</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => window.location.href = '/AdminDashboard'} className="text-white hover:bg-white/20">
                <LayoutDashboard className="w-4 h-4 mr-1" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => base44.auth.logout()} className="text-white hover:bg-white/20">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-blue-200 text-xs">{user.full_name}</p>
          {scanCount > 0 && (
            <div className="mt-2 bg-white/15 rounded-full px-4 py-1 inline-block text-sm font-semibold">
              ✅ {scanCount} admitted today
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-6 space-y-4">
        {/* Camera viewfinder */}
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">
          <div className="relative aspect-square bg-black">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            {!scanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Camera className="w-16 h-16 text-white/50" />
              </div>
            )}
            {scanning && (
              <div className="absolute inset-0 border-4 border-blue-500/50">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-4 border-white rounded-2xl" />
              </div>
            )}
          </div>
        </div>

        {!scanning ? (
          <Button onClick={startScanning} className="w-full h-14 bg-[#1a365d] hover:bg-[#2c5282] text-lg">
            <Camera className="w-6 h-6 mr-3" />Start Scanning
          </Button>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600 animate-pulse text-base">Scanning for ticket QR code...</p>
            <Button onClick={stopScanning} variant="outline" className="mt-4">Cancel</Button>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
          <p className="font-semibold mb-1">📋 Instructions</p>
          <p>• Scan each guest's Ladies Long Lunch ticket QR code</p>
          <p>• Green screen = admit the guest</p>
          <p>• Red screen = deny entry (check message)</p>
          <p className="mt-2 text-blue-500 text-xs">Use Safari on iPhone. Each ticket is single-use.</p>
        </div>
      </div>
    </div>
  );
}