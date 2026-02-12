import React, { useState } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, AlertTriangle, CheckCircle, XCircle, 
  RefreshCw, Loader2, TrendingDown, DollarSign, Users 
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminMonitoring() {
  const [running, setRunning] = useState(false);
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['monitoringAlerts'],
    queryFn: () => base44.entities.MonitoringAlert.list('-created_date', 100),
    refetchInterval: 60000 // Auto-refresh every minute
  });

  const runMonitorMutation = useMutation({
    mutationFn: async () => {
      const { data } = await base44.functions.invoke('monitorOperations', {});
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['monitoringAlerts']);
    }
  });

  const resolveAlertMutation = useMutation({
    mutationFn: (alertId) => 
      base44.entities.MonitoringAlert.update(alertId, { 
        status: 'resolved',
        resolved_at: new Date().toISOString()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['monitoringAlerts']);
    }
  });

  const acknowledgeAlertMutation = useMutation({
    mutationFn: (alertId) =>
      base44.entities.MonitoringAlert.update(alertId, { status: 'acknowledged' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['monitoringAlerts']);
    }
  });

  const runMonitor = async () => {
    setRunning(true);
    try {
      await runMonitorMutation.mutateAsync();
    } finally {
      setRunning(false);
    }
  };

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
  const highAlerts = activeAlerts.filter(a => a.severity === 'high');

  const severityConfig = {
    critical: { icon: XCircle, color: 'bg-red-100 text-red-800 border-red-200', badge: 'destructive' },
    high: { icon: AlertTriangle, color: 'bg-amber-100 text-amber-800 border-amber-200', badge: 'default' },
    medium: { icon: AlertTriangle, color: 'bg-blue-100 text-blue-800 border-blue-200', badge: 'secondary' },
    low: { icon: Shield, color: 'bg-gray-100 text-gray-800 border-gray-200', badge: 'outline' }
  };

  const typeIcons = {
    technical: Shield,
    financial: DollarSign,
    engagement: Users
  };

  return (
    <AdminLayout title="Operations Monitoring" currentPage="AdminMonitoring">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className={criticalAlerts.length > 0 ? 'border-red-500' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Critical Alerts</p>
                  <p className="text-3xl font-bold text-red-600">{criticalAlerts.length}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className={highAlerts.length > 0 ? 'border-amber-500' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">High Priority</p>
                  <p className="text-3xl font-bold text-amber-600">{highAlerts.length}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Alerts</p>
                  <p className="text-3xl font-bold text-gray-900">{activeAlerts.length}</p>
                </div>
                <Shield className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">System Status</p>
                  <p className={`text-lg font-bold ${activeAlerts.length === 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {activeAlerts.length === 0 ? 'Healthy' : 'Issues Detected'}
                  </p>
                </div>
                <CheckCircle className={`w-8 h-8 ${activeAlerts.length === 0 ? 'text-green-500' : 'text-red-500'}`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={runMonitor} disabled={running}>
            {running ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Checks...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Run Monitor Now
              </>
            )}
          </Button>
        </div>

        {/* Alerts List */}
        <Card>
          <CardHeader>
            <CardTitle>Alert History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
                <p className="text-gray-500">No alerts detected. System running smoothly.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map(alert => {
                  const config = severityConfig[alert.severity] || severityConfig.medium;
                  const TypeIcon = typeIcons[alert.alert_type] || Shield;
                  
                  return (
                    <div 
                      key={alert.id}
                      className={`border rounded-lg p-4 ${config.color}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <config.icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{alert.title}</h3>
                              <Badge variant={config.badge}>{alert.severity}</Badge>
                              <Badge variant="outline" className="text-xs">
                                <TypeIcon className="w-3 h-3 mr-1" />
                                {alert.alert_type}
                              </Badge>
                              {alert.status !== 'active' && (
                                <Badge variant="secondary">{alert.status}</Badge>
                              )}
                            </div>
                            <p className="text-sm mb-2">{alert.description}</p>
                            <div className="flex gap-4 text-xs">
                              <span><strong>Current:</strong> {alert.metric_value}</span>
                              <span><strong>Expected:</strong> {alert.threshold_value}</span>
                            </div>
                            <p className="text-xs mt-2 opacity-70">
                              {format(new Date(alert.created_date), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                        </div>
                        
                        {alert.status === 'active' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => acknowledgeAlertMutation.mutate(alert.id)}
                            >
                              Acknowledge
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => resolveAlertMutation.mutate(alert.id)}
                            >
                              Resolve
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}