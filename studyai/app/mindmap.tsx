// app/mindmap.tsx
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Button,
  ActivityIndicator,
  Image,
  Alert,
  Dimensions,
  Platform,
  StyleSheet,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { useStudy, MINDMAP_URL } from "./StudyContext";

type PropsWithChildren = { children: React.ReactNode };

function OuterCard({ children }: PropsWithChildren) {
  return <View style={styles.outerCard}>{children}</View>;
}

interface MindmapStructure {
  root?: string;
  topics?: string[];
  points_by_topic?: { [topic: string]: string[] };
}

interface MindmapResponse {
  topic?: string;
  image_base64?: string;
  mime?: string;
  width?: number;
  height?: number;
  structure?: MindmapStructure;
  error?: string;
  details?: string;
}

const MindmapScreen: React.FC = () => {
  const router = useRouter();
  const { apiData } = useStudy();

  const [mindmapJson, setMindmapJson] = useState<MindmapResponse | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1); // start at 1 for crisp base

  // If no data yet
  if (!apiData) {
    return (
      <SafeAreaView style={styles.noDataScreen}>
        <Text style={styles.noDataText}>
          No study data yet. Please upload a PDF and generate study material.
        </Text>
        <Button title="Back to Home" onPress={() => router.replace("/")} />
      </SafeAreaView>
    );
  }

  // Helper: ArrayBuffer → base64 (for raw PNG from backend)
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    // @ts-ignore
    return global.btoa ? global.btoa(binary) : btoa(binary);
  };

  const fetchMindmap = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        summary: apiData.summary || "",
        key_topics: apiData.key_topics || [],
        key_points: apiData.key_points || [],
        depth: "basic",
      };

      const res = await fetch(MINDMAP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        const json = (await res.json()) as MindmapResponse;
        if (!res.ok) return setError(json.error || `Error: ${res.status}`);
        if (json.error) return setError(json.error);
        setMindmapJson(json);
        json.image_base64 && setImageBase64(json.image_base64);
        setZoomScale(1);
        return;
      }

      if (contentType.includes("image/") || contentType === "") {
        const buf = await res.arrayBuffer();
        if (!res.ok) return setError(`Mindmap API error: ${res.status}`);
        const b64 = arrayBufferToBase64(buf);
        setImageBase64(b64);
        setMindmapJson(null);
        setZoomScale(1);
        return;
      }

      setError("Unexpected response from server.");
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!imageBase64 && !mindmapJson && !loading) fetchMindmap();
  }, []);

  const rootTitle = mindmapJson?.topic || apiData.key_topics?.[0] || "Mind Map";

  const onInfoPress = () => {
    Alert.alert(
      "Mind Map Info",
      Platform.OS === "ios"
        ? "Pinch to zoom + drag to move."
        : "Use + / − to zoom and drag to move."
    );
  };

  // === IMAGE SIZE CALCULATION (keep crisp, no over-stretch) ===
  const screenWidth = Dimensions.get("window").width;
  const zoomContainerHeight = 420; // taller visible area

  const originalWidth = mindmapJson?.width || screenWidth;
  const originalHeight = mindmapJson?.height || zoomContainerHeight;

  // limit base render width to ~95% of screen
  const maxDisplayWidth = screenWidth * 0.95;
  const scaleFactor = Math.min(1, maxDisplayWidth / originalWidth);

  // Base size (no crazy extra factors)
  const baseImgWidth = originalWidth * scaleFactor;
  const baseImgHeight = originalHeight * scaleFactor;

  // Apply zoom by changing width/height instead of huge transform
  const imgWidth = baseImgWidth * zoomScale;
  const imgHeight = baseImgHeight * zoomScale;

  // === Build topics list ===
  const topicGroups = (() => {
    const s = mindmapJson?.structure;
    const jsonTopics = s?.topics || [];
    const jsonPoints = s?.points_by_topic || {};
    const topics = jsonTopics.length ? jsonTopics : apiData.key_topics || [];
    const points = apiData.key_points || [];
    if (!topics.length && !points.length) return [];
    if (topics.length && Object.keys(jsonPoints).length)
      return topics.map((t) => ({ title: t, points: jsonPoints[t] || [] }));
    if (topics.length) {
      const groups: any = {};
      topics.forEach((t) => (groups[t] = []));
      points.forEach((p, i) => groups[topics[i % topics.length]].push(p));
      return Object.entries(groups).map(([title, pts]) => ({ title, points: pts }));
    }
    return [{ title: "Key Points", points }];
  })();

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled
      >
        <View style={styles.pageContainer}>
          {/* Header with Mind Map title */}
          <View style={styles.headerBlock}>
            <Text style={styles.headerTitle}>{rootTitle}</Text>
            <Text style={styles.headerSubtitle}>Visual overview of key ideas</Text>
          </View>

          <OuterCard>
            {/* Optional info button */}



            {error && !loading && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>Error: {error}</Text>
              </View>
            )}

            {!loading && !error && imageBase64 && (
              <View style={styles.imageCard}>
                <ScrollView
                  horizontal
                  nestedScrollEnabled
                  showsHorizontalScrollIndicator
                  maximumZoomScale={4} // allow pinch-zoom (iOS)
                  minimumZoomScale={1}
                  contentContainerStyle={{ minWidth: baseImgWidth }}
                >
                  <ScrollView
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                    maximumZoomScale={4}
                    minimumZoomScale={1}
                    contentContainerStyle={{ minHeight: baseImgHeight }}
                  >
                    <Image
                      source={{ uri: `data:image/png;base64,${imageBase64}` }}
                      style={{
                        width: imgWidth < 240 ? 240 : imgWidth,
                        height:  imgHeight < 240 ? 240 : imgHeight,
                        resizeMode: "contain",
                      }}
                    />
                  </ScrollView>
                </ScrollView>

                {/* Zoom Controls */}
                <View style={styles.zoomControls}>
                  <Pressable
                    onPress={() =>
                      setZoomScale((p) => Math.min(p + 0.25, 3)) // up to 3x
                    }
                    style={[styles.zoomButton, styles.zoomButtonPrimary]}
                  >
                    <Text style={[styles.zoomButtonText, { color: "#fff" }]}>＋</Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      setZoomScale((p) => Math.max(p - 0.25, 1)) // min 1x
                    }
                    style={styles.zoomButton}
                  >
                    <Text style={styles.zoomButtonText}>－</Text>
                  </Pressable>
                </View>

                {/* Hint pill */}
              </View>
            )}
          </OuterCard>

          {/* Topics under the map */}
          {topicGroups.length > 0 && (
            <View style={styles.sectionList}>
              {topicGroups.map((g, i) => (
                <TopicAccordion key={i} title={g.title} points={g.points} />
              ))}
            </View>
          )}

          {/* Regenerate button */}
          <View style={styles.regenRow}>
            <Pressable
              disabled={loading}
              onPress={fetchMindmap}
              style={[styles.primaryButton, loading && { opacity: 0.6 }]}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? "Regenerating..." : "Regenerate Mind Map"}
              </Text>
            </Pressable>
          </View>

          {/* Back to Home */}
          <View style={{ marginTop: 16, marginBottom: 16 }}>
            <Pressable style={styles.primaryButton} onPress={() => router.push("/")}>
              <Text style={styles.primaryButtonText}>Back to Home</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

/* ---------------- Topic Accordion ---------------- */

type TAProps = { title: string; points: string[] };

const TopicAccordion: React.FC<TAProps> = ({ title, points }) => {
  const [expanded, setExpanded] = useState(true);
  return (
    <Pressable
      onPress={() => setExpanded((p) => !p)}
      style={({ pressed }) => [styles.topicCard, pressed && { transform: [{ scale: 0.995 }] }]}
    >
      <View style={styles.topicHeaderRow}>
        <Text style={styles.topicTitle}>{title}</Text>
        <View
          style={[
            styles.chevronWrapper,
            expanded && { transform: [{ rotate: "180deg" }] },
          ]}
        >
          <Text style={styles.chevronText}>⌄</Text>
        </View>
      </View>

      {expanded && points.length > 0 && (
        <View style={styles.topicPointsWrapper}>
          {points.map((p, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{p}</Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
};

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F3F4F6" },
  scrollContent: { padding: 16, paddingBottom: 32, alignItems: "center" },
  pageContainer: { width: "100%", maxWidth: 480 },

  noDataScreen: { flex: 1, justifyContent: "center", padding: 16, backgroundColor: "#F3F4F6" },
  noDataText: { marginBottom: 12, color: "#374151" },

  headerBlock: { marginBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#111827" },
  headerSubtitle: { marginTop: 4, fontSize: 14, color: "#6B7280" },

  outerCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#3B82F6",
    fontWeight: "500",
  },

  statusRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  statusText: { marginLeft: 8, color: "#374151" },
  errorBox: { marginBottom: 8 },
  errorText: { color: "#B91C1C" },

  imageCard: {
    height: 230, // bigger visual area for the map
    borderRadius: 18,
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
    width: "100%",
  },

  zoomControls: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "column",
    gap: 8,
  },
  zoomButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  zoomButtonPrimary: { backgroundColor: "#2563EB" },
  zoomButtonText: { fontSize: 18, fontWeight: "600", color: "#111827" },

  hintPillWrapper: { position: "absolute", bottom: 10, left: 0, right: 0, alignItems: "center" },
  hintPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: "#FFF",
    borderRadius: 999,
    elevation: 2,
  },
  hintPillText: { fontSize: 12, color: "#6B7280" },

  regenRow: { marginTop: 20 },

  sectionList: { marginTop: 20 },

  topicCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    elevation: 3,
  },
  topicHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  topicTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
  chevronWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  chevronText: { fontSize: 16, color: "#6B7280" },
  topicPointsWrapper: { marginTop: 12, gap: 6 },
  bulletRow: { flexDirection: "row" },
  bulletDot: { marginRight: 6, fontSize: 14, color: "#2563EB" },
  bulletText: { flex: 1, fontSize: 14, color: "#374151", lineHeight: 20 },

  primaryButton: {
    width: "100%",
    backgroundColor: "#3B82F6",
    borderRadius: 999,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default MindmapScreen;
