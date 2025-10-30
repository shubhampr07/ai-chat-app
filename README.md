# AI Chat Application

A modern, full-featured AI chat application built with Next.js, Google Gemini AI, and PostgreSQL. Experience Claude-like conversations with a beautiful, responsive interface.

💬 AI Chat Application — Features Overview
🚀 ##Task 1 — Chat Interface

A fully functional chat experience inspired by Claude and Perplexity, with detailed attention to UI/UX and performance.

Core Features

🔄 Streaming Responses — Simulated token-by-token streaming with smooth delay for realistic AI output.

🧩 Claude-style Artifacts — Inline rich content (code blocks, markdown, etc.) toggleable between inline and expanded views.

💭 Informational Loading States — Animated “Thinking…” loaders and skeleton placeholders for an engaging experience.

💾 Local Persistence — Chat history automatically persists across reloads.

📌 Sticky Question Header — Question title remains pinned at the top while scrolling through long answers (like Perplexity).

⚙️ Inline Actions — Quick actions such as Copy, Regenerate, and Edit Prompt directly within chat messages.

📂 Sidebar Chat Sessions — View, list, and switch seamlessly between multiple chat sessions.

🔍 ##Task 2 — Prompt Area with Scalable Search

An enhanced input bar offering intelligent, context-aware autocomplete and mention functionality.

Core Features

🌐 Server-Side Search — Fetches initial search results from a mock API route.

🧠 Client-Side Caching — Uses React Query for efficient result caching and revalidation.

🔡 Character Highlighting — Bold highlighting of matched substrings within search suggestions.

⌨️ Keyboard Navigation — Supports intuitive key navigation: ↑ ↓ ↩ Esc.

👥 Mentions (@) — Typing “@” triggers a mock people search from a dataset of 1 million placeholder names.

⚙️ ##Task 3 — System Quality & Architecture

Built with a clean, modular, and scalable architecture optimized for performance and maintainability.

Core Features

📁 Structured Folder Design — Organized with directories for app/, components/, lib/, hooks/, types/, and features/.

🧩 Server Components & Suspense — Utilizes Next.js Server Components, React Suspense, and React Query effectively.

🚨 Graceful Error Handling — Comprehensive empty and error states for resilient UI.

🧭 Command Menu (⌘K) — Quick action bar to perform operations like:

New Chat

Clear History

Settings

⚡ Fully Responsive Design — Modern, minimal black & white theme with smooth performance across all devices.

🌟 ## Additional Features

Enhanced beyond the required tasks for a more realistic and immersive AI experience.

🤖 Real AI Chat Experience — Integrated with Google Gemini API for intelligent and contextual responses.

🗄️ Database-Backed Chat Storage — Persist chats in a database for long-term history retention.

✏️ Chat Management — Rename or delete individual chat history items.

📚 Category-Based Prompt Suggestions — Smart prompt suggestions categorized into areas like:

Coding

Lifestyle

Productivity

General Knowledge

💬 Follow-Up Question Generator — Automatically suggests follow-up questions after each AI response.

🧠 Dynamic Chat Title — Chat name dynamically updates based on scroll position (replicating Perplexity-style behavior).

🎙️ Voice Input Support — Voice-based prompt entry for a hands-free chat experience.
## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **AI**: Google Gemini AI API
- **Database**: PostgreSQL (Neon serverless)
- **Deployment**: Vercel
- **Icons**: Lucide React
- **Markdown**: React Markdown with syntax highlighting

## Setup

### Prerequisites

- Node.js 18+ installed
- Neon PostgreSQL account (free tier available)
- Google Gemini API key (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ai-chat-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```bash
   # Google Gemini API Key
   # Get yours at: https://aistudio.google.com/app/apikey
   GEMINI_API_KEY=your_gemini_api_key_here

   # PostgreSQL Database Connection String (Neon)
   # Get yours at: https://console.neon.tech
   DATABASE_URL=postgresql://user:password@host/database?sslmode=require
   ```

4. **Initialize the database**
   ```bash
   npm run db:init
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

### Getting API Keys

#### Google Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key to your `.env.local` file

#### Neon PostgreSQL Database
1. Go to [Neon Console](https://console.neon.tech)
2. Sign up for free account
3. Create a new project
4. Copy the connection string from "Connection Details"
5. Paste into your `.env.local` file

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run db:init      # Initialize database tables
```

## Project Structure

```
ai-chat-app/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── chat/         # AI chat endpoint
│   │   └── db/           # Database CRUD endpoints
│   ├── page.tsx          # Main page
│   └── layout.tsx        # Root layout
├── components/            # React components
│   ├── chat/             # Chat interface components
│   ├── layout/           # Layout components (Sidebar, etc.)
│   └── ui/               # Reusable UI components
├── hooks/                 # Custom React hooks
│   └── useChat.ts        # Main chat logic hook
├── lib/                   # Utility libraries
│   ├── db-postgres.ts    # PostgreSQL connection
│   ├── database-postgres.ts # Database operations
│   └── storage.ts        # LocalStorage utilities
├── types/                 # TypeScript type definitions
├── scripts/               # Utility scripts
│   └── init-db.ts        # Database initialization
└── public/                # Static assets
```

## Database Schema

### Tables

- **users**: User profiles with UUID and username
- **chat_sessions**: Chat session metadata
- **messages**: Individual messages in conversations
- **artifacts**: Code and markdown artifacts attached to messages

See [SETUP.md](./SETUP.md) for detailed schema information.

## Deployment

### Deploy to Vercel

1. **Push your code to GitHub**

2. **Connect to Vercel**
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Add environment variables**
   - In Vercel project settings → Environment Variables
   - Add `GEMINI_API_KEY`
   - Add `DATABASE_URL`

4. **Deploy**
   - Click "Deploy"
   - Your app will be live in minutes!

## Troubleshooting

### Database Connection Issues
- Ensure `DATABASE_URL` includes `?sslmode=require`
- Check that database tables are initialized (`npm run db:init`)
- Verify your Neon database is active

### API Rate Limits
- Google Gemini free tier: 15 requests per minute
- Upgrade to paid tier for higher limits

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues and questions:
- Open an issue on GitHub
- Check [SETUP.md](./SETUP.md) for detailed setup instructions

---

Built with ❤️ using Next.js and Google Gemini AI
