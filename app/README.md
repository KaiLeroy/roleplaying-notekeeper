# Roleplay Notes

A desktop note-keeping app for play-by-post and Discord text roleplay: a wiki-style
campaign where mentioning another article's name links it automatically, selecting a
word can spin up a new article without losing your place, and a relationship map and
full-text search sit over the top of it all.

Built with Electron + React + TypeScript, styled with the Nocturne design system the
mockups shipped with. Campaign data is stored as plain JSON files on disk (one file per
campaign, under Electron's per-OS userData directory) — no server, no account, fully
offline.

## Running it

```sh
npm install
npm run dev      # launches the app with hot reload
```

```sh
npm run build     # type-checks and produces dist/ + dist-electron/
npm run typecheck # type-check only
npm run dist       # build + package with electron-builder
```

## What's implemented

The original mockup (`Roleplay Notes.dc.html`) presented four alternative directions
for the same app. Per the plan agreed with the user, this build combines all four into
one app rather than picking a single screen:

- **Wiki desk** (mock 1a) — the sidebar (grouped by Threads / Characters / Places /
  Factions / Unsorted, with counts), the article view, and the backlink rail
  ("Linked from", "Mentioned here", suggestion banner) are the home screen for every
  non-thread article. See `src/components/Sidebar.tsx`, `ArticleView.tsx`,
  `BacklinkRail.tsx`.
- **Thread capture** (mock 1b) — opening a Thread article shows the session log plus a
  live "draft note" capture pane. Selecting any word in a logged post pops up a menu to
  create a new character article, link to an existing one, add an alias, or quote it
  into a loose note — all without leaving the thread. See `ThreadView.tsx`,
  `SelectionPopover.tsx`, `MentionHighlightTextarea.tsx`.
- **Relationship map** (mock 1c) — a force-directed graph of characters/factions,
  computed from actual mentions (solid edge = appeared together in a thread, dashed =
  mentioned but never "met"), with a dossier panel for the selected node. Reachable via
  the Wiki/Map toggle in the top bar. See `MapView.tsx`, `src/lib/graph.ts`.
- **Search & backlinks** (mock 1d) — a ⌘K / Ctrl+K command palette searching article
  titles/aliases/tags and full post/article text, with a live preview pane and a
  "Create article" fallback. See `SearchPalette.tsx`.

Auto-linking and backlinks are computed live from a dictionary of every article's title
and aliases (`src/lib/linking.ts`) — there's no manual `[[wikilink]]` syntax to maintain;
mentioning a name is enough. Repeated proper-noun phrases that don't match any article
yet are flagged as link suggestions.

## Project layout

```
electron/       main process (window, IPC) + preload (contextBridge) + JSON file store
shared/types.ts data model shared between main and renderer
src/lib/        linking engine, relationship graph, search
src/state/      CampaignContext — CRUD + autosave
src/components/ UI
src/styles/     tokens.css (Nocturne design system, verbatim) + app.css (app layout)
```
