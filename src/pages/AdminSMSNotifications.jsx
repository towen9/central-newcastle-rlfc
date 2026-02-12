import React, { useState } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Users, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AdminSMSNotifications() {
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('members');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const templates = [
    {
      name: 'Match Day Reminder',
      message: "🏉 Game Day Tomorrow! Don't forget to bring your membership card. See you at the ground! - Central Newcastle RLFC"
    },
    {
      name: 'Event Reminder',
      message: "📅 Reminder: Club event this weekend. Check the app for details. See you there! - Central Newcastle RLFC"
    },
    {
      name: 'Points Update',
      message: "⭐ You've earned new points! Check your rewards in the app. - Central Newcastle RLFC"
    },
    {
      name: 'New Offer',
      message: "🎁 New sponsor offer available! Open the app to check it out. - Central Newcastle RLFC"
    }
  ];

  const handleSend = async () => {
    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const { data } = await base44.functions.invoke('sendSMS', {
        message: message.trim(),
        target
      });

      setResult(data);
      if (data.success) {
        setMessage('');
      }
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setSending(false);
    }
  };

  const charCount = message.length;
  const smsCount = Math.ceil(charCount / 160);

  return (
    <AdminLayout title="SMS Notifications" currentPage="AdminSMSNotifications">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Setup Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Twilio SMS Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-2">
            <p><strong>To use SMS notifications:</strong></p>
            <ol className="list-decimal ml-5 space-y-1">
              <li>Sign up at <a href="https://www.twilio.com/try-twilio" target="_blank" className="underline font-medium">twilio.com/try-twilio</a> (free trial includes credits)</li>
              <li>Get a free phone number from Twilio</li>
              <li>Copy your Account SID, Auth Token, and Phone Number</li>
              <li>Add them to Dashboard → Settings → Environment Variables</li>
            </ol>
          </CardContent>
        </Card>

        {/* Send SMS Form */}
        <Card>
          <CardHeader>
            <CardTitle>Send SMS to Members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Target Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Send to</label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="members">Active Members</SelectItem>
                  <SelectItem value="daypass">Day Pass Holders</SelectItem>
                  <SelectItem value="all">All Users</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Message Input */}
            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your SMS message..."
                rows={4}
                maxLength={480}
              />
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>{charCount}/480 characters</span>
                <span>{smsCount} SMS {smsCount > 1 ? 'messages' : 'message'}</span>
              </div>
            </div>

            {/* Send Button */}
            <Button 
              onClick={handleSend} 
              disabled={sending || !message.trim()}
              className="w-full"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send SMS
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {templates.map((template, idx) => (
              <button
                key={idx}
                onClick={() => setMessage(template.message)}
                className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-sm">{template.name}</div>
                <div className="text-xs text-gray-500 mt-1">{template.message}</div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <Card className={result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className={`font-semibold ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                    {result.success ? 'SMS Sent Successfully' : 'SMS Send Failed'}
                  </h3>
                  {result.success ? (
                    <div className="text-sm text-green-800 mt-1">
                      <p>Sent: {result.sent} messages</p>
                      {result.failed > 0 && <p>Failed: {result.failed} messages</p>}
                      <p>Total: {result.total} recipients</p>
                    </div>
                  ) : (
                    <p className="text-sm text-red-800 mt-1">{result.error}</p>
                  )}
                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-2 text-xs text-red-700">
                      <p className="font-medium">Errors:</p>
                      {result.errors.map((err, idx) => (
                        <p key={idx}>• {err.user} ({err.mobile}): {err.error}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}