import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";
import { useStudy } from "./StudyContext";

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export default function FlashcardsScreen() {
  const { apiData } = useStudy();
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});

  if (!apiData) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
        >


          <Card>
            <Text>No study data yet. Go back to Home and upload a PDF.</Text>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const flashcards = apiData.flashcards || [];

  if (!flashcards.length) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
        >


          <Card>
            <Text>No flashcards generated for this PDF.</Text>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
      >
        {/* Top bar like in the web UI */}


        <View style={styles.list}>
          {flashcards.map((card, idx) => {
            const isFlipped = !!flipped[idx];

            return (
              <Pressable
                key={idx}
                onPress={() =>
                  setFlipped((prev) => ({ ...prev, [idx]: !isFlipped }))
                }
              >
                <Card>
                  {/* Header row: label + chevron */}
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.flashcardLabel}>
                      Flashcard {idx + 1}
                    </Text>
                    <View style={styles.chevronContainer}>
                      <Text style={styles.chevronText}>
                        {isFlipped ? "˄" : "˅"}
                      </Text>
                    </View>
                  </View>

                  {/* Question (always visible) */}
                  <Text style={styles.questionText}>
                    {`Q: ${card.front}`}
                  </Text>

                  {/* Answer section when expanded */}
                  {isFlipped ? (
                    <>
                      <Text style={styles.answerLabel}>Answer</Text>
                      <Text style={styles.answerText}>{card.back}</Text>
                    </>
                  ) : (
                    <Text style={styles.flashcardHint}>
                      (Tap to show answer)
                    </Text>
                  )}
                </Card>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F3F4F6", // gray-100
  },
  content: {
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 16,
    alignItems: "center", // center the column like in web UI
  },
  headerBar: {
    width: "100%",
    maxWidth: 480,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backArrow: {
    fontSize: 20,
    color: "#4B5563",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  list: {
    width: "100%",
    maxWidth: 480,
  },
  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB", // gray-200
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  flashcardLabel: {
    color: "#6366F1", // indigo-500 similar to screenshot
    fontSize: 12,
    fontWeight: "600",
  },
  chevronContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  chevronText: {
    fontSize: 14,
    color: "#6B7280",
  },
  questionText: {
    fontSize: 14,
    color: "#111827",
    marginBottom: 6,
  },
  answerLabel: {
    marginTop: 8,
    marginBottom: 2,
    fontSize: 12,
    fontWeight: "600",
    color: "#7C3AED", // purple-ish "Answer" like screenshot
  },
  answerText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  flashcardHint: {
    marginTop: 4,
    fontSize: 12,
    color: "#9CA3AF",
  },
});
