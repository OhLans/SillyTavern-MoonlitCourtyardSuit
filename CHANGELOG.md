# Changelog

## 1.1.1 — 2026-10-01

- Centered Actions above the persona list, with icon-only create, backup,
  restore and usage controls, search, sorting and pagination inside its menu.
- Aligned Current Persona with the manager heading and added a thin vertical
  divider between the desktop columns; mobile keeps the stacked layout.
- Ordered current-persona actions as Rename, Change Image, Persona Lore,
  Link Lorebook, Set for All Messages, Duplicate and Delete. The portrait
  layout retains text; only the current-persona banner uses icons.
- Centered Connections, the native Position select and Global Settings on one
  row, with the Position label and token counter below. Open settings menus
  span the full column and keep their independent toggle behavior.
- Fixed blurry list banners by using lazy-loaded full-size persona images.
  Native circular-grid thumbnails and geometry stay intact. Images are added
  only for banner mode and held weakly so pagination can discard old pages.
- Preserved native controls, keyboard activation, upload completion, saved
  layout choices and cleanup. No new observers or background polling.

## 1.1.0 — 2026-10-01

- Added a separate Persona Panels feature, controlled by `personaPanels` in
  `features.js`, using SillyTavern's original controls and handlers.
- Kept the native circular grid and replaced the alternate list presentation
  with rounded, image-only banners. Search, sorting, pagination, selection and
  the native grid preference continue to work as before.
- Added a current-persona portrait and an independent layout button: portrait
  beside the text, or a wide banner with an overlapping avatar and text below.
  The header choice is saved in extension settings. Both use the persona image.
- Replaced current-persona action glyphs with text; exposed the native lorebook
  link directly while retaining any additional actions supplied by extensions.
- Grouped create, backup, restore and usage under Actions; added independent
  Connections and Global Settings dropdowns and a smaller native Position row.
- Preserved native inputs, lock states, image uploads, token counting and editor
  maximize. Added keyboard access and restored native nodes during disposal.
- Used native persona events, frame batching and targeted observers; no polling,
  full-panel subtree monitoring or computed-style reads. Paginated cards are
  held weakly so removed pages can be garbage-collected.

## 1.0.2 — 2026-09-30

- Aligned AI and World Info with the mirrored spacing and edge inset of the
  right-hand controls while AI Configuration is open.
- Hid the thin header/drawer divider in that state, restoring it on close.
- Kept the centered title, normal rail layout, Moonlit icon sizing and blur,
  and native handlers. The adjustment uses CSS without additional runtime work.

## 1.0.1 — 2026-09-30

- Opening AI Configuration hides the vertical rail and shifts AI and World Info
  one slot right together. Closing it restores their positions and the rail.
- Retained the original buttons, native handlers, favorites scroll layout, and
  any manually collapsed rail preference. Moonlit still controls the glass.
- Reused the existing native drawer observer with guarded class updates; no
  polling, extra observers, or layout measurements were added.
- Corrected open-state detection for drawers that remain pinned after closing.

## 1.0.0 — 2026-09-29

First combined release from Navigator 1.4.7, Character Panels 0.5.16, and Icons
1.0.1. This version number belongs to the combined package.

- Organized the three features into separate JavaScript/CSS folders with a
  single extension manifest and startup entry point.
- Shared native event subscriptions, frame batching, and observer registration.
- Removed repeated editor setup/header updates and redundant portrait/text writes.
- Limited card decoration to new cards and visibility updates to display changes.
- Avoided native icon style reads while the bundled SVG pack is enabled.
- Reattached targeted observers during bounded late startup without duplicating
  them; preserved hotswap scroll position across native list rebuilds.
- Kept creation naming, native token/maximize behavior, persistent menus, theme
  colors, blur, icon size, and existing drawer routing.
- Reset Advanced Definitions when entering create mode, without resetting it
  for every change to the new character's name.
- Moved disposal from beforeunload to pagehide to preserve the interface when
  a native unsaved-changes prompt is cancelled.
- Removed an unused Navigator action definition and a no-op CSS rule; corrected
  package documentation and bundled icon license texts.
