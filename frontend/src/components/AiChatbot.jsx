import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Sparkles,
  X,
  Send,
  RotateCcw,
  Bot,
  User,
  ArrowRight,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Leaf,
} from "lucide-react";
import { apiRequest } from "../api";

const STARTER_PROMPTS = [
  "How can I reduce my carbon footprint?",
  "Which activity produces my highest emissions?",
  "How can I cut my electricity consumption?",
  "What are my sustainability recommendations?",
  "How much carbon have I saved this month?",
  "How can my organization reduce emissions?",
];

export default function AiChatbot({
  token,
  isOpen,
  onToggle,
  initialContext = null,
  onClearContext,
}) {
  const [messages, setMessages] = useState([
    {
      id: "welcome-1",
      role: "assistant",
      content:
        "Hello! I am **CarbonTrack AI**, your sustainability advisor. I can analyze your emissions history, suggest practical ways to reduce your footprint, or break down any recommendation into easy steps.\n\nHow can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Handle external contextual prompt injection (e.g. from recommendation cards)
  useEffect(() => {
    if (initialContext && isOpen) {
      const promptText = `Can you guide me on practical steps to implement the recommendation: "${initialContext.title}"? Problem identified: ${initialContext.problemIdentified || initialContext.description || ""}`;
      handleSend(promptText, initialContext.title);
      if (onClearContext) onClearContext();
    }
  }, [initialContext, isOpen]);

  async function handleSend(textToSend = null, contextOverride = null) {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    setError("");
    const userMsg = {
      id: "user-" + Date.now(),
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Build lightweight conversation history
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      }));

      const res = await apiRequest("/api/ai/chat", {
        method: "POST",
        token,
        body: {
          message: query,
          context: contextOverride || (initialContext ? initialContext.title : null),
          history: historyPayload,
        },
      });

      const replyContent = res?.reply || "I couldn't generate a response. Please try again.";
      const assistantMsg = {
        id: "ai-" + Date.now(),
        role: "assistant",
        content: replyContent,
        aiModel: res?.aiModel || "CarbonTrack AI",
        isConfigured: res?.isConfigured !== false,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setError(err.message || "Failed to contact CarbonTrack AI.");
      const errorMsg = {
        id: "err-" + Date.now(),
        role: "assistant",
        content: `⚠️ **Connection Error:** ${err.message || "Unable to reach the AI service. Please ensure the backend is running."}`,
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  function handleResetChat() {
    setMessages([
      {
        id: "welcome-reset",
        role: "assistant",
        content:
          "Conversation reset. What sustainability questions can I help you with now?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setError("");
  }

  // Format markdown helper (bold, bullet points, linebreaks)
  function renderFormattedContent(text) {
    if (!text) return null;

    const lines = text.split("\n");
    return lines.map((line, i) => {
      // Bold regex: **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const renderedLine = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (line.trim().startsWith("•") || line.trim().startsWith("-") || line.trim().startsWith("*")) {
        return (
          <div key={i} style={{ display: "flex", gap: "6px", margin: "3px 0", paddingLeft: "4px" }}>
            <span style={{ color: "var(--primary)", fontWeight: "bold" }}>•</span>
            <span>{renderedLine}</span>
          </div>
        );
      }

      if (line.trim() === "") {
        return <div key={i} style={{ height: "6px" }} />;
      }

      return <p key={i} style={{ margin: "2px 0", lineHeight: "1.5" }}>{renderedLine}</p>;
    });
  }

  return (
    <>
      {/* Floating Chat Launcher Button (Bottom-Right) */}
      <button
        type="button"
        className={`floating-ai-launcher ${isOpen ? "active" : ""}`}
        onClick={onToggle}
        aria-label={isOpen ? "Close CarbonTrack AI" : "Open CarbonTrack AI"}
        title={isOpen ? "Close AI Advisor" : "Ask CarbonTrack AI"}
      >
        {isOpen ? (
          <X size={22} />
        ) : (
          <>
            <div className="launcher-icon-wrap">
              <Sparkles size={20} />
              <span className="online-indicator-dot" />
            </div>
            <span className="launcher-label">Ask AI</span>
          </>
        )}
      </button>

      {/* Modern Floating AI Chat Panel */}
      {isOpen && (
        <div className="ai-chatbot-panel" role="dialog" aria-label="CarbonTrack AI Assistant">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-brand">
              <div className="chatbot-avatar-badge">
                <Sparkles size={18} />
                <span className="status-badge-dot" />
              </div>
              <div className="chatbot-header-text">
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <h4>CarbonTrack AI</h4>
                  <span className="chatbot-online-pill">Online</span>
                </div>
                <p>Personalized Sustainability Advisor</p>
              </div>
            </div>

            <div className="chatbot-header-actions">
              <button
                type="button"
                className="chatbot-action-btn"
                onClick={handleResetChat}
                title="Restart conversation"
                aria-label="Restart conversation"
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                className="chatbot-action-btn"
                onClick={onToggle}
                title="Close chatbot"
                aria-label="Close chatbot"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="chatbot-messages-body">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`chat-bubble-row ${m.role === "user" ? "user-row" : "assistant-row"}`}
              >
                {m.role === "assistant" && (
                  <div className="chat-avatar-icon">
                    <Sparkles size={14} />
                  </div>
                )}

                <div className={`chat-bubble ${m.role === "user" ? "user-bubble" : "assistant-bubble"}`}>
                  <div className="chat-bubble-content">
                    {renderFormattedContent(m.content)}
                  </div>
                  <div className="chat-bubble-meta">
                    {m.aiModel && <span className="ai-model-tag">{m.aiModel}</span>}
                    <span className="chat-time-tag">{m.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing / Analyzing Indicator */}
            {loading && (
              <div className="chat-bubble-row assistant-row">
                <div className="chat-avatar-icon">
                  <Sparkles size={14} className="animate-spin" />
                </div>
                <div className="chat-bubble assistant-bubble typing-bubble">
                  <div className="typing-dots">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </div>
                  <span className="typing-label">Analyzing telemetry & formulating response...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Starter Quick Chips (when only initial greeting is present) */}
          {messages.length <= 2 && !loading && (
            <div className="chatbot-quick-chips">
              <span className="chips-label">Suggested Inquiries:</span>
              <div className="chips-scroll">
                {STARTER_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="chip-btn"
                    onClick={() => handleSend(prompt)}
                  >
                    <span>{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="chatbot-footer-form"
          >
            <div className="chatbot-input-wrap">
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask CarbonTrack AI anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="chatbot-input"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="chatbot-send-btn"
                aria-label="Send message"
              >
                <Send size={15} />
              </button>
            </div>
            <div className="chatbot-footer-sub">
              <span>Personalized with your live activity telemetry.</span>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
