import React, { useState } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, TrendingDown, Download, Mail, Loader2, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { jsPDF } from 'jspdf';

export default function AdminPerformance() {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [report, setReport] = useState(null);

  const generateReport = async () => {
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('generateWeeklyReport', {});
      if (data.success) {
        setReport(data.report);
      }
    } catch (error) {
      alert('Failed to generate report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const emailReport = async () => {
    setSending(true);
    try {
      const { data } = await base44.functions.invoke('emailWeeklyReport', {});
      if (data.success) {
        alert(`Report emailed to ${data.emailsSent} admin(s)`);
      }
    } catch (error) {
      alert('Failed to email report: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const downloadPDF = () => {
    if (!report) return;

    const doc = new jsPDF();
    const m = report.metrics;

    // Title
    doc.setFontSize(20);
    doc.text('Central Digital Performance', 20, 20);
    doc.setFontSize(12);
    doc.text(`Week ${report.week} - ${report.periodStart} to ${report.periodEnd}`, 20, 30);

    // Metrics
    let y = 50;
    doc.setFontSize(14);
    doc.text(`Total Members: ${m.totalMembers}`, 20, y);
    y += 10;
    doc.text(`Paid Members: ${m.paidMembers}`, 20, y);
    y += 15;

    doc.text(`Revenue Generated: $${m.revenue}`, 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`${m.revenueChange >= 0 ? '+' : ''}${m.revenueChange}% vs last week`, 30, y);
    y += 12;

    doc.setFontSize(14);
    doc.text(`Game Attendance (QR Scans): ${m.gameAttendance}`, 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`${m.attendanceChange >= 0 ? '+' : ''}${m.attendanceChange}% vs last week`, 30, y);
    y += 12;

    doc.setFontSize(14);
    doc.text(`Top Sponsor: ${m.topSponsor.name}`, 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`${m.topSponsor.clicks} offer redemptions`, 30, y);
    y += 12;

    doc.setFontSize(14);
    doc.text(`Peak Engagement: ${m.peakTime}`, 20, y);
    y += 15;

    // Insights
    if (report.insights.length > 0) {
      doc.setFontSize(12);
      doc.text('Key Insights:', 20, y);
      y += 8;
      doc.setFontSize(10);
      report.insights.forEach(insight => {
        doc.text(`• ${insight}`, 25, y);
        y += 7;
      });
    }

    doc.save(`Central-Performance-Week${report.week}.pdf`);
  };

  return (
    <AdminLayout title="Performance Analytics" currentPage="AdminPerformance">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          <Button onClick={generateReport} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
          <Button onClick={emailReport} disabled={sending || !report} variant="outline">
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Email to Admins
              </>
            )}
          </Button>
          <Button onClick={downloadPDF} disabled={!report} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>

        {/* Report Display */}
        {report && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Week {report.week} Performance – {report.periodStart} to {report.periodEnd}
                </CardTitle>
              </CardHeader>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Total Members */}
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-500 mb-1">Total Members</div>
                  <div className="text-3xl font-bold text-gray-900">{report.metrics.totalMembers}</div>
                  <div className="text-sm text-gray-600 mt-2">Paid: {report.metrics.paidMembers}</div>
                </CardContent>
              </Card>

              {/* Stripe Membership Sales */}
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-500 mb-1">Membership Sales (Stripe)</div>
                  <div className="text-3xl font-bold text-gray-900">${report.metrics.stripeSales}</div>
                  <div className={`text-sm mt-2 flex items-center gap-1 ${report.metrics.stripeSalesChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {report.metrics.stripeSalesChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {report.metrics.stripeSalesChange >= 0 ? '+' : ''}{report.metrics.stripeSalesChange}% vs last week
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Memberships &amp; day passes</div>
                </CardContent>
              </Card>

              {/* Bar/Canteen Revenue */}
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-500 mb-1">Bar &amp; Canteen Revenue</div>
                  <div className="text-3xl font-bold text-gray-900">${report.metrics.revenue}</div>
                  <div className={`text-sm mt-2 flex items-center gap-1 ${report.metrics.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {report.metrics.revenueChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {report.metrics.revenueChange >= 0 ? '+' : ''}{report.metrics.revenueChange}% vs last week
                  </div>
                  <div className="text-xs text-gray-400 mt-1">In-venue QR transactions</div>
                </CardContent>
              </Card>

              {/* Game Attendance */}
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-500 mb-1">Game Attendance (QR)</div>
                  <div className="text-3xl font-bold text-gray-900">{report.metrics.gameAttendance}</div>
                  <div className={`text-sm mt-2 flex items-center gap-1 ${report.metrics.attendanceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {report.metrics.attendanceChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {report.metrics.attendanceChange >= 0 ? '+' : ''}{report.metrics.attendanceChange}% vs last week
                  </div>
                </CardContent>
              </Card>

              {/* Top Sponsor */}
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-500 mb-1">Top Sponsor</div>
                  <div className="text-xl font-bold text-gray-900">{report.metrics.topSponsor.name}</div>
                  <div className="text-sm text-gray-600 mt-2">{report.metrics.topSponsor.clicks} redemptions</div>
                </CardContent>
              </Card>

              {/* Peak Time */}
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-500 mb-1">Peak Engagement</div>
                  <div className="text-xl font-bold text-gray-900">{report.metrics.peakTime}</div>
                  <div className="text-sm text-gray-600 mt-2">Highest activity</div>
                </CardContent>
              </Card>

              {/* Offer Redemptions */}
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-500 mb-1">Offer Redemptions</div>
                  <div className="text-3xl font-bold text-gray-900">{report.metrics.offerRedemptions}</div>
                  <div className="text-sm text-gray-600 mt-2">This week</div>
                </CardContent>
              </Card>
            </div>

            {/* Insights */}
            {report.insights.length > 0 && (
              <Card className="bg-amber-50 border-amber-200">
                <CardHeader>
                  <CardTitle className="text-amber-900">📊 Key Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {report.insights.map((insight, idx) => (
                      <li key={idx} className="text-amber-800 flex items-start gap-2">
                        <span className="text-amber-600 font-bold">•</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {!report && !loading && (
          <Card>
            <CardContent className="py-12 text-center">
              <BarChart3 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Click "Generate Report" to see weekly performance metrics</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}