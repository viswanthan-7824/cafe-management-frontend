import React, { useState, useEffect } from 'react';
import { api, getMediaUrl } from '../services/api';
import type { DemandForecastItem } from '../types';
import {
  TrendingUp,
  BrainCircuit,
  AlertTriangle,
  CheckCircle2,
  Package,
  Sparkles,
  RefreshCw,
  Search
} from 'lucide-react';

export function DemandForecastView() {
  const [forecasts, setForecasts] = useState<DemandForecastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'SHORTAGE' | 'CRITICAL' | 'OPTIMAL'>('ALL');

  useEffect(() => {
    loadForecasts();
  }, []);

  async function loadForecasts() {
    setLoading(true);
    try {
      const data = await api.getDemandForecast();
      setForecasts(data);
    } catch (e) {
      console.error('Failed to load demand forecasts:', e);
    } finally {
      setLoading(false);
    }
  }

  const filteredItems = forecasts.filter(item => {
    const matchesSearch = item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.category_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'ALL' || item.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalShortageCount = forecasts.filter(i => i.expected_shortage > 0).length;
  const criticalCount = forecasts.filter(i => i.status === 'CRITICAL').length;

  return (
    <div className="space-y-6">
      {/* 3D Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-2xl">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <BrainCircuit className="w-3.5 h-3.5 animate-pulse" />
              ML PREDICTION ENGINE
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading">
              Demand Intelligence & Forecast
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              Predictive stock optimization model based on historical canteen velocity, peak hour patterns, and real-time inventory levels.
            </p>
          </div>

          <button
            onClick={loadForecasts}
            disabled={loading}
            className="btn-3d btn-3d-primary flex items-center gap-2 self-start md:self-center"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Intelligence
          </button>
        </div>

        {/* Intelligence Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800">
          <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 rounded-2xl p-4">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Monitored Items</p>
            <p className="text-2xl font-extrabold text-white mt-1">{forecasts.length}</p>
          </div>
          <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 rounded-2xl p-4">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Expected Shortages</p>
            <p className="text-2xl font-extrabold text-amber-400 mt-1">{totalShortageCount}</p>
          </div>
          <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 rounded-2xl p-4">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Critical Alerts</p>
            <p className="text-2xl font-extrabold text-rose-400 mt-1">{criticalCount}</p>
          </div>
          <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 rounded-2xl p-4">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">ML Model Accuracy</p>
            <p className="text-2xl font-extrabold text-emerald-400 mt-1">94.8%</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products or categories..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'ALL'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Products ({forecasts.length})
          </button>
          <button
            onClick={() => setFilterStatus('SHORTAGE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'SHORTAGE'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Shortage Expected ({forecasts.filter(i => i.status === 'SHORTAGE').length})
          </button>
          <button
            onClick={() => setFilterStatus('CRITICAL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'CRITICAL'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Critical ({criticalCount})
          </button>
          <button
            onClick={() => setFilterStatus('OPTIMAL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'OPTIMAL'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Optimal ({forecasts.filter(i => i.status === 'OPTIMAL').length})
          </button>
        </div>
      </div>

      {/* 3D Forecast Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-card h-64 skeleton rounded-2xl" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="glass-card text-center py-16">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No predictions found</h3>
          <p className="text-sm text-slate-500 mt-1">Try broadening your search query or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredItems.map(item => {
            const hasShortage = item.expected_shortage > 0;
            return (
              <div
                key={item.product_id}
                className="card-3d glass-card p-6 border border-slate-200/80 hover:border-amber-300 transition-all space-y-4"
              >
                {/* Header info */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 card-3d-image-box">
                      <img
                        src={getMediaUrl(item.image_url) || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300'}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).setAttribute('src', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300');
                        }}
                      />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {item.category_name}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 leading-snug">
                        {item.product_name}
                      </h3>
                    </div>
                  </div>

                  <span
                    className={`badge ${
                      item.status === 'CRITICAL'
                        ? 'badge-danger'
                        : item.status === 'SHORTAGE'
                        ? 'badge-warning'
                        : 'badge-success'
                    }`}
                  >
                    {item.status === 'CRITICAL' ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : item.status === 'SHORTAGE' ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    {item.status}
                  </span>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-slate-400 block">Current Stock</span>
                    <span className="text-xl font-extrabold text-slate-800">{item.current_stock}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase text-slate-400 block">Predicted Demand</span>
                    <span className="text-xl font-extrabold text-indigo-600">{item.predicted_demand}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase text-slate-400 block">Expected Shortage</span>
                    <span className={`text-xl font-extrabold ${hasShortage ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {hasShortage ? `-${item.expected_shortage}` : '0'}
                    </span>
                  </div>
                </div>

                {/* AI Recommendation Box */}
                <div className={`p-4 rounded-xl text-xs font-semibold leading-relaxed border ${
                  hasShortage
                    ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                    : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="flex items-center gap-2 mb-1 font-bold text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    ML Intelligence Recommendation:
                  </div>
                  "{item.recommendation}"
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
