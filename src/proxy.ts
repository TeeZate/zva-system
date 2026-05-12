import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const isConfigured =
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("your-project-ref");

export async function proxy(request: NextRequest) {
  // Pass pathname as a header so server components can read it
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  const supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (!isConfigured) return supabaseResponse;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { flowType: "implicit" },
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(toSet) {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        toSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/admin/login";
  const isTeamPortal = pathname.startsWith("/admin/team");

  // Redirect unauthenticated users away from admin
  if (isAdminRoute && !isLoginPage && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    return NextResponse.redirect(loginUrl);
  }

  // Role-based routing for authenticated admin users
  if (isAdminRoute && !isLoginPage && user) {
    // Look up role — use anon client (policy allows users to read their own row)
    const { data: adminRow } = await supabase
      .from("admin_users")
      .select("role, is_active")
      .eq("user_id", user.id)
      .single();

    if (adminRow && adminRow.is_active && adminRow.role === "team_admin" && !isTeamPortal) {
      // Team admins can only access /admin/team/*
      const teamUrl = request.nextUrl.clone();
      teamUrl.pathname = "/admin/team";
      return NextResponse.redirect(teamUrl);
    }
  }

  // Redirect authenticated users away from login page
  if (isLoginPage && user) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/admin";
    return NextResponse.redirect(dashboardUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
