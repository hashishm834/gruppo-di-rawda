import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://asgvergtvswvwtbjdwlk.supabase.co";

// حط هنا المفتاح الـ publishable اللي لسه نسخه كامل:
const supabaseAnonKey = "sb_publishable_gK4Q4uy4m1fl6Y2zxKsOTw_9V7-Sqzf";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);