/**
 * MAIN CHAT API ROUTE
 * ====================
 * This is the heart of the product. Every time a student sends a message,
 * the flow is:
 *
 * 1. Look up the project (which stage are they in, what do we know so far)
 * 2. Save their message to the database
 * 3. Call Claude with the right stage's system prompt + full conversation history
 * 4. Save Claude's reply to the database
 * 5. Check whether this stage is now complete (separate "judge" call)
 * 6. If complete, advance to the next stage and save updated context
 * 7. Return the reply (+ new stage, if it changed) to the frontend
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { STAGE_PROMPTS, Stage } from "@/lib/coaching/stage-prompts";
import { checkStageCompletion, nextStage } from "@/lib/coaching/stage-transitions";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Rough Claude Sonnet pricing for cost tracking (per million tokens).
// Check console.anthropic.com for current rates if these drift over time.
const INPUT_COST_PER_M = 3.0;
const OUTPUT_COST_PER_M = 15.0;

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // 1. Confirm the user is actually logged in
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { projectId, message } = await req.json();
  if (!projectId || !message) {
    return NextResponse.json({ error: "Missing projectId or message" }, { status: 400 });
  }

  // 2. Look up the project — RLS (Row Level Security) ensures this query
  // can only ever return a project that belongs to this logged-in user.
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const currentStage = project.stage as Stage;

  // 3. Save the student's message
  await supabase.from("messages").insert({
    project_id: projectId,
    role: "user",
    content: message,
    stage_at_time: currentStage,
  });

  // 4. Pull the full conversation history for this project, so Claude has
  // full context — LLMs are stateless between calls, so we resend the
  // whole relevant history every time. This is a core fact about how
  // these models work: there's no persistent memory inside the model
  // itself between API calls, only what we explicitly include each time.
  const { data: history } = await supabase
    .from("messages")
    .select("role, content")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  const claudeMessages = (history ?? []).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // 5. Call Claude with the current stage's system prompt
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: STAGE_PROMPTS[currentStage],
    messages: claudeMessages,
  });

  const replyBlock = response.content.find((b) => b.type === "text");
  const replyText = replyBlock && replyBlock.type === "text" ? replyBlock.text : "";

  // 6. Save Claude's reply
  await supabase.from("messages").insert({
    project_id: projectId,
    role: "assistant",
    content: replyText,
    stage_at_time: currentStage,
  });

  // 7. Track API cost — this is what lets you later answer "is this
  // profitable per student" with a real number instead of a guess.
  const estimatedCost =
    (response.usage.input_tokens / 1_000_000) * INPUT_COST_PER_M +
    (response.usage.output_tokens / 1_000_000) * OUTPUT_COST_PER_M;

  await supabase.from("api_usage").insert({
    project_id: projectId,
    input_tokens: response.usage.input_tokens,
    output_tokens: response.usage.output_tokens,
    estimated_cost_usd: estimatedCost,
  });

  // 8. Check if this stage is complete, possibly advance
  const conversationText = claudeMessages
    .concat([{ role: "assistant", content: replyText }])
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");

  const check = await checkStageCompletion(
    currentStage,
    conversationText,
    project.context ?? {}
  );

  let updatedStage = currentStage;
  if (check.stageComplete) {
    updatedStage = nextStage(currentStage);
  }

  await supabase
    .from("projects")
    .update({
      context: check.extractedContext,
      stage: updatedStage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  return NextResponse.json({
    reply: replyText,
    stage: updatedStage,
    stageChanged: updatedStage !== currentStage,
  });
}
