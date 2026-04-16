# Orbit Duel Documentation

This document describes how the game currently works in the codebase, including gameplay rules, controls, build abilities, pickups, hidden test cheats, and project structure.

## Overview

Orbit Duel is a local 1v1 arena game built with HTML, CSS, and JavaScript.

- Two players fight inside a circular arena.
- Each player selects one build before the round starts.
- Players are always moving in the direction of their current travel vector.
- The first player to reduce the opponent to `0` HP wins.

## How To Run

Open `index.html` in a web browser, or run a local server:

```powershell
npm install
npm start
```

Then open http://localhost:3000 in your browser.

## Tech Stack

- Frontend: plain HTML/CSS/JavaScript
- Main gameplay file: `script.js`

## Game Window And Layout

- Game canvas size: `800 x 800`
- Arena shape: circular
- Arena radius: `380`
- Player radius: `25`

The UI shows:

- Player 1 health and cooldown bars on the left
- Player 2 health and cooldown bars on the right
- A build selection menu before the round
- A game-over overlay with a rematch button

## Goal Of The Game

The objective is to defeat the other player by dealing damage until their HP reaches `0`.

Every build starts with:

- `1000` max HP
- A dash
- A primary attack
- A special ability

## Controls

### Player 1

- `E`: Dash
- `R`: Shoot / primary attack
- `F`: Ability

### Player 2

- `O`: Dash
- `P`: Shoot / primary attack
- `L`: Ability

## Core Movement Rules

Players do not steer directly with WASD or arrow keys. Instead, they continuously move according to their stored direction vector.

### Base Movement

- Base move speed: `200` pixels/second
- Swordsman base move speed is `30%` faster than normal
- Reaper gets extra movement speed while its ability is active
- Reaper debuff can slow the enemy

### Dash

- Dash duration: `1.0` second
- Dash cooldown: `5.0` seconds
- Dash speed multiplier: `3x`

### Arena Wall Bounce

When a player reaches the arena boundary:

- Their movement direction is reflected off the wall
- A small random angle is added to prevent repetitive wall loops
- The player is pushed back inside the arena boundary

If the opponent is a Railgun and has its boundary ability active, touching the wall also causes bonus damage.

### Player-On-Player Collision

When the two player balls collide:

- They are separated so they no longer overlap
- Their movement directions bounce off each other
- A visual impact effect is spawned

This keeps player bodies from stacking on top of each other.

## Global Combat Rules

### Health

- All builds have `1000` HP
- Damage cannot reduce HP below `0`
- Healing cannot raise HP above max HP

### Cooldowns

Each player has three cooldown bars:

- Dash cooldown
- Primary attack cooldown
- Ability cooldown

Most abilities start the round on cooldown.

### Rotation / Aim

Each player has a spinning aim angle called `spinAngle`.

- Base spin speed is faster than a simple half-turn rate
- Gunner reverses spin direction every time it fires
- Railgun has slower spin than other builds
- Swordsman spin becomes much faster during sword attacks
- Ninja slash temporarily freezes aim rotation while the slash animation resolves

## Builds

## Gunner

The Gunner is the default ranged build.

### Primary Attack

- Base cooldown: `2.0` seconds
- Damage: `100`
- Projectile type: standard bullet

The Gunner uses a hold-to-fire system:

- Pressing shoot starts charging the shot
- Releasing shoot fires it
- If held long enough, it auto-fires after `1.0` second
- While holding past a short delay, the player moves at one-third speed

### Ability

The Gunner ability fires a rapid stream of bullets.

- Ability cooldown: `20.0` seconds
- Duration window: `1.0` second
- Total bullets: `30`
- Bullet damage: `20`
- Spread: `20` degrees

While this ability is firing:

- The Gunner moves at `50%` speed

## Railgun

The Railgun is a precision beam build.

### Primary Attack

- Cooldown: `3.0` seconds
- Beam damage: `50`

The railgun beam:

- Fires in the current aim direction
- Extends until it exits the arena
- Has a short visible beam duration
- Uses live hit detection while visible
- Can hit the opponent once per beam

### Ability

The Railgun ability electrifies the arena boundary.

- Ability cooldown: `30.0` seconds
- Active duration: `5.0` seconds
- Boundary damage: `50`

While active:

- If the opponent collides with the arena wall, they take extra damage
- The arena border gets a visual energy effect

## Swordsman

The Swordsman is a close-range melee build.

### Passive Traits

- Movement speed is `30%` faster than the normal base movement

### Primary Attack

- Cooldown: `3.0` seconds
- Damage: `75`
- Attack duration: `1.0` second
- Spin multiplier during standard attack: `4.0x`

The sword attack is a temporary melee hit window.

### Ability

The Swordsman ability is a short burst slash.

- Ability cooldown: `20.0` seconds
- Ability damage: `125`
- Active burst time: `0.35` seconds
- Spin multiplier during ability: `22.0x`

## Archer

The Archer is a charge-shot projectile build.

### Primary Attack

- Cooldown: `0.5` seconds
- Charge stage time: `1.2` seconds per stage
- Max stages: `5`
- Base damage per stage: `50`
- Arrow speed multiplier: `0.7`

The Archer attack works like this:

- Hold the shoot key to charge
- Stages increase over time
- Release to fire
- If charge stage is `0`, no arrow is fired
- Damage is `stage * 50`

### Ability

The Archer ability buffs the next arrow only.

- Ability cooldown: `30.0` seconds
- Next arrow damage multiplier: `1.5x`
- Next arrow size multiplier: `2.0x`
- Next arrow bounce count: `3`

The buff is consumed when the next arrow is fired.

## Ninja

The Ninja is a mobility and combo build.

### Primary Attack

- Cooldown: `4.0` seconds
- Projectile: ninja star
- Star damage: `50`

The ninja star:

- Spins while flying
- Uses the Archer-style slower projectile speed
- Triggers a combo if it hits the opponent

### On Ninja Star Hit

When the star hits:

- The target takes `50` damage
- The Ninja teleports behind the target
- The Ninja begins a follow-up slash animation
- The slash can damage once if the enemy is inside the sweep arc

### Slash Follow-Up

- Slash damage: `100`
- Katana range: `54`
- Follow-up slash duration: `0.33` seconds

The slash:

- Is based on a sweeping arc in front of the Ninja
- Uses a stored slash base angle
- Deals damage once per slash
- Continues animating briefly even after landing its hit

### Ability

The Ninja ability is an instant reposition behind the enemy.

- Ability cooldown: `25.0` seconds

When used:

- The Ninja teleports to a point behind the opponent
- The Ninja reorients to face the target
- A burst of particles is spawned at the previous position

## Reaper

The Reaper is a throwable weapon and debuff build.

### Primary Attack

- Cooldown: `1.0` second
- Scythe damage: `50`

The Reaper throws a scythe projectile.

Important behavior:

- The Reaper can only throw the scythe when it currently has it
- Once thrown, `hasScythe` becomes false
- The scythe returns after hitting the wall
- The scythe can be caught again by its owner
- The returning scythe homes back toward the owner

### Scythe Hit Behavior

When the scythe touches the opponent:

- It can damage the target repeatedly, but only once every `200ms` per target
- Base scythe lifesteal is `20%` of damage dealt
- While Reaper ability is active, lifesteal becomes `50%`

### Ability

The Reaper ability buffs the Reaper and debuffs the opponent.

- Ability cooldown: `30.0` seconds
- Active time on the Reaper: `5.0` seconds
- Debuff time on the opponent: `5.0` seconds

Effects applied to the enemy:

- Damage taken multiplier: `0.7`
- Movement speed multiplier: `0.5`
- Shoot cooldown multiplier: `1.3`

Effects applied to the Reaper:

- Movement speed multiplier: `1.3`
- Scythe throw speed multiplier: `1.2`
- Lifesteal on scythe hits becomes `50%`

## Shotgun

The Shotgun is a close-range spread build with a hook-based crowd-control ability.

### Primary Attack

- Cooldown: `2.0` seconds
- Pellet count: `8`
- Damage per pellet: `25`
- Spread: `35` degrees
- Range: short

The Shotgun fires a spread of pellets in the aim direction.

- Pellets lose damage over distance
- Full damage requires close range
- A syringe buff increases the next shotgun blast's pellet damage

### Ability

The Shotgun ability throws a large anchor-like hook.

- Ability cooldown: `15.0` seconds
- Hook damage: `50`
- Slow duration: `3.0` seconds
- Slow movement multiplier: `0.5`

Current hook behavior:

- The hook travels until it hits the opponent or the arena border
- A rope is drawn from the Shotgun player to the hook
- On first hit, it damages once, slows, and latches onto the target
- While latched, it pulls the target toward the Shotgun player
- The hook then releases and disappears if the target reaches the Shotgun player
- The hook also releases if the pulled target is hit by a shotgun pellet
- If the hook reaches the arena border without latching, it returns to the Shotgun player

## Pyro

The Pyro is a sustained flamethrower build with burn setup and an expanding fire-wave ability.

### Passive Traits

- Uses an ammo bar instead of a normal primary cooldown
- A full ammo bar allows `5.0` seconds of continuous fire
- Ammo recharges slowly while not firing
- The flamethrower cannot be started below `10%` ammo
- If the player is already firing before dropping below `10%`, they may continue until the ammo bar reaches `0`

### Primary Attack

- Range: `280`
- Cone angle: `-5` to `5` degrees
- Damage: `1` every `0.05` seconds while the target is inside the cone

The Pyro primary attack:

- Fires a narrow cone in the aim direction
- Uses a dotted aim line that only extends to the cone range
- Shows animated flame streaks while firing
- Causes a light screen shake when damage ticks land

### Burn Effect

- Burn trigger: target must stay in the cone for at least `0.3` seconds before leaving it
- Burn duration: `2.0` seconds
- Burn damage: `10` per second
- Burn does not stack; refreshing the cone exposure resets the timer logic

### Ability

The Pyro ability sends an expanding circular fire wave outward from the Pyro.

- Ability cooldown: `30.0` seconds
- Wave damage: `50`
- Pushes the opponent outward away from the Pyro
- Applies burn on hit
- Burn duration from ability: `5.0` seconds

## Projectiles

The game uses a shared `Bullet` class for most attack objects.

Projectile types currently used:

- Standard bullet
- Arrow
- Ninja star
- Scythe

### Shared Projectile Rules

- Default projectile lifetime: `10.0` seconds
- Projectiles move every frame using their direction and speed
- Most projectiles disappear on wall impact
- Projectiles spawn impact particles when they hit

### Arrow Rules

- Can bounce if buffed by Archer ability
- Bounce count is tracked per projectile
- Buffed arrows become larger and stronger

### Ninja Star Rules

- Spins visually while traveling
- On player hit, it deals damage and starts the Ninja teleport-slash combo

### Scythe Rules

- Spins visually while traveling
- On first wall contact, it changes to return mode instead of disappearing
- In return mode, it homes toward its owner
- It can be recovered by touching the owner

## Pickups

Pickups spawn during a round.

### Spawn Timing

- Minimum spawn delay: `15.0` seconds
- Maximum spawn delay: `30.0` seconds

Pickups spawn at random valid positions inside the arena and avoid appearing too close to either player.

### Pickup Types

#### Medkit

- Heals `100` HP

#### Syringe

- Buffs the next base attack only
- Damage multiplier: `1.3x`

The syringe buff is consumed the next time a relevant attack uses it.

## Damage, Healing, And Debuffs

### Damage Flow

Damage generally works like this:

1. An attack hits the target.
2. Some attacks apply target-side debuff scaling.
3. The target loses HP.
4. If HP reaches `0`, the round ends.

### Reaper Debuff Interaction

When the Reaper debuff is active on a player:

- Incoming attack damage is scaled by `0.7`
- Movement is slower
- Shoot cooldowns are worse

This means the current debuff reduces the damage the target actually takes, rather than amplifying it.

## Hidden Playtesting Cheats

These cheats last until the tab or app view is refreshed.

### Slow Motion Cheat

Press `.` three times within `2` seconds:

- The whole game runs at `20%` speed
- This is done by scaling `dt` in the main game loop

### Instant Ability Reload Cheat

Press `,` three times within `2` seconds:

- Both players' ability cooldowns are set to `0`
- Both UI cooldown bars update immediately

## Round Flow

### Start Of Session

- The game opens on the build selection menu
- Both players default to `Gunner`

### Start Of Round

When a round begins:

- Player 1 spawns near the top-right side
- Player 2 spawns near the bottom-left side
- Key states are reset
- Health bars are refreshed
- The first pickup spawn timer is scheduled

### End Of Round

When one player reaches `0` HP:

- A death explosion effect is spawned
- The game-over overlay appears
- The winner text is updated

### Rematch

Pressing rematch returns to the build-selection menu.

## Visual Effects

The game includes several effects to make hits and abilities readable:

- Screen shake on impacts and heavy events
- Death explosion particles
- Impact starburst particles
- Railgun energized boundary ring
- Reaper ability aura
- Ninja slash arc VFX
- Dash rainbow trail effect
- Pickup glow effects

## Code Structure

### `index.html`

Defines:

- The HUD
- The build selection menu
- The game-over screen
- The canvas element

### `style.css`

Handles:

- Layout
- HUD styling
- Menu styling
- Overlays
- General visual presentation

### `script.js`

Contains almost all gameplay logic:

- Constants and tuning values
- Build definitions
- Input listeners
- Secret cheat handling
- Player logic
- Projectile logic
- Particle effects
- Pickup logic
- Arena drawing
- Main game loop


## Important Classes And Systems

### `Player`

Responsible for:

- Movement
- Cooldowns
- Attack handling
- Ability activation
- Taking damage
- Healing
- Rendering
- Build-specific state

### `Bullet`

Responsible for:

- Projectile movement
- Projectile lifetime
- Wall collision
- Player hit detection
- Special projectile behavior by type
- Projectile rendering

### `Particle`

Responsible for:

- Short-lived visual effects
- Motion and fading over time

### `Pickup`

Responsible for:

- Pickup position
- Pickup rendering
- Medkit or syringe identity

## Main Loop

The game loop:

1. Computes `dt`
2. Applies global time scaling
3. Updates screen shake
4. Draws the arena
5. Updates players
6. Resolves player-body collision
7. Updates bullets
8. Updates particles
9. Spawns and resolves pickups
10. Draws all world objects
11. Requests the next animation frame

## Current Defaults And Notable Values

- Arena radius: `380`
- Player HP: `1000`
- Player radius: `25`
- Base move speed: `200`
- Dash multiplier: `3`
- Dash cooldown: `5.0`
- Gunner shoot cooldown: `2.0`
- Gunner ability cooldown: `20.0`
- Railgun shoot cooldown: `3.0`
- Railgun ability cooldown: `30.0`
- Swordsman shoot cooldown: `3.0`
- Swordsman ability cooldown: `20.0`
- Archer shoot cooldown: `0.5`
- Archer ability cooldown: `30.0`
- Ninja shoot cooldown: `4.0`
- Ninja ability cooldown: `25.0`
- Reaper shoot cooldown: `1.0`
- Reaper ability cooldown: `30.0`
- Medkit heal: `100`
- Syringe multiplier: `1.3`

## Notes For Future Maintenance

- Most tuning values live near the top of `script.js`
- Build balance is centralized in the `BUILDS` object
- Attack-specific behavior is mostly inside `Player.update()` and `Bullet.update()`
- UI cooldown bars are updated through `Player.updateUI()`
- Hidden testing cheats are handled through the keydown listener and `trackSecretCheat()`

## Summary

This project is a local arena dueling game where every build uses the same movement shell but radically different attack logic. Most gameplay behavior is implemented in a single script file, which makes it fast to iterate on balance but also means documentation like this is useful for tracking how each system currently behaves.
