// app/firebaseClient.ts
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// ⚠️ use your real web config from Firebase console (Web app)
const firebaseConfig = {
  apiKey: "AIzaSyCTqPxI1bcu3XpaRnfKUpn7TcK65tSnwA0",
  authDomain: "studyai-d6466.firebaseapp.com",
  projectId: "studyai-d6466",
  storageBucket: "studyai-d6466.firebasestorage.app",
  messagingSenderId: "232942429602",
  appId: "1:232942429602:android:dfd59e9afe9bbd8d53befb",
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]!;
}

export const auth = getAuth(app);
export const db = getDatabase(app);