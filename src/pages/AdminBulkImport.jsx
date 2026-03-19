import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { base44 } from '@/api/base44Client';
import AdminLayout from '../components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { Upload, CheckCircle, XCircle, Loader2, FileSpreadsheet, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminBulkImport() {
  const [players, setPlayers] = useState([]);
  const [selectedTierId, setSelectedTierId] = useState('');
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState([]);
  const [fileName, setFileName] = useState('');

  const { data: tiers = [] } = useQuery({
    queryKey: ['tiers'],
    queryFn: () => base44.entities.MembershipTier.filter({ is_active: true }, 'sort_order')
  });

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setResults([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const workbook = XLSX.read(evt.target.result, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      const parsed = rows.map((row) => {
        // Normalise column names (case-insensitive)
        const get = (...keys) => {
          for (const k of keys) {
            const match = Object.keys(row).find(rk => rk.toLowerCase().replace(/[\s_]/g, '') === k.toLowerCase().replace(/[\s_]/g, ''));
            if (match && row[match]) return String(row[match]).trim();
          }
          return '';
        };
        return {
          first_name: get('firstname', 'first'),
          last_name: get('lastname', 'last'),
          email: get('email'),
          mobile: get('mobile', 'phone', 'mobilenumber', 'phonenumber'),
        };
      }).filter(p => p.email);

      setPlayers(parsed);
      toast.success(`Found ${parsed.length} players in spreadsheet`);
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (!selectedTierId) { toast.error('Please select a membership tier'); return; }
    if (!players.length) { toast.error('No players loaded'); return; }

    setImporting(true);
    setResults([]);

    const tier = tiers.find(t => t.id === selectedTierId);
    const newResults = [];

    for (const player of players) {
      try {
        const { data } = await base44.functions.invoke('bulkImportPlayer', {
          first_name: player.first_name,
          last_name: player.last_name,
          email: player.email,
          mobile: player.mobile,
          tier_id: selectedTierId,
          tier_name: tier?.name,
        });
        newResults.push({ ...player, status: 'success', message: data.message || 'Imported' });
      } catch (err) {
        newResults.push({ ...player, status: 'error', message: err.message || 'Failed' });
      }
      setResults([...newResults]);
    }

    setImporting(false);
    const successCount = newResults.filter(r => r.status === 'success').length;
    toast.success(`Import complete: ${successCount}/${players.length} successful`);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['first_name', 'last_name', 'email', 'mobile'],
      ['John', 'Smith', 'john.smith@email.com', '0412345678'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Players');
    XLSX.writeFile(wb, 'player-import-template.xlsx');
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  return (
    <AdminLayout title="Bulk Player Import" currentPage="AdminBulkImport">
      <div className="max-w-3xl space-y-6">

        {/* Step 1: Download Template */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Step 1 — Download Template</h2>
          <p className="text-sm text-gray-500 mb-4">Use this template to format your spreadsheet correctly.</p>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Download Excel Template
          </Button>
        </div>

        {/* Step 2: Upload */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Step 2 — Upload Spreadsheet</h2>
          <p className="text-sm text-gray-500 mb-4">Columns needed: <code className="bg-gray-100 px-1 rounded">first_name, last_name, email, mobile</code></p>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-8 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <FileSpreadsheet className="w-10 h-10 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-700">{fileName || 'Click to select Excel or CSV file'}</span>
            {players.length > 0 && <span className="text-sm text-emerald-600 mt-1">✓ {players.length} players loaded</span>}
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>

        {/* Step 3: Select Tier */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Step 3 — Select Membership Tier</h2>
          <p className="text-sm text-gray-500 mb-4">All imported players will be assigned this tier with a pending status.</p>
          <Select value={selectedTierId} onValueChange={setSelectedTierId}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Select tier..." />
            </SelectTrigger>
            <SelectContent>
              {tiers.map(tier => (
                <SelectItem key={tier.id} value={tier.id}>{tier.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Step 4: Preview & Import */}
        {players.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Step 4 — Preview & Import</h2>

            <div className="border rounded-lg overflow-hidden mb-5">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 text-gray-600">Name</th>
                    <th className="text-left px-4 py-2 text-gray-600">Email</th>
                    <th className="text-left px-4 py-2 text-gray-600">Mobile</th>
                    <th className="text-left px-4 py-2 text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((p, i) => {
                    const result = results[i];
                    return (
                      <tr key={i} className="border-t">
                        <td className="px-4 py-2">{p.first_name} {p.last_name}</td>
                        <td className="px-4 py-2 text-gray-600">{p.email}</td>
                        <td className="px-4 py-2 text-gray-600">{p.mobile}</td>
                        <td className="px-4 py-2">
                          {!result && <span className="text-gray-400">—</span>}
                          {result?.status === 'success' && (
                            <span className="flex items-center gap-1 text-emerald-600 text-xs">
                              <CheckCircle className="w-3.5 h-3.5" /> {result.message}
                            </span>
                          )}
                          {result?.status === 'error' && (
                            <span className="flex items-center gap-1 text-red-600 text-xs">
                              <XCircle className="w-3.5 h-3.5" /> {result.message}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {results.length > 0 && (
              <div className="flex gap-4 mb-4 text-sm">
                <span className="text-emerald-600 font-medium">✓ {successCount} imported</span>
                {errorCount > 0 && <span className="text-red-600 font-medium">✗ {errorCount} failed</span>}
              </div>
            )}

            <Button
              onClick={handleImport}
              disabled={importing || !selectedTierId}
              className="bg-[#1a365d] hover:bg-[#2c5282]"
            >
              {importing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing...</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" /> Import {players.length} Players</>
              )}
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}