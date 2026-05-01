import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, Send, Users, Ticket, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminLayout from '../components/admin/AdminLayout';
import { toast } from 'sonner';

export default function AdminPushNotifications() {
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    url: '',
    targetGroup: 'all'
  });
  const [sending, setSending] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.body) {
      toast.error('Title and message are required');
      return;
    }

    setSending(true);

    try {
      const response = await fetch('/api/functions/sendPushNotification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Notification sent to ${data.sent} of ${data.total} subscribers`);
        setFormData({ title: '', body: '', url: '', targetGroup: 'all' });
      } else {
        toast.error(data.error || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Push error:', error);
      toast.error('Error sending notification');
    } finally {
      setSending(false);
    }
  };

  const quickTemplates = [
    {
      title: '🏉 Game Day Reminder',
      body: 'Don\'t forget - game starts in 2 hours! Get your digital pass ready.',
      url: '/Fixtures'
    },
    {
      title: '🎁 New Reward Available',
      body: 'You\'ve earned enough stamps for a free reward. Check it out!',
      url: '/PointsRewards'
    },
    {
      title: '💰 Exclusive Member Offer',
      body: 'Special 20% discount at the bar today - members only!',
      url: '/Benefits'
    }
  ];

  return (
    <AdminLayout title="Push Notifications" currentPage="AdminPushNotifications">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Send Push Notification</h2>
              <p className="text-sm text-gray-500">Broadcast to all members or specific groups</p>
            </div>
          </div>

          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Target Audience
              </label>
              <Select 
                value={formData.targetGroup}
                onValueChange={(value) => setFormData({...formData, targetGroup: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      All Users
                    </div>
                  </SelectItem>
                  <SelectItem value="members">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Active Members Only
                    </div>
                  </SelectItem>
                  <SelectItem value="daypass">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4" />
                      Day Pass Holders
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Notification Title *
              </label>
              <Input
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Game Day Reminder"
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">{formData.title.length}/50 characters</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Message *
              </label>
              <Textarea
                required
                value={formData.body}
                onChange={(e) => setFormData({...formData, body: e.target.value})}
                placeholder="Don't forget - game starts in 2 hours!"
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">{formData.body.length}/200 characters</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Link URL (optional)
              </label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({...formData, url: e.target.value})}
                placeholder="/Fixtures or https://..."
              />
              <p className="text-xs text-gray-500 mt-1">Page to open when notification is tapped</p>
            </div>

            <Button 
              type="submit" 
              disabled={sending}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {sending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Send Notification
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Quick Templates */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Templates</h3>
          <div className="space-y-2">
            {quickTemplates.map((template, idx) => (
              <button
                key={idx}
                onClick={() => setFormData({
                  ...formData,
                  title: template.title,
                  body: template.body,
                  url: template.url
                })}
                className="w-full text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
              >
                <p className="font-medium text-sm text-gray-900 mb-1">{template.title}</p>
                <p className="text-xs text-gray-500">{template.body}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}