import React from "react";

export default function UploadCard({ file, setFile, onGenerate, loading }) {
  return (
    <div className="upload-wrap card">
      <div className="upload-inner">
        <div className="upload-icon">
          
        </div>
        <div style={{fontWeight:700,fontSize:18}}>Upload Your PDF</div>
        <div className="subtle">We’ll create a study pack: summary, flashcards, and quiz</div>
        <label className="btn">
          <input
            type="file"
            accept="application/pdf"
            onChange={e => setFile(e.target.files?.[0] || null)}
            hidden
          />
          Tap to choose or Drag & Drop
        </label>
        {file && <div className="small">Selected: {file.name}</div>}

        {/* Single action: build everything */}
        <button
          onClick={onGenerate}
          disabled={loading || !file}
          style={{
            width: "100%",
            marginTop: 18,
            padding: "18px 0",
            borderRadius: 999,
            background: "#2563EB",
            color: "#F8FAFF",
            fontSize: 16,
            fontWeight: 700,
            border: "none",
            cursor: loading || !file ? "not-allowed" : "pointer",
            opacity: loading || !file ? 0.7 : 1,
            transition: "all 0.25s ease",
            boxShadow:
              loading || !file
                ? "none"
                : "0 12px 28px rgba(37,99,235,0.35)",
          }}
        >
          {loading ? "Generating…" : "Generate Study Materials"}
        </button>
        
      </div>
    </div>
  );
}

