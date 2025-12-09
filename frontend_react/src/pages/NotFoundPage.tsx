import React from "react";
import { useNavigate } from "react-router-dom";

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div 
      style={{
        height: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
        {/* Error 404 Heading */}
        <h1 
          style={{
            fontSize: '64px',
            color: '#AEB9E1',
            lineHeight: '1',
            fontWeight: 'bold',
            margin: '0 0 8px 0'
          }}
        >
          Error 404
        </h1>

        {/* Subtitle */}
        <p 
          style={{
            fontSize: '24px',
            color: '#AEB9E1',
            lineHeight: '1.4',
            fontWeight: '500',
            margin: '0 0 24px 0'
          }}
        >
          Page not found
        </p>

        {/* Return button */}
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="cursor-hotspot-action"
          style={{
            background: '#4266C9',
            color: '#ffffff',
            fontWeight: '600',
            fontSize: '0.95rem',
            padding: '14px 32px',
            borderRadius: '999px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 12px 30px rgba(66, 102, 201, 0.4)',
            transition: 'all 0.2s ease',
            display: 'inline-block'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 16px 40px rgba(66, 102, 201, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 12px 30px rgba(66, 102, 201, 0.4)';
          }}
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
