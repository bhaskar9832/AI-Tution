import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useStudy } from "./StudyContext";

function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export default function QuizScreen() {
  const { apiData } = useStudy();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState<number>(0);

  if (!apiData) return messageScreen("No study data yet. Upload a PDF.");
  const quiz = apiData.quiz || [];
  if (!quiz.length) return messageScreen("No quiz questions generated.");

  const selectOption = (qIdx: number, opt: string) => {
    const newAnswers = { ...answers, [qIdx]: opt };
    setAnswers(newAnswers);

    const newScore = quiz.reduce((acc: number, q: any, idx: number) => {
      return newAnswers[idx] === q.answer ? acc + 1 : acc;
    }, 0);
    setScore(newScore);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Quiz Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.quizContent}
      >
        {quiz.map((q: any, idx: number) => {
          const selected = answers[idx];

          return (
            <Card key={idx} style={styles.questionCard}>
              {/* Question header */}
              <View style={{ marginBottom: 10 }}>
                <Text style={styles.questionNumber}>Q{idx + 1}</Text>
                <Text style={styles.questionText}>{q.question}</Text>
              </View>

              {/* Options */}
              {q.options?.map((opt: string, i: number) => {
                const hasSelected = !!selected;
                const isSelected = selected === opt;
                const isCorrect = q.answer === opt;

                let bg = "#F3F4F6"; // default
                if (hasSelected) {
                  if (isCorrect) bg = "#DCFCE7"; // green for correct
                  else if (isSelected && !isCorrect) bg = "#FECACA"; // red for wrong selected
                }

                const optionLetter = String.fromCharCode(65 + i);

                return (
                  <Pressable
                    key={i}
                    onPress={() => selectOption(idx, opt)}
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

      {/* Bottom white bar + gradient pill */}
      <View style={styles.scoreBarWrapper}>
        <LinearGradient
          colors={["#2563EB", "#9333EA"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.scoreBarContainer}
        >
          <View style={styles.scoreBarInner}>
            <Text style={styles.scoreLabel}>Score</Text>
            <Text style={styles.scoreValue}>
              {score} / {quiz.length}
            </Text>
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
    paddingBottom: 120, // space so last card doesn't hide under score bar
  },

  // Generic card
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

  // Fancy question card
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

  // Options
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

  explanationText: {
    marginTop: 8,
    color: "#6B7280",
    fontSize: 12,
  },

  // Outer white box at bottom
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

  // Gradient pill
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
  explanationBlock: {
  marginTop: 12,
},

explanationDivider: {
  height: 1,
  backgroundColor: "#E5E7EB", // light gray line
  marginBottom: 8,
},

explanationLabel: {
  color: "#2563EB", // blue like the design
  fontWeight: "600",
  fontSize: 13,
  marginBottom: 4,
},

explanationBody: {
  fontSize: 13,
  color: "#4B5563", // gray-600
  lineHeight: 18,
},

});
