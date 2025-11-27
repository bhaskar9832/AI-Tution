import React from "react";
import { SafeAreaView, ScrollView, View, Text } from "react-native";
import { useStudy } from "./StudyContext";

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: "white",
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {children}
    </View>
  );
}

export default function SummaryScreen() {
  const { apiData } = useStudy();

  if (!apiData) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        >
          <Card>
            <Text>No study data yet. Go back to Home and upload a PDF.</Text>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const { summary, key_topics, key_points } = apiData;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        <View style={{ gap: 16 }}>
          <Card>
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
              Summary
            </Text>
            <Text style={{ color: "#374151" }}>{summary}</Text>
          </Card>

          <Card>
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
              Key Topics
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {key_topics?.map((topic) => (
                <View
                  key={topic}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: "#EEF2FF",
                  }}
                >
                  <Text style={{ color: "#4F46E5", fontWeight: "500" }}>
                    {topic}
                  </Text>
                </View>
              ))}
            </View>
          </Card>

          <Card>
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
              Key Points
            </Text>
            {key_points?.map((point, idx) => (
              <View
                key={idx}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  marginBottom: 4,
                }}
              >
                <Text style={{ marginRight: 6 }}>•</Text>
                <Text style={{ flex: 1, color: "#374151" }}>{point}</Text>
              </View>
            ))}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
