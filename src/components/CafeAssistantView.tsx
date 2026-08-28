import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Printer,
  CheckCircle2,
  AlertTriangle,
  FileText,
  TrendingUp,
  Boxes,
  RefreshCw,
  Info,
  Clock,
  ChevronRight,
  ShieldCheck,
  Zap,
  Coffee,
  Check,
  X,
  HelpCircle
} from 'lucide-react';
import { api } from '../services/api';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  cardType?: string;
  actionPreview?: any;
  ambiguousData?: any;
  clarificationData?: any;
  pdfData?: any;
  forecastData?: any;
  inventoryData?: any;
  error?: string;
}

export const CafeAssistantView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: "Hi! I'm your Café Assistant. Ask me anything about the canteen.",
      cardType: 'WELCOME'
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedCommands = [
    "Is the canteen open today?",
    "What is today's revenue?",
    "How many burgers were sold?",
    "How much samosa stock is remaining?",
    "Which product sold the most today?",
    "What should we restock?",
    "Declare tomorrow as a holiday",
    "Generate today's report as PDF"
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendCommand = async (commandText: string) => {
    const prompt = commandText.trim();
    if (!prompt || isSending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: prompt
    };

    // Format context history for backend LLM
    const historyPayload = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text
      }));

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsSending(true);

    try {
      const res = await api.chatWithAssistant(prompt, historyPayload);

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: res.text || 'Command processed.',
        cardType: res.card_type,
        actionPreview: res.action_preview,
        ambiguousData: res.ambiguous_data,
        clarificationData: res.clarification_data,
        pdfData: res.pdf_data,
        forecastData: res.data && res.card_type === 'FORECAST_TABLE' ? res.data : undefined,
        inventoryData: res.data && (res.card_type === 'INVENTORY_LIST' || res.card_type === 'PRODUCT_STOCK_CARD') ? res.data : undefined
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: err.message || 'Unable to process assistant command.',
          cardType: 'ERROR'
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirmAction = async (preview: any, msgId: string) => {
    try {
      const res = await api.confirmAssistantAction(preview);

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === msgId) {
            return {
              ...msg,
              cardType: 'ACTION_CONFIRMED',
              text: `✅ **Confirmed**: ${res.message || 'Action executed successfully in PostgreSQL.'}`
            };
          }
          return msg;
        })
      );
    } catch (err: any) {
      alert(err.message || 'Failed to execute confirmed action.');
    }
  };

  const handleDownloadPdf = async (reportType: string = 'DAILY_SALES') => {
    setDownloadingPdf(true);
    try {
      await api.downloadPdfReport(reportType, 'today');
    } catch (err: any) {
      alert(err.message || 'Failed to download PDF report.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: 'calc(100vh - 120px)', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top Header Card */}
      <div className="glass-card" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', background: 'linear-gradient(135deg, #ffffff 0%, #fff7ed 100%)', border: '1px solid #fed7aa' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#ea580c', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)' }}>
            <Coffee size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              SAEC CAFÉ Canteen Assistant
              <span className="badge badge-primary" style={{ fontSize: '0.68rem' }}>AI Powered</span>
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
              Dynamic natural language query, live order stats, inventory tool execution & PDF report generator.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => handleDownloadPdf('DAILY_SALES')}
            disabled={downloadingPdf}
            className="btn btn-primary"
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', fontWeight: 700 }}
          >
            <Printer size={14} /> {downloadingPdf ? 'Downloading...' : "Today's PDF Report"}
          </button>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        {/* Messages Body */}
        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: '#f8fafc' }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              {/* Message Bubble Header */}
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.25rem', padding: '0 0.5rem', fontWeight: 600 }}>
                {msg.sender === 'user' ? 'You' : '☕ Café Assistant'} • {msg.timestamp}
              </div>

              {/* Message Bubble Content */}
              <div
                style={{
                  maxWidth: '82%',
                  padding: '1rem 1.25rem',
                  borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: msg.sender === 'user' ? '#ea580c' : '#ffffff',
                  color: msg.sender === 'user' ? '#ffffff' : '#1e293b',
                  boxShadow: msg.sender === 'user' ? '0 4px 14px rgba(234, 88, 12, 0.25)' : '0 2px 10px rgba(0,0,0,0.04)',
                  border: msg.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                  fontSize: '0.88rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-line'
                }}
              >
                {msg.text}

                {/* Card Type 1: PDF Download Card */}
                {msg.cardType === 'PDF_DOWNLOAD' && msg.pdfData && (
                  <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid #e2e8f0', background: '#fff7ed', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#1e293b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <FileText size={24} color="#ea580c" />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{msg.pdfData.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Period: {msg.pdfData.period} • Ready for download</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadPdf(msg.pdfData.report_type)}
                      disabled={downloadingPdf}
                      className="btn btn-primary"
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem', fontWeight: 800 }}
                    >
                      <Printer size={14} /> Download PDF
                    </button>
                  </div>
                )}

                {/* Card Type 2: Action Preview Confirmation Card */}
                {msg.cardType === 'CONFIRMATION_CARD' && msg.actionPreview && (
                  <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid #fed7aa', background: '#fff9f5', borderRadius: '12px', padding: '1rem', border: '1px solid #fed7aa' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ea580c', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                      Action Confirmation Required
                    </div>

                    <div style={{ background: '#ffffff', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #ffedd5', marginBottom: '0.85rem' }}>
                      <div style={{ fontWeight: 900, fontSize: '1rem', color: '#1e293b' }}>
                        {msg.actionPreview.product_name || msg.actionPreview.date || 'Canteen Action'}
                      </div>
                      <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.4rem', fontSize: '0.82rem', flexWrap: 'wrap' }}>
                        {msg.actionPreview.current_stock !== undefined && (
                          <span>Current Stock: <strong>{msg.actionPreview.current_stock}</strong></span>
                        )}
                        {msg.actionPreview.new_stock !== undefined && (
                          <span>New Stock: <strong style={{ color: '#ea580c' }}>{msg.actionPreview.new_stock}</strong></span>
                        )}
                        {msg.actionPreview.date && (
                          <span>Date: <strong>{msg.actionPreview.date}</strong></span>
                        )}
                        {msg.actionPreview.reason && (
                          <span>Reason: <strong>{msg.actionPreview.reason}</strong></span>
                        )}
                      </div>
                    </div>

                    {msg.actionPreview.warning && (
                      <div style={{ fontSize: '0.78rem', color: '#c2410c', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <AlertTriangle size={14} />
                        {msg.actionPreview.warning}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleConfirmAction(msg.actionPreview, msg.id)}
                        className="btn btn-success"
                        style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem', fontWeight: 800 }}
                      >
                        <Check size={14} /> CONFIRM
                      </button>
                      <button
                        onClick={() => {
                          setMessages((prev) =>
                            prev.map((m) => (m.id === msg.id ? { ...m, cardType: 'CANCELLED', text: '❌ Action cancelled.' } : m))
                          );
                        }}
                        className="btn btn-secondary"
                        style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem', color: '#64748b' }}
                      >
                        <X size={14} /> CANCEL
                      </button>
                    </div>
                  </div>
                )}

                {/* Card Type 3: Clarification Card */}
                {msg.cardType === 'CLARIFICATION_CARD' && msg.clarificationData && (
                  <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ea580c', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <HelpCircle size={14} /> Clarification Options:
                    </div>
                    {msg.clarificationData.options?.map((opt: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (opt.action === 'DISABLE_TODAY') {
                            handleSendCommand(`Make ${opt.label.split(' ')[1] || 'item'} unavailable for today`);
                          } else {
                            handleSendCommand(`Remove ${opt.label.split(' ')[1] || 'item'} permanently`);
                          }
                        }}
                        style={{
                          padding: '0.6rem 0.85rem',
                          borderRadius: '8px',
                          border: '1px solid #fed7aa',
                          background: '#fff7ed',
                          color: '#1e293b',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        • {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Card Type 4: Ambiguous Product Selector */}
                {msg.cardType === 'AMBIGUOUS_PRODUCT_SELECTOR' && msg.ambiguousData && (
                  <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {msg.ambiguousData.options?.map((opt: any) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          const cmd = `${msg.ambiguousData.verb} ${msg.ambiguousData.quantity} ${opt.name}`;
                          handleSendCommand(cmd);
                        }}
                        style={{
                          padding: '0.6rem 0.85rem',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          color: '#1e293b',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span>{opt.name}</span>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>Stock: {opt.stock} • ₹{opt.price}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isSending && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#ea580c', fontSize: '0.82rem', paddingLeft: '0.5rem', fontWeight: 700 }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #fed7aa', borderTopColor: '#ea580c', animation: 'spin 0.8s linear infinite' }} />
              Café Assistant is processing database query...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Commands */}
        <div style={{ padding: '0.65rem 1rem', background: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
          {suggestedCommands.map((cmd, idx) => (
            <button
              key={idx}
              onClick={() => handleSendCommand(cmd)}
              style={{
                whiteSpace: 'nowrap',
                padding: '0.35rem 0.75rem',
                borderRadius: '9999px',
                border: '1px solid #fed7aa',
                background: '#fff7ed',
                color: '#ea580c',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              • {cmd}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div style={{ padding: '1rem 1.25rem', background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendCommand(inputPrompt);
            }}
            style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}
          >
            <input
              type="text"
              placeholder="Ask me anything about the canteen (e.g. Is canteen open today?, What is today's revenue?, Set samosa stock to 100)..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              disabled={isSending}
              className="input-field"
              style={{ flex: 1, padding: '0.75rem 1rem', fontSize: '0.9rem' }}
            />
            <button
              type="submit"
              disabled={isSending || !inputPrompt.trim()}
              className="btn btn-primary"
              style={{ padding: '0.75rem 1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Send size={16} /> Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
