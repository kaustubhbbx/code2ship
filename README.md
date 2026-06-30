# DURA - AI Executive Assistant

A production-quality AI-powered executive assistant that prevents users from missing deadlines, assignments, interviews, meetings, and important commitments through proactive prediction, intelligent prioritization, and autonomous scheduling.

## Features

### 🎯 Core Features

1. **Natural Language Task Capture** - Users can describe tasks naturally and the AI automatically extracts titles, deadlines, duration, complexity, and urgency.

2. **Deadline Risk Engine** - Every task receives an AI-analyzed risk score (0-100) considering deadline proximity, estimated effort, complexity, and calendar load.

3. **AI Planning Engine** - Tasks are automatically converted into detailed execution plans with step-by-step breakdowns.

4. **Intelligent Scheduling** - The system analyzes tasks and deadlines to generate optimized work schedules.

5. **Executive Dashboard** - Premium dashboard with AI Briefing, Today's Priorities, Risk Overview, and Upcoming Deadlines.

6. **Daily Executive Briefing** - AI-generated morning summaries with recommended actions.

7. **AI Executive Assistant** - Real-time chat-based productivity coach.

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **AI**: Google Gemini Flash 1.5

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Google AI API key

### Installation

1. Install dependencies
```bash
npm install
```

2. Configure environment variables
```bash
cp .env.local.example .env.local
# Edit .env.local with your credentials
```

3. Setup Supabase
- Go to Supabase Dashboard → SQL Editor
- Create new query and paste `supabase/migrations/001_init_schema.sql`
- Execute to create all tables and RLS policies

4. Start development server
```bash
npm run dev
```

Visit `http://localhost:3000`

## Project Structure

```
src/
├── app/
│   ├── api/ai/              # AI endpoints
│   ├── auth/                # Auth pages
│   ├── dashboard/           # Main dashboard
│   ├── tasks/               # Task management
│   ├── calendar/            # Calendar view
│   ├── briefings/           # Daily briefings
│   ├── assistant/           # AI assistant
│   └── settings/            # Settings
├── components/dashboard/    # Dashboard components
├── lib/
│   ├── ai.ts                # AI operations
│   ├── db.ts                # Database queries
│   └── supabase.ts          # Supabase clients
└── types/                   # TypeScript types
```

## Usage

### Create Tasks
- **Manual**: Click "+ New Task"
- **AI Extraction**: Use natural language
- **Assistant**: Ask the AI to create

### Dashboard
View priorities, risk analysis, upcoming deadlines, and AI recommendations.

### Risk Scoring
Tasks receive scores (0-100):
- **Low (0-30)**: Manageable
- **Medium (31-70)**: Plan ahead
- **High (71-100)**: Urgent

### AI Assistant
Chat-based coach at `/assistant` for priority analysis and scheduling.

## API Endpoints

- `POST /api/ai/extract-task` - Extract from natural language
- `POST /api/ai/analyze-risk` - Analyze task risk
- `POST /api/ai/generate-plan` - Generate execution plan
- `POST /api/ai/generate-schedule` - Generate smart schedule
- `POST /api/ai/generate-briefing` - Generate daily briefing
- `POST /api/assistant/chat` - Chat with AI

## Database

All tables include Row Level Security (RLS) policies. Users can only access their own data.

## Design

- **Premium dark theme** (#0B0F14 background)
- **Smooth animations** (Framer Motion)
- **Professional aesthetic** - no playful elements
- **Production-ready** components

## Deployment

### Vercel
```bash
# Connect GitHub repo and set env vars
```

### Self-hosted
```bash
npm run build
npm run start
```

## Future Enhancements

- Voice-to-text task creation
- Calendar integration (Google, Outlook)
- Team collaboration
- Mobile app
- Slack/Teams integration
- Advanced analytics

## License

MIT License

---

Built for productivity professionals.
