// ONLY client‑side Supabase — never run this on the server
"use client";

import { createClient } from "@supabase/supabase-js";

// Must be NEXT_PUBLIC_…
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
