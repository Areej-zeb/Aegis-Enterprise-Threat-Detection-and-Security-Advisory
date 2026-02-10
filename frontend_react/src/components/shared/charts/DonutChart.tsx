/**
 * Donut Chart Component
 * Displays distribution data as a donut chart
 */

import React from 'react';
import styles from './DonutChart.module.css';

export interface DonutChartData {
  label: string;
  value: number;
  color?: string;
}

export interface DonutChartProps {
  title: string;
  data: DonutChartData[];
  size?: number;
  showLegend?: boolean;
  showPercentages?: boolean;
}

/**
 * Donut Chart Component
 * SVG-based donut chart for distribution visualization
 */
export const DonutChart: React.FC<DonutChartProps> = ({
  title,
  data,
  size = 200,
  showLegend = true,
  showPercentages = true,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={styles['donut']}>
        <h3 className={styles['donut__title']}>{title}</h3>
        <div className={styles['donut__empty']}>No data available</div>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = size / 2;
  const innerRadius = radius * 0.6;

  // Default colors
  const colors = [
    'var(--color-critical-500)',
    'var(--color-high-500)',
    'var(--color-medium-500)',
    'var(--color-low-500)',
    'var(--color-primary-500)',
  ];

  let currentAngle = -Math.PI / 2;
  const slices = data.map((d, i) => {
    const sliceAngle = (d.value / total) * Math.PI * 2;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;

    const x1 = radius + radius * Math.cos(startAngle);
    const y1 = radius + radius * Math.sin(startAngle);
    const x2 = radius + radius * Math.cos(endAngle);
    const y2 = radius + radius * Math.sin(endAngle);

    const ix1 = radius + innerRadius * Math.cos(startAngle);
    const iy1 = radius + innerRadius * Math.sin(startAngle);
    const ix2 = radius + innerRadius * Math.cos(endAngle);
    const iy2 = radius + innerRadius * Math.sin(endAngle);

    const largeArc = sliceAngle > Math.PI ? 1 : 0;

    const pathData = [
      `M ${ix1} ${iy1}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix2} ${iy2}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}`,
      'Z',
    ].join(' ');

    const color = d.color || colors[i % colors.length];
    const percentage = ((d.value / total) * 100).toFixed(1);

    // Label position
    const labelAngle = startAngle + sliceAngle / 2;
    const labelRadius = (radius + innerRadius) / 2;
    const labelX = radius + labelRadius * Math.cos(labelAngle);
    const labelY = radius + labelRadius * Math.sin(labelAngle);

    currentAngle = endAngle;

    return {
      path: pathData,
      color,
      label: d.label,
      value: d.value,
      percentage,
      labelX,
      labelY,
    };
  });

  return (
    <div className={styles['donut']}>
      <h3 className={styles['donut__title']}>{title}</h3>

      <div className={styles['donut__container']}>
        <svg width={size * 1.2} height={size} className={styles['donut__svg']}>
          {slices.map((slice, i) => (
            <g key={`slice-${i}`}>
              <path
                d={slice.path}
                fill={slice.color}
                className={styles['donut__slice']}
              />
              {showPercentages && slice.percentage !== '0.0' && (
                <text
                  x={slice.labelX}
                  y={slice.labelY}
                  className={styles['donut__label']}
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {slice.percentage}%
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      {showLegend && (
        <div className={styles['donut__legend']}>
          {slices.map((slice, i) => (
            <div key={`legend-${i}`} className={styles['donut__legend-item']}>
              <div
                className={styles['donut__legend-color']}
                style={{ backgroundColor: slice.color }}
              />
              <div className={styles['donut__legend-text']}>
                <div className={styles['donut__legend-label']}>{slice.label}</div>
                <div className={styles['donut__legend-value']}>
                  {slice.value} ({slice.percentage}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

DonutChart.displayName = 'DonutChart';

export default DonutChart;
