import React, { useState } from 'react';
import { Printer, Eye, X, Check } from 'lucide-react';
import type { Order } from '../types';

interface ThermalReceiptProps {
  order: Order;
  cashierName?: string;
  onClose: () => void;
  isReprint?: boolean;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
  order,
  cashierName = 'Canteen Cashier',
  onClose,
  isReprint = false,
}) => {
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('58mm');
  const [isPrinting, setIsPrinting] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);

  const orderDate = new Date(order.created_at);
  const formattedDate = orderDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = orderDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const handlePrint = () => {
    setIsPrinting(true);
    setPrintSuccess(false);

    // Trigger standard browser thermal print workflow
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
      setPrintSuccess(true);
    }, 400);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" style={{ maxWidth: '480px', padding: '1.5rem', background: '#ffffff' }}>
        {/* Modal Controls Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Printer size={18} color="#ea580c" /> Thermal Bill Printer
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
              {isReprint ? '🔄 Reprinting Existing Order Receipt' : '🧾 Live Counter Order Receipt'}
            </p>
          </div>
          
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Paper Size Selector */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', alignSelf: 'center' }}>Roll Width:</span>
          <button
            type="button"
            className={`btn ${paperWidth === '58mm' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem' }}
            onClick={() => setPaperWidth('58mm')}
          >
            58mm Thermal
          </button>
          <button
            type="button"
            className={`btn ${paperWidth === '80mm' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem' }}
            onClick={() => setPaperWidth('80mm')}
          >
            80mm Thermal
          </button>
        </div>

        {/* Live Thermal Receipt Canvas (Printable Area) */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '1rem',
            display: 'flex',
            justifyContent: 'center',
            maxHeight: '380px',
            overflowY: 'auto',
            marginBottom: '1rem',
          }}
        >
          <div
            className={`thermal-receipt-container thermal-receipt-printable ${
              paperWidth === '58mm' ? 'thermal-receipt-58mm' : 'thermal-receipt-80mm'
            }`}
            style={{
              boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
              border: '1px solid #e2e8f0',
            }}
          >
            {/* Header */}
            <div className="thermal-divider" />
            <div className="thermal-header">
              <div className="thermal-title">SAEC CAFÉ</div>
              <div className="thermal-subtitle">FOOD & BEVERAGES</div>
              <div style={{ fontSize: '9px', color: '#333333' }}>Syed Ammal Engineering College</div>
              {isReprint && (
                <div style={{ fontSize: '9px', fontWeight: 900, marginTop: '2px', textDecoration: 'underline' }}>
                  ** DUPLICATE / REPRINT **
                </div>
              )}
            </div>
            <div className="thermal-divider" />

            {/* Meta */}
            <div style={{ margin: '4px 0', fontSize: paperWidth === '58mm' ? '10px' : '11px' }}>
              <div className="thermal-row">
                <span>Order No:</span>
                <span style={{ fontWeight: 900 }}>{order.order_number}</span>
              </div>
              <div className="thermal-row">
                <span>Date:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="thermal-row">
                <span>Time:</span>
                <span>{formattedTime}</span>
              </div>
              <div className="thermal-row">
                <span>Cashier:</span>
                <span>{cashierName}</span>
              </div>
              {order.customer_name && (
                <div className="thermal-row">
                  <span>Customer:</span>
                  <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {order.customer_name}
                  </span>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="thermal-divider" />
            <table className="thermal-table">
              <thead>
                <tr>
                  <th style={{ width: '55%' }}>ITEM</th>
                  <th style={{ width: '18%', textAlign: 'center' }}>QTY</th>
                  <th style={{ width: '27%', textAlign: 'right' }}>PRICE</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((it) => (
                  <tr key={it.id}>
                    <td style={{ wordBreak: 'break-word' }}>{it.product_name}</td>
                    <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                    <td style={{ textAlign: 'right' }}>₹{Number(it.total_price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Calculations */}
            <div className="thermal-divider" />
            <div className="thermal-row" style={{ fontSize: paperWidth === '58mm' ? '10px' : '11px' }}>
              <span>Subtotal:</span>
              <span>₹{Number(order.subtotal || order.total_amount).toFixed(2)}</span>
            </div>
            {Number(order.discount_amount) > 0 && (
              <div className="thermal-row" style={{ fontSize: paperWidth === '58mm' ? '10px' : '11px' }}>
                <span>Discount:</span>
                <span>-₹{Number(order.discount_amount).toFixed(2)}</span>
              </div>
            )}
            <div className="thermal-divider" />
            <div
              className="thermal-row"
              style={{ fontWeight: 900, fontSize: paperWidth === '58mm' ? '12px' : '13px' }}
            >
              <span>TOTAL:</span>
              <span>₹{Number(order.total_amount).toFixed(2)}</span>
            </div>
            <div className="thermal-double-divider" />

            {/* Footer Details */}
            <div style={{ margin: '4px 0', fontSize: paperWidth === '58mm' ? '10px' : '11px' }}>
              <div className="thermal-row">
                <span>Payment:</span>
                <span style={{ fontWeight: 900 }}>{order.payment_status === 'PAID' ? 'PAID / CASH' : order.payment_status}</span>
              </div>
              <div className="thermal-row">
                <span>Order Status:</span>
                <span style={{ fontWeight: 900 }}>{order.status}</span>
              </div>
            </div>

            <div className="thermal-divider" />
            <div className="thermal-footer">
              <div>THANK YOU!</div>
              <div>VISIT AGAIN</div>
            </div>
            <div className="thermal-divider" />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ flex: 1 }}
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ flex: 1.5 }}
            disabled={isPrinting}
            onClick={handlePrint}
          >
            <Printer size={16} />
            {isPrinting ? 'Printing Receipt...' : isReprint ? 'Reprint Bill' : 'Print Bill'}
          </button>
        </div>

        {printSuccess && (
          <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: '#ecfdf5', color: '#047857', borderRadius: '6px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: 700 }}>
            <Check size={14} /> Bill dispatched to printer successfully.
          </div>
        )}
      </div>
    </div>
  );
};
