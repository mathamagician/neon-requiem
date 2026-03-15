# Neon Requiem -- Buy vs Build Recommendations

## TL;DR

| Category | Verdict | Tool/Asset | Cost |
|----------|---------|------------|------|
| Template/Boilerplate | **Already using** | Vite + TS (official pattern) | Free |
| Phaser Plugins | **BUY** | rexUI for menus/dialogs | Free |
| Pixel Art Assets | **BUY** for prototyping | CraftPix cyberpunk packs, Kenney | Free-$20 |
| Level Editor | **BUY** | Tiled Map Editor | Free |
| Sound Effects | **BUY** | jsfxr / ChipTone (generate) | Free |
| Music | **BUY** | CC0 libraries, then commission | Free |
| Physics/Combat | **BUILD** | Core gameplay -- must be custom | -- |
| Multiplayer | **BUY** | Colyseus | Free self-host |
| RPG Systems | **BUILD** | Inventory, skills, progression | -- |
| Animation Pipeline | **BUY** | Aseprite ($20) + Phaser built-in | $20 |
| Deployment | **BUY** | Vercel (client) + Colyseus Cloud (server) | Free tier |

---

## 1. Phaser Ecosystem Updates

**Phaser v3.90.0 "Tsugumi"** (May 2025) is the final v3 release. Phaser 4 is at Release Candidate 6 (Dec 2025) with an imminent launch. Phaser 4 uses a new "Beam" renderer but keeps the same API -- existing v3 code ports with minimal changes.

**Recommendation:** Stay on Phaser 3 (mature, stable, massive ecosystem). Plan to migrate to v4 when it ships -- API compatibility makes this low-risk.

---

## 2. Plugins Worth Adding

### rexUI (phaser3-rex-plugins)
- **What:** Massive plugin library with UI components (sizer, grid, dialog, menu, number bar), plus tweens, shader effects, and 100+ more utilities
- **Why:** Building UI primitives from scratch is time we should spend on gameplay
- **Install:** `npm install phaser3-rex-plugins`
- **Docs:** https://rexrainbow.github.io/phaser3-rex-notes/docs/site/ui-overview/

### Phaser Tilemap Plus
- Enhanced Tiled JSON support with tile animations, physics, events, and custom properties
- Useful when we switch from procedural levels to Tiled-designed ones

---

## 3. Art Assets

### Free Cyberpunk Assets (Use Now)
| Asset | Source | License |
|-------|--------|---------|
| Free Cyberpunk Factory Tileset (32x32) | craftpix.net | Free |
| Free Cyberpunk Townspeople NPCs | craftpix.net | Free |
| 3 Cyberpunk Sprites (48px, 12 anims each) | itch.io (free-game-assets) | Commercial OK |
| Kenney Pixel Platformer (tiles, chars, HUD) | kenney.nl | CC0 |
| Kenney All-in-1 Bundle (60,000+ assets) | kenney.itch.io ($20) | CC0 |

### Paid Cyberpunk Assets (When Ready to Polish)
| Asset | Source | Price |
|-------|--------|-------|
| CraftPix Cyberpunk Platformer Set (tilesets, chars, bosses, parallax BGs) | craftpix.net | Subscription or individual |
| 400+ RPG Character Sprites (SciFi/Cyberpunk) | itch.io | $15 |

### AI Pixel Art
- **PixelLab** (pixellab.ai) -- AI generator specifically for pixel art game assets. Good for filling gaps quickly.

**Strategy:** Use free CraftPix + Kenney assets to replace our placeholder sprites now. Commission or buy premium packs when we're ready to polish for launch.

---

## 4. Level Design: Switch to Tiled

**Current:** Procedural level generation in TypeScript (testLevel.ts, cryptvaultLevel.ts, etc.)

**Recommended:** Migrate to **Tiled Map Editor** (mapeditor.org)
- Free, open source, industry standard
- **Native Phaser 3 support** -- `this.load.tilemapTiledJSON()` just works
- Visual editor for placing tiles, enemies, NPCs, triggers, boss arenas
- Export as JSON, load directly in Phaser
- Supports tile animations, custom properties per tile/object, layers

**Migration path:**
1. Keep procedural generation for now (it works)
2. Design new zones in Tiled as we add content
3. Eventually replace all procedural levels with Tiled maps

**Also consider:** LDtk (ldtk.io) -- more modern UX, JSON export, community Phaser importer available.

---

## 5. Sound & Music

### SFX Generation (Use Immediately)
| Tool | URL | Notes |
|------|-----|-------|
| **jsfxr** | sfxr.me | Browser-based, export WAV. Great for jump, hit, explosion, pickup sounds |
| **ChipTone** | sfbgames.com/chiptone | More categories than jsfxr (melody, bass, noise) |

### Music Libraries (Use for Prototyping)
| Source | URL | License |
|--------|-----|---------|
| OpenGameArt 8-bit SFX (512 sounds) | opengameart.org | CC0 |
| Soundimage.org Chiptunes | soundimage.org/chiptunes | Free commercial use |
| itch.io chiptune packs | itch.io/game-assets/free/tag-chiptune | Varies (many CC0) |

**Strategy:** Generate custom SFX with jsfxr/ChipTone (takes minutes per sound). Use CC0 chiptune tracks as placeholder music. Commission custom soundtrack later if desired.

---

## 6. Multiplayer: Colyseus

**Recommended:** Colyseus (colyseus.io)
- Official Phaser tutorial exists
- TypeScript support
- Built-in room management, state sync, matchmaking
- Free self-host or $15/mo managed cloud (free tier available)
- Proven with similar Phaser games (e.g., Grapplenauts)

**Architecture:**
- Client sends inputs only, server runs game logic (authoritative)
- Client-side prediction + server reconciliation for responsiveness
- Snapshot interpolation for smooth remote player rendering

**Hosting:** Cannot run on Vercel (needs persistent WebSocket connections). Options:
- Colyseus Cloud (managed, 32 global locations)
- Railway / Render / Fly.io (PaaS with long-running process support)
- Any VPS with Node.js

**Alternative (no server cost):** PeerJS or NetplayJS for P2P WebRTC. NetplayJS has rollback netcode (GGPO-style) which is excellent for action games. Downside: no server authority, no cheat prevention.

**Key advice from Grapplenauts developer:** "Figure out mechanics in a local environment first, then make it multiplayer. Iterating on features becomes 10x harder once a server is involved."

---

## 7. Animation Pipeline

**Recommended:** Aseprite ($20) + Phaser built-in animations

- Aseprite is the industry standard for pixel art creation and animation
- **Native Phaser 3 support:** `this.load.aseprite()` + `this.anims.createFromAseprite()`
- Tags in Aseprite map directly to Phaser animation names
- TexturePacker ($40) for optimizing sprite sheets in production (70% size reduction with PNG-8)
- Skip Spine/DragonBones -- skeletal animation adds complexity without benefiting pixel art

---

## 8. What We MUST Build Custom

These are core to Neon Requiem's identity and no generic library will get them right:

1. **Combat system** -- combo state machines, hitbox timing, attack cancels, class-specific mechanics (shield, backstab, gunner). This IS the game feel.
2. **RPG progression** -- stats, skill trees, equipment, class differentiation. Design as plain TypeScript interfaces with JSON data files.
3. **Boss AI** -- phase-based attack patterns, telegraphing, arena mechanics. Each boss is unique content.
4. **Zone/world design** -- how zones connect, progression gates, environmental storytelling.

---

## 9. Recommended Immediate Actions

### Phase 1: Sound (this week)
- [ ] Generate 10-15 core SFX with jsfxr (jump, land, attack, hit, pickup, death, menu select)
- [ ] Add 2-3 CC0 chiptune tracks for zone BGM

### Phase 2: Art Upgrade (next sprint)
- [ ] Download free CraftPix cyberpunk tilesets and character sprites
- [ ] Replace placeholder rectangles with real pixel art sprites
- [ ] Consider buying Aseprite for custom sprite creation

### Phase 3: Level Design (when adding new zones)
- [ ] Install Tiled, design one zone as a test
- [ ] Add Tiled JSON loader to GameScene
- [ ] Design boss arenas with intentional platforming

### Phase 4: Multiplayer (after core mechanics are solid)
- [ ] Set up Colyseus server locally
- [ ] Implement room-based co-op (2-3 players)
- [ ] Deploy server to Colyseus Cloud or Railway

---

## Sources

Full source URLs and detailed analysis available in the research notes. Key references:
- Phaser Official Templates: github.com/phaserjs
- rexUI Plugins: rexrainbow.github.io/phaser3-rex-notes
- Colyseus + Phaser: docs.colyseus.io/tutorial/phaser
- Tiled Map Editor: mapeditor.org
- Kenney Assets: kenney.nl
- CraftPix Cyberpunk: craftpix.net
- jsfxr: sfxr.me
- Aseprite: aseprite.org
