# Orbit Duel

Orbit Duel is a browser arena fighter built with plain HTML, CSS, and JavaScript. Two orb fighters bounce around a circular arena, pick a build, and try to delete each other before the other build deletes them first.

## How To Run

Click link: https://sir0reo.github.io/Orbit-Duel/

## Current Flow

- The game opens on a title screen
- `Local Game` opens the build-select menu for human vs human
- `Bots` opens the same build-select menu for human vs bot
- `Online` is present on the title screen but is still a placeholder
- Each player side in the build menu has a `Random` button
- Bot mode includes a difficulty selector: `Easy`, `Normal`, `Hard`

## Controls

### Player 1

- `E`: Dash
- `R`: Primary attack
- `F`: Ability

### Player 2

- `O`: Dash
- `P`: Primary attack
- `L`: Ability

In bot mode, only Player 1 is human-controlled.

## Arena And Match Rules

- Arena shape: circular
- Player radius: `25`
- Base move speed: `200`
- Dash duration: `1.0s`
- Dash cooldown: `5.0s`
- Players continuously move using their stored direction vector
- Wall hits reflect movement and add a small inward bias so fighters do not get trapped in endless border loops
- The arena is slightly larger than the original version and the canvas/frame scales to keep the border visible

## Round Flow

- The match starts from build select
- Both sides default to `Gunner`
- On death, the defeated orb disappears immediately
- A giant death explosion plays first
- `KO` appears `1` second later
- The rematch button pops in `1` second after the KO screen appears
- Rematch returns to the build-select menu for the current mode

## Modes

### Local Game

- Human vs human
- Both players choose builds manually or with `Random`

### Online

- Click `Online` on the title screen to open the room-code panel
- Hosting generates a random `6` character room code
- A second player joins with that code
- When the room fills, both players are assigned `Player 1` or `Player 2` by a coin flip
- Both online players use `Player 1` controls: `E` dash, `R` shoot, `F` ability
- Each player picks only their own build in the menu
- The host starts the round after both builds are set
- Input is relayed in real time with Socket.IO
- If either player disconnects, the room is cleaned up and the remaining player is returned to the title screen

### Bots

- Human vs AI
- You still choose both builds
- Bot difficulty changes reaction speed, aim timing, attack commitment, and ability usage

## Builds

## Gunner

- Hold-to-fire primary
- Releasing fires one bullet
- Holding too long auto-fires
- Ability fires a short bullet stream

## Railgun

- Primary is a hitscan beam
- Ability electrifies the arena border

## Swordsman

- Faster movement than most builds
- Primary is a melee swing
- Ability is a high-speed sword burst

## Archer

- Charges arrows in stages
- Release fires the current charge
- Ability buffs the next arrow with more damage, larger size, and bounces
- Archer bots now actually charge and release based on aim quality

## Ninja

- Primary throws a ninja star
- Star hit teleports the Ninja behind the target and starts a slash follow-up
- Ability teleports behind the opponent
- Ability now leaves a large smoke poof at the old position
- Medium and hard ninja bots wait for primary to be ready before teleporting, then force a follow-up attack
- Slash visuals were updated so the katana points forward during the cut and the hit reads more clearly

## Reaper

- Throws a returning scythe
- Ability buffs the Reaper and debuffs the enemy

## Shotgun

- Fires a close-range pellet spread
- Ability throws a hook that damages, slows, and pulls

## Pyro

- Uses ammo instead of a normal primary cooldown
- Primary is a narrow flamethrower cone
- Targets can be ignited after sustained exposure
- Ability sends out an expanding fire wave
- Pyro bots now hold flame much longer instead of stuttering

## Necromancer

- Primary fires a homing orb with lighter tracking than before
- Ability summons clones
- Clones fire their own orbs for `50` damage
- Clones automatically expire after `30` seconds if they are not destroyed

## Juggernaut

- Higher max HP than the other builds
- Primary creates a gravity pull window
- Ability grants temporary invulnerability
- Medium and hard juggernaut bots only use primary when the opponent is actually inside gravity range

## Pickups

Two pickups can spawn during rounds:

- `Medkit`: heals `100`
- `Syringe`: buffs the next base attack by `1.3x`

## Bot Notes

Bot logic lives in `script.js` and currently handles:

- Difficulty-based aim tolerance
- Charge timing for Gunner and Archer
- Flamethrower hold timing for Pyro
- Teleport-follow-up logic for Ninja
- Range-gated primary usage for Juggernaut

## Effects And Presentation

The game currently includes:

- Title screen with mode buttons
- Build preview card in the menu
- KO animation and delayed rematch reveal
- Large death explosions
- Impact particles
- Dash trails
- Smoke poofs for Ninja teleports
- Slash VFX for Ninja hits
- Railgun border effect

## Tech Stack

- HTML
- CSS
- JavaScript
- Node.js
- Express
- Socket.IO

Main gameplay logic lives in `script.js`.

## Project Structure

- `index.html`: HUD, title screen, menus, overlays, canvas
- `style.css`: layout, menu styling, HUD styling, overlay styling
- `script.js`: gameplay, builds, bots, particles, arena logic, round flow

## Hidden Cheats

These still exist for local testing:

- Press `.` three times within `2` seconds for slow motion
- Press `,` three times within `2` seconds to instantly refresh both abilities

## Notes

- Most tuning values are near the top of `script.js`
- Build balance is centralized in the `BUILDS` object
- Bot tuning also lives in `script.js`
- If you change arena size, also check `resizeCanvas()` and `drawArena()`
