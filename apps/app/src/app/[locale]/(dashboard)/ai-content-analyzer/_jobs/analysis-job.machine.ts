import type { JobState } from "./analysis-job.types";

/**
 * Map of valid state transitions for the Analysis Job State Machine.
 */
const VALID_TRANSITIONS: Record<JobState, readonly JobState[]> = {
  idle: ["queued"],
  queued: ["preparing", "cancelled"],
  preparing: ["running", "cancelled", "failed"],
  running: ["generating_report", "cancelled", "failed"],
  generating_report: ["completed", "cancelled", "failed"],
  completed: [],
  cancelled: [],
  failed: ["retrying"],
  retrying: ["preparing", "failed"],
} as const;

/**
 * State machine managing job state transitions safely.
 */
export class AnalysisJobMachine {
  private currentState: JobState;

  /**
   * Initializes the state machine with an initial state.
   * @param initialState Initial state (defaults to 'idle').
   */
  constructor(initialState: JobState = "idle") {
    this.currentState = initialState;
  }

  /**
   * Returns the current state.
   * @returns Active JobState.
   */
  public getState(): JobState {
    return this.currentState;
  }

  /**
   * Validates if a transition to targetState is allowed.
   * @param targetState Target state to check.
   * @returns Boolean indicating whether transition is valid.
   */
  public canTransitionTo(targetState: JobState): boolean {
    const allowed = VALID_TRANSITIONS[this.currentState];
    return allowed ? allowed.includes(targetState) : false;
  }

  /**
   * Transitions state machine to targetState if valid.
   * @param targetState Target state to transition to.
   * @throws Error if transition is invalid.
   */
  public transitionTo(targetState: JobState): JobState {
    if (!this.canTransitionTo(targetState)) {
      throw new Error(
        `Invalid state transition: Cannot transition from '${this.currentState}' to '${targetState}'.`,
      );
    }
    this.currentState = targetState;
    return this.currentState;
  }

  /**
   * Helper utility checking if job has finished (completed, cancelled, or failed).
   * @param state State to evaluate.
   * @returns Boolean indicating terminal state.
   */
  public static isTerminal(state: JobState): boolean {
    return state === "completed" || state === "cancelled" || state === "failed";
  }
}
