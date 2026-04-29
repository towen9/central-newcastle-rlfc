import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Beer, CheckCircle, XCircle, Scan, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import jsQR from 'jsqr';

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
        // Fallback: direct entity write if backend doesn't handle bar scans
        const membership = await base44.entities.Membership.filter({ qr_code_id: qrData, status: 'active' });
        if (!membership || membership.length === 0) {
          setResult({ success: false, message: 'Invalid membership' });
          return;
        }
        const member = membership[0];
        const pointsEarned = 5;
        await base44.entities.Membership.update(member.id, { points: (member.points || 0) + pointsEarned });
        await base44.entities.PointsTransaction.create({
          user_id: member.user_id,
          membership_id: member.id,
          points: pointsEarned,
          transaction_type: 'bar_purchase',
          description: 'Alcohol purchase at bar',
          location: 'Bar',
          timestamp: new Date().toISOString()
        });
        setResult({ success: true, message: `${pointsEarned} points awarded!`, memberName: member.user_name, newBalance: (member.points || 0) + pointsEarned });
      }
    } catch (err) {
      setResult({ success: false, message: 'Error processing scan' });
    }
  };

  const handleLogout = () => {
    base44.auth.logout('/CanteenStaffLogin');
  };

  if (!user) return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Beer className="w-10 h-10 text-amber-400" />
            <div>
              <h1 className="text-2xl font-bold">Bar Scanner</h1>
              <p className="text-gray-400 text-sm">+5 points per drink</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => window.location.href = '/AdminDashboard'}
              variant="ghost" 
              size="sm"
              className="text-white hover:bg-white/10"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button 
              onClick={handleLogout} 
              variant="ghost" 
              size="sm"
              className="text-white hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {!scanning && !result && (
          <Button 
            onClick={startScanning}
            className="w-full h-16 bg-amber-500 hover:bg-amber-600 text-lg"
          >
            <Scan className="w-6 h-6 mr-2" />
            Start Scanning
          </Button>
        )}

        {scanning && (
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video ref={videoRef} className="w-full" playsInline muted />
              <div className="absolute inset-0 border-4 border-amber-400 opacity-50 pointer-events-none" />
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <Button onClick={stopScanning} variant="outline" className="w-full">Cancel</Button>
          </div>
        )}

        {result && (
          <div className={`p-6 rounded-lg ${result.success ? 'bg-green-900' : 'bg-red-900'}`}>
            {result.success ? (
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            ) : (
              <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            )}
            <h2 className="text-xl font-bold text-center mb-2">{result.message}</h2>
            {result.success && (
              <div className="text-center space-y-2">
                <p className="text-lg">{result.memberName}</p>
                <p className="text-2xl font-bold text-amber-400">{result.newBalance} Points</p>
              </div>
            )}
            <Button 
              onClick={() => { setResult(null); startScanning(); }}
              className="w-full mt-6 bg-amber-500 hover:bg-amber-600"
            >
              Scan Next Member
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
