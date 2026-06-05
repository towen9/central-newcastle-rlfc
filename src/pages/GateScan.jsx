import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Camera, CheckCircle, XCircle, Shield, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import jsQR from 'jsqr';

export default function GateScan() {
  const [user, setUser] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [checkInDenied, setCheckInDenied] = useState(false);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (checkInSuccess && scanResult) {
    return (
      <div className="fixed inset-0 bg-emerald-500 flex flex-col items-center justify-center z-50 px-6">
        <CheckCircle className="w-32 h-32 text-white mb-6" />
        <p className="text-white text-4xl font-extrabold mb-2">✅ LET 'EM IN!</p>
        {scanResult.photo && <img src={scanResult.photo} alt="" className="w-24 h-24 rounded-full object-cover border-4 border-white mb-3 mt-2" />}
        <p className="text-emerald-100 text-2xl font-semibold">{scanResult.name}</p>
        <p className="text-emerald-200 text-base mt-1">{scanResult.passType}</p>
        <p className="text-emerald-200 text-sm mt-1">{scanResult.detail}</p>
        <p className="text-emerald-300 text-xs mt-4">✅ {scanCount} scanned today</p>
      </div>
    );
  }

  if (checkInDenied && scanResult) {
    return (
      <div className="fixed inset-0 bg-red-600 flex flex-col items-center justify-center z-50 px-6">
        <XCircle className="w-32 h-32 text-white mb-6" />
        <p className="text-white text-4xl font-extrabold mb-2">🚫 DENY ENTRY</p>
        <p className="text-red-100 text-xl font-semibold">{scanResult.name}</p>
        <p className="text-red-200 text-sm mt-2">{scanResult.detail}</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: '#f9fafb' }}>
      <div className="bg-[#1a365d] text-white" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="px-5 py-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Shield className="w-10 h-10" />
              <div>
                <h1 className="text-xl font-bold">Gate Scanner</h1>
                <p className="text-blue-200 text-sm">{user.full_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => window.location.href = '/AdminDashboard'} className="text-white hover:bg-white/20">
                <LayoutDashboard className="w-4 h-4 mr-2" />Dashboard
              </Button>
              <Button variant="ghost" size="sm" onClick={() => base44.auth.logout()} className="text-white hover:bg-white/20">
                <LogOut className="w-4 h-4 mr-2" />Logout
              </Button>
            </div>
          </div>
          {scanCount > 0 && <div className="mt-2 bg-white/15 rounded-full px-4 py-1 inline-block text-sm font-semibold">✅ {scanCount} scanned today</div>}
        </div>
      </div>
      <div className="px-5 py-6 space-y-4">
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">
          <div className="relative aspect-square bg-black">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            {!scanning && <div className="absolute inset-0 flex items-center justify-center bg-black/50"><Camera className="w-16 h-16 text-white/50" /></div>}
            {scanning && <div className="absolute inset-0 border-4 border-blue-500/50"><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-4 border-white rounded-2xl" /></div>}
          </div>
        </div>
        {!scanning ? (
          <Button onClick={startScanning} className="w-full bg-[#1a365d] hover:bg-[#2c5282] py-6 text-lg">
            <Camera className="w-6 h-6 mr-3" />Start Scanning
          </Button>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600 animate-pulse text-base">Scanning for QR code...</p>
            <Button onClick={stopScanning} variant="outline" className="mt-4">Cancel</Button>
          </div>
        )}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
          <p className="font-semibold mb-1">✅ Accepts:</p>
          <p>• Supporter Pack (5 game entries)</p>
          <p>• Day Passes</p>
          <p>• Family & Premium memberships</p>
        </div>
      </div>
    </div>
  );
}