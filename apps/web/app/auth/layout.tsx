import type { ReactNode } from "react";
import { Brand } from "@/components/ui";
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-shell">
      <div className="auth-brand">
        <Brand />
      </div>
      <main className="auth-form-side">{children}</main>
      <footer className="auth-footer">Avenlyo · Customer workspace</footer>
    </div>
  );
}
