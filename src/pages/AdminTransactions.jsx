import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '../components/admin/AdminLayout';
import { DollarSign, Download, TrendingUp, ShoppingBag, Clock, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

export default function AdminTransactions() {
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('today');

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-timestamp', 500)
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['clubQRs'],
    queryFn: () => base44.entities.ClubQRCode.list()
  });

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    if (filterLocation !== 'all' && t.location !== filterLocation) return false;
    
    if (filterPeriod !== 'all') {
      const txDate = new Date(t.timestamp);
      const now = new Date();
      
      if (filterPeriod === 'today') {
        return txDate.toDateString() === now.toDateString();
      } else if (filterPeriod === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return txDate >= weekAgo;
      }
    }
    
    return true;
  });

  // Analytics
  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.final_amount, 0);
  const totalDiscount = filteredTransactions.reduce((sum, t) => sum + (t.discount_amount || 0), 0);
  const totalStamps = filteredTransactions.reduce((sum, t) => sum + (t.stamps_awarded || 0), 0);
  const avgTransaction = filteredTransactions.length > 0 ? totalRevenue / filteredTransactions.length : 0;

  // Peak hours
  const hourCounts = {};
  filteredTransactions.forEach(t => {
    const hour = t.hour_of_day;
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  const peakHour = Object.keys(hourCounts).reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b, 0);

  const exportCSV = () => {
    const headers = ['Date/Time', 'Member', 'Location', 'Item', 'Original', 'Discount', 'Final', 'Stamps', 'Day', 'Hour'];
    const rows = filteredTransactions.map(t => [
      format(new Date(t.timestamp), 'yyyy-MM-dd HH:mm'),
      t.member_name,
      t.location,
      t.item_description,
      `$${t.original_amount?.toFixed(2)}`,
      `$${t.discount_amount?.toFixed(2)}`,
      `$${t.final_amount?.toFixed(2)}`,
      t.stamps_awarded || 0,
      t.day_of_week,
      t.hour_of_day
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <AdminLayout title="Transactions & Purchases" currentPage="AdminTransactions">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">{filteredTransactions.length} transactions</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Avg Transaction</p>
            <ShoppingBag className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">${avgTransaction.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Total Discounts</p>
            <TrendingUp className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">${totalDiscount.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Stamps Awarded</p>
            <Clock className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalStamps}</p>
          <p className="text-xs text-gray-500 mt-1">Peak: {peakHour}:00</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterLocation} onValueChange={setFilterLocation}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map(loc => (
                  <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={exportCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Member</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Discount</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Final</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Stamps</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(tx.timestamp), 'MMM d')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(tx.timestamp), 'h:mm a')}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{tx.member_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{tx.location}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{tx.item_description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-500">${tx.original_amount?.toFixed(2)}</p>
                  </td>
                  <td className="px-6 py-4">
                    {tx.discount_amount > 0 ? (
                      <span className="text-emerald-600 text-sm font-medium">
                        -${tx.discount_amount?.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900">${tx.final_amount?.toFixed(2)}</p>
                  </td>
                  <td className="px-6 py-4">
                    {tx.stamps_awarded > 0 ? (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        +{tx.stamps_awarded}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No transactions yet</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}