import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zaamyxkkzeyiwhuhbcyw.supabase.co";
const supabaseAnonKey = "sb_publishable_4oSia8Jbv7s_r5gQYZTGlw_SQ6FJjzW";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
