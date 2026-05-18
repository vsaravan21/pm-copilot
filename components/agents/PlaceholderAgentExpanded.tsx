import { AgentOutputPlaceholder } from "@/components/AgentOutputPlaceholder";

import { SectionLabel } from "./SectionLabel";

export function PlaceholderAgentExpanded({
  inputLead,
  inputDetail,
  bullets,
}: {
  inputLead: string;
  inputDetail: string;
  bullets: string[];
}) {
  return (
    <div className="space-y-6 pt-2">
      <div className="space-y-2">
        <SectionLabel>Input source</SectionLabel>
        <p className="text-sm font-medium text-pm-text">{inputLead}</p>
        <p className="text-sm leading-relaxed text-pm-muted">{inputDetail}</p>
      </div>
      <div className="space-y-2">
        <SectionLabel>Full output preview</SectionLabel>
        <AgentOutputPlaceholder bullets={bullets} />
      </div>
    </div>
  );
}
