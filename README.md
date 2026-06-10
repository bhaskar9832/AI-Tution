https://github.com/user-attachments/assets/34d7b1e5-a192-44b5-b5ed-18a2d0f12150

# 🎓 AI-Tution: AI-Powered Learning Platform

**AI Tuition is an open-source AI-powered learning platform designed to help students understand topics more deeply and efficiently.** The platform allows users to upload PDFs or study materials and automatically generates useful learning resources such as mind maps, quizzes, flashcards, summaries, and other interactive study tools.

![Repository Info](https://img.shields.io/badge/Language-TypeScript%20|%20Python%20|%20JavaScript-blue)
![Stars](https://img.shields.io/github/stars/bhaskar9832/AI-Tution?style=flat-square)
![Open Issues](https://img.shields.io/github/issues/bhaskar9832/AI-Tution?style=flat-square)

---

## 📊 Project Overview

AI-Tution is a comprehensive educational platform built with a modern tech stack combining:

- **Frontend:** React + Vite (Web), React Native + Expo (Mobile)
- **Backend:** Flask + Python
- **AI/ML:** Google Gemini API for intelligent content generation
- **Database:** Supabase (PostgreSQL)
- **OCR:** Tesseract for scanning documents
- **PDF Processing:** PyMuPDF (fitz)

### Language Composition
- **TypeScript:** 55.2% - Frontend & mobile app logic
- **Python:** 28.4% - Backend processing & AI integration
- **JavaScript:** 13.8% - Styling, configuration, utilities
- **CSS:** 2.1% - Styling
- **Other:** 0.5% - Configuration & misc

### 🎯 Core Features
- 📄 PDF upload and processing (digital & scanned documents)
- 🧠 AI-powered content analysis with Gemini API
- ✨ Auto-generated study materials:
  - Comprehensive summaries with key points
  - Interactive flashcards
  - Quiz questions with explanations
  - Mind maps for visual learning
  - Recommended YouTube educational videos
- 🎬 Video recommendations based on topics
- 📱 Cross-platform support (Web & Mobile)
- 🔐 User authentication with Supabase
- 📊 User dashboard with progress tracking

---

## 📁 Project Structure

```
AI-Tution/
│
├── backend/                          # Flask Backend API
│   ├── app.py                        # Main Flask application (~56KB)
│   ├── app1.py                       # Alternative/helper Flask app (~35KB)
│   ├── lma.py                        # Language model utility
│   ├── one.py                        # Utility script
│   ├── requirements.txt              # Python dependencies
│   ├── .env                          # Environment variables (API keys)
│   ├── dockerfile                    # Docker container setup
│   ├── docker-compose.yml            # Docker Compose configuration
│   └── my-expo-app/                  # React Native Expo project
│       └── [Expo configuration files]
│
├── frontend/                         # Web Frontend (React + Vite)
│   └── AITUTION/                     # Main React application
│       ├── src/                      # React source code
│       │   ├── components/           # React components
│       │   ├── assets/               # Images, icons, static files
│       │   ├── App.jsx               # Main App component
│       │   ├── App.css               # App styling
│       │   ├── main.jsx              # React entry point
│       │   ├── index.css             # Global styles
│       │   ├── style.css             # Additional styling
│       │   └── supabase.js           # Supabase client configuration
│       ├── public/                   # Static public assets
│       ├── android/                  # Android build files (Capacitor)
│       ├── package.json              # NPM dependencies
│       ├── vite.config.js            # Vite configuration
│       ├── capacitor.config.json     # Capacitor (hybrid mobile) config
│       ├── eslint.config.js          # ESLint configuration
│       ├── index.html                # HTML entry point
│       └── README.md                 # Frontend documentation
│
├── studyai/                          # React Native Mobile App (Expo)
│   ├── app/                          # Expo Router app directory (file-based routing)
│   │   ├── index.tsx                 # Home/main screen
│   │   ├── _layout.tsx               # Root layout wrapper
│   │   ├── home.tsx                  # Home screen component
│   │   ├── summary.tsx               # Summary view screen
│   │   ├── quiz.tsx                  # Quiz mode screen
│   │   ├── mock-test.tsx             # Mock test screen
│   │   ├── flashcards.tsx            # Flashcards study tool
│   │   ├── mindmap.tsx               # Mind map visualization
│   │   ├── videos.tsx                # Video recommendations
│   │   ├── revision-quiz.tsx         # Revision quiz screen
│   │   ├── ask.tsx                   # Q&A interface
│   │   ├── profile.tsx               # User profile screen
│   │   ├── auth/                     # Authentication screens
│   │   ├── dashboard/                # Dashboard screens
│   │   └── user-dashboard/           # User-specific dashboard
│   ├── lib/                          # Utility functions & helpers
│   ├── assets/                       # Images, fonts, media
│   ├── StudyContext.tsx              # React Context for state management
│   ├── app.json                      # Expo app configuration
│   ├── eas.json                      # EAS (Expo Application Services) config
│   ├── package.json                  # NPM dependencies
│   ├── tsconfig.json                 # TypeScript configuration
│   ├── eslint.config.js              # ESLint setup
│   └── README.md                     # Mobile app documentation
│
├── README.md                         # Project README
├── DETAILED_README.md                # This file
└── .gitignore

```

---

## 🛠️ Technology Stack

### Backend
```
Framework:     Flask (Python web framework)
PDF Processing: PyMuPDF (fitz), pytesseract
OCR:           Tesseract OCR
AI:            Google Generative AI (Gemini API)
Database:      Supabase (PostgreSQL)
API Requests:  requests library
Deployment:    Gunicorn, Docker
```

### Frontend (Web)
```
Framework:     React 19.1.1
Build Tool:    Vite 7.1.7
Styling:       Tailwind CSS, CSS modules
Routing:       React Router DOM 7.11.0
State Mgmt:    Context API
Database:      Supabase JS client 2.87.1
Hybrid Mobile: Capacitor 7.4.4
```

### Mobile App
```
Framework:     React Native (Expo) 54.0.25
Language:      TypeScript
Routing:       Expo Router (file-based)
State Mgmt:    React Context (StudyContext.tsx)
Auth:          Firebase + Supabase
Database:      Supabase
UI Icons:      Expo Vector Icons, Lucide React Native
Navigation:    React Navigation
Charts:        react-native-chart-kit, react-native-gifted-charts
Animations:    React Native Reanimated, Expo Haptics
Gesture:       React Native Gesture Handler
```

---

## 📋 Backend Dependencies

Located in `backend/requirements.txt`:

```
Flask              - Web framework
flask-cors         - CORS support for cross-origin requests
python-dotenv      - Environment variable management
Pillow             - Image processing
pytesseract        - Python wrapper for Tesseract OCR
PyMuPDF            - PDF text extraction (fitz)
google-genai       - Google Gemini API client
requests           - HTTP library
supabase           - Supabase Python client
graphviz           - Graph visualization (mindmap generation)
gunicorn           - Production WSGI server
```

---

## 🎯 Key Endpoints & Features

### Backend (Flask API)
The `app.py` main file provides endpoints for:
- PDF upload and text extraction
- OCR processing for scanned documents
- AI-powered content generation (summaries, flashcards, quizzes)
- Mind map generation
- Video recommendations
- User data management
- Authentication & authorization

### Frontend Web Application (AITUTION)
- Dashboard for users
- PDF upload interface
- Real-time content generation display
- Study material viewer
- Progress tracking

### Mobile App (StudyAI)
**File-based routing structure:**
- `index.tsx` - App entry point
- `home.tsx` - Main home/dashboard screen
- `summary.tsx` - Study material summaries
- `quiz.tsx` - Quiz interface
- `mock-test.tsx` - Full-length mock tests
- `flashcards.tsx` - Flashcard study mode
- `mindmap.tsx` - Visual mind maps
- `videos.tsx` - Video recommendations
- `revision-quiz.tsx` - Quick revision quizzes
- `ask.tsx` - Q&A interface
- `profile.tsx` - User profile
- `auth/*` - Authentication flows
- `dashboard/*` - User dashboard
- `user-dashboard/*` - User-specific dashboards

---

## 🔧 Environment Configuration

### Backend `.env` file
```env
GEMINI_API_KEY=<your_google_gemini_api_key>
YOUTUBE_API_KEY=<your_youtube_api_key>
MINDMAP_API_KEY=<your_mindmap_service_api_key>
SUPABASE_URL=<your_supabase_project_url>
SUPABASE_SERVICE_ROLE_KEY=<your_supabase_service_role_key>
HOST=0.0.0.0
PORT=8000
DEBUG=1
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- Tesseract OCR installed
- Git

### Backend Setup

```bash
# Clone repository
git clone https://github.com/bhaskar9832/AI-Tution.git
cd AI-Tution/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Run Flask server
python app.py
# Server runs on http://localhost:8000
```

### Frontend Setup (Web)

```bash
cd ../frontend/AITUTION

# Install dependencies
npm install

# Start development server
npm run dev
# Open http://localhost:5173

# Build for production
npm run build
```

### Mobile App Setup (Expo)

```bash
cd ../studyai

# Install dependencies
npm install

# Start Expo development server
npm start

# Run on different platforms:
npm run android      # Android emulator
npm run ios          # iOS simulator
npm run web          # Web browser
expo start --web
```

### Docker Setup (Backend)

```bash
cd backend

# Build and run with Docker Compose
docker-compose up --build

# Alternatively with Docker only
docker build -t ai-tuition-backend .
docker run -p 8000:8000 ai-tuition-backend
```

---

## 📱 Features Breakdown

### Document Processing
- Upload PDF files (digital or scanned)
- Automatic text extraction using PyMuPDF
- OCR processing for scanned documents using Tesseract
- Multi-language support (OCR configurable)

### AI-Powered Content Generation
- **Summaries:** Concise summaries with key takeaways
- **Flashcards:** Auto-generated question-answer pairs
- **Quizzes:** Multiple choice and short answer questions
- **Mind Maps:** Visual concept relationships
- **Videos:** YouTube recommendations based on topics

### Study Tools
- **Quiz Mode:** Test knowledge with auto-generated questions
- **Mock Tests:** Full-length practice exams
- **Flashcard Learning:** Spaced repetition study
- **Mind Map Visualization:** Concept mapping
- **Video Learning:** Educational video recommendations
- **Revision Mode:** Quick review quizzes

### User Features
- User authentication (Firebase + Supabase)
- Personalized dashboard
- Progress tracking
- Study history
- Saved materials

---

## 🔐 Authentication

The application uses **Supabase** for:
- User authentication
- Database storage
- Real-time updates
- File storage

Firebase is also integrated for:
- Additional authentication methods
- Cloud storage
- Real-time database

---

## 🎨 UI/UX Stack

### Web Frontend
- **Framework:** React 19 with Hooks
- **Styling:** Tailwind CSS (utility-first CSS framework)
- **Routing:** React Router v7 for navigation
- **Icons:** Lucide React Icons
- **State Management:** React Context API

### Mobile App
- **Framework:** React Native with TypeScript
- **Navigation:** Expo Router (file-based routing)
- **Icons:** Expo Vector Icons + Lucide React Native
- **Charts:** react-native-chart-kit, react-native-gifted-charts
- **Animations:** React Native Reanimated
- **Styling:** StyleSheet, Custom components

---

## 📊 Data Flow

```
PDF Upload
    ↓
Backend Text Extraction (PyMuPDF)
    ↓
OCR Processing (Tesseract) [if scanned]
    ↓
Gemini AI Analysis
    ↓
Content Generation:
├── Summary Generation
├── Flashcard Creation
├── Quiz Generation
├── Mind Map Creation
└── Video Recommendations
    ↓
Store in Supabase
    ↓
Frontend Display
    ↓
User Studies with Interactive Tools
```

---

## 🏗️ Project Architecture

### Microservices Structure
```
┌─────────────────────────────────────────────┐
│         Frontend Layer                      │
├──────────────────┬──────────────────────────┤
│  Web (React)     │  Mobile (React Native)   │
│  (AITUTION)      │  (StudyAI)               │
└──────────────────┴──────────────────────────┘
           ↑                    ↑
           └────────────────────┘
                    ↓
      API Gateway (Flask Backend)
     http://localhost:8000
                    ↓
┌─────────────────────────────────────────────┐
│         Backend Services                    │
├─────────────────────────────────────────────┤
│  • PDF Processing (PyMuPDF)                 │
│  • OCR Service (Tesseract)                  │
│  • AI Service (Gemini API)                  │
│  • Mind Map Generation                      │
│  • Video Recommendations                    │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         Data Layer                          │
├─────────────────────────────────────────────┤
│  Supabase (PostgreSQL)                      │
│  • User data                                │
│  • Generated content                        │
│  • Study progress                           │
└─────────────────────────────────────────────┘
```

---

## 🔄 File Organization Patterns

### Backend Files
- `app.py` - Main Flask application with routes
- `app1.py` - Alternative/deprecated version or helper methods
- `lma.py` - Language model utilities
- `one.py` - Single utility function

### Frontend Components (React)
- `App.jsx` - Root application component
- `main.jsx` - React entry point
- `supabase.js` - Database client initialization
- CSS files - Component and global styling

### Mobile App Screens (Expo Router)
- Each `.tsx` file represents a route/screen
- `_layout.tsx` - Layout wrapper for nested routes
- `auth/` - Authentication-related screens
- `dashboard/` - Dashboard views
- `user-dashboard/` - User-specific views

---

## 📚 Key Concepts

### Expo Router
The mobile app uses **Expo Router** for file-based routing:
- Routes are defined by file structure
- `_layout.tsx` provides layout wrappers
- Deep linking supported
- Type-safe routing with TypeScript

### StudyContext
`StudyContext.tsx` provides global state management for:
- User study data
- Generated content
- Quiz results
- Study progress

### Supabase Integration
- Real-time database updates
- Authentication management
- File storage for documents
- Row-level security for data privacy

### Gemini API Integration
- Text analysis and summarization
- Content generation (quiz, flashcards)
- Key point extraction
- Topic identification for video recommendations

---

## 🚢 Deployment

### Backend Deployment
```bash
# Using Gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 app:app

# Using Docker
docker build -t ai-tuition-backend .
docker run -p 8000:8000 ai-tuition-backend
```

### Frontend Deployment
```bash
# Build for production
npm run build

# Deploy to Vercel, Netlify, or any static host
# Build output in dist/ folder
```

### Mobile App Deployment
```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to app stores
eas submit --platform ios
eas submit --platform android
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open-source. Check the repository for license details.

---

## 👥 Community & Support

- **GitHub:** [bhaskar9832/AI-Tution](https://github.com/bhaskar9832/AI-Tution)
- **Issues:** Report bugs and request features
- **Discussions:** Community discussions and Q&A

---

## 🎓 Learning Resources

This project demonstrates:
- Full-stack development with Python and JavaScript/TypeScript
- AI/ML integration with Google Gemini API
- Cross-platform mobile development with React Native
- Real-time database operations with Supabase
- PDF processing and OCR techniques
- RESTful API design with Flask
- Modern frontend development with React and Vite

---

## 📈 Project Status

- ✅ Core features implemented
- ✅ Multi-platform support (Web & Mobile)
- ✅ AI content generation working
- 🔄 Continuous improvements and feature additions
- 🔄 Community contributions welcome

---

**Last Updated:** June 10, 2026  
**Repository:** https://github.com/bhaskar9832/AI-Tution

---

## 🙏 Acknowledgments

- Google Gemini API for AI capabilities
- Supabase for backend infrastructure
- Expo for cross-platform mobile development
- React and Python communities

Then open 👉 [http://localhost:5173](http://localhost:5173)


