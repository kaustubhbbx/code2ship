# DURA - AI Executive Assistant

A production-quality, AI-powered executive assistant that prevents users from missing deadlines, assignments, interviews, meetings, and important commitments through proactive prediction, intelligent prioritization, and autonomous scheduling.

Featuring a premium, high-contrast **Black, White, and Orange** minimalist interface and powered by the latest **Google Gemini 3.1 Flash Lite** model.

---

## 🎯 Key Features

1. **Natural Language Task Capture**: Describe commitments in natural language. The AI automatically extracts titles, deadlines, duration, complexity, and urgency levels.
2. **Intelligent Deadline Risk Engine**: Every task receives an AI-analyzed risk score (0-100) taking into account deadline proximity, estimated effort, complexity, and current calendar load.
3. **Automated AI Planning**: Dynamically converts complex commitments into structured, step-by-step execution plans with individual time estimates.
4. **Smart Scheduler**: Analyzes active tasks and deadlines to generate optimized daily work schedules.
5. **Executive Dashboard**: A premium, dark-mode dashboard showing Today's Priorities, Risk Overview, Upcoming Deadlines, and a Daily morning summary.
6. **Real-time AI Assistant**: Chat with your virtual productivity coach at `/assistant` for priority reviews, schedule adjustments, and motivation.

---

## 💻 Tech Stack

*   **Frontend**: Next.js 16, TypeScript, Tailwind CSS 4, Framer Motion
*   **Backend**: Supabase (PostgreSQL, Auth, Realtime)
*   **AI Engine**: Google Gemini 3.1 Flash Lite (via `@google/generative-ai`)
*   **Theme**: High-end minimalist black `#000000` background, dark charcoal surfaces, white text, and vibrant orange `#FF6600` accents.

---

## 🚀 Quick Start

### Prerequisites
*   Node.js 18+
*   Supabase Account & Database
*   Google AI Studio API Key (Gemini)

### Installation

1. **Clone the repository and install dependencies:**
   ```bash
   git clone https://github.com/kaustubhbbx/code2ship.git
   cd code2ship
   npm install
   ```

2. **Configure environment variables:**
   Copy `.env.local.example` to `.env.local` and fill in your keys:
   ```bash
   cp .env.local.example .env.local
   ```
   *   `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
   *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous API key.
   *   `GOOGLE_AI_API_KEY`: Your Gemini API key from Google AI Studio.

3. **Initialize the Database:**
   *   Copy the SQL script from `supabase/migrations/001_init_schema.sql`.
   *   Go to your **Supabase Dashboard** → **SQL Editor**.
   *   Create a new query, paste the script, and click **Run** to set up tables, relationships, and Row Level Security (RLS) policies.

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📁 Repository Structure

```
├── src/
│   ├── app/
│   │   ├── api/ai/             # API routes for AI risk, plan, and schedule generation
│   │   ├── api/assistant/      # Real-time chat assistant route
│   │   ├── api/auth/           # User authentication endpoints
│   │   ├── assistant/          # Real-time coach view
│   │   ├── auth/               # Signup, Login, and Verify views
│   │   ├── briefings/          # Daily morning briefing history
│   │   ├── calendar/           # Visual commitments calendar
│   │   ├── dashboard/          # Main executive dashboard
│   │   ├── settings/           # User preferences and AI configuration
│   │   ├── tasks/              # Detailed task view and task lists
│   │   └── globals.css         # Custom CSS tokens & black-white-orange variables
│   ├── components/             # Reusable UI widgets (Priorities, Deadlines, etc.)
│   ├── lib/                    # Supabase client helpers & Gemini AI configurations
│   └── types/                  # Shared Zod schemas & TypeScript types
├── supabase/                   # Schema migrations
├── vercel.json                 # Vercel deployment configuration
├── tailwind.config.ts          # Tailwind 4 extended configuration
└── tsconfig.json               # TypeScript configuration
```

---

## ⚡ API Endpoints

*   `POST /api/ai/extract-task` - Process natural language to structure a task.
*   `POST /api/ai/analyze-risk` - Calculate deadline risk scores.
*   `POST /api/ai/generate-plan` - Create step-by-step sub-plans.
*   `POST /api/ai/generate-schedule` - Build optimized calendar schedules.
*   `POST /api/ai/generate-briefing` - Compile the daily morning briefing.
*   `POST /api/assistant/chat` - Talk to the Gemini 3.5 Flash Lite assistant.

---

## ☁️ Deployment

This project is configured out-of-the-box for **Vercel** with the Next.js directory set at the root level.

1. Import your `code2ship` repository on Vercel.
2. Set your environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GOOGLE_AI_API_KEY`).
3. Deploy! Vercel will automatically build the Next.js project.

---

## 📄 License

This project is licensed under the MIT License.
