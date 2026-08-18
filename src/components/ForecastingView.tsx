import React, { useState, useEffect } from 'react';
import { Cpu, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import type { DemandForecast } from '../types';

export const ForecastingView: React.FC = () => {
  const [forecasts, setForecasts] = useState<DemandForecast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadForecast();
  }, []);

  async function loadForecast() {
    setLoading(true);
    try {
      const data = await api.getDemandForecast();
      setForecasts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Cpu size={22} color="#4f46e5" /> SAEC CAFÉ AI Demand Forecasting Engine
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.2rem', fontWeight: 500 }}>
            Scikit-Learn Machine Learning heuristic predicting next-day canteen demand based on historical sales trends & day-of-week weights.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={loadForecast} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={14} /> Recalculate Predictions
        </button>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Historical Sales</th>
              <th>Predicted Tomorrow Demand</th>
              <th>Recommended Reorder Qty</th>
              <th>Recommendation</th>
            </tr>
          </thead>
          <tbody>
            {forecasts.map(f => (
              <tr key={f.product_id}>
                <td style={{ fontWeight: 800, color: '#1e293b' }}>{f.product_name}</td>
                <td style={{ color: '#64748b', fontWeight: 600 }}>{f.category}</td>
                <td style={{ fontWeight: 800, color: '#4f46e5' }}>{f.current_stock} Units</td>
                <td style={{ color: '#64748b' }}>{f.total_historical_sold} Sold</td>
                <td style={{ fontWeight: 900, color: '#1e293b' }}>{f.predicted_demand_next_day} Units</td>
                <td style={{ fontWeight: 900, color: f.recommended_reorder_qty > 0 ? '#b45309' : '#047857' }}>
                  {f.recommended_reorder_qty > 0 ? `+${f.recommended_reorder_qty}` : '0 (Sufficient)'}
                </td>
                <td>
                  <span className={`badge ${f.recommended_reorder_qty > 0 ? 'badge-amber' : 'badge-emerald'}`}>
                    {f.stock_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
