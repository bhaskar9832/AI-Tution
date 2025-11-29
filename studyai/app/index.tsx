// app/index.tsx  (one-file merged version)

import "react-native-url-polyfill/auto";
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { createClient } from "@supabase/supabase-js";

WebBrowser.maybeCompleteAuthSession();

// ---- SUPABASE NATIVE CONFIG (one file) ----
const SUPABASE_URL = "https://vrznjviqfqjojywnttiu.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_IiPm3MKq91Q7dMxHc75k7A_GsueY6tv";


const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// This is what YOU use in the app for redirect back into app
const redirectUri = Linking.createURL("/auth/callback");

export default function Index() {
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // Tell Supabase to send Google back → Supabase callback URL → Your app
          redirectTo: redirectUri, 
        },
      });

      if (error) {
        console.log("Login error:", error.message);
        return;
      }

      if (data?.url) {
        if (Platform.OS === "web") {
          // web
          window.location.href = data.url;
        } else {
          // mobile
          await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
        }
      }
    } catch (err) {
      console.log("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => supabase.auth.signOut();

  if (!session) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.title}>StudyAI Login</Text>
        <TouchableOpacity style={styles.button} onPress={signInWithGoogle} disabled={loading}>
          {loading ? <ActivityIndicator /> : <Text style={styles.buttonText}>Login with Google</Text>}
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.center}>
      <Text style={styles.title}>Logged in ✅</Text>
      <Text style={styles.text}>{session.user.email}</Text>
      <TouchableOpacity style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ---- UI styles ----  
const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "black",
    padding: 12,
    borderRadius: 8,
    minWidth: 220,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
});
