import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
  Sankey,
} from "recharts";
import { Leaf, Recycle, Package, TrendingUp } from "lucide-react";
import { useStore } from "../store/useStore";
import { ROUTE_META } from "../data/constants";
import {
  weeklySeries,
  routeBreakdown,
  categoryBreakdown,
  sankeyData,
  landfillAvoidedKg,
  co2eSavedKg,
  itemsRerouted,
  diversionRate,
} from "../store/selectors";
import {
  PageHeader,
  Highlight,
  Card,
  StatNumber,
  EmptyState,
} from "../components/ui";
export default function Dashboard() {
  const activities = useStore((s) => s.activities);
  const breakdown = routeBreakdown(activities).filter((r) => r.value > 0);
  const category = categoryBreakdown(activities).filter((c) => c.value > 0);
  const sankey = sankeyData(activities);
  return (
    <>
      <PageHeader
        eyebrow="EVERYDAY ACTIONS. VISIBLE CHANGE."
        title={
          <>
            Look at the good <Highlight>you’re growing.</Highlight>
          </>
        }
        description="A little perspective on your circular journey, one logged item at a time."
      />
      <div className="dashboard-stats">
        <Card>
          <StatNumber
            value={itemsRerouted(activities)}
            label="items rerouted"
            icon={<Recycle size={20} />}
          />
        </Card>
        <Card>
          <StatNumber
            value={landfillAvoidedKg(activities).toFixed(1)}
            unit="kg"
            label="landfill avoided"
            icon={<Package size={20} />}
          />
        </Card>
        <Card>
          <StatNumber
            value={co2eSavedKg(activities).toFixed(1)}
            unit="kg"
            label="estimated CO₂e saved"
            icon={<Leaf size={20} />}
          />
        </Card>
        <Card>
          <StatNumber
            value={Math.round(diversionRate(activities) * 100)}
            unit="%"
            label="weight diverted"
            icon={<TrendingUp size={20} />}
          />
        </Card>
      </div>
      <div className="notice">
        Indicative demo estimates include all logged statuses, including pending
        actions. CO₂e figures are approximations, not verified offsets.
      </div>
      <div className="chart-grid">
        <Card className="chart-card">
          <h3>Eight weeks of better routes</h3>
          <p>Logged weight, by route (kg)</p>
          <ResponsiveContainer width="100%" height={290}>
            <BarChart
              data={weeklySeries(activities)}
              margin={{ left: -20, right: 5, top: 15 }}
            >
              <CartesianGrid vertical={false} stroke="#E5E7EB" />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                fontSize={11}
              />
              <YAxis tickLine={false} axisLine={false} fontSize={11} />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(2)} kg`]}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              {Object.entries(ROUTE_META).map(([r, m]) => (
                <Bar
                  key={r}
                  dataKey={r}
                  name={m.label}
                  stackId="weight"
                  fill={m.color}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="chart-card">
          <h3>Every route has a purpose</h3>
          <p>How your logged weight finds its way</p>
          {breakdown.length ? (
            <>
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie
                    data={breakdown}
                    dataKey="value"
                    innerRadius={65}
                    outerRadius={92}
                    paddingAngle={3}
                  >
                    {breakdown.map((r) => (
                      <Cell key={r.name} fill={r.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v.toFixed(2)} kg`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="chart-legend">
                {breakdown.map((r) => (
                  <span key={r.name}>
                    <i style={{ background: r.color }} />
                    {r.name} <b>{r.value.toFixed(1)} kg</b>
                  </span>
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              title="Your journey starts here"
              description="Log an item to see its route."
            />
          )}
        </Card>
        <Card className="chart-card">
          <h3>The materials in your story</h3>
          <p>Weight by category (kg)</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              layout="vertical"
              data={category}
              margin={{ left: 5, right: 20 }}
            >
              <XAxis type="number" fontSize={11} />
              <YAxis
                dataKey="name"
                type="category"
                width={75}
                fontSize={11}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip formatter={(v: number) => `${v.toFixed(2)} kg`} />
              <Bar dataKey="value" radius={[0, 5, 5, 0]}>
                {category.map((c) => (
                  <Cell key={c.name} fill={c.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="chart-card">
          <h3>From material to possibility</h3>
          <p>Category → route · link widths show kilograms</p>
          {sankey.links.length > 0 && (
            <ResponsiveContainer width="100%" height={290}>
              <Sankey
                data={sankey}
                nodePadding={14}
                nodeWidth={9}
                margin={{ top: 20, bottom: 20, left: 70, right: 90 }}
                node={{ fill: "#16A34A" }}
                link={{ stroke: "#91CBA6" }}
              >
                <Tooltip formatter={(v: number) => `${v.toFixed(2)} kg`} />
              </Sankey>
            </ResponsiveContainer>
          )}
          <div className="flow-key">
            {sankey.nodes.map((n) => (
              <span key={n.name}>{n.name}</span>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
