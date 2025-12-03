// app/mock-test.tsx
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useStudy, MOCK_TEST_URL } from "../StudyContext";

type PatternRow = {
  marks: number;
  count: string; // keep as string for TextInput
};

type MockQuestion = {
  question: string;
  marks: number;
};

type MockSection = {
  marks: number;
  instructions?: string;
  questions: MockQuestion[];
};

type MockTestResponse = {
  total_marks: number;
  pattern_used: { marks: number; count: number }[];
  sections: MockSection[];
};

const DEFAULT_PATTERN: PatternRow[] = [
  { marks: 10, count: "3" },
  { marks: 5, count: "4" },
  { marks: 3, count: "10" },
  { marks: 2, count: "5" },
  { marks: 1, count: "10" },
];

const MockTestScreen: React.FC = () => {
  const router = useRouter();
  const { apiData } = useStudy();

  const [patternRows, setPatternRows] = useState<PatternRow[]>(DEFAULT_PATTERN);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mockTest, setMockTest] = useState<MockTestResponse | null>(null);

  if (!apiData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.infoText}>
            No study data yet. Please upload a PDF from the Home screen first.
          </Text>
          <Pressable style={styles.primaryButton} onPress={() => router.push("/")}>
            <Text style={styles.primaryButtonText}>Back to Home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleChangeCount = (index: number, value: string) => {
    const sanitized = value.replace(/[^0-9]/g, "");
    setPatternRows((rows) =>
      rows.map((row, i) => (i === index ? { ...row, count: sanitized } : row))
    );
  };

  const totalMarks = patternRows.reduce((sum, row) => {
    const count = parseInt(row.count || "0", 10) || 0;
    return sum + row.marks * count;
  }, 0);

  const handleGenerate = async () => {
    if (!apiData) return;

    const text = apiData.text || apiData.summary || "";
    if (!text.trim()) {
      Alert.alert("Missing text", "No extracted PDF text found in apiData.");
      return;
    }

    const patternPayload = patternRows
      .map((row) => ({
        marks: row.marks,
        count: parseInt(row.count || "0", 10) || 0,
      }))
      .filter((p) => p.count > 0 && p.marks > 0);

    if (patternPayload.length === 0) {
      Alert.alert("Invalid pattern", "Please enter at least one section with count > 0.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const body = {
        text,
        topic: apiData.key_topics?.[0] || "",
        pattern: patternPayload,
      };

      const res = await fetch(MOCK_TEST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok) {
        console.error("Mock test API error:", res.status, json);
        setError(json.error || `Mock test API error: ${res.status}`);
        setMockTest(null);
        return;
      }

      if (json.error) {
        console.error("Mock test error:", json.error);
        setError(json.error);
        setMockTest(null);
        return;
      }

      setMockTest(json as MockTestResponse);
    } catch (e: any) {
      console.error("Mock test fetch failed:", e);
      setError(e?.message || String(e));
      setMockTest(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Config card */}
        <View style={styles.card}>
          <Text style={styles.title}>Mock Test Builder</Text>
          <Text style={styles.subtitle}>
            Customize how many questions you want in each mark category.
          </Text>

          {/* Pattern rows */}
          <View style={styles.patternHeaderRow}>
            <Text style={[styles.patternHeaderText, { flex: 1 }]}>Marks</Text>
            <Text style={[styles.patternHeaderText, { flex: 1 }]}>
              No. of Questions
            </Text>
            <Text style={[styles.patternHeaderText, { flex: 1, textAlign: "right" }]}>
              Section Marks
            </Text>
          </View>

          {patternRows.map((row, index) => {
            const count = parseInt(row.count || "0", 10) || 0;
            const sectionMarks = row.marks * count;
            return (
              <View key={row.marks} style={styles.patternRow}>
                <Text style={styles.patternMarksLabel}>{row.marks}</Text>
                <TextInput
                  value={row.count}
                  onChangeText={(val) => handleChangeCount(index, val)}
                  keyboardType="numeric"
                  placeholder="0"
                  style={styles.input}
                />
                <Text style={styles.sectionMarksText}>{sectionMarks}</Text>
              </View>
            );
          })}

          {/* Total marks */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Marks</Text>
            <Text style={styles.totalValue}>{totalMarks}</Text>
          </View>

          {/* Generate button */}
          <Pressable
            style={[
              styles.primaryButton,
              loading && { opacity: 0.6 },
            ]}
            disabled={loading}
            onPress={handleGenerate}
          >
            {loading ? (
              <>
                <ActivityIndicator color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.primaryButtonText}>Generating Mock Test...</Text>
              </>
            ) : (
              <Text style={styles.primaryButtonText}>
                Generate Mock Test
              </Text>
            )}
          </Pressable>

          {error && (
            <Text style={styles.errorText}>Error: {error}</Text>
          )}
        </View>

        {/* Results card */}
        {mockTest && (
          <View style={styles.card}>
            <Text style={styles.title}>Generated Mock Test</Text>
            <Text style={styles.subtitle}>
              Total Marks: {mockTest.total_marks}
            </Text>

            {mockTest.pattern_used && (
              <View style={{ marginTop: 8, marginBottom: 8 }}>
                <Text style={styles.sectionHeading}>Pattern used</Text>
                {mockTest.pattern_used.map((p, idx) => (
                  <Text key={idx} style={styles.patternUsedText}>
                    {p.count} × {p.marks}-mark questions ({p.count * p.marks} marks)
                  </Text>
                ))}
              </View>
            )}

            {/* Sections */}
            {mockTest.sections && mockTest.sections.length > 0 ? (
              mockTest.sections.map((section, idx) => (
                <View key={idx} style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>
                    {section.marks}-mark questions
                  </Text>
                  {section.instructions ? (
                    <Text style={styles.sectionInstructions}>
                      {section.instructions}
                    </Text>
                  ) : null}

                  {section.questions && section.questions.length > 0 ? (
                    section.questions.map((q, qIdx) => (
                      <View key={qIdx} style={styles.questionRow}>
                        <Text style={styles.questionIndex}>{qIdx + 1}.</Text>
                        <Text style={styles.questionText}>{q.question}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noQuestionsText}>
                      No questions returned for this section.
                    </Text>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.noQuestionsText}>
                No sections returned from the backend.
              </Text>
            )}
          </View>
        )}

        {/* Back button */}
        <Pressable style={[styles.primaryButton, { marginTop: 8 }]} onPress={() => router.push("/")}>
          <Text style={styles.primaryButtonText}>Back to Home</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MockTestScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#EFF6FF" },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 12,
    textAlign: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 12,
  },
  patternHeaderRow: {
    flexDirection: "row",
    marginBottom: 4,
    marginTop: 4,
  },
  patternHeaderText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  patternRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  patternMarksLabel: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    backgroundColor: "#F9FAFB",
    marginHorizontal: 4,
  },
  sectionMarksText: {
    flex: 1,
    fontSize: 14,
    textAlign: "right",
    color: "#4B5563",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2563EB",
  },
  primaryButton: {
    marginTop: 4,
    borderRadius: 999,
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  errorText: {
    marginTop: 8,
    color: "#B91C1C",
    fontSize: 13,
  },
  sectionCard: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  sectionInstructions: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 6,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  patternUsedText: {
    fontSize: 12,
    color: "#4B5563",
  },
  questionRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  questionIndex: {
    width: 18,
    fontSize: 14,
    color: "#111827",
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },
  noQuestionsText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
});
