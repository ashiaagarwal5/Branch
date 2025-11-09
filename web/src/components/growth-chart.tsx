"use client"

import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartData = [
  { day: "Mon", hours: 2.5 },
  { day: "Tue", hours: 3.2 },
  { day: "Wed", hours: 2.8 },
  { day: "Thu", hours: 4.1 },
  { day: "Fri", hours: 3.5 },
  { day: "Sat", hours: 5.2 },
  { day: "Sun", hours: 4.8 },
]

const chartConfig = {
  hours: {
    label: "Study Hours",
    color: "#96be8c",
  },
} satisfies ChartConfig

export function GrowthChart() {
  return (
    <Card className="rounded-2xl border-border/40">
      <CardHeader>
        <CardTitle className="text-xl">Weekly Growth</CardTitle>
        <CardDescription>Your study time over the past week</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            data={chartData}
            margin={{
              left: 0,
              right: 0,
              top: 10,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.3} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              style={{ fontSize: "12px", fill: "#6b7280" }}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} style={{ fontSize: "12px", fill: "#6b7280" }} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
            <defs>
              <linearGradient id="fillHours" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#96be8c" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#96be8c" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <Area
              dataKey="hours"
              type="natural"
              fill="url(#fillHours)"
              fillOpacity={1}
              stroke="#96be8c"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>

        <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
          <TrendingUp className="w-4 h-4 text-primary" strokeWidth={2} />
          <span>Up 12% from last week</span>
        </div>
      </CardContent>
    </Card>
  )
}
