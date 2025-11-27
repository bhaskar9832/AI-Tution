import React, { useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  Image,
  Pressable,
  Linking,
} from "react-native";
import { useStudy, RECOMMEND_URL } from "./StudyContext";

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

export default function VideosScreen() {
  const {
    apiData,
    videoResults,
    setVideoResults,
    videoLoading,
    setVideoLoading,
    videoError,
    setVideoError,
  } = useStudy();

  useEffect(() => {
    if (!apiData) return;
    // now driven by key_topics instead of key_points
    if (!apiData.key_topics || apiData.key_topics.length === 0) return;
    if (videoResults.length > 0 || videoLoading) return;

    const fetchVideos = async () => {
      try {
        setVideoLoading(true);
        setVideoError(null);

        const endpoint = `${RECOMMEND_URL}`;

        const payload = {
          // backend prefers key_topics
          key_topics: apiData.key_topics?.slice(0, 8) ?? [],
          text: apiData.summary || apiData.text || "",
          max_results: 8,
        };

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const txt = await res.text();
          console.error("Video API error:", res.status, txt);
          setVideoError(`Video API error: ${res.status}`);
          return;
        }

        const json = await res.json();

        if (json.error) {
          console.error("Video API returned error:", json.error);
          setVideoError(json.error);
          setVideoResults([]);
          return;
        }

        setVideoResults(json.videos || []);
      } catch (err: any) {
        console.error("Failed to fetch videos:", err);
        setVideoError(String(err?.message || err));
      } finally {
        setVideoLoading(false);
      }
    };

    fetchVideos();
  }, [
    JSON.stringify(apiData?.key_topics), // dependency switched to key_topics
    apiData?.summary,
    videoResults.length,
    videoLoading,
  ]);

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

  // ======= GROUPING LOGIC: topics (keywords) -> video, then leftover videos =======

  const keywordOrder: string[] = apiData.key_topics?.slice(0, 8) ?? [];

  // For each topic, find its single video (backend already keeps max 1 per keyword)
  const keywordSections = keywordOrder.map((kw) => {
    const video = videoResults.find(
      (v: any) => v.matched_keyword === kw
    );
    return { keyword: kw, video };
  });

  // Any videos that were not matched to a topic (matched_keyword is null/undefined)
  const otherVideos = videoResults.filter(
    (v: any) => !v.matched_keyword
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        <View style={{ gap: 12 }}>
          {/* Header */}
          <Card>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                marginBottom: 4,
              }}
            >
              Recommended videos
            </Text>
            <Text style={{ fontSize: 13, color: "#6B7280" }}>
              One video per key topic, ordered by your topics.
            </Text>
          </Card>

          {/* Loading / Error / Empty states */}
          {videoLoading && (
            <Card>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <ActivityIndicator />
                <Text>Finding videos on YouTube...</Text>
              </View>
            </Card>
          )}

          {videoError && !videoLoading && (
            <Card>
              <Text style={{ color: "#B91C1C" }}>
                Error loading videos: {videoError}
              </Text>
            </Card>
          )}

          {!videoLoading &&
            !videoError &&
            (!videoResults || videoResults.length === 0) && (
              <Card>
                <Text>No videos found yet.</Text>
              </Card>
            )}

          {/* ======= 1) TOPIC SECTIONS (topic title + 1 video) ======= */}
          {!videoLoading &&
            !videoError &&
            keywordSections.map((section, idx) => {
              const { keyword, video } = section;
              if (!keyword) return null; // safety

              if (!video) {
                // If no video matched this topic, show a "no video" card
                return (
                  <Card key={keyword || idx}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        marginBottom: 4,
                        color: "#111827",
                      }}
                    >
                      {keyword}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#9CA3AF" }}>
                      No video found for this topic.
                    </Text>
                  </Card>
                );
              }

              return (
                <Card key={video.videoId || keyword || idx}>
                  {/* Topic heading */}
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      marginBottom: 8,
                      color: "#111827",
                    }}
                  >
                    {keyword}
                  </Text>

                  {/* Thumbnail */}
                  {video.thumbnail ? (
                    <Image
                      source={{ uri: video.thumbnail }}
                      style={{
                        width: "100%",
                        height: 150,
                        borderRadius: 10,
                        marginBottom: 8,
                      }}
                      resizeMode="cover"
                    />
                  ) : null}

                  {/* Title + channel + views */}
                  <Pressable
                    onPress={() =>
                      Linking.openURL(
                        video.url ||
                          `https://www.youtube.com/watch?v=${video.videoId}`
                      )
                    }
                  >
                    <Text
                      style={{
                        fontWeight: "700",
                        fontSize: 14,
                        marginBottom: 4,
                      }}
                      numberOfLines={2}
                    >
                      {video.title}
                    </Text>

                    {video.channelTitle ? (
                      <Text style={{ fontSize: 12, color: "#666" }}>
                        {video.channelTitle}
                      </Text>
                    ) : null}

                    {video.viewCount ? (
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#999",
                          marginTop: 4,
                        }}
                      >
                        {Number(video.viewCount).toLocaleString()} views
                      </Text>
                    ) : null}
                  </Pressable>
                </Card>
              );
            })}

          {/* ======= 2) EXTRA / OTHER VIDEOS (no topic match) ======= */}
          {!videoLoading &&
            !videoError &&
            otherVideos.length > 0 && (
              <>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    marginTop: 8,
                    marginBottom: 4,
                    color: "#4B5563",
                  }}
                >
                  More helpful videos
                </Text>

                {otherVideos.map((v: any, i: number) => (
                  <Card key={v.videoId || `other-${i}`}>
                    {v.thumbnail ? (
                      <Image
                        source={{ uri: v.thumbnail }}
                        style={{
                          width: "100%",
                          height: 150,
                          borderRadius: 10,
                          marginBottom: 8,
                        }}
                        resizeMode="cover"
                      />
                    ) : null}

                    <Pressable
                      onPress={() =>
                        Linking.openURL(
                          v.url ||
                            `https://www.youtube.com/watch?v=${v.videoId}`
                        )
                      }
                    >
                      <Text
                        style={{
                          fontWeight: "700",
                          fontSize: 14,
                          marginBottom: 4,
                        }}
                        numberOfLines={2}
                      >
                        {v.title}
                      </Text>
                      {v.channelTitle ? (
                        <Text style={{ fontSize: 12, color: "#666" }}>
                          {v.channelTitle}
                        </Text>
                      ) : null}
                      {v.viewCount ? (
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#999",
                            marginTop: 4,
                          }}
                        >
                          {Number(v.viewCount).toLocaleString()} views
                        </Text>
                      ) : null}
                    </Pressable>
                  </Card>
                ))}
              </>
            )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
