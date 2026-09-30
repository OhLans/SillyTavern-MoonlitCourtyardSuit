# Changelog

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
