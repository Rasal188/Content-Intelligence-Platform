import { MASTER_SYSTEM_PROMPT } from "../prompts/master.prompt";

export const SYSTEM_PROMPT_V2 = MASTER_SYSTEM_PROMPT;
export const USER_PROMPT_V2 = (textContent: string) => `
Analyze the following document text strictly according to the forensic investigator guidelines and JSON output schema:
---
${textContent}
---
`;
