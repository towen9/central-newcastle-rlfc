import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useClub } from '@/contexts/ClubContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CheckCircle, AlertCircle, ArrowLeft, Zap, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import CheckInCelebration from '../components/CheckInCelebration';
import GlassCard from '@/components/ui-kit/GlassCard';
import Eyebrow from '@/components/ui-kit/Eyebrow';
import GoldButton from '@/components/ui-kit/GoldButton';

export default function CheckIn() {
  const { club } = useClub();
  const t = club.theme;
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null); // 'success' | 'error' | null
  const [errorMessage, setErrorMessage] = useState('');
  const [user, setUser] = useState(null);
  const [celebration, setCelebration] = useState(null);
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
      const clubQRs = await base44.entities.ClubQRCode.filter({ club_id: club.id, qr_id: parsed.id, is_active: true });
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

      // Award points for check-in
      const pointsEarned = club.celebration.points_per_checkin;
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
      setCelebration({ pointsEarned: club.celebration.points_per_checkin, streak: (membership?.total_checkins || 0) + 1 });
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

  // Block non-members after all hooks
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
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
              <QrCode className="w-8 h-8 text-white/40" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: t.fontBody }}>Members Only</h2>
            <p className="text-white/50 mb-6" style={{ fontFamily: t.fontBody }}>Check-ins are exclusive to membership holders.</p>
            <Link to={createPageUrl('Membership')}>
              <GoldButton>View Memberships</GoldButton>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-24">
      {/* Header */}
      <div className="pt-safe px-5 py-4 flex items-center gap-4">
        <Link to={createPageUrl('Home')}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <ArrowLeft className="w-5 h-5 text-white" />
          </div>
        </Link>
        <div>
          <Eyebrow color={t.gold}>Check-in</Eyebrow>
          <h1 className="text-white text-xl" style={{ fontFamily: t.fontDisplay }}>Scan Club QR</h1>
        </div>
      </div>

      <div className="px-5 py-6">
        {/* Today's Status */}
        <GlassCard className="p-4 mb-6" style={hasCheckedInToday ? { borderColor: `${t.green}55` } : {}}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: hasCheckedInToday ? `${t.green}22` : 'rgba(255,255,255,0.06)' }}>
              {hasCheckedInToday ? (
                <CheckCircle className="w-5 h-5" style={{ color: t.green }} />
              ) : (
                <Zap className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.4)' }} />
              )}
            </div>
            <div>
              <p className="font-semibold text-white text-sm" style={{ fontFamily: t.fontBody }}>
                {hasCheckedInToday ? 'Checked in today!' : 'No check-in yet today'}
              </p>
              <p className="text-xs" style={{ color: hasCheckedInToday ? t.green : 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>
                {hasCheckedInToday 
                  ? `${todayCheckins.length} check-in${todayCheckins.length > 1 ? 's' : ''} recorded`
                  : 'Scan a club QR code to earn points'
                }
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Camera View or Result */}
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <GlassCard className="p-8 text-center" style={result === 'success' ? { borderColor: `${t.green}55` } : { borderColor: '#ef444455' }}>
                <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: result === 'success' ? `${t.green}22` : 'rgba(239,68,68,0.15)' }}>
                  {result === 'success' ? (
                    <CheckCircle className="w-10 h-10" style={{ color: t.green }} />
                  ) : (
                    <AlertCircle className="w-10 h-10" style={{ color: '#ef4444' }} />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: t.fontBody }}>
                  {result === 'success' ? 'Check-in Successful!' : 'Check-in Failed'}
                </h2>
                <p className="mb-6" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: t.fontBody }}>
                  {result === 'success' 
                    ? 'You earned 10 points. Keep collecting for rewards!'
                    : errorMessage
                  }
                </p>
                <GoldButton
                  onClick={() => {
                    setResult(null);
                    setErrorMessage('');
                  }}
                >
                  {result === 'success' ? 'Done' : 'Try Again'}
                </GoldButton>
              </GlassCard>
            </motion.div>
          ) : scanning ? (
            <motion.div
              key="scanner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative rounded-3xl overflow-hidden bg-black aspect-square"
            >
              {/* Camera feed — full contrast, no glass overlay */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Scanner overlay frame — on the video, no glass */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-white/50 rounded-2xl">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl" />
                </div>
              </div>

              {/* Cancel button — Broadcast styled chrome, below the video */}
              <div className="absolute bottom-4 left-4 right-4">
                <Button
                  onClick={stopScanning}
                  variant="secondary"
                  className="w-full"
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
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
            >
              <GlassCard className="p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: `${t.gold}22` }}>
                  <Camera className="w-10 h-10" style={{ color: t.gold }} />
                </div>
                <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: t.fontBody }}>Ready to Check In?</h2>
                <p className="mb-6" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>
                  Point your camera at the club's QR code to check in and earn 10 points
                </p>
                <div className="space-y-3">
                  <GoldButton fullWidth onClick={startScanning}>
                    <Camera className="w-5 h-5" />
                    Start Scanning
                  </GoldButton>
                  
                  {/* Demo button for testing */}
                  <Button
                    onClick={handleDemoCheckIn}
                    variant="outline"
                    className="w-full"
                    disabled={checkInMutation.isPending}
                    style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'white', background: 'transparent' }}
                  >
                    Demo Check-in (Testing)
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current Points */}
        {membership && (
          <GlassCard className="mt-6 p-4" style={{ borderColor: `${t.gold}33` }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-white text-sm" style={{ fontFamily: t.fontBody }}>Your Points</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>Keep checking in for rewards</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold" style={{ color: t.gold, fontFamily: t.fontDisplay }}>{membership.points || 0}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: t.fontBody }}>points</p>
              </div>
            </div>
          </GlassCard>
        )}
      </div>
      {celebration && (
        <CheckInCelebration
          pointsEarned={celebration.pointsEarned}
          streak={celebration.streak}
          onDismiss={() => setCelebration(null)}
        />
      )}
    </div>
  );
}