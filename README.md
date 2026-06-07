# InterviewAI 🎯

> A production-ready AI-Powered Interview Preparation Platform built with Next.js 15, Spring Boot 3, PostgreSQL, and OpenAI.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-green?logo=spring)](https://spring.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)](https://postgresql.org)
[![Java](https://img.shields.io/badge/Java-21-orange?logo=java)](https://openjdk.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://typescriptlang.org)

---

## ✨ Features

| Module | Description |
|--------|-------------|
| 🔐 Authentication | JWT + Refresh tokens + Google OAuth2 + Email verification |
| 📊 Dashboard | Score analytics, weekly progress, recommendations |
| 📄 Resume Analyzer | ATS score, skill extraction, improvement suggestions |
| 🎯 Job Matcher | Match resume against JD, missing skills analysis |
| 🤖 AI Questions | Personalized questions from resume + JD |
| 🎤 Mock Interview | Real-time interview with voice (Whisper STT) |
| 💻 Coding IDE | Monaco editor + Judge0 execution + AI code review |
| 📈 Reports | Detailed PDF interview reports |
| 🗺️ Roadmap | Personalized learning roadmap from results |
| 👑 Admin Panel | User management, analytics, system monitoring |

---

## 🏗️ Architecture

```
InterviewAI/
├── frontend/        # Next.js 15 (Vercel)
├── backend/         # Spring Boot 3 (Render/Railway)
├── docker-compose.yml
└── README.md
```

**Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, ShadCN UI, React Query, Chart.js, Zustand  
**Backend**: Java 21, Spring Boot 3, Spring Security, JWT, OAuth2, Flyway  
**Database**: PostgreSQL 16 (Neon for production)  
**AI**: OpenAI GPT-4o, Whisper STT, Judge0 (code execution)  
**Deployment**: Vercel (frontend) + Render/Railway (backend) + Neon (database)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Java 21+
- Maven 3.9+
- Docker & Docker Compose
- PostgreSQL (or use Docker)

### 1. Clone & Setup Environment

```bash
git clone https://github.com/yourusername/interviewai.git
cd interviewai
cp .env.example .env
# Fill in your API keys and database URL
```

### 2. Start with Docker Compose (Recommended for Dev)

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Spring Boot backend on port 8080
- Adminer DB UI on port 8081

### 3. Start Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_API_URL and other vars
npm install
npm run dev
```

Frontend runs at: http://localhost:3000

---

## 🔧 Environment Variables

### Backend (`backend/src/main/resources/application.yml`)

| Variable | Description |
|----------|-------------|
| `DB_URL` | PostgreSQL JDBC URL |
| `DB_USERNAME` | Database username |
| `DB_PASSWORD` | Database password |
| `JWT_SECRET` | 256-bit JWT signing secret |
| `JWT_EXPIRY_MS` | Access token expiry (default: 900000 = 15min) |
| `JWT_REFRESH_EXPIRY_MS` | Refresh token expiry (default: 604800000 = 7d) |
| `OPENAI_API_KEY` | OpenAI API key |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `MAIL_HOST` | SMTP host |
| `MAIL_PORT` | SMTP port |
| `MAIL_USERNAME` | SMTP username |
| `MAIL_PASSWORD` | SMTP password |
| `JUDGE0_API_KEY` | Judge0 Cloud API key (RapidAPI) |
| `FRONTEND_URL` | Frontend URL for OAuth redirects |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth Client ID |

---

## 🗄️ Database

Uses **Flyway** for migrations. Migrations run automatically on startup.

### Manual migration (if needed):
```bash
cd backend
mvn flyway:migrate
```

### Schema overview:
- `users`, `roles`, `refresh_tokens`
- `resumes`, `resume_analyses`
- `job_descriptions`, `job_matches`
- `interview_sessions`, `questions`, `answers`
- `feedbacks`, `scores`
- `coding_challenges`, `coding_submissions`
- `roadmaps`, `reports`

---

## 🔐 Authentication Flow

1. User registers → verification email sent
2. User clicks link → account activated
3. Login → returns `accessToken` (15min) + `refreshToken` (7d, httpOnly cookie)
4. Frontend uses access token in `Authorization: Bearer <token>` header
5. On 401, frontend auto-refreshes using refresh token
6. Google OAuth: `/oauth2/authorize/google` → callback → JWT issued

---

## 🚀 Deployment

### Frontend → Vercel

```bash
cd frontend
vercel --prod
```

Set environment variables in Vercel dashboard.

### Backend → Render

1. Create a new Web Service on Render
2. Connect your GitHub repo
3. Set build command: `cd backend && mvn clean package -DskipTests`
4. Set start command: `java -jar backend/target/*.jar`
5. Add all environment variables

### Database → Neon

1. Create a free Neon project at neon.tech
2. Copy the connection string
3. Set `DB_URL=jdbc:postgresql://...` in your backend env

---

## 📚 API Documentation

Swagger UI available at: `http://localhost:8080/swagger-ui.html`

---

## 🧪 Running Tests

```bash
# Backend tests
cd backend && mvn test

# Frontend type check
cd frontend && npm run type-check
```

---

## 🐳 Docker

```bash
# Build and run everything
docker-compose up --build

# Just the database
docker-compose up -d postgres

# View logs
docker-compose logs -f backend
```

---

## 📄 License

MIT © InterviewAI 2025
