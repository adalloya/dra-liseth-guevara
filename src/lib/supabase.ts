import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://kripphmingdxnkwkpglo.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyaXBwaG1pbmdkeG5rd2twZ2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNzc1NzksImV4cCI6MjEwNzc1MzU3OX0.bq9dmdINJE_4hdA0WwObaPykkU6m2DsasDpX0JULZBw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
