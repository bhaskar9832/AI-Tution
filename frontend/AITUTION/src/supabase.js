// src/supabase.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://vrznjviqfqjojywnttiu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyem5qdmlxZnFqb2p5d250dGl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNjM5MTYsImV4cCI6MjA3OTkzOTkxNn0.n7ZrUbAXB9aRWABS0OeHbORdB7xSfc2cdg4ruww_KxM";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
