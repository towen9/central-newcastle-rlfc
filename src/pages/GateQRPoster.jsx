import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GateQRPoster() {
  const urlParams = new URLSearchParams(window.location.search);
  const qrId = urlParams.get('qr_id');

  const { data: qrCodes = [] } = useQuery({
    queryKey: ['clubQRCodes'],
    queryFn: () => base44.entities.ClubQRCode.list()
  });

  const qr = qrCodes.find(q => q.qr_id === qrId) || qrCodes.find(q => q.qr_type === 'checkin');

  const getQRImageUrl = (qrCode) => {
    const data = JSON.stringify({ type: qrCode.qr_type, id: qrCode.qr_id });
    return `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(data)}`;
  };

  if (!qr) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">No QR code found. Create one in Admin → QR Codes first.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
      {/* Print button - hidden when printing */}
      <div className="mb-6 print:hidden">
        <Button onClick={() => window.print()} className="bg-[#1a365d] hover:bg-[#2c5282]">
          <Printer className="w-4 h-4 mr-2" />
          Print Poster
        </Button>
      </div>

      {/* Poster */}
      <div
        id="gate-poster"
        className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl print:shadow-none print:rounded-none print:max-w-none"
        style={{ aspectRatio: '210/297' }}
      >
        {/* Header */}
        <div className="bg-[#1a365d] px-8 py-8 text-center">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ba172da6c09d1e1650bd/6b3832f4a_Butcherboyslogo.jpg"
            alt="Central Newcastle RLFC"
            className="w-24 h-24 object-contain bg-white rounded-full p-1.5 mx-auto mb-4"
          />
          <h1 className="text-white text-3xl font-extrabold tracking-tight">GATE ENTRY</h1>
          <p className="text-blue-200 text-base mt-1">Central Newcastle RLFC</p>
        </div>

        {/* Instruction */}
        <div className="bg-amber-400 px-6 py-3 text-center">
          <p className="text-amber-900 font-bold text-lg">📱 Scan your member QR code here</p>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center justify-center px-8 py-8 bg-white">
          <div className="border-4 border-[#1a365d] rounded-2xl p-3">
            <img
              src={getQRImageUrl(qr)}
              alt="Gate Entry QR"
              className="w-56 h-56"
            />
          </div>
          <p className="text-gray-400 text-xs mt-3 font-mono">{qr.qr_id}</p>
        </div>

        {/* Instructions */}
        <div className="px-8 pb-6 space-y-3">
          <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
            <span className="text-2xl">1️⃣</span>
            <p className="text-gray-700 text-sm font-medium">Open the Central Newcastle RLFC app on your phone</p>
          </div>
          <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
            <span className="text-2xl">2️⃣</span>
            <p className="text-gray-700 text-sm font-medium">Tap your membership pass to show your QR code</p>
          </div>
          <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
            <span className="text-2xl">3️⃣</span>
            <p className="text-gray-700 text-sm font-medium">Hold your screen up to the scanner at the gate</p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#1a365d] px-6 py-3 text-center">
          <p className="text-blue-200 text-xs">No app? No entry. Download at centralfootball.com.au</p>
        </div>
      </div>

      <style>{`
        @media print {
          body { margin: 0; }
          .print\\:hidden { display: none !important; }
          #gate-poster {
            width: 100%;
            height: 100vh;
            border-radius: 0;
            box-shadow: none;
            max-width: none;
            aspect-ratio: auto;
          }
        }
      `}</style>
    </div>
  );
}