import React, { useRef } from "react";
import type { BarDataItem } from "../../../../modules/sales-incentive/types/salesIncentive.types";

interface HorizontalGroupedBarChartProps {
  data: BarDataItem[];
  colors?: [string, string, string];
  maxValue?: number;
  labelWidth?: number;
  barHeight?: number;
  barGap?: number;
  groupGap?: number;
  tickCount?: number;
  labelFontSize?: number;
  axisFontSize?: number;
  labelColor?: string;
  axisColor?: string;
  barRadius?: number;
  className?: string;
  chartWidth?: number;
}

const DEFAULT_COLORS: [string, string, string] = [
  "#FBC79A",
  "#B7A6F0",
  "#9CE8C4",
];

const DEFAULTS = {
  labelWidth: 85,
  barHeight: 4,
  barGap: 3,
  groupGap: 10,
  tickCount: 3,
  labelFontSize: 10,
  axisFontSize: 11,
  labelColor: "#59596C",
  axisColor: "#59596C",
  barRadius: 12,
};

function niceMax(rawMax: number, tickCount: number): number {
  if (rawMax <= 0) return tickCount;
  const roughStep = rawMax / tickCount;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalized = roughStep / magnitude;
  let niceStep: number;
  if (normalized <= 1) niceStep = 1;
  else if (normalized <= 2) niceStep = 2;
  else if (normalized <= 5) niceStep = 5;
  else niceStep = 10;
  niceStep *= magnitude;
  return niceStep * tickCount;
}

function rightRoundedBarPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): string {
  if (width <= 0) return "";
  const r = Math.max(0, Math.min(radius, height / 2, width));
  if (r === 0) {
    return `M ${x},${y} H ${x + width} V ${y + height} H ${x} Z`;
  }
  return `
    M ${x},${y}
    H ${x + width - r}
    A ${r},${r} 0 0 1 ${x + width},${y + r}
    V ${y + height - r}
    A ${r},${r} 0 0 1 ${x + width - r},${y + height}
    H ${x}
    Z
  `;
}

const HorizontalGroupedBarChart: React.FC<HorizontalGroupedBarChartProps> = ({
  data,
  colors = DEFAULT_COLORS,
  maxValue,
  labelWidth = DEFAULTS.labelWidth,
  barHeight = DEFAULTS.barHeight,
  barGap = DEFAULTS.barGap,
  groupGap = DEFAULTS.groupGap,
  tickCount = DEFAULTS.tickCount,
  labelFontSize = DEFAULTS.labelFontSize,
  axisFontSize = DEFAULTS.axisFontSize,
  labelColor = DEFAULTS.labelColor,
  axisColor = DEFAULTS.axisColor,
  barRadius = DEFAULTS.barRadius,
  chartWidth = 165,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const categories = data.map((d) => d.label);
  const series = [
    { color: colors[0], data: data.map((d) => d.value1) },
    { color: colors[1], data: data.map((d) => d.value2) },
    { color: colors[2], data: data.map((d) => d.value3) },
  ];

  const seriesCount = series.length;
  const groupHeight = seriesCount * barHeight + (seriesCount - 1) * barGap;
  const rowHeight = groupHeight + groupGap;
  const axisHeight = 28;
  const plotHeight = categories.length * rowHeight;
  const chartHeight = plotHeight + axisHeight;
  const rawMax = Math.max(1, ...series.flatMap((s) => s.data));
  const computedMax = maxValue ?? niceMax(rawMax, tickCount);
  const rightPadding = 14;
  const plotWidth = Math.max(0, chartWidth - rightPadding);
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) =>
    Math.round((computedMax / tickCount) * i),
  );

  return (
    <div className={className} style={{ display: "flex" }}>
      {/* Label column */}
      <div style={{ width: labelWidth, flexShrink: 0 }}>
        {categories.map((label, i) => (
          <div
            key={label + i}
            style={{
              height: rowHeight,
              display: "flex",
              alignItems: "center",
              overflow: "hidden",
            }}
          >
            <span
              style={{
                fontSize: labelFontSize,
                color: labelColor,
                fontFamily: "Arial, sans-serif",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={label}
            >
              {label}
            </span>
          </div>
        ))}
        <div style={{ height: axisHeight }} />
      </div>

      {/* Chart column */}
      <div ref={containerRef} style={{ flex: 1, minWidth: 0 }}>
        {chartWidth > 0 && (
          <svg width={chartWidth} height={chartHeight}>
            {/* Bars */}
            {categories.map((_, catIndex) => {
              const groupTop = catIndex * rowHeight + (groupGap - barGap) / 2;
              return series.map((s, seriesIndex) => {
                const value = s.data[catIndex] ?? 0;
                const barWidth = (value / computedMax) * plotWidth;
                const y = groupTop + seriesIndex * (barHeight + barGap);
                return (
                  <path
                    key={`bar-${catIndex}-${seriesIndex}`}
                    d={rightRoundedBarPath(
                      0,
                      y,
                      barWidth,
                      barHeight,
                      barRadius,
                    )}
                    fill={s.color}
                  />
                );
              });
            })}
            <line
              x1={0}
              y1={plotHeight}
              x2={plotWidth}
              y2={plotHeight}
              stroke={"#F0F0F0"}
              strokeWidth={1}
            />
            {ticks.map((tickVal, i) => {
              const x = (tickVal / computedMax) * plotWidth;
              const isFirst = i === 0;
              const isLast = i === ticks.length - 1;
              return (
                <text
                  key={`tick-${i}`}
                  x={x}
                  y={plotHeight + axisHeight - 10}
                  fontSize={axisFontSize}
                  fill={axisColor}
                  fontFamily="Arial, sans-serif"
                  textAnchor={isFirst ? "start" : isLast ? "end" : "middle"}
                >
                  {tickVal}
                </text>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
};

export default HorizontalGroupedBarChart;
