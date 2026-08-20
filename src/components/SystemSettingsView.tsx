import React, { useState, useEffect } from 'react';
import { Settings, Shield, Clock, Bell, Save, CheckCircle2, Building, Mail, Phone } from 'lucide-react';
import { api } from '../services/api';
import type { SystemSettings } from '../types';

export const SystemSettingsView: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    canteen_name: 'SAEC CAFÉ',
    college_name: 'Syed Ammal Engineering College',
    motto: 'Good Food, Less Waiting.',
    operating_hours: '8:00 AM – 5:00 PM',
    app_ordering_window: '10:00 AM – 3:30 PM',
    tax_rate_percent: 0,
    enable_special_orders: true,
    contact_email: 'canteen@saec.ac.in',
    contact_phone: '+91 98765 43210',
    enable_sound_alerts: true
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const data = await api.getSystemSettings();
      setSettings(data);
    } catch (e) {
      console.error(e);
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSystemSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      alert('Error saving system settings');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Settings size={22} color="#ea580c" /> Canteen Configuration & System Settings
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.2rem', fontWeight: 500 }}>
            Configure institutional canteen parameters, mobile ordering windows, operational policies, and security controls.
          </p>
        </div>
        {saveSuccess && (
          <div style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle2 size={16} /> Settings Saved Successfully!
          </div>
        )}
      </div>

      <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
        {/* Left Column: Canteen Details & Operating Times */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="glass-card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building size={18} color="#ea580c" /> Institutional Information
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Canteen Name</label>
                <input
                  type="text"
                  value={settings.canteen_name}
                  onChange={(e) => setSettings({ ...settings, canteen_name: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>College / Institution Name</label>
                <input
                  type="text"
                  value={settings.college_name}
                  onChange={(e) => setSettings({ ...settings, college_name: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 600 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Motto / Tagline</label>
                <input
                  type="text"
                  value={settings.motto}
                  onChange={(e) => setSettings({ ...settings, motto: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 600, color: '#ea580c' }}
                />
              </div>
            </div>
          </div>

          <div className="glass-card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} color="#ea580c" /> Operating Windows & Ordering Policy
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Mobile App Ordering Hours</label>
                <input
                  type="text"
                  value={settings.app_ordering_window}
                  onChange={(e) => setSettings({ ...settings, app_ordering_window: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 700, color: '#047857' }}
                />
                <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>Enforced on backend API (10:00 AM – 3:30 PM on scheduled working days).</span>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>General Canteen Physical Hours</label>
                <input
                  type="text"
                  value={settings.operating_hours}
                  onChange={(e) => setSettings({ ...settings, operating_hours: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 600 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Contact, Security & Notifications */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="glass-card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={18} color="#ea580c" /> Helpdesk Contact Information
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Canteen Support Email</label>
                <input
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 600 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Support Contact Phone</label>
                <input
                  type="text"
                  value={settings.contact_phone}
                  onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 600 }}
                />
              </div>
            </div>
          </div>

          <div className="glass-card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={18} color="#ea580c" /> Security & Architecture
            </h3>

            <div style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Role-Based Access:</span>
                <span style={{ fontWeight: 800, color: '#047857' }}>Enforced (Admin / Cashier)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Database Connection:</span>
                <span style={{ fontWeight: 800, color: '#047857' }}>Django REST API Only</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Mobile Client Role:</span>
                <span style={{ fontWeight: 800, color: '#2563eb' }}>Student / Faculty</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Password Storage:</span>
                <span style={{ fontWeight: 800, color: '#047857' }}>PBKDF2 Hashed on Backend</span>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', marginTop: '1.5rem' }}>
              <Save size={16} /> Save Configuration
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
