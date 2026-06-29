"use client";

import { Bar, BarChart, CartesianGrid, Legend, XAxis } from "recharts";

import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export interface TaskTokenChartDatum {
  task: string;
  input: number;
  output: number;
}

const chartConfig = {
  input: {
    label: "Input",
    color: "var(--chart-1)",
  },
  output: {
    label: "Output",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function TaskTokenChart({ data }: { data: TaskTokenChartDatum[] }) {
  return (
    <ChartContainer
      className="h-[260px] w-full"
      config={chartConfig}
      initialDimension={{ width: 720, height: 260 }}
    >
      <BarChart accessibilityLayer data={data} margin={{ left: 0, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          axisLine={false}
          dataKey="task"
          tickLine={false}
          tickMargin={10}
          tickFormatter={formatAxisTask}
        />
        <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
        <Legend />
        <Bar
          dataKey="input"
          fill="var(--color-input)"
          radius={0}
          stackId="tokens"
        />
        <Bar
          dataKey="output"
          fill="var(--color-output)"
          radius={0}
          stackId="tokens"
        />
      </BarChart>
    </ChartContainer>
  );
}

function formatAxisTask(value: string) {
  return value.length > 18 ? `${value.slice(0, 17)}…` : value;
}
