import React, { useState } from "react";
import { supabase } from "../supabase";


export default function AuthScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function loginEmail() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) return setErr(error.message);
    onLogin(data.user);
  }

  async function signupEmail() {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    if (error) return setErr(error.message);
    onLogin(data.user);
  }

  async function loginGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google"
    });
    if (error) setErr(error.message);
  }

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", textAlign: "center", paddingTop: 60 }}>
      <h2>StudyAI</h2>
      <p>AI-Powered Study Assistant</p>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", padding: 12, marginBottom: 12, borderRadius: 8 }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", padding: 12, marginBottom: 12, borderRadius: 8 }}
      />

      <button
        onClick={loginEmail}
        style={{ width: "100%", padding: 12, background: "black", color: "white", borderRadius: 8 }}
      >
        Login with Email
      </button>

      <button
        onClick={signupEmail}
        style={{ width: "100%", padding: 12, marginTop: 10, background: "#333", color: "white", borderRadius: 8 }}
      >
        Sign Up
      </button>

      <p style={{ margin: "18px 0" }}>or</p>

      <button
        onClick={loginGoogle}
        style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ccc" }}
      >
        Continue with Google
      </button>

      {err && <p style={{ color: "red", marginTop: 12 }}>{err}</p>}
    </div>
  );
}
