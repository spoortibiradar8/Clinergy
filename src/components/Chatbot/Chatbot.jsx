import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { backendApi } from '../../services/backendApi';
import './Chatbot.css';

// ── Icons (inline SVG to avoid extra deps) ─────────────────────────
function BotIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2"/>
      <circle cx="12" cy="5" r="2"/>
      <path d="M12 7v4"/>
      <line x1="8" y1="16" x2="8" y2="16"/>
      <line x1="16" y1="16" x2="16" y2="16"/>
    </svg>
  );
}

function SendIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function MinimizeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

function SpinnerIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  );
}

function ZapIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}

// ── Simple markdown renderer ──────────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return null;
  // Bold
  let html = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Bullet lists
  html = html.replace(/^[•\-\*]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/((<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');
  // Newlines to <br>
  html = html.replace(/\n(?!<[ul|li])/g, '<br/>');
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

// ── Page name map ─────────────────────────────────────────────────────
const PAGE_NAMES = {
  '/': 'Dashboard',
  '/live': 'Live Monitoring',
  '/zones': 'Zones',
  '/reports': 'Reports',
  '/ai-insights': 'AI Insights',
  '/alerts': 'Alerts',
  '/maintenance': 'Maintenance',
  '/settings': 'Settings',
  '/admin/users': 'Admin Portal',
  '/search': 'Search',
};

// ── Format timestamp ──────────────────────────────────────────────────
function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

// ── Main Component ────────────────────────────────────────────────────
export default function Chatbot() {
  const { role, displayName, initials } = useAuth();
  const location = useLocation();
  const currentPage = location.pathname;
  const pageName = PAGE_NAMES[currentPage] || 'CLINERGY';

  const [isOpen, setIsOpen] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);

  const [quickReplies, setQuickReplies] = useState(["What's the current energy status?", "Any active alerts?"]);

  useEffect(() => {
    backendApi.getQuickReplies(currentPage).then(setQuickReplies).catch(console.error);
  }, [currentPage]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const openPanel = () => {
    setIsOpen(true);
    setIsAnimatingOut(false);
    setHasNewMessage(false);
  };

  const closePanel = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsAnimatingOut(false);
    }, 240);
  };

  const togglePanel = () => {
    if (isOpen) closePanel();
    else openPanel();
  };

  const handleSend = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isLoading) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Build history excluding the current message
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await backendApi.chat(history, trimmed, pageName, role);

      const botMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);

      if (!isOpen) setHasNewMessage(true);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: "😔 Something went wrong. Please try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, pageName, role, isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const isEmpty = messages.length === 0;

  return (
    <>
      {/* ── Floating Action Button ── */}
      <button
        id="clinergy-chatbot-fab"
        className="chatbot-fab"
        onClick={togglePanel}
        aria-label="Open CLINERGY AI Assistant"
        aria-expanded={isOpen}
      >
        {isOpen
          ? <CloseIcon />
          : <BotIcon className="chatbot-fab-icon" />
        }
        {hasNewMessage && !isOpen && <span className="chatbot-fab-badge">1</span>}
        <span className="chatbot-fab-tooltip">CLINERGY AI</span>
      </button>

      {/* ── Chat Panel ── */}
      {isOpen && (
        <div
          ref={panelRef}
          className={`chatbot-panel ${isAnimatingOut ? 'chatbot-panel-exit' : 'chatbot-panel-enter'}`}
          role="dialog"
          aria-label="CLINERGY AI Assistant"
          aria-modal="false"
        >
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-avatar">
              <ZapIcon className="chatbot-fab-icon" />
            </div>
            <div className="chatbot-header-info">
              <div className="chatbot-header-title">CLINERGY AI</div>
              <div className="chatbot-header-status">
                <span className="chatbot-status-dot" />
                Live · {pageName}
              </div>
            </div>
            <div className="chatbot-header-actions">
              {messages.length > 0 && (
                <button
                  className="chatbot-header-btn"
                  onClick={clearChat}
                  aria-label="Clear conversation"
                  title="Clear chat"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/>
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </button>
              )}
              <button
                className="chatbot-header-btn"
                onClick={closePanel}
                aria-label="Close chat"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chatbot-messages" role="log" aria-live="polite" aria-label="Chat messages">
            {isEmpty ? (
              /* Welcome Screen */
              <div className="chatbot-welcome">
                <div className="chatbot-welcome-icon">
                  <BotIcon className="chatbot-fab-icon" />
                </div>
                <h3>Hi {displayName?.split(' ')[0] || 'there'}! 👋</h3>
                <p>
                  I'm your CLINERGY AI Assistant. Ask me anything about energy usage, alerts, costs, maintenance, or how to navigate the platform.
                </p>
                <div className="chatbot-quick-replies">
                  {quickReplies.map((q, i) => (
                    <button
                      key={i}
                      className="chatbot-quick-reply"
                      onClick={() => handleSend(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Message List */
              messages.map((msg) => (
                <div key={msg.id} className={`chatbot-message ${msg.role === 'user' ? 'user' : 'bot'}`}>
                  <div className="chatbot-msg-avatar">
                    {msg.role === 'user' ? (initials || 'U') : <BotIcon className="chatbot-fab-icon" style={{ width: 14, height: 14 }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="chatbot-msg-bubble">
                      {renderMarkdown(msg.content)}
                    </div>
                    <div className="chatbot-msg-time">{formatTime(msg.timestamp)}</div>
                  </div>
                </div>
              ))
            )}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="chatbot-message bot">
                <div className="chatbot-msg-avatar">
                  <BotIcon className="chatbot-fab-icon" style={{ width: 14, height: 14 }} />
                </div>
                <div className="chatbot-typing-bubble">
                  <span className="chatbot-typing-dot" />
                  <span className="chatbot-typing-dot" />
                  <span className="chatbot-typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="chatbot-input-area">
            {/* Context bar */}
            <div className="chatbot-context-bar">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              Live context: <span>{pageName}</span> · <span>{role}</span>
            </div>

            <div className="chatbot-input-row">
              <textarea
                ref={inputRef}
                id="chatbot-input-field"
                className="chatbot-input"
                placeholder="Ask anything about CLINERGY…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                aria-label="Chat message input"
                disabled={isLoading}
              />
              <button
                id="chatbot-send-button"
                className="chatbot-send-btn"
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
              >
                {isLoading
                  ? <SpinnerIcon className="spin" style={{ width: 17, height: 17 }} />
                  : <SendIcon />
                }
              </button>
            </div>

            {/* Quick replies inline (when there are messages) */}
            {!isEmpty && !isLoading && (
              <div className="chatbot-inline-suggestions" style={{ marginTop: 8 }}>
                {quickReplies.slice(0, 2).map((q, i) => (
                  <button key={i} className="chatbot-inline-suggestion" onClick={() => handleSend(q)}>
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
