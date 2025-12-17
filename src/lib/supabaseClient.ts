import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Eğer build sırasında bu değerler eksikse hata fırlatmak yerine 
// boş değerle başlatıyoruz ki build işlemi yarıda kesilmesin.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);