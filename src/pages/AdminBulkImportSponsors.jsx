import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { base44 } from '@/api/base44Client';
import AdminLayout from '../components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle, XCircle, Loader2, FileSpreadsheet, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminBulkImportSponsors() {
  const [sponsors, setSponsors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState([]);
  const [fileName, setFileName] = useState('');

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
        const get = (...keys) => {
          for (const k of keys) {
            const match = Object.keys(row).find(rk => rk.toLowerCase().replace(/[\s_]/g, '') === k.toLowerCase().replace(/[\s_]/g, ''));
            if (match && row[match]) return String(row[match]).trim();
          }
          return '';
        };
        return {
          name: get('name', 'sponsorname', 'company'),
          contact_email: get('email', 'contactemail'),
          contact_phone: get('phone', 'contactphone', 'mobile'),
          website: get('website', 'url', 'web'),
          description: get('description', 'about'),
          logo_url: get('logourl', 'logo', 'logolink'),
        };
      }).filter(s => s.name);

      setSponsors(parsed);
      toast.success(`Found ${parsed.length} sponsors in spreadsheet`);
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (!sponsors.length) { toast.error('No sponsors loaded'); return; }
    setImporting(true);
    setResults([]);

    try {
      const { data } = await base44.functions.invoke('bulkImportSponsors', { sponsors });
      setResults(data.results || []);
      const successCount = (data.results || []).filter(r => r.status !== 'error').length;
      toast.success(`Import complete: ${successCount}/${sponsors.length} successful`);
    } catch (err) {
      toast.error(err.message || 'Import failed');
    }

    setImporting(false);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['name', 'contact_email', 'contact_phone', 'website', 'description', 'logo_url'],
      ['Acme Corp', 'contact@acme.com', '0412345678', 'https://acme.com', 'Local business', 'https://acme.com/logo.png'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sponsors');
    XLSX.writeFile(wb, 'sponsor-import-template.xlsx');
  };

  const successCount = results.filter(r => r.status !== 'error').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  return (
    <AdminLayout title="Bulk Sponsor Import" currentPage="AdminBulkImportSponsors">
      <div className="max-w-3xl space-y-6">

        {/* Step 1: Download Template */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Step 1 — Download Template</h2>
          <p className="text-sm text-gray-500 mb-4">Use this template to format your spreadsheet. Logo URL column should contain a web link to the logo image.</p>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Download Excel Template
          </Button>
        </div>

        {/* Step 2: Upload */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Step 2 — Upload Spreadsheet</h2>
          <p className="text-sm text-gray-500 mb-4">
            Columns: <code className="bg-gray-100 px-1 rounded">name, contact_email, contact_phone, website, description, logo_url</code>
            <br /><span className="text-xs text-gray-400">If a sponsor with the same name already exists, it will be updated.</span>
          </p>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-8 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <FileSpreadsheet className="w-10 h-10 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-700">{fileName || 'Click to select Excel or CSV file'}</span>
            {sponsors.length > 0 && <span className="text-sm text-emerald-600 mt-1">✓ {sponsors.length} sponsors loaded</span>}
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>

        {/* Step 3: Preview & Import */}
        {sponsors.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Step 3 — Preview & Import</h2>

            <div className="border rounded-lg overflow-hidden mb-5">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 text-gray-600">Name</th>
                    <th className="text-left px-4 py-2 text-gray-600">Email</th>
                    <th className="text-left px-4 py-2 text-gray-600">Phone</th>
                    <th className="text-left px-4 py-2 text-gray-600">Website</th>
                    <th className="text-left px-4 py-2 text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sponsors.map((s, i) => {
                    const result = results.find(r => r.name === s.name);
                    return (
                      <tr key={i} className="border-t">
                        <td className="px-4 py-2 font-medium">{s.name}</td>
                        <td className="px-4 py-2 text-gray-600">{s.contact_email || '—'}</td>
                        <td className="px-4 py-2 text-gray-600">{s.contact_phone || '—'}</td>
                        <td className="px-4 py-2 text-gray-600 text-xs">{s.website || '—'}</td>
                        <td className="px-4 py-2">
                          {!result && <span className="text-gray-400">—</span>}
                          {result?.status === 'created' && (
                            <span className="flex items-center gap-1 text-emerald-600 text-xs">
                              <CheckCircle className="w-3.5 h-3.5" /> Created
                            </span>
                          )}
                          {result?.status === 'updated' && (
                            <span className="flex items-center gap-1 text-blue-600 text-xs">
                              <CheckCircle className="w-3.5 h-3.5" /> Updated
                            </span>
                          )}
                          {result?.status === 'error' && (
                            <span className="flex items-center gap-1 text-red-600 text-xs">
                              <XCircle className="w-3.5 h-3.5" /> {result.error || 'Failed'}
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
              disabled={importing}
              className="bg-[#1a365d] hover:bg-[#2c5282]"
            >
              {importing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing...</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" /> Import {sponsors.length} Sponsors</>
              )}
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}