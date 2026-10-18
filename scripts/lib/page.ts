export interface ValidationIssueLike {
  severity: string;
  code: string;
  message: string;
}

export function pageGrade(label: string, grade: string, score: number): string {
  return `${label.padEnd(12)} ${grade} ${String(score).padStart(3)}`;
}

export function printIssues(issues: readonly ValidationIssueLike[]): void {
  for (const issue of issues) {
    console.log(`  [${issue.severity}] ${issue.code}: ${issue.message}`);
  }
}
