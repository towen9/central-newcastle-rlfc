import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Ticket, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import clubConfig from '@/config/club.config';

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-[#1a365d] pt-safe print:hidden">
        <div className="px-5 py-6">
          <h1 className="text-white text-2xl font-bold mb-2">Day Pass Entry QR</h1>
          <p className="text-blue-200">Display this at the gate for customers to scan</p>
        </div>
      </div>

      <div className="px-5 py-6">
        {/* Action Buttons */}
        <div className="flex gap-3 mb-6 print:hidden">
          <Button onClick={handlePrint} className="flex-1 bg-[#1a365d] hover:bg-[#2c5282]">
            <Printer className="w-5 h-5 mr-2" />
            Print
          </Button>
          <Button onClick={handleDownload} variant="outline" className="flex-1">
            <Download className="w-5 h-5 mr-2" />
            Download
          </Button>
        </div>

        {/* QR Code Display */}
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
              <div className="w-6 h-6 bg-[#1a365d] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">1</div>
              <p>Scan this QR code with your phone camera</p>
            </div>
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <div className="w-6 h-6 bg-[#1a365d] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">2</div>
              <p>Purchase your $8 Day Pass</p>
            </div>
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <div className="w-6 h-6 bg-[#1a365d] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">3</div>
              <p>Take a quick selfie</p>
            </div>
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <div className="w-6 h-6 bg-[#1a365d] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">4</div>
              <p>Show your digital pass at the gate</p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
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