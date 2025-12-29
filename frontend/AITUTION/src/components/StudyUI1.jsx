import { useEffect, useState } from "react";
import { Brain, User, FileText, X } from "lucide-react";
import { supabase } from "../supabase";

/* ================= BACKEND CONFIG ================= */
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const STUDY_URL = `${BASE_URL}/api/study_material`;
const DASHBOARD_OVERVIEW = (id) =>
  `${BASE_URL}/api/dashboard/overview/${id}`;
const DASHBOARD_USER = (id) =>
  `${BASE_URL}/api/dashboard/user/${id}`;

/* ================= STUDY VIEWS ================= */
import SummaryView from "./SummaryView";
import FlashcardsView from "./FlashcardsView";
import Quiz from "./Quiz";
import AskQuestions from "./AskQuestions";
import RecommendedVideos from "./RecommendedVideos";

/* ================================================= */
export default function StudyUI({ user }) {
  /* ---------- UI STATE ---------- */
  const [view, setView] = useState("dashboard");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ---------- DATA STATE ---------- */
  const [material, setMaterial] = useState(null);

  /* ---------- DERIVED DATA (IMPORTANT FIX) ---------- */
  const keyPoints = material?.key_points || [];
  const videos = material?.videos || [];

  const [stats, setStats] = useState({
    quizzes: 0,
    accuracy: 0,
    documents: 0,
  });

  const [recent, setRecent] = useState([]);

  /* ============ LOAD DASHBOARD DATA ============ */
  useEffect(() => {
    if (!user?.id) return;

    (async () => {
      try {
        const statsRes = await fetch(DASHBOARD_OVERVIEW(user.id));
        const statsJson = await statsRes.json();

        setStats({
          quizzes: statsJson.global_stats?.total_attempts || 0,
          accuracy: statsJson.global_stats?.avg_accuracy || 0,
          documents: statsJson.global_stats?.total_materials || 0,
        });

        const recentRes = await fetch(DASHBOARD_USER(user.id));
        const recentJson = await recentRes.json();
        setRecent(recentJson.attempts?.slice(0, 3) || []);
      } catch (err) {
        console.error("Dashboard fetch failed", err);
      }
    })();
  }, [user]);

  /* ============ UPLOAD + GENERATE ============ */
  async function generateStudyMaterial() {
    if (!file) {
      alert("Please select a PDF");
      return;
    }

    setLoading(true);

    const form = new FormData();
    form.append("file", file);
    form.append("user_id", user.id);

    try {
      const res = await fetch(STUDY_URL, {
        method: "POST",
        body: form,
      });

      const json = await res.json();
      setMaterial(json);
      setView("summary");
    } catch (err) {
      console.error(err);
      alert("Failed to generate study material");
    } finally {
      setLoading(false);
    }
  }

  /* ============ STUDY SCREENS ============ */
  if (view !== "dashboard") {
    return (
      <div style={styles.page}>
        <button style={styles.backBtn} onClick={() => setView("dashboard")}>
          ← Back to Dashboard
        </button>

        {view === "summary" && (
          <SummaryView
            summary={material?.summary}
            keyTopics={material?.key_topics}
            keyPoints={keyPoints}
          />
        )}

        {view === "flashcards" && (
          <FlashcardsView cards={material?.flashcards || []} />
        )}

        {view === "quiz" && <Quiz quiz={material?.quiz || []} />}

        {view === "ask" && (
          <AskQuestions pdfText={material?.text || ""} />
        )}

        {view === "videos" && (
          <RecommendedVideos keyPoints={keyPoints} videos={videos} />
        )}
      </div>
    );
  }

  /* ================= DASHBOARD ================= */
  return (
    <div style={styles.page}>
      {/* HEADER */}
      <header style={styles.header}>
        <h1 style={styles.logo}>
          <Brain /> StudyAI
        </h1>
        <button
          onClick={() => supabase.auth.signOut()}
          style={styles.avatar}
        >
          <User />
        </button>
      </header>

      {/* HERO */}
      <div style={styles.hero}>
        <h2>Hey, {user?.email} 👋</h2>
        <p>Ready to boost your learning?</p>

        <div style={styles.statsRow}>
          <StatBox label="Quizzes" value={stats.quizzes} />
          <StatBox label="Accuracy" value={`${stats.accuracy}%`} />
          <StatBox label="Documents" value={stats.documents} />
        </div>
      </div>

      {/* UPLOAD CARD */}
      <div style={styles.uploadCard}>
        {!file ? (
          <label style={styles.uploadZone}>
            <div style={styles.uploadInner}>
              <div style={styles.uploadIcon}>
                <FileText size={28} />
              </div>
              <div>
                <div style={styles.uploadTitle}>Choose or drop a PDF</div>
                <div style={styles.uploadSub}>PDF only</div>
              </div>
            </div>

            <input
              type="file"
              accept="application/pdf"
              hidden
              onChange={(e) => setFile(e.target.files[0])}
            />
          </label>
        ) : (
          <>
            <div style={styles.filePreview}>
              <div style={styles.fileLeft}>
                <FileText size={20} />
                <div>
                  <div style={{ fontWeight: 600 }}>{file.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    PDF document
                  </div>
                </div>
              </div>

              <button style={styles.removeBtn} onClick={() => setFile(null)}>
                <X />
              </button>
            </div>

            <button
              style={{
                ...styles.generateBtn,
                opacity: loading ? 0.7 : 1,
              }}
              onClick={generateStudyMaterial}
              disabled={loading}
            >
              {loading ? "Generating…" : "Generate Study Materials"}
            </button>
          </>
        )}
      </div>

      {/* QUICK ACTIONS */}
      <h3 style={styles.sectionTitle}>Quick Actions</h3>
      <div style={styles.quickGrid}>
        <QuickBtn label="Summary" onClick={() => setView("summary")} />
        <QuickBtn label="Flashcards" onClick={() => setView("flashcards")} />
        <QuickBtn label="Quiz" onClick={() => setView("quiz")} />
        <QuickBtn label="Questions" onClick={() => setView("ask")} />
        <QuickBtn label="Videos" onClick={() => setView("videos")} />
      </div>

      {/* RECENT ACTIVITY */}
      <h3 style={styles.sectionTitle}>Recent Activity</h3>
      {recent.map((r, i) => (
        <div key={i} style={styles.recentCard}>
          <FileText />
          <div>
            <div>{r.file_name || "PDF"}</div>
            <small>Quiz Completed</small>
          </div>
          <b>{r.accuracy}%</b>
        </div>
      ))}
    </div>
  );
}

/* ================= SMALL COMPONENTS ================= */
function StatBox({ label, value }) {
  return (
    <div style={styles.statBox}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function QuickBtn({ label, onClick }) {
  return (
    <button style={styles.quickBtn} onClick={onClick}>
      {label}
    </button>
  );
}

/* ================= STYLES ================= */
const styles = {
  page: {
    minHeight: "100vh",
    background: "#F7F9FC",
    padding: 24,
    fontFamily: "system-ui",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color:"black"
  },
  logo: { display: "flex", gap: 8, fontSize: 26 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "white",
    border: "1px solid #E5E7EB",
    cursor: "pointer",
  },
  hero: {
    marginTop: 20,
    padding: 24,
    borderRadius: 24,
    background: "linear-gradient(135deg,#2B6EF6,#5B8DF8)",
    color: "white",
  },
  statsRow: { display: "flex", gap: 16, marginTop: 20 },
  statBox: {
    flex: 1,
    background: "rgba(255,255,255,0.2)",
    padding: 16,
    borderRadius: 16,
  },
  statValue: { fontSize: 32, fontWeight: 800 },
  statLabel: { fontSize: 13, opacity: 0.8 },
  uploadCard: {
    background: "white",
    borderRadius: 24,
    padding: 20,
    marginTop: 20,
    boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
  },
  uploadZone: {
    border: "2px dashed #CBD5E1",
    borderRadius: 24,
    padding: 24,
    cursor: "pointer",
    background: "#FFFFFF",
  },
  uploadInner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  uploadIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    border: "2px dashed #CBD5E1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadTitle: { fontSize: 16, fontWeight: 600 },
  uploadSub: { fontSize: 13, color: "#6B7280" },
  filePreview: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#ECFDF5",
    padding: "14px 16px",
    borderRadius: 18,
    marginBottom: 16,
  },
  fileLeft: { display: "flex", gap: 12, alignItems: "center" },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    border: "none",
    background: "white",
    cursor: "pointer",
  },
  generateBtn: {
    width: "100%",
    padding: "18px 0",
    borderRadius: 999,
    background: "#2563EB",
    color: "white",
    fontSize: 16,
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
  },
  sectionTitle: {
    marginTop: 28,
    marginBottom: 12,
    fontWeight: 700,
    color:"black"
  },
  quickGrid: { display: "flex", gap: 12, flexWrap: "wrap" },
  quickBtn: {
    background: "white",
    padding: "12px 18px",
    borderRadius: 16,
    border: "none",
    cursor: "pointer",
  },
  recentCard: {
    background: "white",
    padding: 16,
    borderRadius: 16,
    marginTop: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backBtn: {
    marginBottom: 16,
    background: "none",
    border: "none",
    color: "#2563EB",
    cursor: "pointer",
    fontWeight: 600,
  },
};
