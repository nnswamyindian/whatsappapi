import React, { useState } from 'react';
import { api } from '../../services/api';
import { X, Upload, CheckCircle2, AlertCircle, FileText, Download, ShieldCheck, FileSpreadsheet, RefreshCw, Eye } from 'lucide-react';

interface ContactImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const ContactImportModal: React.FC<ContactImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [sampleType, setSampleType] = useState('general');
  const [rawText, setRawText] = useState(
    'Phone,First Name,Last Name,Email,Tags\n+919876543210,Rahul,Sharma,rahul@example.com,VIP\n+919812345678,Priya,Patel,priya@example.com,Lead\n+14155552671,Michael,Chen,michael@example.com,Wholesale'
  );
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({
    phone: 'Phone',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    tags: 'Tags',
  });

  const [previewStats, setPreviewStats] = useState<any>(null);
  const [previewing, setPreviewing] = useState(false);

  const [consentPurpose, setConsentPurpose] = useState('marketing');
  const [consentSource, setConsentSource] = useState('website_form');
  const [hasExplicitConsent, setHasExplicitConsent] = useState(false);

  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle local CSV/Text file selection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setRawText(text);
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadSample = () => {
    window.open(`/api/v1/contacts/samples/${sampleType}`, '_blank');
  };

  const handleParseCsv = () => {
    setError(null);
    const lines = rawText.trim().split('\n').filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      setError('CSV requires at least a header row and 1 data row');
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    setColumns(headers);

    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const obj: any = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx] || '';
      });
      rows.push(obj);
    }

    setParsedRows(rows);

    // Auto-suggest columns
    const autoMap: Record<string, string> = {};
    headers.forEach((h) => {
      const lower = h.toLowerCase();
      if (lower.includes('phone') || lower.includes('mobile') || lower.includes('whatsapp')) autoMap.phone = h;
      if (lower.includes('first')) autoMap.firstName = h;
      if (lower.includes('last')) autoMap.lastName = h;
      if (lower.includes('email')) autoMap.email = h;
      if (lower.includes('tag')) autoMap.tags = h;
    });

    setColumnMap((prev) => ({ ...prev, ...autoMap }));
    setStep(2);
  };

  const handleGeneratePreview = async () => {
    setPreviewing(true);
    setError(null);
    try {
      const preview = await api.post('/contacts/import-preview', {
        rows: parsedRows,
        columnMap,
      });
      setPreviewStats(preview);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Failed to preview validation');
    } finally {
      setPreviewing(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!hasExplicitConsent) {
      setError('You must certify explicit opt-in consent for WhatsApp messaging compliance');
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const res = await api.post('/contacts/import', {
        rows: parsedRows,
        columnMap,
        consentPurpose,
        consentSource,
      });

      setResult(res);
      setStep(4);
      onImportComplete();
    } catch (err: any) {
      setError(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const downloadFailedRowsCsv = async () => {
    const failed = result?.failedRecords || previewStats?.invalidRows;
    if (!failed || failed.length === 0) return;

    try {
      const response = await fetch('/api/v1/contacts/export-failed-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('gw_auth_token')}`,
        },
        body: JSON.stringify({ failedRecords: failed }),
      });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'greenwave_failed_records.csv';
      a.click();
    } catch (e) {
      alert('Failed to download error CSV');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-4 h-4 text-brand-600" />
              <span>Contact Import & Consent Verification Wizard</span>
            </h2>
            <div className="text-xs text-slate-500 mt-0.5">
              Step {step} of 4: {step === 1 ? 'Select / Upload File' : step === 2 ? 'Map Columns' : step === 3 ? 'Validation Preview' : 'Completed'}
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Upload File, Sample Downloads, or Raw Paste */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Sample Download Bar */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-emerald-950 font-medium">
                  <Download className="w-4 h-4 text-brand-700 shrink-0" />
                  <span>Download Sample Formats:</span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={sampleType}
                    onChange={(e) => setSampleType(e.target.value)}
                    className="px-2.5 py-1.5 border border-emerald-300 rounded-lg bg-white text-xs font-semibold"
                  >
                    <option value="general">General Contacts (VIP, Tags)</option>
                    <option value="marketing">Marketing (Offers, Promo Code)</option>
                    <option value="utility">Utility (Order, Tracking Link)</option>
                    <option value="media">Media Campaign (Image/PDF URL)</option>
                    <option value="carousel">Carousel Campaign (Cards)</option>
                    <option value="custom_variables">Custom Dynamic Variables</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleDownloadSample}
                    className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-lg shadow-xs"
                  >
                    Download CSV
                  </button>
                </div>
              </div>

              {/* File Upload Input */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors">
                <FileSpreadsheet className="w-8 h-8 text-brand-600 mx-auto mb-1.5" />
                <div className="font-bold text-slate-800 text-xs">
                  {fileName ? `Selected: ${fileName}` : 'Upload CSV / XLSX Contact File'}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Drag and drop or browse from your computer</div>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="mt-2 text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Or Paste CSV Data Directly
                </label>
                <textarea
                  rows={5}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Phone,First Name,Last Name,Email,Tags"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-[11px] focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Column Mapping & Consent Verification */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="font-bold text-slate-800">Map CSV Columns to Contact Attributes</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Phone Number Column *</label>
                  <select
                    value={columnMap.phone || ''}
                    onChange={(e) => setColumnMap({ ...columnMap, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    {columns.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">First Name Column</label>
                  <select
                    value={columnMap.firstName || ''}
                    onChange={(e) => setColumnMap({ ...columnMap, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">-- None --</option>
                    {columns.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Last Name Column</label>
                  <select
                    value={columnMap.lastName || ''}
                    onChange={(e) => setColumnMap({ ...columnMap, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">-- None --</option>
                    {columns.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Tags Column</label>
                  <select
                    value={columnMap.tags || ''}
                    onChange={(e) => setColumnMap({ ...columnMap, tags: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">-- None --</option>
                    {columns.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Consent Ledger Declaration */}
              <div className="border border-emerald-200 bg-emerald-50/50 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-2 font-bold text-emerald-950">
                  <ShieldCheck className="w-4 h-4 text-brand-700" />
                  <span>Mandatory Consent & Compliance Declaration</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Consent Source</label>
                    <select
                      value={consentSource}
                      onChange={(e) => setConsentSource(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="website_form">Website Checkout / Form Opt-In</option>
                      <option value="inbound_chat">Prior Inbound WhatsApp Request</option>
                      <option value="offline_store">In-Store Paper / POS Opt-In</option>
                      <option value="crm_sync">Authenticated CRM Sync</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Consent Purpose</label>
                    <select
                      value={consentPurpose}
                      onChange={(e) => setConsentPurpose(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="marketing">Marketing & Promotional Offers</option>
                      <option value="transactional">Account & Transactional Notifications</option>
                      <option value="general">General Business Communication</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-2 border-t border-emerald-200/60">
                  <input
                    type="checkbox"
                    id="consentCheck"
                    checked={hasExplicitConsent}
                    onChange={(e) => setHasExplicitConsent(e.target.checked)}
                    className="mt-0.5 rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                  />
                  <label htmlFor="consentCheck" className="text-[11px] text-slate-700 leading-snug">
                    I certify that these contacts have given explicit prior opt-in consent to receive WhatsApp messages from this business in accordance with WhatsApp Business Messaging Policies and applicable privacy laws.
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Pre-Flight Validation Preview */}
          {step === 3 && previewStats && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-brand-600" />
                  <span>Validation & Eligibility Breakdown</span>
                </div>
                <div className="text-[11px] text-slate-500">Total in file: {previewStats.totalRows} records</div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  <div className="text-[11px] text-emerald-800">New Eligible</div>
                  <div className="text-lg font-bold text-brand-950 mt-0.5">{previewStats.validCount}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-600">Existing / Dupes</div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">{previewStats.duplicateCount}</div>
                </div>
                <div className="bg-rose-50 p-3 rounded-xl border border-rose-200">
                  <div className="text-[11px] text-rose-800">Suppressed</div>
                  <div className="text-lg font-bold text-rose-950 mt-0.5">{previewStats.suppressedCount}</div>
                </div>
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <div className="text-[11px] text-amber-800">Invalid Format</div>
                  <div className="text-lg font-bold text-amber-950 mt-0.5">{previewStats.invalidCount}</div>
                </div>
              </div>

              {/* Sample Normalized Records */}
              {previewStats.samplePreview?.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-3 py-2 font-bold text-slate-700 text-[11px] border-b border-slate-200">
                    E.164 Normalization Preview (First 5 Rows)
                  </div>
                  <div className="divide-y divide-slate-100">
                    {previewStats.samplePreview.map((item: any, i: number) => (
                      <div key={i} className="px-3 py-2 flex items-center justify-between text-[11px]">
                        <span className="font-mono font-semibold text-brand-900">{item.phoneE164}</span>
                        <span className="text-slate-600">{item.firstName || item.lastName || '-'}</span>
                        <span className="text-slate-400">{item.country}</span>
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-medium text-slate-600">
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invalid Rows Warning */}
              {previewStats.invalidRows?.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                  <div className="text-[11px] text-amber-900">
                    {previewStats.invalidRows.length} rows have format errors and will be safely skipped.
                  </div>
                  <button
                    type="button"
                    onClick={downloadFailedRowsCsv}
                    className="text-amber-800 font-bold hover:underline inline-flex items-center gap-1 text-[11px]"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download Error CSV</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Results Summary */}
          {step === 4 && result && (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="w-12 h-12 text-brand-600 mx-auto" />
              <h3 className="font-bold text-base text-slate-900">Contact Import Completed Successfully</h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-2">
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  <div className="text-[11px] text-emerald-800">Added New</div>
                  <div className="text-lg font-bold text-brand-950 mt-0.5">{result.createdCount}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-600">Updated / Dupes</div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">{result.duplicateCount}</div>
                </div>
                <div className="bg-rose-50 p-3 rounded-xl border border-rose-200">
                  <div className="text-[11px] text-rose-800">Suppressed</div>
                  <div className="text-lg font-bold text-rose-950 mt-0.5">{result.suppressedCount}</div>
                </div>
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <div className="text-[11px] text-amber-800">Invalid Format</div>
                  <div className="text-lg font-bold text-amber-950 mt-0.5">{result.invalidCount}</div>
                </div>
              </div>

              {result.failedRecords?.length > 0 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={downloadFailedRowsCsv}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Failed Records Report ({result.failedRecords.length})</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
          >
            {step === 4 ? 'Done' : 'Cancel'}
          </button>

          <div className="flex gap-2">
            {step === 1 && (
              <button
                type="button"
                onClick={handleParseCsv}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Next: Map Columns &rarr;
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={handleGeneratePreview}
                disabled={previewing || !hasExplicitConsent}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                {previewing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Preview Validation &rarr;</span>
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={importing}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50"
              >
                {importing ? 'Importing & Normalizing...' : 'Execute Import & Log Consent'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
