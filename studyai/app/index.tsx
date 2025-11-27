// app/index.tsx
import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import { useStudy, STUDY_URL } from "./StudyContext";
import {
  FileText as FileTextIcon,
  CreditCard,
  ClipboardCheck,
  GitBranch,
  MessageCircleQuestion,
  Video as VideoIcon,
  Upload,
  X,
} from "lucide-react-native";

/* ---------------------------------------------------
 * Shared types / helpers
 * --------------------------------------------------*/

type PropsWithChildren = {
  children: React.ReactNode;
};

type IconType = React.ComponentType<{ size?: number; color?: string }>;

type ColorKey = "blue" | "purple" | "green" | "orange" | "pink" | "red";

const COLOR_MAP: Record<ColorKey, string> = {
  blue: "#E5F0FF",
  purple: "#F6E7FF",
  green: "#E8FFF3",
  orange: "#FFF5E5",
  pink: "#FFE7F4",
  red: "#FFECEF",
};

/* ---------------------------------------------------
 * UI pieces: Card, FeatureCard, FeatureList
 * --------------------------------------------------*/

function Card({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}

interface FeatureCardProps {
  icon: IconType;
  title: string;
  description: string;
  color: ColorKey;
  onPress: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  color,
  onPress,
}) => {
  const bg = COLOR_MAP[color] ?? "#F3F4F6";

  return (
    <TouchableOpacity
      style={styles.featureCard}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={[styles.featureIconWrapper, { backgroundColor: bg }]}>
        <Icon size={22} color="#111827" />
      </View>
      <View style={styles.featureTextWrapper}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
      <Text style={styles.featureChevron}>›</Text>
    </TouchableOpacity>
  );
};

type FeatureKey =
  | "summary"
  | "flashcards"
  | "quiz"
  | "mindmap"
  | "questions"
  | "videos";

interface FeatureConfig {
  icon: IconType;
  title: string;
  description: string;
  color: ColorKey;
  key: FeatureKey;
}

const FEATURES: FeatureConfig[] = [
  {
    icon: FileTextIcon,
    title: "Summary",
    description: "Overview, topics, key points",
    color: "blue",
    key: "summary",
  },
  {
    icon: CreditCard,
    title: "Flashcards",
    description: "Tap to flip Q/A",
    color: "purple",
    key: "flashcards",
  },
  {
    icon: ClipboardCheck,
    title: "Quiz",
    description: "Multiple-choice questions",
    color: "green",
    key: "quiz",
  },
  {
    icon: GitBranch,
    title: "Mind Map",
    description: "Visual tree of concepts",
    color: "orange",
    key: "mindmap",
  },
  {
    icon: MessageCircleQuestion,
    title: "Ask Questions",
    description: "Ask anything about this PDF",
    color: "pink",
    key: "questions",
  },
  {
    icon: VideoIcon,
    title: "Recommended Videos",
    description: "AI-powered YouTube suggestions",
    color: "red",
    key: "videos",
  },
];

interface FeatureListProps {
  onNavigateToFlashcards: () => void;
  onNavigateToQuiz: () => void;
  onNavigateToVideos: () => void;
  onNavigateToQuestions: () => void;
  onNavigateToMindMap: () => void;
  onNavigateToSummary: () => void;
}

const FeatureList: React.FC<FeatureListProps> = ({
  onNavigateToFlashcards,
  onNavigateToQuiz,
  onNavigateToVideos,
  onNavigateToQuestions,
  onNavigateToMindMap,
  onNavigateToSummary,
}) => {
  const handleFeaturePress = (key: FeatureKey) => {
    if (key === "flashcards") {
      onNavigateToFlashcards();
    } else if (key === "quiz") {
      onNavigateToQuiz();
    } else if (key === "videos") {
      onNavigateToVideos();
    } else if (key === "questions") {
      onNavigateToQuestions();
    } else if (key === "mindmap") {
      onNavigateToMindMap();
    } else if (key === "summary") {
      onNavigateToSummary();
    }
  };

  return (
    <View style={styles.featureListContainer}>
      <Text style={styles.featureListHeading}>Learning Tools</Text>
      <View>
        {FEATURES.map((feature) => (
          <FeatureCard
            key={feature.key}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            color={feature.color}
            onPress={() => handleFeaturePress(feature.key)}
          />
        ))}
      </View>
    </View>
  );
};

/* ---------------------------------------------------
 * Screen: HomeScreen
 * --------------------------------------------------*/

export default function HomeScreen() {
  const router = useRouter();
  const {
    fileInfo,
    setFileInfo,
    uploading,
    setUploading,
    apiData,
    setApiData,
    setVideoResults,
    setVideoError,
  } = useStudy();

  const onRemoveFile = () => {
    setFileInfo(null);
    setApiData(null);
    setVideoResults([]);
    setVideoError(null);
  };

  const pickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (res.canceled) return;

      const asset = res.assets?.[0];
      if (!asset) {
        Alert.alert("No file selected", "Please choose a PDF file.");
        return;
      }

      const selected = {
        uri: asset.uri,
        name: asset.name ?? "upload.pdf",
        size: asset.size ?? 0,
        mimeType: asset.mimeType ?? "application/pdf",
        // On native this will be undefined, which is fine.
        // On web, expo-document-picker adds `file`.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fileObject: (asset as any).file ?? null,
      };

      console.log("Picked file:", selected);
      setFileInfo(selected);
      setApiData(null);
      setVideoResults([]);
      setVideoError(null);
    } catch (err: any) {
      console.error("pickFile error:", err);
      Alert.alert("File pick failed", String(err));
    }
  };

  const upload = async () => {
    if (!fileInfo) {
      Alert.alert("No file", "Please pick a PDF first.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("text", "");
      formData.append("ocr_lang", "eng");
      formData.append("dpi", String(300));
      formData.append("force_ocr", "false");
      formData.append("min_char_threshold", String(20));
      formData.append("prefer_blocks", "true");
      formData.append("psm", "3");
      formData.append("page_breaks", "true");
      formData.append("topic", "Sample topic");
      formData.append("num_cards", String(12));
      formData.append("num_questions", String(10));
      formData.append("difficulty", "medium");
      formData.append("model", "gemini-2.5-flash");

      if (Platform.OS === "web") {
        // Web: use File object if present, otherwise fetch the blob
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyFile = (fileInfo as any).fileObject;
        if (anyFile && typeof File !== "undefined" && anyFile instanceof File) {
          formData.append("file", anyFile, fileInfo.name);
        } else {
          const blob = await fetch(fileInfo.uri).then((r) => r.blob());
          formData.append("file", blob, fileInfo.name);
        }
      } else {
        // Native: use URI + metadata
        formData.append("file", {
          uri: fileInfo.uri,
          name: fileInfo.name,
          type: fileInfo.mimeType || "application/pdf",
          // @ts-ignore React Native's FormData file type
        });
      }

      console.log("Uploading to:", STUDY_URL);

      const resp = await fetch(STUDY_URL, {
        method: "POST",
        // @ts-ignore — React Native’s FormData is OK here
        body: formData,
      });

      const text = await resp.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse JSON:", e, text);
        Alert.alert("Error", "Server returned non-JSON response");
        return;
      }

      if (!resp.ok) {
        console.error("Server error:", resp.status, json);
        Alert.alert("Upload failed", `Status ${resp.status}`);
        return;
      }

      console.log("Study material data:", json);
      setApiData(json);
      setVideoResults([]);
      setVideoError(null);

      // Go straight to summary screen
      router.push("/summary");
    } catch (err: any) {
      console.error("Upload error:", err);
      Alert.alert("Upload error", String(err));
    } finally {
      setUploading(false);
    }
  };

  const hasData = !!apiData;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Subheader text */}

        {/* Upload card */}
        <Card>
          {!fileInfo && (
            <>
              <View style={styles.iconCircle}>
                <Upload size={40} color="#2563EB" />
              </View>

              <View style={styles.textBlock}>
                <Text style={styles.title}>Upload Your PDF</Text>
                <Text style={styles.subtitle}>
                  Upload a PDF to generate summaries, flashcards, quizzes, and
                  more
                </Text>
              </View>
            </>
          )}
          {!fileInfo && (
            <>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={pickFile}
            activeOpacity={0.9}
          >
            <Text style={styles.generateButtonText}>
              {fileInfo ? `Picked: ${fileInfo?.name}` : "Choose a PDF File"}
            </Text>
          </TouchableOpacity>
            </>
          )}
          {fileInfo && (
            <>
              <View style={styles.currentPdfHeader}>
                <Text style={styles.currentPdfHeaderLabel}>Current PDF</Text>

                <TouchableOpacity
                  onPress={onRemoveFile}
                  style={styles.removeButton}
                  activeOpacity={0.8}
                >
                  <X size={16} color="#4B5563" />
                </TouchableOpacity>
              </View>

              {/* PDF File Info Row */}
              <View style={styles.fileRow}>
                <View style={styles.fileIconWrapper}>
                  <FileTextIcon size={24} color="#2563EB" />
                </View>

                <View style={styles.fileInfoTextWrapper}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {fileInfo.name}
                  </Text>
                  <Text style={styles.fileSize}>
                    {fileInfo?.size
                      ? (fileInfo.size / (1024 * 1024)).toFixed(2) + " MB"
                      : "unknown"}
                  </Text>
                </View>
              </View>
            </>
          )}

          <View style={styles.spacer8} />

          <TouchableOpacity
            style={[
              styles.generateButton,
              (!fileInfo || uploading) && styles.generateButtonDisabled,
            ]}
            onPress={upload}
            activeOpacity={0.9}
            disabled={!fileInfo || uploading}
          >
            {uploading ? (
              <>
                <ActivityIndicator color="white" style={{ marginRight: 8 }} />
                <Text style={styles.generateButtonText}>
                  Processing PDF...
                </Text>
              </>
            ) : (
              <Text style={styles.generateButtonText}>
                {hasData ? "Re-generate from PDF" : "Upload & Generate"}
              </Text>
            )}
          </TouchableOpacity>
        </Card>

        {/* Current PDF + Learning tools */}
        {hasData && (
          <>

            <FeatureList
              onNavigateToSummary={() => router.push("/summary")}
              onNavigateToFlashcards={() => router.push("/flashcards")}
              onNavigateToQuiz={() => router.push("/quiz")}
              onNavigateToVideos={() => router.push("/videos")}
              onNavigateToQuestions={() => router.push("/ask")}
              onNavigateToMindMap={() => router.push("/mindmap")}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------------------------------------------------
 * Styles
 * --------------------------------------------------*/

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#EFF6FF", // light blue-ish
  },
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  logoEmoji: {
    fontSize: 18,
    color: "#FFFFFF",
  },
  appTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2563EB",
  },
  appSubtitle: {
    fontSize: 12,
    color: "#6B7280",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 16,
  },
  subHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  subHeaderTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  subHeaderDescription: {
    textAlign: "center",
    color: "#4B5563",
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
  spacer8: {
    height: 8,
  },

  /* Upload intro */
  iconCircle: {
    width: 80,
    height: 80,
    alignSelf: "center",
    borderRadius: 40,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  textBlock: {
    alignItems: "center",
    marginTop: 4,
    marginBottom: 12,
  },
  title: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "600",
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
  },

  /* Buttons */
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    borderRadius: 32,
    paddingVertical: 14,
    marginTop: 12,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 15,
  },

  /* Inside-card Current PDF section */
  currentPdfHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 0,
    marginBottom: 8,
  },
  currentPdfHeaderLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12 as any, // if RN < 0.71, remove "gap" and use marginRight instead
  },
  fileIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  fileInfoTextWrapper: {
    flex: 1,
    minWidth: 0,
  },
  fileName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  fileSize: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },

  /* Below-card Current PDF label used with FeatureList */
  currentPdfWrapper: {
    marginTop: 16,
    marginBottom: 10,
  },
  currentPdfWrapperLabel: {
    color: "#6B7280",
    marginBottom: 2,
  },
  currentPdfName: {
    fontWeight: "600",
  },

  /* FeatureList */
  featureListContainer: {
    marginTop: 8,
  },
  featureListHeading: {
    color: "#111827",
    marginBottom: 8,
    paddingHorizontal: 4,
    fontWeight: "600",
    fontSize: 16,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  featureIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  featureTextWrapper: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  featureDescription: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  featureChevron: {
    fontSize: 22,
    color: "#9CA3AF",
    marginLeft: 6,
  },
});
