# NEON REQUIEM
### A Web-Native Multiplayer Side-Scroller / Action-RPG
#### *"Where dark magic meets dying technology"*

---

## The Elevator Pitch

**Neon Requiem** is a 2-player co-op side-scrolling action-RPG set in a cursed world where ancient sorcery and decaying high technology have fused into something monstrous. Two warriors — each with a distinct class and playstyle — fight through interconnected zones, solve cooperative puzzles, defeat powerful bosses to absorb their abilities, level up, customize builds, and unravel the mystery of the Convergence that shattered reality.

Think: **Mega Man's boss-power absorption + Simon's Quest's RPG exploration + 2-player co-op + modern build diversity.**

Readable retro-inspired aesthetic with modern fonts, lighting, particles, and parallax — retro soul, modern clarity.

---

## 0. VERTICAL SLICE (v0.5) — SHIP THIS FIRST

**Before building the full game, ship a complete, polished, fun experience:**

| Element | Scope |
|---------|-------|
| Classes | **2** — Vanguard + Gunner (melee/ranged covers the most ground) |
| Zones | **2** — Neon Foundry + Cryptvault (tech + gothic, one from each side of The Convergence) |
| Bosses | **2** — Voltrexx + The Hollow King, with power absorption and one weakness link between them |
| Skill branches | **1 per class** (not all 3) |
| Equipment | **3 tiers** (common, uncommon, rare) — no random modifiers yet |
| Day/night | Hub only |
| Co-op | **2-player online** working |
| Convergence Burst | **1** as proof of concept (Chain Lightning + Soul Drain) |
| Hub | Basic Threshold — save, 1 shop, 1 NPC |
| Co-op puzzles | **1 per zone** — prove the non-combat cooperation works |

**This is a complete game.** Two friends pick classes, fight through two zones, beat two bosses, absorb powers, and experience the co-op systems. If it's fun, everything else is expansion content. If it's not fun, no amount of additional zones will fix it.

**v0.5 target: ~2 hours of content, fully playable solo or co-op.**

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

Gothic horror meets cyberpunk decay. Not campy, not grimdark — somewhere between Castlevania's brooding atmosphere and Mega Man's sense of colorful adventure. The world is dangerous and mysterious but there's hope. The two players are that hope.

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
- Block/Parry (timing-based — perfect parry reflects projectiles and staggers enemies, 8-10 frame window minimum for latency tolerance)
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

**2-Player Online Co-op** (primary mode — Eddie + Changa or Eddie + Tai, rotating)

- Drop-in/drop-out — one player can start solo, the other joins seamlessly
- Shared world progression — both players advance the story together
- **Independent builds** — each player levels and builds independently
- **Combo system** — abilities synergize between players:
  - **Convergence Burst**: When both players activate boss powers simultaneously, triggers a devastating combined attack unique to the power combination. With 8 powers and 2 slots each, there are **28 unique Convergence Burst combinations** to discover.
  - **Chain combos**: Player A launches → Player B juggles. Longer chains = bigger damage multiplier.
- **Revive mechanic** — downed player has 12 seconds before death. Partner can revive by standing near them for 3 seconds. If both die, respawn at last checkpoint. One player can draw aggro while the other revives — creates natural tactical teamwork.
- **Shared screen? No.** Each player has independent camera/viewport. The world streams around each player. If players are in the same area, they see each other. If separated, they're in different parts of the map — allowing split exploration or tackling different objectives simultaneously.
- **Communication**: Built-in ping system (mark locations, enemies, items) + emote wheel. Color-coded per player (Player 1: blue/cyan, Player 2: red/gold). Voice chat via browser WebRTC.
- **Difficulty scaling**: Enemy HP and spawn counts scale with player count (solo × 1.0, duo × 1.6). Boss patterns add extra simultaneous attacks with a partner present — not just HP sponges, actually harder and more dynamic fights.

**Solo Mode**: Fully playable alone. Difficulty scales to party size. Designed to be challenging but fair solo.

### 2.5 Cooperative Non-Combat Design

The best co-op memories come from thinking together, not just fighting side by side. Every zone includes cooperative elements beyond combat:

**Cooperative Puzzles:**
- Two-switch doors requiring both players to hold simultaneously
- Mirror puzzles where each player controls a beam from different sides (Mirror Sanctum)
- Frequency-matching puzzles where one player reads patterns while the other inputs them (Signal Tower)
- Asymmetric information challenges — one player sees a maze from above, guides the other through

**Cooperative Traversal:**
- Player boost — one player can launch the other to a high ledge, then the other drops a rope/switch
- Class-specific traversal partnerships — Vanguard smashes through a wall, Wraith fits through the gap to open the door from the other side
- Timed platform sequences where both players must coordinate movements

**Shared Resource Decisions:**
- Treasure chests that contain one great item — who takes it?
- Branching paths where players must split up, each handling a different challenge alone before reuniting
- Limited consumables that create micro-negotiations ("you take the health potion, I'll dash through")

**Solo Adaptations:** In solo mode, puzzles have alternate solutions (a pressure plate timer instead of a second player, an NPC ghost companion for asymmetric puzzles).

### 2.6 Disconnection & Reconnection

Web games lose connection constantly. This must be handled gracefully:

- **Grace period**: 45-second window before a disconnected player's character despawns
- **AI takeover**: During grace period, disconnected player's character becomes a basic AI ally (follows, attacks nearby enemies, avoids hazards — doesn't use boss powers or consumables)
- **Reconnection**: Player reconnects to their exact state (position, HP, inventory, buffs)
- **Boss fight handling**: If a player disconnects mid-boss, boss HP scales down to solo difficulty after the grace period. Boss doesn't reset.
- **Save protection**: The remaining player's progress is never penalized by a partner's disconnect. World state saves for both players independently.
- **Session persistence**: Room stays alive for 5 minutes after last player leaves, allowing both to reconnect

### 2.7 Buddy System (Friendship Progression)

For a game built around old friends playing together, reward the specific friendship:

- Track cumulative hours played together as a duo
- At milestones (5 hrs, 10 hrs, 25 hrs, 50 hrs), unlock:
  - Unique duo-only cosmetics (matching color schemes, shared particle effects)
  - Expanded Convergence Burst visual effects
  - A **Bond Ultimate** — a super move only this specific pair of players can trigger
  - A display in the hub showing co-op stats ("Monsters slain together: 4,327")
- **Async Gift System**: When one player is offline, the other can leave gifts at save points — equipment, consumables, or short text messages. "Found this in the Cryptvault, thought your Wraith build could use it."

### 2.8 Difficulty Pacts (Hades-Style Modifiers)

Instead of only automatic difficulty scaling, let the duo choose modifiers before entering a zone:

- **Iron Bond** — if one player dies, both die (hardcore co-op)
- **Scarcity** — fewer health drops, but better loot quality
- **Nightfall** — permanent night in this zone (harder enemies, better rewards)
- **Mirrored** — enemies use player abilities against you
- **Velocity** — timer on each room; beat it for bonus rewards, fail for tougher enemies

Pacts stack. More pacts = more risk = better loot multiplier. Creates "remember when we tried Iron Bond on the Breach and died 47 times" stories.

---

## 3. CHARACTERS & CLASSES

### 3.1 Starting Classes (Choose at Game Start)

Each player picks one of **4 classes**. Players CAN pick the same class but the game shines when they complement each other. With 2 players and 4 classes, two classes are always "unrepresented" — creating natural replayability as the duo tries different combinations.

#### VANGUARD (Melee Fighter) — Eddie's Main
- **Weapon**: Plasma Blade (fast sword combos, 3-hit chain → launcher → slam)
- **Playstyle**: In-your-face aggression, parry-based defense, combo-driven
- **Strengths**: Highest melee DPS, best parry window, strong stagger
- **Weaknesses**: Must be close range, lower energy pool
- **Skill Branches**: Warblade / Bulwark / Berserker
- **Visual**: Heavy armored knight with glowing circuit-line accents. Blade hums with energy.
- **Co-op traversal**: Can smash through walls, boost partner to high ledges

#### GUNNER (Ranged Specialist) — Tai's Main
- **Weapon**: Pulse Rifle (auto-aim assist at close range, manual aim at distance, charge shot)
- **Playstyle**: Positional, keep distance, charged shots for burst damage
- **Strengths**: Safe damage from range, charge shot pierces, great boss power synergy
- **Weaknesses**: Lower HP, weaker up close, charge shot roots you briefly
- **Skill Branches**: Sharpshooter / Demolitionist / Technomancer
- **Visual**: Light armor with a bulky arm-cannon (Mega Man homage). Visor with targeting HUD.
- **Co-op traversal**: Can shoot targets/switches from afar, create temporary platforms (Technomancer)

#### WRAITH (Agile Assassin) — Changa's Main
- **Weapon**: Twin Ether Daggers (extremely fast attacks, lower per-hit damage, crit-focused)
- **Playstyle**: Mobile, evasive, crit-stacking, in-and-out hit-and-run
- **Strengths**: Fastest movement, best dodge, highest crit rate, wall-cling from start
- **Weaknesses**: Lowest HP, lowest defense, punished hard by mistakes
- **Skill Branches**: Shadowstrike / Phantom / Venomist
- **Visual**: Hooded figure with a tattered cloak that trails shadow particles. Daggers leave afterimages.
- **Co-op traversal**: Can fit through narrow gaps, wall-cling to reach switches, scout ahead while invisible

#### CHANNELER (Mage/Support Hybrid) — Unlocked after completing v0.5 content
- **Weapon**: Spell Focus (medium-range magic projectiles, hold to channel beam)
- **Playstyle**: Versatile — can DPS or support depending on build. Boss powers are enhanced.
- **Strengths**: Largest energy pool, boss powers deal +30% damage, can heal/buff partner
- **Weaknesses**: Slowest base movement, channeling is interruptible, squishy without buffs
- **Skill Branches**: Arcanist / Warden / Riftcaller
- **Visual**: Robed figure with a floating crystalline focus orbiting their hand. Runes glow on their arms.
- **Solo viability**: In solo mode, Warden buffs apply to self, summon a temporary companion spirit, and healing converts to self-sustain. Channeler should never feel like "only fun in co-op."
- **Co-op traversal**: Can create temporary bridges/platforms, levitate partner over hazards

### 3.2 Class Synergy (2-Player Co-op Design)

With 2 players choosing from 4 classes, there are **6 possible duo compositions** — each plays differently:

| Duo | Playstyle | Missing Roles |
|-----|-----------|--------------|
| **Vanguard + Gunner** | Classic tank/DPS. Vanguard draws aggro, Gunner unloads from safety. | No flanker, no healer |
| **Vanguard + Wraith** | Melee pincer. Vanguard holds front, Wraith flanks and crits. | No ranged, no healer |
| **Vanguard + Channeler** | Tank/healer. Channeler sustains, Vanguard protects. | No burst DPS, slower pace |
| **Gunner + Wraith** | Ranged + melee burst. Gunner softens, Wraith finishes. | No tank, both squishy |
| **Gunner + Channeler** | Zone control. Projectiles and area denial dominate the screen. | No frontline, vulnerable to rushdown |
| **Wraith + Channeler** | Buff-assassin combo. Channeler supercharges Wraith's crits. | No tank, no ranged DPS |

Each composition has a clear strength AND weakness that forces the duo to adapt. No "best" pair — just different challenges.

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

Each zone introduces a **mechanic** (not just a theme) and includes at least one **cooperative puzzle/traversal challenge**.

**The Threshold (Hub Town)**
- Safe zone (during day). Shops, blacksmith, quest NPCs, save point, class trainer.
- At night, some NPCs transform into optional mini-bosses (Simon's Quest homage — "What a horrible night to have a curse").
- Grows and changes as you progress — new NPCs arrive, buildings are repaired, new shops open.
- **Trophy Room**: A physical space that displays trophies from your co-op accomplishments — boss skulls mounted on the wall, a timeline of first clears, a display case for your rarest finds. Both players can see it and it grows as you progress together.

**Zone 1: Neon Foundry** (Accessible from start)
- Theme: Abandoned high-tech factory fused with medieval forges
- Aesthetic: Molten metal rivers, conveyor belt platforms, pneumatic presses as hazards, neon-lit industrial corridors
- Enemies: Rogue worker-bots, slag golems, electric fence turrets
- Boss: **Voltrexx** — a massive power-core construct that controls electricity
- Mechanic introduced: Moving platforms, conveyor physics
- **Co-op puzzle**: Two blast doors that must be powered simultaneously — one player holds a charge switch while the other runs through before the timer expires. Alternate paths require both players to redirect power flows.

**Zone 2: Blighted Garden** (Accessible from start)
- Theme: Once-beautiful royal gardens corrupted by toxic magic
- Aesthetic: Overgrown ruins, bioluminescent toxic flowers, spore clouds, twisted statuary
- Enemies: Poisonous plant creatures, corrupted garden automatons, fungal zombies
- Boss: **Lady Hemlock** — a tragic sorceress merged with her garden
- Mechanic introduced: Poison zones, destructible terrain, vine-swinging
- **Co-op puzzle**: Toxic spore clouds that one player can disperse (Vanguard slash/Gunner shot) while the other traverses the cleared path. A greenhouse puzzle where one player waters roots from above while the other navigates the growing vines below.

**Zone 3: Cryptvault** (Accessible from start)
- Theme: Ancient catacombs beneath a ruined castle, filled with undead and traps
- Aesthetic: Gothic stone, coffin-lined halls, spectral blue light, spiked pits, swinging pendulums
- Enemies: Skeletons (classic!), ghosts that phase through walls, bone dragons
- Boss: **The Hollow King** — an undead monarch on a throne of skulls
- Mechanic introduced: Traps (timing-based), dark rooms (limited visibility), spectral bridges only visible at certain times
- **Co-op puzzle**: One player carries a spectral lantern that reveals hidden bridges; the other must cross while the first holds position. A coffin-sliding puzzle where each player pushes coffins from different sides to create a path.

**Zone 4: Siege Engine** (Accessible from start)
- Theme: A colossal war machine — you're literally fighting through the interior of a walking fortress
- Aesthetic: Gears, cannons, ammo conveyors, the whole zone subtly sways/moves
- Enemies: Armored soldiers, siege turrets, mini-tank drones
- Boss: **Ironmaw** — the engine's AI core, fights using the fortress's weapons
- Mechanic introduced: Auto-scrolling sections (the engine is moving), turret sequences where you man a cannon
- **Co-op puzzle**: One player mans a turret to clear obstacles while the other navigates the path. A gear-room where each player turns interlocking gears from opposite sides to open the way forward.

**Zone 5: Mirror Sanctum** (Requires Phase Shift OR Thornlash to access hidden path)
- Theme: Reality-warped temple where reflections are alive
- Aesthetic: Crystal halls, impossible geometry, mirror surfaces showing alternate versions of the level
- Enemies: Mirror duplicates of the players (use your abilities against you), geometric constructs
- Boss: **Spectra** — a being that exists in reflections, attacks from mirrors
- Mechanic introduced: Mirror puzzles (hit switches in the reflection), gravity flipping in certain rooms
- **Co-op puzzle**: Each player exists in a different "reflection" of the same room — one in the normal world, one in the mirror world. They must coordinate to hit switches that affect both realities. The boss fight itself requires one player to attack from the mirror side.

**Zone 6: Signal Tower** (Requires Chain Lightning to power up the elevator)
- Theme: A massive communication spire reaching into the static-filled sky
- Aesthetic: Vertical zone — climbing upward. Antenna arrays, holographic displays, data-stream waterfalls
- Enemies: Corrupted data constructs, signal parasites, firewall barriers
- Boss: **Conductor IX** — an AI that controls sound and signal, attacks with wave patterns
- Mechanic introduced: Vertical scrolling/climbing, frequency-matching puzzles, platforms that phase in/out to a rhythm
- **Co-op puzzle**: Asymmetric information — one player can see a frequency pattern on their screen that the other must input on a terminal. A vertical ascent where one player creates temporary platforms (by hitting resonance points) for the other to climb.

**Zone 7: Ashen Cathedral** (Requires Soul Drain to survive the cursed threshold)
- Theme: A burning church that never finishes burning — frozen in eternal flame
- Aesthetic: Gothic cathedral architecture wreathed in perpetual fire, stained glass that tells the lore, ash drifts like snow
- Enemies: Flame priests, ember wraiths, living fire
- Boss: **Emberwitch** — a high priestess who chose to burn with her cathedral
- Mechanic introduced: Heat meter (too long in fire zones = damage), fire/ice elemental interactions, destructible stained glass reveals secrets
- **Co-op puzzle**: One player uses a frost ability/item to create safe zones through flame corridors while the other advances. A stained-glass puzzle where each player stands in a specific beam of colored light to unlock the path.

**Zone 8: The Breach** (Requires 6+ boss powers to force open)
- Theme: The epicenter where The Pale and The Grid collided — reality is broken
- Aesthetic: Glitched terrain — chunks of medieval castle float next to server racks. The background is pure dimensional static. Gravity shifts. The screen occasionally "glitches."
- Enemies: Convergence horrors (fusions of tech and magic), reality tears that spawn random enemies
- Boss: **Dreadnaught** — a fused knight/mech titan, the first being created by the Convergence
- Mechanic introduced: Reality-shift sections where the rules change (gravity, physics, enemy behavior)
- **Co-op puzzle**: Reality splits — each player is in a different version of the same room (one Pale, one Grid) and must coordinate to progress. Only actions in one reality affect certain objects in the other.

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
- **Progressive onboarding** — teach one mechanic at a time through play:
  - Safe room: move and jump (no enemies)
  - First enemy: teach attack
  - First gap: teach dash
  - First co-op door: teach cooperation (or solo alternate path)
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
- More complex platforming and co-op puzzles
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
- Difficulty Pact challenges

### Progression Unlock Timeline

| Milestone | Unlocks |
|-----------|---------|
| Tutorial complete | Basic attacks, jump, dash, menu, first zone access, accessibility settings |
| Level 5 | Consumable belt, equipment comparison |
| First boss killed | Boss power system, power-swap at save points |
| Level 10 | Skill tree access (first branch), crafting bench |
| 2 bosses killed | Convergence Burst system, accessory slots |
| Level 15 | Second skill branch choice, advanced shop items |
| 4 bosses killed | Second wave zones, class advanced movement, Difficulty Pacts |
| Level 20 | Third skill branch, ultimate ability |
| Level 25 | Equipment upgrade/reforging system |
| 6 bosses killed | The Breach access, legendary quest lines |
| All 8 bosses | The Core access, NG+ available after completion |
| Level 40 | Final skill tree capstones |
| Hidden bosses | Unique legendary equipment + alternate ultimate |
| Level 50 | Mastery prestige skills (small but impactful bonuses) |

---

## 6. ART & AUDIO DIRECTION

### Visual Style: "Neo-Retro Readable"

- **Resolution**: 640x360 base at 2x scale — clean retro-inspired look with readable text
- **Text**: Modern fonts (Arial/sans-serif for UI, Consolas/monospace for data) with stroke outlines for contrast. No tiny pixel fonts — readability is non-negotiable.
- **Sprite style**: Detailed sprites (32x48 character size, ~64x64 for bosses, ~128x128+ for large bosses) with smooth animation (8-12 frames per action)
- **Color palette**: Rich and varied per zone, but each zone has a cohesive palette. Use limited palettes within zones for visual coherence, then go vibrant for effects.
- **Modern enhancements**:
  - Dynamic lighting (point lights from torches, neon signs, projectiles — lights interact with the environment)
  - Parallax scrolling backgrounds (3-4 layers of depth per zone)
  - Particle effects (sparks, embers, magic particles, rain, spores)
  - Screen shake, hit-stop, and chromatic aberration on big impacts
  - Subtle CRT/scanline filter (toggleable — for extra retro vibes)
- **UI**: Clean HUD with readable fonts. HP bar, Energy bar, Boss Power icons, minimap, partner HP. Non-intrusive. Menus are styled like a gothic tech terminal.

### Art Production Pipeline

**Phase 1 (Prototype — current):** Programmatically generated placeholder textures. Colored rectangles with decorative lines. Sufficient for gameplay testing.

**Phase 2 (Vertical Slice):** Two approaches, pick based on budget and timeline:
- **Option A — Commission**: Hire a pixel artist from itch.io / Fiverr / gamedev communities. Budget ~$500-1000 for v0.5 scope (2 character sprites with animations, 2 boss sprites, 2 tilesets, UI elements). This gets professional results.
- **Option B — AI-assisted + manual cleanup**: Use AI sprite generation tools (Piskel, pixel-art-specific AI) for base sprites, then manually clean up and animate in Aseprite. Lower cost, more time investment.
- **Option C — Asset packs + customization**: Use existing CC0/licensed pixel art packs as a base (itch.io has excellent ones), customize colors and add unique elements. Fastest path to "looks good."

**Phase 3+ (Full game):** Commit to one pipeline based on v0.5 experience. Likely a mix: commissioned character/boss art + asset packs for tilesets + custom UI.

### Audio Production Pipeline

**Music**: Start with royalty-free darksynth/synthwave tracks from:
- Newgrounds Audio Portal (free, credit-based)
- Kevin MacLeod / Incompetech (CC)
- Commission from itch.io music community ($50-150 per track)
- Long-term: LMMS or FL Studio for custom tracks if someone on the team learns

**SFX**: sfxr/jsfxr (free retro sound generator) for placeholder → Freesound.org for production → custom Foley if needed

**Budget estimate (full game)**: $500-2000 for art, $200-800 for music. Entirely manageable for a passion project.

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
| **Analytics** | **Supabase + custom events** | Basic telemetry: zone completion rates, class popularity, death locations, session length, disconnect frequency |

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
- **Input buffering**: Generous buffer (6-8 frames) to compensate for latency spikes
- **Parry window**: Minimum 8-10 frame window to remain viable at 150ms latency
- Target: playable at up to ~150ms latency (covers most same-continent connections)
- **Future consideration**: Rollback netcode would dramatically improve feel but is significantly harder to implement. Evaluate after delay-based approach is working.

### Save System

- Server-side saves via Supabase (cloud saves — play from any browser)
- Auto-save at checkpoints (save crystals placed throughout zones)
- Save data: player level, stats, inventory, boss powers, world state (which bosses defeated, shortcuts opened, NPCs met), quest progress
- Multiple save slots (3 per account)
- **Schema versioning**: Save data includes a version field. Migration functions handle upgrading old saves when game updates change the schema. Never break existing saves.

### Analytics (Basic Telemetry)

Track enough to answer "where do players struggle?" and "what do players enjoy?":
- Zone completion rate and time per zone
- Death locations (heatmap data)
- Boss attempt count and kill time
- Class pick rates
- Session length and return rate
- Disconnect frequency and reconnection success rate
- Difficulty Pact usage patterns
- Equipment rarity distribution (is loot too generous? too stingy?)

All analytics via Supabase insert — no third-party tracking. Privacy-respecting, opt-in.

---

## 8. ACCESSIBILITY (Phase 0-1, Not Phase 8)

Accessibility is a foundation feature, not a polish feature. Ship these from the start:

### Non-Negotiable (v0.5)
- **Remappable controls** — keyboard and gamepad, full rebinding
- **Screen shake toggle** — off / reduced / full
- **Colorblind modes** — protanopia, deuteranopia, tritanopia filters
- **Text size options** — small / medium / large for all UI text
- **High contrast mode** — enhanced outlines on characters and projectiles
- **Subtitle/text options** — background opacity, speaker labels

### Planned (v1.0)
- One-handed control presets
- Motion sensitivity slider
- Audio cues for visual-only information (off-screen enemies, projectile warnings)
- CRT filter toggle (already planned)
- Configurable HUD layout

### Not Web-Applicable
- No mobile/touch support in v1.0 — this is a keyboard/gamepad game. If analytics show significant mobile traffic, evaluate touch controls as a separate effort.

---

## 9. DEVELOPMENT PHASES & TIMELINE

### Phase 0: Foundation (Weeks 1-3) ✅ COMPLETE
**Goal**: Playable character moving and attacking in a test level

- [x] Project setup: Vite + Phaser 3 + TypeScript boilerplate
- [x] Basic player controller: run, jump, attack (Vanguard)
- [x] Placeholder tilemap level
- [x] Basic enemy AI (walk, patrol, chase, attack)
- [x] Collision detection and damage system
- [x] Camera system following player
- **Milestone**: ✅ Character running, jumping, and fighting enemies in a test level

### Phase 1: Core Combat & Feel (Weeks 4-6) ✅ COMPLETE
**Goal**: Combat feels great — the core verb is fun in isolation

- [x] Polish movement (acceleration curves, coyote time, input buffering)
- [x] Full Vanguard combo system (3-hit chain)
- [x] Hit-stop, screen shake, knockback
- [x] Enemy variety (3 types: melee, ranged, flying)
- [x] Health/Energy system
- [x] Death and respawn
- [x] Basic particle effects (hit sparks)
- **Milestone**: ✅ Test level that's fun to play — the core loop works

### Phase 2: Additional Classes (Weeks 7-10) ✅ COMPLETE
**Goal**: Multiple classes playable

- [x] Gunner class (ranged, charge shot)
- [x] Wraith class (fast, crit-focused, wall cling)
- [x] Basic HUD (HP bar, energy, level)
- [ ] Revive mechanic
- [ ] Combo system between players
- [ ] Difficulty scaling by player count
- **Milestone**: ✅ Three classes playable (solo)

### Phase 3: RPG Systems (Weeks 10-13) — PARTIALLY COMPLETE
**Goal**: Leveling, stats, equipment functional

- [x] XP and leveling system
- [x] Stat allocation UI
- [x] Equipment system (weapon, armor, 2 accessories)
- [x] Item drops from enemies
- [x] Inventory management screen
- [x] Loot rarity system
- [ ] Skill tree UI and implementation
- [ ] Save/load (local first, then Supabase)
- **Milestone**: Partial — kill/loot/level/equip loop works

### Phase 4: Boss Power System (Weeks 14-16) — PARTIALLY COMPLETE
**Goal**: Boss fights and power absorption working

- [x] Boss AI framework (phases, patterns, telegraph)
- [x] First boss implemented (Voltrexx)
- [x] Power absorption on boss death (Chain Lightning)
- [ ] Second boss (The Hollow King)
- [ ] Boss power equip UI (2 slots, swap at save points)
- [ ] Power weakness chain (boss takes extra damage from specific powers)
- [ ] Usable boss powers (mapped to a key, not just collected)
- **Milestone**: Partial — beat Voltrexx, see power absorbed, but can't use it yet

### Phase 5: Vertical Slice Polish (Weeks 17-22)
**Goal**: v0.5 — complete, polished, shippable 2-zone experience

- [ ] Second zone: Cryptvault (tileset, enemies, boss: Hollow King)
- [ ] Hub town (The Threshold) — basic version with save + 1 shop
- [ ] Accessibility foundations (remappable controls, screen shake toggle, colorblind)
- [ ] Co-op puzzle: 1 per zone (solo alternate solutions included)
- [ ] Day/night cycle in hub only
- [ ] Equipment simplified to 3 tiers (common/uncommon/rare)
- [ ] 1 skill branch per class functional
- [ ] Boss power usable as equipped ability
- [ ] 1 Convergence Burst as proof of concept
- [ ] Sound effects (sfxr-generated basics)
- [ ] Level design pass: both zones fully traversable and fun
- [ ] UI/UX polish: readable text, clear feedback, smooth menus
- [ ] **Milestone**: v0.5 — a complete, fun, 2-hour game playable solo

### Phase 6: Online Multiplayer (Weeks 23-27)
**Goal**: Eddie and friends can play together over the internet

- [ ] Colyseus server setup
- [ ] Client-side prediction and server reconciliation
- [ ] Player state synchronization (position, animation, combat)
- [ ] Room/lobby system (create game, join game, invite by code)
- [ ] Supabase auth (accounts)
- [ ] Cloud save integration
- [ ] Latency handling and interpolation
- [ ] Disconnection/reconnection handling (grace period, AI takeover, state restore)
- [ ] Co-op puzzle synchronization (both players see consistent state)
- [ ] Buddy System tracking (cumulative play hours)
- [ ] **Milestone**: Playable co-op online, feels responsive, saves work

### Phase 7: Content Expansion (Weeks 28-35)
**Goal**: Full game content (expand from v0.5 to v1.0)

- [ ] Channeler class (full skill trees, solo-viable)
- [ ] Zones 3-4 (Blighted Garden, Siege Engine) with co-op puzzles
- [ ] 4 first-wave bosses complete
- [ ] Zones 5-8 (Mirror Sanctum, Signal Tower, Ashen Cathedral, The Breach) with co-op puzzles
- [ ] All 8 zone bosses
- [ ] The Core (final zone + final boss)
- [ ] All boss powers implemented and balanced
- [ ] Full equipment system (all 5 rarity tiers, random modifiers)
- [ ] Skill trees complete for all 4 classes
- [ ] Difficulty Pact system
- [ ] Trophy Room in hub
- [ ] Async Gift System
- [ ] Night cycle boss rematches + Blood Moon event
- [ ] All zone music and SFX (commissioned or sourced)
- [ ] **Milestone**: Complete main game playable end-to-end in co-op

### Phase 8: Polish, Secrets & Post-Game (Weeks 36-40)
**Goal**: The game feels finished, rewarding, and deep

- [ ] Hidden zones (4) and secret bosses
- [ ] New Game+ mode
- [ ] Achievement system
- [ ] NPC quest lines with rewards
- [ ] Balance pass (enemy HP/damage tuning, boss difficulty curves, equipment stats)
- [ ] Speedrun timer (optional toggle)
- [ ] Extended accessibility (one-handed presets, audio cues)
- [ ] Analytics review and tuning based on data
- [ ] Performance optimization
- [ ] Bug fixing
- [ ] Convergence Burst: all 28 combinations
- [ ] Bond Ultimate system (Buddy System milestone rewards)
- [ ] **Milestone**: Ship-ready v1.0

---

## 10. UNIQUE / CREATIVE MECHANICS

### 10.1 The Convergence Burst (Co-op Ultimate)
When both players activate their boss powers simultaneously on the same enemy/area, they trigger a **Convergence Burst** — a devastating combined attack unique to the power combination. With 8 boss powers and 2 slots each, there are **28 unique Convergence Burst combinations**. Discovering them all is a meta-goal.

### 10.2 The Echo System
At certain save points, you find **Echo Crystals** that replay ghostly scenes of what happened there before the Convergence. These are the game's primary storytelling device — short, wordless pixel-art cutscenes that gradually reveal the full story. They're optional but completionists will hunt them all.

### 10.3 Cursed Relics
Rare accessory drops that give massive power boosts but with significant drawbacks:
- **Bloodstone Ring**: +50% damage, but you lose 1 HP per second
- **Greedy Crown**: 2x gold drops, but shops charge 3x prices
- **Phantom Cloak**: Enemies can't see you (stealth!), but you deal 40% less damage
- **Berserker's Mark**: Damage scales with missing HP (low HP = massive damage)

### 10.4 NPC Transformation (Night)
During night, specific NPCs in the Threshold transform:
- The shopkeeper becomes a hidden mini-boss (drops rare merchant-themed loot)
- The lore keeper speaks in cryptic riddles that are actually coordinates to hidden zones
- The blacksmith can forge "Nightforged" equipment (only at night, uses rare night-drop materials, more powerful but cursed)

### 10.5 The Bestiary & Compendium
A collectible encyclopedia that fills in as you fight enemies, discover lore, and explore. Completing sections unlocks concept art, music player tracks, and gameplay modifiers (big head mode, palette swap to 8-bit, etc.).

### 10.6 Challenge Rooms
Hidden rooms scattered throughout zones that are pure skill tests — no RPG stats, normalized equipment. Leaderboards for completion time. These let skilled players flex regardless of level.

### 10.7 Difficulty Pacts
Pre-zone modifiers that let the duo choose their challenge level (see section 2.8). More pacts = more risk = better loot. Creates stories and extends endgame replayability without new content.

### 10.8 Trophy Room & Buddy System
The hub displays your co-op journey physically — boss trophies, milestone markers, co-op stats. The Buddy System tracks your friendship over time and rewards it with unique cosmetics and abilities (see section 2.7).

---

## 11. MONETIZATION & DISTRIBUTION

### Distribution: Free-to-Play Web Game

Since this is a passion project for Eddie, Changa & Tai:

- **Free to play** on a custom domain (neonrequiem.com or similar — verify domain availability)
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

## 12. PROJECT STRUCTURE

```
neon-requiem/
├── src/                      # Phaser game client
│   ├── scenes/               # Phaser scenes (menu, gameplay, UI)
│   ├── entities/             # Player, enemies, bosses, NPCs
│   ├── systems/              # Combat, physics, inventory, progression
│   ├── ui/                   # HUD, menus, inventory screen
│   ├── network/              # Colyseus client, state sync
│   └── main.ts              # Entry point
├── shared/                   # Shared types, constants, game data
│   ├── constants.ts
│   └── data/                # Enemy stats, equipment, skill trees (JSON)
├── server/                   # Colyseus game server (Phase 6)
│   ├── src/
│   │   ├── rooms/           # Game room logic
│   │   ├── systems/         # Server-side game logic
│   │   ├── schema/          # Colyseus state schemas
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── public/
│   └── index.html
├── assets-src/              # Source art files (Aseprite, Tiled)
│   ├── sprites/
│   ├── tilesets/
│   ├── maps/
│   └── audio/
├── docs/                    # Design docs, balance spreadsheets
├── PROJECT-PLAN.md          # This file
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 13. TOOLS & SETUP NEEDED

| Tool | Purpose | Cost |
|------|---------|------|
| **VS Code** | Code editor | Free (already have) |
| **Node.js 20+** | Runtime | Free |
| **Phaser 3** | Game framework | Free (MIT) |
| **Colyseus** | Multiplayer | Free (open source) |
| **Tiled** | Level editor | Free |
| **Aseprite** | Pixel art & animation | $20 (one-time) or compile from source free |
| **Supabase** | Auth, database, saves, analytics | Free tier sufficient for dev |
| **Vercel** | Client hosting | Free tier |
| **Railway / Fly.io** | Game server hosting | ~$5-10/mo for dev |
| **sfxr / jsfxr** | Retro sound effects | Free |
| **Git + GitHub** | Version control | Free (already have) |

---

## 14. RISK ASSESSMENT & MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Scope creep** | High | v0.5 vertical slice is the priority. Ship 2 zones before building 8. Cut hidden zones and NG+ first if needed. |
| **Multiplayer complexity** | High | Build solo-playable game FIRST (Phases 0-5). Add multiplayer as a layer on top. Game must be fun solo. |
| **Art bottleneck** | Medium | Start with placeholder art (current). Commission or source asset packs for v0.5. Budget $500-1000 for production art. |
| **Music bottleneck** | Medium | Use royalty-free tracks for prototype. Budget $200-800 for commissioned tracks. |
| **Balance** | Medium | Use shared JSON data files for all stats. Easy to tune. Playtest regularly. Analytics data informs tuning. |
| **Browser performance** | Low-Med | Phaser 3 + WebGL handles this well. Object pooling for projectiles/particles. Profile early, optimize late. |
| **Disconnection issues** | Medium | Grace period + AI takeover + state reconnection designed from Phase 6. Test with artificial latency/drops. |
| **Save schema changes** | Low-Med | Version field in save data + migration functions. Never break existing saves. |
| **Burnout** | Medium | This is a passion project. v0.5 gives an early "win." Play other games for inspiration. Take breaks. |

---

## 15. IMMEDIATE NEXT STEPS

### Right Now (Current Sprint)
1. **Make boss powers usable** — Chain Lightning should be an equipped ability, not just collected
2. **Second boss: The Hollow King** — prove the boss framework works for multiple bosses
3. **Skill tree: 1 branch per class** — Warblade (Vanguard), Sharpshooter (Gunner), Shadowstrike (Wraith)

### Next Sprint
4. **Cryptvault zone** — second tileset, new enemies, level design
5. **Save/load system** — local storage first, Supabase later
6. **Accessibility foundations** — remappable controls, screen shake toggle

### Then
7. **Co-op puzzle prototype** — one puzzle in each zone with solo alternate
8. **Hub town (Threshold)** — basic version
9. **Sound effects** — sfxr-generated basics for all actions
10. **v0.5 polish** — playtest, balance, iterate until it's fun

---

*Let's build this thing.*
