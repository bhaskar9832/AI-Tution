// app/revision-quiz.tsx
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useStudy, QUIZ_PERFORMANCE_URL } from "../StudyContext";

function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export default function RevisionQuizScreen() {
  const { apiData, user } = useStudy();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState<number>(0);

  // submit/sync state
  const [saving, setSaving] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSavedScore, setLastSavedScore] = useState<number | null>(null);

  if (!apiData) return messageScreen("No study data yet. Upload a PDF.");
  const allQuiz = (apiData as any).quiz || [];
  if (!allQuiz.length) return messageScreen("No quiz questions generated.");

  const materialId = (apiData as any)?.material_id || null;
  const quizStats = (apiData as any)?.quiz_stats || null;
  const perQuestionStats =
    (quizStats && (quizStats as any).per_question) || {};

  // --------- Build list of "revision" questions from stats ----------
  const revisionIndices: number[] = [];
  allQuiz.forEach((q: any, idx: number) => {
    const statsForQ = perQuestionStats[String(idx)];
    if (!statsForQ) return;

    const attempts = statsForQ.attempts ?? 0;
    const correct = statsForQ.correct ?? 0;

    if (attempts === 0) return; // never attempted yet → not revision

    const accuracy = attempts > 0 ? correct / attempts : 0;
    const needsRevision =
      (attempts >= 1 && correct === 0) || (attempts >= 3 && accuracy < 0.5);

    if (needsRevision && idx >= 0 && idx < allQuiz.length) {
      revisionIndices.push(idx);
    }
  });

  const revisionQuiz = revisionIndices.map((i) => allQuiz[i]);

  if (!revisionQuiz.length) {
    return messageScreen(
      "No revision questions right now — you're doing well on all attempted questions!"
    );
  }

  // ---------- Submit performance ONLY when user taps button ----------
  const submitPerformance = async () => {
    if (!user?.id || !materialId) {
      Alert.alert("Not saved", "Login or material info missing.");
      return;
    }

    if (!Object.keys(answers).length) {
      Alert.alert("No answers", "Answer at least one question before submitting.");
      return;
    }

    // convert {3: "A"} -> {"3": "A"}
    const answersPayload: Record<string, string | null> = {};
    Object.entries(answers).forEach(([k, v]) => {
      answersPayload[String(k)] = v ?? null;
    });

    const payload = {
      user_id: user.id,
      material_id: materialId,
      answers: answersPayload,
    };

    try {
      setSaving(true);
      setSyncError(null);

      const resp = await fetch(QUIZ_PERFORMANCE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await resp.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {
        console.log("revision quiz_performance non-JSON:", text);
      }

      if (!resp.ok || (json && json.error)) {
        console.log(
          "revision quiz_performance error:",
          resp.status,
          json || text
        );
        setSyncError("Submit failed");
        Alert.alert("Error", "Could not submit revision quiz.");
        return;
      }

      console.log("revision quiz_performance saved:", json);
      setLastSavedScore(score);
      Alert.alert("Submitted", "Your revision quiz has been saved.");
    } catch (err: any) {
      console.log("revision quiz_performance request error:", err);
      setSyncError("Submit error");
      Alert.alert("Error", "Network error while submitting.");
    } finally {
      setSaving(false);
    }
  };

  // ---------- Local tap handler: ONLY updates state + local score ----------
  const selectOption = (revisionIdx: number, opt: string) => {
    const originalIdx = revisionIndices[revisionIdx];
    const newAnswers = { ...answers, [originalIdx]: opt };
    setAnswers(newAnswers);

    // recompute score only over revision questions
    const newScore = revisionIndices.reduce((acc, origIdx) => {
      const userAns = newAnswers[origIdx];
      const q = allQuiz[origIdx];
      if (userAns && userAns === q.answer) return acc + 1;
      return acc;
    }, 0);
    setScore(newScore);
  };

  const syncStatusLabel = () => {
    if (!user?.id || !materialId) return "Not logged in / no material";
    if (saving) return "Submitting...";
    if (syncError) return syncError;
    if (lastSavedScore !== null) return "Submitted";
    return "Not submitted yet";
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.quizContent}
      >
        {revisionQuiz.map((q: any, revIdx: number) => {
          const originalIdx = revisionIndices[revIdx];
          const selected = answers[originalIdx];
          const statsForQ = perQuestionStats[String(originalIdx)] || null;

          const attempts = statsForQ?.attempts ?? 0;
          const correct = statsForQ?.correct ?? 0;
          const skipped = statsForQ?.skipped ?? 0;

          return (
            <Card key={originalIdx} style={styles.questionCard}>
              {/* Question header */}
              <View style={{ marginBottom: 10 }}>
                <Text style={styles.questionNumber}>
                  Rev Q{revIdx + 1} (Original #{originalIdx + 1})
                </Text>
                <Text style={styles.questionText}>{q.question}</Text>

                {statsForQ && (
                  <Text style={styles.revisionTag}>
                    Attempts: {attempts} · Correct: {correct} · Skipped:{" "}
                    {skipped}
                  </Text>
                )}
              </View>

              {/* Options */}
              {q.options?.map((opt: string, i: number) => {
                const hasSelected = !!selected;
                const isSelected = selected === opt;
                const isCorrect = q.answer === opt;

                let bg = "#F3F4F6";
                if (hasSelected) {
                  if (isCorrect) bg = "#DCFCE7"; // green
                  else if (isSelected && !isCorrect) bg = "#FECACA"; // red
                }

                const optionLetter = String.fromCharCode(65 + i);

                return (
                  <Pressable
                    key={i}
                    onPress={() => selectOption(revIdx, opt)}
                    style={[styles.optionButton, { backgroundColor: bg }]}
                  >
                    <View style={styles.optionCircle}>
                      <Text style={styles.optionCircleText}>
                        {optionLetter}
                      </Text>
                    </View>
                    <Text style={styles.optionText}>{opt}</Text>
                  </Pressable>
                );
              })}

              {/* Explanation */}
              {selected && (
                <View style={styles.explanationBlock}>
                  <View style={styles.explanationDivider} />
                  <Text style={styles.explanationLabel}>Explanation</Text>
                  <Text style={styles.explanationBody}>{q.explanation}</Text>
                </View>
              )}
            </Card>
          );
        })}
      </ScrollView>

      {/* Bottom bar with Submit */}
      <View style={styles.scoreBarWrapper}>
        <LinearGradient
          colors={["#2563EB", "#9333EA"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.scoreBarContainer}
        >
          <View style={styles.scoreBarInner}>
            <View>
              <Text style={styles.scoreLabel}>Revision Score</Text>
              <Text style={styles.scoreValue}>
                {score} / {revisionQuiz.length}
              </Text>
            </View>

            <View style={styles.rightBlock}>
              <Text style={styles.syncStatusText}>{syncStatusLabel()}</Text>
              <Pressable
                style={[
                  styles.submitButton,
                  saving && styles.submitButtonDisabled,
                ]}
                onPress={submitPerformance}
                disabled={saving}
              >
                <Text style={styles.submitButtonText}>
                  {saving ? "Submitting..." : "Submit"}
                </Text>
              </Pressable>
            </View>
          </View>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
}

/* Helper screen for no quiz / no data */
function messageScreen(text: string) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View
          style={{
            backgroundColor: "white",
            padding: 16,
            borderRadius: 16,
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <Text>{text}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6F6F6",
  },
  scroll: { flex: 1 },
  quizContent: {
    padding: 16,
    paddingBottom: 120,
  },

  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  questionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  questionNumber: {
    fontWeight: "700",
    fontSize: 15,
    color: "#2563EB",
    marginBottom: 4,
  },
  questionText: {
    fontWeight: "600",
    fontSize: 16,
    color: "#111827",
  },

  revisionTag: {
    marginTop: 4,
    fontSize: 11,
    color: "#6B7280",
  },

  optionButton: {
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  optionCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  optionCircleText: {
    fontWeight: "600",
    color: "#374151",
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: "#1F2937",
  },

  explanationBlock: {
    marginTop: 12,
  },
  explanationDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginBottom: 8,
  },
  explanationLabel: {
    color: "#2563EB",
    fontWeight: "600",
    fontSize: 13,
    marginBottom: 4,
  },
  explanationBody: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
  },

  scoreBarWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    height: 80,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 12,
  },
  scoreBarContainer: {
    width: "88%",
    height: 55,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreBarInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "88%",
  },
  scoreLabel: {
    fontWeight: "600",
    color: "white",
    fontSize: 15,
  },
  scoreValue: {
    fontWeight: "700",
    color: "white",
    fontSize: 15,
  },
  rightBlock: {
    alignItems: "flex-end",
  },
  syncStatusText: {
    color: "white",
    fontSize: 11,
    textAlign: "right",
    maxWidth: 170,
    marginBottom: 4,
  },
  submitButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },
});
