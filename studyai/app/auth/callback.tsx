// app/auth/callback.tsx
import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabaseClient";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const finishAuth = async () => {
      try {
        if (Platform.OS === "web") {
          const url = window.location.href;
          // This reads ?code=... from the URL and creates the session
          const { error } = await supabase.auth.exchangeCodeForSession(url);
          if (error) {
            console.log("exchangeCodeForSession error:", error.message);
          }
        }
      } finally {
        // After handling, go to home (Index will redirect if session exists)
        router.replace("/home");
      }
    };

    finishAuth();
  }, [router]);

  return (
    <View style={styles.center}>
      <ActivityIndicator />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
