/**
 * Workflow Context
 * Manages cross-page workflow state and navigation context
 * Enables seamless transitions between Dashboard → Monitor → Analyze → Pentest → Assistant
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface WorkflowAlert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  sourceIp: string;
  destinationIp?: string;
  timestamp: string;
  description: string;
  [key: string]: any;
}

export interface WorkflowContext {
  // Current workflow state
  selectedAlert: WorkflowAlert | null;
  analysisContext: Record<string, any>;
  pentestTarget: string | null;
  assistantContext: Record<string, any>;

  // Navigation helpers
  selectAlert: (alert: WorkflowAlert) => void;
  setAnalysisContext: (context: Record<string, any>) => void;
  setPentestTarget: (target: string) => void;
  setAssistantContext: (context: Record<string, any>) => void;
  clearWorkflow: () => void;

  // Workflow navigation
  navigateToMonitor: (alert: WorkflowAlert) => void;
  navigateToAnalyze: (alert: WorkflowAlert, context?: Record<string, any>) => void;
  navigateToPentest: (sourceIp: string) => void;
  navigateToAssistant: (context: Record<string, any>) => void;
}

const WorkflowContextObj = createContext<WorkflowContext | undefined>(undefined);

export const WorkflowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedAlert, setSelectedAlert] = useState<WorkflowAlert | null>(null);
  const [analysisContext, setAnalysisContext] = useState<Record<string, any>>({});
  const [pentestTarget, setPentestTarget] = useState<string | null>(null);
  const [assistantContext, setAssistantContext] = useState<Record<string, any>>({});

  const selectAlert = (alert: WorkflowAlert) => {
    setSelectedAlert(alert);
  };

  const clearWorkflow = () => {
    setSelectedAlert(null);
    setAnalysisContext({});
    setPentestTarget(null);
    setAssistantContext({});
  };

  const navigateToMonitor = (alert: WorkflowAlert) => {
    selectAlert(alert);
    // Navigation handled by component
  };

  const navigateToAnalyze = (alert: WorkflowAlert, context?: Record<string, any>) => {
    selectAlert(alert);
    setAnalysisContext(context || {});
  };

  const navigateToPentest = (sourceIp: string) => {
    setPentestTarget(sourceIp);
  };

  const navigateToAssistant = (context: Record<string, any>) => {
    setAssistantContext(context);
  };

  const value: WorkflowContext = {
    selectedAlert,
    analysisContext,
    pentestTarget,
    assistantContext,
    selectAlert,
    setAnalysisContext,
    setPentestTarget,
    setAssistantContext,
    clearWorkflow,
    navigateToMonitor,
    navigateToAnalyze,
    navigateToPentest,
    navigateToAssistant,
  };

  return (
    <WorkflowContextObj.Provider value={value}>
      {children}
    </WorkflowContextObj.Provider>
  );
};

export const useWorkflow = (): WorkflowContext => {
  const context = useContext(WorkflowContextObj);
  if (!context) {
    throw new Error('useWorkflow must be used within WorkflowProvider');
  }
  return context;
};
