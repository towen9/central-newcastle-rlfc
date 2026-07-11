import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useClub } from '@/contexts/ClubContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, CheckCircle, XCircle, Beer, ArrowLeft, Zap } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import CheckInCelebration from '../components/CheckInCelebration';
import jsQR from 'jsqr';
import GlassCard from '@/components/ui-kit/GlassCard';
import Eyebrow from '@/components/ui-kit/Eyebrow';
import GoldButton from '@/components/ui-kit/GoldButton';

export default function ScanForPoints() {
  const { club } = useClub();
  const t = club.theme;
  const [user, setUser] = useState(null);
  const [membership, setMembership] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [celebration, setCelebration] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        
        const memberships = await base44.entities.Membership.filter({ 
          user_id: userData.id, 
          status: 'active' 
        });
        
        if (memberships.length === 0) {
          toast.error('No active membership found');
          return;
        }
        
        setMembership(memberships[0]);
      } catch (error) {
        await base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const scanMutation = useMutation({
    mutationFn: async ({ qrId }) => {
      // Check for recent scans (10-minute cooldown)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const recentScans = await base44.entities.PointsTransaction.filter({
        user_id: user.id,
        transaction_type: 'bar_purchase',
        timestamp: { $gte: tenMinutesAgo }
      });

      if (recentScans.length > 0) {
        const lastScan = new Date(recentScans[0].timestamp);
        const minutesLeft = Math.ceil((10 - (Date.now() - lastScan.getTime()) / 60000));
        throw new Error(`Please wait ${minutesLeft} more minute${minutesLeft > 1 ? 's' : ''} before scanning again`);
      }

      // Verify QR code exists
      const qrCodes = await base44.entities.ClubQRCode.filter({ qr_id: qrId, is_active: true });
      if (qrCodes.length === 0) {
        throw new Error('Invalid QR code');
      }

      const location = qrCodes[0];
      const pointsEarned = club.celebration.points_per_scan;

      // Update membership points
      await base44.entities.Membership.update(membership.id, {
        points: (membership.points || 0) + pointsEarned
      });

      // Create transaction
      await base44.entities.PointsTransaction.create({
        user_id: user.id,
        membership_id: membership.id,
        points: pointsEarned,
        transaction_type: 'bar_purchase',
        description: `Purchase at ${location.name}`,
        location: location.name,
        location_qr_id: qrId,
        timestamp: new Date().toISOString()
      });

      return { pointsEarned, location: location.name };
    },
    onSuccess: ({ pointsEarned, location }) => {
      setResult({
        success: true,
        message: `+${pointsEarned} points earned!`,
        location,
        newBalance: (membership.points || 0) + pointsEarned
      });
      setCelebration({ pointsEarned });
      queryClient.invalidateQueries(['membership']);
    },
    onError: (error) => {
      setResult({
        success: false,
        message: error.message || 'Scan failed'
      });
    }
  });

  const startScanning = async () => {
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setScanning(true);
      scanQRCode();
    } catch (error) {
      toast.error('Camera access denied');
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
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
      
      if (code) {
        handleQRCodeScanned(code.data);
        return;
      }
    }
    
    animationRef.current = requestAnimationFrame(scanQRCode);
  };

  const handleQRCodeScanned = async (qrData) => {
    stopScanning();
    
    // Parse QR data (supports both JSON format and plain string)
    let qrId = qrData;
    try {
      const parsed = JSON.parse(qrData);
      qrId = parsed.id || qrData;
    } catch {
      // Already a plain string
    }
    
    scanMutation.mutate({ qrId });
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  if (!club.features?.points_rewards) {
    return <Navigate to={createPageUrl('Home')} replace />;
  }

  // Block day pass holders from scanning for points
  if (user && !membership) {
    return (
      <div className="min-h-full pb-24">
        <div className="pt-safe px-5 py-4 flex items-center gap-4">
          <Link to={createPageUrl('Home')}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.09)' }}>
              <ArrowLeft className="w-5 h-5 text-white" />
            </div>
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center px-5 py-12">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: `${t.gold}22` }}>
              <Beer className="w-8 h-8" style={{ color: t.gold }} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: t.fontBody }}>Members Only</h2>
            <p className="text-white/50 mb-6" style={{ fontFamily: t.fontBody }}>Bar scanning is exclusive to membership holders.</p>
            <Link to={createPageUrl('Membership')}>
              <GoldButton>View Memberships</GoldButton>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !membership) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <p className="text-white/50" style={{ fontFamily: t.fontBody }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-24">
      {/* Header */}
      <div className="pt-safe px-5 py-4 flex items-center justify-between">
        <Link to={createPageUrl('Home')}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <ArrowLeft className="w-5 h-5 text-white" />
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <Beer className="w-6 h-6" style={{ color: t.gold }} />
          <div>
            <Eyebrow color={t.gold}>Bar & Canteen</Eyebrow>
            <h1 className="text-white text-lg" style={{ fontFamily: t.fontDisplay }}>Scan for Points</h1>
          </div>
        </div>
        <div className="w-10" />
      </div>

      <div className="px-5 py-6">
        {!result ? (
          /* Scanner View */
          <div className="space-y-4">
            {/* Current Points */}
            <GlassCard className="p-4 text-center" style={{ borderColor: `${t.gold}33` }}>
              <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>Your Points</p>
              <p className="text-4xl font-bold" style={{ color: t.gold, fontFamily: t.fontDisplay }}>{membership.points || 0}</p>
            </GlassCard>

            {/* Scanner — camera feed is full-contrast, no glass overlay */}
            <div className="rounded-2xl overflow-hidden" style={{ border: `3px solid ${t.gold}55`, boxShadow: `0 0 24px ${t.gold}1a, 0 8px 32px rgba(0,0,0,0.3)` }}>
              <div className="relative aspect-square bg-black">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {!scanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <Camera className="w-20 h-20 text-white/40" />
                  </div>
                )}

                {scanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-64 h-64 border-4 rounded-3xl animate-pulse" style={{ borderColor: t.gold }} />
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            <GlassCard className="p-4">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: t.gold }} />
                <div className="text-sm" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: t.fontBody }}>
                  <p className="font-semibold mb-1 text-white">How it works:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Scan the QR code at the bar or canteen</li>
                    <li>Earn 5 points instantly</li>
                    <li>Can scan once every 10 minutes</li>
                  </ol>
                </div>
              </div>
            </GlassCard>

            {/* Scan Button */}
            {!scanning ? (
              <GoldButton fullWidth onClick={startScanning} style={{ padding: '16px 20px' }}>
                <Camera className="w-6 h-6" />
                Start Scanning
              </GoldButton>
            ) : (
              <div className="text-center">
                <p className="text-white font-semibold animate-pulse" style={{ fontFamily: t.fontBody }}>Point camera at QR code...</p>
                <Button 
                  onClick={stopScanning}
                  variant="outline"
                  className="mt-3"
                  style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'white', background: 'transparent' }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* Result View */
          <div className="space-y-4">
            <GlassCard className="p-8 text-center" style={result.success ? { borderColor: `${t.green}55` } : { borderColor: '#ef444455' }}>
              {result.success ? (
                <>
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: `${t.green}22` }}>
                    <CheckCircle className="w-10 h-10" style={{ color: t.green }} />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: t.fontDisplay }}>{result.message}</h2>
                  <p className="mb-4" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: t.fontBody }}>{result.location}</p>
                  <div className="rounded-xl p-4" style={{ background: `${t.gold}1a`, border: `1px solid ${t.gold}33` }}>
                    <p className="text-xs mb-1" style={{ color: t.gold, fontFamily: t.fontBody }}>New Balance</p>
                    <p className="text-4xl font-bold" style={{ color: t.gold, fontFamily: t.fontDisplay }}>{result.newBalance}</p>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>points</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}>
                    <XCircle className="w-10 h-10" style={{ color: '#ef4444' }} />
                  </div>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: '#ef4444', fontFamily: t.fontBody }}>Oops!</h2>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontFamily: t.fontBody }}>{result.message}</p>
                </>
              )}
            </GlassCard>

            <GoldButton fullWidth onClick={() => { setResult(null); startScanning(); }} style={{ padding: '16px 20px' }}>
              Scan Again
            </GoldButton>

            <Link to={createPageUrl('Home')}>
              <Button
                variant="outline"
                className="w-full"
                style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'white', background: 'transparent', padding: '16px 20px' }}
              >
                Back to Home
              </Button>
            </Link>
          </div>
        )}
      </div>
      {celebration && (
        <CheckInCelebration
          pointsEarned={celebration.pointsEarned}
          streak={0}
          onDismiss={() => setCelebration(null)}
        />
      )}
    </div>
  );
}