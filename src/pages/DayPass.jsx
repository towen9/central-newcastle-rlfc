import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Ticket, Calendar, MapPin, Check, ArrowLeft, Loader2, Camera, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function DayPass() {
  const [user, setUser] = useState(null);
  const [selectedFixture, setSelectedFixture] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [createdPass, setCreatedPass] = useState(null);
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

  // Get upcoming home fixtures with entry enabled
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

  // Check if user already has any valid pass (not just today)
  const { data: existingPass } = useQuery({
    queryKey: ['myDayPass', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const passes = await base44.entities.GameDayEntry.filter({
        user_id: user.id
      }, '-entry_timestamp');

      // Return the most recent valid pass
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

  // Handle payment success — verify with Stripe and create pass immediately
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
            if (res?.data?.pass) setCreatedPass(res.data.pass);
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

  if (verifying || paymentSuccess) {
    // Photo capture step
    if (paymentSuccess && photoStep) {
      return (
        <div className="min-h-screen bg-gray-50 pb-24">
          <div className="bg-[#1a365d] pt-safe">
            <div className="px-5 py-6">
              <h1 className="text-white text-2xl font-bold">One Last Step</h1>
              <p className="text-blue-200">Take a photo for your pass</p>
            </div>
          </div>
          <div className="px-5 py-6">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
              <p className="text-sm text-blue-800 text-center">
                📸 Your photo is used to verify your identity at the gate. Make sure it's a clear face photo.
              </p>
            </div>

            {!capturedPhoto ? (
              <div className="space-y-4">
                <div className="bg-black rounded-2xl overflow-hidden aspect-square relative">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  {!cameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                      <Camera className="w-16 h-16 text-gray-500" />
                    </div>
                  )}
                </div>
                {!cameraActive ? (
                  <Button onClick={startCamera} className="w-full bg-[#1a365d] hover:bg-[#2c5282] py-6 text-base">
                    <Camera className="w-5 h-5 mr-2" />
                    Open Camera
                  </Button>
                ) : (
                  <Button onClick={capturePhoto} className="w-full bg-emerald-600 hover:bg-emerald-700 py-6 text-base">
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
                  className="w-full bg-emerald-600 hover:bg-emerald-700 py-6 text-base"
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

            <button
              onClick={() => { stopCamera(); window.location.reload(); }}
              className="w-full text-center text-sm text-gray-400 mt-4 py-2"
            >
              Skip for now
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-[#1a365d] pt-safe">
          <div className="px-5 py-6">
            <h1 className="text-white text-2xl font-bold">Payment Successful!</h1>
            <p className="text-blue-200">{verifying ? 'Setting up your pass...' : 'Your Day Pass is ready'}</p>
          </div>
        </div>
        <div className="px-5 py-10 flex flex-col items-center text-center">
          {verifying ? (
            <>
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Setting up your pass...</h2>
              <p className="text-gray-500 text-sm">Just a moment while we confirm your payment.</p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                <Check className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">You're in! 🎉</h2>
              <p className="text-gray-600 mb-2">Your Day Pass is ready.</p>
              <p className="text-gray-500 text-sm mb-8">Add your photo so gate staff can verify it's you.</p>
              <Button
                onClick={() => setPhotoStep(true)}
                className="w-full bg-[#1a365d] hover:bg-[#2c5282] py-6 text-base mb-3"
              >
                <Camera className="w-5 h-5 mr-2" />
                Add My Photo
              </Button>
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-gray-400"
              >
                Skip for now
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (existingPass) {
    // If pass has no photo, show photo capture first
    if (!existingPass.photo_url && photoStep) {
      return (
        <div className="min-h-screen bg-gray-50 pb-24">
          <div className="bg-[#1a365d] pt-safe">
            <div className="px-5 py-6">
              <h1 className="text-white text-2xl font-bold">Add Your Photo</h1>
              <p className="text-blue-200">Required for gate entry verification</p>
            </div>
          </div>
          <div className="px-5 py-6">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
              <p className="text-sm text-amber-800 text-center">
                📸 Gate staff need your photo to verify it's you. Please take a clear face photo.
              </p>
            </div>

            {!capturedPhoto ? (
              <div className="space-y-4">
                <div className="bg-black rounded-2xl overflow-hidden aspect-square relative">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  {!cameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                      <Camera className="w-16 h-16 text-gray-500" />
                    </div>
                  )}
                </div>
                {!cameraActive ? (
                  <Button onClick={startCamera} className="w-full bg-[#1a365d] hover:bg-[#2c5282] py-6 text-base">
                    <Camera className="w-5 h-5 mr-2" />Open Camera
                  </Button>
                ) : (
                  <Button onClick={capturePhoto} className="w-full bg-emerald-600 hover:bg-emerald-700 py-6 text-base">
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
                  className="w-full bg-emerald-600 hover:bg-emerald-700 py-6 text-base"
                >
                  {uploadingPhoto ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Saving...</> : 'Use This Photo'}
                </Button>
                <Button onClick={() => { setCapturedPhoto(null); startCamera(); }} variant="outline" className="w-full py-6">
                  <RefreshCw className="w-4 h-4 mr-2" />Retake
                </Button>
              </div>
            )}
            <button onClick={() => { stopCamera(); window.location.href = createPageUrl('MyDayPass') + `?passId=${existingPass.id}`; }} className="w-full text-center text-sm text-gray-400 mt-4 py-2">
              Skip for now
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-[#1a365d] pt-safe">
          <div className="px-5 py-6">
            <h1 className="text-white text-2xl font-bold mb-2">My Day Pass</h1>
            <p className="text-blue-200">Your digital pass is ready to use on game day</p>
          </div>
        </div>

        <div className="px-5 py-6 space-y-3">
          {!existingPass.photo_url && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
              <Camera className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800">Photo required for entry</p>
                <p className="text-xs text-amber-700">Gate staff need your photo to verify your pass</p>
              </div>
              <Button size="sm" onClick={() => setPhotoStep(true)} className="bg-amber-500 hover:bg-amber-600 text-white flex-shrink-0">
                Add Photo
              </Button>
            </div>
          )}
          <Button 
            onClick={() => window.location.href = createPageUrl('MyDayPass') + `?passId=${existingPass.id}`}
            className="w-full bg-emerald-600 hover:bg-emerald-700 py-6"
          >
            View My Pass
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-[#1a365d] pt-safe">
        <div className="px-5 py-6">
          <Link to={createPageUrl('Home')}>
            <button className="flex items-center gap-2 text-blue-200 mb-4">
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
          </Link>
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ba172da6c09d1e1650bd/6b3832f4a_Butcherboyslogo.jpg"
            alt="Central Newcastle RLFC"
            className="w-16 h-16 mb-4 bg-white rounded-full p-2"
          />
          <h1 className="text-white text-2xl font-bold mb-2">Day Pass – $8</h1>
          <p className="text-blue-200">Single entry to upcoming home games</p>
        </div>
      </div>

      <div className="px-5 py-6">
        {/* Features */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">What's Included</h3>
          <div className="space-y-3">
            {[
              'Digital QR pass with your photo',
              'Entry to the selected home game',
              'Special game-day offers & promotions',
              'Exclusive deals from our partners',
              'Access your QR pass immediately after purchase'
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Games */}
        {upcomingFixtures.length > 0 ? (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900">Select Your Game</h3>
            {upcomingFixtures.map((fixture) => (
              <motion.div
                key={fixture.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-[#1a365d] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Ticket className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-lg mb-1">
                        {fixture.opponent}
                      </h4>
                      <p className="text-sm text-gray-600">{fixture.team_grade}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(fixture.date_time), 'EEE, MMM d • h:mm a')}
                    </div>
                    {fixture.venue && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {fixture.venue}
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => handlePurchase(fixture)}
                    disabled={processing}
                    className="w-full bg-[#1a365d] hover:bg-[#2c5282] py-6"
                  >
                    {processing && selectedFixture?.id === fixture.id ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Buy Day Pass - $8`
                    )}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
            <Calendar className="w-12 h-12 text-amber-600 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">No Upcoming Games</h3>
            <p className="text-sm text-gray-600">
              Check back later for upcoming fixtures
            </p>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4">
          <p className="text-sm text-blue-800 mb-2">
            Purchase your Day Pass, take a quick photo, and scan your digital QR at the gate.
          </p>
          <p className="text-sm text-blue-800">
            You'll also receive special game-day offers, promotions, and exclusive deals from our partners.
          </p>
        </div>

        {/* Upgrade CTA */}
        <div className="mt-6 bg-gradient-to-r from-[#1a365d] to-[#2c5282] rounded-2xl p-6 text-white text-center">
          <h3 className="font-bold text-xl mb-2">Become a Member</h3>
          <p className="text-blue-200 text-sm mb-4">
            Unlimited home game entry + exclusive rewards
          </p>
          <Button 
            onClick={() => window.location.href = createPageUrl('Membership')}
            className="bg-white text-[#1a365d] hover:bg-gray-100"
          >
            View Memberships
          </Button>
        </div>
      </div>
    </div>
  );
}