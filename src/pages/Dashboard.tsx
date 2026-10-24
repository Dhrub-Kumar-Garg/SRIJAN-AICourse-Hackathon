import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import {
  ArrowUpRight,
  Check,
  Info,
  Leaf,
  Package,
  Recycle,
  RotateCcw,
  TrendingUp,
} from "lucide-react";
import { useStore } from "../store/useStore";
import { CATEGORY_META, ROUTE_META } from "../data/constants";
import {
  weeklySeries,
  categoryBreakdown,
  sankeyData,
  landfillAvoidedKg,
  co2eSavedKg,
  itemsRerouted,
  diversionRate,
  handoverCount,
} from "../store/selectors";
import {
  PageHeader,
  Highlight,
  Card,
  StatNumber,
  EmptyState,
  Button,
  useToast,
} from "../components/ui";

/** Keep the final value accessible while the visual number settles. */
function CountUp({
  value,
  decimals = 0,
}: {
  value: number;
  decimals?: number;
}) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    let frame: number;
    const step = (now: number) => {
      const progress = Math.min((now - start) / 650, 1);
      setDisplay(value * (1 - (1 - progress) ** 3));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return (
    <mark className="stat-highlight" aria-label={value.toFixed(decimals)}>
      <span aria-hidden="true">{display.toFixed(decimals)}</span>
    </mark>
  );
}

const flowMeta = [
  ...Object.values(CATEGORY_META),
  ...Object.values(ROUTE_META),
];
const colorFor = (name: string) =>
  flowMeta.find((m) => m.label === name)?.color ?? "#6B7280";
const routeNames = new Set(Object.values(ROUTE_META).map((m) => m.label));

function FlowNode({
  x,
  y,
  width,
  height,
  payload,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  payload: { name: string; value: number };
}) {
  const right = routeNames.has(payload.name);
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={3}
        fill={colorFor(payload.name)}
      />
      <text
        x={right ? x + width + 8 : x - 8}
        y={y + height / 2}
        dy="0.35em"
        textAnchor={right ? "start" : "end"}
        fill="#374151"
        fontSize={11}
      >
        {payload.name}
      </text>
      <title>
        {payload.name}: {payload.value.toFixed(2)} kg
      </title>
    </g>
  );
}

function FlowLink({
  sourceX,
  sourceY,
  sourceControlX,
  targetX,
  targetY,
  targetControlX,
  linkWidth,
  payload,
}: {
  sourceX: number;
  sourceY: number;
  sourceControlX: number;
  targetX: number;
  targetY: number;
  targetControlX: number;
  linkWidth: number;
  payload: {
    source: { name: string };
    target: { name: string };
    value: number;
  };
}) {
  return (
    <path
      d={`M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
      fill="none"
      stroke={colorFor(payload.source.name)}
      strokeWidth={linkWidth}
      strokeOpacity={0.3}
    >
      <title>
        {payload.source.name} → {payload.target.name}:{" "}
        {payload.value.toFixed(2)} kg
      </title>
    </path>
  );
}

export default function Dashboard() {
  const activities = useStore((s) => s.activities);
  const resetDemo = useStore((s) => s.resetDemo);
  const toast = useToast();
  const category = categoryBreakdown(activities).filter((c) => c.value > 0);
  const totalWeight = category.reduce((sum, c) => sum + c.value, 0);
  const flow = sankeyData(activities);
  // Compact disconnected nodes for Recharts; preserve the selector's contract.
  const active = new Set(flow.links.flatMap((l) => [l.source, l.target]));
  const indices = [...active].sort((a, b) => a - b);
  const indexMap = new Map(indices.map((old, index) => [old, index]));
  const sankey = {
    nodes: indices.map((index) => flow.nodes[index]),
    links: flow.links.map((l) => ({
      ...l,
      source: indexMap.get(l.source)!,
      target: indexMap.get(l.target)!,
    })),
  };
  const percent = diversionRate(activities) * 100;
  const wins = activities
    .filter((a) => a.status === "completed")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <>
      <PageHeader
        eyebrow="IMPACT · EVERYDAY ACTIONS. VISIBLE CHANGE."
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
            value={<CountUp value={percent} />}
            unit="%"
            label="Diversion rate"
            icon={<TrendingUp size={20} />}
          />
        </Card>
        <Card>
          <StatNumber
            value={
              <CountUp value={landfillAvoidedKg(activities)} decimals={1} />
            }
            unit="kg"
            label="Landfill avoided"
            icon={<Package size={20} />}
          />
        </Card>
        <Card>
          <StatNumber
            value={<CountUp value={co2eSavedKg(activities)} decimals={1} />}
            unit="kg"
            label="Indicative CO₂e saved"
            icon={<Leaf size={20} />}
          />
          <span
            className="estimate-tip"
            tabIndex={0}
            aria-label="estimated using approximate factors"
          >
            <Info size={14} aria-hidden="true" />
            <span role="tooltip">estimated using approximate factors</span>
          </span>
        </Card>
        <Card>
          <StatNumber
            value={<CountUp value={itemsRerouted(activities)} />}
            label="Items rerouted"
            icon={<Recycle size={20} />}
          />
        </Card>
      </div>
      <div className="notice">
        Indicative demo estimates include all logged statuses, including pending
        actions. CO₂e figures are approximations, not verified offsets.
      </div>
      <div className="chart-grid impact-grid">
        <Card className="chart-card impact-flow">
          <div className="row between wrap">
            <h2>Where our waste goes</h2>
            <span className="badge">{totalWeight.toFixed(1)} kg logged</span>
          </div>
          <p>Category → route · wider flows mean more kilograms</p>
          {sankey.links.length ? (
            <>
              <div className="flow-headings">
                <span>MATERIAL</span>
                <span>SECOND ROUTE</span>
              </div>
              <div
                role="img"
                aria-label="Waste flow from material categories to routes, in kilograms"
              >
                <ResponsiveContainer width="100%" height={380}>
                  <Sankey
                    data={sankey}
                    nodePadding={24}
                    nodeWidth={10}
                    sort={false}
                    margin={{ top: 16, bottom: 16, left: 73, right: 91 }}
                    node={FlowNode}
                    link={FlowLink}
                  >
                    <Tooltip formatter={(v: number) => `${v.toFixed(2)} kg`} />
                  </Sankey>
                </ResponsiveContainer>
              </div>
              <details className="flow-details">
                <summary>View flow weights</summary>
                <ul>
                  {flow.links.map((l) => (
                    <li key={`${l.source}-${l.target}`}>
                      {flow.nodes[l.source].name} → {flow.nodes[l.target].name}
                      <strong>{l.value.toFixed(2)} kg</strong>
                    </li>
                  ))}
                </ul>
              </details>
            </>
          ) : (
            <EmptyState
              title="Every route starts with an item"
              description="Log an activity or complete a reuse handover to see your material flows."
            />
          )}
        </Card>
        <Card className="chart-card weekly-chart">
          <h3>Eight weeks of better routes</h3>
          <p>Weekly logged weight by route (kg)</p>
          <ResponsiveContainer width="100%" height={300}>
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
                minTickGap={14}
              />
              <YAxis tickLine={false} axisLine={false} fontSize={11} />
              <Tooltip
                formatter={(value: number) => `${value.toFixed(2)} kg`}
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
          <h3>The materials in your story</h3>
          <p>Share of logged weight by category</p>
          {category.length ? (
            <>
              <ResponsiveContainer width="100%" height={225}>
                <PieChart>
                  <Pie
                    data={category}
                    dataKey="value"
                    innerRadius={62}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {category.map((c) => (
                      <Cell key={c.name} fill={c.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) =>
                      `${v.toFixed(2)} kg · ${((v / totalWeight) * 100).toFixed(1)}%`
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="chart-legend category-legend">
                {category.map((c) => (
                  <span key={c.name}>
                    <i style={{ background: c.color }} />
                    {c.name}
                    <b>{((c.value / totalWeight) * 100).toFixed(1)}%</b>
                  </span>
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              title="Your story is taking shape"
              description="Your material mix will appear after your first logged item."
            />
          )}
        </Card>
        <Card className="chart-card goal-card">
          <h3>Diversion goal</h3>
          <p>Aim to keep 70% of logged weight out of landfill.</p>
          <div className="row between">
            <strong>{Math.round(percent)}% diverted</strong>
            <span>70% goal</span>
          </div>
          <progress
            max={70}
            value={Math.min(percent, 70)}
            aria-label="Progress toward 70% diversion"
          />
          <p>
            {percent >= 70
              ? "Goal reached. Keep those better routes growing."
              : `${(70 - percent).toFixed(1)} percentage points to go. Every item helps.`}
          </p>
        </Card>
        <Card className="chart-card handover-card">
          <h3>Reuse handovers</h3>
          <p>Completed reuse actions. Useful things, new beginnings.</p>
          <StatNumber
            value={handoverCount(activities)}
            label="completed reuse activities"
            icon={<Recycle size={20} />}
          />
          <Link to="/exchange" className="text-link">
            Visit Reuse Exchange <ArrowUpRight size={16} />
          </Link>
        </Card>
        <Card className="chart-card recent-wins">
          <h3>Recent wins</h3>
          <p>Your last five completed activities and handovers</p>
          {wins.length ? (
            <ul>
              {wins.map((a) => (
                <li key={a.id}>
                  <span className="win-check">
                    <Check size={16} />
                  </span>
                  <div>
                    <strong>{a.itemName}</strong>
                    <small>
                      {a.route === "reuse"
                        ? "Reuse handover"
                        : ROUTE_META[a.route].label}{" "}
                      ·{" "}
                      <time dateTime={a.date}>
                        {new Date(a.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </time>
                    </small>
                  </div>
                  <b>
                    {a.weightKg.toLocaleString("en-IN", {
                      maximumFractionDigits: 3,
                    })}{" "}
                    kg
                  </b>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Your next win is waiting"
              description="Complete an activity or confirm a handover to celebrate it here."
            />
          )}
        </Card>
      </div>
      <div className="impact-footer">
        <p>Synthetic demo data · saved in this browser</p>
        <Button
          variant="secondary"
          className="button-ghost"
          onClick={() => {
            resetDemo();
            toast("Demo activities and listings reset.");
          }}
        >
          <RotateCcw size={15} />
          Reset demo data
        </Button>
      </div>
    </>
  );
}
