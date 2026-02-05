// src/pages/ChatbotPage.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Shield,
  AlertTriangle,
  Zap,
  BrainCircuit,
  RefreshCw,
  Copy,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Search,
  MessageSquare,
  Sparkles,
  X,
  Maximize2,
  Minimize2,
  Network,
} from "lucide-react";
import "../index.css";
import { StatusPill } from "../components/common";
import { useSystemStatus } from "../hooks/useSystemStatus";

// Types
interface KnowledgeItem {
  title: string;
  content: string;
  severity: string;
  references: string[];
}

interface Message {
  id?: string;
  type: "bot" | "user";
  content: string;
  timestamp: string;
  suggestions?: string[];
  knowledge?: KnowledgeItem | null;
}

// Mock security knowledge base
const SECURITY_KNOWLEDGE: Record<string, KnowledgeItem> = {
  "ddos": {
    title: "DDoS Attack Mitigation",
    content: "Distributed Denial of Service attacks overwhelm target resources. Mitigation strategies include:\n• Rate limiting at edge\n• Web Application Firewall (WAF)\n• Anycast network distribution\n• Traffic scrubbing centers",
    severity: "high",
    references: ["NIST SP 800-61", "MITRE ATT&CK T1498"]
  },
  "brute force": {
    title: "Brute Force Protection",
    content: "Credential stuffing and brute force attacks attempt to guess passwords. Protection measures:\n• Account lockout policies\n• Multi-factor authentication (MFA)\n• CAPTCHA challenges\n• Rate limiting per IP",
    severity: "medium",
    references: ["OWASP Authentication Cheat Sheet", "NIST 800-63B"]
  },
  "sql injection": {
    title: "SQL Injection Prevention",
    content: "SQL injection exploits application database queries. Prevention techniques:\n• Parameterized queries\n• Input validation\n• Least privilege database accounts\n• Web Application Firewall rules",
    severity: "critical",
    references: ["OWASP SQL Injection Guide", "MITRE ATT&CK T1190"]
  },
  "ransomware": {
    title: "Ransomware Defense",
    content: "Ransomware encrypts files and demands payment. Defense strategies:\n• Regular backups (3-2-1 rule)\n• Endpoint detection and response (EDR)\n• Network segmentation\n• Employee awareness training",
    severity: "critical",
    references: ["CISA Ransomware Guide", "NIST SP 800-83"]
  }
};

// Initial chat messages
const INITIAL_MESSAGES: Message[] = [
  {
    id: "welcome",
    type: "bot",
    content: "Hello! I'm Aegis Security Assistant. I can help you with:\n• Threat analysis\n• Security best practices\n• Incident response guidance\n• Compliance recommendations\n\nWhat security concern can I help you with today?",
    timestamp: new Date().toISOString(),
    suggestions: ["DDoS protection", "Brute force prevention", "Incident response", "Compliance checklist"]
  }
];

function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  const { systemStatus } = useSystemStatus();
  const isMockMode = systemStatus?.mockStream === 'ON';
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Simulate AI response
  const simulateAIResponse = async (userMessage: string): Promise<Message> => {
    setIsLoading(true);
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const lowerMessage = userMessage.toLowerCase();
    const response: Message = {
      id: Date.now().toString(),
      type: "bot",
      content: "",
      timestamp: new Date().toISOString(),
      suggestions: [],
      knowledge: null
    };

    // Check for known security topics
    let matchedTopic: string | null = null;
    for (const [topic, knowledge] of Object.entries(SECURITY_KNOWLEDGE)) {
      if (lowerMessage.includes(topic)) {
        matchedTopic = topic;
        response.knowledge = knowledge;
        response.content = `I found information about **${knowledge.title}**:\n\n${knowledge.content}`;
        break;
      }
    }

    // If no specific topic matched, generate generic response
    if (!matchedTopic) {
      const genericResponses = [
        "I understand you're asking about security. Could you provide more specific details about your concern?",
        "Based on your query, I recommend reviewing the Aegis IDS documentation for detailed guidance.",
        "That's an important security consideration. Let me connect you with relevant resources...",
        "I can help with that security topic. Would you like me to provide best practices or specific technical guidance?"
      ];
      response.content = genericResponses[Math.floor(Math.random() * genericResponses.length)];
      response.suggestions = ["Show me vulnerabilities", "Incident response steps", "Security policy templates"];
    } else {
      response.suggestions = ["Prevention steps", "Detection methods", "Recovery procedures"];
    }

    // Add references if available
    if (response.knowledge?.references) {
      response.content += "\n\n**References:**\n" + response.knowledge.references.join("\n");
    }

    return response;
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputText,
      timestamp: new Date().toISOString(),
      suggestions: []
    };

    // Add user message
    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setShowSuggestions(false);

    // Get AI response
    const aiResponse = await simulateAIResponse(inputText);
    setMessages(prev => [...prev, aiResponse]);
    setIsLoading(false);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setInputText(suggestion);
    inputRef.current?.focus();
  };

  // Handle quick action
  const handleQuickAction = (action: string) => {
    const actionMessages: Record<string, string> = {
      "threat_analysis": "Analyze the latest threats from my IDS logs",
      "incident_response": "Provide incident response steps for a suspected breach",
      "compliance_check": "Check my current setup against NIST CSF compliance",
      "vulnerability_scan": "Recommend vulnerability scanning procedures"
    };

    setInputText(actionMessages[action]);
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  // Clear chat
  const handleClearChat = () => {
    setMessages([INITIAL_MESSAGES[0]]);
    setShowSuggestions(true);
  };

  // Copy message
  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    // Show toast notification (you'd implement this)
    alert("Copied to clipboard!");
  };

  // Handle key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="aegis-page">
      {/* Consistent Header */}
      <header className="aegis-dash-header">
        <div>
          <h1 className="aegis-dash-title">Security Assistant</h1>
          <p className="aegis-dash-subtitle">
            AI-powered security guidance and threat analysis{isMockMode && " (mock)"}
          </p>
        </div>
        <div className="ids-header-right-new">
          <StatusPill />
          <div className="ids-chat-controls">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="ids-icon-btn"
              title={isExpanded ? "Minimize" : "Expand"}
            >
              {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              type="button"
              onClick={handleClearChat}
              className="ids-icon-btn"
              title="Clear Chat"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className={`aegis-chat-container ${isExpanded ? 'aegis-chat-container--expanded' : ''}`}>
        {/* Left Sidebar - Quick Actions */}
        <div className="aegis-chat-sidebar">
          <div className="aegis-card" style={{ height: '100%' }}>
            <div className="aegis-card-header">
              <h2>Quick Actions</h2>
              <p className="aegis-card-subtext">
                Common security queries
              </p>
            </div>

            <div className="ids-quick-actions">
              <button
                type="button"
                onClick={() => handleQuickAction("threat_analysis")}
                className="ids-quick-action-btn"
              >
                <Shield size={18} />
                <div>
                  <span className="ids-quick-action-title">Threat Analysis</span>
                  <span className="ids-quick-action-desc">Analyze IDS alerts</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickAction("incident_response")}
                className="ids-quick-action-btn"
              >
                <AlertTriangle size={18} />
                <div>
                  <span className="ids-quick-action-title">Incident Response</span>
                  <span className="ids-quick-action-desc">Breach response steps</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickAction("compliance_check")}
                className="ids-quick-action-btn"
              >
                <FileText size={18} />
                <div>
                  <span className="ids-quick-action-title">Compliance Check</span>
                  <span className="ids-quick-action-desc">NIST CSF, ISO 27001</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickAction("vulnerability_scan")}
                className="ids-quick-action-btn"
              >
                <Search size={18} />
                <div>
                  <span className="ids-quick-action-title">Vulnerability Scan</span>
                  <span className="ids-quick-action-desc">Scan procedures</span>
                </div>
              </button>
            </div>

            <div className="ids-chat-stats">
              <div className="ids-chat-stat">
                <span className="ids-chat-stat-label">Messages Today</span>
                <span className="ids-chat-stat-value">{messages.length}</span>
              </div>
              <div className="ids-chat-stat">
                <span className="ids-chat-stat-label">Response Time</span>
                <span className="ids-chat-stat-value">&lt;1s</span>
              </div>
            </div>

            <div className="ids-chat-info">
              <div className="ids-chat-info-icon">
                <Sparkles size={14} />
              </div>
              <p className="ids-chat-info-text">
                Powered by AI models trained on security frameworks and threat intelligence.
                {isMockMode && " Using mock data for demonstration."}
              </p>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="aegis-chat-main">
          <div className="aegis-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Chat Header */}
            <div className="aegis-chat-header">
              <div className="ids-chat-avatar">
                <div className="ids-chat-avatar-bot">
                  <BrainCircuit size={20} />
                </div>
                <div>
                  <h2>Aegis Security Assistant</h2>
                  <p className="ids-chat-status">
                    <span className="ids-chat-status-dot ids-chat-status-dot--online" />
                    {isLoading ? "Thinking..." : "Online"}
                  </p>
                </div>
              </div>
              <div className="ids-chat-model-info">
                <span className="ids-chat-model-tag">Security AI</span>
                <span className="ids-chat-model-version">v2.1</span>
              </div>
            </div>

            {/* Messages Container */}
            <div className="aegis-chat-messages">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`ids-chat-message ids-chat-message--${message.type}`}
                >
                  <div className="ids-chat-message-avatar">
                    {message.type === "bot" ? (
                      <div className="ids-chat-avatar-bot">
                        <Bot size={16} />
                      </div>
                    ) : (
                      <div className="ids-chat-avatar-user">
                        <User size={16} />
                      </div>
                    )}
                  </div>
                  
                  <div className="ids-chat-message-content">
                    <div className="ids-chat-message-header">
                      <span className="ids-chat-message-sender">
                        {message.type === "bot" ? "Aegis Assistant" : "You"}
                      </span>
                      <span className="ids-chat-message-time">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    
                    <div className="ids-chat-message-body">
                      {message.content.split('\n').map((line, idx) => (
                        <React.Fragment key={idx}>
                          {line}
                          {idx < message.content.split('\n').length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Knowledge Card for specific topics */}
                    {message.knowledge && (
                      <div className="ids-knowledge-card">
                        <div className="ids-knowledge-card-header">
                          <Shield size={16} />
                          <h4>{message.knowledge.title}</h4>
                          <SeverityBadge severity={message.knowledge.severity} />
                        </div>
                        <div className="ids-knowledge-card-refs">
                          <span className="ids-knowledge-refs-label">References:</span>
                          {message.knowledge.references.map((ref: string, idx: number) => (
                            <span key={idx} className="ids-knowledge-ref">
                              {ref}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Message Actions */}
                    <div className="ids-chat-message-actions">
                      {message.type === "bot" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(message.content)}
                            className="ids-chat-action-btn"
                            title="Copy"
                          >
                            <Copy size={12} />
                          </button>
                          <button
                            type="button"
                            className="ids-chat-action-btn"
                            title="Helpful"
                          >
                            <ThumbsUp size={12} />
                          </button>
                          <button
                            type="button"
                            className="ids-chat-action-btn"
                            title="Not helpful"
                          >
                            <ThumbsDown size={12} />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Suggestions */}
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="ids-chat-suggestions">
                        {message.suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="ids-chat-suggestion"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="ids-chat-message ids-chat-message--bot">
                  <div className="ids-chat-message-avatar">
                    <div className="ids-chat-avatar-bot">
                      <Bot size={16} />
                    </div>
                  </div>
                  <div className="ids-chat-message-content">
                    <div className="ids-chat-message-header">
                      <span className="ids-chat-message-sender">
                        Aegis Assistant
                      </span>
                    </div>
                    <div className="ids-chat-message-body">
                      <div className="ids-chat-typing">
                        <span className="ids-chat-typing-dot" />
                        <span className="ids-chat-typing-dot" />
                        <span className="ids-chat-typing-dot" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="aegis-chat-input">
              <div className="ids-chat-input-wrapper">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about security threats, best practices, or incident response..."
                  className="ids-chat-textarea"
                  rows={3}
                  disabled={isLoading}
                />
                
                <div className="ids-chat-input-actions">
                  <div className="ids-chat-input-hints">
                    <span className="ids-chat-input-hint">
                      <Zap size={12} />
                      Press Enter to send
                    </span>
                    <span className="ids-chat-input-hint">
                      <MessageSquare size={12} />
                      Ask security questions
                    </span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={!inputText.trim() || isLoading}
                    className="ids-chat-send-btn"
                  >
                    {isLoading ? (
                      <RefreshCw className="animate-spin-slow" size={18} />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Suggestions */}
              {showSuggestions && messages.length === 1 && (
                <div className="ids-quick-suggestions">
                  <p className="ids-quick-suggestions-label">Try asking:</p>
                  <div className="ids-quick-suggestions-grid">
                    <button
                      type="button"
                      onClick={() => handleSuggestionClick("How to prevent DDoS attacks?")}
                      className="ids-quick-suggestion"
                    >
                      <Shield size={14} />
                      DDoS prevention
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSuggestionClick("Best practices for network segmentation")}
                      className="ids-quick-suggestion"
                    >
                      <Network size={14} />
                      Network security
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSuggestionClick("Incident response checklist")}
                      className="ids-quick-suggestion"
                    >
                      <AlertTriangle size={14} />
                      Incident response
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSuggestionClick("NIST CSF compliance requirements")}
                      className="ids-quick-suggestion"
                    >
                      <FileText size={14} />
                      Compliance
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// SeverityBadge component for knowledge cards
interface SeverityBadgeProps {
  severity: string;
}

function SeverityBadge({ severity }: SeverityBadgeProps) {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    critical: { bg: 'rgba(220, 38, 38, 0.15)', text: '#fca5a5', border: 'rgba(220, 38, 38, 0.3)' },
    high: { bg: 'rgba(249, 115, 22, 0.15)', text: '#fdba74', border: 'rgba(249, 115, 22, 0.3)' },
    medium: { bg: 'rgba(234, 179, 8, 0.15)', text: '#fde047', border: 'rgba(234, 179, 8, 0.3)' },
    low: { bg: 'rgba(34, 197, 94, 0.15)', text: '#86efac', border: 'rgba(34, 197, 94, 0.3)' },
  };

  const color = colors[severity] || colors.low;

  return (
    <span
      className="ids-severity-badge"
      style={{
        backgroundColor: color.bg,
        color: color.text,
        border: `1px solid ${color.border}`,
      }}
    >
      {severity.toUpperCase()}
    </span>
  );
}

export default ChatbotPage;