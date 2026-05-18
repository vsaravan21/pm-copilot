import { useCallback, useState } from "react";

import type { IntakeAgentOutput } from "@/lib/schemas";

export function useIntakeWorkspace() {
  const [notes, setNotes] = useState("");
  const [productName, setProductName] = useState("");
  const [targetUser, setTargetUser] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IntakeAgentOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runIntake = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes,
          productName: productName.trim() || undefined,
          targetUser: targetUser.trim() || undefined,
        }),
      });

      let payloadUnknown: unknown;
      try {
        payloadUnknown = await response.json();
      } catch {
        throw new Error("Unable to decode server JSON response.");
      }

      if (!response.ok) {
        const message =
          typeof (payloadUnknown as { error?: string }).error === "string"
            ? (payloadUnknown as { error: string }).error
            : "Intake request failed";
        throw new Error(message);
      }

      const payload = payloadUnknown as IntakeAgentOutput;

      const requiredKeys = [
        "inputType",
        "detectedTask",
        "productContext",
        "keyObservations",
        "potentialPainPoints",
        "potentialOpportunities",
        "missingContextQuestions",
        "confidence",
      ] as const;

      for (const key of requiredKeys) {
        if (!(key in payload)) {
          throw new Error(`Malformed response missing field: ${key}`);
        }
      }

      setResult(payload);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Unexpected error while contacting Intake Agent";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [notes, productName, targetUser]);

  return {
    notes,
    setNotes,
    productName,
    setProductName,
    targetUser,
    setTargetUser,
    loading,
    result,
    error,
    runIntake,
  };
}
