import type { Activity } from "../data/types";
export function weekStart(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}
export function groupActivitiesByWeek(
  activities: Activity[],
  now = new Date(),
) {
  const current = weekStart(now);
  const last = new Date(current);
  last.setDate(last.getDate() - 7);
  const groups = new Map<number, Activity[]>();
  for (const activity of [...activities].sort(
    (a, b) => Date.parse(b.date) - Date.parse(a.date),
  )) {
    const time = weekStart(new Date(activity.date)).getTime();
    groups.set(time, [...(groups.get(time) ?? []), activity]);
  }
  return [...groups].map(([time, items]) => ({
    key: time,
    label:
      time === current.getTime()
        ? "This week"
        : time === last.getTime()
          ? "Last week"
          : `Week of ${new Date(time).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`,
    items,
  }));
}
