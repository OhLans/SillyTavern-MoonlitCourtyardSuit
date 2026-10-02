# Development notes

## Where to work

| File or directory | Responsibility |
| --- | --- |
| `index.js` | Feature startup, bounded late initialization, page lifecycle |
| `features.js` | Developer feature switches, applied on reload |
| `core/runtime.js` | Context access, frame batching, shared native events, observer registration, guarded DOM writes |
| `features/navigator/index.js` | Rail, header identity, native drawer proxies, portrait mirrors, hotswap |
| `features/navigator/style.css` | Navigator geometry and Moonlit glass surfaces |
| `features/character-panels/index.js` | Native list/editor control placement and persistent menus |
| `features/character-panels/style.css` | List toolbar, editor layout, native field presentation |
| `features/persona-panels/` | Native persona controls, banner list and current-persona layouts, persistent dropdowns |
| `features/icons/` | SVG masks and WorldInfo Info icon child |
| `assets/icons/` | Local SVGs, unchanged from the supplied Icons archive |
| `style.css` | CSS import order: Navigator, Character Panels, Persona Panels, Icons |

SillyTavern loads the root JavaScript as an ES module. Submodules use relative
imports; there are no hard-coded installation-folder URLs. The SVG URLs are
relative to `features/icons/style.css`.

## Integration boundaries

- Keep native form controls and their listeners intact. The creation name row
  sits outside `form_create`, so its real inputs explicitly reference that form.
- Hotswap buttons resolve their current native source on click. Preserve the
  native hotswap DOM in the Character Management panel.
- The native Advanced Definitions input notification and maximize-button proxy
  remain in place. They preserve token updates and SillyTavern's large editor.
- The list and editor menus are persistent: only their own buttons toggle them.
- Moonlit owns native control colors and filter/tag states. Avoid normalizing
  all moved controls to full opacity or forcing a text color over theme hover.
- Keep the native blur variable on the two Navigator surfaces. Do not add paint
  containment or forced transforms to those glass surfaces without visual checks.
- Targeted state observers may watch a fixed native node or small native list.
  Do not add a body/right-panel subtree observer or a periodic synchronization loop.
- `cleanup()` is for page disposal, not a supported hot-disable API. Developer
  feature changes require a reload. Page disposal runs on `pagehide`, not
  `beforeunload`, so cancelling an unsaved-changes prompt cannot dismantle the UI.

## Persona Panels (1.1.3)

The native `persona_grid_toggle` and `user_avatar_block.gridView` still own the
list view and its preference. Banner styling applies only outside `gridView`;
the circular grid is not restyled. The independent current-persona view is saved
as `extensionSettings.moonlitCourtyardSuit.personaHeaderView`.

The native list heading is moved into the left column to align with Current
Persona. Actions contains the original create/backup/restore/usage nodes,
search, sort and pagination. The list grid button sits in the manager heading.
Current-persona actions remain native nodes with passive SVG children; their
labels are hidden visually and retained as accessible names. Do not attach
handlers to those SVG children.

The native description heading/maximize and textarea sit in `.rpp-description`
inside the original `persona_controls`. That wrapper uses `display: contents`
so CSS can place the editor beside the portrait or below the banner, with the
same centered action row underneath. View changes do not move native nodes.
Disposal restores the editor and list grid button to their original positions.
The portrait retains its original column width and a separate 250px height;
it does not stretch when the editor grows. The native textarea has a 260px
minimum height in either view, with native resize and maximize still available.

List banners use separate lazy-loaded full-size images, added only when banner
mode is first displayed. The native thumbnail nodes and sources stay untouched.
The added images live in a WeakMap, outside the generated-node/listener sets,
so paginated cards can be collected. Native upload completion refreshes an
existing matching banner without changing the native upload/crop flow.

Native pagination may render a page and immediately navigate to another in the
same turn. Mutation records can therefore include already removed cards. The
list observer processes each added node once and only if it is still a direct
child of the native list; `decorateCard` also guards against detached cards.
Do not process stale added nodes: that previously interrupted image setup and
left only the enlarged thumbnail until the user toggled the grid.

Both portrait and banner use the existing persona image; there is no second
image store or upload endpoint. The feature reads SillyTavern's live
`user_avatar` binding from `scripts/personas.js` so filtering or paging out the
selected card cannot change the header. Native persona events and a small list
child observer keep it current. There is no observer of the persona subtree's
attributes, no polling and no computed-style lookup in this module.

Keep native controls and their IDs intact. The action buttons are their original
nodes. The explicit lorebook link dispatches the existing dropdown's change
event; extra dropdown options from other extensions remain accessible. Original
inputs, confirmations, upload/crop flow and editor maximize stay with SillyTavern.
Dropdowns use independent native `details` elements and stay open until toggled.
Connections and Global Settings content sits beside its details element in the
settings grid; a native `toggle` event controls visibility. This lets each open
menu span the column without relying on browser-specific details content boxes.
The original Position select, depth controls and label/token row stay together
in their native container; CSS places them on centered grid rows.

Chromium checks used SillyTavern markup and Moonlit CSS with simulated native
handlers. They covered original-node identity and action routing, both layouts,
native circular-grid geometry, filtering out the selected persona, persisted
header preference, input/depth/settings controls, late additional actions,
mobile overflow, cleanup and zero hero mutations from 50 unchanged persona
updates. The 1.1.1 checks additionally covered heading alignment, the divider,
centered manager controls/search/pagination, native action order, keyboard
activation with SillyTavern's real keyboard module, text/icon view switching,
full-resolution list images with original thumbnails retained, full-width
independent settings menus, and the mobile settings row. Starting in circular
grid mode creates no extra full-size list images. Existing Navigator/Character
Panels DOM regressions also passed.
The 1.1.2 fixture additionally reproduced the detached-card error before the
fix and verified two rapid page renders and paging-button clicks produce full-
size banners with no grid toggle or error. Checks cover aligned grid buttons,
description/editor-maximize placement, centered icon rows and settings option
groups, compact search with four paging arrows, both mobile header layouts,
and restoration of the native editor/grid-button positions during disposal.
These are fixture checks, not an end-to-end test of a live SillyTavern server or
an FPS benchmark on the user's computer.

## Verification performed for 1.0.0

JavaScript syntax, manifest references, module imports, CSS imports, SVG XML,
asset references, and archive integrity were checked.

A DOM regression harness used SillyTavern's actual `public/index.html` with a
mock native event source. It checked:

- one combined startup and no stacked observers after late-startup retries;
- original search, name, and description nodes retained;
- 17 and 18 native favorites, native click routing, and retained scroll position;
- native hotswap enable/disable state and late Quick Replies Drawer registration;
- independent persistent Actions and Usage menus;
- create/edit transitions and external name-input form association;
- token-warning/counter nodes, Advanced Definitions input signals, and maximize;
- avatar visibility, native drawer active state, collapse/reopen, and the desktop
  breakpoint with WorldInfo Info restoration;
- ignored panel-opacity animation updates and unrelated chat DOM mutations;
- cancelled-navigation and back/forward-cache handling;
- startup timers exhausting and no continuing idle frame loop.

Startup checks also passed with Navigator alone, Panels alone, both without
Icons, and both disabled. Navigator's native glyph fallback remains available
when Icons is disabled.

In a controlled burst of 25 `CHARACTER_EDITED` events, computed-style reads fell
from 50 with the separate baseline extensions to 2 with the merged version.
This measures repeated update work in the harness, not browser FPS or GPU cost.

CSS comparison confirmed that Navigator's stylesheet and all SVG assets are
byte-identical to the supplied baseline. Icons CSS only changes relative asset
paths. Panels CSS only removes an empty rule and scopes the description/first
message field selectors under the existing Panels body class.

Live SillyTavern rendering, physical scrolling, and GPU compositing were not
tested here. Before release, check the original screenshots against list/edit/
create modes, theme color and blur changes, native dialogs, and long-list scrolling
on the actual installation.

## Upstream references checked

- SillyTavern staging `bc81b9f7e33f39afe3f919a66faaf93079276a1c`:
  `public/index.html`, `scripts/events.js`, `scripts/st-context.js`,
  `scripts/extensions.js`, `scripts/personas.js`, `scripts/keyboard.js`,
  `css/toggle-dependent.css`, and `lib/eventemitter.js`.
- Moonlit Echoes main `5336f368a41871275317c60a5bc9a806d59f4000`:
  `style.css` and `src/bootstrap/lifecycle-hooks.js`.

The reference files were used for compatibility checks and are not bundled.
