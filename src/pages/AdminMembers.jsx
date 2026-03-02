import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, Filter, Download, Plus, MoreVertical, 
  Mail, CreditCard, CheckCircle, XCircle, Clock, ChevronDown 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdminLayout from '../components/admin/AdminLayout';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AdminMembers() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const queryClient = useQueryClient();

  const { data: memberships = [], isLoading } = useQuery({
    queryKey: ['allMemberships'],
    queryFn: () => base44.entities.Membership.list('-created_date')
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ['tiers'],
    queryFn: () => base44.entities.MembershipTier.filter({ is_active: true }, 'sort_order')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Membership.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['allMemberships']);
      toast.success('Membership updated');
    }
  });

  const pendingCount = memberships.filter(m => m.status === 'pending').length;

  const filteredMemberships = memberships.filter(m => {
    const matchesSearch = 
      m.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.user_email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    active: 'bg-emerald-100 text-emerald-700',
    expired: 'bg-red-100 text-red-700',
    pending: 'bg-amber-100 text-amber-700',
    cancelled: 'bg-gray-100 text-gray-700'
  };

  const exportBasicCSV = () => {
    const headers = ['Name', 'Email', 'Tier', 'Status', 'Start Date', 'Expiry Date', 'Stamps', 'Points', 'Check-ins'];
    const rows = filteredMemberships.map(m => [
      m.user_name,
      m.user_email,
      m.tier_name,
      m.status,
      m.start_date,
      m.expiry_date,
      m.stamps || 0,
      m.points || 0,
      m.total_checkins || 0
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `members-basic-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const exportDetailedData = async () => {
    setIsExporting(true);
    toast.loading('Preparing detailed export...');

    try {
      // Fetch all related data
      const [checkIns, pointsTransactions, fixtures] = await Promise.all([
        base44.entities.CheckIn.list('-timestamp'),
        base44.entities.PointsTransaction.list('-timestamp'),
        base44.entities.Fixture.list('-date_time')
      ]);

      // Build detailed rows
      const rows = [];
      
      for (const member of filteredMemberships) {
        const memberCheckIns = checkIns.filter(c => c.membership_id === member.id);
        const memberTransactions = pointsTransactions.filter(t => t.membership_id === member.id);
        
        // Get unique games attended
        const gamesAttended = new Set();
        memberCheckIns.forEach(checkIn => {
          const checkInDate = new Date(checkIn.timestamp);
          fixtures.forEach(fixture => {
            const fixtureDate = new Date(fixture.date_time);
            // Check if check-in was within 6 hours of a fixture
            const timeDiff = Math.abs(checkInDate - fixtureDate) / (1000 * 60 * 60);
            if (timeDiff <= 6) {
              gamesAttended.add(`${fixture.opponent} (${format(fixtureDate, 'MMM d, yyyy')})`);
            }
          });
        });

        // Calculate points breakdown
        const pointsEarned = memberTransactions
          .filter(t => t.points > 0)
          .reduce((sum, t) => sum + t.points, 0);
        const pointsSpent = Math.abs(memberTransactions
          .filter(t => t.points < 0)
          .reduce((sum, t) => sum + t.points, 0));

        rows.push([
          member.user_name || '',
          member.user_email || '',
          member.tier_name || '',
          member.status || '',
          member.start_date || '',
          member.expiry_date || '',
          member.stamps || 0,
          member.points || 0,
          pointsEarned,
          pointsSpent,
          member.total_checkins || 0,
          memberCheckIns.length,
          gamesAttended.size,
          Array.from(gamesAttended).join(' | ') || 'None'
        ]);
      }

      const headers = [
        'Name', 'Email', 'Tier', 'Status', 'Start Date', 'Expiry Date',
        'Stamps', 'Current Points', 'Points Earned', 'Points Spent',
        'Total Check-ins', 'Location Check-ins', 'Games Attended (Count)', 'Games Attended (List)'
      ];

      const csv = [headers, ...rows].map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `members-detailed-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      
      toast.success('Detailed export complete');
    } catch (error) {
      toast.error('Export failed: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const exportCheckInsData = async () => {
    setIsExporting(true);
    toast.loading('Preparing check-ins export...');

    try {
      const checkIns = await base44.entities.CheckIn.list('-timestamp');
      
      const rows = checkIns.map(checkIn => {
        const member = memberships.find(m => m.id === checkIn.membership_id);
        return [
          member?.user_name || 'Unknown',
          member?.user_email || 'Unknown',
          member?.tier_name || 'Unknown',
          checkIn.location || '',
          checkIn.timestamp ? format(new Date(checkIn.timestamp), 'yyyy-MM-dd HH:mm:ss') : '',
          checkIn.location_qr_id || ''
        ];
      });

      const headers = ['Member Name', 'Email', 'Tier', 'Location', 'Check-in Time', 'QR Code'];
      const csv = [headers, ...rows].map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `check-ins-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();

      toast.success('Check-ins export complete');
    } catch (error) {
      toast.error('Export failed: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AdminLayout title="Members" currentPage="AdminMembers">
      {/* Pending Alert */}
      {pendingCount > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-amber-900">
                  {pendingCount} Pending Approval{pendingCount !== 1 ? 's' : ''}
                </h3>
                <p className="text-sm text-amber-700">
                  Player pass applications awaiting review
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setStatusFilter('pending')}
              className="bg-amber-600 hover:bg-amber-700"
            >
              View Pending
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isExporting}>
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export Data'}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={exportBasicCSV}>
                <Download className="w-4 h-4 mr-2" />
                Basic Member List
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportDetailedData}>
                <Download className="w-4 h-4 mr-2" />
                Detailed with Games Attended
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportCheckInsData}>
                <Download className="w-4 h-4 mr-2" />
                All Check-ins History
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{memberships.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-emerald-600">{memberships.filter(m => m.status === 'active').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Expired</p>
          <p className="text-2xl font-bold text-red-600">{memberships.filter(m => m.status === 'expired').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{memberships.filter(m => m.status === 'pending').length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Stamps</TableHead>
              <TableHead>Check-ins</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMemberships.map((membership) => (
              <TableRow key={membership.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-gray-900">{membership.user_name}</p>
                    <p className="text-sm text-gray-500">{membership.user_email}</p>
                  </div>
                </TableCell>
                <TableCell>{membership.tier_name}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[membership.status]}`}>
                    {membership.status}
                  </span>
                </TableCell>
                <TableCell>
                  {membership.expiry_date ? format(new Date(membership.expiry_date), 'MMM d, yyyy') : '-'}
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-amber-600">{membership.stamps || 0}</span>
                </TableCell>
                <TableCell>{membership.total_checkins || 0}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {membership.status === 'pending' && (
                      <>
                        <Button 
                          size="sm" 
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => updateMutation.mutate({ 
                            id: membership.id, 
                            data: { status: 'active' }
                          })}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => updateMutation.mutate({ 
                            id: membership.id, 
                            data: { status: 'cancelled' }
                          })}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedMember(membership)}>
                          Edit Membership
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => updateMutation.mutate({ 
                            id: membership.id, 
                            data: { status: membership.status === 'active' ? 'cancelled' : 'active' }
                          })}
                        >
                          {membership.status === 'active' ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => updateMutation.mutate({ 
                            id: membership.id, 
                            data: { stamps: 0 }
                          })}
                        >
                          Reset Stamps
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredMemberships.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No members found</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Membership</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Member</p>
                <p className="font-medium">{selectedMember.user_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <Select 
                  value={selectedMember.status}
                  onValueChange={(value) => {
                    updateMutation.mutate({ id: selectedMember.id, data: { status: value } });
                    setSelectedMember(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Tier</p>
                <Select 
                  value={selectedMember.tier_id}
                  onValueChange={(value) => {
                    const tier = tiers.find(t => t.id === value);
                    updateMutation.mutate({ 
                      id: selectedMember.id, 
                      data: { tier_id: value, tier_name: tier?.name }
                    });
                    setSelectedMember(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tiers.map(tier => (
                      <SelectItem key={tier.id} value={tier.id}>{tier.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}