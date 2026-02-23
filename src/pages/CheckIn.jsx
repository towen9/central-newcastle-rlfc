import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CheckCircle, AlertCircle, ArrowLeft, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

export default function CheckIn() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null); // 'success' | 'error' | null
  const [errorMessage, setErrorMessage] = useState('');
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: membership } = useQuery({
    queryKey: ['membership', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const memberships = await base44.entities.Membership.filter({ user_id: user.id, status: 'active' });
      return memberships[0] || null;
    },
    enabled: !!user?.id
  });

  // Block day pass holders from check-ins
  if (user && !membership) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-[#1a365d] pt-safe">
          <div className="px-5 py-4 flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-white" />
              </div>
            </Link>
          </div>
        </div>
        <div className="px-5 py-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <QrCode className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Members Only</h2>
          <p className="text-gray-600 mb-6">Check-ins are exclusive to membership holders.</p>
          <Link to={createPageUrl('Membership')}>
            <Button className="bg-[#1a365d] hover:bg-[#2c5282]">
              View Memberships
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { data: todayCheckins = [] } = useQuery({
    queryKey: ['todayCheckins', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const today = new Date().toISOString().split('T')[0];
      const checkins = await base44.entities.CheckIn.filter({ user_id: user.id });
      return checkins.filter(c => c.timestamp?.startsWith(today));
    },
    enabled: !!user?.id
  });

  const checkInMutation = useMutation({
    mutationFn: async (qrData) => {
      // Parse QR data
      let parsed;
      try {
        parsed = JSON.parse(qrData);
      } catch {
        throw new Error('Invalid QR code');
      }

      if (parsed.type !== 'checkin') {
        throw new Error('This is not a check-in QR code');
      }

      // Verify club QR exists
      const clubQRs = await base44.entities.ClubQRCode.filter({ qr_id: parsed.id, is_active: true });
      if (clubQRs.length === 0) {
        throw new Error('Invalid or inactive check-in location');
      }

      // Check for duplicate check-in today
      if (todayCheckins.some(c => c.location_qr_id === parsed.id)) {
        throw new Error('You have already checked in at this location today');
      }

      // Create check-in
      await base44.entities.CheckIn.create({
        user_id: user.id,
        membership_id: membership.id,
        location: clubQRs[0].name,
        location_qr_id: parsed.id,
        timestamp: new Date().toISOString()
      });

      // Award points for check-in (10 points)
      const pointsEarned = 10;
      await base44.entities.Membership.update(membership.id, {
        points: (membership.points || 0) + pointsEarned,
        total_checkins: (membership.total_checkins || 0) + 1
      });

      // Create points transaction
      await base44.entities.PointsTransaction.create({
        user_id: user.id,
        membership_id: membership.id,
        points: pointsEarned,
        transaction_type: 'attendance',
        description: `Check-in at ${clubQRs[0].name}`,
        location: clubQRs[0].name,
        location_qr_id: parsed.id,
        timestamp: new Date().toISOString()
      });

      return clubQRs[0].name;
    },
    onSuccess: (location) => {
      setResult('success');
      queryClient.invalidateQueries(['membership']);
      queryClient.invalidateQueries(['todayCheckins']);
    },
    onError: (error) => {
      setResult('error');
      setErrorMessage(error.message);
    }
  });

  const startScanning = async () => {
    setScanning(true);
    setResult(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      setResult('error');
      setErrorMessage('Could not access camera. Please enable camera permissions.');
      setScanning(false);
    }
  };

  const stopScanning = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setScanning(false);
  };

  // Demo check-in for testing
  const handleDemoCheckIn = () => {
    if (!membership) {
      setResult('error');
      setErrorMessage('You need an active membership to check in');
      return;
    }
    checkInMutation.mutate(JSON.stringify({ type: 'checkin', id: 'DEMO-CLUBHOUSE' }));
  };

  const hasCheckedInToday = todayCheckins.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-[#1a365d] pt-safe">
        <div className="px-5 py-4 flex items-center gap-4">
          <Link to={createPageUrl('Home')}>
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </div>
          </Link>
          <div>
            <h1 className="text-white text-xl font-bold">Check In</h1>
            <p className="text-blue-200 text-sm">Scan the club QR code</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-6">
        {/* Today's Status */}
        <div className={`rounded-2xl p-4 mb-6 ${
          hasCheckedInToday ? 'bg-emerald-50 border border-emerald-200' : 'bg-white border border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              hasCheckedInToday ? 'bg-emerald-500' : 'bg-gray-200'
            }`}>
              {hasCheckedInToday ? (
                <CheckCircle className="w-5 h-5 text-white" />
              ) : (
                <Zap className="w-5 h-5 text-gray-500" />
              )}
            </div>
            <div>
              <p className={`font-semibold ${hasCheckedInToday ? 'text-emerald-800' : 'text-gray-700'}`}>
                {hasCheckedInToday ? 'Checked in today!' : 'No check-in yet today'}
              </p>
              <p className={`text-sm ${hasCheckedInToday ? 'text-emerald-600' : 'text-gray-500'}`}>
                {hasCheckedInToday 
                  ? `${todayCheckins.length} check-in${todayCheckins.length > 1 ? 's' : ''} recorded`
                  : 'Scan a club QR code to earn points'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Camera View or Result */}
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`rounded-3xl p-8 text-center ${
                result === 'success' ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            >
              <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                {result === 'success' ? (
                  <CheckCircle className="w-10 h-10 text-white" />
                ) : (
                  <AlertCircle className="w-10 h-10 text-white" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {result === 'success' ? 'Check-in Successful!' : 'Check-in Failed'}
              </h2>
              <p className="text-white/80 mb-6">
                {result === 'success' 
                  ? 'You earned 10 points. Keep collecting for rewards!'
                  : errorMessage
                }
              </p>
              <Button
                onClick={() => {
                  setResult(null);
                  setErrorMessage('');
                }}
                className="bg-white text-gray-900 hover:bg-white/90"
              >
                {result === 'success' ? 'Done' : 'Try Again'}
              </Button>
            </motion.div>
          ) : scanning ? (
            <motion.div
              key="scanner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative rounded-3xl overflow-hidden bg-black aspect-square"
            >
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Scanner overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-white/50 rounded-2xl">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl" />
                </div>
              </div>

              <div className="absolute bottom-4 left-4 right-4">
                <Button
                  onClick={stopScanning}
                  variant="secondary"
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-3xl p-8 text-center border border-gray-200"
            >
              <div className="w-20 h-20 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                <Camera className="w-10 h-10 text-blue-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Ready to Check In?</h2>
              <p className="text-gray-500 mb-6">
                Point your camera at the club's QR code to check in and earn 10 points
              </p>
              <div className="space-y-3">
                <Button
                  onClick={startScanning}
                  className="w-full bg-[#1a365d] hover:bg-[#2c5282]"
                  size="lg"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Start Scanning
                </Button>
                
                {/* Demo button for testing */}
                <Button
                  onClick={handleDemoCheckIn}
                  variant="outline"
                  className="w-full"
                  disabled={checkInMutation.isPending}
                >
                  Demo Check-in (Testing)
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current Points */}
        {membership && (
          <div className="mt-6 bg-amber-50 rounded-2xl p-4 border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-800 font-semibold">Your Points</p>
                <p className="text-amber-600 text-sm">Keep checking in for rewards</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-amber-600">{membership.points || 0}</p>
                <p className="text-xs text-amber-500">points</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}