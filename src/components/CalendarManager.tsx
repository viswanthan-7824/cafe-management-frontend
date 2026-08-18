import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, Edit2, X } from 'lucide-react';
import { api } from '../services/api';
import type { BusinessDay, DayStatus } from '../types';

export const CalendarManager: React.FC = () => {
  const [calendar, setCalendar] = useState<BusinessDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<BusinessDay | null>(null);

  // Bulk Scheduler Modal state
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<DayStatus>('WORKING_DAY');
  const [bulkOpening, setBulkOpening] = useState('10:00');
  const [bulkClosing, setBulkClosing] = useState('15:30');
  const [bulkReason, setBulkReason] = useState('');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await api.getCalendar();
      setCalendar(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleBulkSubmit = async () => {
    if (selectedDates.length === 0) return;
    try {
      await api.bulkScheduleCalendar(selectedDates, bulkStatus, bulkOpening, bulkClosing, bulkReason);
      setIsBulkOpen(false);
      setSelectedDates([]);
      loadData();
    } catch (e) {
      alert('Error updating calendar');
    }
  };

  const getStatusBadge = (status: DayStatus) => {
    switch (status) {
      case 'WORKING_DAY':
        return <span className="badge badge-emerald">🟢 WORKING DAY</span>;
      case 'SPECIAL_WORKING_DAY':
        return <span className="badge badge-blue">🔵 SPECIAL WORKING</span>;
      case 'HOLIDAY':
        return <span className="badge badge-rose">🎉 HOLIDAY</span>;
      case 'CLOSED':
        return <span className="badge badge-amber">🔴 CANTEEN CLOSED</span>;
      default:
        return <span className="badge badge-amber">⚠️ NOT SCHEDULED</span>;
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CalendarIcon size={22} color="#4f46e5" /> SAEC CAFÉ Calendar & Operating Hours
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.2rem', fontWeight: 500 }}>
            Admin controls working days. Default hours: 10:00 AM – 3:30 PM. Unscheduled days default to ORDERING CLOSED.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsBulkOpen(true)}>
          <Plus size={16} /> Bulk Date Scheduler
        </button>
      </div>

      {/* Calendar Summary Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Working Days', count: calendar.filter(c => c.status === 'WORKING_DAY').length },
          { label: 'Special Working', count: calendar.filter(c => c.status === 'SPECIAL_WORKING_DAY').length },
          { label: 'Holidays', count: calendar.filter(c => c.status === 'HOLIDAY').length },
          { label: 'Closed Days', count: calendar.filter(c => c.status === 'CLOSED').length },
          { label: 'Total Scheduled', count: calendar.length },
        ].map((item, idx) => (
          <div key={idx} className="glass-card" style={{ padding: '1.1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>{item.label}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#4f46e5', marginTop: '0.25rem' }}>{item.count}</div>
          </div>
        ))}
      </div>

      {/* Calendar List Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Select</th>
              <th>Date</th>
              <th>Status</th>
              <th>Operating Hours</th>
              <th>Reason / Notes</th>
              <th>Order Sequence</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {calendar.map((day) => {
              const isSelected = selectedDates.includes(day.date);
              return (
                <tr key={day.date}>
                  <td>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDates([...selectedDates, day.date]);
                        } else {
                          setSelectedDates(selectedDates.filter(d => d !== day.date));
                        }
                      }}
                    />
                  </td>
                  <td style={{ fontWeight: 800, color: '#1e293b' }}>{day.date}</td>
                  <td>{getStatusBadge(day.status)}</td>
                  <td style={{ color: '#1e293b', fontWeight: 600 }}>
                    {day.opening_time} – {day.closing_time}
                  </td>
                  <td style={{ color: '#64748b' }}>{day.reason || '—'}</td>
                  <td>
                    <span className="badge badge-purple">Sequence: {day.daily_order_sequence}</span>
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                      onClick={() => setSelectedDate(day)}
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bulk Scheduler Modal */}
      {isBulkOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>
                Bulk Configure Operating Calendar
              </h3>
              <button onClick={() => setIsBulkOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>
                  Selected Dates ({selectedDates.length}):
                </label>
                <div style={{ fontSize: '0.85rem', color: '#4f46e5', fontWeight: 700 }}>
                  {selectedDates.length > 0 ? selectedDates.join(', ') : 'No dates checked in list. Tick checkboxes in table first.'}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>Day Status:</label>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value as DayStatus)}
                  style={{ width: '100%', padding: '0.65rem', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', borderRadius: '8px', fontWeight: 600 }}
                >
                  <option value="WORKING_DAY">WORKING_DAY (Normal Operating Day)</option>
                  <option value="SPECIAL_WORKING_DAY">SPECIAL_WORKING_DAY (Special College Event)</option>
                  <option value="HOLIDAY">HOLIDAY (Closed)</option>
                  <option value="CLOSED">CLOSED (Canteen Maintenance)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>Opening Time:</label>
                  <input
                    type="time"
                    value={bulkOpening}
                    onChange={(e) => setBulkOpening(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', borderRadius: '8px', fontWeight: 600 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>Closing Time:</label>
                  <input
                    type="time"
                    value={bulkClosing}
                    onChange={(e) => setBulkClosing(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', borderRadius: '8px', fontWeight: 600 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>Reason / Notes:</label>
                <input
                  type="text"
                  placeholder="e.g. Independence Day / Maintenance / Special Workshop"
                  value={bulkReason}
                  onChange={(e) => setBulkReason(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', borderRadius: '8px', fontWeight: 600 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button className="btn btn-secondary" onClick={() => setIsBulkOpen(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleBulkSubmit}>Apply Calendar Settings</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
