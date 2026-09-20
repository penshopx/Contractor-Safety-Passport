import type { ProjectDocumentData } from "./document-generator.ts";

export interface SmkkActivity {
  id?: number;
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

export function selectMonthlyProjectActivities(
  activities: SmkkActivity[] | undefined,
  projectName: string,
  month: string,
) {
  if (!activities || !projectName || !/^\d{4}-\d{2}$/.test(month)) return [];

  return activities
    .filter(
      (activity) =>
        activity.project === projectName &&
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