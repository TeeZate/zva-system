"use server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient, logSystemEvent } from "@/lib/supabase-admin";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

async function getAuthUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { flowType: "implicit" },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {},
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function uploadO2Form(formData: FormData): Promise<{ error: string | null }> {
  const user = await getAuthUser();
  if (!user) return { error: "Not authenticated" };

  const file = formData.get("file") as File | null;
  const season = (formData.get("season") as string | null)?.trim();
  const playerCount = formData.get("player_count") as string | null;
  const teamId = formData.get("team_id") as string | null;

  if (!file || file.size === 0) return { error: "No file selected" };
  if (!season) return { error: "Season is required" };
  if (!teamId) return { error: "Team not found" };

  const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Only PDF, JPG, PNG, or WEBP files are accepted" };
  }

  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
  if (file.size > MAX_SIZE) {
    return { error: "File must be under 10 MB" };
  }

  const db = createAdminClient();

  // Upload to Supabase Storage
  const ext = file.name.split(".").pop();
  const storagePath = `${teamId}/${season.replace(/\//g, "-")}/${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await db.storage
    .from("o2-forms")
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    await logSystemEvent({
      type: "storage_error",
      severity: "error",
      source: "o2_upload",
      message: `Storage upload failed: ${uploadError.message}`,
      details: { team_id: teamId, season, file_name: file.name, error: uploadError },
      user_email: user.email,
    });
    return { error: `Upload failed: ${uploadError.message}` };
  }

  const { data: publicUrlData } = db.storage
    .from("o2-forms")
    .getPublicUrl(storagePath);

  // Save record
  const { error: dbError } = await db.from("team_o2_uploads").insert({
    team_id: teamId,
    season,
    file_url: publicUrlData.publicUrl,
    file_name: file.name,
    file_size_bytes: file.size,
    player_count: playerCount ? parseInt(playerCount, 10) : null,
    status: "pending",
    uploaded_by: user.id,
  });

  if (dbError) {
    await logSystemEvent({
      type: "db_error",
      severity: "error",
      source: "o2_upload",
      message: `DB insert failed after storage upload: ${dbError.message}`,
      details: { team_id: teamId, season, storage_path: storagePath, error: dbError },
      user_email: user.email,
    });
    return { error: `Failed to save record: ${dbError.message}` };
  }

  return { error: null };
}

export async function getMyUploads(teamId: string) {
  const db = createAdminClient();
  const { data, error } = await db
    .from("team_o2_uploads")
    .select("*")
    .eq("team_id", teamId)
    .order("uploaded_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}
