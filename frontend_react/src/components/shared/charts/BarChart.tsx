/**
 * Bar Chart Component
 * Displays categorical data as a bar chart
 */

import React from 'react';
import styles from './BarChart.module.css';

export interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

export interface BarChartProps {
  title: string;
  data: BarChartData[];
  height?: number;
  showValues?: boolean;
  showGrid?: boolean;
}

/**
 * Bar Chart Component
 * SVG-based bar chart for categorical data
 */
export const BarChart: React.FC<BarChartProps> = ({
  title,
  data,
  height = 300,
  showValues = true,
  showGrid = true,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={styles['bar-chart']}>
        <h3 className={styles['bar-chart__title']}>{title}</h3>
        <div className={styles['bar-chart__empty']}>No data available</div>
      </div>
    );
  }

  const padding = 40;
  const width = Math.max(600, data.length * 80);
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barWidth = (width - padding * 2) / data.length * 0.8;
  const barGap = (width - padding * 2) / data.length * 0.2;

  const colors = [
    'var(--color-primary-500)',
    'var(--color-critical-500)',
    'var(--color-high-500)',
    'var(--color-medium-500)',
    'var(--color-low-500)',
  ];

  // Generate grid lines
  const gridLines = [];
  const gridCount = 5;
  for (let i = 0; i <= gridCount; i++) {
    const y = height - padding - (i * (height - padding * 2)) / gridCount;
    const value = (i * maxValue) / gridCount;
    gridLines.push(
      <g key={`grid-${i}`}>
        {showGrid && (
          <line
            x1={padding}
            y1={y}
            x2={width - padding}
            y2={y}
            className={styles['bar-chart__grid-line']}
          />
        )}
        <text x={padding - 10} y={y + 4} className={styles['bar-chart__axis-label']}>
          {Math.round(value)}
        </text>
      </g>
    );
  }

  return (
    <div className={styles['bar-chart']}>
      <h3 className={styles['bar-chart__title']}>{title}</h3>

      <div className={styles['bar-chart__container']}>
        <svg width={width} height={height} className={styles['bar-chart__svg']}>
          {/* Grid */}
          {gridLines}

          {/* X-axis */}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            className={styles['bar-chart__axis']}
          />

          {/* Y-axis */}
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={height - padding}
            className={styles['bar-chart__axis']}
          />

          {/* Bars */}
          {data.map((d, i) => {
            const x = padding + i * (barWidth + barGap) + barGap / 2;
            const barHeight = (d.value / maxValue) * (height - padding * 2);
            const y = height - padding - barHeight;
            const color = d.color || colors[i % colors.length];

            return (
              <g key={`bar-${i}`}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={color}
                  className={styles['bar-chart__bar']}
                />
                {showValues && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 5}
                    className={styles['bar-chart__value']}
                    textAnchor="middle"
                  >
                    {d.value}
                  </text>
                )}
                <text
                  x={x + barWidth / 2}
                  y={height - padding + 20}
                  className={styles['bar-chart__label']}
                  textAnchor="middle"
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

BarChart.displayName = 'BarChart';

export default BarChart;
