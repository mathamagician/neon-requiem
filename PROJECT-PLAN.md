# NEON REQUIEM
### A Web-Native Multiplayer Side-Scroller / Action-RPG
#### *"Where dark magic meets dying technology"*

---

## The Elevator Pitch

**Neon Requiem** is a 2-player co-op side-scrolling action-RPG set in a cursed world where ancient sorcery and decaying high technology have fused into something monstrous. Two warriors — each with a distinct class and playstyle — fight through interconnected zones, defeat powerful bosses to absorb their abilities, level up, customize builds, and unravel the mystery of the Convergence that shattered reality.

Think: **Mega Man's boss-power absorption + Simon's Quest's RPG exploration + 3-player co-op + modern build diversity.**

16-bit SNES/Genesis-era pixel art aesthetic with modern lighting, particles, and parallax — retro soul, modern polish.

---

## 1. GAME CONCEPT & THEME

### Setting: The Shattered Reach

The world was once two parallel realities:
- **The Pale** — a gothic medieval realm of castles, crypts, cursed forests, and dark magic
- **The Grid** — a hyper-advanced civilization of neon-lit megastructures, plasma weapons, and AI constructs

**The Convergence** smashed them together. Now reality is fractured — a crumbling cathedral might have circuit boards growing through its walls like ivy. A neon-lit factory might be haunted by medieval specters. The sky flickers between starlight and static.

### The Day/Night Cycle (Simon's Quest Homage)

A real-time day/night cycle (approximately 8 minutes per full cycle) changes the world:

- **Day**: Safer travel, town NPCs are active, shops are open, some paths are accessible. Enemies are at base difficulty.
- **Dusk/Dawn**: Transitional. Some enemies appear/disappear. Special environmental puzzles only solvable during transitions (light angles, shadow positions).
- **Night**: Enemies are stronger and more numerous. New enemy types appear (night-only horrors). Certain hidden areas only accessible at night. Boss rematches available at night for rare loot. Towns become dangerous — some NPCs transform.
- **Blood Moon** (rare event, ~every 5th night): All enemies at maximum power, but rare crafting materials drop. Optional super-boss spawns. Risk/reward event that experienced players will hunt.

### Tone & Atmosphere

Gothic horror meets cyberpunk decay. Not campy, not grimdark — somewhere between Castlevania's brooding atmosphere and Mega Man's sense of colorful adventure. The world is dangerous and mysterious but there's hope. The two players are the hope.

**Musical direction**: Synth-metal. Think heavy synths layered with gothic organ and driving rock beats. Each zone has a unique track. Boss themes are bangers. The soundtrack should make you want to push forward.

---

## 2. CORE MECHANICS

### 2.1 Movement & Combat (The Core Verb)

The second-to-second gameplay must feel incredible. This is priority #1.

**Movement:**
- Tight, responsive platforming (Mega Man-level precision)
- Run, jump, wall-slide, wall-jump (wall abilities unlocked progressively)
- Dash (short invincibility frames, directional — unlocked early as first ability)
- Crouch, drop-through platforms
- Class-specific movement abilities unlock later (double jump, air dash, teleport, grapple)

**Combat:**
- Primary attack (class weapon — fast, reliable, no resource cost)
- Secondary attack (absorbed boss power or class skill — uses Energy)
- Special/Ultimate (charged over time through combat — powerful screen-affecting ability)
- Block/Parry (timing-based — perfect parry reflects projectiles and staggers enemies)
- Dodge roll / dash (invincibility frames reward skill)

**Combat Feel Targets:**
- Attacks have impact — screen shake, hit-stop (freeze frames on impact), particles
- Enemies react to hits (knockback, stagger, flash)
- Player death is fast and restart is instant (no long death animations)
- Controls must feel identical on keyboard and gamepad

### 2.2 Boss Power Absorption (Mega Man Homage)

The game features **8 major zone bosses** + **4 hidden bosses** + **1 final boss**.

When you defeat a zone boss, you absorb their signature power. This becomes a **Secondary Ability** you can equip. Each player can equip **2 absorbed powers at a time** (swappable at save points).

**Boss Power Examples:**
| Boss | Zone | Absorbed Power |
|------|------|---------------|
| Voltrexx | Neon Foundry | **Chain Lightning** — arcs between nearby enemies |
| Lady Hemlock | Blighted Garden | **Thornlash** — vine whip with poison DOT |
| The Hollow King | Cryptvault | **Soul Drain** — melee hit that heals you |
| Ironmaw | Siege Engine | **Mortar Burst** — lobbed explosive, area damage |
| Spectra | Mirror Sanctum | **Phase Shift** — short-range teleport through walls/enemies |
| Conductor IX | Signal Tower | **Pulse Wave** — wide-range knockback + stun |
| Emberwitch | Ashen Cathedral | **Immolate** — surrounds you in damaging fire aura |
| Dreadnaught | The Breach | **Gravity Well** — pulls enemies to a point + crush damage |

**Weakness Chains** (Mega Man-style): Each boss is weak to another boss's power. Discovering the optimal boss order is part of the fun — but any order is completable.

### 2.3 RPG Progression Systems

#### Character Level (1-50)
- XP from enemies, bosses, quests, exploration discoveries
- Each level grants: +HP, +Energy, +1 Stat Point, +1 Skill Point (alternating)
- Level milestones unlock new tier of equipment and ability upgrades
- Leveling feels meaningful every time — no "dead levels"

#### Stats (4 Core Stats)
| Stat | Effect |
|------|--------|
| **Might** | Melee damage, knockback power, HP bonus |
| **Precision** | Ranged/projectile damage, crit chance, aim speed |
| **Arcana** | Boss power damage, energy pool, energy regen |
| **Vitality** | Max HP, defense, status resistance, HP regen |

Players allocate points each level. This creates build diversity — a Might/Vitality Vanguard plays completely differently from a Precision/Arcana Vanguard.

#### Skill Trees (Class-Specific)
Each class has **3 skill branches** with 8 skills each (24 total per class). You won't max all three — meaningful choices.

Example (Vanguard class):
- **Warblade** — melee combo extensions, damage multipliers, execute threshold
- **Bulwark** — parry bonuses, damage reduction, counter-attacks, ally shielding
- **Berserker** — risk/reward skills that trade defense for offense, lifesteal, rage meter

#### Equipment & Inventory
- **Weapon slot** (class-specific weapon with varied stats/effects)
- **Armor slot** (light/medium/heavy — tradeoff between defense and mobility)
- **2 Accessory slots** (rings, charms, relics — unique passive effects)
- **2 Boss Power slots** (absorbed abilities)
- **Consumable belt** (3 slots — potions, bombs, buffs, assigned to quick-use)

Equipment drops from enemies and chests with **randomized modifiers**:
- **Common** (white) — base stats
- **Uncommon** (green) — +1 modifier
- **Rare** (blue) — +2 modifiers
- **Epic** (purple) — +2 modifiers + unique effect
- **Legendary** (gold) — fixed unique items with powerful themed effects (1 per zone)

**Modifier examples**: +fire damage, lifesteal on crit, energy on kill, thorns damage, movement speed, double jump height, etc.

### 2.4 Multiplayer Design

**3-Player Online Co-op** (primary mode — Eddie, Changa & Tai)

- Drop-in/drop-out — one player can start solo, others join seamlessly (1-3 players)
- Shared world progression — all players advance the story together
- **Independent builds** — each player levels and builds independently
- **Combo system** — abilities synergize between players:
  - Two-player combos: One player freezes an enemy, another shatters for bonus damage. One launches airborne, another juggles with ranged attacks.
  - **Three-player Convergence Burst**: When all 3 players activate boss powers simultaneously, triggers a devastating **Triple Convergence** — a screen-clearing ultimate unique to the 3-power combination. With 3 players choosing from 8 powers, the discovery space is massive.
  - **Chain combos**: Player A launches → Player B juggles → Player C finishes. Longer chains = bigger damage multiplier.
- **Revive mechanic** — downed player has 12 seconds before death. A partner can revive by standing near them for 3 seconds. If all 3 die, respawn at last checkpoint. With 3 players, one can draw aggro while another revives — creates natural tactical teamwork.
- **Shared screen? No.** Each player has independent camera/viewport. The world streams around each player. If players are in the same area, they see each other. If separated, they're in different parts of the map — with 3 players, you can split up to explore or tackle different objectives simultaneously.
- **Communication**: Built-in ping system (mark locations, enemies, items) + emote wheel. Color-coded per player (Player 1: blue, Player 2: red, Player 3: gold). Voice chat via browser WebRTC.
- **Difficulty scaling**: Enemy HP and spawn counts scale with player count (solo × 1.0, duo × 1.6, trio × 2.2). Boss patterns add extra simultaneous attacks with more players — not just HP sponges, actually harder and more dynamic fights.

**Solo & Duo Modes**: Fully playable with 1-3 players. Difficulty scales to party size. Designed to be challenging but fair at every player count.

**Future Stretch: PvP Arena** — optional competitive mode (1v1, 1v1v1, or 2v1) where players fight each other using their builds. Not in v1.0 but the build diversity makes this natural later.

---

## 3. CHARACTERS & CLASSES

### 3.1 Starting Classes (Choose at Game Start)

Each player picks one of **4 classes**. Players CAN pick the same class but the game shines when all three complement each other. With 3 players and 4 classes, one class is always "unrepresented" — creating natural replayability as the group tries different trio compositions.

#### VANGUARD (Melee Fighter)
- **Weapon**: Plasma Blade (fast sword combos, 3-hit chain → launcher → slam)
- **Playstyle**: In-your-face aggression, parry-based defense, combo-driven
- **Strengths**: Highest melee DPS, best parry window, strong stagger
- **Weaknesses**: Must be close range, lower energy pool
- **Skill Branches**: Warblade / Bulwark / Berserker
- **Visual**: Heavy armored knight with glowing circuit-line accents. Blade hums with energy.

#### GUNNER (Ranged Specialist)
- **Weapon**: Pulse Rifle (auto-aim assist at close range, manual aim at distance, charge shot)
- **Playstyle**: Positional, keep distance, charged shots for burst damage
- **Strengths**: Safe damage from range, charge shot pierces, great boss power synergy
- **Weaknesses**: Lower HP, weaker up close, charge shot roots you briefly
- **Skill Branches**: Sharpshooter / Demolitionist / Technomancer
- **Visual**: Light armor with a bulky arm-cannon (Mega Man homage). Visor with targeting HUD.

#### WRAITH (Agile Assassin)
- **Weapon**: Twin Ether Daggers (extremely fast attacks, lower per-hit damage, crit-focused)
- **Playstyle**: Mobile, evasive, crit-stacking, in-and-out hit-and-run
- **Strengths**: Fastest movement, best dodge, highest crit rate, wall-cling from start
- **Weaknesses**: Lowest HP, lowest defense, punished hard by mistakes
- **Skill Branches**: Shadowstrike / Phantom / Venomist
- **Visual**: Hooded figure with a tattered cloak that trails shadow particles. Daggers leave afterimages.

#### CHANNELER (Mage/Support Hybrid)
- **Weapon**: Spell Focus (medium-range magic projectiles, hold to channel beam)
- **Playstyle**: Versatile — can DPS or support depending on build. Boss powers are enhanced.
- **Strengths**: Largest energy pool, boss powers deal +30% damage, can heal/buff partner
- **Weaknesses**: Slowest base movement, channeling is interruptible, squishy without buffs
- **Skill Branches**: Arcanist / Warden / Riftcaller
- **Visual**: Robed figure with a floating crystalline focus orbiting their hand. Runes glow on their arms.

### 3.2 Class Synergy (3-Player Co-op Design)

With 3 players choosing from 4 classes, there are **4 possible trio compositions** — each plays differently:

| Trio | Playstyle | Missing Role |
|------|-----------|-------------|
| **Vanguard + Gunner + Wraith** | All-offense blitz squad. Overwhelming DPS, aggressive play. | No healer/support — must play skillfully or rely on consumables |
| **Vanguard + Gunner + Channeler** | Balanced classic party. Tank holds, DPS fires, support sustains. | No flanker — enemies that escape the front line are dangerous |
| **Vanguard + Wraith + Channeler** | Melee-heavy brawler squad. In-your-face with support backup. | No ranged — flying enemies and distant turrets are a problem |
| **Gunner + Wraith + Channeler** | Glass cannon trio. Massive damage and utility but fragile. | No tank — boss aggro is harder to manage, big hits punish hard |

Each composition has a clear strength AND a weakness that forces the group to adapt. No "best" trio — just different challenges.

**Pair synergies within the trio:**
- **Vanguard + Gunner**: Classic tank/DPS. Vanguard draws aggro, Gunner unloads from safety.
- **Vanguard + Wraith**: Melee pincer. Vanguard holds front, Wraith flanks and crits.
- **Vanguard + Channeler**: Tank/healer. Channeler sustains, Vanguard protects.
- **Gunner + Wraith**: Ranged + melee burst. Gunner softens, Wraith finishes.
- **Gunner + Channeler**: Zone control. Projectiles and area denial dominate the screen.
- **Wraith + Channeler**: Buff-assassin combo. Channeler supercharges Wraith's crits.

---

## 4. WORLD DESIGN & PROGRESSION

### 4.1 World Map Structure

The world is a large **interconnected 2D map** (Metroidvania-style) divided into **8 major zones + 4 hidden zones + hub town**. Zones connect to each other — not a stage-select screen. You explore, find routes, unlock shortcuts.

However, like Mega Man, after the intro you can choose which **direction** to explore first. 4 zones are accessible from the hub immediately (in different directions). The other 4 unlock after beating the first 4 bosses (their powers open new paths).

```
                    [Signal Tower]
                         |
    [Blighted Garden] -- [HUB: Threshold] -- [Neon Foundry]
         |                    |                    |
    [Mirror Sanctum]    [Cryptvault]         [Siege Engine]
         |                    |                    |
    [Ashen Cathedral] ------[The Breach]----------+
                              |
                        [FINAL: The Core]
```

### 4.2 Zone Descriptions

**The Threshold (Hub Town)**
- Safe zone (during day). Shops, blacksmith, quest NPCs, save point, class trainer.
- At night, some NPCs transform into optional mini-bosses (Simon's Quest homage — "What a horrible night to have a curse").
- Grows and changes as you progress — new NPCs arrive, buildings are repaired, new shops open.

**Zone 1: Neon Foundry** (Accessible from start)
- Theme: Abandoned high-tech factory fused with medieval forges
- Aesthetic: Molten metal rivers, conveyor belt platforms, pneumatic presses as hazards, neon-lit industrial corridors
- Enemies: Rogue worker-bots, slag golems, electric fence turrets
- Boss: **Voltrexx** — a massive power-core construct that controls electricity
- Mechanic introduced: Moving platforms, conveyor physics

**Zone 2: Blighted Garden** (Accessible from start)
- Theme: Once-beautiful royal gardens corrupted by toxic magic
- Aesthetic: Overgrown ruins, bioluminescent toxic flowers, spore clouds, twisted statuary
- Enemies: Poisonous plant creatures, corrupted garden automatons, fungal zombies
- Boss: **Lady Hemlock** — a tragic sorceress merged with her garden
- Mechanic introduced: Poison zones, destructible terrain, vine-swinging

**Zone 3: Cryptvault** (Accessible from start)
- Theme: Ancient catacombs beneath a ruined castle, filled with undead and traps
- Aesthetic: Gothic stone, coffin-lined halls, spectral blue light, spiked pits, swinging pendulums
- Enemies: Skeletons (classic!), ghosts that phase through walls, bone dragons
- Boss: **The Hollow King** — an undead monarch on a throne of skulls
- Mechanic introduced: Traps (timing-based), dark rooms (limited visibility), spectral bridges only visible at certain times

**Zone 4: Siege Engine** (Accessible from start)
- Theme: A colossal war machine — you're literally fighting through the interior of a walking fortress
- Aesthetic: Gears, cannons, ammo conveyors, the whole zone subtly sways/moves
- Enemies: Armored soldiers, siege turrets, mini-tank drones
- Boss: **Ironmaw** — the engine's AI core, fights using the fortress's weapons
- Mechanic introduced: Auto-scrolling sections (the engine is moving), turret sequences where you man a cannon

**Zone 5: Mirror Sanctum** (Requires Phase Shift OR Thornlash to access hidden path)
- Theme: Reality-warped temple where reflections are alive
- Aesthetic: Crystal halls, impossible geometry, mirror surfaces showing alternate versions of the level
- Enemies: Mirror duplicates of the players (use your abilities against you), geometric constructs
- Boss: **Spectra** — a being that exists in reflections, attacks from mirrors
- Mechanic introduced: Mirror puzzles (hit switches in the reflection), gravity flipping in certain rooms

**Zone 6: Signal Tower** (Requires Chain Lightning to power up the elevator)
- Theme: A massive communication spire reaching into the static-filled sky
- Aesthetic: Vertical zone — climbing upward. Antenna arrays, holographic displays, data-stream waterfalls
- Enemies: Corrupted data constructs, signal parasites, firewall barriers
- Boss: **Conductor IX** — an AI that controls sound and signal, attacks with wave patterns
- Mechanic introduced: Vertical scrolling/climbing, frequency-matching puzzles, platforms that phase in/out to a rhythm

**Zone 7: Ashen Cathedral** (Requires Soul Drain to survive the cursed threshold)
- Theme: A burning church that never finishes burning — frozen in eternal flame
- Aesthetic: Gothic cathedral architecture wreathed in perpetual fire, stained glass that tells the lore, ash drifts like snow
- Enemies: Flame priests, ember wraiths, living fire
- Boss: **Emberwitch** — a high priestess who chose to burn with her cathedral
- Mechanic introduced: Heat meter (too long in fire zones = damage), fire/ice elemental interactions, destructible stained glass reveals secrets

**Zone 8: The Breach** (Requires 6+ boss powers to force open)
- Theme: The epicenter where The Pale and The Grid collided — reality is broken
- Aesthetic: Glitched terrain — chunks of medieval castle float next to server racks. The background is pure dimensional static. Gravity shifts. The screen occasionally "glitches."
- Enemies: Convergence horrors (fusions of tech and magic), reality tears that spawn random enemies
- Boss: **Dreadnaught** — a fused knight/mech titan, the first being created by the Convergence
- Mechanic introduced: Reality-shift sections where the rules change (gravity, physics, enemy behavior)

**THE CORE (Final Zone)** — Requires all 8 boss powers
- The source of the Convergence. A multi-phase gauntlet leading to the final boss.
- Final Boss: **The Architect** — the entity that intentionally caused the Convergence. Three phases: magic form, tech form, true form (fusion). Uses ALL boss abilities against you.

### 4.3 Hidden Zones (Secret Content)

4 hidden zones, each accessed through cryptic clues found across the main game:
1. **The Underclock** — a frozen-in-time pocket dimension. Hidden boss: **Paradox**
2. **Null Garden** — the "deleted" version of Blighted Garden. Hidden boss: **Root**
3. **The Composer's Hall** — a zone themed around the game's own soundtrack. Hidden boss: **Dissonance**
4. **Memory Lane** — an 8-bit recreation of an "earlier version" of the game. Hidden boss: **Legacy** (fights using classic Mega Man and Castlevania enemy patterns)

---

## 5. PROGRESSION FLOW & PACING

### Hour-by-Hour Breakdown

**Hour 0-1: The Awakening (Tutorial/Intro)**
- In-media-res cold open: players fight a powerful enemy, lose, wake up in the Threshold with basic abilities
- Learn movement, combat, and basic mechanics through the hub area
- Choose first zone to explore (4 are open)
- Reach Level 3-4

**Hours 1-4: First Wave (Zones 1-4)**
- Explore first 4 zones in any order
- Defeat first 4 bosses, absorb 4 powers
- Experiment with power combinations
- Reach Level 12-15
- Unlock: Wall-jump, first tier of skill tree, equipment crafting, shop expansions

**Hours 4-8: Second Wave (Zones 5-8)**
- New zones accessible via boss powers
- Significantly harder enemies requiring mastered mechanics
- More complex platforming and puzzles
- Reach Level 25-30
- Unlock: Class-specific advanced movement, second tier of skill tree, rare equipment, combo system mastery

**Hours 8-12: The Breach & Endgame**
- The Breach + The Core
- Final boss encounter
- Reach Level 35-40
- Hidden zones become accessible through discovered clues
- First ending achieved

**Hours 12-20+: Post-Game & Mastery**
- Hidden zones and secret bosses
- New Game+ (enemies scale, new modifiers, alternate story details)
- Build optimization and experimentation
- Blood Moon hunting for rare materials
- Achievement hunting, speedrun practice
- Level cap 50 with final skill unlocks
- Legendary equipment set completion

### Progression Unlock Timeline

| Milestone | Unlocks |
|-----------|---------|
| Tutorial complete | Basic attacks, jump, menu, first zone access |
| Level 5 | Dash ability, consumable belt, equipment comparison |
| First boss killed | Boss power system, power-swap at save points |
| Level 10 | Skill tree access (first branch), crafting bench |
| 2 bosses killed | Combo system between players, accessory slots |
| Level 15 | Second skill branch choice, advanced shop items |
| 4 bosses killed | Second wave zones, class advanced movement |
| Level 20 | Third skill branch, ultimate ability |
| Level 25 | Equipment upgrade/reforging system |
| 6 bosses killed | The Breach access, legendary quest lines |
| All 8 bosses | The Core access, NG+ available after completion |
| Level 40 | Final skill tree capstones |
| Hidden bosses | Unique legendary equipment + alternate ultimate |
| Level 50 | Mastery prestige skills (small but impactful bonuses) |

---

## 6. ART & AUDIO DIRECTION

### Visual Style: "Neo-Retro 16-bit"

- **Resolution target**: 480x270 base (scaled up to display resolution) — this gives a clean pixel look at 16:9 that's higher fidelity than NES/SNES but unmistakably retro
- **Pixel art style**: Detailed 16-bit sprites (32x48 character size, ~64x64 for bosses, ~128x128+ for large bosses) with smooth animation (8-12 frames per action)
- **Color palette**: Rich and varied per zone, but each zone has a cohesive palette. Use limited palettes within zones for visual coherence, then go vibrant for effects.
- **Modern enhancements on pixel art**:
  - Dynamic lighting (point lights from torches, neon signs, projectiles — lights interact with the pixel environment)
  - Parallax scrolling backgrounds (3-4 layers of depth per zone)
  - Particle effects (sparks, embers, magic particles, rain, spores)
  - Screen shake, hit-stop, and chromatic aberration on big impacts
  - Subtle CRT/scanline filter (toggleable — for extra retro vibes)
- **UI**: Clean pixel-art HUD. HP bar, Energy bar, Boss Power icons, minimap, partner HP. Non-intrusive. Menus are styled like a gothic tech terminal.

### Audio

- **Music**: Synth-metal/darksynth. Each zone has a unique exploration track + boss remix. Hub has a moody ambient track. Night versions of zone tracks are darker/slower.
- **SFX**: Punchy, satisfying. Every hit, jump, power-up, and menu interaction has a sound. Retro-inspired but not chiptune — fuller, richer.
- **Ambient**: Environmental audio per zone (factory clanking, garden insects, crypt echoes, wind in the tower)
- **Voice**: Minimal. Boss intro lines (text + synthesized voice effect). No full voice acting — let the music and SFX do the work.

---

## 7. TECHNICAL ARCHITECTURE

### Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Game Engine** | **Phaser 3** (TypeScript) | Best-in-class web 2D framework, WebGL rendering, built-in physics, tilemap support, active community, Eddie knows JS/TS |
| **Multiplayer** | **Colyseus** (Node.js) | Purpose-built for web game multiplayer, room-based, state synchronization, TypeScript, handles authoritative server |
| **Rendering** | Phaser + custom shaders | WebGL for dynamic lighting/particles, custom post-processing for CRT filter, chromatic aberration |
| **Level Design** | **Tiled** (map editor) → JSON export | Industry-standard 2D level editor, free, exports to Phaser-compatible format |
| **Asset Pipeline** | **Aseprite** (pixel art) → sprite sheets | Best pixel art tool, animation support, exports sprite sheets directly |
| **Audio** | **Howler.js** (via Phaser) | Web audio with fallbacks, spatial audio support |
| **Backend/Auth** | **Supabase** | Auth, player profiles, save data, leaderboards — Eddie's preferred stack |
| **Hosting** | **Vercel** (client) + **Railway or Fly.io** (game server) | Vercel for static/client, persistent server needed for multiplayer |
| **Build** | **Vite** | Fast TS bundling, HMR for dev, optimized production builds |

### Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                   CLIENT (Browser)                │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Phaser 3 │  │ Game     │  │ UI Layer      │  │
│  │ Renderer │  │ Logic    │  │ (HUD, Menus)  │  │
│  └──────────┘  └──────────┘  └───────────────┘  │
│         │            │              │             │
│         └────────────┼──────────────┘             │
│                      │                            │
│              ┌───────┴────────┐                   │
│              │ Network Client │                   │
│              │ (Colyseus SDK) │                   │
│              └───────┬────────┘                   │
└──────────────────────┼────────────────────────────┘
                       │ WebSocket
┌──────────────────────┼────────────────────────────┐
│              ┌───────┴────────┐    GAME SERVER     │
│              │ Colyseus Room  │                    │
│              │ (Auth Server)  │                    │
│              └───────┬────────┘                    │
│         ┌────────────┼────────────┐               │
│  ┌──────┴──────┐  ┌──┴───┐  ┌───┴────────┐      │
│  │ Game State  │  │ ECS  │  │ Physics    │      │
│  │ Sync        │  │      │  │ Validation │      │
│  └─────────────┘  └──────┘  └────────────┘      │
│                      │                            │
│              ┌───────┴────────┐                   │
│              │   Supabase     │                   │
│              │ (Save/Auth/LB) │                   │
│              └────────────────┘                   │
└───────────────────────────────────────────────────┘
```

### Multiplayer Architecture (Authoritative Server)

- Server owns game state (positions, HP, damage calculations) to prevent cheating
- Client sends **inputs** (key presses), server processes and broadcasts **state**
- Client-side prediction + server reconciliation for responsive feel despite latency
- Interpolation for smooth rendering of the other player's movement
- Target: playable at up to ~150ms latency (covers most same-continent connections)

### Save System

- Server-side saves via Supabase (cloud saves — play from any browser)
- Auto-save at checkpoints (save crystals placed throughout zones)
- Save data: player level, stats, inventory, boss powers, world state (which bosses defeated, shortcuts opened, NPCs met), quest progress
- Multiple save slots (3 per account)

---

## 8. DEVELOPMENT PHASES & TIMELINE

### Phase 0: Foundation (Weeks 1-3)
**Goal**: Playable character moving and attacking in a test level

- [ ] Project setup: Vite + Phaser 3 + TypeScript boilerplate
- [ ] Basic player controller: run, jump, attack (one class — Vanguard)
- [ ] Placeholder tilemap level (grey boxes)
- [ ] Basic enemy AI (walk, patrol, chase, attack)
- [ ] Collision detection and damage system
- [ ] Camera system following player
- [ ] **Milestone**: One character running, jumping, and fighting enemies in a test level

### Phase 1: Core Combat & Feel (Weeks 4-6)
**Goal**: Combat feels great — the core verb is fun in isolation

- [ ] Polish movement (acceleration curves, coyote time, input buffering)
- [ ] Full Vanguard combo system (3-hit chain, launcher, slam)
- [ ] Hit-stop, screen shake, knockback
- [ ] Enemy variety (3 types: melee, ranged, flying)
- [ ] Health/Energy system
- [ ] Death and respawn
- [ ] Basic particle effects (hit sparks, dust on landing)
- [ ] **Milestone**: Grey-box level that's FUN to play — the core loop works

### Phase 2: Additional Classes & Local Multiplayer (Weeks 7-10)
**Goal**: Three players on screen, different classes

- [ ] Implement Gunner class (ranged, charge shot)
- [ ] Implement Wraith class (fast, crit-focused)
- [ ] Split-input local testing (multiple keyboards/gamepads)
- [ ] Basic HUD supporting 3 player displays (HP bars, energy)
- [ ] Revive mechanic (with 3-player tactical dynamics)
- [ ] Combo system — 2-player chains + 3-player Triple Convergence
- [ ] Difficulty scaling by player count (1/2/3)
- [ ] **Milestone**: Three classes playable in co-op locally

### Phase 3: RPG Systems (Weeks 10-13)
**Goal**: Leveling, stats, equipment, and skill trees functional

- [ ] XP and leveling system
- [ ] Stat allocation UI
- [ ] Skill tree UI and implementation (Vanguard + Gunner first)
- [ ] Equipment system (weapon, armor, 2 accessories)
- [ ] Item drops from enemies
- [ ] Inventory management screen
- [ ] Loot rarity system with random modifiers
- [ ] Save/load (local first, then Supabase)
- [ ] **Milestone**: Full RPG loop — kill, loot, level, equip, grow stronger

### Phase 4: Boss Power System (Weeks 14-16)
**Goal**: Boss fights and power absorption working

- [ ] Boss AI framework (phases, patterns, vulnerability windows)
- [ ] First 2 bosses implemented (Voltrexx, Lady Hemlock)
- [ ] Power absorption mechanic
- [ ] Boss power equip UI (2 slots, swap at save points)
- [ ] Power weakness chain (boss takes extra damage from specific powers)
- [ ] **Milestone**: Beat a boss → get their power → it's useful and cool

### Phase 5: World Building — First 4 Zones (Weeks 17-22)
**Goal**: First half of the game is playable and polished

- [ ] Pixel art tileset for each of the first 4 zones
- [ ] Level design for Neon Foundry, Blighted Garden, Cryptvault, Siege Engine
- [ ] Zone-specific enemies (3-4 types each)
- [ ] All 4 first-wave bosses
- [ ] Hub town (The Threshold) with NPCs, shops, save
- [ ] Day/night cycle implementation
- [ ] Night-specific enemy variants and zone changes
- [ ] Environmental storytelling and lore items
- [ ] Zone-specific music tracks (placeholder → final)
- [ ] **Milestone**: 4+ hours of content, fully playable solo

### Phase 6: Online Multiplayer (Weeks 23-27)
**Goal**: Eddie and Changa can play together over the internet

- [ ] Colyseus server setup
- [ ] Client-side prediction and server reconciliation
- [ ] Player state synchronization (position, animation, combat)
- [ ] Room/lobby system (create game, join game, invite by code)
- [ ] Supabase auth (accounts, friend system)
- [ ] Cloud save integration
- [ ] Latency handling and interpolation
- [ ] Voice chat via WebRTC (optional — can use Discord instead)
- [ ] **Milestone**: Playable co-op online, feels responsive, saves work

### Phase 7: Remaining Classes & Zones (Weeks 28-35)
**Goal**: Full game content

- [ ] Wraith and Channeler classes (full skill trees)
- [ ] Zones 5-8 (Mirror Sanctum, Signal Tower, Ashen Cathedral, The Breach)
- [ ] All 8 zone bosses
- [ ] The Core (final zone + final boss)
- [ ] All boss powers implemented and balanced
- [ ] Night cycle boss rematches
- [ ] Blood Moon event
- [ ] Full equipment set (all rarity tiers, legendary items)
- [ ] Crafting/upgrade system at blacksmith
- [ ] All zone music and SFX
- [ ] **Milestone**: Complete main game playable end-to-end

### Phase 8: Polish, Secrets & Post-Game (Weeks 36-40)
**Goal**: The game feels finished, rewarding, and deep

- [ ] Hidden zones (4) and secret bosses
- [ ] New Game+ mode
- [ ] Achievement system
- [ ] NPC quest lines with rewards
- [ ] Balance pass (enemy HP/damage tuning, boss difficulty curves, equipment stats)
- [ ] Speedrun timer (optional toggle)
- [ ] Accessibility options (remappable controls, colorblind modes, screen shake toggle)
- [ ] UI/UX polish pass
- [ ] Performance optimization
- [ ] Bug fixing
- [ ] **Milestone**: Ship-ready v1.0

---

## 9. UNIQUE / CREATIVE MECHANICS

### 9.1 The Convergence Burst (Co-op Ultimate)
When both players activate their boss powers simultaneously on the same enemy/area, they trigger a **Convergence Burst** — a devastating combined attack unique to the power combination. With 8 boss powers and 2 slots each, there are **28 unique Convergence Burst combinations**. Discovering them all is a meta-goal.

### 9.2 The Echo System
At certain save points, you find **Echo Crystals** that replay ghostly scenes of what happened there before the Convergence. These are the game's primary storytelling device — short, wordless pixel-art cutscenes that gradually reveal the full story. They're optional but completionists will hunt them all.

### 9.3 Cursed Relics
Rare accessory drops that give massive power boosts but with significant drawbacks:
- **Bloodstone Ring**: +50% damage, but you lose 1 HP per second
- **Greedy Crown**: 2x gold drops, but shops charge 3x prices
- **Phantom Cloak**: Enemies can't see you (stealth!), but you deal 40% less damage
- **Berserker's Mark**: Damage scales with missing HP (low HP = massive damage)

### 9.4 NPC Transformation (Night)
During night, specific NPCs in the Threshold transform:
- The shopkeeper becomes a hidden mini-boss (drops rare merchant-themed loot)
- The lore keeper speaks in cryptic riddles that are actually coordinates to hidden zones
- The blacksmith can forge "Nightforged" equipment (only at night, uses rare night-drop materials, more powerful but cursed)

### 9.5 The Bestiary & Compendium
A collectible encyclopedia that fills in as you fight enemies, discover lore, and explore. Completing sections unlocks concept art, music player tracks, and gameplay modifiers (big head mode, palette swap to 8-bit, etc.).

### 9.6 Challenge Rooms
Hidden rooms scattered throughout zones that are pure skill tests — no RPG stats, normalized equipment. Leaderboards for completion time. These let skilled players flex regardless of level.

---

## 10. MONETIZATION & DISTRIBUTION

### Distribution: Free-to-Play Web Game

Since this is a passion project for you and Changa, I recommend:

- **Free to play** on a custom domain (neonrequiem.com or similar)
- Also published on **itch.io** (built-in community, discovery, optional donations)
- Supabase handles auth/saves — players create a free account to save progress
- **Optional "tip jar"** — players can support development if they want
- No ads, no loot boxes, no pay-to-win. Pure game.

### If You Want Revenue Later
- Cosmetic DLC (character skins, visual effects) via Stripe/itch.io
- Soundtrack for sale (Bandcamp)
- "Supporter Pack" with cosmetic perks + credit in the game
- The web version is the base — a polished Steam release (via Electron or Tauri wrapper) at $10-15 could work if the game gains traction

---

## 11. PROJECT STRUCTURE

```
neon-requiem/
├── client/                    # Phaser game client
│   ├── src/
│   │   ├── scenes/           # Phaser scenes (menu, gameplay, UI)
│   │   ├── entities/         # Player, enemies, bosses, NPCs
│   │   ├── systems/          # Combat, physics, inventory, progression
│   │   ├── ui/               # HUD, menus, inventory screen
│   │   ├── network/          # Colyseus client, state sync
│   │   ├── utils/            # Helpers, constants, types
│   │   └── main.ts           # Entry point
│   ├── public/
│   │   ├── assets/           # Sprites, tilesets, audio
│   │   └── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/                    # Colyseus game server
│   ├── src/
│   │   ├── rooms/            # Game room logic
│   │   ├── systems/          # Server-side game logic
│   │   ├── schema/           # Colyseus state schemas
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── shared/                    # Shared types, constants, game data
│   ├── types/
│   ├── constants/
│   └── data/                 # Enemy stats, equipment, skill trees (JSON)
├── assets-src/               # Source art files (Aseprite, Tiled)
│   ├── sprites/
│   ├── tilesets/
│   ├── maps/
│   └── audio/
├── docs/                     # Design docs, balance spreadsheets
├── PROJECT-PLAN.md           # This file
└── README.md
```

---

## 12. TOOLS & SETUP NEEDED

| Tool | Purpose | Cost |
|------|---------|------|
| **VS Code** | Code editor | Free (already have) |
| **Node.js 20+** | Runtime | Free |
| **Phaser 3** | Game framework | Free (MIT) |
| **Colyseus** | Multiplayer | Free (open source) |
| **Tiled** | Level editor | Free |
| **Aseprite** | Pixel art & animation | $20 (one-time) or compile from source free |
| **Supabase** | Auth, database, saves | Free tier sufficient for dev |
| **Vercel** | Client hosting | Free tier |
| **Railway / Fly.io** | Game server hosting | ~$5-10/mo for dev |
| **Audacity / LMMS** | Audio editing / music | Free |
| **Git + GitHub** | Version control | Free (already have) |

---

## 13. RISK ASSESSMENT & MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Scope creep** | High | This plan is the MAX scope. Cut hidden zones and NG+ first if needed. Core game is 8 zones + 4 classes. |
| **Multiplayer complexity** | High | Build solo-playable game FIRST (Phases 0-5). Add multiplayer as a layer on top. Game must be fun solo. |
| **Art bottleneck** | Medium | Start with placeholder art. Consider commissioning pixel art from itch.io community if needed ($50-200 per character). AI-assisted sprite generation for prototyping. |
| **Balance** | Medium | Use shared JSON data files for all stats. Easy to tune. Playtest regularly. Spreadsheet balance before in-game testing. |
| **Browser performance** | Low-Med | Phaser 3 + WebGL handles this well. Object pooling for projectiles/particles. Profile early, optimize late. |
| **Burnout** | Medium | This is a passion project. Keep it fun. Play other games for inspiration. Take breaks. Ship something small and iterate. |

---

## 14. IMMEDIATE NEXT STEPS

1. **Set up the project** — Initialize the repo, Vite + Phaser + TS boilerplate
2. **Grey-box prototype** — Get a character running, jumping, and slashing in a test level within the first session
3. **Core feel iteration** — Spend real time making movement and combat feel great before adding any systems
4. **First boss prototype** — Build Voltrexx as a proof of concept for the boss framework
5. **Then layer systems** — RPG, multiplayer, and content come after the core feels right

---

## NAME IDEAS (Final Pick TBD)

| Name | Vibe |
|------|------|
| **Neon Requiem** | Top pick. Captures both the tech (neon) and gothic (requiem) fusion. Memorable, evocative. |
| **Convergence** | Describes the core event. Clean but maybe too generic. |
| **Duskborne** | Day/night focus. Strong but less unique. |
| **Circuit & Crypt** | Descriptive of the fusion. Fun alliteration but maybe too literal. |
| **Shattered Reach** | World name as title. Solid but less evocative. |
| **Void Breakers** | Action-oriented. Cool but generic. |

**Recommendation: Neon Requiem** — it's unique, Googleable, captures the theme, and sounds like a game you'd want to play.

---

*Let's build this thing.* 🎮⚔️🌙
