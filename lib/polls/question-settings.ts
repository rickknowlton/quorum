export type FollowUpWhen = "yes" | "no" | "either";

export type ShowIfCondition = {
  questionId: string;
  values: Array<"yes" | "no">;
};

export const FOLLOW_UP_TITLE_DEFAULTS: Record<FollowUpWhen, string> = {
  yes: "You said “Yes” on the previous question. Can you elaborate?",
  no: "You said “No” on the previous question. Can you elaborate?",
  either: "Can you elaborate on why you chose that answer?",
};

export function followUpValues(when: FollowUpWhen): Array<"yes" | "no"> {
  return when === "either" ? ["yes", "no"] : [when];
}

export function followUpWhenFromValues(values: Array<"yes" | "no">): FollowUpWhen {
  const hasYes = values.includes("yes");
  const hasNo = values.includes("no");
  if (hasYes && hasNo) {
    return "either";
  }
  return hasNo ? "no" : "yes";
}

export function parseShowIf(settings: Record<string, unknown> | null | undefined): ShowIfCondition | null {
  const raw = settings?.showIf;
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as { questionId?: unknown; values?: unknown };
  if (typeof record.questionId !== "string" || record.questionId.length === 0) {
    return null;
  }
  if (!Array.isArray(record.values)) {
    return null;
  }

  const values = record.values.filter(
    (value): value is "yes" | "no" => value === "yes" || value === "no",
  );
  if (values.length === 0) {
    return null;
  }

  return { questionId: record.questionId, values };
}

export function parseAllowMultiple(settings: Record<string, unknown> | null | undefined) {
  return settings?.allowMultiple === true;
}

export function multipleChoiceSettingsJson(allowMultiple: boolean): Record<string, unknown> | null {
  return allowMultiple ? { allowMultiple: true } : null;
}

export function isFollowUpVisible(
  showIf: ShowIfCondition | null | undefined,
  parentValue: string | undefined,
) {
  if (!showIf) {
    return true;
  }
  return parentValue === "yes" || parentValue === "no"
    ? showIf.values.includes(parentValue)
    : false;
}
