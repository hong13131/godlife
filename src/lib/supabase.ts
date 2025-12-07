import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 서버 전용 Supabase 클라이언트 (JWT 검증 및 DB 호출에 사용)
export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

type AuthError = "missing_token" | "invalid_token" | null;

export async function getUserFromRequest(
  req: Request,
): Promise<{ user: User | null; error: AuthError }> {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return { user: null, error: "missing_token" };
  }

  const { data, error } = await supabaseServer.auth.getUser(token);
  if (error || !data.user) {
    return { user: null, error: "invalid_token" };
  }

  return { user: data.user, error: null };
}
