"use client";

import { SessionProvider } from "@/hooks/useSession";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
