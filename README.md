# SillyTavern-MoonlitCourtyardSuit

Version **1.0.0** — Navigator, Character Panels, and SVG icons in one extension
for SillyTavern with the Moonlit Echoes theme.

## Install or migrate

1. Disable **Rivelle Navigator**, **Rivelle Character Panels**, and
   **Rivelle Navigator Icons** in SillyTavern before enabling this combined
   extension. Alternatively, move their folders outside the extensions folder
   and keep them as backups. Running both versions would duplicate handlers.
2. Extract the ZIP so the folder is located at
   `SillyTavern/public/scripts/extensions/third-party/SillyTavern-MoonlitCourtyardSuit/`.
   `manifest.json` must be directly inside that folder, without an extra nested
   copy of the same folder.
3. Keep **Moonlit Echoes** enabled. Keep your existing companion extensions
   such as Char Switch / Persona Switch, WorldInfo Info, and Quick Replies
   Drawer if you use them; this package does not replace those extensions.
4. Reload SillyTavern. If the old appearance remains cached, use Ctrl+F5.

No build step, npm install, external icon service, or new CSS snippet is needed.
Native character data, chats, theme settings, and favorites are not migrated
or rewritten by this extension.

## Included versions

| Feature | Starting version | Location |
| --- | --- | --- |
| Navigator | 1.4.7, Moonlit blur | `features/navigator/` |
| Character Panels | 0.5.16, Moonlit native colors | `features/character-panels/` |
| Navigator Icons | 1.0.1, performance | `features/icons/` |
| Local SVG files and licenses | Original icon assets | `assets/icons/` |

Navigator keeps the original native drawer controls and hotswap behavior.
Character Panels reorganizes existing SillyTavern controls, including the
creation name field, token counts, tags, and Advanced Definitions. Icons adds
the same 20 px local SVG artwork.

## Performance and theme compatibility

- One bounded startup sequence replaces the separate startup retries.
- Related native events are combined into one update per animation frame.
- Repeated text, portrait, and state values avoid unnecessary DOM writes.
- Panel visibility observers ignore opacity and size changes during animations.
- Newly added character cards are decorated without rescanning the whole list.
- Navigator skips native glyph style reads when the SVG pack is enabled.
- Targeted observers are reused and can reattach when a native control is
  replaced. There is no permanent polling loop or document-subtree observer.

The original visual CSS is retained, including Moonlit's blur strength, toolbar
transparency, portrait geometry, native filter opacity, and accent colors.
The small CSS cleanup removes an empty rule and scopes two native field selectors
to Character Panels so they do not affect a configuration with Panels disabled.

## Separate features

The feature folders remain independent. `features.js` contains developer
switches for Navigator, Character Panels, and Icons; changes take effect after
a full reload. Icons requires Navigator. These are startup switches, not live
settings or a new in-app settings menu.

See [DEVELOPMENT.md](DEVELOPMENT.md) for the module boundaries and verification
details, and [CHANGELOG.md](CHANGELOG.md) for the merge notes.

## Credits and license

Lans + ChatGPT. Extension code retains the original **AGPL-3.0** license.
Bundled icons retain their upstream licenses; see `assets/icons/README.md`.

Built for [SillyTavern](https://github.com/SillyTavern/SillyTavern) and
[Moonlit Echoes](https://github.com/RivelleDays/SillyTavern-MoonlitEchoesTheme).
This is a separate companion extension.
