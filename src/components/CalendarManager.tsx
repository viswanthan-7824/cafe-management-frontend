import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Edit2,
  X,
  UserCheck,
  CalendarCheck,
  CalendarX,
  RefreshCw,
  Info,
  CalendarDays
} from 'lucide-react';
import { api } from '../services/api';
import type { BusinessDay, DayStatus } from '../types';

export const CalendarManager: React.FC = () => {
  const [calendar, setCalendar] = useState<BusinessDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayStatus, setTodayStatus] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Specific Date Modal State
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [targetDate, setTargetDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dateStatus, setDateStatus] = useState<DayStatus>('WORKING_DAY');
  const [dateOpening, setDateOpening] = useState('10:00');
  const [dateClosing, setDateClosing] = useState('15:30');
  const [dateReason, setDateReason] = useState('');

  // Holiday Modal State
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [holidayReason, setHolidayReason] = useState('College Holiday');

  // Bulk Scheduler Modal state
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<DayStatus>('WORKING_DAY');
  const [bulkOpening, setBulkOpening] = useState('10:00');
  const [bulkClosing, setBulkClosing] = useState('15:30');
  const [bulkReason, setBulkReason] = useState('');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  // Search & Filter
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [calData, currentStatus] = await Promise.all([
        api.getCalendar(),
        api.getCurrentBusinessDayStatus()
      ]);
      setCalendar(calData);
      setTodayStatus(currentStatus);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleSetTodayWorking = async () => {
    setActionLoading(true);
    try {
      await api.setTodayWorkingDay('', '10:00', '15:30');
      await loadData();
      alert('✅ Today has been marked as a WORKING DAY. Ordering is enabled from 10:00 AM to 3:30 PM.');
    } catch (e: any) {
      alert(`Failed to set working day: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetTodayHoliday = async () => {
    setActionLoading(true);
    try {
      await api.setTodayHoliday(holidayReason.trim() || 'College Holiday');
      setIsHolidayModalOpen(false);
      await loadData();
      alert('🎉 Today has been marked as a HOLIDAY. Food ordering is disabled.');
    } catch (e: any) {
      alert(`Failed to set holiday: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveSpecificDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDate) {
      alert('Please select a valid date');
      return;
    }
    setActionLoading(true);
    try {
      await api.setDateStatus(targetDate, dateStatus, dateReason, dateOpening, dateClosing);
      setIsDateModalOpen(false);
      await loadData();
      alert(`✅ Updated status for ${targetDate} to ${dateStatus}.`);
    } catch (e: any) {
      alert(`Failed to update date: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkSubmit = async () => {
    if (selectedDates.length === 0) return;
    setActionLoading(true);
    try {
      await api.bulkScheduleCalendar(selectedDates, bulkStatus, bulkOpening, bulkClosing, bulkReason);
      setIsBulkOpen(false);
      setSelectedDates([]);
      await loadData();
      alert(`✅ Successfully updated ${selectedDates.length} dates.`);
    } catch (e: any) {
      alert('Error updating bulk calendar');
    } finally {
      setActionLoading(false);
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

  const filteredCalendar = calendar.filter(d => {
    if (filterStatus === 'ALL') return true;
    return d.status === filterStatus;
  });

  const isTodayWorking = todayStatus?.status === 'WORKING_DAY' || todayStatus?.status === 'SPECIAL_WORKING_DAY';
  const isTodayHoliday = todayStatus?.status === 'HOLIDAY';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
            <CalendarIcon size={24} color="#ea580c" /> Working Day & Operating Calendar Management
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.2rem', fontWeight: 500 }}>
            Control canteen working days and ordering availability. Ordering window: <strong>10:00 AM – 3:30 PM</strong> on working days.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => loadData()} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh Status
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setTargetDate(new Date().toISOString().split('T')[0]);
              setIsDateModalOpen(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
          >
            <CalendarDays size={16} /> Schedule Specific Date
          </button>
          <button className="btn btn-secondary" onClick={() => setIsBulkOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={16} /> Bulk Scheduler
          </button>
        </div>
      </div>

      {/* Prominent Current Day Status Banner */}
      <div
        className="glass-card"
        style={{
          background: isTodayWorking
            ? 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)'
            : isTodayHoliday
            ? 'linear-gradient(135deg, #fff1f2 0%, #ffffff 100%)'
            : 'linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)',
          border: isTodayWorking
            ? '1.5px solid #a7f3d0'
            : isTodayHoliday
            ? '1.5px solid #fecdd3'
            : '1.5px solid #fde68a',
          padding: '1.5rem',
          boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          {/* Left Column: Today's Details */}
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b' }}>
                CURRENT DAY STATUS
              </span>
              {todayStatus && getStatusBadge(todayStatus.status)}
            </div>

            <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: '0.2rem 0' }}>
              {todayStatus?.date ? new Date(todayStatus.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Today'}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.8)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={13} color="#ea580c" /> Operating Window
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1e293b', marginTop: '0.2rem' }}>
                  {todayStatus?.opening_time || '10:00'} – {todayStatus?.closing_time || '15:30'}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.8)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <UserCheck size={13} color="#ea580c" /> Last Updated By Admin
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1e293b', marginTop: '0.2rem' }}>
                  {todayStatus?.updated_by_name || 'System Admin'}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.8)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Info size={13} color="#ea580c" /> Ordering Restriction
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: todayStatus?.is_ordering_open ? '#047857' : '#b91c1c', marginTop: '0.2rem' }}>
                  {todayStatus?.is_ordering_open ? '🟢 Ordering is Live' : '🔒 Food Ordering Closed'}
                </div>
              </div>
            </div>

            {todayStatus?.reason && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#64748b', background: 'rgba(255,255,255,0.7)', padding: '0.5rem 0.8rem', borderRadius: '8px', borderLeft: '3px solid #ea580c' }}>
                <strong>Reason / Note:</strong> {todayStatus.reason}
              </div>
            )}
          </div>

          {/* Right Column: One-Click Quick Action Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', minWidth: '240px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
              Quick Actions for Today:
            </span>

            <button
              onClick={handleSetTodayWorking}
              disabled={actionLoading}
              className="btn"
              style={{
                background: '#059669',
                color: '#ffffff',
                fontWeight: 800,
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                borderRadius: '10px',
                boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <CalendarCheck size={18} /> Set Today as Working Day
            </button>

            <button
              onClick={() => setIsHolidayModalOpen(true)}
              disabled={actionLoading}
              className="btn"
              style={{
                background: '#dc2626',
                color: '#ffffff',
                fontWeight: 800,
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                borderRadius: '10px',
                boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <CalendarX size={18} /> Set Today as Holiday
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Summary Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Working Days', count: calendar.filter(c => c.status === 'WORKING_DAY').length, color: '#059669' },
          { label: 'Special Working', count: calendar.filter(c => c.status === 'SPECIAL_WORKING_DAY').length, color: '#2563eb' },
          { label: 'Holidays', count: calendar.filter(c => c.status === 'HOLIDAY').length, color: '#dc2626' },
          { label: 'Closed Days', count: calendar.filter(c => c.status === 'CLOSED').length, color: '#d97706' },
          { label: 'Total Scheduled', count: calendar.length, color: '#ea580c' },
        ].map((item, idx) => (
          <div key={idx} className="glass-card" style={{ padding: '1.1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>{item.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: item.color, marginTop: '0.25rem' }}>{item.count}</div>
          </div>
        ))}
      </div>

      {/* Calendar History Section & Filter Tabs */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CalendarIcon size={18} color="#ea580c" /> Calendar Schedule History
          </h3>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {['ALL', 'WORKING_DAY', 'HOLIDAY', 'CLOSED', 'SPECIAL_WORKING_DAY'].map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`btn ${filterStatus === st ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '8px' }}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input
                  type="checkbox"
                  checked={selectedDates.length > 0 && selectedDates.length === filteredCalendar.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedDates(filteredCalendar.map(d => d.date));
                    } else {
                      setSelectedDates([]);
                    }
                  }}
                />
              </th>
              <th>Date & Day</th>
              <th>Status</th>
              <th>Operating Hours</th>
              <th>Reason / Description</th>
              <th>Updated By</th>
              <th>Sequence No.</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  Loading calendar schedule...
                </td>
              </tr>
            ) : filteredCalendar.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  No calendar dates matching selected filter.
                </td>
              </tr>
            ) : (
              filteredCalendar.map((day) => {
                const isSelected = selectedDates.includes(day.date);
                const isCurrent = day.date === todayStatus?.date;
                const dObj = new Date(day.date);
                const dayOfWeek = dObj.toLocaleDateString('en-US', { weekday: 'long' });

                return (
                  <tr key={day.date} style={{ background: isCurrent ? '#fefce8' : undefined }}>
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
                    <td>
                      <div>
                        <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.95rem' }}>{day.date}</span>
                        {isCurrent && <span className="badge badge-amber" style={{ marginLeft: '6px', fontSize: '0.65rem' }}>TODAY</span>}
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{dayOfWeek}</div>
                      </div>
                    </td>
                    <td>{getStatusBadge(day.status)}</td>
                    <td style={{ color: '#1e293b', fontWeight: 600 }}>
                      {day.opening_time} – {day.closing_time}
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.85rem' }}>{day.reason || '—'}</td>
                    <td style={{ color: '#1e293b', fontSize: '0.82rem', fontWeight: 600 }}>
                      {day.updated_by_name || 'Admin'}
                    </td>
                    <td>
                      <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>CAN-{day.daily_order_sequence}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                        onClick={() => {
                          setTargetDate(day.date);
                          setDateStatus(day.status);
                          setDateOpening(day.opening_time);
                          setDateClosing(day.closing_time);
                          setDateReason(day.reason || '');
                          setIsDateModalOpen(true);
                        }}
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Schedule Specific Date Modal */}
      {isDateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDateModalOpen(false)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CalendarDays size={18} color="#ea580c" /> Schedule Date Status
              </h3>
              <button onClick={() => setIsDateModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSpecificDate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>Target Date *</label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>Day Status *</label>
                <select
                  value={dateStatus}
                  onChange={(e) => setDateStatus(e.target.value as DayStatus)}
                  className="input-field"
                  style={{ width: '100%', fontWeight: 700 }}
                >
                  <option value="WORKING_DAY">🟢 WORKING_DAY (Normal Operating Day)</option>
                  <option value="HOLIDAY">🎉 HOLIDAY (Ordering Closed)</option>
                  <option value="SPECIAL_WORKING_DAY">🔵 SPECIAL_WORKING_DAY (Event/Symposium)</option>
                  <option value="CLOSED">🔴 CLOSED (Maintenance Closure)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>Opening Time</label>
                  <input
                    type="time"
                    value={dateOpening}
                    onChange={(e) => setDateOpening(e.target.value)}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>Closing Time</label>
                  <input
                    type="time"
                    value={dateClosing}
                    onChange={(e) => setDateClosing(e.target.value)}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>Reason / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Regular College Day, Annual Sports Day, Semester Exam"
                  value={dateReason}
                  onChange={(e) => setDateReason(e.target.value)}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsDateModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading} style={{ fontWeight: 800 }}>
                  {actionLoading ? 'Saving...' : 'Save Date Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Today as Holiday Modal with Reason */}
      {isHolidayModalOpen && (
        <div className="modal-overlay" onClick={() => setIsHolidayModalOpen(false)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', padding: '1.75rem', textAlign: 'center' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <CalendarX size={26} color="#dc2626" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>
              Mark Today as Holiday?
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem', lineHeight: '1.4' }}>
              Food ordering will be immediately disabled for students and faculty. Existing order history will remain safely accessible.
            </p>

            <div style={{ textAlign: 'left', marginTop: '1rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.3rem' }}>Holiday Reason</label>
              <input
                type="text"
                placeholder="e.g. Government Holiday / College Annual Day"
                value={holidayReason}
                onChange={(e) => setHolidayReason(e.target.value)}
                className="input-field"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsHolidayModalOpen(false)}>
                Cancel
              </button>
              <button
                className="btn"
                style={{ flex: 1, background: '#dc2626', color: '#ffffff', fontWeight: 800, border: 'none', cursor: 'pointer' }}
                disabled={actionLoading}
                onClick={handleSetTodayHoliday}
              >
                {actionLoading ? 'Updating...' : 'Confirm Holiday'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Scheduler Modal */}
      {isBulkOpen && (
        <div className="modal-overlay" onClick={() => setIsBulkOpen(false)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', padding: '1.75rem' }}>
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
                <div style={{ fontSize: '0.85rem', color: '#ea580c', fontWeight: 700, maxHeight: '60px', overflowY: 'auto' }}>
                  {selectedDates.length > 0 ? selectedDates.join(', ') : 'No dates selected. Tick checkboxes in the table below first.'}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>Day Status:</label>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value as DayStatus)}
                  className="input-field"
                  style={{ width: '100%', fontWeight: 700 }}
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
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>Closing Time:</label>
                  <input
                    type="time"
                    value={bulkClosing}
                    onChange={(e) => setBulkClosing(e.target.value)}
                    className="input-field"
                    style={{ width: '100%' }}
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
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button className="btn btn-secondary" onClick={() => setIsBulkOpen(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleBulkSubmit} disabled={selectedDates.length === 0 || actionLoading}>
                  {actionLoading ? 'Applying...' : 'Apply Calendar Settings'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
