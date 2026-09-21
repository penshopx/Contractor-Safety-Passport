import type { ProjectDocumentData } from "./document-generator.ts";

export interface SmkkActivity {
  id?: number;
  projectId: number | null;
  type: string;
  title: string;
  project: string;
  actor: string;
  status: string;
  occurredAt: string;
}

export interface SmkkSummary {
  toolbox: number;
  inspection: number;
  permit: number;
  nearMiss: number;
  openFindings: number;
  closedFindings: number;
}

const ISO_ACTIVITY_DATE =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2})$/;

export function isValidSmkkActivityDate(value: string | null | undefined) {
  if (!value) return false;

  const match = ISO_ACTIVITY_DATE.exec(value);
  if (!match) return false;

  const [, year, month, day, hour, minute, second, , timezone] = match;
  const yearNumber = Number(year);
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  const daysInMonth = new Date(Date.UTC(yearNumber, monthNumber, 0)).getUTCDate();

  if (
    monthNumber < 1 ||
    monthNumber > 12 ||
    dayNumber < 1 ||
    dayNumber > daysInMonth ||
    Number(hour) > 23 ||
    Number(minute) > 59 ||
    Number(second) > 59
  ) {
    return false;
  }

  if (timezone !== "Z") {
    const timezoneHour = Number(timezone.slice(1, 3));
    const timezoneMinute = Number(timezone.slice(4, 6));
    if (timezoneHour > 23 || timezoneMinute > 59) return false;
  }

  return Number.isFinite(Date.parse(value));
}

export function countInvalidProjectActivityDates(
  activities: SmkkActivity[] | undefined,
  projectId: number,
) {
  if (!activities || !projectId) return 0;

  return activities.filter(
    (activity) =>
      activity.projectId === projectId &&
      !isValidSmkkActivityDate(activity.occurredAt),
  ).length;
}

export function selectMonthlyProjectActivities(
  activities: SmkkActivity[] | undefined,
  projectId: number,
  month: string,
) {
  if (!activities || !projectId || !/^\d{4}-\d{2}$/.test(month)) return [];

  return activities
    .filter(
      (activity) =>
        activity.projectId === projectId &&
        isValidSmkkActivityDate(activity.occurredAt) &&
        activity.occurredAt.slice(0, 7) === month,
    )
    .sort(
      (left, right) =>
        Date.parse(left.occurredAt) - Date.parse(right.occurredAt),
    );
}

export function summarizeSmkkActivities(
  activities: SmkkActivity[],
): SmkkSummary {
  const summary: SmkkSummary = {
    toolbox: 0,
    inspection: 0,
    permit: 0,
    nearMiss: 0,
    openFindings: 0,
    closedFindings: 0,
  };

  for (const activity of activities) {
    if (activity.type === "Toolbox") summary.toolbox++;
    else if (activity.type === "Inspection") summary.inspection++;
    else if (activity.type === "Permit to work") summary.permit++;
    else if (activity.type === "Near miss") summary.nearMiss++;

    if (activity.status === "open" || activity.status === "review") {
      summary.openFindings++;
    } else if (activity.status === "complete") {
      summary.closedFindings++;
    }
  }

  return summary;
}

type SmkkProject = ProjectDocumentData["project"];

interface SmkkReportDetails {
  period: string;
  providerName: string;
  evaluation: string;
  notes: string;
  preparedBy: string;
  reviewedBy: string;
  approvedBy: string;
}

export function createSmkkDocumentData(
  project: SmkkProject,
  activities: SmkkActivity[],
  summary: SmkkSummary,
  details: SmkkReportDetails,
): ProjectDocumentData {
  return {
    kind: "smkk-report",
    project,
    people: [],
    certificates: [],
    activities: activities.map(
      ({ type, title, actor, status, occurredAt }) => ({
        type,
        title,
        actor,
        status,
        occurredAt,
      }),
    ),
    extra: {
      ...details,
      summary: JSON.stringify(summary),
    },
  };
}