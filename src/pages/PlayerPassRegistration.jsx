import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, CheckCircle2, Camera, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { useClub } from '@/contexts/ClubContext';
import GlassCard from '@/components/ui-kit/GlassCard';
import Eyebrow from '@/components/ui-kit/Eyebrow';
import GoldButton from '@/components/ui-kit/GoldButton';
import { SkeletonCard } from '@/components/ui-kit/Skeleton';

export default function PlayerPassRegistration() {
  const { club } = useClub();
  const t = club.theme;
  const [user, setUser] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'photo'
  const [photoDataUrl, setPhotoDataUrl] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    player_number: ''
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        setFormData(prev => ({
          ...prev,
          full_name: userData.full_name || '',
          email: userData.email || ''
        }));
      } catch (error) {
        // Not logged in, that's ok
      }
    };
    loadUser();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode, width: { ideal: 640 }, height: { ideal: 640 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      toast.error('Camera access denied. Please allow camera access and try again.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');
    // Mirror if front camera
    if (facingMode === 'user') {
      ctx.translate(640, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, 640, 640);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPhotoDataUrl(dataUrl);
    stopCamera();
  };

  const retakePhoto = () => {
    setPhotoDataUrl(null);
    startCamera();
  };

  const flipCamera = async () => {
    stopCamera();
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacing);
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: newFacing } 
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraActive(true);
      } catch (err) {
        toast.error('Could not switch camera');
      }
    }, 300);
  };

  useEffect(() => {
    if (step === 'photo' && !photoDataUrl) {
      startCamera();
    }
    return () => {
      if (step !== 'photo') stopCamera();
    };
  }, [step]);

  useEffect(() => () => stopCamera(), []);

  const registrationMutation = useMutation({
    mutationFn: async (data) => {
      // Find the Player Pass tier
      const tiers = await base44.entities.MembershipTier.filter({ club_id: club.id, name: '2026 Player Pass' });
      if (!tiers || tiers.length === 0) {
        throw new Error('Player Pass tier not found. Please contact admin.');
      }
      const tier = tiers[0];

      // Create pending membership
      const qrCodeId = `PLAYER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Upload photo if captured
      let photoUrl = null;
      if (data.photoDataUrl) {
        const blob = await (await fetch(data.photoDataUrl)).blob();
        const file = new File([blob], 'player-photo.jpg', { type: 'image/jpeg' });
        const uploadResult = await base44.integrations.Core.UploadFile({ file });
        photoUrl = uploadResult.file_url;
      }

      const membershipData = {
        club_id: club.id,
        user_id: user?.id || 'pending',
        user_email: data.email,
        user_name: data.full_name,
        tier_id: tier.id,
        tier_name: tier.name,
        start_date: new Date().toISOString().split('T')[0],
        expiry_date: new Date('2026-12-31').toISOString().split('T')[0],
        status: 'pending',
        qr_code_id: qrCodeId,
        stamps: 0,
        points: 0,
        total_checkins: 0,
        ...(photoUrl && { photo_url: photoUrl })
      };

      // Create the membership
      await base44.entities.Membership.create(membershipData);

      // Send notification email to admin
      try {
        await base44.integrations.Core.SendEmail({
          to: 'admin@centralrlfc.com',
          subject: `${club.identity.sport_emoji} New Player Pass Application`,
          body: `
            A new player pass application has been submitted:
            
            Name: ${data.full_name}
            Email: ${data.email}
            Phone: ${data.phone}
            Player Number: ${data.player_number}
            
            Please review and approve in the Admin Dashboard > Members section.
          `
        });
      } catch (emailError) {
        console.error('Failed to send admin notification', emailError);
      }

      return membershipData;
    },
    onSuccess: () => {
      setSubmitted(true);
      toast.success('Application submitted! Awaiting admin approval.');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit application');
    }
  });

  const handleFormNext = (e) => {
    e.preventDefault();
    setStep('photo');
  };

  const handleSubmit = () => {
    if (!photoDataUrl) {
      toast.error('Please take a photo first');
      return;
    }
    registrationMutation.mutate({ ...formData, photoDataUrl });
  };

  if (submitted) {
    return (
      <div className="min-h-full flex items-center justify-center p-6" style={{ background: `radial-gradient(ellipse at top, ${t.bg1} 0%, ${t.bg0} 70%)` }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <GlassCard className="p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: `${t.green}22` }}>
              <CheckCircle2 className="w-10 h-10" style={{ color: t.green }} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: t.fontBody }}>Application Submitted!</h2>
            <p className="mb-6" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: t.fontBody }}>
              Your 2026 Player Pass application has been submitted for admin approval. 
              You'll receive an email once it's been reviewed.
            </p>
            <Link to={createPageUrl('Home')}>
              <GoldButton fullWidth>Back to Home</GoldButton>
            </Link>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="px-5 py-6 space-y-4" style={{ minHeight: '100dvh', paddingBottom: '6rem' }}>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="min-h-full pb-24">
      {/* Header */}
      <div className="pt-safe px-5 py-6">
        {step === 'photo' ? (
          <button onClick={() => { stopCamera(); setStep('form'); }} className="flex items-center gap-2 mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm" style={{ fontFamily: t.fontBody }}>Back</span>
          </button>
        ) : (
          <Link to={createPageUrl('Home')}>
            <button className="flex items-center gap-2 mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm" style={{ fontFamily: t.fontBody }}>Back</span>
            </button>
          </Link>
        )}
        <Eyebrow color={t.gold}>2026 Season</Eyebrow>
        <h1 className="text-white text-2xl mb-2" style={{ fontFamily: t.fontDisplay }}>Player Pass</h1>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>
          {step === 'form' ? 'Step 1 of 2 — Your details' : 'Step 2 of 2 — Player photo'}
        </p>
      </div>

      <div className="px-5 py-6 max-w-2xl mx-auto">
        {/* Step 1: Form */}
        {step === 'form' && (
          <>
            <GlassCard className="p-4 mb-6">
              <p className="text-sm" style={{ color: t.goldHi, fontFamily: t.fontBody }}>
                {club.identity.sport_emoji} This pass is for {club.identity.club_name} players (Men's & Women's). 
                Your application will be reviewed by admin before activation.
              </p>
            </GlassCard>

            <form onSubmit={handleFormNext}>
              <GlassCard className="p-6 space-y-5">
                <div>
                  <Label htmlFor="full_name" className="mb-1 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Your full name"
                    required
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="mb-1 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your.email@example.com"
                    required
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="mb-1 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Mobile Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="04XX XXX XXX"
                    required
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}
                  />
                </div>

                <GoldButton type="submit" fullWidth style={{ padding: '16px 20px' }}>
                  Next — Take Your Photo →
                </GoldButton>
              </GlassCard>
            </form>
          </>
        )}

        {/* Step 2: Photo */}
        {step === 'photo' && (
          <GlassCard className="p-6 space-y-5">
            <div className="text-center mb-2">
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: t.fontBody }}>Player Photo</h2>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>This photo will appear on your digital pass for identity verification at the gate.</p>
            </div>

            {!photoDataUrl ? (
              <div className="space-y-4">
                {/* Camera viewfinder — full contrast, no glass overlay on the feed */}
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-square w-full max-w-xs mx-auto">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                  />
                  {/* Face guide overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-40 h-48 border-4 border-white/60 rounded-full" />
                  </div>
                  {!cameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                </div>

                <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>Position your face in the circle • Good lighting • Look at the camera</p>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={flipCamera}
                    className="flex-1"
                    style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'white', background: 'transparent' }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Flip
                  </Button>
                  <GoldButton
                    type="button"
                    onClick={capturePhoto}
                    disabled={!cameraActive}
                    className="flex-1"
                  >
                    <Camera className="w-4 h-4" />
                    Take Photo
                  </GoldButton>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Preview — full contrast, no glass */}
                <div className="relative rounded-2xl overflow-hidden aspect-square w-full max-w-xs mx-auto">
                  <img src={photoDataUrl} alt="Your photo" className="w-full h-full object-cover" />
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-3 py-1 rounded-full" style={{ background: t.green }}>
                    ✓ Photo taken
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={retakePhoto}
                  className="w-full"
                  style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'white', background: 'transparent' }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retake Photo
                </Button>

                <GoldButton
                  type="button"
                  onClick={handleSubmit}
                  disabled={registrationMutation.isPending}
                  fullWidth
                  style={{ padding: '16px 20px' }}
                >
                  {registrationMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </GoldButton>
              </div>
            )}
          </GlassCard>
        )}

        <div className="mt-6">
          <GlassCard className="p-4">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: t.fontBody }}>
              <strong>Note:</strong> This is a free pass for registered players. 
              Admin approval is required before your pass becomes active.
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}