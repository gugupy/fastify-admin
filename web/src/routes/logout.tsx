import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useRbac } from "../lib/rbac";

export const Route = createFileRoute("/logout")({
  component: LogoutPage,
});

function LogoutPage() {
  const { refresh } = useRbac();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/logout", { method: "POST" }).finally(async () => {
      await refresh();
      router.navigate({ to: "/login" });
    });
  }, [refresh, router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
      Signing out…
    </div>
  );
}
