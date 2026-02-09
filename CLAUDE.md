# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is UIGen

UIGen is an AI-powered React component generator with live preview. Users describe components in a chat interface, Claude generates the code using tool calls (file creation/editing), and the result renders in a sandboxed iframe with hot reload. Components live in an in-memory virtual file system — nothing is written to disk.

## Commands

```bash
npm run setup          # Install deps + generate Prisma client + run migrations
npm run dev            # Next.js dev server with Turbopack
npm run build          # Production build
npm run lint           # ESLint (next lint)
npm test               # Vitest (watch mode)
npx vitest run         # Vitest single run
npx vitest run src/lib/__tests__/file-system.test.ts   # Run a single test file
npm run db:reset       # Reset SQLite database
npx prisma generate    # Regenerate Prisma client after schema changes
npx prisma migrate dev # Create/apply migrations after schema changes
```

## Architecture

### Stack
Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS v4 + Prisma (SQLite) + Vercel AI SDK + Anthropic Claude

### Request Flow
1. User sends message via `ChatInterface` → `ChatProvider` (uses Vercel AI SDK's `useChat`)
2. POST to `/api/chat` route (`src/app/api/chat/route.ts`) with message + serialized virtual file system
3. Route creates Claude model via `src/lib/provider.ts`, attaches tools (`str_replace_editor`, `file_manager`) and system prompt
4. Claude streams response, calling tools to create/modify files in the virtual FS
5. Tool results flow back to `FileSystemProvider` which updates the in-memory file tree
6. `PreviewFrame` picks up file changes, runs Babel JSX transform (`src/lib/transform/jsx-transformer.ts`), generates import map with blob URLs for local files + esm.sh CDN for packages, renders in sandboxed iframe

### Key Abstractions

**VirtualFileSystem** (`src/lib/file-system.ts`): In-memory tree of files/directories. Serialized to JSON for persistence in the database and for sending to the API. All tool calls operate on this structure.

**Provider** (`src/lib/provider.ts`): Returns either the real Anthropic Claude model or a `MockLanguageModel` (used when `ANTHROPIC_API_KEY` is empty). The mock simulates multi-step tool calls with demo components.

**JSX Transformer** (`src/lib/transform/jsx-transformer.ts`): Babel-based transform that converts JSX to browser-executable JS. Generates import maps mapping `@/` aliases to blob URLs and npm packages to esm.sh.

**AI Tools** (`src/lib/tools/`): `str_replace_editor` handles file view/create/str_replace/insert operations. `file_manager` handles rename/delete. These are registered with the Vercel AI SDK and called by Claude during generation.

### State Management
Two React contexts wrap the app in `MainContent`:
- **FileSystemProvider** (`src/lib/contexts/file-system-context.tsx`): Owns the VirtualFileSystem instance, selected file state, and processes tool call results
- **ChatProvider** (`src/lib/contexts/chat-context.tsx`): Wraps Vercel AI SDK's `useChat`, sends file system state with each request

### Data Model
Schema is defined in `prisma/schema.prisma`. SQLite database at `prisma/dev.db`. Prisma client is generated to `src/generated/prisma/`.
- `User`: email + bcrypt password, JWT auth via `jose` (7-day sessions, HTTP-only cookies)
- `Project`: name + serialized messages (JSON) + serialized file system data. Nullable `userId` supports anonymous usage.
- Auth logic in `src/lib/auth.ts`, server actions in `src/actions/`

### Layout Structure
```
MainContent → ResizablePanelGroup
  ├── Left (35%): ChatInterface (MessageList + MessageInput)
  └── Right (65%): Tab switcher
        ├── Preview: PreviewFrame (sandboxed iframe)
        └── Code: FileTree + CodeEditor (Monaco)
```

### UI Components
Shadcn/ui (New York style) components live in `src/components/ui/`. App components are organized by feature: `chat/`, `editor/`, `preview/`, `auth/`.

## Testing
Tests use Vitest + React Testing Library + jsdom. Test files live in `__tests__/` directories alongside source. Path alias `@/*` works in tests via `vite-tsconfig-paths`.

## Code Style
- Use comments sparingly. Only comment complex code.

## Environment
Set `ANTHROPIC_API_KEY` in `.env` for real AI generation. When empty, the app uses a mock provider that returns demo components.
