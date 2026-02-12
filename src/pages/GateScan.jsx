import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, CheckCircle, XCircle, User, Calendar, Shield, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import jsQR from 'jsqr';
import { format } from 'date-fns';

export default function GateScan() {
  const [user, setUser] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scannedMember, setScannedMember] = useState(null);
  const [membershipData, setMembershipData] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
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
      const checkIn = await base44.entities.CheckIn.create({
        user_id: userId,
        membership_id: membershipId,
        location: 'Main Gate',
        timestamp: new Date().toISOString()
      });

      // Award 10 points for attendance
      const pointsEarned = 10;
      
      await base44.entities.Membership.update(membership.id, {
        stamps: (membership.stamps || 0) + 1,
        points: (membership.points || 0) + pointsEarned,
        total_checkins: (membership.total_checkins || 0) + 1
      });

      // Record points transaction
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

      return checkIn;
    },
    onSuccess: () => {
      toast.success('Member checked in! +10 points awarded');
      queryClient.invalidateQueries(['checkins']);
      setTimeout(() => {
        setScannedMember(null);
        setMembershipData(null);
        startScanning();
      }, 2000);
    }
  });

  const startScanning = async () => {
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
    
    try {
      // QR data format: "membership:{membership_id}"
      const membershipId = qrData.replace('membership:', '');
      
      const [membership] = await base44.entities.Membership.filter({ qr_code_id: membershipId });
      
      if (!membership) {
        toast.error('Invalid membership QR code');
        setTimeout(startScanning, 2000);
        return;
      }

      const [memberUser] = await base44.entities.User.filter({ id: membership.user_id });
      
      setScannedMember(memberUser);
      setMembershipData(membership);
    } catch (error) {
      toast.error('Failed to verify membership');
      setTimeout(startScanning, 2000);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1a365d] text-white">
        <div className="px-5 py-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Shield className="w-10 h-10" />
              <div>
                <h1 className="text-xl font-bold">Gate Scanner</h1>
                <p className="text-blue-200 text-sm">{user.full_name}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-white/20">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
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
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {membershipData.status === 'active' ? (
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
                  startScanning();
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