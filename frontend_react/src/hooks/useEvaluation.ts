// src/hooks/useEvaluation.ts
// Hook for managing 3-phase ML model evaluation

import { useState, useCallback } from 'react';
import {
  runPhase1Evaluation,
  runPhase2Evaluation,
  runPhase3Evaluation,
  getEvaluationSummary,
  type EvaluationResponse,
  type Phase1Results,
  type Phase2Results,
  type Phase3Results,
} from '../api/aegisClient.ts';

export type AttackType = 'Syn' | 'mitm_arp' | 'dns_exfiltration';
export type Phase2Scenario = 'all_benign' | 'pure_attack' | 'mixed_timeline' | 'stealth_slow';
export type Phase3TestType = 'benign' | 'attack' | 'mixed';

interface EvaluationState {
  phase1: Record<AttackType, Phase1Results | null>;
  phase2: Record<AttackType, Phase2Results[] | null>;
  phase3: Record<AttackType, Phase3Results | null>;
  loading: Record<string, boolean>;
  errors: Record<string, string | null>;
  summary: any | null;
}

export function useEvaluation() {
  const [state, setState] = useState<EvaluationState>({
    phase1: {
      Syn: null,
      mitm_arp: null,
      dns_exfiltration: null,
    },
    phase2: {
      Syn: null,
      mitm_arp: null,
      dns_exfiltration: null,
    },
    phase3: {
      Syn: null,
      mitm_arp: null,
      dns_exfiltration: null,
    },
    loading: {},
    errors: {},
    summary: null,
  });

  const runPhase1 = useCallback(async (attackType: AttackType) => {
    const key = `phase1_${attackType}`;
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, [key]: true },
      errors: { ...prev.errors, [key]: null },
    }));

    try {
      const response = await runPhase1Evaluation(attackType);
      setState(prev => ({
        ...prev,
        phase1: { ...prev.phase1, [attackType]: response.results as Phase1Results },
        loading: { ...prev.loading, [key]: false },
      }));
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Phase 1 evaluation failed';
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, [key]: false },
        errors: { ...prev.errors, [key]: message },
      }));
      throw error;
    }
  }, []);

  const runPhase2 = useCallback(async (
    attackType: AttackType,
    scenario?: Phase2Scenario
  ) => {
    const key = `phase2_${attackType}${scenario ? `_${scenario}` : ''}`;
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, [key]: true },
      errors: { ...prev.errors, [key]: null },
    }));

    try {
      const response = await runPhase2Evaluation(attackType, scenario);
      // Store results - if specific scenario, append to array, else replace
      setState(prev => {
        const currentResults = prev.phase2[attackType] || [];
        const newResults = Array.isArray(response.results) 
          ? response.results 
          : [response.results];
        
        return {
          ...prev,
          phase2: { 
            ...prev.phase2, 
            [attackType]: scenario 
              ? [...currentResults, ...newResults]
              : newResults
          },
          loading: { ...prev.loading, [key]: false },
        };
      });
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Phase 2 evaluation failed';
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, [key]: false },
        errors: { ...prev.errors, [key]: message },
      }));
      throw error;
    }
  }, []);

  const runPhase3 = useCallback(async (
    attackType: AttackType | 'all',
    batchSize: number = 100,
    testType: Phase3TestType = 'mixed'
  ) => {
    const key = `phase3_${attackType}_${testType}`;
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, [key]: true },
      errors: { ...prev.errors, [key]: null },
    }));

    try {
      const response = await runPhase3Evaluation(attackType, batchSize, testType);
      
      if (attackType !== 'all') {
        setState(prev => ({
          ...prev,
          phase3: { ...prev.phase3, [attackType]: response.results as Phase3Results },
          loading: { ...prev.loading, [key]: false },
        }));
      } else {
        setState(prev => ({
          ...prev,
          loading: { ...prev.loading, [key]: false },
        }));
      }
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Phase 3 evaluation failed';
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, [key]: false },
        errors: { ...prev.errors, [key]: message },
      }));
      throw error;
    }
  }, []);

  const loadSummary = useCallback(async () => {
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, summary: true },
      errors: { ...prev.errors, summary: null },
    }));

    try {
      const summary = await getEvaluationSummary();
      setState(prev => ({
        ...prev,
        summary,
        loading: { ...prev.loading, summary: false },
      }));
      return summary;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load summary';
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, summary: false },
        errors: { ...prev.errors, summary: message },
      }));
      throw error;
    }
  }, []);

  const clearResults = useCallback((attackType?: AttackType) => {
    if (attackType) {
      setState(prev => ({
        ...prev,
        phase1: { ...prev.phase1, [attackType]: null },
        phase2: { ...prev.phase2, [attackType]: null },
        phase3: { ...prev.phase3, [attackType]: null },
      }));
    } else {
      setState(prev => ({
        ...prev,
        phase1: { Syn: null, mitm_arp: null, dns_exfiltration: null },
        phase2: { Syn: null, mitm_arp: null, dns_exfiltration: null },
        phase3: { Syn: null, mitm_arp: null, dns_exfiltration: null },
      }));
    }
  }, []);

  return {
    // State
    phase1Results: state.phase1,
    phase2Results: state.phase2,
    phase3Results: state.phase3,
    summary: state.summary,
    loading: state.loading,
    errors: state.errors,
    
    // Actions
    runPhase1,
    runPhase2,
    runPhase3,
    loadSummary,
    clearResults,
  };
}
