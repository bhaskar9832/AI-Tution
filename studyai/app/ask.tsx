import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useStudy, ASK_URL } from "./StudyContext";

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

// Format answer text: remove markdown stars + convert * to • bullets
function formatAnswer(raw: string): string {
  return raw
    .replace(/\*\*(.*?)\*\*/g, "$1")        // remove bold markers
    .replace(/^\s*[\*]\s+/gm, "• ")          // convert list stars to bullet
    .replace(/ {2,}/g, " ");                 // cleanup double spaces
}

const BLUE = "#0057FF";
const GREEN = "#16A34A";

export default function AskScreen() {
  const { apiData } = useStudy();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [history, setHistory] = useState<{ question: string; answer: string }[]>(
    []
  );
  const [loading, setLoading] = useState(false);

  if (!apiData || !apiData.text) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Card>
            <Text>No document text available yet. Go back to Home and upload a PDF.</Text>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const text = apiData.text;

  const suggested = [
    "What are the main topics in this PDF?",
    "Summarize this document in simple terms.",
    "Explain the key differences mentioned in the text.",
    "What are the most important points I should remember?",
    "Can you explain the concept of scalability?",
  ];

  async function ask(q: string) {
    if (!q || !text) return;
    setLoading(true);
    setAnswer("");

    try {
      const res = await fetch(ASK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, question: q }),
      });
      const data = await res.json();
      const ans = data.answer || "No answer found.";

      const formatted = formatAnswer(ans); // Clean markdown from answer
      setHistory((prev) => [...prev, { question: q, answer: formatted }]);
      setAnswer(formatted); // Display formatted answer
    } catch (e: any) {
      setAnswer("Error: " + e.message);
    } finally {
      setLoading(false);
      setQuestion("");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Card>
          <Text style={styles.title}>Ask Questions</Text>
          <Text style={styles.subtitle}>Ask anything about your PDF and get instant answers.</Text>

          {/* Input + main Ask button */}
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Ask a question about your PDF..."
              value={question}
              onChangeText={setQuestion}
              placeholderTextColor="#9CA3AF"
              onSubmitEditing={() => ask(question)}
              multiline
              style={styles.textInput}
            />

            <Pressable
              onPress={() => ask(question)}
              disabled={!question || loading}
              style={({ pressed }) => [
                styles.askButton,
                (!question || loading) && styles.askButtonDisabled,
                pressed && !loading && question && styles.askButtonPressed,
              ]}
            >
              <View style={styles.askButtonInner}>
                <Feather name="send" size={18} color="#ffffff" />
                <Text style={styles.askButtonText}>
                  {loading ? "Thinking..." : "Ask"}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Green answer card */}
          {answer ? (
            <View style={styles.answerCard}>
              {/* Header */}
              <View style={styles.answerHeader}>
                <View style={styles.answerHeaderLeft}>
                  <View style={styles.answerIconCircle}>
                    <Feather name="check" size={15} color="#ffffff" />
                  </View>
                  <Text style={styles.answerHeaderText}>Answer</Text>
                </View>

                <Pressable onPress={() => setAnswer("")}>
                  <Feather name="x" size={19} color="#ffffff" />
                </Pressable>
              </View>

              {/* Body */}
              <View style={styles.answerBody}>
                <Text style={styles.answerText}>{answer}</Text>
              </View>
            </View>
          ) : null}

          {/* History */}


          {/* Blue suggested questions */}
          <View style={styles.suggestedContainer}>
            <Text style={styles.sectionTitle}>Suggested Questions:</Text>

            {suggested.map((s, i) => (
              <Pressable
                key={i}
                onPress={() => ask(s)}
                style={({ pressed }) => [
                  styles.suggestedButton,
                  pressed && styles.suggestedButtonPressed,
                ]}
              >
                <View style={styles.suggestedInner}>
                  <View style={styles.suggestedIconWrapper}>
                    <Feather name="zap" size={16} color="#ffffff" />
                  </View>
                  <Text style={styles.suggestedText}>{s}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Styles ───────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F3F4F6" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
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
  title: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  subtitle: { marginBottom: 12 },
  inputContainer: { gap: 8 },
  textInput: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    fontSize: 16,
    color: "#111827",
    textAlignVertical: "top",
    height: 148,
  },
  askButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BLUE,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
  },
  askButtonDisabled: { backgroundColor: "#c1c5caff", shadowOpacity: 0 },
  askButtonPressed: { transform: [{ scale: 0.98 }] },
  askButtonInner: { flexDirection: "row", alignItems: "center" },
  askButtonText: { marginLeft: 8, color: "white", fontWeight: "600", fontSize: 16 },

  answerCard: {
    marginTop: 20,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  answerHeader: {
    backgroundColor: GREEN,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  answerHeaderLeft: { flexDirection: "row", alignItems: "center" },
  answerIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  answerHeaderText: { color: "white", fontWeight: "600", fontSize: 15 },
  answerBody: { paddingHorizontal: 16, paddingVertical: 14 },
  answerText: { fontSize: 14, lineHeight: 20, color: "#111827" },

  historyContainer: { marginTop: 20 },
  sectionTitle: { fontWeight: "700", marginBottom: 6 },
  historyItem: { marginBottom: 8 },
  historyQuestion: { fontWeight: "600" },

  suggestedContainer: { marginTop: 20 },
  suggestedButton: {
    width: "100%",
    borderRadius: 999,
    backgroundColor: BLUE,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  suggestedButtonPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  suggestedInner: { flexDirection: "row", alignItems: "center" },
  suggestedIconWrapper: {
    height: 28,
    width: 28,
    borderRadius: 999,
    backgroundColor: "#0046D1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  suggestedText: { flex: 1, color: "white", fontSize: 14, fontWeight: "500" },
});
