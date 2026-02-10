/**
 * Assistant Page
 * AI-powered security guidance and investigation
 * Uses MonitorLayout with design system components and tokens
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MonitorLayout } from '@/components/layouts';
import { Button, Card } from '@/components/base';
import { ChatMessage, ChatInput } from '@/components/shared/chat';
import { useWorkflow } from '@/context/WorkflowContext';
import { spacing, colors, typography } from '@/theme/tokens';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * Assistant Page Component
 * AI-powered security guidance with context awareness
 */
export const Assistant: React.FC = () => {
  const navigate = useNavigate();
  const { selectedAlert } = useWorkflow();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your security assistant. I can help you investigate alerts, understand threats, and recommend remediation steps. How can I help you today?',
      timestamp: new Date(),
    },
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        'Based on the alert details, this appears to be a potential SQL injection attempt. I recommend implementing parameterized queries and input validation.',
        'This traffic pattern matches known C2 communication. I suggest blocking the source IP and checking for lateral movement.',
        'The severity level indicates this requires immediate attention. Would you like me to generate a detailed incident report?',
        'I can help you create a remediation playbook for this threat. Let me gather more context about your environment.',
        'This attack vector is commonly exploited in your industry. I recommend reviewing your WAF rules and updating them accordingly.',
      ];

      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: randomResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleFileUpload = (file: File) => {
    console.log('File uploaded:', file.name);
    // TODO: Implement file upload
  };

  // Left panel - Chat interface
  const leftPanel = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: colors.bg.primary,
    }}>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: spacing[6],
        display: 'flex',
        flexDirection: 'column',
        gap: spacing[4],
      }}>
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            role={msg.role}
            content={msg.content}
            timestamp={msg.timestamp}
          />
        ))}

        {isLoading && (
          <ChatMessage
            role="assistant"
            content=""
            isLoading={true}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSendMessage}
        onFileUpload={handleFileUpload}
        disabled={isLoading}
        placeholder="Ask me about this alert, threats, or remediation..."
      />
    </div>
  );

  // Right panel - Context and tools
  const rightPanel = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: spacing[4],
    }}>
      {selectedAlert && (
        <Card elevation="md">
          <Card.Header title="Current Investigation" />
          <Card.Body>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing[3],
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: spacing[2],
                paddingBottom: spacing[2],
                borderBottom: `1px solid ${colors.border.secondary}`,
              }}>
                <span style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text.secondary,
                }}>Alert Type:</span>
                <span style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.primary,
                  fontFamily: 'monospace',
                  backgroundColor: colors.bg.tertiary,
                  padding: `${spacing[1]} ${spacing[2]}`,
                  borderRadius: '0.25rem',
                }}>
                  {selectedAlert.type || 'Unknown'}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: spacing[2],
                paddingBottom: spacing[2],
                borderBottom: `1px solid ${colors.border.secondary}`,
              }}>
                <span style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text.secondary,
                }}>Source IP:</span>
                <code style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.primary,
                  fontFamily: 'monospace',
                  backgroundColor: colors.bg.tertiary,
                  padding: `${spacing[1]} ${spacing[2]}`,
                  borderRadius: '0.25rem',
                }}>
                  {selectedAlert.sourceIp || 'N/A'}
                </code>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: spacing[2],
                paddingBottom: spacing[2],
                borderBottom: `1px solid ${colors.border.secondary}`,
              }}>
                <span style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text.secondary,
                }}>Severity:</span>
                <span style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: selectedAlert.severity === 'critical' ? colors.critical[500] :
                         selectedAlert.severity === 'high' ? colors.high[500] :
                         selectedAlert.severity === 'medium' ? colors.medium[500] :
                         colors.low[500],
                }}>
                  {selectedAlert.severity?.toUpperCase() || 'N/A'}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: spacing[2],
              }}>
                <span style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text.secondary,
                }}>Confidence:</span>
                <span style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.primary,
                }}>
                  {selectedAlert.confidence || 0}%
                </span>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      <Card elevation="md">
        <Card.Header title="Quick Actions" />
        <Card.Body>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing[2],
          }}>
            <Button
              fullWidth
              variant="secondary"
              size="sm"
              onClick={() => navigate('/pentest')}
            >
              Pentest Source
            </Button>
            <Button
              fullWidth
              variant="secondary"
              size="sm"
              onClick={() => navigate('/analyze')}
            >
              View Analysis
            </Button>
            <Button
              fullWidth
              variant="secondary"
              size="sm"
            >
              Create Ticket
            </Button>
            <Button
              fullWidth
              variant="secondary"
              size="sm"
            >
              Block IP
            </Button>
            <Button
              fullWidth
              variant="secondary"
              size="sm"
            >
              Generate Report
            </Button>
          </div>
        </Card.Body>
      </Card>

      <Card elevation="md">
        <Card.Header title="Knowledge Base" />
        <Card.Body>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing[3],
          }}>
            <div style={{
              padding: spacing[3],
              backgroundColor: colors.bg.tertiary,
              borderRadius: '0.5rem',
              borderLeft: `3px solid ${colors.primary[500]}`,
              cursor: 'pointer',
              transition: 'all 200ms ease-out',
            }}>
              <h4 style={{
                margin: 0,
                marginBottom: spacing[1],
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
              }}>
                SQL Injection Prevention
              </h4>
              <p style={{
                margin: 0,
                fontSize: typography.fontSize.xs,
                color: colors.text.secondary,
                lineHeight: typography.lineHeight.tight,
              }}>
                Best practices for preventing SQL injection attacks
              </p>
            </div>
            <div style={{
              padding: spacing[3],
              backgroundColor: colors.bg.tertiary,
              borderRadius: '0.5rem',
              borderLeft: `3px solid ${colors.primary[500]}`,
              cursor: 'pointer',
              transition: 'all 200ms ease-out',
            }}>
              <h4 style={{
                margin: 0,
                marginBottom: spacing[1],
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
              }}>
                MITRE ATT&CK Framework
              </h4>
              <p style={{
                margin: 0,
                fontSize: typography.fontSize.xs,
                color: colors.text.secondary,
                lineHeight: typography.lineHeight.tight,
              }}>
                Understanding attack techniques and tactics
              </p>
            </div>
            <div style={{
              padding: spacing[3],
              backgroundColor: colors.bg.tertiary,
              borderRadius: '0.5rem',
              borderLeft: `3px solid ${colors.primary[500]}`,
              cursor: 'pointer',
              transition: 'all 200ms ease-out',
            }}>
              <h4 style={{
                margin: 0,
                marginBottom: spacing[1],
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
              }}>
                Incident Response
              </h4>
              <p style={{
                margin: 0,
                fontSize: typography.fontSize.xs,
                color: colors.text.secondary,
                lineHeight: typography.lineHeight.tight,
              }}>
                Step-by-step incident response procedures
              </p>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );

  return (
    <MonitorLayout
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      leftPanelWidth={60}
    />
  );
};

Assistant.displayName = 'Assistant';

export default Assistant;
