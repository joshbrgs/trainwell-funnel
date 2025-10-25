import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts"

export interface FunnelData {
  step: string
  users: number
  conversionRate: number
  dropoffRate: number
}

interface FunnelVisualizationProps {
  data: FunnelData[]
}

const COLORS = {
  high: "#775FAB", // Violet - high conversion
  medium: "#9B7EC4", // Light violet - medium conversion
  low: "#B899D6", // Lighter violet - low conversion
  critical: "#443564", // Dark violet - critical conversion
}

const getBarColor = (conversionRate: number): string => {
  if (conversionRate >= 80) return COLORS.high
  if (conversionRate >= 60) return COLORS.medium
  if (conversionRate >= 40) return COLORS.low
  return COLORS.critical
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3">
        <p className="font-medium mb-2">{data.step}</p>
        <div className="space-y-1 text-sm">
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">{data.users.toLocaleString()}</span> users
          </p>
          <p className="text-muted-foreground">
            Overall Conversion: <span className="font-medium text-foreground">{data.conversionRate.toFixed(1)}%</span>
          </p>
          {data.dropoffRate > 0 && (
            <p className="text-destructive">
              Drop-off from Previous: <span className="font-medium">{data.dropoffRate.toFixed(1)}%</span>
            </p>
          )}
        </div>
      </div>
    )
  }
  return null
}

export function FunnelVisualization({ data }: FunnelVisualizationProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[350px] items-center justify-center text-muted-foreground">
        <div className="text-center space-y-2">
          <p className="text-sm">No funnel data available</p>
          <p className="text-xs">Configure your funnel steps and date range to see results</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 60,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="step"
          angle={-45}
          textAnchor="end"
          height={80}
          className="text-xs"
        />
        <YAxis
          label={{ value: "Users", angle: -90, position: "insideLeft" }}
          className="text-xs"
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: "20px" }}
          formatter={(value) => (
            <span className="text-sm">{value}</span>
          )}
        />
        <Bar dataKey="users" name="Total Users" radius={[8, 8, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry.conversionRate)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
