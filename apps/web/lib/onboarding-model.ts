import { z } from "zod";

export const onboardingSchema = z.object({
  configured: z.boolean(),
  published: z.boolean(),
  tested: z.boolean(),
  connected: z.boolean(),
  completedAt: z.string().nullable(),
});
export type OnboardingState = z.infer<typeof onboardingSchema>;
export const setupSteps = [
  ["agent", "Configure your agent", "Agent configured"],
  ["knowledge", "Add business knowledge", "Knowledge published"],
  ["test", "Test a customer conversation", "Conversation tested"],
  ["channel", "Connect your first channel", "Channel activated"],
] as const;
export function setupProgress(state: OnboardingState) {
  const done = [
    state.configured,
    state.published,
    state.tested,
    state.connected,
  ];
  return {
    done,
    count: done.filter(Boolean).length,
    next: Math.max(0, done.indexOf(false)),
  };
}
export function activeSetupStep(state: OnboardingState, requested?: string) {
  const { done, next } = setupProgress(state);
  const index = setupSteps.findIndex(([key]) => key === requested);
  // Reopen completed steps; upcoming tasks cannot bypass prerequisites.
  return index >= 0 && (done[index] || index === next) ? index : next;
}
