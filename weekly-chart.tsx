import { useGetWeeklyStats } from "@workspace/api-client-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { format } from "date-fns";

const today = format(new Date(), "EEE").slice(0, 3);

export function WeeklyChart() {
  const { data, isLoading } = useGetWeeklyStats();

  if (isLoading) {
    return (
      <div className="h-40 bg-muted rounded-2xl animate-pulse" />
    );
  }

  if (!data || data.every((d) => d.total === 0)) {
    return null;
  }

  return (
    <div className="bg-card border border-card-border rounded-2xl p-6 mb-10">
      <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
        This Week
      </h2>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} barGap={4} barCategoryGap="28%">
          <XAxis
            dataKey="dayLabel"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis hide allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))", radius: 6 }}
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--card-border))",
              borderRadius: "0.75rem",
              fontSize: "12px",
              color: "hsl(var(--foreground))",
            }}
            formatter={(value: number, name: string) => [
              value,
              name === "completed" ? "Done" : "Total",
            ]}
          />
          <Bar dataKey="total" radius={[4, 4, 0, 0]} fill="hsl(var(--muted))">
            {data.map((entry) => (
              <Cell
                key={entry.date}
                fill={
                  entry.dayLabel === today
                    ? "hsl(var(--primary) / 0.25)"
                    : "hsl(var(--muted))"
                }
              />
            ))}
          </Bar>
          <Bar dataKey="completed" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))">
            {data.map((entry) => (
              <Cell
                key={entry.date}
                fill={
                  entry.dayLabel === today
                    ? "hsl(var(--primary))"
                    : "hsl(var(--primary) / 0.55)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-primary inline-block" />
          Completed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-muted inline-block border border-border" />
          Scheduled
        </span>
      </div>
    </div>
  );
}
