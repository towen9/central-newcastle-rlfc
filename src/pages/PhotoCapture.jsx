import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Camera, CheckCircle, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function PhotoCapture() {
  const [user, setUser] = useState(null);
  const [fixtureId, setFixtureId] = useState(null);
  const [step, setStep] = useState('camera'); // camera, preview, uploading, success
  const [photoData, setPhotoData] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();

    const params = new URLSearchParams(window.location.search);
    const id = params.get('fixture');
    if (id) setFixtureId(id);
  }, []);

  useEffect(() => {
    if (step === 'camera') {
      startCamera();
    }
    return () => stopCamera();
  }, [step]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 640 }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      toast.error('Camera access denied');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      canvas.width = 640;
      canvas.height = 640;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, 640, 640);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setPhotoData(dataUrl);
      setStep('preview');
      stopCamera();
    }
  };

  const retakePhoto = () => {
    setPhotoData(null);
    setStep('camera');
  };

  const confirmPhoto = async () => {
    setStep('uploading');

    try {
      // Convert data URL to blob
      const response = await fetch(photoData);
      const blob = await response.blob();
      
      // Create File object
      const file = new File([blob], 'daypass-photo.jpg', { type: 'image/jpeg' });
      
      // Upload photo
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Generate unique QR code
      const passCode = `DP${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // Get fixture details
      const fixtures = await base44.entities.Fixture.filter({ id: fixtureId });
      const fixture = fixtures[0];

      // Create GameDayEntry with photo
      const entry = await base44.entities.GameDayEntry.create({
        user_id: user.id,
        first_name: user.full_name?.split(' ')[0] || 'Guest',
        last_name: user.full_name?.split(' ').slice(1).join(' ') || '',
        email: user.email,
        mobile: user.mobile || '',
        postcode: user.postcode || '',
        event_id: fixtureId,
        event_title: `${fixture.opponent} - ${fixture.team_grade}`,
        entry_timestamp: new Date().toISOString(),
        pass_qr_code: passCode,
        payment_reference: 'stripe_success',
        payment_amount: 8,
        status: 'valid',
        opt_in_club: true,
        opt_in_partners: true,
        photo_url: file_url
      });

      setStep('success');
      
      setTimeout(() => {
        window.location.href = createPageUrl('MyDayPass') + `?passId=${entry.id}`;
      }, 2000);
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error('Failed to create pass. Please try again.');
      setStep('preview');
    }
  };

  if (!user || !fixtureId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-8 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pass Created!</h2>
          <p className="text-gray-600">Redirecting to your Day Pass...</p>
        </motion.div>
      </div>
    );
  }

  if (step === 'uploading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Creating Your Pass...</h3>
          <p className="text-sm text-gray-500">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#1a365d] pt-safe">
        <div className="px-5 py-6 text-center">
          <h1 className="text-white text-2xl font-bold mb-2">Take Your Photo</h1>
          <p className="text-blue-200 text-sm">
            {step === 'camera' ? 'Position your face in the frame' : 'Review your photo'}
          </p>
        </div>
      </div>

      <div className="px-5 py-6">
        <div className="bg-white rounded-3xl overflow-hidden shadow-xl mb-6">
          <div className="relative aspect-square bg-black">
            {step === 'camera' ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-4 border-white/20">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border-4 border-white rounded-full" />
                </div>
              </>
            ) : (
              <img 
                src={photoData}
                alt="Captured"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {step === 'camera' ? (
          <Button
            onClick={capturePhoto}
            className="w-full bg-[#1a365d] hover:bg-[#2c5282] py-6 text-lg"
          >
            <Camera className="w-6 h-6 mr-3" />
            Capture Photo
          </Button>
        ) : (
          <div className="space-y-3">
            <Button
              onClick={confirmPhoto}
              className="w-full bg-emerald-600 hover:bg-emerald-700 py-6 text-lg"
            >
              <CheckCircle className="w-6 h-6 mr-3" />
              Looks Good - Continue
            </Button>
            <Button
              onClick={retakePhoto}
              variant="outline"
              className="w-full py-6 text-lg"
            >
              <RotateCcw className="w-6 h-6 mr-3" />
              Retake Photo
            </Button>
          </div>
        )}

        <div className="mt-6 bg-blue-50 rounded-xl p-4">
          <p className="text-sm text-blue-800 text-center">
            Your photo will be shown on your digital pass for verification at the gate
          </p>
        </div>
      </div>
    </div>
  );
}