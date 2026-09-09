import type { PreLeafCategory } from "./addSlotTypes";

export const todayStr = () => new Date().toISOString().split("T")[0];

export const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const COORD_LAT_RE = /^-?(([0-8]?\d(\.\d+)?)|90(\.0+)?)$/;
export const COORD_LNG_RE = /^-?((1[0-7]\d|\d{1,2})(\.\d+)?|180(\.0+)?)$/;

export const minutesOf = (t: string): number => {
  if (!t) return 0;

  // Check for AM / PM presence
  const is12Hour = /am|pm/i.test(t);

  if (is12Hour) {
    const match = t.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
    if (!match) return 0;

    let [, hoursStr, minsStr, modifier] = match;
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minsStr, 10);

    if (modifier.toLowerCase() === "pm" && hours < 12) hours += 12;
    if (modifier.toLowerCase() === "am" && hours === 12) hours = 0;

    return hours * 60 + minutes;
  }

  // Standard 24-hour "HH:mm"
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function hasChildren(node: any): boolean {
  return Array.isArray(node.children) && node.children.length > 0;
}

export function collectPreLeafCategories(
  nodes: any[],
  parentName?: string,
): PreLeafCategory[] {
  const result: PreLeafCategory[] = [];

  for (const node of nodes) {
    if (!hasChildren(node)) continue;

    const childrenAreAllLeaves = node.children.every(
      (child: any) => !hasChildren(child),
    );

    if (childrenAreAllLeaves) {
      result.push({
        _id: node._id,
        name: node.name,
        level: node.level,
        category_image: node.category_image,
        parentName,
      });
    } else {
      result.push(...collectPreLeafCategories(node.children, node.name));
    }
  }

  return result;
}

export const to24Hour = (timeStr: string): string => {
  if (!timeStr) return "";
  if (!/am|pm/i.test(timeStr)) return timeStr.trim(); // already 24hr

  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!match) return timeStr;

  let [, h, m, period] = match;
  let hours = parseInt(h, 10);
  if (period.toLowerCase() === "pm" && hours < 12) hours += 12;
  if (period.toLowerCase() === "am" && hours === 12) hours = 0;

  return `${String(hours).padStart(2, "0")}:${m}`;
};
