import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { subscribePush } from '@/lib/pushNotifications';
import { toast } from 'sonner';

export default function PushOptInCard() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!('Notification' in window)) return;
    const alreadyAsked = localStorage.getItem('push_asked');
    if (!alreadyAsked && Notification.permission === 'default') {
      setVisible(true);
    }
  }, []);

  const handleEnable = async () => {
    setVisible(false);
    localStorage.setItem('push_asked', 'true');
    try {
      await subscribePush();
      toast.success("Notifications enabled! You'll get game day updates. 🏉");
    } catch (e) {
      if (e.message !== 'PERMISSION_DENIED') {
        console.warn('Push opt-in error:', e.message);
      }
    }
  };

  if (!visible) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-4">
      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
        <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Enable game day notifications</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Get reminders before every home game</p>
      </div>
      <Button
        onClick={handleEnable}
        size="sm"
        className="bg-[#1a365d] hover:bg-[#2c5282] text-white flex-shrink-0"
      >
        Enable
      </Button>
    </div>
  );
}