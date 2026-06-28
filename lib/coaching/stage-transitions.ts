/**
 * STAGE TRANSITIONS
 * =================
 * Decides when a project is ready to move from one coaching stage to the
 * next (e.g. interest_capture -> idea_narrowing).
 *
 * APPROACH: rather than writing brittle keyword-matching rules ourselves
 * ("if message contains 'grade' set grade_level..."), we ask Claude itself
 * to look at the conversation so far and output a structured judgment:
 * has this stage's goal actually been met? This is a common, important
 * pattern in real AI products — using the model for structured extraction
 * and decision-making, not just free-form chat.
 */
import Anthropic from "@anthropic-ai/sdk";
import { Stage } from "./stage-prompts";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const STAGE_ORDER: Stage[] = [
  "interest_capture",
  "idea_narrowing",
  "methodology",
  "iteration",
  "writeup",
];

export function nextStage(current: Stage): Stage {
  const idx = STAGE_ORDER.indexOf(current);
  if (idx === -1 || idx === STAGE_ORDER.length - 1) return current;
  return STAGE_ORDER[idx + 1];
}

type StageCheckResult = {
  stageComplete: boolean;
  extractedContext: Record<string, unknown>;
  reasoning: string;
};

/**
 * Asks Claude to judge, based on the conversation so far, whether the
 * current stage's goal has actually been met — and to extract any
 * structured facts learned along the way (grade level, chosen idea, etc.)
 * into the project's `context` JSON field.
 */
export async function checkStageCompletion(
  stage: Stage,
  conversationText: string,
  existingContext: Record<string, unknown>
): Promise<StageCheckResult> {
  const goalsByStage: Record<Stage, string> = {
    interest_capture:
      "A specific, real area of interest has been identified (not just a generic school subject), AND the student's grade level and rough deadline/timeline are known.",
    idea_narrowing:
      "A single, specific, feasible, sufficiently original project idea has been agreed on, stated as a testable question — not just a topic.",
    methodology:
      "A clear, realistic methodology exists: hypothesis, method, materials, and timeline, specific enough to start executing.",
    iteration:
      "The student has reported real results or data and demonstrates understanding of what those results mean.",
    writeup:
      "A complete draft covering abstract, introduction, methods, results, and discussion exists.",
  };

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system: `You are a structured extraction assistant. You will be shown a coaching conversation and the goal of the CURRENT stage. Respond ONLY with a JSON object, no other text, no markdown fences. The JSON must have this exact shape:
{
  "stageComplete": boolean,
  "extractedContext": { ...any new facts learned, merged with existing context... },
  "reasoning": "one sentence explaining your judgment"
}

Be conservative: only mark stageComplete true if the goal is clearly, fully met based on the actual conversation content.`,
    messages: [
      {
        role: "user",
        content: `CURRENT STAGE: ${stage}
STAGE GOAL: ${goalsByStage[stage]}
EXISTING CONTEXT: ${JSON.stringify(existingContext)}

CONVERSATION SO FAR:
${conversationText}

Has the stage goal been met? Extract any new facts.`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return { stageComplete: false, extractedContext: existingContext, reasoning: "No response" };
  }

  try {
    return JSON.parse(textBlock.text);
  } catch {
    // If parsing fails, fail safe: don't advance the stage, keep existing context.
    return { stageComplete: false, extractedContext: existingContext, reasoning: "Parse error" };
  }
}
