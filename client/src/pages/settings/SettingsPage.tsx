import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Settings, Building2, Globe, Bell, Plus, ShieldCheck } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { activeOrg, refreshOrg } = useAuth();
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState(10);
  const [saving, setSaving] = useState(false);

  // New workspace creation state
  const [newOrgName, setNewOrgName] = useState('');
  const [creatingOrg, setCreatingOrg] = useState(false);

  useEffect(() => {
    if (activeOrg) {
      setName(activeOrg.name);
      setTimezone(activeOrg.timezone || 'Asia/Kolkata');
      setLowBalanceThreshold(activeOrg.low_balance_threshold || 10);
    }
  }, [activeOrg]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/organizations/current', {
        name,
        timezone,
        lowBalanceThreshold: Number(lowBalanceThreshold),
      });
      await refreshOrg();
      alert('Workspace settings updated successfully');
    } catch (err: any) {
      alert(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNewOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setCreatingOrg(true);
    try {
      const res = await api.post('/organizations', { name: newOrgName });
      alert(`Workspace "${res.name}" created!`);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Failed to create workspace');
    } finally {
      setCreatingOrg(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand-600" />
          <span>Workspace & Account Settings</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure business details, timezone defaults, and low-balance messaging alerts
        </p>
      </div>

      {/* Main Settings Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs">
        <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-brand-600" />
          <span>Active Workspace Profile</span>
        </h2>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Business Workspace Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Timezone for Campaign Scheduling</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl bg-white font-medium"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                <option value="America/New_York">America/New_York (EST -5:00)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST -8:00)</option>
                <option value="Europe/London">Europe/London (GMT +0:00)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
                <option value="UTC">Universal Coordinated Time (UTC)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Low-Balance Warning Alert (USD)</label>
              <input
                type="number"
                min="1"
                value={lowBalanceThreshold}
                onChange={(e) => setLowBalanceThreshold(Number(e.target.value))}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-xs disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Workspace Settings'}
          </button>
        </form>
      </div>

      {/* Create Additional Workspace Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
        <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <Plus className="w-4 h-4 text-brand-600" />
          <span>Create Additional Workspace</span>
        </h2>
        <p className="text-slate-500">
          Separate brand campaigns, contact databases, and phone numbers into distinct isolated tenant workspaces.
        </p>

        <form onSubmit={handleCreateNewOrg} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            required
            placeholder="New Workspace Name (e.g. Acme EMEA Operations)"
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.target.value)}
            className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 font-semibold"
          />
          <button
            type="submit"
            disabled={creatingOrg}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs disabled:opacity-50 shrink-0"
          >
            {creatingOrg ? 'Creating...' : 'Create Workspace'}
          </button>
        </form>
      </div>
    </div>
  );
};
