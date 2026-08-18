import type { AnalysisResultDomain } from "../../_types/analysis-result.types";
import type { IAnalysisProvider } from "./interfaces/IAnalysisProvider";

interface RetriableError {
  status: number;
  message: string;
  isRetriable: boolean;
}

/**
 * Production AI Provider that integrates with the Ollima API gateway.
 * Implements the IAnalysisProvider contract.
 */
export class OllimaResultProvider implements IAnalysisProvider {
  /**
   * Generates analysis results via the Ollima proxy.
   * @param jobId Analysis Job ID.
   * @param documentName Name of document.
   * @param textContent Extracted content text.
   * @param requestId Generated request ID.
   * @returns Mapped domain model directly validated by the server API.
   */
  public async analyze(
    jobId: string,
    documentName: string,
    textContent: string = "",
    requestId: string = `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    analysisType?: string
  ): Promise<AnalysisResultDomain> {
    const runAnalysisCall = async (): Promise<{ providerRequestId?: string; result: unknown }> => {
      const response = await fetch("/api/ollima/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: textContent,
          jobId,
          documentName,
          analysisType,
        }),
      });

      if (!response.ok) {
        const errData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        const errMsg = typeof errData.error === "string" 
          ? errData.error 
          : `Ollima API error with status: ${response.status}`;
        
        throw {
          status: response.status,
          message: errMsg,
          isRetriable: response.status === 422,
        } as RetriableError;
      }

      return await response.json();
    };

    let attemptData: { providerRequestId?: string; result: unknown };
    try {
      attemptData = await runAnalysisCall();
    } catch (err) {
      const rErr = err as RetriableError;
      if (rErr && rErr.isRetriable) {
        console.warn("JSON parsing failure on server. Retrying once...", rErr.message);
        attemptData = await runAnalysisCall();
      } else {
        throw new Error(rErr?.message || "Ollima API analysis request failed.");
      }
    }

    if (!attemptData.result || typeof attemptData.result !== "object") {
      throw new Error("Invalid response received from the analysis gateway.");
    }

    return attemptData.result as AnalysisResultDomain;
  }
}
