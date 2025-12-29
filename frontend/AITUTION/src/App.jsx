import React, { useState, useEffect } from "react";
import AuthScreen from "./components/AuthScreen.jsx";
import StudyUI from "./components/StudyUI.jsx";
import { supabase } from "./supabase.js";

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // ❌ If nobody is logged in → show login screen
  if (!user) return <AuthScreen />;

  // ✅ If logged in → show the full Study UI
  return <StudyUI user={user} />;
}
