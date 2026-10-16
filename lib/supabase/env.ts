// Public values: safe to expose client-side. Row Level Security protects the data.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ogzupulwrqismtlwhtos.supabase.co";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nenVwdWx3cnFpc210bHdodG9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3Njc2NjYsImV4cCI6MjEwMzM0MzY2Nn0.1zjBTRpv0vhdj19GYLTbIIr02XxyuJu9jRwCAGoZQc8";
