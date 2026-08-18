/**
 * Diagnostic warning item flagging potential engine issues or formatting anomalies.
 */
export interface AnalysisWarning {
  id: string;
  code: string;
  message: string;
  severity: "info" | "warning" | "error";
}
