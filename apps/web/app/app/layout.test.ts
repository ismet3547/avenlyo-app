import { describe, expect, it, vi } from "vitest";
import { productContext } from "@/lib/product-data";
import { onboardingState } from "@/lib/onboarding";
import { AppShell } from "@/components/app-shell";
import AppLayout from "./layout";
vi.mock("@/lib/product-data", () => ({ productContext: vi.fn() }));
vi.mock("@/lib/onboarding", () => ({ onboardingState: vi.fn() }));
vi.mock("@/components/app-shell", () => ({ AppShell: vi.fn() }));
describe("activation preserves the shared form shell", () => {
  it.each([
    { completedAt: null, connected: false },
    { completedAt: "2026-10-20T10:00:00Z", connected: true },
    { completedAt: "2026-10-20T10:00:00Z", connected: false },
  ])(
    "retains the shared shell for completion=$completedAt, connected=$connected",
    async ({ completedAt, connected }) => {
      vi.mocked(productContext).mockResolvedValue({
        workspace: { id: "workspace", name: "Studio" },
        workspaces: [],
        role: "owner",
        user: { email: "owner@example.test" },
      } as unknown as Awaited<ReturnType<typeof productContext>>);
      vi.mocked(onboardingState).mockResolvedValue({
        configured: true,
        published: true,
        tested: true,
        connected,
        completedAt,
      });
      const element = await AppLayout({ children: "saved form" });
      expect(element.type).toBe(AppShell);
      expect(element.props.setup).toBe(!completedAt);
      expect(element.props.children).toBe("saved form");
    },
  );
});
