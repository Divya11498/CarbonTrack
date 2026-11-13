import { useState, useRef, useEffect } from "react";
import {
  Send,
  X,
  Bot,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { apiRequest } from "../api";

const STARTER_SUGGESTIONS = [
  "What is driving my emissions the most?",
  "How can I save 20 kg of CO₂e this month?",
  "Analyze my recent electricity and food impact",
  "Suggest an achievable weekly sustainability goal",
];

const INITIAL_WELCOME = {
  role: "assistant",
  content:
    "Hi! I'm **CarbonTrack AI**, your personalized sustainability coach. I analyze your real activity logs, emission factors, and goals to suggest high-impact reductions. What would you like to improve today?",
  isConfigured: true,
};

export default function AiChatbot({ token, isOpen, onToggle, onClose, initialContext = "", onClearContext }) {
  const [messages, setMessages] = useState([INITIAL_WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastFailedPrompt, setLastFailedPrompt] = useState(null);
  const [isAiConfigured, setIsAiConfigured] = useState(true);
  const messagesEndRef = useRef(null);
  const contextHandledRef = useRef("");

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && initialContext && initialContext !== contextHandledRef.current) {
      contextHandledRef.current = initialContext;
      handleSendMessage(
        `Please explain how I can implement this recommendation and estimate my exact carbon reduction impact: "${initialContext}"`,
        initialContext
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialContext]);

  const handleSendMessage = async (textOverride = null, contextVal = "") => {
    const query = (textOverride !== null ? textOverride : input).trim();
    if (!query || loading) return;

    const history = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content }));

    const nextUserMsg = { role: "user", content: query };
    setMessages((prev) => [...prev, nextUserMsg]);
    if (textOverride === null) {
      setInput("");
    }
    setLastFailedPrompt(null);
    setLoading(true);

    try {
      const data = await apiRequest("/api/ai/chat", {
        method: "POST",
        token,
        body: {
          message: query,
          context: contextVal || initialContext || "",
          history,
        },
      });

      setIsAiConfigured(data?.isConfigured !== false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data?.reply || "I processed your request, please ask a follow-up question.",
          isConfigured: data?.isConfigured !== false,
          aiModel: data?.aiModel || "CarbonTrack AI",
        },
      ]);
    } catch (err) {
      // Preserve user prompt on error and enable explicit one-click Retry
      if (textOverride === null) {
        setInput(query);
      }
      setLastFailedPrompt({ query, contextVal });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          isError: true,
          content: `Request could not be completed: ${err.message || "Network or service error"}.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (!lastFailedPrompt || loading) return;
    const { query, contextVal } = lastFailedPrompt;
    handleSendMessage(query, contextVal);
  };

  const handleClearChat = () => {
    setMessages([INITIAL_WELCOME]);
    setLastFailedPrompt(null);
    contextHandledRef.current = "";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClose = () => {
    if (onClose) onClose();
    else if (onToggle) onToggle();
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        className="ai-fab-btn"
        onClick={() => (onToggle ? onToggle() : onClose && onClose())}
        aria-label="Open CarbonTrack AI Assistant"
        title="Ask CarbonTrack AI"
      >
        <Sparkles size={20} />
        <span>Ask AI</span>
      </button>
    );
  }

  return (
    <div className="ai-chatbot-overlay" onClick={handleClose}>
      <div className="ai-chatbot-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="chatbot-header">
          <div className="chatbot-title-wrap">
            <div className="chatbot-icon-badge">
              <Bot size={20} />
            </div>
            <div>
              <h3>CarbonTrack AI Coach</h3>
              <span className="chatbot-status">
                {isAiConfigured ? "Gemini Live Telemetry Engine" : "Telemetry Diagnostics Mode"}
              </span>
            </div>
          </div>

          <div className="chatbot-header-actions" style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <button
              type="button"
              className="chatbot-clear-btn"
              onClick={() => {
                handleClearChat();
                if (onClearContext) onClearContext();
              }}
              title="New conversation"
              aria-label="New conversation"
              style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.78rem" }}
            >
              <RefreshCw size={14} />
              <span>New</span>
            </button>
            <button
              type="button"
              className="chatbot-close-btn"
              onClick={handleClose}
              aria-label="Close AI Assistant"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="chatbot-messages">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`chat-bubble-row ${msg.role === "user" ? "user" : "assistant"}`}
            >
              {msg.role === "assistant" && (
                <div className="chat-avatar-small">
                  {msg.isError ? <AlertTriangle size={14} /> : <Sparkles size={14} />}
                </div>
              )}

              <div
                className={`chat-bubble ${msg.role === "user" ? "user" : "assistant"} ${
                  msg.isError ? "error" : ""
                }`}
              >
                <div className="chat-text-content">
                  {msg.content.split("\n").map((line, lineIdx) => {
                    const formattedLine = line
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\*(.*?)\*/g, "<em>$1</em>");
                    return (
                      <p
                        key={lineIdx}
                        style={{ margin: line.trim() === "" ? "6px 0" : "2px 0" }}
                        dangerouslySetInnerHTML={{ __html: formattedLine }}
                      />
                    );
                  })}
                </div>

                {msg.isError && lastFailedPrompt && i === messages.length - 1 && (
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={handleRetry}
                    style={{
                      marginTop: "8px",
                      padding: "4px 10px",
                      fontSize: "0.78rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <RotateCcw size={13} />
                    Retry Request
                  </button>
                )}

                {msg.role === "assistant" && msg.aiModel && (
                  <div className="chat-model-badge">{msg.aiModel}</div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-bubble-row assistant">
              <div className="chat-avatar-small">
                <Sparkles size={14} className="spin-slow" />
              </div>
              <div className="chat-bubble assistant typing">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {messages.length <= 2 && !loading && (
          <div className="chatbot-suggestions">
            {STARTER_SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                className="suggestion-chip"
                onClick={() => handleSendMessage(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="chatbot-input-bar" style={{ alignItems: "flex-end" }}>
          <textarea
            rows={2}
            placeholder="Ask about your emissions, goals, or sustainability tips (Shift+Enter for new line)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="chatbot-input"
            style={{
              resize: "none",
              minHeight: "42px",
              maxHeight: "110px",
              lineHeight: 1.4,
              paddingTop: "10px",
            }}
          />
          <button
            type="button"
            className="chatbot-send-btn"
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || loading}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
