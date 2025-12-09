import React, { useEffect, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { getExplanation, Explanation } from '../../api/aegisClient';

interface ExplainabilityPanelProps {
  detectionId: string | null;
}

const ExplainabilityPanel: React.FC<ExplainabilityPanelProps> = ({ detectionId }) => {
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!detectionId) {
      setExplanation(null);
      setError(null);
      return;
    }

    async function fetchExplanation() {
      try {
        setLoading(true);
        setError(null);
        
        // Validate detection ID format
        if (!detectionId || detectionId.trim() === '') {
          setError('Invalid detection ID');
          return;
        }
        
        const result = await getExplanation(detectionId);
        setExplanation(result);
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to load explanation';
        if (errorMsg.includes('EXPLANATION_NOT_AVAILABLE') || errorMsg.includes('SHAP data not found')) {
          setError('Explanation not yet available for this detection. The SHAP data file may not be configured on the backend.');
        } else if (errorMsg.includes('DETECTION_NOT_FOUND') || errorMsg.includes('404')) {
          setError('Detection ID not found');
        } else if (errorMsg.includes('EXPLANATION_SERVER_ERROR') || errorMsg.includes('500')) {
          setError('Server error while computing explanation. Please try again later.');
        } else if (errorMsg.includes('Explainability error')) {
          setError(errorMsg.replace('Explainability error: ', ''));
        } else {
          setError(errorMsg);
        }
        setExplanation(null);
        console.error('Explainability fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchExplanation();
  }, [detectionId]);

  // No alert selected - show placeholder
  if (!detectionId) {
    return (
      <div className="aegis-card">
        <div className="aegis-card-header">
          <h2>Feature Importance (SHAP)</h2>
          <span className="aegis-card-subtitle">
            Explain why this detection was flagged
          </span>
        </div>
        <div className="ids-explain-content">
          <p className="ids-explain-note" style={{ color: '#64748b', fontStyle: 'italic' }}>
            Select an alert from the Live Alerts table to view feature importance.
          </p>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#94a3b8' }}>
            Aegis IDS uses SHAP values to quantify how each traffic feature
            pushes a prediction towards benign or malicious.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="aegis-card">
        <div className="aegis-card-header">
          <h2>Feature Importance (SHAP)</h2>
          <span className="aegis-card-subtitle">
            Detection ID: {detectionId}
          </span>
        </div>
        <div className="ids-explain-content" style={{ padding: '2rem', textAlign: 'center' }}>
          <RefreshCcw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '0.5rem', color: '#6366f1' }} />
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Computing explanation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="aegis-card">
        <div className="aegis-card-header">
          <h2>Feature Importance (SHAP)</h2>
          <span className="aegis-card-subtitle">
            Detection ID: {detectionId}
          </span>
        </div>
        <div className="ids-explain-content">
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            {error}
          </div>
        </div>
      </div>
    );
  }

  // Explanation result
  if (explanation) {
    return (
      <>
        <div className="aegis-card">
          <div className="aegis-card-header">
            <h2>Feature Importance (SHAP Values)</h2>
            <span className="aegis-card-subtitle">
              Detection ID: {explanation.detection_id}
            </span>
          </div>
          <div className="ids-feature-list">
            {explanation.feature_importance ? (
              Object.entries(explanation.feature_importance)
                .sort(([, a], [, b]) => Math.abs(b as number) - Math.abs(a as number))
                .map(([name, value]) => (
                  <div key={name} className="ids-feature-row">
                    <div className="ids-feature-main">
                      <div className="ids-feature-name">{name}</div>
                      <div className="ids-feature-desc">Feature contribution</div>
                    </div>
                    <div className="ids-feature-shap">
                      <div className="ids-bar">
                        <div
                          className={`ids-bar-fill ${(value as number) > 0 ? 'ids-bar-fill--purple' : 'ids-bar-fill--green'}`}
                          style={{
                            width: `${Math.min(100, Math.abs(value as number) * 100 + 10)}%`,
                          }}
                        />
                      </div>
                      <span className="ids-bar-value">{(value as number).toFixed(4)}</span>
                    </div>
                  </div>
                ))
            ) : (
              <p style={{ padding: '1rem', color: '#888' }}>No feature importance data available.</p>
            )}
          </div>
        </div>

        {explanation.explanation && (
          <div className="aegis-card ids-explain-example">
            <div className="aegis-card-header">
              <h2>Explanation Narrative</h2>
            </div>
            <div className="ids-explain-content">
              <p>{explanation.explanation}</p>
              {explanation.model_used && (
                <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#666' }}>
                  <strong>Model Used:</strong> {explanation.model_used}
                </p>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export default ExplainabilityPanel;

