import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Ticket, Calendar, MapPin, Check, ArrowLeft, Loader2, Camera, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, Navigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import DayPassDetailsForm from '../components/daypass/DayPassDetailsForm';
import { useClub } from '@/contexts/ClubContext';
import GlassCard from '@/components/ui-kit/GlassCard';

export default function DayPass() {
  const { club } = useClub();
  const t = club.theme;
  const [user, setUser] = useState(null);
  const [selectedFixture, setSelectedFixture] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [createdPass, setCreatedPass] = useState(null);
  const [detailsStep, setDetailsStep] = useState(false);
  const [photoStep, setPhotoStep] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: upcomingFixtures = [] } = useQuery({
    queryKey: ['upcomingFixtures'],
    queryFn: async () => {
      const now = new Date();

      const fixtures = await base44.entities.Fixture.filter({
        fixture_type: 'home'
      }, 'date_time');

      return fixtures.filter(f => {
        const fixtureDate = new Date(f.date_time);
        return fixtureDate > now && f.status !== 'cancelled' && f.status !== 'postponed';
      });
    }
  });

  const { data: dayPassTiers = [] } = useQuery({
    queryKey: ['dayPassTier'],
    queryFn: () => base44.entities.MembershipTier.filter({ is_active: true }, 'sort_order')
  });
  const dayPassTier = dayPassTiers.find(tier => tier.name?.toLowerCase().includes('day pass'));

  const { data: existingPass } = useQuery({
    queryKey: ['myDayPass', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const passes = await base44.entities.GameDayEntry.filter({
        user_id: user.id
      }, '-entry_timestamp');

      return passes.find(p => p.status === 'valid') || null;
    },
    enabled: !!user?.id
  });

  const handlePurchase = async (fixture) => {
    setSelectedFixture(fixture);
    setProcessing(true);

    try {
      if (window.self !== window.top) {
        toast.error('Please open this page in a new tab to complete checkout');
        setProcessing(false);
        return;
      }

      const { data } = await base44.functions.invoke('createDayPassCheckout', {
        fixture_id: fixture.id,
        success_url: `${window.location.origin}${createPageUrl('DayPass')}?payment=success&session_id={CHECKOUT_SESSION_ID}&fixture=${fixture.id}`,
        cancel_url: `${window.location.origin}${createPageUrl('DayPass')}?payment=cancelled`
      });

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (error) {
      toast.error('Failed to start checkout');
      setProcessing(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      const sessionId = params.get('session_id');
      window.history.replaceState({}, '', window.location.pathname);

      if (sessionId) {
        setVerifying(true);
        base44.functions.invoke('verifyDayPassPayment', { session_id: sessionId })
          .then((res) => {
            queryClient.invalidateQueries(['myDayPass']);
            if (res?.data?.pass) {
              setCreatedPass(res.data.pass);
              const p = res.data.pass;
              if (!p.mobile && !p.completion_skipped) {
                setDetailsStep(true);
              }
            }
            setPaymentSuccess(true);
          })
          .catch((err) => {
            console.error('Verify failed:', err);
            setPaymentSuccess(true);
          })
          .finally(() => setVerifying(false));
      } else {
        setPaymentSuccess(true);
      }
    }
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch {
      toast.error('Could not access camera');
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
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  const submitPhoto = async () => {
    if (!capturedPhoto || !createdPass) return;
    setUploadingPhoto(true);
    try {
      const blob = await fetch(capturedPhoto).then(r => r.blob());
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.GameDayEntry.update(createdPass.id, { photo_url: file_url });
      queryClient.invalidateQueries(['myDayPass']);
      window.location.reload();
    } catch {
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (!club.features?.day_pass) {
    return <Navigate to={createPageUrl('Home')} replace />;
  }

  if (verifying || paymentSuccess) {
    if (paymentSuccess && !verifying && detailsStep && createdPass) {
      const needsForm = !createdPass.mobile && !createdPass.completion_skipped;
      if (needsForm) {
        return (
          <DayPassDetailsForm
            pass={createdPass}
            user={user}
            onComplete={() => setDetailsStep(false)}
          />
        );
      }
    }

    if (paymentSuccess && photoStep) {
      return (
        <div className="relative flex flex-col pb-24" style={{ minHeight: '100dvh', background: `radial-gradient(ellipse at top, ${t.bg1} 0%, ${t.bg0} 70%)` }}>
          <div className="px-4 pt-6 pb-2">
            <h1 className="text-white text-2xl" style={{ fontFamily: t.fontDisplay }}>One Last Step</h1>
            <p className="text-white/50" style={{ fontFamily: t.fontBody }}>Take a photo for your pass</p>
          </div>
          <div className="px-4 py-6">
            <GlassCard className="p-4 mb-6">
              <p className="text-sm text-white/70 text-center" style={{ fontFamily: t.fontBody }}>
                Your photo is used to verify your identity at the gate. Make sure it's a clear face photo.
              </p>
            </GlassCard>

            {!capturedPhoto ? (
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden aspect-square relative" style={{ background: '#000' }}>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  {!cameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: t.bg0 }}>
                      <Camera className="w-16 h-16 text-white/30" />
                    </div>
                  )}
                </div>
                {!cameraActive ? (
                  <Button onClick={startCamera} className="w-full py-6 text-base" style={{ background: `linear-gradient(135deg, ${t.gold}, ${t.goldHi})`, color: t.bg0 }}>
                    <Camera className="w-5 h-5 mr-2" />
                    Open Camera
                  </Button>
                ) : (
                  <Button onClick={capturePhoto} className="w-full py-6 text-base" style={{ background: t.green, color: '#fff' }}>
                    Take Photo
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden aspect-square">
                  <img src={capturedPhoto} alt="Your photo" className="w-full h-full object-cover" />
                </div>
                <Button
                  onClick={submitPhoto}
                  disabled={uploadingPhoto}
                  className="w-full py-6 text-base"
                  style={{ background: t.green, color: '#fff' }}
                >
                  {uploadingPhoto ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Saving...</> : 'Use This Photo'}
                </Button>
                <Button
                  onClick={() => { setCapturedPhoto(null); startCamera(); }}
                  variant="outline"
                  className="w-full py-6"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retake
                </Button>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="relative flex flex-col pb-24" style={{ minHeight: '100dvh', background: `radial-gradient(ellipse at top, ${t.bg1} 0%, ${t.bg0} 70%)` }}>
        <div className="px-4 pt-6 pb-2">
          <h1 className="text-white text-2xl" style={{ fontFamily: t.fontDisplay }}>Payment Successful!</h1>
          <p className="text-white/50" style={{ fontFamily: t.fontBody }}>{verifying ? 'Setting up your pass...' : 'One more step required'}</p>
        </div>
        <div className="px-4 py-10 flex flex-col items-center text-center">
          {verifying ? (
            <>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: `${t.gold}22` }}>
                <Loader2 className="w-10 h-10 animate-spin" style={{ color: t.gold }} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: t.fontBody }}>Setting up your pass...</h2>
              <p className="text-white/50 text-sm" style={{ fontFamily: t.fontBody }}>Just a moment while we confirm your payment.</p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: `${t.green}22` }}>
                <Check className="w-10 h-10" style={{ color: t.green }} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: t.fontBody }}>Payment confirmed!</h2>
              <GlassCard className="p-4 mb-6 text-left w-full" style={{ borderColor: `${t.gold}44` }}>
                <p className="text-sm font-bold mb-1" style={{ color: t.gold, fontFamily: t.fontBody }}>Photo required to activate your pass</p>
                <p className="text-sm text-white/60" style={{ fontFamily: t.fontBody }}>Gate staff will check your photo to verify it's you. No photo = no entry.</p>
              </GlassCard>
              <Button
                onClick={() => setPhotoStep(true)}
                className="w-full py-6 text-base"
                style={{ background: `linear-gradient(135deg, ${t.gold}, ${t.goldHi})`, color: t.bg0 }}
              >
                <Camera className="w-5 h-5 mr-2" />
                Take My Photo Now
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (existingPass) {
    if (!existingPass.photo_url && photoStep) {
      return (
        <div className="relative flex flex-col pb-24" style={{ minHeight: '100dvh', background: `radial-gradient(ellipse at top, ${t.bg1} 0%, ${t.bg0} 70%)` }}>
          <div className="px-4 pt-6 pb-2">
            <h1 className="text-white text-2xl" style={{ fontFamily: t.fontDisplay }}>Add Your Photo</h1>
            <p className="text-white/50" style={{ fontFamily: t.fontBody }}>Required for gate entry verification</p>
          </div>
          <div className="px-4 py-6">
            <GlassCard className="p-4 mb-6">
              <p className="text-sm text-white/70 text-center" style={{ fontFamily: t.fontBody }}>
                Gate staff need your photo to verify it's you. Please take a clear face photo.
              </p>
            </GlassCard>

            {!capturedPhoto ? (
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden aspect-square relative" style={{ background: '#000' }}>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  {!cameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: t.bg0 }}>
                      <Camera className="w-16 h-16 text-white/30" />
                    </div>
                  )}
                </div>
                {!cameraActive ? (
                  <Button onClick={startCamera} className="w-full py-6 text-base" style={{ background: `linear-gradient(135deg, ${t.gold}, ${t.goldHi})`, color: t.bg0 }}>
                    <Camera className="w-5 h-5 mr-2" />Open Camera
                  </Button>
                ) : (
                  <Button onClick={capturePhoto} className="w-full py-6 text-base" style={{ background: t.green, color: '#fff' }}>
                    Take Photo
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden aspect-square">
                  <img src={capturedPhoto} alt="Your photo" className="w-full h-full object-cover" />
                </div>
                <Button
                  onClick={async () => {
                    setUploadingPhoto(true);
                    try {
                      const blob = await fetch(capturedPhoto).then(r => r.blob());
                      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
                      const { file_url } = await base44.integrations.Core.UploadFile({ file });
                      await base44.entities.GameDayEntry.update(existingPass.id, { photo_url: file_url });
                      queryClient.invalidateQueries(['myDayPass']);
                      window.location.href = createPageUrl('MyDayPass') + `?passId=${existingPass.id}`;
                    } catch {
                      toast.error('Failed to upload photo');
                    } finally {
                      setUploadingPhoto(false);
                    }
                  }}
                  disabled={uploadingPhoto}
                  className="w-full py-6 text-base"
                  style={{ background: t.green, color: '#fff' }}
                >
                  {uploadingPhoto ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Saving...</> : 'Use This Photo'}
                </Button>
                <Button onClick={() => { setCapturedPhoto(null); startCamera(); }} variant="outline" className="w-full py-6">
                  <RefreshCw className="w-4 h-4 mr-2" />Retake
                </Button>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (!existingPass.photo_url) {
      if (!photoStep) {
        setTimeout(() => setPhotoStep(true), 100);
      }
      return (
        <div className="relative flex flex-col pb-24" style={{ minHeight: '100dvh', background: `radial-gradient(ellipse at top, ${t.bg1} 0%, ${t.bg0} 70%)` }}>
          <div className="px-4 pt-6 pb-2">
            <h1 className="text-white text-2xl mb-2" style={{ fontFamily: t.fontDisplay }}>Photo Required</h1>
            <p className="text-white/50" style={{ fontFamily: t.fontBody }}>You cannot enter without a photo on your pass</p>
          </div>
          <div className="px-4 py-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: 'rgba(239,68,68,0.15)' }}>
              <Camera className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-3" style={{ fontFamily: t.fontBody }}>No Photo on Your Pass</h2>
            <p className="text-white/50 text-sm mb-8" style={{ fontFamily: t.fontBody }}>Gate staff must verify your identity. A clear face photo is required before you can use your pass.</p>
            <Button onClick={() => setPhotoStep(true)} className="w-full py-6 text-base" style={{ background: `linear-gradient(135deg, ${t.gold}, ${t.goldHi})`, color: t.bg0 }}>
              <Camera className="w-5 h-5 mr-2" />
              Take My Photo Now
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="relative flex flex-col pb-24" style={{ minHeight: '100dvh', background: `radial-gradient(ellipse at top, ${t.bg1} 0%, ${t.bg0} 70%)` }}>
        <div className="px-4 pt-6 pb-2">
          <h1 className="text-white text-2xl mb-2" style={{ fontFamily: t.fontDisplay }}>My Day Pass</h1>
          <p className="text-white/50" style={{ fontFamily: t.fontBody }}>Your digital pass is ready to use on game day</p>
        </div>
        <div className="px-4 py-6">
          <Button
            onClick={() => window.location.href = createPageUrl('MyDayPass') + `?passId=${existingPass.id}`}
            className="w-full py-6"
            style={{ background: t.green, color: '#fff' }}
          >
            View My Pass
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col pb-24" style={{ minHeight: '100dvh', background: `radial-gradient(ellipse at top, ${t.bg1} 0%, ${t.bg0} 70%)` }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <Link to={createPageUrl('Home')}>
          <button className="flex items-center gap-2 mb-4" style={{ color: t.gold }}>
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm" style={{ fontFamily: t.fontBody }}>Back</span>
          </button>
        </Link>
        <img
          src={club.identity.logo_url}
          alt={club.identity.club_name}
          className="w-16 h-16 mb-4 bg-white rounded-full p-2"
        />
        <h1 className="text-white text-2xl mb-2" style={{ fontFamily: t.fontDisplay }}>Day Pass</h1>
        <p className="text-white/50" style={{ fontFamily: t.fontBody }}>Single entry to upcoming home games</p>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Features */}
        <GlassCard className="p-6">
          <h3 className="font-bold text-white mb-4" style={{ fontFamily: t.fontBody }}>What's Included</h3>
          <div className="space-y-3">
            {[
              'Digital QR pass with your photo',
              'Entry to the selected home game',
              'Special game-day offers & promotions',
              'Exclusive deals from our partners',
              'Access your QR pass immediately after purchase'
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${t.gold}22` }}>
                  <Check className="w-4 h-4" style={{ color: t.gold }} />
                </div>
                <span className="text-sm text-white/80" style={{ fontFamily: t.fontBody }}>{item}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Upcoming Games */}
        {upcomingFixtures.length > 0 ? (
          <div className="space-y-4">
            <h3 className="font-bold text-white" style={{ fontFamily: t.fontBody }}>Select Your Game</h3>
            {upcomingFixtures.map((fixture) => (
              <motion.div
                key={fixture.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <GlassCard className="overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${t.royal}22` }}>
                        <Ticket className="w-6 h-6" style={{ color: t.cyan }} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-white text-lg mb-1" style={{ fontFamily: t.fontBody }}>
                          {fixture.opponent}
                        </h4>
                        <p className="text-sm text-white/50" style={{ fontFamily: t.fontBody }}>{fixture.team_grade}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-sm text-white/60" style={{ fontFamily: t.fontBody }}>
                        <Calendar className="w-4 h-4" />
                        {format(new Date(fixture.date_time), 'EEE, MMM d • h:mm a')}
                      </div>
                      {fixture.venue && (
                        <div className="flex items-center gap-2 text-sm text-white/60" style={{ fontFamily: t.fontBody }}>
                          <MapPin className="w-4 h-4" />
                          {fixture.venue}
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => handlePurchase(fixture)}
                      disabled={processing}
                      className="w-full py-6"
                      style={{ background: `linear-gradient(135deg, ${t.gold}, ${t.goldHi})`, color: t.bg0 }}
                    >
                      {processing && selectedFixture?.id === fixture.id ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : dayPassTier ? (
                        `Buy Day Pass - $${dayPassTier.price}`
                      ) : (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading price...
                        </>
                      )}
                    </Button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        ) : (
          <GlassCard className="p-6 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: t.gold }} />
            <h3 className="font-bold text-white mb-2" style={{ fontFamily: t.fontBody }}>No Upcoming Games</h3>
            <p className="text-sm text-white/50" style={{ fontFamily: t.fontBody }}>
              Check back later for upcoming fixtures
            </p>
          </GlassCard>
        )}

        {/* Info */}
        <GlassCard className="p-4">
          <p className="text-sm text-white/60 mb-2" style={{ fontFamily: t.fontBody }}>
            Purchase your Day Pass, take a quick photo, and scan your digital QR at the gate.
          </p>
          <p className="text-sm text-white/60" style={{ fontFamily: t.fontBody }}>
            You'll also receive special game-day offers, promotions, and exclusive deals from our partners.
          </p>
        </GlassCard>

        {/* Upgrade CTA */}
        <GlassCard className="p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 30%, ${t.royal}22, transparent 60%)` }} />
          <div className="relative z-10">
            <h3 className="font-bold text-white text-xl mb-2" style={{ fontFamily: t.fontBody }}>Become a Member</h3>
            <p className="text-white/50 text-sm mb-4" style={{ fontFamily: t.fontBody }}>
              Unlimited home game entry + exclusive rewards
            </p>
            <Button
              onClick={() => window.location.href = createPageUrl('Membership')}
              style={{ background: `linear-gradient(135deg, ${t.gold}, ${t.goldHi})`, color: t.bg0 }}
            >
              View Memberships
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}