import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Ticket, Users, CheckCircle, Clock, ArrowLeft, Copy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function EventReport() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      if (!u || u.role !== 'admin') {
        window.location.href = '/AdminDashboard';
        return;
      }
      setUser(u);
    }).catch(() => { window.location.href = '/AdminDashboard'; });
  }, []);

  const { data: tickets = [], isLoading, refetch } = useQuery({
    queryKey: ['eventTickets'],
    queryFn: () => base44.entities.EventTicket.list('-created_at'),
    enabled: !!user,
    refetchInterval: 30000 // auto-refresh every 30s on the day
  });

  const sold = tickets.filter(t => t.status !== 'refunded');
  const admitted = tickets.filter(t => t.status === 'used');
  const pending = tickets.filter(t => t.status === 'active');
  const refunded = tickets.filter(t => t.status === 'refunded');

  const handleCopyNames = () => {
    const names = sold.map(t => `${t.purchaser_name} (${t.purchaser_email}) — ${t.status}`).join('\n');
    navigator.clipboard.writeText(names).then(() => {
      toast.success('Name list copied to clipboard');
    }).catch(() => {
      toast.error('Could not copy — try a different browser');
    });
  };

  if (!user) {
    return (
      <div style={{ minHeight: '100dvh' }} className="flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', overflowY: 'auto', background: '#f9fafb' }}>
      {/* Header */}
      <div className="bg-[#1a365d] text-white" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="px-5 py-6">
          <button onClick={() => window.location.href = '/AdminDashboard'} className="flex items-center gap-2 text-blue-200 mb-4">
            <ArrowLeft className="w-5 h-5" />
            Back to Admin
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Ladies Long Lunch</h1>
              <p className="text-blue-200 text-sm">Ticket Report · 1 August 2026</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="text-white hover:bg-white/20"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-4 pb-12">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Ticket className="w-5 h-5 text-blue-600" />
              <span className="text-xs text-gray-500 uppercase tracking-wide">Sold</span>
            </div>
            <p className="text-4xl font-extrabold text-gray-900">{sold.length}</p>
            <p className="text-xs text-gray-400 mt-1">excl. refunded</p>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="text-xs text-emerald-600 uppercase tracking-wide">Admitted</span>
            </div>
            <p className="text-4xl font-extrabold text-emerald-700">{admitted.length}</p>
            <p className="text-xs text-emerald-500 mt-1">checked in today</p>
          </div>
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-5 h-5 text-amber-600" />
              <span className="text-xs text-amber-600 uppercase tracking-wide">Not yet arrived</span>
            </div>
            <p className="text-4xl font-extrabold text-amber-700">{pending.length}</p>
          </div>
          <div className="bg-red-50 rounded-2xl p-4 border border-red-100 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-red-400" />
              <span className="text-xs text-red-400 uppercase tracking-wide">Refunded</span>
            </div>
            <p className="text-4xl font-extrabold text-red-400">{refunded.length}</p>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-[#1a365d] rounded-2xl p-4 text-white">
          <p className="text-blue-200 text-sm mb-1">Total Revenue</p>
          <p className="text-3xl font-extrabold">${(sold.length * 55).toFixed(2)}</p>
          <p className="text-blue-300 text-xs mt-1">{sold.length} × $55.00 AUD</p>
        </div>

        {/* Export */}
        <Button
          onClick={handleCopyNames}
          variant="outline"
          className="w-full h-12 border-2 border-[#1a365d] text-[#1a365d] font-semibold"
        >
          <Copy className="w-4 h-4 mr-2" />
          Copy Guest List to Clipboard
        </Button>

        {/* Ticket list */}
        <div className="space-y-2">
          <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">All Ticket Holders</h3>

          {isLoading && (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          )}

          {!isLoading && tickets.length === 0 && (
            <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
              <Ticket className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No tickets sold yet</p>
            </div>
          )}

          {tickets.map(ticket => (
            <div key={ticket.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{ticket.purchaser_name}</p>
                  <p className="text-xs text-gray-400 truncate">{ticket.purchaser_email}</p>
                  {ticket.scanned_at && (
                    <p className="text-xs text-emerald-600 mt-1">
                      ✅ Scanned {format(new Date(ticket.scanned_at), 'h:mm a')}
                      {ticket.scanned_by && ` · by ${ticket.scanned_by}`}
                    </p>
                  )}
                  {ticket.created_at && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Purchased {format(new Date(ticket.created_at), 'dd MMM · h:mm a')}
                    </p>
                  )}
                </div>
                <span className={`ml-3 shrink-0 px-3 py-1 rounded-full text-xs font-bold ${
                  ticket.status === 'active' ? 'bg-amber-100 text-amber-700' :
                  ticket.status === 'used' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-red-100 text-red-600'
                }`}>
                  {ticket.status === 'active' ? 'NOT IN' : ticket.status === 'used' ? 'ADMITTED' : 'REFUNDED'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}