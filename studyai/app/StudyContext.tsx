// app/StudyContext.tsx
import React, { createContext, useContext, useState } from "react";
import { Platform } from "react-native";

// Backend base URL
export const BASE_URL = Platform.select({
  web: "http://127.0.0.1:8000", // browser
  // 🔁 replace with your machine IP on Wi-Fi (e.g. 192.168.1.2)
  default: "http://192.168.1.6:8000", // device / simulator
});

export const STUDY_URL = `${BASE_URL}/api/study_material`;
export const ASK_URL = `${BASE_URL}/api/ask_question`;
export const RECOMMEND_URL = `${BASE_URL}/api/recommend_videos`;
export const MINDMAP_URL = `${BASE_URL}/api/mindmap`;

type FileInfo = {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
  fileObject?: any;
};

type ApiData = {
  summary?: string;
  key_topics?: string[];
  key_points?: string[];
  flashcards?: { front: string; back: string }[];
  quiz?: {
    question: string;
    options: string[];
    answer: string;
    explanation?: string;
  }[];
  text?: string;
};

type StudyContextType = {
  fileInfo: FileInfo | null;
  setFileInfo: (f: FileInfo | null) => void;
  uploading: boolean;
  setUploading: (b: boolean) => void;
  apiData: ApiData | null;
  setApiData: (d: ApiData | null) => void;
  videoResults: any[];
  setVideoResults: (v: any[]) => void;
  videoLoading: boolean;
  setVideoLoading: (b: boolean) => void;
  videoError: string | null;
  setVideoError: (s: string | null) => void;
};

const StudyContext = createContext<StudyContextType | null>(null);

export function StudyProvider({ children }: { children: React.ReactNode }) {
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [uploading, setUploading] = useState(false);
  const [apiData, setApiData] = useState<ApiData | null>(null);

  const [videoResults, setVideoResults] = useState<any[]>([]);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  return (
    <StudyContext.Provider
      value={{
        fileInfo,
        setFileInfo,
        uploading,
        setUploading,
        apiData,
        setApiData,
        videoResults,
        setVideoResults,
        videoLoading,
        setVideoLoading,
        videoError,
        setVideoError,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
}

export function useStudy() {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error("useStudy must be used inside StudyProvider");
  return ctx;
}
