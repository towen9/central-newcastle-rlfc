import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import clubConfig from '@/config/club.config';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, CheckCircle, XCircle, Beer, ArrowLeft, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import CheckInCelebration from '../components/CheckInCelebration';
import jsQR from 'jsqr';

export default function ScanForPoints() {
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
      const pointsEarned = clubConfig.celebration.points_per_scan;

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

  // Block day pass holders from scanning for points
  if (user && !membership) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-500 to-orange-600 pb-24">
        <div className="bg-white/10 backdrop-blur-md pt-safe">
          <div className="px-5 py-4">
            <Link to={createPageUrl('Home')}>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-white" />
              </div>
            </Link>
          </div>
        </div>
        <div className="px-5 py-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/90 rounded-full flex items-center justify-center">
            <Beer className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Members Only</h2>
          <p className="text-white/90 mb-6">Bar scanning is exclusive to membership holders.</p>
          <Link to={createPageUrl('Membership')}>
            <Button className="bg-white text-amber-600 hover:bg-gray-100">
              View Memberships
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!user || !membership) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-700 pb-24">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md pt-safe">
        <div className="px-5 py-4 flex items-center justify-between">
          <Link to={createPageUrl('Home')}>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Beer className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-white text-xl font-bold">Scan for Points</h1>
              <p className="text-amber-100 text-sm">+5 points per scan</p>
            </div>
          </div>
          <div className="w-10" />
        </div>
      </div>

      <div className="px-5 py-6">
        {!result ? (
          /* Scanner View */
          <div className="space-y-4">
            {/* Current Points */}
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl p-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Your Points</p>
              <p className="text-4xl font-bold text-amber-600 dark:text-amber-500">{membership.points || 0}</p>
            </div>

            {/* Scanner */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border-4 border-white/50 shadow-2xl">
              <div className="relative aspect-square bg-black">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {!scanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                    <Camera className="w-20 h-20 text-white/50" />
                  </div>
                )}

                {scanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-64 h-64 border-4 border-white rounded-3xl animate-pulse" />
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <p className="font-semibold mb-1">How it works:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Scan the QR code at the bar or canteen</li>
                    <li>Earn 5 points instantly</li>
                    <li>Can scan once every 10 minutes</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Scan Button */}
            {!scanning ? (
              <Button 
                onClick={startScanning}
                className="w-full bg-white hover:bg-gray-100 text-amber-600 py-6 text-lg font-semibold shadow-xl"
              >
                <Camera className="w-6 h-6 mr-3" />
                Start Scanning
              </Button>
            ) : (
              <div className="text-center">
                <p className="text-white font-semibold animate-pulse">Point camera at QR code...</p>
                <Button 
                  onClick={stopScanning}
                  variant="outline"
                  className="mt-3 bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* Result View */
          <div className="space-y-4">
            <div className={`rounded-2xl p-8 text-center shadow-2xl ${
              result.success 
                ? 'bg-white dark:bg-gray-800' 
                : 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800'
            }`}>
              {result.success ? (
                <>
                  <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{result.message}</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{result.location}</p>
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                    <p className="text-sm text-amber-800 dark:text-amber-300 mb-1">New Balance</p>
                    <p className="text-4xl font-bold text-amber-600 dark:text-amber-500">{result.newBalance}</p>
                    <p className="text-sm text-amber-700 dark:text-amber-400">points</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-red-900 dark:text-red-300 mb-2">Oops!</h2>
                  <p className="text-red-700 dark:text-red-400">{result.message}</p>
                </>
              )}
            </div>

            <Button 
              onClick={() => {
                setResult(null);
                startScanning();
              }}
              className="w-full bg-white hover:bg-gray-100 text-amber-600 py-6 text-lg font-semibold shadow-xl"
            >
              Scan Again
            </Button>

            <Link to={createPageUrl('Home')}>
              <Button 
                variant="outline"
                className="w-full border-white/30 text-white hover:bg-white/20 py-6 text-lg"
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