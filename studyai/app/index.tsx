// app/index.tsx
import "react-native-url-polyfill/auto";
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Session } from "@supabase/supabase-js";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabaseClient";

WebBrowser.maybeCompleteAuthSession();

// 🔹 Native deep link (Android/iOS)
const nativeRedirectUri = Linking.createURL("/auth/callback");

export default function Index() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // check existing session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) router.replace("/home");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) router.replace("/home");
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // -------- GOOGLE LOGIN --------
  const signInWithGoogle = async () => {
    try {
      setLoading(true);

      if (Platform.OS === "web") {
        // 🔹 Web: let Supabase redirect to Google and back to Site URL
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
        });
        if (error) Alert.alert("Google Sign-In Failed", error.message);
        // After this call, browser will navigate away.
        return;
      }

      // 🔹 Native (Android/iOS): use deep link + WebBrowser
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: nativeRedirectUri,
        },
      });

      if (error) {
        Alert.alert("Google Sign-In Failed", error.message);
        return;
      }

      if (data?.url) {
        const res = await WebBrowser.openAuthSessionAsync(
          data.url,
          nativeRedirectUri
        );

        // If Supabase sent us back with a code, exchange it for a session
        if (res.type === "success" && res.url) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(res.url);
          if (exchangeError) {
            console.log("exchangeCodeForSession error:", exchangeError.message);
            Alert.alert("Login Error", exchangeError.message);
          }
        }
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  // -------- EMAIL SIGN UP / LOGIN --------

  const signUpWithEmail = async () => {
    if (!email || !password) {
      Alert.alert("Missing Fields", "Enter email and password.");
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        Alert.alert("Sign-Up Failed", error.message);
        return;
      }
      if (data.session) {
        setSession(data.session);
        router.replace("/home");
      } else {
        Alert.alert("Check Email", "Verify your email to continue.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async () => {
    if (!email || !password) {
      Alert.alert("Missing Fields", "Enter email and password.");
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        Alert.alert("Login Failed", error.message);
        return;
      }
      if (data.session) {
        setSession(data.session);
        router.replace("/home");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  // -------------- LOGIN UI --------------
  if (!session) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.title}>StudyAI</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={signInWithEmail}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.buttonText}>Login with Email</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={signUpWithEmail}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>

        <Text style={{ marginVertical: 12 }}>or</Text>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={signInWithGoogle}
          disabled={loading}
        >
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // While redirecting to /home, show a simple screen
  return (
    <SafeAreaView style={styles.center}>
      <ActivityIndicator />
    </SafeAreaView>
  );
}

// styles same as you already have…
const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  button: {
    width: "100%",
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 6,
  },
  secondaryButton: {
    backgroundColor: "#444",
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
  },
  googleButton: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#000",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  googleButtonText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "600",
  },
});
