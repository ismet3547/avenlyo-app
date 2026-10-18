import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { Brand } from "@/components/ui";
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-shell">
      <aside className="auth-story">
        <Brand />
        <div className="auth-story-content">
          <p className="eyebrow">MORE HUMAN. LESS BUSYWORK.</p>
          <h2>
            A warm welcome.
            <br />A thoughtful answer.
            <br />
            <span>Every single time.</span>
          </h2>
          <p>
            Your customer conversations, business knowledge and AI agent.
            Finally, in one calm place.
          </p>
          <div className="auth-chat-preview" aria-hidden="true">
            <div className="auth-chat-header">
              <Brand compact />
              <span>Your AI front office</span>
            </div>
            <div className="auth-chat-bubble customer">
              Hi! I’d love to learn more about your services.
            </div>
            <div className="auth-chat-bubble">
              Of course. I’m here to help you find just what you need.
            </div>
          </div>
          <p className="auth-proof">
            <ShieldCheck aria-hidden="true" />
            Helpful by design. Your team in control.
          </p>
        </div>
        <p className="auth-story-footer">Made for better conversations.</p>
      </aside>
      <div className="auth-form-side">{children}</div>
    </div>
  );
}
