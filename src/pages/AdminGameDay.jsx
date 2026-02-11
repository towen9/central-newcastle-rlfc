import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '../components/admin/AdminLayout';
import { Ticket, Download, TrendingUp, Users, DollarSign, Calendar, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AdminGameDay() {
  const [selectedEvent, setSelectedEvent] = useState('all');

  const { data: entries = [] } = useQuery({
    queryKey: ['gameEntries'],
    queryFn: () => base44.entities.GameDayEntry.list('-entry_timestamp')
  });

  const { data: fixtures = [] } = useQuery({
    queryKey: ['fixtures'],
    queryFn: () => base44.entities.Fixture.filter({ entry_enabled: true }, '-date_time', 20)
  });

  const filteredEntries = selectedEvent === 'all' 
    ? entries 
    : entries.filter(e => e.event_id === selectedEvent);

  // Analytics
  const totalAttendees = filteredEntries.length;
  const totalRevenue = filteredEntries.reduce((sum, e) => sum + (e.payment_amount || 0), 0);
  const optInRate = filteredEntries.length > 0 
    ? (filteredEntries.filter(e => e.opt_in_club).length / filteredEntries.length * 100).toFixed(1)
    : 0;
  const returningRate = filteredEntries.length > 0
    ? (filteredEntries.filter(e => e.is_returning).length / filteredEntries.length * 100).toFixed(1)
    : 0;

  const exportCSV = () => {
    const headers = ['Date', 'Name', 'Email', 'Mobile', 'Postcode', 'Event', 'Amount', 'Opt-in Club', 'Opt-in Partners', 'Status'];
    const rows = filteredEntries.map(e => [
      format(new Date(e.entry_timestamp), 'yyyy-MM-dd HH:mm'),
      `${e.first_name} ${e.last_name}`,
      e.email,
      e.mobile,
      e.postcode,
      e.event_title,
      `$${e.payment_amount?.toFixed(2) || '0.00'}`,
      e.opt_in_club ? 'Yes' : 'No',
      e.opt_in_partners ? 'Yes' : 'No',
      e.status
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-day-entries-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <AdminLayout title="Game Day Entry" currentPage="AdminGameDay">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Total Attendees</p>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalAttendees}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Opt-in Rate</p>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{optInRate}%</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Returning</p>
            <Users className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{returningRate}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filter by event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {fixtures.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.opponent} - {format(new Date(f.date_time), 'MMM d')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <Link to={createPageUrl('DayPassQR')}>
              <Button variant="outline">
                <QrCode className="w-4 h-4 mr-2" />
                Entry QR Code
              </Button>
            </Link>
            <Button onClick={exportCSV} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Entries Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Attendee</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Event</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Opt-ins</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(entry.entry_timestamp), 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(entry.entry_timestamp), 'h:mm a')}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">
                      {entry.first_name} {entry.last_name}
                    </p>
                    <p className="text-xs text-gray-500">{entry.postcode}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{entry.email}</p>
                    <p className="text-xs text-gray-500">{entry.mobile}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{entry.event_title}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">
                      ${entry.payment_amount?.toFixed(2) || '0.00'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      entry.status === 'valid' ? 'bg-emerald-100 text-emerald-700' :
                      entry.status === 'used' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      {entry.opt_in_club && (
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs">Club</span>
                      )}
                      {entry.opt_in_partners && (
                        <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded text-xs">Partners</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEntries.length === 0 && (
          <div className="text-center py-12">
            <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No entries yet</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}