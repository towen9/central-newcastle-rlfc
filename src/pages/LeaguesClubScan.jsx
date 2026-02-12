import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Building2, CheckCircle, XCircle, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import jsQR from 'jsqr';

export default function LeaguesClubScan() {
  const [user, setUser] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [videoStream, setVideoStream] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      if (!userData || userData.role !== 'admin') {
        window.location.href = '/';
        return;
      }
      setUser(userData);
    };
    loadUser();
  }, []);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setVideoStream(stream);
      setScanning(true);
      setResult(null);
      
      const video = document.getElementById('leaguesClubVideo');
      video.srcObject = stream;
      video.play();
      
      scanQRCode(video);
    } catch (err) {
      alert('Camera access denied');
    }
  };

  const stopScanning = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
    setScanning(false);
  };

  const scanQRCode = (video) => {
    const canvas = document.getElementById('leaguesClubCanvas');
    const context = canvas.getContext('2d');

    const scan = () => {
      if (!scanning) return;

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          processScan(code.data);
          return;
        }
      }
      
      requestAnimationFrame(scan);
    };
    
    scan();
  };

  const processScan = async (qrData) => {
    stopScanning();
    
    try {
      const membership = await base44.entities.Membership.filter({ qr_code_id: qrData, status: 'active' });
      
      if (!membership || membership.length === 0) {
        setResult({ success: false, message: 'Invalid membership' });
        return;
      }

      const member = membership[0];
      
      // Check for duplicate scan today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const existingCheckIn = await base44.entities.PointsTransaction.filter({
        membership_id: member.id,
        transaction_type: 'leagues_club',
        timestamp: { $gte: today.toISOString() }
      });

      if (existingCheckIn && existingCheckIn.length > 0) {
        setResult({ 
          success: false, 
          message: 'Already checked in today',
          memberName: member.user_name
        });
        return;
      }

      // Award 20 bonus points
      const pointsEarned = 20;
      
      await base44.entities.Membership.update(member.id, {
        points: (member.points || 0) + pointsEarned
      });

      await base44.entities.PointsTransaction.create({
        user_id: member.user_id,
        membership_id: member.id,
        points: pointsEarned,
        transaction_type: 'leagues_club',
        description: 'Post-game Leagues Club check-in',
        location: 'Central Leagues Club',
        timestamp: new Date().toISOString()
      });

      setResult({
        success: true,
        message: `${pointsEarned} bonus points awarded!`,
        memberName: member.user_name,
        newBalance: (member.points || 0) + pointsEarned
      });

    } catch (err) {
      setResult({ success: false, message: 'Error processing scan' });
    }
  };

  if (!user) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Building2 className="w-10 h-10 text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold">Leagues Club Scanner</h1>
            <p className="text-gray-400 text-sm">+20 bonus points</p>
          </div>
        </div>

        {!scanning && !result && (
          <Button 
            onClick={startScanning}
            className="w-full h-16 bg-blue-500 hover:bg-blue-600 text-lg"
          >
            <Scan className="w-6 h-6 mr-2" />
            Start Scanning
          </Button>
        )}

        {scanning && (
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video id="leaguesClubVideo" className="w-full" />
              <div className="absolute inset-0 border-4 border-blue-400 opacity-50 pointer-events-none" />
            </div>
            <canvas id="leaguesClubCanvas" className="hidden" />
            <Button 
              onClick={stopScanning}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        )}

        {result && (
          <div className={`p-6 rounded-lg ${result.success ? 'bg-green-900' : 'bg-red-900'}`}>
            {result.success ? (
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            ) : (
              <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            )}
            
            <h2 className="text-xl font-bold text-center mb-2">{result.message}</h2>
            
            <div className="text-center space-y-2">
              <p className="text-lg">{result.memberName}</p>
              {result.success && (
                <p className="text-2xl font-bold text-blue-400">{result.newBalance} Points</p>
              )}
            </div>

            <Button 
              onClick={() => {
                setResult(null);
                startScanning();
              }}
              className="w-full mt-6 bg-blue-500 hover:bg-blue-600"
            >
              Scan Next Member
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}