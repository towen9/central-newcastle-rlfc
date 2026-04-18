import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, CheckCircle, XCircle, User, Calendar, Shield, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import jsQR from 'jsqr';
import { format } from 'date-fns';

export default function GateScan() {
  const [user, setUser] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scannedMember, setScannedMember] = useState(null);
  const [membershipData, setMembershipData] = useState(null);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [checkInDenied, setCheckInDenied] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const handleQRCodeScannedRef = useRef(null);
  const startScanningRef = useRef(null);
  const isProcessingRef = useRef(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        if (userData.role !== 'gate_staff' && userData.role !== 'admin') {
          toast.error('Access denied - Gate staff only');
          window.location.href = '/';
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

  const checkInMutation = useMutation({
    mutationFn: async ({ membershipId, userId, membership }) => {
      // Handle Day Pass check-in
      if (membership.is_day_pass) {
        await base44.entities.GameDayEntry.update(membership.id, {
          status: 'used',
          scanned_at: new Date().toISOString()
        });
        return { dayPass: true };
      }

      const isSupporter = membership.tier_name?.includes('Supporter Pack');
      const isFamilyOrPremium = membership.tier_name?.includes('Family') || membership.tier_name?.includes('Premium');
      
      // Block Supporter Pack if no games remaining
      if (isSupporter) {
        const remaining = membership.games_remaining ?? 5;
        if (remaining <= 0) {
          throw new Error('All 5 game entries have been used for this Supporter Pack');
        }
      }

      const checkIn = await base44.entities.CheckIn.create({
        user_id: userId,
        membership_id: membershipId,
        location: 'Main Gate',
        timestamp: new Date().toISOString()
      });

      // Build update object
      const updateData = {
        total_checkins: (membership.total_checkins || 0) + 1,
        games_used: (membership.games_used || 0) + 1
      };

      // Decrement games_remaining for Supporter Pack
      if (isSupporter) {
        const remaining = membership.games_remaining ?? 5;
        updateData.games_remaining = Math.max(0, remaining - 1);
      }

      // Award 10 points for Premium and Family tiers only
      let pointsEarned = 0;
      if (isFamilyOrPremium) {
        pointsEarned = 10;
        updateData.points = (membership.points || 0) + pointsEarned;
      }

      await base44.entities.Membership.update(membership.id, updateData);

      // Record points transaction only if points earned
      if (pointsEarned > 0) {
        await base44.entities.PointsTransaction.create({
          user_id: membership.user_id,
          membership_id: membership.id,
          points: pointsEarned,
          transaction_type: 'attendance',
          description: 'Game attendance',
          location: 'Gate',
          related_id: checkIn.id,
          timestamp: new Date().toISOString()
        });
      }

      return checkIn;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['checkins']);
      setCheckInSuccess(true);
      setTimeout(() => {
        setCheckInSuccess(false);
        setScannedMember(null);
        setMembershipData(null);
        startScanningRef.current?.();
      }, 2500);
    },
    onError: (error) => {
      toast.error(error.message || 'Check-in failed');
      setTimeout(() => {
        setScannedMember(null);
        setMembershipData(null);
        startScanningRef.current?.();
      }, 3000);
    }
  });

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
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
        handleQRCodeScannedRef.current?.(code.data);
        return;
      }
    }
    
    animationRef.current = requestAnimationFrame(scanQRCode);
  };

  const startScanning = async () => {
    isProcessingRef.current = false;
    try {
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
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

  // Keep ref always pointing to latest startScanning
  startScanningRef.current = startScanning;

  handleQRCodeScannedRef.current = async (qrData) => {
    stopScanning();
    isProcessingRef.current = true;
    
    try {
      console.log('QR scanned raw data:', qrData);

      // QR data format: JSON {"type":"membership","id":"...","user_id":"..."} or raw DP string
      let qrCodeId;
      try {
        const parsed = JSON.parse(qrData);
        qrCodeId = parsed.id;
      } catch {
        // Raw string (Day Pass DP... or legacy membership ID)
        qrCodeId = qrData.replace('membership:', '').trim();
      }

      console.log('Resolved qrCodeId:', qrCodeId);

      // Check if it's a Day Pass (starts with DP)
      if (qrCodeId.startsWith('DP')) {
        const allPasses = await base44.entities.GameDayEntry.list();
        const dayPass = allPasses.find(p => p.pass_qr_code === qrCodeId);
        console.log('Day pass lookup result:', dayPass);

        if (!dayPass) {
          toast.error('Day Pass not found');
          setTimeout(() => { isProcessingRef.current = false; startScanningRef.current?.(); }, 2000);
          return;
        }
        if (dayPass.status === 'used') {
          toast.error('Day Pass already used');
          setTimeout(() => { isProcessingRef.current = false; startScanningRef.current?.(); }, 2500);
          return;
        }
        if (dayPass.status === 'expired') {
          toast.error('Day Pass has expired');
          setTimeout(() => { isProcessingRef.current = false; startScanningRef.current?.(); }, 2500);
          return;
        }
        setScannedMember({ full_name: `${dayPass.first_name} ${dayPass.last_name}`.trim() || dayPass.first_name, email: dayPass.email, photo_url: dayPass.photo_url });
        setMembershipData({ ...dayPass, tier_name: 'Day Pass', status: 'active', qr_code_id: qrCodeId, is_day_pass: true });
        return;
      }

      // Otherwise try Membership
      const memberships = await base44.entities.Membership.filter({ qr_code_id: qrCodeId });
      const membership = memberships[0];
      console.log('Membership lookup result:', membership);

      if (membership) {
        // Check if already checked in today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const allCheckIns = await base44.entities.CheckIn.filter({ membership_id: membership.id });
        const checkedInToday = allCheckIns.some(c => c.timestamp && new Date(c.timestamp) >= todayStart);
        if (checkedInToday) {
          setCheckInDenied(membership.user_name || 'Member');
          setTimeout(() => {
            setCheckInDenied(false);
            startScanningRef.current?.();
          }, 3000);
          return;
        }

        let memberUser = null;
        if (membership.user_email) {
          const users = await base44.entities.User.filter({ email: membership.user_email });
          memberUser = users[0] || null;
        }
        if (!memberUser) {
          memberUser = { full_name: membership.user_name || 'Member', email: membership.user_email || '', photo_url: membership.photo_url || null };
        }
        setScannedMember(memberUser);
        setMembershipData(membership);
        return;
      }

      toast.error('Invalid QR code');
      setTimeout(() => { isProcessingRef.current = false; startScanningRef.current?.(); }, 2000);
    } catch (error) {
      console.error('QR scan error:', error);
      toast.error('Failed to verify pass: ' + error.message);
      setTimeout(() => { isProcessingRef.current = false; startScanningRef.current?.(); }, 2000);
    }
  };

  const handleCheckIn = () => {
    if (membershipData && scannedMember) {
      checkInMutation.mutate({
        membershipId: membershipData.id,
        userId: scannedMember.id,
        membership: membershipData
      });
    }
  };

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

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

  if (checkInSuccess) {
    return (
      <div className="fixed inset-0 bg-emerald-500 flex flex-col items-center justify-center z-50">
        <CheckCircle className="w-32 h-32 text-white mb-6" />
        <p className="text-white text-4xl font-extrabold mb-2">✅ LET 'EM IN!</p>
        <p className="text-emerald-100 text-xl font-semibold">{scannedMember?.full_name}</p>
        <p className="text-emerald-200 text-sm mt-2">{membershipData?.tier_name}</p>
      </div>
    );
  }

  if (checkInDenied) {
    return (
      <div className="fixed inset-0 bg-red-600 flex flex-col items-center justify-center z-50">
        <XCircle className="w-32 h-32 text-white mb-6" />
        <p className="text-white text-4xl font-extrabold mb-2">🚫 DENY ENTRY</p>
        <p className="text-red-100 text-xl font-semibold">{checkInDenied}</p>
        <p className="text-red-200 text-sm mt-2">Already checked in today</p>
      </div>
    );
  }

  return (
    <div style={{minHeight: '100dvh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: '#f9fafb'}}>
      {/* Header */}
      <div className="bg-[#1a365d] text-white" style={{paddingTop: 'env(safe-area-inset-top, 0px)'}}>
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
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-white/20">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-6">
        {!scannedMember ? (
          /* Scanner View */
          <div className="space-y-4">
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">
              <div className="relative aspect-square bg-black">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
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
              <Button 
                onClick={startScanning}
                className="w-full bg-[#1a365d] hover:bg-[#2c5282] py-6 text-lg"
              >
                <Camera className="w-6 h-6 mr-3" />
                Start Scanning
              </Button>
            ) : (
              <div className="text-center">
                <p className="text-gray-600 animate-pulse">Scanning for QR code...</p>
              </div>
            )}
          </div>
        ) : (
          /* Member Verification View */
          <div className="space-y-4">
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">
              {/* Member Photo */}
              {scannedMember.photo_url ? (
                <img 
                  src={scannedMember.photo_url}
                  alt={scannedMember.full_name}
                  className="w-full aspect-square object-cover"
                />
              ) : (
                <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
                  <User className="w-24 h-24 text-gray-300" />
                </div>
              )}

              {/* Member Info */}
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Member Name</p>
                  <p className="text-2xl font-bold text-gray-900">{scannedMember.full_name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Email</p>
                    <p className="text-sm text-gray-900">{scannedMember.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Member ID</p>
                    <p className="text-sm font-mono text-gray-900">{membershipData.qr_code_id.slice(0, 8)}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-500">Membership Status</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      membershipData.status === 'active' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {membershipData.status?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">Tier</p>
                    <p className="font-medium text-gray-900">{membershipData.tier_name}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-gray-500">Expires</p>
                    <p className="text-sm text-gray-900">
                      {membershipData.expiry_date ? format(new Date(membershipData.expiry_date), 'MMM d, yyyy') : 'N/A'}
                    </p>
                  </div>
                  {membershipData.tier_name?.includes('Supporter Pack') && (
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm text-gray-500">Games Remaining</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        (membershipData.games_remaining ?? 5) > 0 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {membershipData.games_remaining ?? 5} / 5
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {membershipData.already_checked_in ? (
                <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-5 flex items-center gap-4">
                  <XCircle className="w-10 h-10 text-orange-500 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-orange-800 text-lg">Already Checked In</p>
                    <p className="text-sm text-orange-600">This pass was already used for entry today. Access denied.</p>
                  </div>
                </div>
              ) : membershipData.status === 'active' ? (
                <Button 
                  onClick={handleCheckIn}
                  disabled={checkInMutation.isPending}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 py-6 text-lg"
                >
                  <CheckCircle className="w-6 h-6 mr-3" />
                  {checkInMutation.isPending ? 'Checking In...' : 'Check In Member'}
                </Button>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                  <XCircle className="w-6 h-6 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-800">Membership Not Active</p>
                    <p className="text-sm text-red-600">This member cannot be checked in</p>
                  </div>
                </div>
              )}

              <Button 
                onClick={() => {
                  setScannedMember(null);
                  setMembershipData(null);
                  startScanningRef.current?.();
                }}
                variant="outline"
                className="w-full py-6 text-lg"
              >
                Scan Another Member
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}