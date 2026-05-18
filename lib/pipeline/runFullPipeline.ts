import { runIntakeAgent } from "@/lib/agents/intakeAgent";
import { runPrioritizationAgent } from "@/lib/agents/prioritizationAgent";
import { runSpecWriterAgent } from "@/lib/agents/specWriterAgent";
import { runSynthesisAgent } from "@/lib/agents/synthesisAgent";
import type { LLMClient } from "@/lib/llm/types";
import type {
  IntakeAgentOutput,
  PrioritizationAgentOutput,
  SpecWriterAgentOutput,
  SynthesisAgentOutput,
} from "@/lib/schemas";

export type FullPipelineInput = {
  notes: string;
  productName?: string;
  targetUser?: string;
};

export type FullPipelineOutput = {
  intake: IntakeAgentOutput;
  synthesis: SynthesisAgentOutput;
  prioritization: PrioritizationAgentOutput;
  spec: SpecWriterAgentOutput;
};

/**
 * Demo-oriented end-to-end chain: Intake → Synthesis → Prioritization → Spec Writer.
 * Each stage can also be invoked on its own with partial upstream JSON.
 */
export async function runFullPipeline(
  input: FullPipelineInput,
  deps?: { llm?: LLMClient },
): Promise<FullPipelineOutput> {
  const llm = deps?.llm;
  const intake = await runIntakeAgent(
    {
      notes: input.notes,
      productName: input.productName,
      targetUser: input.targetUser,
    },
    { llm },
  );

  const synthesis = await runSynthesisAgent(
    {
      rawInput: input.notes,
      intakeOutput: intake,
      productName: input.productName,
      targetUser: input.targetUser,
    },
    { llm },
  );

  const prioritization = await runPrioritizationAgent(
    {
      rawInput: input.notes,
      intakeOutput: intake,
      synthesisOutput: synthesis,
      productName: input.productName,
      targetUser: input.targetUser,
    },
    { llm },
  );

  const spec = await runSpecWriterAgent(
    {
      rawInput: input.notes,
      intakeOutput: intake,
      synthesisOutput: synthesis,
      prioritizationOutput: prioritization,
      productName: input.productName,
      targetUser: input.targetUser,
    },
    { llm },
  );

  return { intake, synthesis, prioritization, spec };
}
