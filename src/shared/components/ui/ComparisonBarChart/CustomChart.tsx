import React, { useMemo } from "react";

export interface BarChartItem {
  label: string;
  values: number[];
}

export interface CustomBarChartProps {
  data?: BarChartItem[];
  maxValue?: number;
  yAxisSteps?: number;
  height?: number;
  barColors?: string[];
  barWidth?: number;
  barGap?: number;
  categoryGap?: number;
  yAxisColor?: string;
  xAxisColor?: string;
  fontSize?: number;
  showYAxis?: boolean;
  showYAxisLine?: boolean;
  showGrid?: boolean;
  showXAxis?: boolean;
  leftPadding?: number;
  rightPadding?: number;
  topPadding?: number;
  bottomPadding?: number;
  valueFormatter?: (value: number) => string;
  labelFormatter?: (label: string) => string[];
  className?: string;
}

const defaultData: BarChartItem[] = [
  {
    label: "Mixer Grinders",
    values: [12, 55, 85],
  },
  {
    label: "Microwave Ovens",
    values: [38, 20, 5],
  },
  {
    label: "Rice Cookers",
    values: [22, 95, 35],
  },
  {
    label: "Induction Cooktops",
    values: [85, 70, 108],
  },
  {
    label: "Refrigerators",
    values: [58, 65, 76],
  },
  {
    label: "Air fryers",
    values: [68, 10, 36],
  },
  {
    label: "Wet grinders",
    values: [88, 22, 72],
  },
  {
    label: "OTG ovens",
    values: [39, 100, 32],
  },
  {
    label: "Electric kettles",
    values: [18, 100, 115],
  },
  {
    label: "Chimneys",
    values: [57, 110, 15],
  },
];

const defaultColors = ["#FFD2AD", "#BCB1FF", "#A8EACF"];

const splitLabel = (label: string): string[] => {
  const words = label.trim().split(/\s+/);

  if (words.length <= 1) {
    return [label];
  }

  if (words.length === 2) {
    return words;
  }

  const middle = Math.ceil(words.length / 2);

  return [words.slice(0, middle).join(" "), words.slice(middle).join(" ")];
};

const CustomBarChart: React.FC<CustomBarChartProps> = ({
  data = defaultData,
  maxValue,
  yAxisSteps = 5,
  height = 224,
  barColors = defaultColors,
  barWidth = 15,
  barGap = 4,
  yAxisColor = "#8A8A8A",
  xAxisColor = "#666666",
  fontSize = 10,
  showYAxis = true,
  showYAxisLine = true,
  showGrid = false,
  showXAxis = false,
  leftPadding = 28,
  rightPadding = 8,
  topPadding = 8,
  bottomPadding = 38,
  valueFormatter = (value) => `${value}`,
  labelFormatter = splitLabel,
  className = "",
}) => {
  const calculatedMaxValue = useMemo(() => {
    const maximum = Math.max(...data.flatMap((item) => item.values), 0);

    if (maxValue !== undefined) {
      return maxValue;
    }

    return Math.ceil(maximum / 25) * 25;
  }, [data, maxValue]);

  const yAxisValues = useMemo(() => {
    const values: number[] = [];
    for (let i = 0; i <= yAxisSteps; i++) {
      values.push((calculatedMaxValue / yAxisSteps) * i);
    }
    return values.reverse();
  }, [calculatedMaxValue, yAxisSteps]);

  const chartTop = topPadding;
  const chartBottom = height - bottomPadding;
  const chartHeight = chartBottom - chartTop;

  const getBarHeight = (value: number) => {
    if (calculatedMaxValue <= 0) {
      return 0;
    }

    return Math.max(0, (value / calculatedMaxValue) * chartHeight);
  };

  const getBarY = (value: number) => {
    return chartBottom - getBarHeight(value);
  };

  return (
    <div
      className={`w-full overflow-hidden ${className}`}
      style={{
        minWidth: 0,
      }}
    >
      <div
        className="w-full overflow-x-auto"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 1000 ${height}`}
          preserveAspectRatio="none"
          style={{
            display: "block",
            minWidth: "100%",
            overflow: "visible",
          }}
        >
          {showYAxis &&
            yAxisValues.map((value, index) => {
              const ratio = index / yAxisSteps;

              const y = chartTop + ratio * chartHeight;

              return (
                <g key={`y-${index}`}>
                  {showGrid && (
                    <line
                      x1={leftPadding}
                      x2={1000 - rightPadding}
                      y1={y}
                      y2={y}
                      stroke="#EDEDED"
                      strokeWidth="1"
                    />
                  )}

                  <text
                    x={leftPadding - 8}
                    y={y + 3}
                    textAnchor="end"
                    fontSize={fontSize}
                    fill={yAxisColor}
                    fontWeight={400}
                    color="#59596C"
                    fontFamily="Arial, sans-serif"
                  >
                    {valueFormatter(Math.round(value))}
                  </text>
                </g>
              );
            })}
          {showYAxisLine && (
            <line
              x1={leftPadding}
              x2={leftPadding}
              y1={chartTop}
              y2={chartBottom}
              stroke="#D9D9D9"
              strokeWidth="1"
            />
          )}
          {showXAxis && (
            <line
              x1={leftPadding}
              x2={790 - rightPadding}
              y1={chartBottom}
              y2={chartBottom}
              stroke="#D9D9D9"
              strokeWidth="1"
            />
          )}
          {data.map((item, categoryIndex) => {
            const availableWidth = 800 - leftPadding - rightPadding;
            const categoryWidth = availableWidth / data.length;
            const categoryCenter =
              leftPadding + categoryWidth * categoryIndex + categoryWidth / 2;
            const totalBarsWidth =
              item.values.length * barWidth + (item.values.length - 1) * barGap;
            const startX = categoryCenter - totalBarsWidth / 2;

            return (
              <g key={`${item.label}-${categoryIndex}`}>
                {item.values.map((value, barIndex) => {
                  const barHeight = getBarHeight(value);
                  const x = startX + barIndex * (barWidth + barGap);
                  const y = getBarY(value);
                  const radius = 10; // top corner radius
                  const r = Math.min(radius, barWidth / 2, barHeight); // clamp so it never overshoots a short/thin bar

                  const path = `
                                M ${x},${y + barHeight}
                                L ${x},${y + r}
                                Q ${x},${y} ${x + r},${y}
                                L ${x + barWidth - r},${y}
                                Q ${x + barWidth},${y} ${x + barWidth},${y + r}
                                L ${x + barWidth},${y + barHeight}
                                Z
                              `;
                  return (
                    <path
                      key={`${item.label}-${barIndex}`}
                      d={path}
                      fill={barColors[barIndex % barColors.length]}
                    />
                  );
                })}
                {(() => {
                  const lines = labelFormatter(item.label);

                  return (
                    <text
                      x={categoryCenter}
                      y={chartBottom + 15}
                      textAnchor="middle"
                      fontSize={fontSize}
                      fontWeight={400}
                      fill={xAxisColor}
                      fontFamily="Arial, sans-serif"
                    >
                      {lines.map((line, lineIndex) => (
                        <tspan
                          key={lineIndex}
                          x={categoryCenter}
                          dy={lineIndex === 0 ? 0 : fontSize + 2}
                        >
                          {line}
                        </tspan>
                      ))}
                    </text>
                  );
                })()}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default CustomBarChart;
