# NEON REQUIEM — Project Plan Peer Review

**Reviewer**: Claude | **Date**: March 14, 2026
**Context**: Fun throwback project for old friends. Priorities: engaging, visually appealing, nostalgic, coherent theme, excellent multiplayer cooperation.

---

## OVERALL VERDICT

This is one of the most thorough indie game design documents I've seen. The creative vision is strong, the mechanical systems are well-reasoned, and the nostalgic DNA (Mega Man + Simon's Quest + co-op) comes through on every page. The person who wrote this clearly loves these games and understands *why* they work, not just *what* they are.

That said, there are real problems — a critical consistency issue, a scope problem that could kill the project, and some co-op design gaps that undercut the "friends playing together" goal. Let's dig in.

---

## WHAT'S EXCELLENT

### 1. The Convergence Setting Is Genuinely Inspired
The "Pale meets Grid" concept isn't just an aesthetic mash-up — it's load-bearing. It justifies every zone having a unique identity, explains the boss diversity, creates narrative tension, and gives you an art direction that's instantly distinctive. "A crumbling cathedral with circuit boards growing through its walls like ivy" — that's a sentence that sells the game. The setting does real work.

### 2. Boss Power Absorption + Weakness Chains
This is the best system in the document. Taking Mega Man's core loop and making it *cooperative* — where two players might equip complementary powers, or deliberately tackle bosses in different orders based on their class strengths — adds a strategic layer the original games never had. The 28 Convergence Burst combinations give completionists a meta-goal that naturally drives replayability.

### 3. Class Design with Intentional Gaps
The 4-class, 3-player structure where one class is always "missing" is brilliant co-op design. Every trio has a clear weakness, which forces adaptation and makes each composition feel different. This is the kind of design that creates stories: "Remember that time we had no healer and barely survived the Hollow King?"

### 4. Day/Night Cycle as Gameplay System
This goes far beyond a cosmetic filter. NPC transformations, night-only areas, Blood Moon risk/reward events, and the shopkeeper-becomes-a-boss mechanic all reward players who pay attention to the clock. The Simon's Quest homage lands perfectly without being slavish.

### 5. Zone Design Has Real Identity
Each zone introduces a *mechanic*, not just a theme. The Siege Engine sways and auto-scrolls. The Signal Tower is vertical. The Mirror Sanctum flips gravity. This means zones teach the player new things rather than just reskinning corridors with different tiles. That's strong level design thinking.

### 6. Phased Development with Playability Gates
Building solo-first and layering multiplayer on top is the correct architecture. Every phase milestone produces something playable. This is the single most important decision in the plan for actually shipping the game.

### 7. Memory Lane (Hidden Zone)
An 8-bit zone that recreates classic Mega Man and Castlevania patterns? For a nostalgia project between old friends, this is the chef's kiss moment. This is the zone people will talk about.

### 8. Echo Crystals as Storytelling
Wordless pixel-art cutscenes at save points are a perfect fit for the medium. They respect the player's time, reward exploration, and avoid the trap of over-writing lore in a game that should be about *playing*. Smart restraint.

---

## CRITICAL ISSUES

### ISSUE #1: The 2-Player vs. 3-Player Inconsistency (Must Fix)

This is the biggest structural problem in the document. It can't ship like this.

- The **elevator pitch** (line 9) says "2-player co-op"
- The **summary message** says "2-player online co-op"
- Section **2.4** says "3-Player Online Co-op (primary mode — Eddie, Changa & Tai)"
- The document references "3-player Triple Convergence," "trio compositions," and "all 3 die"
- Section **3.2** designs around 4 possible *trio* compositions
- The difficulty scaling gives values for solo × 1.0, duo × 1.6, **trio × 2.2**
- The communication system describes color-coding for **3 players** (blue, red, gold)

But elsewhere it reverts to 2-player language: "the two players are the hope," "2 slots each = 28 Convergence Burst combinations" (which is actually the 2-player math, not 3-player).

**You need to commit.** This isn't a minor detail — it fundamentally changes:

- Network architecture complexity (2-peer vs. 3-peer)
- Boss fight design (patterns for 2 vs. 3 targets)
- Difficulty scaling curves
- Convergence Burst combinatorics (2 players × 2 slots is very different from 3 × 2)
- Screen real-estate for HUD
- The entire class synergy system
- Server hosting costs and bandwidth
- Session logistics (coordinating 3 adults' schedules vs. 2)

**My recommendation**: Go with **2-player co-op** and make it exceptional. Here's why:

1. **Scheduling reality** — Getting 3 adults online simultaneously is hard. Two friends can more easily find an hour together. You said this is for old friends — optimize for actually playing together.
2. **Design focus** — 2-player co-op lets you design tighter interactions. Every combo, every boss pattern, every puzzle can be tuned for exactly two people. 3-player creates exponentially more edge cases.
3. **Network simplicity** — P2P with one authoritative host is much simpler for 2 than for 3. With 3, you need a dedicated server for every session or complex host-migration logic.
4. **Classic DNA** — Contra, Streets of Rage, the games you're channeling — they were 2-player experiences. That's the nostalgia you're invoking.

If you go 2-player: redesign section 3.2 around the 6 possible *duo* compositions (which you already partially have in the pair synergies). Each duo has a missing pair of classes, creating replayability through "what if we both went Wraith?" experimentation.

### ISSUE #2: The Scope Will Kill This Project

Let's do the math on what this plan asks for:

| Content | Count |
|---------|-------|
| Playable classes | 4 (each with 3 skill branches × 8 skills = 96 total skills) |
| Major zones | 8 (each with unique tileset, enemies, mechanics, music) |
| Hidden zones | 4 |
| Hub town | 1 (with day/night variants, evolving state) |
| Final zone | 1 |
| Boss fights | 13 (8 zone + 4 hidden + 1 final with 3 phases) |
| Boss powers | 8 (each usable by all 4 classes) |
| Convergence Bursts | 28+ unique combination attacks |
| Equipment rarity tiers | 5 (with random modifier system) |
| Unique legendary items | 8+ |
| Cursed Relics | 4+ |
| Day/night variants | Every zone + hub |
| NPC questlines | Multiple |
| Music tracks | 16+ zone themes (day/night), 13+ boss themes, hub, menus |
| Enemy types | 30-40+ (3-4 per zone × 8 zones + variants) |

This is a 2-3 year project for a small professional studio. For a passion project between friends working evenings and weekends, at the 40-week timeline in the plan, you'd need to ship roughly one fully-designed zone every 3-4 weeks — complete with art, enemies, a polished boss fight, music, and QA — while simultaneously building multiplayer infrastructure, RPG systems, and four distinct character classes.

**The plan itself identifies scope creep as the #1 risk but doesn't cut aggressively enough.** Saying "cut hidden zones and NG+ first" still leaves an enormous game.

**Recommendation: Define a "Vertical Slice" Milestone**

Before committing to the full plan, target a **v0.5** that is a complete, polished, shippable experience:

- **2 classes** (Vanguard + Gunner — melee/ranged covers the most ground)
- **2 zones + hub** (Neon Foundry + Cryptvault — tech and gothic, one from each side of The Convergence)
- **2 bosses** with power absorption and one weakness link between them
- **1 skill branch per class** (not all 3)
- **Equipment system** but simplified (3 tiers, no random modifiers yet)
- **Day/night cycle** in hub only
- **2-player co-op** working
- **One Convergence Burst** as proof of concept

This is a complete game. Two friends pick classes, fight through two zones, beat two bosses, absorb powers, and experience the co-op systems. If it's fun, everything else is expansion content. If it's not fun, no amount of additional zones will fix it.

### ISSUE #3: Co-op Is Combat-Centric — Missing Cooperative Exploration & Puzzles

For a project whose #1 goal is "friends playing together," the co-op mechanics are almost entirely about *fighting*. Combos, chain attacks, Convergence Bursts, revives, aggro management — these are all combat systems.

**What's missing: cooperative non-combat moments.** The best co-op games create memories outside of fights:

- **Two-player puzzles**: A door that needs two switches held simultaneously. A platform one player raises while the other crosses. A mirror puzzle where each player controls a beam from different sides. The Mirror Sanctum is begging for this.
- **Asymmetric information**: Player 1 can see a maze from above that Player 2 is navigating. One player reads rune patterns while the other inputs them. This creates *communication* — the thing that actually makes co-op with friends feel cooperative.
- **Shared resource decisions**: A treasure chest that contains one great item — who takes it? A branching path where players must split up and each handles a different challenge alone before reuniting. These create micro-negotiations that are pure co-op gold.
- **Cooperative traversal**: One player boosts the other to a high ledge, then the other drops a rope. Class-specific traversal that requires partnership — the Vanguard can smash through a wall but only the Wraith can fit through the gap behind it to open the door from the other side.

Without these, co-op risks feeling like "solo game with a friend's sprite on screen." The combat synergies are good, but friends remember the time they had to coordinate to solve something clever, not just the time they both pressed attack at the same moment.

---

## SIGNIFICANT CONCERNS

### 4. Who's Making the Art? Who's Making the Music?

The plan specifies detailed art and audio direction — "synth-metal," "8-12 frames per action," "3-4 parallax layers per zone" — but never says who creates any of it. The risk assessment mentions "commissioning pixel art ($50-200 per character)" but the scope requires hundreds of unique sprites, tilesets for 13 zones, parallax backgrounds, particle effects, UI elements, and 20+ music tracks.

This is easily 60-70% of the total project effort, and it's essentially unplanned. You need to either:

1. Identify a dedicated artist and musician (even part-time)
2. Budget realistically for commissions (this is $5,000-15,000+ worth of art at the quality described)
3. Scale the visual ambition way down (fewer animation frames, simpler tilesets, use free/licensed asset packs as a base)
4. Plan for procedural/template-based art generation where possible

### 5. The Channeler Problem (Solo Viability)

The Channeler is described as a "Mage/Support Hybrid" who "can heal/buff partner" with "slowest base movement" and whose channeling "is interruptible." In solo play, this class could feel miserable — slow, squishy, and designed around buffing a partner who isn't there.

The Warden (support) skill branch especially needs a solo-viable design. Consider: in solo mode, Channeler buffs could apply to the player themselves, or summon a temporary companion, or the healing branch could convert to self-sustain. Don't make one of your four classes the "only fun in co-op" option.

### 6. No Reconnection/Disconnection Plan

The multiplayer section covers authoritative server, state sync, and latency handling — but says nothing about what happens when a player disconnects mid-boss-fight. For a web game played in a browser, disconnections will be frequent (tab closed, internet hiccup, laptop sleep).

You need:

- Grace period before the disconnected player's character despawns (30-60 seconds)
- AI takeover option (disconnected player becomes a basic AI ally)
- Reconnection that restores the player to their exact state
- Boss fight pause/scale-down if a player drops mid-fight
- Save state that doesn't penalize the remaining player

### 7. 150ms Latency Target May Not Be Enough

The plan targets "playable at up to ~150ms latency." For a precision platformer with parry timing and hit-stop, this might feel terrible. Fighting games typically need sub-60ms to feel responsive. Side-scrollers with precise platforming (which this aspires to — "Mega Man-level precision") need similar responsiveness for anything involving reaction-based mechanics.

Consider:

- Generous input buffering (already mentioned, good)
- Rollback netcode instead of delay-based (harder to implement but dramatically better feel)
- Parry window that's forgiving enough to work at 150ms (probably 8-10 frame window minimum)
- Testing at high latency *early* — don't discover this is a problem in Phase 6

### 8. No Onboarding Design Beyond "Cold Open"

The tutorial is described as: "in-media-res cold open: players fight a powerful enemy, lose, wake up in the Threshold with basic abilities." That's a narrative beat, not a tutorial design.

For a game with 4 stats, 3 skill branches, boss power slots, equipment with random modifiers, a day/night cycle, combo systems, and co-op mechanics — you need a thoughtful onboarding plan. Consider progressive disclosure: introduce one system per zone, with the hub town providing contextual tutorials as systems unlock. The progression unlock timeline (Section 5) already has the right instincts here — formalize it into actual tutorial beats.

---

## SUGGESTIONS & CREATIVE ADDITIONS

### A. Add a "Buddy System" Mechanic

For a nostalgia project between friends, consider a persistent bond mechanic: the more you play together, the stronger your co-op bonuses become. Track cumulative hours played as a duo. At milestones (5 hrs, 10 hrs, 25 hrs, 50 hrs), unlock:

- Unique duo-only cosmetics (matching color schemes, shared particle effects)
- Expanded Convergence Burst effects
- A shared "Bond Ultimate" — a super move that only this specific pair of players can trigger
- A small display in the hub showing your co-op stats ("Monsters slain together: 4,327")

This rewards the specific friendship, not just generic multiplayer. It's the kind of feature that makes old friends say "we've put 50 hours into this thing together."

### B. Async "Gift" System

When one player is offline, let the other leave gifts at save points — a piece of equipment they found, a consumable, or just a short text message. "Found this in the Cryptvault, thought your Wraith build could use it." It's a tiny feature that makes the game feel like a shared space even when you're not online together.

### C. Shared Trophy Room in the Hub

A physical space in the Threshold that displays trophies from your co-op accomplishments: boss skulls mounted on the wall, a timeline of your first clears, a display case for your rarest finds. Both players can see it and it grows as you progress together. This is the "nostalgic living room where you played games together" translated into the game world itself.

### D. "Remember When" Replay System

Automatically capture replay clips of clutch moments — last-second revives, boss kills at 1 HP, Triple Convergence Bursts. Store the last N clips and let players watch them from the hub. For a game designed around shared memories with friends, *literally preserving those memories* is on-theme.

### E. Consider Couch Co-op (Even as a Stretch Goal)

The plan says "Shared screen? No. Each player has independent camera/viewport." For a nostalgia project, this is a missed opportunity. The games you're homaging — Contra, Streets of Rage, TMNT — were *couch co-op*. Sitting next to your friend, sharing a screen, yelling at each other.

A shared-screen local co-op mode (even if the primary mode is online) would be powerful for the nostalgia angle. It's also architecturally simpler than networked play — two input sources, one game instance, one screen. Consider it as Phase 8 stretch content, or even as the *primary* dev mode (it's easier to test and iterate on).

### F. Difficulty "Pact" System (Instead of Static Scaling)

Rather than automatic difficulty scaling, let the duo *choose* modifiers before entering a zone — like Hades' Pact of Punishment. Options such as:

- "Iron Bond" — if one player dies, both die (hardcore co-op)
- "Scarcity" — fewer health drops, but better loot
- "Nightfall" — permanent night in this zone (harder enemies, better rewards)
- "Mirrored" — enemies use player abilities against you

This gives the friends agency over their difficulty and creates "remember when we tried Iron Bond on the Breach and died 47 times" stories. It also extends endgame replayability without requiring new content.

### G. The Name: "Neon Requiem" Is the Right Call

It's evocative, unique, Googleable, and captures both halves of the setting. "Circuit & Crypt" is fun but too literal. "Convergence" is too generic (and already heavily used in gaming). Stick with Neon Requiem.

One small note: make sure the domain is available. neonrequiem.com, neonrequiem.gg, or neonrequiem.io would all work.

---

## WHAT'S MISSING (Checklist)

| Missing Element | Why It Matters |
|----------------|----------------|
| **Firm player count decision (2 or 3)** | Affects every system in the game — must be resolved first |
| **Vertical slice / MVP definition** | Without this, you'll build for 40 weeks and never ship |
| **Art production pipeline & ownership** | Who draws the sprites? This is most of the work. |
| **Music production plan** | 20+ tracks don't materialize from "Audacity / LMMS" |
| **Cooperative puzzle/traversal design** | Co-op is more than combat — friends need to *think* together |
| **Disconnection/reconnection handling** | Web games lose connection constantly |
| **Playtesting cadence** | When do outside friends test? How do you collect feedback? |
| **Accessibility from Day 1** | Remappable controls and colorblind support shouldn't wait until Phase 8 |
| **Mobile/touch considerations** | It's web-native — will people try it on phones? If yes, plan for it. If no, say so. |
| **Analytics/telemetry plan** | How will you know which zones are too hard, where players quit, which classes are popular? Even basic event logging helps. |
| **Content pipeline tooling** | Adding a new enemy or item should be data-driven (JSON configs), not code changes. The plan implies this with "shared JSON data files" but doesn't formalize it. |
| **Version/update strategy** | How do you ship updates without breaking save files? Schema migration for save data. |

---

## PRIORITY ACTION ITEMS

1. **Decide: 2 or 3 players.** Then rewrite sections 2.4, 3.2, and all multiplayer references for consistency.
2. **Define the vertical slice (v0.5).** What's the smallest thing that's a *complete, fun game*? Build that first.
3. **Solve the art question.** Placeholder art is fine for prototyping but you need a real plan for production art before Phase 5.
4. **Add cooperative puzzle/traversal mechanics** to at least 4 of the 8 zones. Make co-op about more than combat.
5. **Move accessibility to Phase 0-1.** Remappable controls and configurable screen shake should be in the foundation, not the polish phase.
6. **Add disconnection handling to the multiplayer architecture.** Plan for it now even if you implement it in Phase 6.

---

## FINAL THOUGHTS

The creative vision here is genuinely exciting. The Convergence setting is rich, the boss power system is the perfect co-op twist on a beloved mechanic, and the nostalgia touchpoints (Simon's Quest day/night, Mega Man weakness chains, Memory Lane as a love letter) are chosen with real care — not just surface-level references, but mechanical homages that understand *why* those games resonated.

The biggest risk isn't bad design — it's never finishing. Scope is the enemy. Define the smallest version that captures the magic, build that, play it with your friend, and expand from there. If two people fighting Voltrexx together and absorbing Chain Lightning feels incredible, everything else is just more of a good thing.

This could be something really special. Ship the core, and the rest will follow.
