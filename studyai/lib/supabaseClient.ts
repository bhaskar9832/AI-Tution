// lib/supabaseClient.ts
import "react-native-url-polyfill/auto";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://vrznjviqfqjojywnttiu.supabase.co";
const SUPABASE_ANON_KEY =
  "sb_publishable_IiPm3MKq91Q7dMxHc75k7A_GsueY6tv";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    ...(Platform.OS !== "web" ? { storage: AsyncStorage } : {}),
    persistSession: true,
    autoRefreshToken: true,
    // 🔹 let Supabase read the URL & finish OAuth on web
    detectSessionInUrl: Platform.OS === "web",
  },
});
