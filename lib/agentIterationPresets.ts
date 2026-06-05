export const PRIORITIZATION_RERANK_PRESETS = [
  "Prioritize for fastest MVP",
  "Prioritize for highest user impact",
  "Prioritize for lowest technical complexity",
  "Prioritize for strongest evidence",
  "Prioritize for highest business value",
  "Prioritize for executive roadmap pitch",
  "Penalize high-risk items more heavily",
  "Give more weight to student-facing impact",
  "Give more weight to org leader value",
] as const;

export const SPEC_WRITER_REFINE_PRESETS = [
  "Make this more concise",
  "Narrow the MVP scope",
  "Add stronger success metrics",
  "Expand the user stories",
  "Make this more stakeholder-ready",
  "Add technical requirements",
  "Rewrite this for an executive audience",
  "Add launch considerations",
  "Make the risks more specific",
  "Turn this into a more polished PRD",
] as const;
