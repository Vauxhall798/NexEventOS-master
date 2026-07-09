import { DashboardShellClient } from "./DashboardShellClient";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return <DashboardShellClient>{children}</DashboardShellClient>;
}
