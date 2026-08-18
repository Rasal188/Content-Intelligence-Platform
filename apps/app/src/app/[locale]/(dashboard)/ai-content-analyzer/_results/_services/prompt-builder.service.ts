import { SYSTEM_PROMPT_V1 } from "./promptVersions/v1";
import { SYSTEM_PROMPT_V2, USER_PROMPT_V2 } from "./promptVersions/v2";

/**
 * Service responsible for constructing versioned, deterministic prompts for the AI gateway.
 * Dynamically switches layouts based on active environment options.
 */
export class PromptBuilderService {
  /**
   * Generates system and user prompts for the AI model.
   * @param version The version code of the prompt (e.g. "v1", "v2").
   * @param textContent The document text to analyze.
   * @returns System and User prompt strings.
   */
  public static buildPrompt(
    version: string,
    textContent: string,
  ): { system: string; user: string } {
    if (version === "v1") {
      const userPrompt = `Analyze the following document text:
---
${textContent}
---`;
      return {
        system: SYSTEM_PROMPT_V1,
        user: userPrompt,
      };
    }
    if (version === "v2") {
      return {
        system: SYSTEM_PROMPT_V2,
        user: USER_PROMPT_V2(textContent),
      };
    }
    throw new Error(`Unsupported prompt version: ${version}`);
  }
}
