import React, { useMemo } from "react";

interface PieDataItem {
  label: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: PieDataItem[];
  colors?: string[];
  size?: number;
  innerRadius?: number;
  strokeColor?: string;
  strokeWidth?: number;
  startAngle?: number;
  total?: number;
  emptyColor?: string;
  className?: string;
}

const DEFAULT_COLORS = [
  "#A7D3E0",
  "#A6EFC7",
  "#FFB3D1",
  "#C6B6F5",
  "#8FBFF5",
  "#D6C7F7",
  "#F3D9F9",
  "#CDEFB0",
  "#EAF7EC",
  "#FBC79A",
];

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
): { x: number; y: number } {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function slicePath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, endAngle);

  if (innerR <= 0) {
    return `
      M ${cx},${cy}
      L ${outerStart.x},${outerStart.y}
      A ${outerR},${outerR} 0 ${largeArc} 1 ${outerEnd.x},${outerEnd.y}
      Z
    `;
  }

  const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);
  return `
    M ${outerStart.x},${outerStart.y}
    A ${outerR},${outerR} 0 ${largeArc} 1 ${outerEnd.x},${outerEnd.y}
    L ${innerEnd.x},${innerEnd.y}
    A ${innerR},${innerR} 0 ${largeArc} 0 ${innerStart.x},${innerStart.y}
    Z
  `;
}

interface ResolvedSlice {
  key: string;
  path: string;
  fill: string;
}

const PieChart: React.FC<PieChartProps> = ({
  data = [],
  colors = DEFAULT_COLORS,
  size = 260,
  innerRadius = 0,
  strokeColor = "#FFFFFF",
  strokeWidth = 1,
  startAngle = 0,
  total = 0,
  emptyColor = "#F0F0F0",
  className,
}) => {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2;
  const slices = useMemo<ResolvedSlice[]>(() => {
    const sum = data.reduce((acc, d) => acc + Math.max(0, d.value), 0);
    const denominator = total ?? sum;
    if (denominator <= 0) return [];

    const result: ResolvedSlice[] = [];
    let currentAngle = startAngle;

    data.forEach((d, i) => {
      if (d.value <= 0) return;
      const sliceAngle = (d.value / denominator) * 360;
      const start = currentAngle;
      const end = currentAngle + sliceAngle;
      currentAngle = end;

      result.push({
        key: `slice-${i}-${d.label}`,
        path: slicePath(cx, cy, outerR, innerRadius, start, end),
        fill: d.color ?? colors[i % colors.length],
      });
    });
    if (total !== undefined && total > sum) {
      const start = currentAngle;
      const end = startAngle + 360;
      result.push({
        key: "slice-empty",
        path: slicePath(cx, cy, outerR, innerRadius, start, end),
        fill: emptyColor,
      });
    }

    return result;
  }, [
    data,
    colors,
    total,
    startAngle,
    cx,
    cy,
    outerR,
    innerRadius,
    emptyColor,
  ]);

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
    >
      {slices.map((s) => (
        <path
          key={s.key}
          d={s.path}
          fill={s.fill}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
};

export default React.memo(PieChart);
