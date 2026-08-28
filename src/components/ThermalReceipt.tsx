import React from 'react';
import type { Order } from '../types';
import { Printer, X } from 'lucide-react';

interface ThermalReceiptProps {
  order: Order;
  cashierName?: string;
  isReprint?: boolean;
  onClose: () => void;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
  order,
  cashierName = 'Cashier Counter 1',
  isReprint = false,
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  const orderDate = new Date(order.created_at || Date.now()).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '1rem'
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/* Modal Action Header (Hidden on Print) */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.95rem', color: '#1e293b' }}>
            <Printer size={18} color="#ea580c" />
            <span>Thermal Bill Preview (58mm/80mm)</span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Thermal Print Area */}
        <div
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            background: '#ffffff'
          }}
        >
          <div
            id="thermal-receipt-print-area"
            style={{
              width: '100%',
              maxWidth: '300px',
              margin: '0 auto',
              padding: '12px 10px',
              fontFamily: '"Courier New", Courier, monospace',
              fontSize: '12px',
              color: '#000000',
              lineHeight: 1.4,
              border: '1px dashed #cbd5e1',
              borderRadius: '8px'
            }}
          >
            {/* Canteen Header */}
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '1px' }}>SAEC CAFÉ</div>
              <div style={{ fontSize: '10px' }}>Syed Ammal Engineering College</div>
              <div style={{ fontSize: '10px' }}>Ramanathapuram, Tamil Nadu</div>
              <div style={{ fontSize: '11px', marginTop: '4px', fontWeight: 'bold' }}>🍵 🥐 ☕ C++ CANTEEN</div>
            </div>

            <div style={{ borderBottom: '1px dashed #000000', margin: '6px 0' }} />

            {/* Order Details */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span>Order No:</span>
              <span style={{ fontWeight: 'bold' }}>{order.order_number || `CAN-${order.id}`}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span>Date/Time:</span>
              <span>{orderDate}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span>Customer:</span>
              <span>{order.customer_name || 'Counter Guest'}</span>
            </div>
            {order.token_number && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', margin: '4px 0' }}>
                <span>TOKEN NO:</span>
                <span>#{order.token_number}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span>Counter:</span>
              <span>{cashierName}</span>
            </div>

            <div style={{ borderBottom: '1px dashed #000000', margin: '6px 0' }} />

            {/* Items Table */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '11px', marginBottom: '4px' }}>
              <span style={{ flex: 2 }}>ITEM</span>
              <span style={{ width: '35px', textAlign: 'center' }}>QTY</span>
              <span style={{ width: '45px', textAlign: 'right' }}>PRICE</span>
              <span style={{ width: '50px', textAlign: 'right' }}>TOTAL</span>
            </div>

            <div style={{ borderBottom: '1px dotted #000000', marginBottom: '4px' }} />

            {order.items && order.items.map((item, idx) => {
              const itemTotal = Number(item.unit_price) * item.quantity;
              return (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                  <span style={{ flex: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.product_name || `Item ${idx + 1}`}
                  </span>
                  <span style={{ width: '35px', textAlign: 'center' }}>{item.quantity}</span>
                  <span style={{ width: '45px', textAlign: 'right' }}>₹{Number(item.unit_price).toFixed(0)}</span>
                  <span style={{ width: '50px', textAlign: 'right', fontWeight: 'bold' }}>₹{itemTotal.toFixed(0)}</span>
                </div>
              );
            })}

            <div style={{ borderBottom: '1px dashed #000000', margin: '6px 0' }} />

            {/* Total Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 900 }}>
              <span>GRAND TOTAL:</span>
              <span>₹{Number(order.total_amount).toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '4px' }}>
              <span>Payment Mode:</span>
              <span style={{ fontWeight: 'bold' }}>
                {order.payment_method === 'CASH'
                  ? 'Cash at Counter'
                  : order.payment_method === 'QR_COUNTER' || order.payment_method === 'UPI'
                  ? 'QR at Counter'
                  : order.payment_method || 'Cash at Counter'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span>Payment Status:</span>
              <span style={{ fontWeight: 'bold', color: order.payment_status === 'PAID' ? '#000000' : '#c2410c' }}>
                {order.payment_status === 'PAID' ? 'PAID ✓' : 'PAYMENT PENDING'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span>Order Status:</span>
              <span style={{ fontWeight: 'bold' }}>
                {order.status || 'CONFIRMED'}
              </span>
            </div>

            <div style={{ borderBottom: '1px dashed #000000', margin: '8px 0' }} />

            {/* Footer */}
            <div style={{ textAlign: 'center', fontSize: '10px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Good Food, Less Waiting.</div>
              <div>Please collect your food when your token is called.</div>
              <div style={{ marginTop: '4px' }}>*** THANK YOU! VISIT AGAIN ***</div>
            </div>
          </div>
        </div>

        {/* Print Actions Footer */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            gap: '0.75rem',
            background: '#f8fafc'
          }}
        >
          <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
            Close
          </button>
          <button
            onClick={handlePrint}
            className="btn btn-primary"
            style={{ flex: 1, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Printer size={18} />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
