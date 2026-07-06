import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import clubConfig from '@/config/club.config';
import GlassCard from '@/components/ui-kit/GlassCard';
import Eyebrow from '@/components/ui-kit/Eyebrow';
import GoldButton from '@/components/ui-kit/GoldButton';
import { SkeletonCard } from '@/components/ui-kit/Skeleton';

const t = clubConfig.theme;

export default function DayPassQR() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      if (userData.role !== 'admin') {
        window.location.href = createPageUrl('Home');
        return;
      }
      setUser(userData);
    };
    loadUser();
  }, []);

  const dayPassUrl = `${window.location.origin}${createPageUrl('DayPass')}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=800x800&data=${encodeURIComponent(dayPassUrl)}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = 'day-pass-qr-code.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      <div className="pt-safe px-5 py-4 print:hidden">
        <Eyebrow color={t.gold}>Admin Tool</Eyebrow>
        <h1 className="text-white text-xl" style={{ fontFamily: t.fontDisplay }}>Day Pass Entry QR</h1>
        <p className="text-white/50 text-sm" style={{ fontFamily: t.fontBody }}>Display this at the gate for customers to scan</p>
      </div>

      <div className="px-5 py-6">
        {/* Action Buttons */}
        <div className="flex gap-3 mb-6 print:hidden">
          <GoldButton onClick={handlePrint} className="flex-1">
            <Printer className="w-5 h-5" />
            Print
          </GoldButton>
          <Button onClick={handleDownload} variant="outline" className="flex-1" style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'white', background: 'transparent' }}>
            <Download className="w-5 h-5 mr-2" />
            Download
          </Button>
        </div>

        {/* QR Code Display — solid white background for scanner readability */}
        <div className="bg-white rounded-2xl p-8 shadow-xl text-center">
          <img 
            src={clubConfig.identity.logo_url}
            alt={clubConfig.identity.club_name}
            className="w-24 h-24 mx-auto mb-6 bg-white rounded-full p-2"
          />
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Buy Your Day Pass</h2>
          <p className="text-xl text-gray-600 mb-6">Single Game Entry - $8</p>

          <div className="bg-gray-50 rounded-2xl p-8 mb-6">
            <img 
              src={qrCodeUrl}
              alt="Day Pass QR Code"
              className="w-full max-w-md mx-auto"
            />
          </div>

          <div className="space-y-2 text-left max-w-md mx-auto">
            <p className="text-sm text-gray-700 font-semibold mb-3">How it works:</p>
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <div className="w-6 h-6 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold" style={{ background: t.gold }}>1</div>
              <p>Scan this QR code with your phone camera</p>
            </div>
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <div className="w-6 h-6 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold" style={{ background: t.gold }}>2</div>
              <p>Purchase your $8 Day Pass</p>
            </div>
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <div className="w-6 h-6 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold" style={{ background: t.gold }}>3</div>
              <p>Take a quick selfie</p>
            </div>
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <div className="w-6 h-6 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold" style={{ background: t.gold }}>4</div>
              <p>Show your digital pass at the gate</p>
            </div>
          </div>

          <div className="mt-8 pt-6" style={{ borderTop: '1px solid #e5e7eb' }}>
            <p className="text-xs text-gray-500">
              Valid for today's home game only • Includes game-day offers
            </p>
          </div>
        </div>

        {/* Print-only version */}
        <div className="hidden print:block">
          <div className="text-center py-8">
            <img 
              src={clubConfig.identity.logo_url}
              alt={clubConfig.identity.club_name}
              className="w-32 h-32 mx-auto mb-8"
            />
            
            <h1 className="text-5xl font-bold mb-4">Buy Your Day Pass</h1>
            <p className="text-3xl text-gray-700 mb-12">Single Game Entry - $8</p>

            <img 
              src={qrCodeUrl}
              alt="Day Pass QR Code"
              className="w-96 h-96 mx-auto mb-12 border-8 border-gray-900 p-4"
            />

            <div className="text-left max-w-2xl mx-auto mb-12">
              <p className="text-2xl font-bold mb-6">How it works:</p>
              <div className="space-y-4">
                <p className="text-xl">1. Scan this QR code with your phone camera</p>
                <p className="text-xl">2. Purchase your $8 Day Pass online</p>
                <p className="text-xl">3. Take a quick selfie for your pass</p>
                <p className="text-xl">4. Show your digital pass at the gate</p>
              </div>
            </div>

            <div className="border-t-2 border-gray-300 pt-8">
              <p className="text-lg text-gray-600">
                Valid for today's home game only • Includes special game-day offers
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 2cm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}