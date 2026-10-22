import { describe, expect, it } from "vitest";
import {
  activeSetupStep,
  setupProgress,
  type OnboardingState,
} from "./onboarding-model";
const fresh: OnboardingState = {
  configured: false,
  published: false,
  tested: false,
  connected: false,
  completedAt: null,
};
describe("resumable setup navigation", () => {
  it("starts at the first unfinished milestone", () => {
    expect(setupProgress(fresh)).toEqual({
      done: [false, false, false, false],
      count: 0,
      next: 0,
    });
    expect(
      activeSetupStep({ ...fresh, configured: true, published: true }),
    ).toBe(2);
  });
  it("does not permit a URL to skip prerequisites", () => {
    expect(activeSetupStep(fresh, "channel")).toBe(0);
    expect(activeSetupStep({ ...fresh, configured: true }, "test")).toBe(1);
  });
  it("reopens completed steps and tolerates invalid URL values", () => {
    const state = { ...fresh, configured: true, published: true };
    expect(activeSetupStep(state, "agent")).toBe(0);
    expect(activeSetupStep(state, "knowledge")).toBe(1);
    expect(activeSetupStep(state, "invalid")).toBe(2);
  });
  it("does not confuse a published draft count with the published milestone", () => {
    expect(setupProgress({ ...fresh, configured: true }).count).toBe(1);
    expect(
      setupProgress({
        ...fresh,
        configured: true,
        published: true,
        tested: true,
        connected: true,
      }).count,
    ).toBe(4);
  });
});
