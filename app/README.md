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
```

## Building an executable

```sh
npm run dist
```

This runs the production build and then packages it with
[electron-builder](https://www.electron.build/) for whatever platform you run it on,
into `app/release/`:

- **macOS** → a `.dmg` and a `.zip` (run on a Mac — Apple doesn't allow cross-building
  macOS installers from Linux/Windows)
- **Windows** → an NSIS installer `.exe`
- **Linux** → an `.AppImage` (portable, no install needed) and a `.deb`

To build for just one platform: `npm run dist -- --mac`, `--win`, or `--linux`. The
first run downloads a matching Electron binary for the target platform/arch (~100MB),
so it needs network access once.

There's no app icon yet (the mockups didn't include one), so packaged builds use
electron-builder's default icon — drop an `icon.png`/`icon.icns`/`icon.ico` under
`build/` and point `build.mac.icon` / `build.win.icon` / `build.linux.icon` at it in
`package.json` when you have one.

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

Every article (and thread) can also carry images — drag-and-drop or "Add image" in the
gallery under its header, with an editable caption per image and a click-to-expand
lightbox (`ImageGallery.tsx`). A character's first image doubles as their portrait in
the relationship map's dossier panel. Images aren't inlined into the JSON campaign file
as base64 — they're written as separate files under a per-campaign assets folder in
Electron's userData directory and served to the renderer through a custom
`rpnotes-asset://` protocol registered in `electron/main.ts` (see `saveImageAsset` /
`resolveAssetPath` in `electron/store.ts`), so the campaign file stays small and images
aren't duplicated in memory as data URLs.

## Project layout

```
electron/       main process (window, IPC) + preload (contextBridge) + JSON file store
shared/types.ts data model shared between main and renderer
src/lib/        linking engine, relationship graph, search
src/state/      CampaignContext — CRUD + autosave
src/components/ UI
src/styles/     tokens.css (Nocturne design system, verbatim) + app.css (app layout)
```
