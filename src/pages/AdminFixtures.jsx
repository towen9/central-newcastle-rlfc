import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trophy, Edit2, Trash2, MoreVertical, MapPin, Calendar, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AdminLayout from '../components/admin/AdminLayout';
import { toast } from 'sonner';
import { format } from 'date-fns';

const defaultFixture = {
  opponent: '',
  fixture_type: 'home',
  competition: '',
  team_grade: '',
  date_time: '',
  venue: '',
  venue_address: '',
  status: 'upcoming',
  ticket_url: '',
  entry_enabled: false,
  entry_price: 0
};

export default function AdminFixtures() {
  const [showModal, setShowModal] = useState(false);
  const [editingFixture, setEditingFixture] = useState(null);
  const [formData, setFormData] = useState(defaultFixture);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultFixture, setResultFixture] = useState(null);
  const [results, setResults] = useState({ home: '', away: '' });
  const [postponeConfirm, setPostponeConfirm] = useState(null); // fixture to confirm postpone/restore
  const queryClient = useQueryClient();

  const { data: fixtures = [] } = useQuery({
    queryKey: ['fixtures'],
    queryFn: () => base44.entities.Fixture.list('date_time')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Fixture.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['fixtures']);
      setShowModal(false);
      setFormData(defaultFixture);
      toast.success('Fixture created');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Fixture.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['fixtures']);
      setShowModal(false);
      setShowResultModal(false);
      setEditingFixture(null);
      setResultFixture(null);
      setFormData(defaultFixture);
      toast.success('Fixture updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Fixture.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['fixtures']);
      toast.success('Fixture deleted');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingFixture) {
      updateMutation.mutate({ id: editingFixture.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEdit = (fixture) => {
    setEditingFixture(fixture);
    setFormData(fixture);
    setShowModal(true);
  };

  const openResultModal = (fixture) => {
    setResultFixture(fixture);
    setResults({ 
      home: fixture.result_home?.toString() || '', 
      away: fixture.result_away?.toString() || '' 
    });
    setShowResultModal(true);
  };

  const submitResult = () => {
    updateMutation.mutate({
      id: resultFixture.id,
      data: {
        result_home: parseInt(results.home),
        result_away: parseInt(results.away),
        status: 'completed'
      }
    });
  };

  const statusColors = {
    upcoming: 'bg-blue-100 text-blue-700',
    live: 'bg-red-100 text-red-700',
    completed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-amber-100 text-amber-700',
    postponed: 'bg-purple-100 text-purple-700'
  };

  const matchStatusBadge = (fixture) => {
    if (fixture.match_status === 'postponed') {
      return <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">Postponed</span>;
    }
    return null;
  };

  return (
    <AdminLayout title="Fixtures" currentPage="AdminFixtures">
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-500">Manage match fixtures and results</p>
        <Button onClick={() => { setShowModal(true); setEditingFixture(null); setFormData(defaultFixture); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Fixture
        </Button>
      </div>

      {/* Fixtures Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Match</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Date & Time</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Venue</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Result</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Entry</th>
              <th className="w-[50px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {fixtures.map((fixture) => (
              <tr key={fixture.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900 flex items-center flex-wrap">
                      Central Newcastle vs {fixture.opponent}
                      {matchStatusBadge(fixture)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {fixture.team_grade} • {fixture.competition}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    {fixture.date_time && format(new Date(fixture.date_time), 'MMM d, yyyy h:mm a')}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {fixture.venue}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {fixture.status === 'completed' ? (
                    <span className="font-bold">
                      {fixture.result_home} - {fixture.result_away}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[fixture.status]}`}>
                    {fixture.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {fixture.entry_enabled ? (
                    <div className="flex items-center gap-1 text-emerald-600">
                      <Ticket className="w-4 h-4" />
                      <span className="text-sm font-medium">${fixture.entry_price?.toFixed(2)}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                     <DropdownMenuItem onClick={() => openEdit(fixture)}>
                       <Edit2 className="w-4 h-4 mr-2" />
                       Edit
                     </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => openResultModal(fixture)}>
                       <Trophy className="w-4 h-4 mr-2" />
                       Enter Result
                     </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => setPostponeConfirm(fixture)}>
                       {fixture.match_status === 'postponed' ? '✅ Restore to Scheduled' : '⏸ Mark Postponed'}
                     </DropdownMenuItem>
                     <DropdownMenuItem 
                       onClick={() => deleteMutation.mutate(fixture.id)}
                       className="text-red-600"
                     >
                       <Trash2 className="w-4 h-4 mr-2" />
                       Delete
                     </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {fixtures.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">No fixtures yet</h3>
            <p className="text-gray-500">Add your first fixture</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingFixture ? 'Edit Fixture' : 'Add Fixture'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Opponent</Label>
                <Input
                  value={formData.opponent}
                  onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
                  placeholder="Team name"
                  required
                />
              </div>
              <div>
                <Label>Home/Away</Label>
                <Select 
                  value={formData.fixture_type}
                  onValueChange={(value) => setFormData({ ...formData, fixture_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="away">Away</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Competition</Label>
                <Input
                  value={formData.competition}
                  onChange={(e) => setFormData({ ...formData, competition: e.target.value })}
                  placeholder="e.g., Newcastle Rugby League"
                />
              </div>
              <div>
                <Label>Team Grade</Label>
                <Input
                  value={formData.team_grade}
                  onChange={(e) => setFormData({ ...formData, team_grade: e.target.value })}
                  placeholder="e.g., First Grade, U18s"
                />
              </div>
            </div>
            <div>
              <Label>Date & Time</Label>
              <Input
                type="datetime-local"
                value={formData.date_time ? format(new Date(formData.date_time), "yyyy-MM-dd'T'HH:mm") : ''}
                onChange={(e) => setFormData({ ...formData, date_time: new Date(e.target.value).toISOString() })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Venue</Label>
                <Input
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="Venue name"
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select 
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="postponed">Postponed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Ticket URL</Label>
              <Input
                value={formData.ticket_url}
                onChange={(e) => setFormData({ ...formData, ticket_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            
            <div className="border-t border-gray-200 pt-4 space-y-4">
              <div className="flex items-center gap-3">
                <Checkbox 
                  id="entry_enabled"
                  checked={formData.entry_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, entry_enabled: checked })}
                />
                <div>
                  <label htmlFor="entry_enabled" className="text-sm font-medium text-gray-900">
                    Enable Digital Entry
                  </label>
                  <p className="text-xs text-gray-500">Allow game day entry via QR code</p>
                </div>
              </div>
              
              {formData.entry_enabled && (
                <div>
                  <Label>Entry Price ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.50"
                    value={formData.entry_price}
                    onChange={(e) => setFormData({ ...formData, entry_price: parseFloat(e.target.value) || 0 })}
                    placeholder="10.00"
                  />
                </div>
              )}
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editingFixture ? 'Save Changes' : 'Create Fixture'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Postpone Confirm Dialog */}
      <Dialog open={!!postponeConfirm} onOpenChange={() => setPostponeConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {postponeConfirm?.match_status === 'postponed' ? 'Restore Fixture' : 'Mark Postponed'}
            </DialogTitle>
          </DialogHeader>
          {postponeConfirm && (
            <div className="space-y-4">
              <p className="text-gray-600">
                {postponeConfirm.match_status === 'postponed'
                  ? `Restore "${postponeConfirm.opponent}" to scheduled?`
                  : `Mark "${postponeConfirm.opponent}" as postponed?`}
              </p>
              <p className="text-sm text-gray-500">
                {postponeConfirm.match_status === 'postponed'
                  ? 'match_status will be set back to "scheduled". Dedup fields are not reset.'
                  : 'match_status will be set to "postponed". No pushes will fire and autoComplete will skip it. Dedup fields are not touched.'}
              </p>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setPostponeConfirm(null)} className="flex-1">Cancel</Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    const newStatus = postponeConfirm.match_status === 'postponed' ? 'scheduled' : 'postponed';
                    updateMutation.mutate({ id: postponeConfirm.id, data: { match_status: newStatus } });
                    setPostponeConfirm(null);
                  }}
                >
                  {postponeConfirm.match_status === 'postponed' ? 'Restore' : 'Mark Postponed'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Result Modal */}
      <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Result</DialogTitle>
          </DialogHeader>
          {resultFixture && (
            <div className="space-y-4">
              <p className="text-center text-gray-600">
                Central Newcastle vs {resultFixture.opponent}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Central Newcastle</Label>
                  <Input
                    type="number"
                    min="0"
                    value={results.home}
                    onChange={(e) => setResults({ ...results, home: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>{resultFixture.opponent}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={results.away}
                    onChange={(e) => setResults({ ...results, away: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowResultModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={submitResult} className="flex-1">
                  Save Result
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}