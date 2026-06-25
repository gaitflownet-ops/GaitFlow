import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { Database } from "./supabase.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileUpsert = Database["public"]["Tables"]["profiles"]["Insert"];

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "US";

export function profileFromAuthUser(user: User): ProfileUpsert {
  const meta = user.user_metadata || {};
  const name =
    typeof meta.name === "string" && meta.name.trim()
      ? meta.name
      : user.email?.split("@")[0] || "New User";

  return {
    id: user.id,
    name,
    role: typeof meta.role === "string" && meta.role ? meta.role : "Owner",
    stable_name: typeof meta.stable_name === "string" ? meta.stable_name : null,
    initials:
      typeof meta.initials === "string" && meta.initials ? meta.initials : getInitials(name),
    phone: typeof meta.phone === "string" ? meta.phone : null,
  };
}

export async function upsertProfile(profile: ProfileUpsert) {
  const { data, error } = await (supabase.from("profiles") as any)
    .upsert(profile, { onConflict: "id" })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function loadOrCreateProfile(user: User): Promise<Profile> {
  const { data: existingProfile, error: selectError } = await (supabase.from("profiles") as any)
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfile) {
    return existingProfile;
  }

  if (selectError) {
    console.warn("Could not load profile, repairing from auth metadata.", selectError);
  }

  return upsertProfile(profileFromAuthUser(user));
}

export function buildProfileInput(input: {
  id: string;
  name: string;
  role: string;
  stableName?: string;
  phone?: string;
}) {
  return {
    id: input.id,
    name: input.name,
    role: input.role,
    stable_name: input.stableName || null,
    phone: input.phone || null,
    initials: getInitials(input.name),
  } satisfies ProfileUpsert;
}
