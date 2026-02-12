import React, { useState } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, Copy, Check, Loader2, MessageSquare, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AdminFixturesComms() {
  const [selectedFixture, setSelectedFixture] = useState(null);
  const [copied, setCopied] = useState(null);
  const queryClient = useQueryClient();

  const { data: fixtures = [] } = useQuery({
    queryKey: ['fixturesComms'],
    queryFn: () => base44.entities.Fixture.list('-date_time')
  });

  const generateCopyMutation = useMutation({
    mutationFn: ({ fixtureId, type }) => 
      base44.functions.invoke('generateFixtureSocialCopy', { fixtureId, type }),
    onSuccess: () => {
      queryClient.invalidateQueries(['fixturesComms']);
      toast.success('Social copy generated');
    }
  });

  const updateFixtureMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Fixture.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['fixturesComms']);
      toast.success('Fixture updated');
    }
  });

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success('Copied to clipboard');
  };

  const upcomingFixtures = fixtures.filter(f => f.status === 'upcoming');
  const completedFixtures = fixtures.filter(f => f.status === 'completed');

  return (
    <AdminLayout title="Fixtures & Communications" currentPage="AdminFixturesComms">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-900 mb-2">📱 How It Works</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• App = Structured data hub (fixtures, sponsors, times)</li>
              <li>• Generate social copy → Copy/paste to Facebook/Instagram</li>
              <li>• App users get push notifications automatically</li>
              <li>• Social stays for community engagement & storytelling</li>
            </ul>
          </CardContent>
        </Card>

        {/* Upcoming Fixtures */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Upcoming Fixtures
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingFixtures.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No upcoming fixtures</p>
            ) : (
              upcomingFixtures.map(fixture => (
                <div key={fixture.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">
                        Central v {fixture.opponent}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {format(new Date(fixture.date_time), 'EEEE, MMM d, yyyy - h:mma')}
                      </p>
                      <p className="text-sm text-gray-600">{fixture.venue}</p>
                      {fixture.sponsor_of_round && (
                        <Badge variant="secondary" className="mt-2">
                          Sponsor: {fixture.sponsor_of_round}
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedFixture(
                        selectedFixture?.id === fixture.id ? null : fixture
                      )}
                    >
                      {selectedFixture?.id === fixture.id ? 'Hide' : 'Manage'}
                    </Button>
                  </div>

                  {selectedFixture?.id === fixture.id && (
                    <div className="border-t pt-4 space-y-4">
                      {/* Sponsor Input */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Sponsor of the Round
                        </label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="e.g., Newcastle Insurance"
                            defaultValue={fixture.sponsor_of_round}
                            onBlur={(e) => {
                              if (e.target.value !== fixture.sponsor_of_round) {
                                updateFixtureMutation.mutate({
                                  id: fixture.id,
                                  data: { sponsor_of_round: e.target.value }
                                });
                              }
                            }}
                          />
                        </div>
                      </div>

                      {/* Match Preview Copy */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium">
                            📱 Match Preview Copy
                          </label>
                          <Button
                            size="sm"
                            onClick={() => generateCopyMutation.mutate({
                              fixtureId: fixture.id,
                              type: 'preview'
                            })}
                            disabled={generateCopyMutation.isPending}
                          >
                            {generateCopyMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Generate'
                            )}
                          </Button>
                        </div>
                        {fixture.social_copy_preview && (
                          <div className="relative">
                            <Textarea
                              value={fixture.social_copy_preview}
                              readOnly
                              rows={6}
                              className="bg-gray-50"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="absolute top-2 right-2"
                              onClick={() => copyToClipboard(
                                fixture.social_copy_preview, 
                                `preview-${fixture.id}`
                              )}
                            >
                              {copied === `preview-${fixture.id}` ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Completed Fixtures */}
        <Card>
          <CardHeader>
            <CardTitle>Post-Game Summaries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {completedFixtures.slice(0, 5).length === 0 ? (
              <p className="text-center text-gray-500 py-8">No completed fixtures</p>
            ) : (
              completedFixtures.slice(0, 5).map(fixture => (
                <div key={fixture.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">
                        Central {fixture.result_home} - {fixture.result_away} {fixture.opponent}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {format(new Date(fixture.date_time), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedFixture(
                        selectedFixture?.id === fixture.id ? null : fixture
                      )}
                    >
                      {selectedFixture?.id === fixture.id ? 'Hide' : 'Generate Copy'}
                    </Button>
                  </div>

                  {selectedFixture?.id === fixture.id && (
                    <div className="border-t pt-4 space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium">
                            📝 Post-Game Summary
                          </label>
                          <Button
                            size="sm"
                            onClick={() => generateCopyMutation.mutate({
                              fixtureId: fixture.id,
                              type: 'postgame'
                            })}
                            disabled={generateCopyMutation.isPending}
                          >
                            {generateCopyMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Generate'
                            )}
                          </Button>
                        </div>
                        {fixture.social_copy_postgame && (
                          <div className="relative">
                            <Textarea
                              value={fixture.social_copy_postgame}
                              readOnly
                              rows={6}
                              className="bg-gray-50"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="absolute top-2 right-2"
                              onClick={() => copyToClipboard(
                                fixture.social_copy_postgame,
                                `postgame-${fixture.id}`
                              )}
                            >
                              {copied === `postgame-${fixture.id}` ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}