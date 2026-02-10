/**
 * Time Series Chart Component
 * Displays alert timeline data
 */

import React from 'react';
import styles from './TimeSeriesChart.module.css';

export interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface TimeSeriesChartProps {
  title: string;
  data: TimeSeriesDataPoint[];
  height?: number;
  color?: string;
  showGrid?: boolean;
  showLegend?: boolean;
}

/**
 * Time Series Chart Component
 * Simple SVG-based line chart for alert timeline
 */
export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  title,
  data,
  height = 300,
  color = 'var(--color-primary-500)',
  showGrid = true,
  showLegend = true,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={styles['chart']}>
        <h3 className={styles['chart__title']}>{title}</h3>
        <div className={styles['chart__empty']}>No data available</div>
      </div>
    );
  }

  const padding = 40;
  const width = 800;
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const minValue = 0;

  const xScale = (width - padding * 2) / (data.length - 1 || 1);
  const yScale = (height - padding * 2) / (maxValue - minValue || 1);

  // Generate points for line
  const points = data
    .map((d, i) => {
      const x = padding + i * xScale;
      const y = height - padding - (d.value - minValue) * yScale;
      return `${x},${y}`;
    })
    .join(' ');

  // Generate grid lines
  const gridLines = [];
  const gridCount = 5;
  for (let i = 0; i <= gridCount; i++) {
    const y = padding + (i * (height - padding * 2)) / gridCount;
    const value = maxValue - (i * maxValue) / gridCount;
    gridLines.push(
      <g key={`grid-${i}`}>
        {showGrid && (
          <line
            x1={padding}
            y1={y}
            x2={width - padding}
            y2={y}
            className={styles['chart__grid-line']}
          />
        )}
        <text x={padding - 10} y={y + 4} className={styles['chart__axis-label']}>
          {Math.round(value)}
        </text>
      </g>
    );
  }

  return (
    <div className={styles['chart']}>
      <h3 className={styles['chart__title']}>{title}</h3>
      <div className={styles['chart__container']}>
        <svg width={width} height={height} className={styles['chart__svg']}>
          {/* Grid */}
          {gridLines}

          {/* X-axis */}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            className={styles['chart__axis']}
          />

          {/* Y-axis */}
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={height - padding}
            className={styles['chart__axis']}
          />

          {/* Line */}
          <polyline
            points={points}
            className={styles['chart__line']}
            style={{ stroke: color }}
          />

          {/* Data points */}
          {data.map((d, i) => {
            const x = padding + i * xScale;
            const y = height - padding - (d.value - minValue) * yScale;
            return (
              <circle
                key={`point-${i}`}
                cx={x}
                cy={y}
                r={4}
                className={styles['chart__point']}
                style={{ fill: color }}
              />
            );
          })}

          {/* X-axis labels */}
          {data.map((d, i) => {
            if (i % Math.ceil(data.length / 5) !== 0 && i !== data.length - 1) return null;
            const x = padding + i * xScale;
            const y = height - padding + 20;
            return (
              <text key={`label-${i}`} x={x} y={y} className={styles['chart__axis-label']}>
                {new Date(d.timestamp).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </text>
            );
          })}
        </svg>
      </div>

      {showLegend && (
        <div className={styles['chart__legend']}>
          <div className={styles['chart__legend-item']}>
            <div
              className={styles['chart__legend-color']}
              style={{ backgroundColor: color }}
            />
            <span>Alerts</span>
          </div>
        </div>
      )}
    </div>
  );
};

TimeSeriesChart.displayName = 'TimeSeriesChart';

export default TimeSeriesChart;
