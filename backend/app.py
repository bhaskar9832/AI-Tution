#!/usr/bin/env python3
"""
Flask backend — PDF → Summary, Flashcards, Quiz, Ask Q&A, Mindmap (Graphviz), Video Recommendations

- Summaries, flashcards, quiz, Q&A: Gemini
- Video recommendations: YouTube Data API + Gemini (for key topics / fallback)
- Mindmap: Graphviz → PNG (base64), no external mindmap API
"""

from __future__ import annotations
import io
import os
import re
import json
import base64
import tempfile
import random
from typing import List, Dict, Any, Optional, Set

from flask import Flask, request, jsonify, abort
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

import fitz  # PyMuPDF
from PIL import Image
import pytesseract
from google import genai
import requests

# Graphviz (Python wrapper). Requires Graphviz system package ("dot" executable").
try:
    import graphviz
except ImportError:
    graphviz = None

# -------------------------------------------------------------------
# FLASK
# -------------------------------------------------------------------
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
app.config["MAX_CONTENT_LENGTH"] = 140 * 1024 * 1024

DEFAULT_DPI = 300
DEFAULT_MIN_CHAR_THRESHOLD = 40
LLM_TRIM_LIMIT = 120_000

# -------------------------------------------------------------------
# PDF extraction
# -------------------------------------------------------------------
def _ocr_page(page: fitz.Page, dpi: int = DEFAULT_DPI, lang: str = "eng") -> str:
    zoom = dpi / 72.0
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, alpha=False)
    img = Image.open(io.BytesIO(pix.tobytes("png")))
    return pytesseract.image_to_string(img, lang=lang).strip()


def extract_text(pdf_path: str, lang: str = "eng") -> str:
    """Hybrid text extraction: embedded text first, fallback to Tesseract OCR."""
    doc = fitz.open(pdf_path)
    pages: List[str] = []
    for page in doc:
        txt = page.get_text("text").strip()
        if len(txt) < DEFAULT_MIN_CHAR_THRESHOLD:
            txt = _ocr_page(page, dpi=DEFAULT_DPI, lang=lang)
        pages.append(txt)
    doc.close()
    return "\n\n".join(pages)

# -------------------------------------------------------------------
# Gemini helpers
# -------------------------------------------------------------------
def trim(text: str, limit: int = LLM_TRIM_LIMIT) -> str:
    if len(text) <= limit:
        return text
    return text[: limit // 2] + "\n\n...[truncated]...\n\n" + text[-limit // 2 :]


def robust_json(s: str):
    s = (s or "").strip()
    # strip ```json fences if present
    s = re.sub(r"^```(?:json)?\s*", "", s)
    s = re.sub(r"\s*```$", "", s)
    m = re.search(r"\{.*\}", s, flags=re.DOTALL)
    if not m:
        return None
    try:
        return json.loads(m.group(0))
    except Exception:
        return None


def generate_study_material(text: str, topic: Optional[str]) -> dict:
    """Ask Gemini to create summary + key_topics + key_points + flashcards + quiz."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {}

    client = genai.Client(api_key=api_key)

    prompt = f"""
You are a teaching assistant. Produce STRICT JSON only (no commentary, no markdown fences).

Schema:
{{
  "summary": "string",
  "key_topics": ["string"],
  "key_points": ["string"],
  "flashcards": [{{"front": "string","back": "string"}}],
  "quiz": [
    {{
      "question": "string",
      "options": ["string"],
      "answer": "string",
      "explanation": "string"
    }}
  ]
}}

Rules:
- key_topics: 3–8 concise topic tags.
- key_points: 5–8 short, concrete bullets.
- Avoid duplicates and empty strings.
- Each quiz question: 3–5 options, exactly one correct.
- Difficulty: medium by default.

Topic hint: {topic or "none"}

DOCUMENT:
{trim(text)}
"""

    resp = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )
    data = robust_json(getattr(resp, "text", "") or "") or {}
    return data

# -------------------------------------------------------------------
# YouTube recommendations (YouTube Data API + Gemini key topics)
# -------------------------------------------------------------------

YOUTUBE_API_URL_SEARCH = "https://www.googleapis.com/youtube/v3/search"
YOUTUBE_API_URL_VIDEOS = "https://www.googleapis.com/youtube/v3/videos"
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")


def parse_iso8601_duration(duration: Optional[str]) -> int:
    """
    Convert ISO 8601 duration (e.g. 'PT5M30S') to seconds.
    Returns 0 if parsing fails or duration is missing.
    """
    if not duration:
        return 0
    m = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", duration)
    if not m:
        return 0
    hours = int(m.group(1) or 0)
    minutes = int(m.group(2) or 0)
    seconds = int(m.group(3) or 0)
    return hours * 3600 + minutes * 60 + seconds


def gemini_key_points_from_text(text: str, max_points: int = 5) -> List[str]:
    """
    Use Gemini to extract up to `max_points` short learning topics from the user text.
    Returns a list of short phrases. If Gemini is not configured, returns [].
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or not text.strip():
        return []

    client = genai.Client(api_key=api_key)

    prompt = f"""
    Extract {max_points} short, distinct key learning topics from the following text.
    Return them as a plain list, one per line, no numbering, no bullets, no extra commentary.

    Text:
    {text}
    """

    try:
        resp = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
    except Exception as e:
        print("Gemini error while extracting key points:", e)
        return []

    raw = (getattr(resp, "text", "") or "").strip()
    if not raw:
        return []

    lines = [ln.strip("-• ").strip() for ln in raw.splitlines() if ln.strip()]

    # dedupe and limit
    seen = set()
    out: List[str] = []
    for ln in lines:
        low = ln.lower()
        if low not in seen:
            seen.add(low)
            out.append(ln)
        if len(out) >= max_points:
            break
    return out


def fetch_youtube_videos(
    query: str, max_results: int = 6, api_key: Optional[str] = None
) -> List[Dict]:
    """
    Search YouTube for `query`, return list of videos including:
    videoId, title, channelTitle, thumbnail, publishedAt, description,
    duration, viewCount, statistics (with likeCount if available).
    """
    if not api_key:
        return []

    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "maxResults": max_results,
        "key": api_key,
        "relevanceLanguage": "en",
    }
    r = requests.get(YOUTUBE_API_URL_SEARCH, params=params, timeout=15)
    r.raise_for_status()
    items = r.json().get("items", [])
    if not items:
        return []

    video_ids = ",".join(
        [it["id"]["videoId"] for it in items if it.get("id", {}).get("videoId")]
    )
    if not video_ids:
        return []

    vparams = {
        "part": "contentDetails,statistics",
        "id": video_ids,
        "key": api_key,
    }
    vr = requests.get(YOUTUBE_API_URL_VIDEOS, params=vparams, timeout=15)
    vr.raise_for_status()
    vmap = {v["id"]: v for v in vr.json().get("items", [])}

    videos: List[Dict] = []
    for it in items:
        vid = it.get("id", {}).get("videoId")
        snippet = it.get("snippet", {}) or {}
        details = vmap.get(vid) or {}
        stats = details.get("statistics") or {}
        video_obj: Dict = {
            "videoId": vid,
            "title": snippet.get("title"),
            "channelTitle": snippet.get("channelTitle"),
            "thumbnail": snippet.get("thumbnails", {}).get("high", {}).get("url")
            or snippet.get("thumbnails", {}).get("default", {}).get("url"),
            "publishedAt": snippet.get("publishedAt"),
            "description": snippet.get("description"),  # used for relevance filter
            "duration": (details.get("contentDetails") or {}).get("duration"),
            "viewCount": stats.get("viewCount"),
            "likeCount": stats.get("likeCount"),
            "statistics": stats,
        }
        videos.append(video_obj)
    return videos


CURATED_VIDEOS: Dict[str, List[Dict]] = {
    "machine learning": [
        {
            "videoId": "GwIo3gDZCVQ",
            "title": "Machine Learning by Andrew Ng (full course)",
            "channelTitle": "Stanford",
            "thumbnail": "https://i.ytimg.com/vi/GwIo3gDZCVQ/hqdefault.jpg",
            "duration": "PT2H30M",
            "viewCount": "1200000",
            "likeCount": "0",
            "statistics": {"likeCount": "0"},
        },
        {
            "videoId": "Gv9_4yMHFhI",
            "title": "Intro to Machine Learning - Crash Course",
            "channelTitle": "CrashCourse",
            "thumbnail": "https://i.ytimg.com/vi/Gv9_4yMHFhI/hqdefault.jpg",
            "duration": "PT12M",
            "viewCount": "350000",
            "likeCount": "0",
            "statistics": {"likeCount": "0"},
        },
    ],
    "neural networks": [
        {
            "videoId": "aircAruvnKk",
            "title": "Neural Networks Explained in 20 Minutes",
            "channelTitle": "AI Simplified",
            "thumbnail": "https://i.ytimg.com/vi/aircAruvnKk/hqdefault.jpg",
            "duration": "PT20M15S",
            "viewCount": "850000",
            "likeCount": "0",
            "statistics": {"likeCount": "0"},
        }
    ],
}


def curated_for_query(query: str, max_results: int = 6) -> List[Dict]:
    """
    Fallback when YouTube API key missing or API fails.
    Picks from a small curated catalog.
    """
    if not query:
        out: List[Dict] = []
        for arr in CURATED_VIDEOS.values():
            out.extend(arr)
            if len(out) >= max_results:
                break
        random.shuffle(out)
        return out[:max_results]

    q = query.lower()
    for topic, vids in CURATED_VIDEOS.items():
        if topic in q:
            return vids[:max_results]

    out: List[Dict] = []
    for arr in CURATED_VIDEOS.values():
        out.extend(arr)
        if len(out) >= max_results:
            break
    random.shuffle(out)
    return out[:max_results]

# -------------------------------------------------------------------
# Mindmap: Graphviz → PNG (base64)
# -------------------------------------------------------------------
def build_mindmap(summary: str, key_topics: List[str], key_points: List[str]) -> Dict[str, Any]:
    """
    Build a simple left-to-right mind map using Graphviz.
    """
    if graphviz is None:
        return {
            "error": "Graphviz Python package is not installed.",
            "details": "Run 'pip install graphviz' and install Graphviz system binary (dot).",
        }

    root_title = (key_topics[0] if key_topics else summary.split("\n")[0]).strip() or "Mind Map"

    try:
        dot = graphviz.Digraph(comment=root_title, format="png")

        # Landscape + higher resolution
        dot.attr(rankdir="LR")  # left-to-right
        dot.graph_attr.update(
            dpi="300",          # bump DPI so it looks crisp when zoomed
            size="12,7!",       # ~12x7 inches canvas
            ratio="compress",
        )

        dot.node("root", root_title, shape="box", style="filled", fillcolor="#1D4ED8", fontcolor="white")

        # Create topic nodes
        topic_ids: List[str] = []
        for i, topic in enumerate(key_topics):
            tid = f"t{i}"
            topic_ids.append(tid)
            dot.node(tid, topic, shape="box", style="filled", fillcolor="#BFDBFE")
            dot.edge("root", tid)

        # Attach key points round-robin under topics (or root if no topics)
        if key_points:
            for j, point in enumerate(key_points):
                pid = f"p{j}"
                label = point
                dot.node(pid, label, shape="note", style="filled", fillcolor="#EFF6FF")
                if topic_ids:
                    parent_id = topic_ids[j % len(topic_ids)]
                else:
                    parent_id = "root"
                dot.edge(parent_id, pid)

        # Always ensure graph has at least root
        if not key_topics and not key_points:
            dot.node("empty", "No topics / key points found", shape="note")

        png_bytes = dot.pipe(format="png")

        img = Image.open(io.BytesIO(png_bytes))
        width, height = img.size

        b64 = base64.b64encode(png_bytes).decode("ascii")

        structure = {
            "root": root_title,
            "topics": key_topics,
            "points_by_topic": {},
        }
        if key_topics and key_points:
            for idx, t in enumerate(key_topics):
                structure["points_by_topic"][t] = []
            for idx, p in enumerate(key_points):
                if key_topics:
                    t = key_topics[idx % len(key_topics)]
                    structure["points_by_topic"][t].append(p)

        return {
            "topic": root_title,
            "image_base64": b64,
            "mime": "image/png",
            "width": width,
            "height": height,
            "structure": structure,
        }

    except graphviz.backend.ExecutableNotFound as e:
        return {
            "error": "Graphviz 'dot' executable not found.",
            "details": str(e),
        }
    except Exception as e:
        return {
            "error": "Failed to build mindmap.",
            "details": str(e),
        }

# -------------------------------------------------------------------
# ENDPOINTS
# -------------------------------------------------------------------
@app.post("/api/study_material")
def study_material():
    """
    Input:
      multipart/form-data:
        - file: PDF
        or
        - text: raw text
        + optional: topic
    Output:
      {
        "text": "...",
        "summary": "...",
        "key_topics": [...],
        "key_points": [...],
        "flashcards": [...],
        "quiz": [...],
        "notes": "..."
      }
    """
    pdf_file = request.files.get("file")
    incoming_text = request.form.get("text")
    topic = request.form.get("topic")

    if not pdf_file and not incoming_text:
        return abort(400, "Provide file or text")

    if pdf_file:
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=True) as tmp:
            pdf_file.save(tmp.name)
            text = extract_text(tmp.name)
    else:
        text = incoming_text or ""

    notes = None
    data = {}
    try:
        data = generate_study_material(text, topic)
    except Exception as e:
        print("Gemini study_material failed:", e)
        notes = str(e)

    return jsonify(
        {
            "text": text,
            "summary": data.get("summary", ""),
            "key_topics": data.get("key_topics", []) or [],
            "key_points": data.get("key_points", []) or [],
            "flashcards": data.get("flashcards", []) or [],
            "quiz": data.get("quiz", []) or [],
            "notes": notes,
        }
    )


@app.post("/api/recommend_videos")
def recommend_videos():
    """
    Recommend educational YouTube videos.

    Input (JSON or form):
      - key_topics: optional list of short topics (preferred)
      - key_points: optional list of short topics (fallback)
      - query / text: free text; if no keywords, Gemini will extract topics from this
      - max_results: optional int (default: 6)

    Output:
      { "videos": [ { videoId, title, url, thumbnail, matched_keyword, ... }, ... ] }

    Rules:
      - Only videos >= 2 minutes.
      - If keywords are provided:
          * At most ONE video per keyword (topic), in that keyword order.
          * For each keyword we pick the most-liked candidate.
          * Extra videos (not matched to any keyword) are appended, sorted by likeCount.
      - If no keywords:
          * Just return top videos by likeCount (still >= 2 minutes).
    """
    data = request.get_json(silent=True) or request.form or {}
    max_results = int(data.get("max_results") or 6)

    # 1) Read key_topics first, then key_points as fallback
    key_topics = data.get("key_topics")
    key_points = data.get("key_points")

    kp_list: List[str] = []
    if isinstance(key_topics, list) and len(key_topics) > 0:
        kp_list = [str(k).strip() for k in key_topics if str(k).strip()]
    elif isinstance(key_points, list) and len(key_points) > 0:
        kp_list = [str(k).strip() for k in key_points if str(k).strip()]

    # Limit how many topics we use (to avoid tons of API calls)
    if len(kp_list) > 8:
        kp_list = kp_list[:8]

    # 2) If no keywords, fall back to query/text and let Gemini derive them
    query_str = (data.get("query") or data.get("text") or "").strip()

    if not kp_list and query_str:
        gemini_topics = gemini_key_points_from_text(query_str, max_points=5)
        if gemini_topics:
            kp_list = gemini_topics
            print("Gemini-derived key_points:", kp_list)

    youtube_key = YOUTUBE_API_KEY

    # Helper: generate educational query variants for one topic
    def _variants_for_phrase(phrase: str) -> List[str]:
        p = phrase.strip()
        if not p:
            return []
        base = p.lower()
        return [
            f"{base} tutorial",
            f"{base} explained",
            f"{base} lecture",
            f"{base} crash course",
            f"{base} for beginners",
            f"{base} overview",
            f"{base} full course",
        ]

    # Relevance filter for titles/descriptions
    KEEP = [
        "tutorial",
        "course",
        "lesson",
        "lecture",
        "explained",
        "learn",
        "introduction",
        "guide",
        "how to",
        "overview",
        "crash course",
    ]
    BAN = ["funny", "shorts", "reaction", "music", "meme", "song", "asmr", "review (unboxing)"]

    def _is_relevant(video_obj: Dict) -> bool:
        title = (video_obj.get("title") or "").lower()
        desc = (video_obj.get("description") or "").lower()
        text = f"{title} {desc}"
        if any(b in text for b in BAN):
            return False
        return any(k in text for k in KEEP)

    # Like-count helper
    def _likecount_key(v: Dict) -> int:
        stats = v.get("statistics") or {}
        lc = stats.get("likeCount") or v.get("likeCount")
        try:
            return int(lc)
        except Exception:
            return 0

    MIN_SECONDS = 120  # 2 minutes

    # If YouTube API is not configured, use curated fallback
    if not youtube_key:
        fallback_query = query_str or (", ".join(kp_list) if kp_list else "")
        vids = curated_for_query(fallback_query, max_results=max_results * 2)
        # duration filter for curated
        long_enough = []
        for v in vids:
            seconds = parse_iso8601_duration(v.get("duration"))
            if seconds >= MIN_SECONDS:
                long_enough.append(v)
        if not long_enough:
            long_enough = vids
        long_enough.sort(key=_likecount_key, reverse=True)
        result = []
        for v in long_enough[:max_results]:
            v = dict(v)
            v["matched_keyword"] = None
            if v.get("videoId") and not v.get("url"):
                v["url"] = f"https://www.youtube.com/watch?v={v['videoId']}"
            result.append(v)
        return jsonify({"videos": result})

    # ------------------------------------------------------------------
    # MAIN LOGIC WITH YOUTUBE API
    # ------------------------------------------------------------------

    all_videos_by_id: Dict[str, Dict] = {}

    # Helper: apply duration + relevance filters
    def _filter_candidates(items: List[Dict]) -> List[Dict]:
        out: List[Dict] = []
        for v in items:
            if not v.get("videoId"):
                continue
            # duration filter
            seconds = parse_iso8601_duration(v.get("duration"))
            if seconds < MIN_SECONDS:
                continue
            # relevance filter
            if not _is_relevant(v):
                continue
            out.append(v)
        return out

    if kp_list:
        # ---------- ONE VIDEO PER KEYWORD/TOPIC ----------
        used_ids: Set[str] = set()
        keyword_best: Dict[str, Dict] = {}

        for kw in kp_list:
            if not kw.strip():
                continue

            candidates: List[Dict] = []
            # Try a few query variants for this keyword
            for q in _variants_for_phrase(kw):
                try:
                    items = fetch_youtube_videos(q, max_results=6, api_key=youtube_key) or []
                except Exception as e:
                    print("YouTube fetch error for query:", q, str(e))
                    continue

                # Store raw videos globally (for leftovers later)
                for v in items:
                    vid = v.get("videoId")
                    if not vid:
                        continue
                    if vid not in all_videos_by_id:
                        all_videos_by_id[vid] = v

                # Filter for this keyword
                candidates.extend(_filter_candidates(items))

                # Don't over-fetch per keyword
                if len(candidates) >= 12:
                    break

            if not candidates:
                # no good candidates for this keyword
                continue

            # Deduplicate by id
            uniq: Dict[str, Dict] = {}
            for v in candidates:
                vid = v.get("videoId")
                if vid and vid not in uniq:
                    uniq[vid] = v

            # Pick the most-liked candidate for this keyword that isn't used yet
            best: Optional[Dict] = None
            for v in uniq.values():
                vid = v.get("videoId")
                if not vid or vid in used_ids:
                    continue
                if best is None or _likecount_key(v) > _likecount_key(best):
                    best = v

            if best is not None:
                vid = best.get("videoId")
                used_ids.add(vid)
                keyword_best[kw] = best

        # Build final result in exact keyword order
        result: List[Dict] = []
        for kw in kp_list:
            v = keyword_best.get(kw)
            if not v:
                continue
            v = dict(v)
            v["matched_keyword"] = kw
            if v.get("videoId") and not v.get("url"):
                v["url"] = f"https://www.youtube.com/watch?v={v['videoId']}"
            result.append(v)

        # Fill remaining slots with leftover videos sorted by likeCount
        if len(result) < max_results:
            leftovers: List[Dict] = []
            # collect leftovers from all_videos_by_id
            for vid, v in all_videos_by_id.items():
                if vid in {rv["videoId"] for rv in result if rv.get("videoId")}:
                    continue
                # apply duration + relevance for leftovers as well
                seconds = parse_iso8601_duration(v.get("duration"))
                if seconds < MIN_SECONDS:
                    continue
                if not _is_relevant(v):
                    continue
                leftovers.append(v)

            leftovers.sort(key=_likecount_key, reverse=True)
            for v in leftovers:
                if len(result) >= max_results:
                    break
                vv = dict(v)
                vv["matched_keyword"] = None
                if vv.get("videoId") and not vv.get("url"):
                    vv["url"] = f"https://www.youtube.com/watch?v={vv['videoId']}"
                result.append(vv)

    else:
        # ---------- NO KEYWORDS: just return top-liked educational videos ----------
        collected: List[Dict] = []

        search_queries: List[str] = []
        if query_str:
            search_queries = _variants_for_phrase(query_str) or [query_str]
        else:
            # nothing to search for → curated
            vids = curated_for_query("", max_results=max_results * 2)
            long_enough = [v for v in vids if parse_iso8601_duration(v.get("duration")) >= MIN_SECONDS]
            if not long_enough:
                long_enough = vids
            long_enough.sort(key=_likecount_key, reverse=True)
            result = []
            for v in long_enough[:max_results]:
                v = dict(v)
                v["matched_keyword"] = None
                if v.get("videoId") and not v.get("url"):
                    v["url"] = f"https://www.youtube.com/watch?v={v['videoId']}"
                result.append(v)
            return jsonify({"videos": result})

        for q in search_queries:
            try:
                items = fetch_youtube_videos(q, max_results=6, api_key=youtube_key) or []
            except Exception as e:
                print("YouTube fetch error for query:", q, str(e))
                continue
            collected.extend(_filter_candidates(items))
            if len(collected) >= max_results * 4:
                break

        # dedupe
        uniq: Dict[str, Dict] = {}
        for v in collected:
            vid = v.get("videoId")
            if vid and vid not in uniq:
                uniq[vid] = v

        videos = list(uniq.values())
        if not videos:
            vids = curated_for_query(query_str, max_results=max_results * 2)
            long_enough = [v for v in vids if parse_iso8601_duration(v.get("duration")) >= MIN_SECONDS]
            if not long_enough:
                long_enough = vids
            videos = long_enough

        videos.sort(key=_likecount_key, reverse=True)
        result = []
        for v in videos[:max_results]:
            v = dict(v)
            v["matched_keyword"] = None
            if v.get("videoId") and not v.get("url"):
                v["url"] = f"https://www.youtube.com/watch?v={v['videoId']}"
            result.append(v)

    # Final safety slice
    result = result[:max_results]
    print("Final video list:", result)
    return jsonify({"videos": result})


@app.post("/api/ask_question")
def ask_question():
    """
    Input JSON:
      { "text": "...", "question": "..." }

    Output:
      { "answer": "..." }
    """
    data = request.get_json(silent=True) or {}
    text = (data.get("text") or "").strip()
    question = (data.get("question") or "").strip()

    if not text or not question:
        return jsonify({"error": "Missing text or question"}), 400

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return jsonify({"error": "GEMINI_API_KEY not set"}), 500

    client = genai.Client(api_key=api_key)
    prompt = (
        "Answer the question using ONLY the PDF text below.\n\n"
        f"Question: {question}\n\n"
        f"PDF TEXT:\n{trim(text)[:40000]}"
    )

    try:
        resp = client.models.generate_content(
            model=data.get("model", "gemini-2.5-flash"),
            contents=prompt,
        )
        answer = getattr(resp, "text", "").strip() or "No answer found."
        return jsonify({"answer": answer})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.post("/api/mindmap")
def mindmap():
    """
    Input JSON:
      { "summary": "...", "key_topics": [...], "key_points": [...] }
    """
    data = request.get_json(silent=True) or {}
    summary = data.get("summary") or ""
    key_topics = data.get("key_topics") or []
    key_points = data.get("key_points") or []

    result = build_mindmap(summary, key_topics, key_points)
    return jsonify(result)

# -------------------------------------------------------------------
# MAIN
# -------------------------------------------------------------------
if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    debug = os.getenv("DEBUG", "0").lower() in ("1", "true", "on")

    print("\n==== FLASK ROUTES ====")
    for rule in app.url_map.iter_rules():
        print(rule.endpoint, rule.rule, list(rule.methods))
    print("=======================\n")
    print(f"Backend running → http://{host}:{port}")
    app.run(host=host, port=port, debug=debug)
