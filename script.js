const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const p1HealthBar = document.getElementById('p1-health');
const p1HealthText = document.getElementById('p1-health-text');
const p1DashCd = document.getElementById('p1-dash-cd');
const p1ShootCd = document.getElementById('p1-shoot-cd');
const p1SpecialCd = document.getElementById('p1-special-cd');

const p2HealthBar = document.getElementById('p2-health');
const p2HealthText = document.getElementById('p2-health-text');
const p2DashCd = document.getElementById('p2-dash-cd');
const p2ShootCd = document.getElementById('p2-shoot-cd');
const p2SpecialCd = document.getElementById('p2-special-cd');

const gameOverScreen = document.getElementById('game-over-screen');
const winnerText = document.getElementById('winner-text');
const rematchBtn = document.getElementById('rematch-btn');
const player1Name = document.getElementById('player1-name');
const player2Name = document.getElementById('player2-name');
const titleScreen = document.getElementById('title-screen');
const localGameBtn = document.getElementById('local-game-btn');
const onlineGameBtn = document.getElementById('online-game-btn');
const botsGameBtn = document.getElementById('bots-game-btn');
const menuScreen = document.getElementById('menu-screen');
const menuSubtitle = document.getElementById('menu-subtitle');
const botSettings = document.getElementById('bot-settings');
const menuPlayer1Title = document.getElementById('menu-player1-title');
const menuPlayer2Title = document.getElementById('menu-player2-title');
const startRoundBtn = document.getElementById('start-round-btn');
const menuHint = document.getElementById('menu-hint');
const buildHoverCard = document.getElementById('build-hover-card');
const buildHoverName = document.getElementById('build-hover-name');
const buildHoverDesc = document.getElementById('build-hover-desc');
const buildHoverStats = document.getElementById('build-hover-stats');

// Constants (will be updated by resizeCanvas)
let ARENA_RADIUS = 388; // slightly larger than the original arena while keeping the border visible
let CENTER_X = canvas.width / 2;
let CENTER_Y = canvas.height / 2;

const BALL_RADIUS = 25;
const BALL_BASE_SPEED = 200; // pixels per second
const DASH_MULT = 3;
const BULLET_RADIUS = 5;
const BULLET_SPEED = 520 * 1.2; // pixels per second (20% faster)
const MAX_HP = 1000;
const SHOOT_HOLD_MAX = 1.0; // seconds
const HOLD_SLOW_MULT = 1 / 3; // "300% slower" => 3x slower
const HOLD_SLOW_DELAY = 0.08; // seconds; taps won't slow you
const SHOOT_COOLDOWN = 2.0; // seconds

const SPECIAL_COOLDOWN = 20.0; // seconds
const SPECIAL_DURATION = 1.0; // seconds to fire all bullets
const SPECIAL_BULLETS = 30;
const SPECIAL_DAMAGE = 20;
const SPECIAL_SPREAD_DEG = 20;
const SECRET_CHEAT_WINDOW = 2.0;
const SECRET_SLOWMO_SCALE = 0.2;
const PYRO_MAX_AMMO = 5.0;
const PYRO_AMMO_RECHARGE_PER_SEC = 0.45;
const PYRO_CONE_RANGE = 280;
const PYRO_CONE_HALF_ANGLE = 5 * Math.PI / 180;
const PYRO_CONE_TICK_DAMAGE = 2;
const PYRO_CONE_TICK_INTERVAL = 0.02;
const PYRO_MIN_START_AMMO = PYRO_MAX_AMMO * 0.1;
const PYRO_IGNITE_DELAY = 0.12;
const PYRO_BURN_DAMAGE_PER_SEC = 10;
const JUGGERNAUT_COLLISION_DAMAGE = 50;
const JUGGERNAUT_COLLISION_COOLDOWN = 0.35;

/** Ninja star follow-up slash */
const NINJA_SLASH_DURATION = 0.33;
const REAPER_BASE_LIFESTEAL = 0.2;
const REAPER_ABILITY_LIFESTEAL = 0.5;

/** Classic reaper scythe: straight haft, collar, thin crescent blade (neutral line-art style) */
function drawScytheWeapon(ctx) {
    const ink = '#e4e4e7';
    const inkDim = '#a1a1aa';
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';

    // Straight haft (diagonal pole)
    ctx.strokeStyle = ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(1.5, 13);
    ctx.lineTo(-1.5, -31);
    ctx.stroke();

    // Pommel cap (bottom band)
    ctx.lineWidth = 2;
    ctx.strokeRect(-4, 11, 11, 4);

    // Blade socket / collar where haft meets blade
    ctx.strokeRect(-9, -36, 17, 8);
    // Short stub above socket (cap past collar)
    ctx.beginPath();
    ctx.moveTo(-2, -36);
    ctx.lineTo(-2, -39);
    ctx.moveTo(2, -36);
    ctx.lineTo(2, -39);
    ctx.stroke();

    // Blade — straighter crescent (gentler curve than a deep hook)
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = ink;
    ctx.beginPath();
    ctx.moveTo(-1.5, -31);
    ctx.bezierCurveTo(10, -40, 26, -40, 37, -28);
    ctx.bezierCurveTo(38, -26, 38.5, -24, 38.5, -22);
    ctx.stroke();

    ctx.strokeStyle = inkDim;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-1.5, -31);
    ctx.bezierCurveTo(8, -38, 22, -38, 32, -28);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(4, -38);
    ctx.bezierCurveTo(18, -42, 30, -36, 36, -28);
    ctx.stroke();

    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.moveTo(37, -28);
    ctx.lineTo(39, -22);
    ctx.lineTo(35, -25);
    ctx.closePath();
    ctx.fill();
}

const BUILDS = {
    gunner: {
        name: 'Gunner',
        maxHp: 1000,
        shootCooldown: SHOOT_COOLDOWN,
        abilityCooldown: SPECIAL_COOLDOWN,
        abilityStartsOnCooldown: true,
    },
    railgun: {
        name: 'Railgun',
        maxHp: 1000,
        shootCooldown: 3.0,
        shootDamage: 50,
        beamColor: '#a855f7',
        abilityCooldown: 30.0,
        abilityStartsOnCooldown: true,
        abilityDuration: 5.0,
        boundaryDamage: 50,
    },
    swordsman: {
        name: 'Swordsman',
        maxHp: 1000,
        shootCooldown: 3.0,
        swordDamage: 75,
        swordAbilityDamage: 125,
        swordAttackDuration: 1.0,
        swordSpinMult: 4.0, // 300% faster => 4x
        swordAbilitySpinMult: 22.0, // 100% faster than before (now ~2000% total)
        abilityCooldown: 20.0,
        abilityStartsOnCooldown: true,
    },
    archer: {
        name: 'Archer',
        maxHp: 1000,
        shootCooldown: 0.5,
        chargeStageTime: 1.2,
        maxStages: 5,
        baseDamagePerStage: 50,
        arrowSpeedMult: 0.7, // 30% slower than gunner bullet
        abilityCooldown: 30.0,
        abilityStartsOnCooldown: true,
        abilityDamageMult: 1.5,
        abilityScaleMult: 2.0, // 100% larger
        abilityBounces: 3,
    },
    ninja: {
        name: 'Ninja',
        maxHp: 1000,
        shootCooldown: 4.0,
        abilityCooldown: 15.0,
        abilityStartsOnCooldown: true,
        starDamage: 50,
        slashDamage: 100,
        katanaRange: 54,
    },
    reaper: {
        name: 'Reaper',
        maxHp: 1000,
        shootCooldown: 1.0,
        abilityCooldown: 30.0,
        abilityStartsOnCooldown: true,
        scytheDamage: 50,
        scytheSpeedMult: 1.0,
    },
    shotgun: {
        name: 'Shotgun',
        maxHp: 1000,
        shootCooldown: 2.0,
        abilityCooldown: 25.0,
        abilityStartsOnCooldown: true,
        pelletCount: 8,
        pelletDamage: 25,
        pelletSpreadDeg: 35,
        pelletRange: 240,
        pelletMinDamageMult: 0.3,
        hookDamage: 50,
        hookSlowDuration: 3.0,
        hookSlowMult: 0.5,
        hookPullDuration: 1.1,
        hookPullStrength: 340,
        hookReturnSpeed: BULLET_SPEED * 1.05,
    },
    pyro: {
        name: 'Pyro',
        maxHp: 1000,
        shootCooldown: 0.0,
        abilityCooldown: 30.0,
        abilityStartsOnCooldown: true,
        flameTickDamage: PYRO_CONE_TICK_DAMAGE,
        flameTickInterval: PYRO_CONE_TICK_INTERVAL,
        flameRange: PYRO_CONE_RANGE,
        flameHalfAngle: PYRO_CONE_HALF_ANGLE,
        burnDuration: 2.0,
        burnDamagePerSec: PYRO_BURN_DAMAGE_PER_SEC,
        waveDamage: 50,
        waveBurnDuration: 5.0,
        waveMaxRadius: 210,
        waveSpeed: 430,
    },
    necromancer: {
        name: 'Necromancer',
        maxHp: 1000,
        shootCooldown: 3.0,
        abilityCooldown: 35.0,
        abilityStartsOnCooldown: true,
        orbDamage: 80,
        orbSpeedMult: 0.52,
        cloneCount: 2,
        cloneHp: 1,
        orbTurnRate: 0.009,
    },
    juggernaut: {
        name: 'Juggernaut',
        maxHp: 1500,
        shootCooldown: 4.0,
        abilityCooldown: 25.0,
        abilityStartsOnCooldown: true,
        speedMult: 0.78,
        gravityDuration: 1.0,
        gravityRadius: 170,
        gravityPullStrength: 95,
        invulnDuration: 1.0,
    }
};

// Game State
let lastTime = 0;
let gameOver = false;
let bullets = [];
let particles = [];
let pickups = [];
let screenShake = { x: 0, y: 0, duration: 0, intensity: 0 };
const keys = {};
let inMenu = true;
let selectedBuilds = { 1: 'gunner', 2: 'gunner' };
let currentGameMode = 'local';
let botDifficulty = 'normal';
let gameSpeedScale = 1.0;
let summons = [];
let collisionDamageCooldown = 0;
let roundEndActive = false;
let koRevealTimeout = null;
let rematchRevealTimeout = null;
const secretCheatState = {
    '.': [],
    ',': [],
};

const BOT_DIFFICULTY_CONFIG = {
    easy: {
        decisionMin: 0.24,
        decisionMax: 0.38,
        shootTolerance: 0.28,
        specialTolerance: 0.24,
        dangerDistance: 160,
        projectileDangerDistance: 150,
        dashChance: 0.38,
        specialChance: 0.5,
        shotChance: 0.62,
        closeRange: 170,
        mediumRange: 280,
        gunnerHoldMin: 0.18,
        gunnerHoldMax: 0.42,
        archerStageMin: 1,
        archerStageMax: 2,
        pyroHoldTime: 0.8,
    },
    normal: {
        decisionMin: 0.12,
        decisionMax: 0.22,
        shootTolerance: 0.18,
        specialTolerance: 0.16,
        dangerDistance: 190,
        projectileDangerDistance: 180,
        dashChance: 0.65,
        specialChance: 0.76,
        shotChance: 0.84,
        closeRange: 200,
        mediumRange: 320,
        gunnerHoldMin: 0.24,
        gunnerHoldMax: 0.62,
        archerStageMin: 2,
        archerStageMax: 4,
        pyroHoldTime: 1.7,
    },
    hard: {
        decisionMin: 0.05,
        decisionMax: 0.12,
        shootTolerance: 0.11,
        specialTolerance: 0.1,
        dangerDistance: 220,
        projectileDangerDistance: 225,
        dashChance: 0.88,
        specialChance: 0.9,
        shotChance: 0.97,
        closeRange: 235,
        mediumRange: 360,
        gunnerHoldMin: 0.35,
        gunnerHoldMax: 0.78,
        archerStageMin: 3,
        archerStageMax: 5,
        pyroHoldTime: 2.4,
    },
};

const BUILD_MENU_INFO = {
    gunner: {
        build: 'gun go pew pew',
        primary: 'Hold the shot to charge it, then release to fire a single bullet. Holding slows movement, and the shot auto-fires if held too long.',
        ability: 'Unleashes a rapid stream of low-damage bullets for a short burst while slowing the Gunner.',
        statValues: { hp: 1000, damage: 100, primaryCd: 2.0, abilityCd: 20.0 }
    },
    railgun: {
        build: 'hitscan beam guy',
        primary: 'Fires a piercing beam in the current aim direction for a quick precision hit.',
        ability: 'Electrifies the arena border so enemies take damage when they bounce off the wall.',
        statValues: { hp: 1000, damage: 50, primaryCd: 3.0, abilityCd: 30.0 }
    },
    swordsman: {
        build: 'lad with sword that swings',
        primary: 'Performs a melee sword strike that hits in front of the player during the attack window.',
        ability: 'Activates a short, high-damage sword burst that spins much faster than the normal attack.',
        statValues: { hp: 1000, damage: 75, primaryCd: 3.0, abilityCd: 20.0 }
    },
    archer: {
        build: 'charge arrow = big damage',
        primary: 'Hold to charge arrow stages, then release to fire. Higher stages deal more damage.',
        ability: 'Buffs the next arrow so it deals more damage, becomes larger, and can bounce.',
        statValues: { hp: 1000, damage: 250, primaryCd: 0.5, abilityCd: 30.0 }
    },
    ninja: {
        build: 'sneaky unc',
        primary: 'Throws a ninja star that teleports the Ninja behind the target on hit and starts a slash combo.',
        ability: 'Instantly repositions behind the opponent to set up pressure or escape angle control.',
        statValues: { hp: 1000, damage: 100, primaryCd: 4.0, abilityCd: 25.0 }
    },
    reaper: {
        build: 'stole this scythe from the aboriginals',
        primary: 'Throws a scythe that can repeatedly damage enemies and then return to the owner.',
        ability: 'Debuffs the opponent while buffing the Reaper with speed and stronger lifesteal.',
        statValues: { hp: 1000, damage: 50, primaryCd: 1.0, abilityCd: 30.0 }
    },
    shotgun: {
        build: 'he has a shotgun',
        primary: 'Fires 8 pellets in a wide spread. Damage is strongest up close and falls off with distance.',
        ability: 'Throws an anchor hook that can latch, slow, and pull an enemy toward the Shotgunner.',
        statValues: { hp: 1000, damage: 200, primaryCd: 2.0, abilityCd: 15.0 }
    },
    pyro: {
        build: 'arson pun',
        primary: 'Channels a tight flame cone that deals rapid chip damage while consuming ammo instead of using a normal cooldown.',
        ability: 'Sends an expanding circular fire wave outward that damages, pushes, and burns the opponent.',
        statValues: { hp: 1000, damage: 20, primaryCd: 0.0, abilityCd: 30.0 }
    },
    necromancer: {
        build: 'Orb caster that pressures with roaming clones and repeated homing pressure.',
        primary: 'Fires a slow orb in the aimed direction that curves weakly toward enemy targets.',
        ability: 'Summons two fragile clones that move around the arena and keep firing orbs until they die.',
        statValues: { hp: 1000, damage: 80, primaryCd: 3.0, abilityCd: 35.0 }
    },
    juggernaut: {
        build: 'fatty boing boing',
        primary: 'Activates a short gravity field that weakly pulls the opponent closer without direct damage.',
        ability: 'Becomes immobile and invulnerable for a brief window while still threatening collision damage.',
        statValues: { hp: 1500, damage: 50, primaryCd: 4.0, abilityCd: 25.0 }
    },
};

const BUILD_STAT_RANGES = {
    hp: { min: 1000, max: 1500, betterHigh: true, label: 'HP' },
    damage: { min: 20, max: 250, betterHigh: true, label: 'Damage' },
    primaryCd: { min: 0.0, max: 4.0, betterHigh: false, label: 'Primary CD' },
    abilityCd: { min: 15.0, max: 35.0, betterHigh: false, label: 'Ability CD' },
};

// Pickups
const PICKUP_RADIUS = 12;
const MEDKIT_HEAL = 100;
const SYRINGE_MULT = 1.3;
const PICKUP_SPAWN_MIN = 15.0; // seconds
const PICKUP_SPAWN_MAX = 30.0; // seconds
let pickupSpawnTimer = 0;

// Event Listeners for Input
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (!e.repeat) {
        trackSecretCheat(e.key);
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Touch controls for mobile
let touchControls = {
    leftStick: { active: false, x: 0, y: 0 },
    rightStick: { active: false, x: 0, y: 0 }
};

function initTouchControls() {
    // Create touch control areas
    const leftTouchArea = document.createElement('div');
    leftTouchArea.id = 'left-touch-area';
    leftTouchArea.style.cssText = `
        position: absolute;
        bottom: 20px;
        left: 20px;
        width: 120px;
        height: 120px;
        background: rgba(59, 130, 246, 0.1);
        border: 2px solid rgba(59, 130, 246, 0.3);
        border-radius: 50%;
        z-index: 100;
        display: none;
        touch-action: none;
    `;
    
    const rightTouchArea = document.createElement('div');
    rightTouchArea.id = 'right-touch-area';
    rightTouchArea.style.cssText = `
        position: absolute;
        bottom: 20px;
        right: 20px;
        width: 120px;
        height: 120px;
        background: rgba(239, 68, 68, 0.1);
        border: 2px solid rgba(239, 68, 68, 0.3);
        border-radius: 50%;
        z-index: 100;
        display: none;
        touch-action: none;
    `;
    
    document.body.appendChild(leftTouchArea);
    document.body.appendChild(rightTouchArea);
    
    // Touch event handlers
    function handleTouch(area, stick, playerId, e) {
        e.preventDefault();
        const rect = area.getBoundingClientRect();
        const touch = e.touches[0] || e.changedTouches[0];
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const deltaX = touch.clientX - centerX;
        const deltaY = touch.clientY - centerY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const maxDistance = rect.width / 2;
        
        // Normalize to -1 to 1 range
        const normalizedX = Math.max(-1, Math.min(1, deltaX / maxDistance));
        const normalizedY = Math.max(-1, Math.min(1, deltaY / maxDistance));
        
        stick.active = true;
        stick.x = normalizedX;
        stick.y = normalizedY;
        
        // Map to keyboard keys for player 1 (left side)
        if (playerId === 1) {
            // Movement
            keys['w'] = normalizedY < -0.3; // up
            keys['s'] = normalizedY > 0.3;  // down
            keys['a'] = normalizedX < -0.3; // left
            keys['d'] = normalizedX > 0.3;  // right
        } else {
            // Actions for player 2 (right side) - simplified
            keys['i'] = normalizedY < -0.3; // up
            keys['k'] = normalizedY > 0.3;  // down
            keys['j'] = normalizedX < -0.3; // left
            keys['l'] = normalizedX > 0.3;  // right
        }
    }
    
    function handleTouchEnd(stick, playerId) {
        stick.active = false;
        stick.x = 0;
        stick.y = 0;
        
        // Clear keys
        if (playerId === 1) {
            keys['w'] = false;
            keys['s'] = false;
            keys['a'] = false;
            keys['d'] = false;
        } else {
            keys['i'] = false;
            keys['k'] = false;
            keys['j'] = false;
            keys['l'] = false;
        }
    }
    
    leftTouchArea.addEventListener('touchstart', (e) => handleTouch(leftTouchArea, touchControls.leftStick, 1, e));
    leftTouchArea.addEventListener('touchmove', (e) => handleTouch(leftTouchArea, touchControls.leftStick, 1, e));
    leftTouchArea.addEventListener('touchend', () => handleTouchEnd(touchControls.leftStick, 1));
    
    rightTouchArea.addEventListener('touchstart', (e) => handleTouch(rightTouchArea, touchControls.rightStick, 2, e));
    rightTouchArea.addEventListener('touchmove', (e) => handleTouch(rightTouchArea, touchControls.rightStick, 2, e));
    rightTouchArea.addEventListener('touchend', () => handleTouchEnd(touchControls.rightStick, 2));
    
    // Show/hide touch controls based on screen size and game state
    function updateTouchControlsVisibility() {
        const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
        const shouldShow = isMobile && !inMenu && !gameOver;
        leftTouchArea.style.display = shouldShow ? 'block' : 'none';
        rightTouchArea.style.display = shouldShow && currentGameMode !== 'bots' ? 'block' : 'none';
    }
    
    window.addEventListener('resize', updateTouchControlsVisibility);
    
    // Monitor game state changes
    let lastInMenu = inMenu;
    let lastGameOver = gameOver;
    
    function checkGameStateChange() {
        if (lastInMenu !== inMenu || lastGameOver !== gameOver) {
            lastInMenu = inMenu;
            lastGameOver = gameOver;
            updateTouchControlsVisibility();
        }
        requestAnimationFrame(checkGameStateChange);
    }
    
    checkGameStateChange();
    updateTouchControlsVisibility();
}

initTouchControls();

rematchBtn.addEventListener('click', () => {
    showBuildMenu(currentGameMode);
});

localGameBtn.addEventListener('click', () => {
    showBuildMenu('local');
});

onlineGameBtn.addEventListener('click', () => {
    // Placeholder for future online flow.
});

botsGameBtn.addEventListener('click', () => {
    showBuildMenu('bots');
});

startRoundBtn.addEventListener('click', () => {
    startRoundFromMenu();
});

function showBuildHover(build) {
    const info = BUILD_MENU_INFO[build];
    if (!info || !buildHoverCard) return;
    buildHoverName.textContent = BUILDS[build]?.name ?? build.toUpperCase();
    buildHoverDesc.innerHTML = `
        <div class="build-hover-section">
            <div class="build-hover-label">Build</div>
            <div>${info.build}</div>
        </div>
        <div class="build-hover-section">
            <div class="build-hover-label">Primary</div>
            <div>${info.primary}</div>
        </div>
        <div class="build-hover-section">
            <div class="build-hover-label">Ability</div>
            <div>${info.ability}</div>
        </div>
    `;
    buildHoverStats.innerHTML = '';
    Object.entries(BUILD_STAT_RANGES).forEach(([key, meta]) => {
        const value = info.statValues[key];
        const span = meta.max - meta.min || 1;
        let pct = (value - meta.min) / span;
        pct = Math.max(0, Math.min(1, pct));
        if (!meta.betterHigh) pct = 1 - pct;
        const displayValue = key.includes('Cd') ? `${value.toFixed(1)}s` : `${value}`;
        const item = document.createElement('div');
        item.className = 'build-stat-row';
        item.innerHTML = `
            <div class="build-stat-top">
                <span>${meta.label}</span>
                <span>${displayValue}</span>
            </div>
            <div class="build-stat-bar">
                <div class="build-stat-fill" style="width:${Math.round(pct * 100)}%"></div>
            </div>
        `;
        buildHoverStats.appendChild(item);
    });
    buildHoverCard.classList.remove('hidden');
}

function hideBuildHover() {
    if (!buildHoverCard) return;
    buildHoverCard.classList.add('hidden');
}

function selectBuildForPlayer(playerId, build, { revealHover = false } = {}) {
    if (!BUILDS[build]) return;
    selectedBuilds[playerId] = build;
    const group = document.querySelector(`.menu-options[data-player="${playerId}"]`);
    if (!group) return;
    group.querySelectorAll('.menu-option').forEach(btn => {
        btn.classList.toggle('selected', btn.getAttribute('data-build') === build);
    });
    if (revealHover) showBuildHover(build);
}

document.querySelectorAll('.menu-options').forEach(group => {
    group.addEventListener('click', (e) => {
        const btn = e.target.closest('.menu-option');
        if (!btn) return;
        const playerId = Number(group.getAttribute('data-player'));
        const build = btn.getAttribute('data-build');
        selectBuildForPlayer(playerId, build, { revealHover: true });
    });

    group.addEventListener('mouseover', (e) => {
        const btn = e.target.closest('.menu-option');
        if (!btn) return;
        showBuildHover(btn.getAttribute('data-build'));
    });

    group.addEventListener('focusin', (e) => {
        const btn = e.target.closest('.menu-option');
        if (!btn) return;
        showBuildHover(btn.getAttribute('data-build'));
    });

    group.addEventListener('mouseleave', hideBuildHover);
    group.addEventListener('focusout', (e) => {
        if (group.contains(e.relatedTarget)) return;
        hideBuildHover();
    });
});

document.querySelectorAll('.menu-random-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const playerId = Number(btn.getAttribute('data-random-player'));
        const builds = Object.keys(BUILDS);
        const randomBuild = builds[Math.floor(Math.random() * builds.length)];
        selectBuildForPlayer(playerId, randomBuild, { revealHover: true });
    });
});

document.querySelectorAll('.bot-difficulty-option').forEach(btn => {
    btn.addEventListener('click', () => {
        botDifficulty = btn.getAttribute('data-bot-difficulty');
        configureMenuForMode(currentGameMode);
    });
});

function trackSecretCheat(key) {
    if (key !== '.' && key !== ',') return;
    const now = performance.now() / 1000;
    const presses = secretCheatState[key];
    presses.push(now);
    while (presses.length && now - presses[0] > SECRET_CHEAT_WINDOW) {
        presses.shift();
    }
    if (presses.length < 3) return;

    presses.length = 0;
    if (key === '.') {
        gameSpeedScale = SECRET_SLOWMO_SCALE;
    } else if (p1 && p2) {
        p1.specialCooldown = 0;
        p2.specialCooldown = 0;
        p1.updateUI();
        p2.updateUI();
    }
}

function getPlayerMoveVector(player) {
    const buildMoveMult = player.build === 'swordsman'
        ? 1.3
        : (player.build === 'juggernaut' ? (player.buildCfg.speedMult ?? 1) : 1);
    const moveBase = BALL_BASE_SPEED * buildMoveMult;
    const specialMult = (player.build === 'gunner' && player.isSpecialFiring) ? 0.5 : 1;
    const holdMult = (player.build === 'gunner' && player.isHoldingShoot && player.shootHoldTime >= HOLD_SLOW_DELAY) ? HOLD_SLOW_MULT : 1;
    let speedMult = 1;
    if (player.reaperAbilityTime > 0) speedMult *= 1.3;
    if (player.reaperDebuffTime > 0) speedMult *= player.reaperDebuffSpeedMult;
    if (player.statusSlowTime > 0) speedMult *= player.statusSlowMult;
    if (player.build === 'juggernaut' && player.juggernautInvulnTime > 0) speedMult = 0;
    const speed = (player.isDashing ? moveBase * DASH_MULT : moveBase) * specialMult * holdMult * speedMult;
    return {
        x: player.dirX * speed,
        y: player.dirY * speed,
        speed
    };
}

function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

function biasDirectionInward(dirX, dirY, inwardX, inwardY, inwardWeight = 0.35) {
    const mixedX = dirX * (1 - inwardWeight) + inwardX * inwardWeight;
    const mixedY = dirY * (1 - inwardWeight) + inwardY * inwardWeight;
    const len = Math.hypot(mixedX, mixedY) || 1;
    return {
        x: mixedX / len,
        y: mixedY / len,
    };
}

function isTargetInsideCone(originX, originY, angle, range, halfAngle, targetX, targetY, radius = BALL_RADIUS) {
    const dx = targetX - originX;
    const dy = targetY - originY;
    const dist = Math.hypot(dx, dy);
    if (dist > range + radius) return false;
    const rel = normalizeAngle(Math.atan2(dy, dx) - angle);
    return Math.abs(rel) <= halfAngle;
}

function movePointToward(source, target, distance) {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const len = Math.hypot(dx, dy) || 1;
    return {
        x: source.x + (dx / len) * distance,
        y: source.y + (dy / len) * distance,
    };
}

function getNecroOrbTarget(ownerId, x, y) {
    const targets = [];
    const enemyPlayer = ownerId === 1 ? p2 : p1;
    if (enemyPlayer) targets.push(enemyPlayer);
    summons.forEach(s => {
        if (s.active && s.ownerId !== ownerId) targets.push(s);
    });
    if (!targets.length) return null;

    let best = null;
    let bestDist = Infinity;
    targets.forEach(target => {
        const dist = Math.hypot(target.x - x, target.y - y);
        if (dist < bestDist) {
            bestDist = dist;
            best = target;
        }
    });
    return best;
}

function getHumanInputs(player) {
    const dashKey = player.id === 1 ? 'e' : 'o';
    const shootKey = player.id === 1 ? 'r' : 'p';
    const specialKey = player.id === 1 ? 'f' : 'l';
    return {
        dashDown: !!keys[dashKey],
        shootDown: !!keys[shootKey],
        specialDown: !!keys[specialKey],
    };
}

function getIncomingThreat(player, dangerDistance) {
    let closestThreat = null;
    let closestDistance = Infinity;

    bullets.forEach(bullet => {
        if (!bullet.active || bullet.ownerId === player.id) return;
        const dx = player.x - bullet.x;
        const dy = player.y - bullet.y;
        const dist = Math.hypot(dx, dy);
        if (dist > dangerDistance) return;
        const towardPlayer = (bullet.dirX * dx + bullet.dirY * dy) > 0;
        if (!towardPlayer) return;
        if (dist < closestDistance) {
            closestDistance = dist;
            closestThreat = bullet;
        }
    });

    return closestThreat;
}

function shouldBotUseSpecial(player, enemy, config, angleError, distance) {
    switch (player.build) {
        case 'gunner':
            return angleError <= config.specialTolerance && distance <= config.mediumRange;
        case 'railgun':
            return angleError <= config.specialTolerance * 0.75;
        case 'swordsman':
            return distance <= config.closeRange;
        case 'archer':
            return angleError <= config.specialTolerance && distance <= config.mediumRange;
        case 'ninja':
            return distance <= config.mediumRange
                && distance >= config.closeRange * 0.7
                && (player.botDifficulty === 'easy' || player.shootCooldown <= 0);
        case 'reaper':
            return distance <= config.mediumRange;
        case 'shotgun':
            return angleError <= config.specialTolerance && distance <= config.mediumRange;
        case 'pyro':
            return distance <= config.closeRange * 1.05;
        case 'necromancer':
            return summons.filter(s => s.active && s.ownerId === player.id).length < player.buildCfg.cloneCount;
        case 'juggernaut':
            return distance <= config.closeRange;
        default:
            return false;
    }
}

function shouldBotUsePrimary(player, enemy, config, angleError, distance) {
    switch (player.build) {
        case 'swordsman':
            return distance <= config.closeRange;
        case 'shotgun':
            return angleError <= config.shootTolerance * 1.1 && distance <= config.closeRange * 1.2;
        case 'pyro':
            return distance <= player.buildCfg.flameRange * 0.92 && angleError <= player.buildCfg.flameHalfAngle * (player.botDifficulty === 'hard' ? 0.95 : 1.05);
        case 'juggernaut':
            return player.botDifficulty === 'easy'
                ? distance <= config.mediumRange
                : distance <= player.buildCfg.gravityRadius;
        default:
            return angleError <= config.shootTolerance && distance <= config.mediumRange * 1.2;
    }
}

function getBotInputs(player, dt) {
    const enemy = player.id === 1 ? p2 : p1;
    const config = BOT_DIFFICULTY_CONFIG[player.botDifficulty] ?? BOT_DIFFICULTY_CONFIG.normal;
    const state = player.botState;
    const inputs = { dashDown: false, shootDown: false, specialDown: false };

    if (!enemy) return inputs;

    state.decisionTimer -= dt;
    state.dashPulse = Math.max(0, state.dashPulse - dt);
    state.specialPulse = Math.max(0, state.specialPulse - dt);
    state.forcePrimaryTimer = Math.max(0, state.forcePrimaryTimer - dt);
    state.pyroHoldTime = Math.max(0, state.pyroHoldTime - dt);
    if (state.forcePrimaryTimer <= 0) state.forcePrimaryAfterSpecial = false;

    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const distance = Math.hypot(dx, dy);
    const angleToEnemy = Math.atan2(dy, dx);
    const angleError = Math.abs(normalizeAngle(angleToEnemy - player.spinAngle));
    const imminentThreat = getIncomingThreat(player, config.projectileDangerDistance);
    const closeDanger = distance <= config.dangerDistance;

    if (state.dashPulse > 0) inputs.dashDown = true;
    if (state.specialPulse > 0) inputs.specialDown = true;

    if (player.build === 'gunner' || player.build === 'archer') {
        if (state.shootHoldActive) {
            state.shootHoldTime += dt;
            inputs.shootDown = true;
            if (player.build === 'gunner') {
                const minimumHold = state.targetShootHold * 0.6;
                const shouldRelease = state.shootHoldTime >= state.targetShootHold
                    || (state.shootHoldTime >= minimumHold && angleError > config.shootTolerance * 1.45);
                if (shouldRelease) {
                    state.shootHoldActive = false;
                    state.shootHoldTime = 0;
                    inputs.shootDown = false;
                }
            } else {
                const targetStage = state.targetChargeStage;
                const targetHold = targetStage * player.buildCfg.chargeStageTime + 0.04;
                const releaseTolerance = player.botDifficulty === 'hard'
                    ? config.shootTolerance * 0.65
                    : (player.botDifficulty === 'normal' ? config.shootTolerance : config.shootTolerance * 1.55);
                const chargedEnough = state.shootHoldTime >= targetHold;
                const shouldRelease = chargedEnough && angleError <= releaseTolerance;
                if (shouldRelease) {
                    state.shootHoldActive = false;
                    state.shootHoldTime = 0;
                    inputs.shootDown = false;
                }
            }
        }
    } else if (player.build === 'pyro') {
        const shouldKeepFlaming = state.pyroHoldTime > 0
            && distance <= player.buildCfg.flameRange * 1.08
            && angleError <= player.buildCfg.flameHalfAngle * 1.5;
        if (shouldKeepFlaming || shouldBotUsePrimary(player, enemy, config, angleError, distance)) {
            inputs.shootDown = true;
        }
    } else if (state.shootPulse > 0) {
        state.shootPulse = Math.max(0, state.shootPulse - dt);
        inputs.shootDown = true;
    }

    const needsDecision = state.decisionTimer <= 0;
    if (!needsDecision) return inputs;
    state.decisionTimer = randBetween(config.decisionMin, config.decisionMax);

    if (!inputs.dashDown && player.dashCooldown <= 0 && (imminentThreat || closeDanger) && Math.random() <= config.dashChance) {
        state.dashPulse = 0.08;
        inputs.dashDown = true;
    }

    if (!inputs.specialDown && player.specialCooldown <= 0 && shouldBotUseSpecial(player, enemy, config, angleError, distance) && Math.random() <= config.specialChance) {
        state.specialPulse = 0.08;
        inputs.specialDown = true;
    }

    if (player.build === 'ninja' && state.forcePrimaryAfterSpecial && player.shootCooldown <= 0) {
        state.shootPulse = 0.08;
        state.forcePrimaryAfterSpecial = false;
        state.forcePrimaryTimer = 0;
        inputs.shootDown = true;
        return inputs;
    }

    if (player.shootCooldown > 0) return inputs;

    if (player.build === 'gunner') {
        if (!state.shootHoldActive && shouldBotUsePrimary(player, enemy, config, angleError, distance) && Math.random() <= config.shotChance) {
            state.shootHoldActive = true;
            state.shootHoldTime = 0;
            state.targetShootHold = randBetween(config.gunnerHoldMin, config.gunnerHoldMax);
            inputs.shootDown = true;
        }
        return inputs;
    }

    if (player.build === 'archer') {
        if (!state.shootHoldActive && shouldBotUsePrimary(player, enemy, config, angleError, distance) && Math.random() <= config.shotChance) {
            state.shootHoldActive = true;
            state.shootHoldTime = 0;
            state.targetChargeStage = Math.floor(randBetween(config.archerStageMin, config.archerStageMax + 1));
            inputs.shootDown = true;
        }
        return inputs;
    }

    if (player.build === 'pyro' && shouldBotUsePrimary(player, enemy, config, angleError, distance) && Math.random() <= config.shotChance) {
        state.pyroHoldTime = Math.max(state.pyroHoldTime, config.pyroHoldTime);
        inputs.shootDown = true;
        return inputs;
    }

    if (player.build !== 'pyro' && shouldBotUsePrimary(player, enemy, config, angleError, distance) && Math.random() <= config.shotChance) {
        state.shootPulse = 0.08;
        inputs.shootDown = true;
    }

    return inputs;
}

function getPlayerInputs(player, dt) {
    return player.isBot ? getBotInputs(player, dt) : getHumanInputs(player);
}

function releaseHookOnPlayer(playerId) {
    bullets.forEach(b => {
        if (!b.active || b.type !== 'hook') return;
        if (b.hookedTargetId !== playerId) return;
        b.hookedTargetId = null;
        b.returning = true;
    });
}

function resolvePlayerCollision(a, b) {
    if (!a || !b) return;
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    let dist = Math.hypot(dx, dy);
    const minDist = BALL_RADIUS * 2;
    if (dist >= minDist) return;

    if (dist < 0.0001) {
        dx = 1;
        dy = 0;
        dist = 1;
    }

    const nx = dx / dist;
    const ny = dy / dist;
    const overlap = minDist - dist;
    const wasCooldownReady = collisionDamageCooldown <= 0;
    const separation = overlap * 0.55 + 0.5;
    a.x -= nx * separation;
    a.y -= ny * separation;
    b.x += nx * separation;
    b.y += ny * separation;

    const av = getPlayerMoveVector(a);
    const bv = getPlayerMoveVector(b);
    const relativeSpeed = (bv.x - av.x) * nx + (bv.y - av.y) * ny;
    const aTangent = -a.dirX * ny + a.dirY * nx;
    const bTangent = -b.dirX * ny + b.dirY * nx;
    let aNormal = a.dirX * nx + a.dirY * ny;
    let bNormal = b.dirX * nx + b.dirY * ny;

    if (relativeSpeed < -0.01) {
        const nextANormal = bNormal;
        const nextBNormal = aNormal;
        aNormal = nextANormal;
        bNormal = nextBNormal;
    } else {
        aNormal = -Math.max(0.75, Math.abs(aNormal));
        bNormal = Math.max(0.75, Math.abs(bNormal));
    }

    a.dirX = aNormal * nx - aTangent * ny;
    a.dirY = aNormal * ny + aTangent * nx;
    b.dirX = bNormal * nx - bTangent * ny;
    b.dirY = bNormal * ny + bTangent * nx;

    const aLen = Math.hypot(a.dirX, a.dirY) || 1;
    const bLen = Math.hypot(b.dirX, b.dirY) || 1;
    a.dirX /= aLen;
    a.dirY /= aLen;
    b.dirX /= bLen;
    b.dirY /= bLen;

    if (wasCooldownReady) {
        if (a.build === 'juggernaut') {
            const damage = JUGGERNAUT_COLLISION_DAMAGE * a.nextAttackDamageMult;
            a.nextAttackDamageMult = 1.0;
            b.takeDamage(damage);
        }
        if (b.build === 'juggernaut') {
            const damage = JUGGERNAUT_COLLISION_DAMAGE * b.nextAttackDamageMult;
            b.nextAttackDamageMult = 1.0;
            a.takeDamage(damage);
        }
        collisionDamageCooldown = JUGGERNAUT_COLLISION_COOLDOWN;
    }

    spawnImpact((a.x + b.x) / 2, (a.y + b.y) / 2, '#ffffff');
}

function resolveJuggernautCloneCollision(player, clone) {
    if (!player || !clone || !clone.active) return;
    if (player.build !== 'juggernaut') return;
    const dist = Math.hypot(player.x - clone.x, player.y - clone.y);
    if (dist <= BALL_RADIUS + clone.radius) {
        clone.hit();
    }
}

class Player {
    constructor(id, color, startX, startY, startAngle, buildName = 'gunner', options = {}) {
        this.id = id;
        this.color = color;
        this.x = startX;
        this.y = startY;
        this.build = BUILDS[buildName] ? buildName : 'gunner';
        this.buildCfg = BUILDS[this.build];
        this.isBot = !!options.isBot;
        this.botDifficulty = options.botDifficulty ?? 'normal';
        this.botState = {
            decisionTimer: 0,
            shootPulse: 0,
            specialPulse: 0,
            dashPulse: 0,
            shootHoldActive: false,
            shootHoldTime: 0,
            targetShootHold: 0,
            targetChargeStage: 1,
            pyroHoldTime: 0,
            forcePrimaryAfterSpecial: false,
            forcePrimaryTimer: 0,
        };
        
        // Velocity direction (normalized vector)
        this.dirX = Math.cos(startAngle);
        this.dirY = Math.sin(startAngle);
        
        // Spin/Gun angle initially matches travel direction
        this.spinAngle = startAngle;
        this.spinSpeed = (Math.PI / 2) * 1.5; // radians per second (base 50% faster)
        if (this.build === 'railgun') {
            this.spinSpeed *= 0.7; // 30% slower for railgun
        }
        
        this.maxHp = this.buildCfg.maxHp ?? MAX_HP;
        this.hp = this.maxHp;
        this.isEliminated = false;
        
        // Dash mechanics
        this.dashTimer = 0; // how long current dash has been active
        this.dashCooldown = 0; // time until next dash is available
        this.isDashing = false;
        
        // Shoot mechanics
        this.shootCooldown = 0;
        this.isHoldingShoot = false;
        this.shootHoldTime = 0;
        this._shootWasDown = false;

        // Special ability (starts on cooldown)
        this.specialCooldown = this.buildCfg.abilityStartsOnCooldown ? (this.buildCfg.abilityCooldown ?? SPECIAL_COOLDOWN) : 0;
        this.isSpecialFiring = false;
        this.specialFireTime = 0;
        this.specialBulletsFired = 0;

        // Railgun visuals / ability
        this.beamTimer = 0;
        this.beamDamage = 0;
        this.beamStartX = 0;
        this.beamStartY = 0;
        this.beamEndX = 0;
        this.beamEndY = 0;
        this.beamHasHit = false;
        this.boundaryZapTime = 0;

        // Swordsman
        this.swordAttackTime = 0;
        this.swordAbilityTime = 0;
        this.swordHitLock = 0;
        this.swordDamageOverride = null;
        this.swordAbilityDamageOverride = null;

        // Archer
        this.archerChargeTime = 0;
        this.archerStage = 0;
        this.archerNextBuff = false;
        this._specialWasDown = false;

        // Syringe pickup buff: multiplies next base attack damage
        this.nextAttackDamageMult = 1.0;
        this.hasSyringeBuff = false; // Track if syringe buff is active

        // Ninja-specific
        this.ninjaSlashTime = 0;
        this.ninjaSlashHitDealt = false;
        this.ninjaSlashBaseAngle = 0;
        this.ninjaStrikeFxTime = 0;
        this.ninjaStrikeFxX = 0;
        this.ninjaStrikeFxY = 0;
        this.ninjaStrikeFxAngle = 0;

        // Reaper-specific
        this.reaperAbilityTime = 0;
        this.reaperDebuffTime = 0;
        this.reaperDebuffDamageMult = 1.0;
        this.reaperDebuffSpeedMult = 1.0;
        this.reaperDebuffShootMult = 1.0;
        this.scytheHeld = this.build === 'reaper';
        this.hasScythe = this.build === 'reaper';

        // Shared status effects
        this.statusSlowTime = 0;
        this.statusSlowMult = 1.0;
        this.burnTime = 0;
        this.burnDamagePerSec = 0;
        this.pullTowardTime = 0;
        this.pullTowardStrength = 0;
        this.pullTargetId = null;

        // Shotgun
        this.hookVisualTime = 0;

        // Pyro
        this.pyroAmmo = PYRO_MAX_AMMO;
        this.pyroFiring = false;
        this.pyroTargetInsideCone = false;
        this.pyroTickTimer = 0;
        this.pyroIgniteTimer = 0;
        this.pyroWaveTime = 0;
        this.pyroWaveRadius = 0;
        this.pyroWaveHit = false;

        // Juggernaut
        this.juggernautPullTime = 0;
        this.juggernautInvulnTime = 0;
    }

    update(dt) {
        // Handle Cooldowns
        if (this.dashCooldown > 0) this.dashCooldown -= dt;
        if (this.shootCooldown > 0) this.shootCooldown -= dt;
        if (this.specialCooldown > 0) this.specialCooldown -= dt;
        if (this.reaperAbilityTime > 0) this.reaperAbilityTime -= dt;
        if (this.reaperDebuffTime > 0) this.reaperDebuffTime -= dt;
        if (this.statusSlowTime > 0) this.statusSlowTime -= dt;
        if (this.burnTime > 0) this.burnTime -= dt;
        if (this.pullTowardTime > 0) this.pullTowardTime -= dt;
        if (this.beamTimer > 0) this.beamTimer -= dt;
        if (this.boundaryZapTime > 0) this.boundaryZapTime -= dt;
        if (this.swordAttackTime > 0) this.swordAttackTime -= dt;
        if (this.swordAbilityTime > 0) this.swordAbilityTime -= dt;
        if (this.swordHitLock > 0) this.swordHitLock -= dt;
        if (this.hookVisualTime > 0) this.hookVisualTime -= dt;
        if (this.pyroWaveTime > 0) this.pyroWaveTime -= dt;
        if (this.juggernautPullTime > 0) this.juggernautPullTime -= dt;
        if (this.juggernautInvulnTime > 0) this.juggernautInvulnTime -= dt;
        if (this.ninjaStrikeFxTime > 0) this.ninjaStrikeFxTime -= dt;

        if (this.swordAttackTime <= 0) this.swordDamageOverride = null;
        if (this.swordAbilityTime <= 0) this.swordAbilityDamageOverride = null;
        if (this.statusSlowTime <= 0) this.statusSlowMult = 1.0;
        if (this.burnTime <= 0) this.burnDamagePerSec = 0;
        if (this.pullTowardTime <= 0) {
            this.pullTowardStrength = 0;
            this.pullTargetId = null;
        }

        // Handle Active Dash
        if (this.isDashing) {
            this.dashTimer -= dt;
            if (this.dashTimer <= 0) {
                this.isDashing = false;
            }
        }

        if (this.burnTime > 0) {
            this.takeDamage(this.burnDamagePerSec * dt);
        }
        if (this.pullTowardTime > 0 && this.pullTargetId) {
            const source = this.pullTargetId === 1 ? p1 : p2;
            if (source) {
                const distToSource = Math.hypot(this.x - source.x, this.y - source.y);
                if (distToSource <= BALL_RADIUS * 2 + 12) {
                    this.pullTowardTime = 0;
                    this.pullTowardStrength = 0;
                    releaseHookOnPlayer(this.id);
                }
                const pulled = movePointToward(this, source, this.pullTowardStrength * dt);
                this.x = pulled.x;
                this.y = pulled.y;
            }
        }

        // Input Handling
        const inputs = getPlayerInputs(this, dt);
        const shootDown = inputs.shootDown;
        const specialDown = inputs.specialDown;

        if (inputs.dashDown && this.dashCooldown <= 0 && !this.isDashing) {
            this.isDashing = true;
            this.dashTimer = 1.0;     // Lasts 1 second
            this.dashCooldown = 5.0;  // 5 second cooldown
        }

        // Build-specific attacks
        const shootCdMult = this.reaperDebuffTime > 0 ? this.reaperDebuffShootMult : 1;
        if (this.build === 'gunner') {
            // Shoot hold-to-fire: holding slows you; release or 1s auto-fires.
            if (!this.isHoldingShoot && shootDown && !this._shootWasDown && this.shootCooldown <= 0) {
                this.isHoldingShoot = true;
                this.shootHoldTime = 0;
            }

            if (this.isHoldingShoot) {
                this.shootHoldTime += dt;

                const shouldFire = (!shootDown && this._shootWasDown) || (this.shootHoldTime >= SHOOT_HOLD_MAX);
                if (shouldFire) {
                    this.fireGunnerBullet();
                    this.shootCooldown = this.buildCfg.shootCooldown * shootCdMult;
                    this.isHoldingShoot = false;
                    this.shootHoldTime = 0;
                }
            }
        } else if (this.build === 'railgun') {
            if (shootDown && !this._shootWasDown && this.shootCooldown <= 0) {
                this.fireRailgunBeam();
                this.shootCooldown = this.buildCfg.shootCooldown * shootCdMult;
            }
        } else if (this.build === 'swordsman') {
            if (shootDown && !this._shootWasDown && this.shootCooldown <= 0) {
                const mult = this.nextAttackDamageMult;
                this.nextAttackDamageMult = 1.0;
                this.swordDamageOverride = this.buildCfg.swordDamage * mult * (this.reaperAbilityTime > 0 ? 1.2 : 1);
                this.swordAttackTime = this.buildCfg.swordAttackDuration;
                this.shootCooldown = this.buildCfg.shootCooldown * shootCdMult;
            }
        } else if (this.build === 'archer') {
            if (shootDown && this.shootCooldown <= 0) {
                this.archerChargeTime += dt;
                const stage = Math.min(this.buildCfg.maxStages, Math.floor(this.archerChargeTime / this.buildCfg.chargeStageTime));
                this.archerStage = stage;
            }
            if (!shootDown && this._shootWasDown) {
                // release
                if (this.archerStage >= 1 && this.shootCooldown <= 0) {
                    this.fireArrow(this.archerStage);
                    this.shootCooldown = this.buildCfg.shootCooldown * shootCdMult;
                }
                this.archerChargeTime = 0;
                this.archerStage = 0;
            }
        } else if (this.build === 'ninja') {
            if (shootDown && !this._shootWasDown && this.shootCooldown <= 0) {
                this.fireNinjaStar();
                this.shootCooldown = this.buildCfg.shootCooldown * shootCdMult;
            }
        } else if (this.build === 'reaper') {
            if (shootDown && !this._shootWasDown && this.shootCooldown <= 0 && this.hasScythe) {
                this.fireScythe();
                this.hasScythe = false;
                const speedMult = this.reaperAbilityTime > 0 ? 1.2 : 1.0;
                this.shootCooldown = this.buildCfg.shootCooldown * shootCdMult / speedMult;
            }
        } else if (this.build === 'shotgun') {
            if (shootDown && !this._shootWasDown && this.shootCooldown <= 0) {
                this.fireShotgunBlast();
                this.shootCooldown = this.buildCfg.shootCooldown * shootCdMult;
            }
        } else if (this.build === 'pyro') {
            const canStartPyro = this.pyroAmmo >= PYRO_MIN_START_AMMO;
            const keepPyroFiring = this.pyroFiring && shootDown && this.pyroAmmo > 0;
            this.pyroFiring = keepPyroFiring || (!this.pyroFiring && shootDown && canStartPyro);
            if (this.pyroFiring) {
                this.pyroAmmo = Math.max(0, this.pyroAmmo - dt);
                this.pyroTickTimer += dt;
            } else {
                this.pyroAmmo = Math.min(PYRO_MAX_AMMO, this.pyroAmmo + dt * PYRO_AMMO_RECHARGE_PER_SEC);
                this.pyroTickTimer = 0;
                this.pyroIgniteTimer = 0;
            }

            const other = this.id === 1 ? p2 : p1;
            const inCone = !!(other && this.pyroFiring && isTargetInsideCone(
                this.x,
                this.y,
                this.spinAngle,
                this.buildCfg.flameRange,
                this.buildCfg.flameHalfAngle,
                other.x,
                other.y
            ));

            if (inCone && other && this.pyroTickTimer >= this.buildCfg.flameTickInterval) {
                const ticks = Math.floor(this.pyroTickTimer / this.buildCfg.flameTickInterval);
                this.pyroTickTimer -= ticks * this.buildCfg.flameTickInterval;
                const damage = this.buildCfg.flameTickDamage * ticks * this.nextAttackDamageMult;
                this.nextAttackDamageMult = 1.0;
                other.takeDamage(damage);
                screenShake.duration = Math.max(screenShake.duration, 0.018);
                screenShake.intensity = Math.max(screenShake.intensity, 0.45);
            }
            if (inCone && other) {
                this.pyroIgniteTimer += dt;
            }
            if (!inCone && this.pyroTargetInsideCone && other) {
                if (this.pyroIgniteTimer >= PYRO_IGNITE_DELAY) {
                    other.applyBurn(this.buildCfg.burnDuration, this.buildCfg.burnDamagePerSec);
                }
                this.pyroIgniteTimer = 0;
            }
            this.pyroTargetInsideCone = inCone;
        } else if (this.build === 'necromancer') {
            if (shootDown && !this._shootWasDown && this.shootCooldown <= 0) {
                this.fireNecroOrb(false);
                this.shootCooldown = this.buildCfg.shootCooldown * shootCdMult;
            }
        } else if (this.build === 'juggernaut') {
            if (shootDown && !this._shootWasDown && this.shootCooldown <= 0) {
                this.juggernautPullTime = this.buildCfg.gravityDuration;
                this.shootCooldown = this.buildCfg.shootCooldown * shootCdMult;
            }
        }

        // Ability per build (edge-triggered)
        if (specialDown && !this._specialWasDown && this.specialCooldown <= 0) {
            if (this.build === 'gunner') {
                this.isSpecialFiring = true;
                this.specialFireTime = 0;
                this.specialBulletsFired = 0;
                this.specialCooldown = this.buildCfg.abilityCooldown;
            } else if (this.build === 'railgun') {
                this.boundaryZapTime = this.buildCfg.abilityDuration;
                this.specialCooldown = this.buildCfg.abilityCooldown;
            } else if (this.build === 'swordsman') {
                const mult = this.nextAttackDamageMult;
                this.nextAttackDamageMult = 1.0;
                this.swordAbilityDamageOverride = this.buildCfg.swordAbilityDamage * mult;
                this.swordAbilityTime = 1.5; // quick burst window
                this.specialCooldown = this.buildCfg.abilityCooldown;
            } else if (this.build === 'archer') {
                this.archerNextBuff = true;
                this.specialCooldown = this.buildCfg.abilityCooldown;
            } else if (this.build === 'ninja') {
                const other = this.id === 1 ? p2 : p1;
                if (other) {
                    const angleToOther = Math.atan2(other.y - this.y, other.x - this.x);
                    const behindAngle = angleToOther + Math.PI;
                    const distFromOther = BALL_RADIUS + 16;
                    const targetX = other.x + Math.cos(behindAngle) * distFromOther;
                    const targetY = other.y + Math.sin(behindAngle) * distFromOther;
                    const prevX = this.x;
                    const prevY = this.y;
                    spawnSmokePoof(prevX, prevY);
                    this.x = targetX;
                    this.y = targetY;
                    this.spinAngle = Math.atan2(other.y - this.y, other.x - this.x);
                    if (this.isBot && this.botDifficulty !== 'easy') {
                        this.botState.forcePrimaryAfterSpecial = true;
                        this.botState.forcePrimaryTimer = 0.45;
                    }
                }
                this.specialCooldown = this.buildCfg.abilityCooldown;
            } else if (this.build === 'reaper') {
                const other = this.id === 1 ? p2 : p1;
                if (other) {
                    other.reaperDebuffTime = 5.0;
                    other.reaperDebuffDamageMult = 0.7;
                    other.reaperDebuffSpeedMult = 0.5;
                    other.reaperDebuffShootMult = 1.3;
                }
                this.reaperAbilityTime = 5.0;
                this.specialCooldown = this.buildCfg.abilityCooldown;
            } else if (this.build === 'shotgun') {
                this.fireHook();
                this.specialCooldown = this.buildCfg.abilityCooldown;
            } else if (this.build === 'pyro') {
                this.firePyroWave();
                this.specialCooldown = this.buildCfg.abilityCooldown;
            } else if (this.build === 'necromancer') {
                this.spawnNecroClones();
                this.specialCooldown = this.buildCfg.abilityCooldown;
            } else if (this.build === 'juggernaut') {
                this.juggernautInvulnTime = this.buildCfg.invulnDuration;
                this.specialCooldown = this.buildCfg.abilityCooldown;
            }
        }

        this._specialWasDown = specialDown;

        this._shootWasDown = shootDown;

        // Movement
        const specialMult = (this.build === 'gunner' && this.isSpecialFiring) ? 0.5 : 1; // only gunner has movement slow during its ability
        const holdMult = (this.build === 'gunner' && this.isHoldingShoot && this.shootHoldTime >= HOLD_SLOW_DELAY) ? HOLD_SLOW_MULT : 1;
        const chargeMult = holdMult * specialMult;
        const buildMoveMult = this.build === 'swordsman'
            ? 1.3
            : (this.build === 'juggernaut' ? (this.buildCfg.speedMult ?? 1) : 1);
        const moveBase = BALL_BASE_SPEED * buildMoveMult;
        let speedMult = 1;
        if (this.reaperAbilityTime > 0) speedMult *= 1.3;
        if (this.reaperDebuffTime > 0) speedMult *= this.reaperDebuffSpeedMult;
        if (this.statusSlowTime > 0) speedMult *= this.statusSlowMult;
        if (this.build === 'juggernaut' && this.juggernautInvulnTime > 0) speedMult = 0;
        const speed = (this.isDashing ? moveBase * DASH_MULT : moveBase) * chargeMult * speedMult;
        this.x += this.dirX * speed * dt;
        this.y += this.dirY * speed * dt;

        if (this.build === 'juggernaut' && this.juggernautPullTime > 0) {
            const other = this.id === 1 ? p2 : p1;
            if (other) {
                const dist = Math.hypot(other.x - this.x, other.y - this.y);
                if (dist <= this.buildCfg.gravityRadius) {
                    const pulled = movePointToward(other, this, this.buildCfg.gravityPullStrength * dt);
                    other.x = pulled.x;
                    other.y = pulled.y;
                }
            }
        }

        if (this.build === 'pyro' && this.pyroWaveTime > 0) {
            this.pyroWaveRadius = Math.min(this.buildCfg.waveMaxRadius, this.pyroWaveRadius + this.buildCfg.waveSpeed * dt);
            const other = this.id === 1 ? p2 : p1;
            if (other && !this.pyroWaveHit) {
                const distToOther = Math.hypot(other.x - this.x, other.y - this.y);
                if (distToOther <= this.pyroWaveRadius + BALL_RADIUS) {
                    other.takeDamage(this.buildCfg.waveDamage);
                    other.applyBurn(this.buildCfg.waveBurnDuration, PYRO_BURN_DAMAGE_PER_SEC);
                    const dx = other.x - this.x;
                    const dy = other.y - this.y;
                    const len = Math.hypot(dx, dy) || 1;
                    other.x += (dx / len) * 45;
                    other.y += (dy / len) * 45;
                    screenShake = { x: 0, y: 0, duration: 0.12, intensity: 8 };
                    spawnImpact(other.x, other.y, '#fb923c');
                    this.pyroWaveHit = true;
                }
            }
            if (this.pyroWaveTime <= 0) this.pyroWaveRadius = 0;
        }

        // Spin (freeze aim rotation during ninja slash so sweep/hitbox stay stable)
        let spinMult = 1;
        if (this.build === 'swordsman') {
            if (this.swordAbilityTime > 0) spinMult = this.buildCfg.swordAbilitySpinMult;
            else if (this.swordAttackTime > 0) spinMult = this.buildCfg.swordSpinMult;
        }
        if (this.build === 'pyro' && this.pyroFiring) {
            spinMult *= 0.5;
        }
        if (!(this.build === 'ninja' && this.ninjaSlashTime > 0)) {
            this.spinAngle += (this.spinSpeed * chargeMult * spinMult) * dt;
        }

        // Ninja slash (after star hit): damage once when enemy is in the sweeping arc
        if (this.build === 'ninja' && this.ninjaSlashTime > 0) {
            this.ninjaSlashTime -= dt;
            if (this.ninjaSlashTime <= 0) this.ninjaSlashHitDealt = false;
            const other = this.id === 1 ? p2 : p1;
            if (other && !this.ninjaSlashHitDealt && this.ninjaSlashTime > 0) {
                const slashProgress = 1 - (this.ninjaSlashTime / NINJA_SLASH_DURATION);
                const slashLen = this.buildCfg.katanaRange * 1.5;
                const base = this.ninjaSlashBaseAngle;
                const startAngle = base - 0.5;
                const angleToEnemy = Math.atan2(other.y - this.y, other.x - this.x);
                let rel = angleToEnemy - startAngle;
                while (rel > Math.PI) rel -= Math.PI * 2;
                while (rel < -Math.PI) rel += Math.PI * 2;
                const distToEnemy = Math.hypot(other.x - this.x, other.y - this.y);
                const margin = 0.65;
                const inSweep = rel >= -margin && rel <= 2 * slashProgress + margin;
                const inRange = distToEnemy <= slashLen + BALL_RADIUS * 0.95;
                if (inRange && inSweep) {
                    other.takeDamage(this.buildCfg.slashDamage);
                    spawnImpact(other.x, other.y, '#f8fafc');
                    this.ninjaStrikeFxTime = 0.14;
                    this.ninjaStrikeFxX = other.x;
                    this.ninjaStrikeFxY = other.y;
                    this.ninjaStrikeFxAngle = angleToEnemy;
                    for (let i = 0; i < 14; i++) {
                        const slashAngle = angleToEnemy + (Math.random() - 0.5) * 0.5;
                        const speed = 120 + Math.random() * 220;
                        const life = 0.12 + Math.random() * 0.12;
                        particles.push(new Particle(other.x, other.y, Math.cos(slashAngle), Math.sin(slashAngle), '#f8fafc', speed, life));
                    }
                    this.ninjaSlashHitDealt = true;
                    // Do not zero ninjaSlashTime — let the slash animation play out
                }
            }
        }

        // Gunner ability firing stream
        if (this.build === 'gunner' && this.isSpecialFiring) {
            this.specialFireTime += dt;
            const shouldHaveFired = Math.min(
                SPECIAL_BULLETS,
                Math.floor((this.specialFireTime / SPECIAL_DURATION) * SPECIAL_BULLETS)
            );

            while (this.specialBulletsFired < shouldHaveFired) {
                this.fireSpecialPellet();
                this.specialBulletsFired++;
            }

            if (this.specialFireTime >= SPECIAL_DURATION || this.specialBulletsFired >= SPECIAL_BULLETS) {
                this.isSpecialFiring = false;
            }
        }

        // Railgun beam persistent hit detection while beam is visible
        if (this.build === 'railgun' && this.beamTimer > 0) {
            const other = this.id === 1 ? p2 : p1;
            if (other && !this.beamHasHit) {
                // Recompute live beam segment from current position & aim so hitbox follows the beam
                const gx = Math.cos(this.spinAngle);
                const gy = Math.sin(this.spinAngle);
                const t = rayCircleExitT(this.x, this.y, gx, gy, CENTER_X, CENTER_Y, ARENA_RADIUS - 2);
                const sx = this.x;
                const sy = this.y;
                const ex = this.x + gx * t;
                const ey = this.y + gy * t;

                if (segmentHitsCircle(sx, sy, ex, ey, other.x, other.y, BALL_RADIUS)) {
                    other.takeDamage(this.beamDamage);
                    spawnImpact(other.x, other.y, this.buildCfg.beamColor);
                    this.beamHasHit = true;
                }
            }

            summons.forEach(s => {
                if (!s.active || s.ownerId === this.id) return;
                const gx = Math.cos(this.spinAngle);
                const gy = Math.sin(this.spinAngle);
                const t = rayCircleExitT(this.x, this.y, gx, gy, CENTER_X, CENTER_Y, ARENA_RADIUS - 2);
                const sx = this.x;
                const sy = this.y;
                const ex = this.x + gx * t;
                const ey = this.y + gy * t;
                if (segmentHitsCircle(sx, sy, ex, ey, s.x, s.y, s.radius)) {
                    s.hit();
                    spawnImpact(s.x, s.y, this.buildCfg.beamColor);
                }
            });
        }

        // Wall Collision
        const distToCenter = Math.hypot(this.x - CENTER_X, this.y - CENTER_Y);
        if (distToCenter + BALL_RADIUS >= ARENA_RADIUS) {
            // Normal vector pointing to center
            const nx = (CENTER_X - this.x) / distToCenter;
            const ny = (CENTER_Y - this.y) / distToCenter;

            // Reflect velocity: V' = V - 2(V.N)N
            const dot = this.dirX * nx + this.dirY * ny;
            
            // Only reflect if moving away from center
            if (dot < 0) { 
                this.dirX = this.dirX - 2 * dot * nx;
                this.dirY = this.dirY - 2 * dot * ny;
                
                // Add a small random angle to break repetitive trajectories
                const randomAngle = (Math.random() - 0.5) * 0.4; // +/- 0.2 radians
                const currentAngle = Math.atan2(this.dirY, this.dirX);
                const newAngle = currentAngle + randomAngle;
                
                this.dirX = Math.cos(newAngle);
                this.dirY = Math.sin(newAngle);
                
                // Bias rebounds inward so players do not get trapped orbiting the wall.
                const inwardBiased = biasDirectionInward(this.dirX, this.dirY, nx, ny, 0.1);
                this.dirX = inwardBiased.x;
                this.dirY = inwardBiased.y;

                // Railgun ability: if opponent has boundary zap active, bouncing damages you
                const other = this.id === 1 ? p2 : p1;
                if (other && other.build === 'railgun' && other.boundaryZapTime > 0) {
                    this.takeDamage(other.buildCfg.boundaryDamage);
                    // Extra screen shake when railgun boundary ability hits
                    screenShake = { x: 0, y: 0, duration: 0.18, intensity: 16 };
                }
            }

            // Keep within bounds
            const pushIn = (distToCenter + BALL_RADIUS) - ARENA_RADIUS;
            this.x += nx * pushIn;
            this.y += ny * pushIn;
        }
        
        this.updateUI();
    }

    fireGunnerBullet() {
        const gx = Math.cos(this.spinAngle);
        const gy = Math.sin(this.spinAngle);
        const bx = this.x + gx * (BALL_RADIUS + 5);
        const by = this.y + gy * (BALL_RADIUS + 5);
        const mult = this.nextAttackDamageMult;
        this.nextAttackDamageMult = 1.0;
        bullets.push(new Bullet(this.id, bx, by, gx, gy, this.color, { damage: 100 * mult }));
        this.spinSpeed *= -1; // reverse spin direction on shot
    }

    fireRailgunBeam() {
        const gx = Math.cos(this.spinAngle);
        const gy = Math.sin(this.spinAngle);

        const mult = this.nextAttackDamageMult;
        this.nextAttackDamageMult = 1.0;
        this.beamDamage = this.buildCfg.shootDamage * mult;

        const t = rayCircleExitT(this.x, this.y, gx, gy, CENTER_X, CENTER_Y, ARENA_RADIUS - 2);
        const endX = this.x + gx * t;
        const endY = this.y + gy * t;

        // store beam segment for persistent hit detection
        this.beamStartX = this.x;
        this.beamStartY = this.y;
        this.beamEndX = endX;
        this.beamEndY = endY;
        this.beamHasHit = false;

        this.beamTimer = 0.32 * 0.8; // 20% shorter beam duration
    }

    fireArrow(stage) {
        const cfg = this.buildCfg;
        const gx = Math.cos(this.spinAngle);
        const gy = Math.sin(this.spinAngle);
        const bx = this.x + gx * (BALL_RADIUS + 5);
        const by = this.y + gy * (BALL_RADIUS + 5);

        let damage = stage * cfg.baseDamagePerStage;
        let scale = 1.0;
        let maxBounces = 0;
        if (this.archerNextBuff) {
            this.archerNextBuff = false;
            damage = Math.round(damage * cfg.abilityDamageMult);
            scale = cfg.abilityScaleMult;
            maxBounces = cfg.abilityBounces;
        }

        // Syringe pickup: next base attack does extra damage
        const mult = this.nextAttackDamageMult;
        this.nextAttackDamageMult = 1.0;
        damage = Math.round(damage * mult);

        bullets.push(new Bullet(this.id, bx, by, gx, gy, this.color, {
            damage,
            type: 'arrow',
            speed: BULLET_SPEED * cfg.arrowSpeedMult,
            radius: BULLET_RADIUS * scale,
            maxBounces,
            scale
        }));
    }

    fireNinjaStar() {
        const gx = Math.cos(this.spinAngle);
        const gy = Math.sin(this.spinAngle);
        const bx = this.x + gx * (BALL_RADIUS + 6);
        const by = this.y + gy * (BALL_RADIUS + 6);
        const speed = BULLET_SPEED * BUILDS.archer.arrowSpeedMult;
        const mult = this.nextAttackDamageMult;
        this.nextAttackDamageMult = 1.0;
        bullets.push(new Bullet(this.id, bx, by, gx, gy, this.color, {
            damage: Math.round(this.buildCfg.starDamage * mult),
            type: 'ninjastar',
            speed,
            radius: BULLET_RADIUS * 1.1,
            isNinjaStar: true,
        }));
    }

    fireScythe() {
        const gx = Math.cos(this.spinAngle);
        const gy = Math.sin(this.spinAngle);
        const bx = this.x + gx * (BALL_RADIUS + 6);
        const by = this.y + gy * (BALL_RADIUS + 6);
        const speed = BULLET_SPEED * (this.reaperAbilityTime > 0 ? 1.2 : 1) * this.buildCfg.scytheSpeedMult;
        const mult = this.nextAttackDamageMult;
        this.nextAttackDamageMult = 1.0;
        bullets.push(new Bullet(this.id, bx, by, gx, gy, this.color, {
            damage: Math.round(this.buildCfg.scytheDamage * mult),
            type: 'scythe',
            speed,
            radius: BULLET_RADIUS * 1.3,
            maxBounces: 0,
            isScythe: true,
            returning: false,
            lastHitTimes: {1: 0, 2: 0},
            createdTime: performance.now(),
        }));
    }

    fireShotgunBlast() {
        const count = this.buildCfg.pelletCount;
        const spread = this.buildCfg.pelletSpreadDeg * Math.PI / 180;
        const mult = this.nextAttackDamageMult;
        this.nextAttackDamageMult = 1.0;
        for (let i = 0; i < count; i++) {
            const t = count === 1 ? 0.5 : i / (count - 1);
            const a = this.spinAngle + (t - 0.5) * spread + (Math.random() - 0.5) * 0.08;
            const gx = Math.cos(a);
            const gy = Math.sin(a);
            const bx = this.x + gx * (BALL_RADIUS + 6);
            const by = this.y + gy * (BALL_RADIUS + 6);
            bullets.push(new Bullet(this.id, bx, by, gx, gy, this.color, {
                type: 'shotgun',
                damage: Math.round(this.buildCfg.pelletDamage * mult),
                speed: BULLET_SPEED * 0.95,
                radius: BULLET_RADIUS * 0.9,
                maxDistance: this.buildCfg.pelletRange,
                minDamageMult: this.buildCfg.pelletMinDamageMult,
            }));
        }
    }

    fireHook() {
        const gx = Math.cos(this.spinAngle);
        const gy = Math.sin(this.spinAngle);
        const bx = this.x + gx * (BALL_RADIUS + 6);
        const by = this.y + gy * (BALL_RADIUS + 6);
        this.hookVisualTime = 0.2;
        bullets.push(new Bullet(this.id, bx, by, gx, gy, this.color, {
            type: 'hook',
            damage: this.buildCfg.hookDamage,
            speed: BULLET_SPEED * 0.8,
            radius: BULLET_RADIUS * 4.5,
            maxDistance: ARENA_RADIUS * 1.2,
            returning: false,
            pullStrength: this.buildCfg.hookPullStrength,
            returnSpeed: this.buildCfg.hookReturnSpeed,
            hookedTargetId: null,
            hookHasDamaged: false,
        }));
    }

    firePyroWave() {
        this.pyroWaveTime = this.buildCfg.waveMaxRadius / this.buildCfg.waveSpeed;
        this.pyroWaveRadius = 0;
        this.pyroWaveHit = false;
    }

    fireNecroOrb(fromClone = false, x = this.x, y = this.y, angle = this.spinAngle) {
        const gx = Math.cos(angle);
        const gy = Math.sin(angle);
        const bx = x + gx * (BALL_RADIUS + 5);
        const by = y + gy * (BALL_RADIUS + 5);
        const mult = fromClone ? 1.0 : this.nextAttackDamageMult;
        if (!fromClone) this.nextAttackDamageMult = 1.0;
        bullets.push(new Bullet(this.id, bx, by, gx, gy, this.color, {
            type: 'necroorb',
            damage: fromClone ? 50 : Math.round(this.buildCfg.orbDamage * mult),
            speed: BULLET_SPEED * this.buildCfg.orbSpeedMult,
            radius: BULLET_RADIUS * 1.5,
            trackTargetId: this.id === 1 ? 2 : 1,
            turnRate: this.buildCfg.orbTurnRate,
            fromClone,
            maxDistance: ARENA_RADIUS * 2,
        }));
    }

    spawnNecroClones() {
        for (let i = 0; i < this.buildCfg.cloneCount; i++) {
            const side = i === 0 ? -1 : 1;
            summons.push(new Clone(this.id, this.x + side * 58, this.y + 36, this.color));
        }
    }

    fireSpecialPellet() {
        const spread = (Math.random() * 2 - 1) * (SPECIAL_SPREAD_DEG * Math.PI / 180);
        const a = this.spinAngle + spread;
        const gx = Math.cos(a);
        const gy = Math.sin(a);

        const bx = this.x + gx * (BALL_RADIUS + 5);
        const by = this.y + gy * (BALL_RADIUS + 5);

        bullets.push(new Bullet(this.id, bx, by, gx, gy, this.color, { damage: SPECIAL_DAMAGE }));
    }

    takeDamage(amount) {
        if (this.build === 'juggernaut' && this.juggernautInvulnTime > 0) return;
        const effectiveAmount = amount * (this.reaperDebuffTime > 0 ? this.reaperDebuffDamageMult : 1);
        this.hp = Math.max(0, this.hp - effectiveAmount);
        this.updateUI();
        if (this.hp <= 0 && !gameOver) {
            this.isEliminated = true;
            spawnDeathExplosion(this.x, this.y, this.color);
            gameOver = true;
            roundEndActive = true;
            if (koRevealTimeout) {
                clearTimeout(koRevealTimeout);
                koRevealTimeout = null;
            }
            koRevealTimeout = setTimeout(() => {
                endGame(this.id === 1 ? 2 : 1);
                koRevealTimeout = null;
            }, 1000);
        }
    }

    applyBurn(duration, damagePerSec) {
        this.burnTime = duration;
        this.burnDamagePerSec = damagePerSec;
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
        this.updateUI();
    }

    draw(ctx) {
        if (this.isEliminated) return;
        // Rainbow smear effect if dashing
        if (this.isDashing) {
            // Draw 5 trailing smear frames, fading out and cycling colors
            for (let i = 1; i <= 5; i++) {
                const trailX = this.x - this.dirX * BALL_RADIUS * 0.8 * i;
                const trailY = this.y - this.dirY * BALL_RADIUS * 0.8 * i;
                
                // Get a rainbow hue based on time and loop position
                const hue = (performance.now() / 5 + i * 20) % 360;
                
                ctx.beginPath();
                ctx.arc(trailX, trailY, BALL_RADIUS * (1 - i * 0.1), 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${0.4 - i * 0.05})`; // Fade out
                ctx.fill();
            }
        }

        // Syringe active glow ring
        if (this.nextAttackDamageMult > 1) {
            const pulse = 2 + Math.sin(performance.now() * 0.02) * 1.2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, BALL_RADIUS + 9 + pulse, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 165, 0, 0.15)';
            ctx.shadowColor = '#f97316';
            ctx.shadowBlur = 14;
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Body
        ctx.beginPath();
        ctx.arc(this.x, this.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x, this.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner spin indicator
        ctx.beginPath();
        ctx.arc(this.x, this.y, BALL_RADIUS * 0.5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.stroke();

        // Weapon visuals
        const gLen = BALL_RADIUS * 1.5;
        const gWidth = 8;

        if (this.build === 'gunner') {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.spinAngle);
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(0, -gWidth/2, gLen, gWidth);
            ctx.strokeRect(0, -gWidth/2, gLen, gWidth);
            ctx.restore();

            // Aiming Line (transparent dotted)
            const tipX = this.x + Math.cos(this.spinAngle) * gLen;
            const tipY = this.y + Math.sin(this.spinAngle) * gLen;
            ctx.beginPath();
            ctx.moveTo(tipX, tipY);
            ctx.lineTo(this.x + Math.cos(this.spinAngle) * ARENA_RADIUS * 2, this.y + Math.sin(this.spinAngle) * ARENA_RADIUS * 2);
            ctx.strokeStyle = this.color + '66';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 15]);
            ctx.stroke();
            ctx.setLineDash([]);
        } else if (this.build === 'railgun') {
            // railgun barrel with front muzzle
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.spinAngle);
            const bodyLen = gLen * 1.1;
            ctx.fillStyle = '#e5e7eb';
            ctx.fillRect(0, -gWidth/2, bodyLen, gWidth);
            ctx.strokeStyle = this.buildCfg.beamColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(0, -gWidth/2, bodyLen, gWidth);
            // front muzzle ring
            ctx.beginPath();
            ctx.arc(bodyLen, 0, gWidth * 0.85, -Math.PI/2, Math.PI/2);
            ctx.stroke();
            ctx.restore();

            // dotted aiming line
            const tipX = this.x + Math.cos(this.spinAngle) * (gLen * 1.2);
            const tipY = this.y + Math.sin(this.spinAngle) * (gLen * 1.2);
            ctx.beginPath();
            ctx.moveTo(tipX, tipY);
            ctx.lineTo(this.x + Math.cos(this.spinAngle) * ARENA_RADIUS * 2, this.y + Math.sin(this.spinAngle) * ARENA_RADIUS * 2);
            ctx.strokeStyle = this.buildCfg.beamColor + '88';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 15]);
            ctx.stroke();
            ctx.setLineDash([]);

            // beam flash (wider, longer)
            if (this.beamTimer > 0) {
                const gx = Math.cos(this.spinAngle);
                const gy = Math.sin(this.spinAngle);
                const t = rayCircleExitT(this.x, this.y, gx, gy, CENTER_X, CENTER_Y, ARENA_RADIUS - 2);
                const endX = this.x + gx * t;
                const endY = this.y + gy * t;
                ctx.save();
                ctx.strokeStyle = this.buildCfg.beamColor;
                ctx.globalAlpha = Math.min(1, this.beamTimer / 0.08);
                ctx.lineWidth = 12;
                ctx.shadowColor = this.buildCfg.beamColor;
                ctx.shadowBlur = 16;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(endX, endY);
                ctx.stroke();
                ctx.restore();
            }
        } else if (this.build === 'swordsman') {
            // sword model: hilt + guard + blade (slightly scaled above original)
            const scale = 1.925; // 10% larger than 1.75
            const bladeLen = 46 * scale;
            const bladeW = 6 * scale;
            const guardW = 16 * scale;
            const guardH = 4 * scale;
            const handleLen = 10 * scale;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.spinAngle);
            // blade
            ctx.fillStyle = '#e5e7eb';
            ctx.beginPath();
            ctx.moveTo(0, -bladeW/2);
            ctx.lineTo(bladeLen - 4, -bladeW/2);
            ctx.lineTo(bladeLen, 0);         // tip
            ctx.lineTo(bladeLen - 4, bladeW/2);
            ctx.lineTo(0, bladeW/2);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.4;
            ctx.stroke();
            // guard
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(-guardW/2, -guardH/2, guardW, guardH);
            // handle
            ctx.fillStyle = '#020617';
            ctx.fillRect(-handleLen, -2, handleLen, 4);
            ctx.restore();
        } else if (this.build === 'archer') {
            const pull = Math.min(1, this.archerChargeTime / this.buildCfg.chargeStageTime);
            const bowX = this.x;
            const bowY = this.y;
            const bowRadius = 22;
            const bowOffset = 14;
            const stringPull = 10 * pull;

            // bow (slightly bigger, layered)
            ctx.save();
            ctx.translate(bowX, bowY);
            ctx.rotate(this.spinAngle);

            // main bow curve
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.arc(bowOffset, 0, bowRadius, -Math.PI/2, Math.PI/2);
            ctx.stroke();
            // inner accent curve
            ctx.strokeStyle = 'rgba(148,163,184,0.92)';
            ctx.lineWidth = 2.3;
            ctx.beginPath();
            ctx.arc(bowOffset, 0, bowRadius - 5, -Math.PI/2, Math.PI/2);
            ctx.stroke();

            // string with pull
            ctx.strokeStyle = 'rgba(248,250,252,0.9)';
            ctx.lineWidth = 1.8;
            const topY = -bowRadius;
            const botY = bowRadius;
            const centerX = bowOffset - stringPull;
            ctx.beginPath();
            ctx.moveTo(bowOffset, topY + 2);
            ctx.lineTo(centerX, 0);
            ctx.lineTo(bowOffset, botY - 2);
            ctx.stroke();

            // arrow on bow when charging
            if (pull > 0) {
                const arrowLen = 26;
                const arrowBack = -8;
                ctx.strokeStyle = '#f8fafc';
                ctx.lineWidth = 2.2;
                ctx.beginPath();
                ctx.moveTo(centerX, 0);
                ctx.lineTo(centerX + arrowLen, 0);
                ctx.stroke();
                // arrowhead
                ctx.fillStyle = '#f8fafc';
                ctx.beginPath();
                ctx.moveTo(centerX + arrowLen + 6, 0);
                ctx.lineTo(centerX + arrowLen - 2, -4);
                ctx.lineTo(centerX + arrowLen - 2, 4);
                ctx.closePath();
                ctx.fill();
                // fletching
                ctx.strokeStyle = '#fbbf24';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(centerX + arrowBack, -3);
                ctx.lineTo(centerX + arrowBack - 5, -6);
                ctx.moveTo(centerX + arrowBack, 3);
                ctx.lineTo(centerX + arrowBack - 5, 6);
                ctx.stroke();
            }

            ctx.restore();

            // aiming dotted line for archer
            const tipX = this.x + Math.cos(this.spinAngle) * (BALL_RADIUS * 1.6);
            const tipY = this.y + Math.sin(this.spinAngle) * (BALL_RADIUS * 1.6);
            ctx.beginPath();
            ctx.moveTo(tipX, tipY);
            ctx.lineTo(this.x + Math.cos(this.spinAngle) * ARENA_RADIUS * 2, this.y + Math.sin(this.spinAngle) * ARENA_RADIUS * 2);
            ctx.strokeStyle = this.color + '66';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 15]);
            ctx.stroke();
            ctx.setLineDash([]);

            // charge cubes above character
            if (this.archerChargeTime > 0) {
                const cubes = this.buildCfg.maxStages;
                const filled = this.archerStage;
                const cubeSize = 6;
                const gap = 4;
                const totalW = cubes * cubeSize + (cubes - 1) * gap;
                const startX = this.x - totalW / 2;
                const y = this.y - BALL_RADIUS - 18;
                for (let i = 0; i < cubes; i++) {
                    const alpha = i < filled ? 0.95 : 0.18;
                    ctx.fillStyle = `rgba(226,232,240,${alpha})`;
                    ctx.fillRect(startX + i * (cubeSize + gap), y, cubeSize, cubeSize);
                }
            }
        } else if (this.build === 'ninja') {
            const bladeLen = 48;
            const bW = 4.2;
            const kiss = 11;
            const drawBladePath = (guardInnerX) => {
                ctx.beginPath();
                ctx.moveTo(guardInnerX, -bW / 2);
                ctx.lineTo(-(bladeLen - kiss), -bW / 2);
                ctx.lineTo(-bladeLen, 0);
                ctx.lineTo(-(bladeLen - kiss), bW / 2);
                ctx.lineTo(guardInnerX, bW / 2);
                ctx.closePath();
            };
            const drawKatanaIdle = () => {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.spinAngle);
                ctx.translate(0, -BALL_RADIUS * 0.9);
                ctx.translate(BALL_RADIUS * 0.38, 0);
                ctx.fillStyle = '#e2e8f0';
                drawBladePath(2);
                ctx.fill();
                drawBladePath(2);
                ctx.strokeStyle = 'rgba(255,255,255,0.9)';
                ctx.lineWidth = 1.2;
                ctx.stroke();
                ctx.strokeStyle = 'rgba(30,41,59,0.45)';
                ctx.lineWidth = 0.9;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(-(bladeLen - kiss - 1), 0);
                ctx.stroke();
                ctx.strokeStyle = 'rgba(255,255,255,0.6)';
                ctx.lineWidth = 0.85;
                ctx.beginPath();
                ctx.moveTo(1, -bW / 2 + 0.5);
                ctx.lineTo(-(bladeLen - kiss - 2), -bW / 2 + 0.9);
                ctx.stroke();
                ctx.fillStyle = '#92400e';
                ctx.fillRect(-0.5, -3, 3.5, 6);
                ctx.fillStyle = '#0f172a';
                ctx.strokeStyle = '#64748b';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.ellipse(2.2, 0, 6.2, 4.8, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = '#111827';
                ctx.fillRect(2, -2.9, 15, 5.8);
                ctx.strokeStyle = 'rgba(55,65,81,0.95)';
                ctx.lineWidth = 0.8;
                for (let i = 0; i < 5; i++) {
                    const t = 4 + i * 2.6;
                    ctx.beginPath();
                    ctx.moveTo(t, -2.4);
                    ctx.lineTo(t + 1.4, 0);
                    ctx.lineTo(t, 2.4);
                    ctx.stroke();
                }
                ctx.fillStyle = '#020617';
                ctx.beginPath();
                ctx.arc(16.8, 0, 2.7, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(148,163,184,0.55)';
                ctx.lineWidth = 0.75;
                ctx.stroke();
                ctx.restore();
            };
            const drawKatanaSlash = (slashAngle) => {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(slashAngle);
                ctx.translate(BALL_RADIUS * 0.24, 0);
                ctx.fillStyle = '#e2e8f0';
                ctx.beginPath();
                ctx.moveTo(0, -bW / 2);
                ctx.lineTo(bladeLen - kiss, -bW / 2);
                ctx.lineTo(bladeLen, 0);
                ctx.lineTo(bladeLen - kiss, bW / 2);
                ctx.lineTo(0, bW / 2);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(0, -bW / 2);
                ctx.lineTo(bladeLen - kiss, -bW / 2);
                ctx.lineTo(bladeLen, 0);
                ctx.lineTo(bladeLen - kiss, bW / 2);
                ctx.lineTo(0, bW / 2);
                ctx.closePath();
                ctx.strokeStyle = 'rgba(255,255,255,0.9)';
                ctx.lineWidth = 1.2;
                ctx.stroke();
                ctx.strokeStyle = 'rgba(30,41,59,0.45)';
                ctx.lineWidth = 0.9;
                ctx.beginPath();
                ctx.moveTo(1, 0);
                ctx.lineTo(bladeLen - kiss - 1, 0);
                ctx.stroke();
                ctx.strokeStyle = 'rgba(255,255,255,0.6)';
                ctx.lineWidth = 0.85;
                ctx.beginPath();
                ctx.moveTo(0, -bW / 2 + 0.5);
                ctx.lineTo(bladeLen - kiss - 2, -bW / 2 + 0.9);
                ctx.stroke();
                ctx.fillStyle = '#92400e';
                ctx.fillRect(-3.5, -3, 4, 6);
                ctx.fillStyle = '#0f172a';
                ctx.strokeStyle = '#64748b';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.ellipse(0, 0, 6.2, 4.8, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = '#111827';
                ctx.fillRect(-16, -2.9, 16, 5.8);
                ctx.strokeStyle = 'rgba(55,65,81,0.95)';
                ctx.lineWidth = 0.8;
                for (let i = 0; i < 5; i++) {
                    const t = -14 + i * 2.7;
                    ctx.beginPath();
                    ctx.moveTo(t, -2.4);
                    ctx.lineTo(t + 1.4, 0);
                    ctx.lineTo(t, 2.4);
                    ctx.stroke();
                }
                ctx.fillStyle = '#020617';
                ctx.beginPath();
                ctx.arc(-17.4, 0, 2.7, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(148,163,184,0.55)';
                ctx.lineWidth = 0.75;
                ctx.stroke();
                ctx.restore();
            };

            if (this.ninjaSlashTime > 0) {
                const slashProgress = 1 - (this.ninjaSlashTime / NINJA_SLASH_DURATION);
                const base = this.ninjaSlashBaseAngle;
                const slashAngle = base - 0.5 + 2 * slashProgress;
                drawKatanaSlash(slashAngle);
            } else {
                drawKatanaIdle();
            }

            // ninja aiming dotted line
            const aimX = this.x + Math.cos(this.spinAngle) * (BALL_RADIUS * 1.6);
            const aimY = this.y + Math.sin(this.spinAngle) * (BALL_RADIUS * 1.6);
            ctx.beginPath();
            ctx.moveTo(aimX, aimY);
            ctx.lineTo(this.x + Math.cos(this.spinAngle) * ARENA_RADIUS * 2, this.y + Math.sin(this.spinAngle) * ARENA_RADIUS * 2);
            ctx.strokeStyle = this.color + '66';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 15]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Slash arc VFX (matches stored slash plane from star hit)
            if (this.ninjaSlashTime > 0) {
                const slashProgress = 1 - (this.ninjaSlashTime / NINJA_SLASH_DURATION);
                const slashLen = this.buildCfg.katanaRange * 1.5;
                const base = this.ninjaSlashBaseAngle;
                const startAngle = base - 0.5;
                const endAngle = base - 0.5 + slashProgress * 2.0;

                // Draw slash arc - wider and larger
                ctx.save();
                ctx.strokeStyle = 'rgba(248,250,252,0.9)';
                ctx.lineWidth = 8;
                ctx.lineCap = 'round';
                ctx.shadowColor = '#f8fafc';
                ctx.shadowBlur = 15;

                // Draw the arc slash from player outward
                ctx.beginPath();
                ctx.arc(this.x, this.y, slashLen * 0.3, startAngle, endAngle);
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(this.x, this.y, slashLen * 0.6, startAngle, endAngle);
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(this.x, this.y, slashLen, startAngle, endAngle);
                ctx.stroke();

                // Draw connecting lines to show filled area
                ctx.globalAlpha = 0.4;
                ctx.fillStyle = 'rgba(248,250,252,0.3)';
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.arc(this.x, this.y, slashLen, startAngle, endAngle);
                ctx.closePath();
                ctx.fill();

                ctx.restore();
                ctx.shadowBlur = 0;
                ctx.globalAlpha = 1;
            }

            if (this.ninjaStrikeFxTime > 0) {
                const fxAlpha = Math.max(0, this.ninjaStrikeFxTime / 0.14);
                const fxLen = 78;
                const fxOffsetX = Math.cos(this.ninjaStrikeFxAngle + Math.PI / 2) * fxLen * 0.34;
                const fxOffsetY = Math.sin(this.ninjaStrikeFxAngle + Math.PI / 2) * fxLen * 0.34;
                ctx.save();
                ctx.strokeStyle = `rgba(248,250,252,${0.95 * fxAlpha})`;
                ctx.lineWidth = 10;
                ctx.lineCap = 'round';
                ctx.shadowColor = '#f8fafc';
                ctx.shadowBlur = 18;
                ctx.beginPath();
                ctx.moveTo(this.ninjaStrikeFxX - fxOffsetX, this.ninjaStrikeFxY - fxOffsetY);
                ctx.lineTo(this.ninjaStrikeFxX + fxOffsetX, this.ninjaStrikeFxY + fxOffsetY);
                ctx.stroke();

                ctx.strokeStyle = `rgba(148,163,184,${0.55 * fxAlpha})`;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(this.ninjaStrikeFxX - fxOffsetX * 0.72, this.ninjaStrikeFxY - fxOffsetY * 0.72);
                ctx.lineTo(this.ninjaStrikeFxX + fxOffsetX * 0.95, this.ninjaStrikeFxY + fxOffsetY * 0.95);
                ctx.stroke();
                ctx.restore();
            }
        } else if (this.build === 'reaper') {
            const hasThrownScythe = bullets.some(b => b.ownerId === this.id && b.type === 'scythe' && b.active);
            if (!hasThrownScythe) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.spinAngle + 0.1);
                drawScytheWeapon(ctx);
                ctx.restore();
            }

            // reaper ability aura when active - double ring effect
            if (this.reaperAbilityTime > 0) {
                const pulse = Math.sin(performance.now() * 0.015) * 4;
                ctx.save();
                ctx.strokeStyle = 'rgba(52,211,153,0.6)';
                ctx.lineWidth = 4;
                ctx.shadowColor = 'rgba(52,211,153,0.8)';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(this.x, this.y, BALL_RADIUS + 10 + pulse, 0, Math.PI * 2);
                ctx.stroke();

                // Inner ring
                ctx.strokeStyle = 'rgba(52,211,153,0.35)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(this.x, this.y, BALL_RADIUS + 4, 0, Math.PI * 2);
                ctx.stroke();

                ctx.shadowBlur = 0;
                ctx.restore();
            }

            // aiming dotted line for reaper
            const aimTipX = this.x + Math.cos(this.spinAngle) * (BALL_RADIUS * 1.6);
            const aimTipY = this.y + Math.sin(this.spinAngle) * (BALL_RADIUS * 1.6);
            ctx.beginPath();
            ctx.moveTo(aimTipX, aimTipY);
            ctx.lineTo(this.x + Math.cos(this.spinAngle) * ARENA_RADIUS * 2, this.y + Math.sin(this.spinAngle) * ARENA_RADIUS * 2);
            ctx.strokeStyle = this.color + '66';
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 12]);
            ctx.stroke();
            ctx.setLineDash([]);
        } else if (this.build === 'shotgun') {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.spinAngle);
            ctx.fillStyle = '#d1d5db';
            ctx.fillRect(-6, -5, 34, 10);
            ctx.fillStyle = '#6b7280';
            ctx.fillRect(-10, -4, 14, 8);
            ctx.strokeStyle = '#f8fafc';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(-6, -5, 34, 10);
            ctx.restore();

            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + Math.cos(this.spinAngle) * 150, this.y + Math.sin(this.spinAngle) * 150);
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 7;
            ctx.setLineDash([2, 16]);
            ctx.stroke();
            ctx.setLineDash([]);
        } else if (this.build === 'pyro') {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.spinAngle);
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(-8, -4, 28, 8);
            ctx.fillStyle = '#f97316';
            ctx.fillRect(18, -5, 8, 10);
            ctx.restore();

            if (this.pyroFiring) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.spinAngle);
                ctx.fillStyle = 'rgba(251,146,60,0.18)';
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.arc(0, 0, this.buildCfg.flameRange, -this.buildCfg.flameHalfAngle, this.buildCfg.flameHalfAngle);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = 'rgba(251,146,60,0.75)';
                ctx.lineWidth = 3;
                ctx.stroke();

                for (let i = 0; i < 4; i++) {
                    const startX = 18;
                    const endX = this.buildCfg.flameRange * (0.82 + i * 0.05);
                    const wave = Math.sin(performance.now() * 0.02 + i * 0.9) * (10 + i * 2);
                    ctx.beginPath();
                    ctx.moveTo(startX, 0);
                    ctx.quadraticCurveTo(
                        this.buildCfg.flameRange * (0.45 + i * 0.08),
                        wave,
                        endX,
                        wave * 0.35
                    );
                    ctx.strokeStyle = i < 2 ? 'rgba(251,146,60,0.9)' : 'rgba(253,186,116,0.7)';
                    ctx.lineWidth = 5 - i * 0.8;
                    ctx.stroke();
                }
                ctx.restore();
            }

            const aimX = this.x + Math.cos(this.spinAngle) * (BALL_RADIUS * 1.2);
            const aimY = this.y + Math.sin(this.spinAngle) * (BALL_RADIUS * 1.2);
            ctx.beginPath();
            ctx.moveTo(aimX, aimY);
            ctx.lineTo(this.x + Math.cos(this.spinAngle) * this.buildCfg.flameRange, this.y + Math.sin(this.spinAngle) * this.buildCfg.flameRange);
            ctx.strokeStyle = this.color + '66';
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 12]);
            ctx.stroke();
            ctx.setLineDash([]);

            if (this.pyroWaveTime > 0) {
                ctx.save();
                ctx.strokeStyle = 'rgba(251,146,60,0.85)';
                ctx.lineWidth = 8;
                ctx.shadowColor = '#fb923c';
                ctx.shadowBlur = 18;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.pyroWaveRadius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        } else if (this.build === 'necromancer') {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.spinAngle);
            ctx.strokeStyle = '#c4b5fd';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(-8, 0);
            ctx.lineTo(24, 0);
            ctx.stroke();
            ctx.fillStyle = '#a78bfa';
            ctx.beginPath();
            ctx.arc(28, 0, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            const aimX = this.x + Math.cos(this.spinAngle) * (BALL_RADIUS * 1.2);
            const aimY = this.y + Math.sin(this.spinAngle) * (BALL_RADIUS * 1.2);
            ctx.beginPath();
            ctx.moveTo(aimX, aimY);
            ctx.lineTo(this.x + Math.cos(this.spinAngle) * ARENA_RADIUS * 2, this.y + Math.sin(this.spinAngle) * ARENA_RADIUS * 2);
            ctx.strokeStyle = this.color + '66';
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 12]);
            ctx.stroke();
            ctx.setLineDash([]);
        } else if (this.build === 'juggernaut') {
            if (this.juggernautInvulnTime > 0) {
                ctx.save();
                ctx.strokeStyle = 'rgba(250,204,21,0.85)';
                ctx.lineWidth = 5;
                ctx.shadowColor = '#facc15';
                ctx.shadowBlur = 16;
                ctx.beginPath();
                ctx.arc(this.x, this.y, BALL_RADIUS + 12, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
            if (this.juggernautPullTime > 0) {
                ctx.save();
                ctx.strokeStyle = 'rgba(148,163,184,0.4)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.buildCfg.gravityRadius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        }

        // Reaper debuff aura around player when they are slowed
        if (this.reaperDebuffTime > 0) {
            ctx.save();
            ctx.strokeStyle = 'rgba(52,211,153,0.45)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, BALL_RADIUS + 12, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        if (this.burnTime > 0) {
            ctx.save();
            for (let i = 0; i < 3; i++) {
                const flicker = Math.sin(performance.now() * 0.015 + i) * 4;
                ctx.fillStyle = i === 0 ? 'rgba(251,146,60,0.45)' : (i === 1 ? 'rgba(253,186,116,0.4)' : 'rgba(239,68,68,0.3)');
                ctx.beginPath();
                ctx.ellipse(this.x - 8 + i * 8, this.y - BALL_RADIUS - 4 - flicker, 6, 10, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // Swordsman hit logic + projectile cleave during ability
        if (this.build === 'swordsman') {
            const other = this.id === 1 ? p2 : p1;
            const sLen = 44 * 1.925; // match visual blade length
            const tipX = this.x + Math.cos(this.spinAngle) * sLen;
            const tipY = this.y + Math.sin(this.spinAngle) * sLen;
            const activeAttack = (this.swordAttackTime > 0) || (this.swordAbilityTime > 0);
            const dmg = this.swordAbilityTime > 0
                ? (this.swordAbilityDamageOverride ?? this.buildCfg.swordAbilityDamage)
                : (this.swordDamageOverride ?? this.buildCfg.swordDamage);

            if (activeAttack && other && this.swordHitLock <= 0) {
                if (segmentHitsCircle(this.x, this.y, tipX, tipY, other.x, other.y, BALL_RADIUS * 0.92)) {
                    other.takeDamage(dmg);
                    this.swordHitLock = 0.25;
                    // Knockback and impact shake
                    const kx = other.x - this.x;
                    const ky = other.y - this.y;
                    const kLen = Math.hypot(kx, ky) || 1;
                    const nx = kx / kLen;
                    const ny = ky / kLen;
                    const knockStrength = 40;
                    other.x += nx * knockStrength;
                    other.y += ny * knockStrength;
                    screenShake = { x: 0, y: 0, duration: 0.22, intensity: 16 };
                }
            }

            if (this.swordAbilityTime > 0) {
                // delete projectiles hit by sword segment
                bullets.forEach(b => {
                    if (!b.active || b.ownerId === this.id) return;
                    if (segmentHitsCircle(this.x, this.y, tipX, tipY, b.x, b.y, b.radius)) {
                        b.active = false;
                        spawnImpact(b.x, b.y, '#ffffff');
                    }
                });
            }

            summons.forEach(s => {
                if (!s.active || s.ownerId === this.id) return;
                if (segmentHitsCircle(this.x, this.y, tipX, tipY, s.x, s.y, s.radius)) {
                    s.hit();
                }
            });
        }

        if (this.build === 'pyro' && this.pyroFiring) {
            summons.forEach(s => {
                if (!s.active || s.ownerId === this.id) return;
                if (isTargetInsideCone(this.x, this.y, this.spinAngle, this.buildCfg.flameRange, this.buildCfg.flameHalfAngle, s.x, s.y, s.radius)) {
                    s.hit();
                }
            });
        }
    }

    updateUI() {
        const displayHp = `${Math.max(0, Math.ceil(this.hp))}/${this.maxHp}`;
        if (this.id === 1) {
            p1HealthBar.style.width = `${(this.hp / this.maxHp) * 100}%`;
            p1HealthText.textContent = displayHp;
            p1DashCd.style.width = `${Math.max(0, (1 - this.dashCooldown / 5.0) * 100)}%`;
            const shootCd = this.buildCfg.shootCooldown ?? SHOOT_COOLDOWN;
            const abilityCd = this.buildCfg.abilityCooldown ?? SPECIAL_COOLDOWN;
            p1ShootCd.style.width = this.build === 'pyro'
                ? `${(this.pyroAmmo / PYRO_MAX_AMMO) * 100}%`
                : `${Math.max(0, (1 - this.shootCooldown / shootCd) * 100)}%`;
            p1SpecialCd.style.width = `${Math.max(0, (1 - this.specialCooldown / abilityCd) * 100)}%`;
            if(this.dashCooldown <= 0) p1DashCd.classList.add('p1-cd'); else p1DashCd.classList.remove('p1-cd');
            if((this.build === 'pyro' ? (this.pyroFiring || this.pyroAmmo >= PYRO_MIN_START_AMMO) : this.shootCooldown <= 0)) p1ShootCd.classList.add('p1-cd'); else p1ShootCd.classList.remove('p1-cd');
            if(this.specialCooldown <= 0) p1SpecialCd.classList.add('p1-cd'); else p1SpecialCd.classList.remove('p1-cd');
        } else {
            p2HealthBar.style.width = `${(this.hp / this.maxHp) * 100}%`;
            p2HealthText.textContent = displayHp;
            p2DashCd.style.width = `${Math.max(0, (1 - this.dashCooldown / 5.0) * 100)}%`;
            const shootCd = this.buildCfg.shootCooldown ?? SHOOT_COOLDOWN;
            const abilityCd = this.buildCfg.abilityCooldown ?? SPECIAL_COOLDOWN;
            p2ShootCd.style.width = this.build === 'pyro'
                ? `${(this.pyroAmmo / PYRO_MAX_AMMO) * 100}%`
                : `${Math.max(0, (1 - this.shootCooldown / shootCd) * 100)}%`;
            p2SpecialCd.style.width = `${Math.max(0, (1 - this.specialCooldown / abilityCd) * 100)}%`;
            if(this.dashCooldown <= 0) p2DashCd.classList.add('p2-cd'); else p2DashCd.classList.remove('p2-cd');
            if((this.build === 'pyro' ? (this.pyroFiring || this.pyroAmmo >= PYRO_MIN_START_AMMO) : this.shootCooldown <= 0)) p2ShootCd.classList.add('p2-cd'); else p2ShootCd.classList.remove('p2-cd');
            if(this.specialCooldown <= 0) p2SpecialCd.classList.add('p2-cd'); else p2SpecialCd.classList.remove('p2-cd');
        }
    }
}

function segmentHitsCircle(x1, y1, x2, y2, cx, cy, r) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return Math.hypot(cx - x1, cy - y1) <= r;
    let t = ((cx - x1) * dx + (cy - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const px = x1 + t * dx;
    const py = y1 + t * dy;
    return Math.hypot(cx - px, cy - py) <= r;
}

function rayCircleExitT(px, py, dx, dy, cx, cy, radius) {
    // dx,dy assumed normalized
    const ox = px - cx;
    const oy = py - cy;
    const b = 2 * (ox * dx + oy * dy);
    const c = ox * ox + oy * oy - radius * radius;
    const disc = b * b - 4 * c;
    if (disc <= 0) return 0;
    const t1 = (-b - Math.sqrt(disc)) / 2;
    const t2 = (-b + Math.sqrt(disc)) / 2;
    return Math.max(t1, t2, 0);
}

class Bullet {
    constructor(ownerId, x, y, dirX, dirY, color, opts = {}) {
        this.ownerId = ownerId;
        this.x = x;
        this.y = y;
        this.dirX = dirX;
        this.dirY = dirY;
        this.color = color;
        this.damage = opts.damage ?? 100;
        this.type = opts.type ?? 'bullet';
        this.speed = opts.speed ?? BULLET_SPEED;
        this.radius = opts.radius ?? BULLET_RADIUS;
        this.maxBounces = opts.maxBounces ?? 0;
        this.bounces = 0;
        this.scale = opts.scale ?? 1;
        this.isNinjaStar = opts.isNinjaStar || false;
        this.isScythe = opts.isScythe || false;
        this.returning = opts.returning || false;
        this.ninjaStarRotation = 0;
        this.lastHitTimes = opts.lastHitTimes || {1:0,2:0};
        this.createdTime = opts.createdTime || performance.now();
        this.lifetime = 10.0; // bullets expire after 10s
        this.maxDistance = opts.maxDistance ?? null;
        this.distanceTraveled = 0;
        this.minDamageMult = opts.minDamageMult ?? 1;
        this.trackTargetId = opts.trackTargetId ?? null;
        this.turnRate = opts.turnRate ?? 0.06;
        this.fromClone = opts.fromClone || false;
        this.waveBurnDuration = opts.waveBurnDuration ?? 0;
        this.pullStrength = opts.pullStrength ?? 0;
        this.returnSpeed = opts.returnSpeed ?? this.speed;
        this.hookedTargetId = opts.hookedTargetId ?? null;
        this.hookHasDamaged = opts.hookHasDamaged || false;
        this.active = true;
    }

    update(dt) {
        if (!this.active) return;
        
        this.lifetime -= dt;
        if (this.lifetime <= 0) {
            this.active = false;
            return;
        }

        // Move
        const prevX = this.x;
        const prevY = this.y;
        this.x += this.dirX * this.speed * dt;
        this.y += this.dirY * this.speed * dt;
        this.distanceTraveled += Math.hypot(this.x - prevX, this.y - prevY);
        if (this.maxDistance && this.distanceTraveled >= this.maxDistance) {
            if (this.type === 'hook') {
                this.returning = true;
                this.hookedTargetId = null;
                this.maxDistance = null;
            } else {
                this.active = false;
                return;
            }
        }

        // Spin for rotating projectiles
        if (this.isScythe) {
            this.rotation = (this.rotation || 0) + dt * 18;
        }
        if (this.isNinjaStar) {
            this.ninjaStarRotation += dt * 15; // spin at 15 radians per second
        }
        if (this.type === 'necroorb' && this.trackTargetId) {
            const target = getNecroOrbTarget(this.ownerId, this.x, this.y) || (this.trackTargetId === 1 ? p1 : p2);
            if (target) {
                const dx = target.x - this.x;
                const dy = target.y - this.y;
                const len = Math.hypot(dx, dy) || 1;
                const tx = dx / len;
                const ty = dy / len;
                const blend = this.turnRate;
                this.dirX = this.dirX * (1 - blend) + tx * blend;
                this.dirY = this.dirY * (1 - blend) + ty * blend;
                const nd = Math.hypot(this.dirX, this.dirY) || 1;
                this.dirX /= nd;
                this.dirY /= nd;
            }
        }
        if (this.type === 'hook') {
            const owner = this.ownerId === 1 ? p1 : p2;
            const hookedTarget = this.hookedTargetId ? (this.hookedTargetId === 1 ? p1 : p2) : null;
            if (hookedTarget && owner) {
                this.x = hookedTarget.x;
                this.y = hookedTarget.y;
                const distToOwner = Math.hypot(hookedTarget.x - owner.x, hookedTarget.y - owner.y);
                hookedTarget.pullTowardTime = 0.08;
                hookedTarget.pullTowardStrength = this.pullStrength;
                hookedTarget.pullTargetId = this.ownerId;
                if (distToOwner <= BALL_RADIUS * 2 + 12) {
                    this.returning = true;
                    this.hookedTargetId = null;
                }
            } else if (this.returning && owner) {
                const dx = owner.x - this.x;
                const dy = owner.y - this.y;
                const dlen = Math.hypot(dx, dy) || 1;
                this.dirX = dx / dlen;
                this.dirY = dy / dlen;
                this.speed = this.returnSpeed;
            }
        }

        // Homing return for scythe
        if (this.type === 'scythe' && this.returning) {
            const owner = this.ownerId === 1 ? p1 : p2;
            if (owner) {
                const dx = owner.x - this.x;
                const dy = owner.y - this.y;
                const dlen = Math.hypot(dx, dy) || 1;
                const tx = dx / dlen;
                const ty = dy / dlen;
                const blend = 0.1;
                this.dirX = this.dirX * (1 - blend) + tx * blend;
                this.dirY = this.dirY * (1 - blend) + ty * blend;
                const nd = Math.hypot(this.dirX, this.dirY) || 1;
                this.dirX /= nd;
                this.dirY /= nd;
                this.speed = BULLET_SPEED * 1.1;
            }
        }

        // Wall Collision
        const distToCenter = Math.hypot(this.x - CENTER_X, this.y - CENTER_Y);
        if (distToCenter + this.radius >= ARENA_RADIUS) {
            if (this.type === 'hook') {
                const nx = (CENTER_X - this.x) / distToCenter;
                const ny = (CENTER_Y - this.y) / distToCenter;
                const pushIn = (distToCenter + this.radius) - ARENA_RADIUS;
                this.x += nx * pushIn;
                this.y += ny * pushIn;
                this.returning = true;
                this.hookedTargetId = null;
                return;
            }
            if (this.type === 'scythe' && !this.returning) {
                // on wall hit, scythe returns to owner with homing
                this.returning = true;
                const owner = this.ownerId === 1 ? p1 : p2;
                if (owner) {
                    const dx = owner.x - this.x;
                    const dy = owner.y - this.y;
                    const dlen = Math.hypot(dx, dy) || 1;
                    this.dirX = dx / dlen;
                    this.dirY = dy / dlen;
                }
            } else if (this.type === 'scythe' && this.returning) {
                // home-in to owner each frame
                const owner = this.ownerId === 1 ? p1 : p2;
                if (owner) {
                    const dx = owner.x - this.x;
                    const dy = owner.y - this.y;
                    const dlen = Math.hypot(dx, dy) || 1;
                    const targetX = dx / dlen;
                    const targetY = dy / dlen;
                    const blend = 0.08;
                    this.dirX = this.dirX * (1 - blend) + targetX * blend;
                    this.dirY = this.dirY * (1 - blend) + targetY * blend;
                    const nd = Math.hypot(this.dirX, this.dirY) || 1;
                    this.dirX /= nd;
                    this.dirY /= nd;
                }
            } else if (this.maxBounces > 0 && this.bounces < this.maxBounces) {
                const nx = (CENTER_X - this.x) / distToCenter;
                const ny = (CENTER_Y - this.y) / distToCenter;
                const dot = this.dirX * nx + this.dirY * ny;
                if (dot < 0) {
                    this.dirX = this.dirX - 2 * dot * nx;
                    this.dirY = this.dirY - 2 * dot * ny;
                    const len = Math.hypot(this.dirX, this.dirY);
                    this.dirX /= len;
                    this.dirY /= len;
                    this.bounces++;
                }
                const pushIn = (distToCenter + this.radius) - ARENA_RADIUS;
                this.x += nx * pushIn;
                this.y += ny * pushIn;
            } else {
                if (this.type === 'scythe' && this.returning) {
                    const owner = this.ownerId === 1 ? p1 : p2;
                    if (owner && Math.hypot(this.x - owner.x, this.y - owner.y) <= BALL_RADIUS + this.radius) {
                        this.active = false;
                        owner.hasScythe = true;
                        return;
                    }
                }
                spawnImpact(this.x, this.y, this.color);
                this.active = false;
                return;
            }
        }

        // Check clone collisions
        summons.forEach(clone => {
            if (!clone.active || clone.ownerId === this.ownerId) return;
            const dist = Math.hypot(this.x - clone.x, this.y - clone.y);
            if (dist <= clone.radius + this.radius) {
                clone.hit();
                spawnImpact(this.x, this.y, this.color);
                if (this.type !== 'scythe') this.active = false;
            }
        });
        if (!this.active) return;

        // Check player collisions
        [p1, p2].forEach(p => {
            if (p.id === this.ownerId) {
                if (this.type === 'hook' && this.returning) {
                    const owner = this.ownerId === 1 ? p1 : p2;
                    if (owner && Math.hypot(this.x - owner.x, this.y - owner.y) <= BALL_RADIUS + this.radius) {
                        this.active = false;
                    }
                }
                if (this.type === 'scythe' && this.returning) {
                    const owner = this.ownerId === 1 ? p1 : p2;
                    if (owner && Math.hypot(this.x - owner.x, this.y - owner.y) <= BALL_RADIUS + this.radius) {
                        this.active = false;
                        owner.hasScythe = true;
                    }
                }
                return;
            }

            const dist = Math.hypot(this.x - p.x, this.y - p.y);
            if (dist <= BALL_RADIUS + this.radius) {
                if (this.type === 'ninjastar') {
                    const owner = this.ownerId === 1 ? p1 : p2;
                    const target = p;
                    const effectiveDamage = this.damage;
                    target.takeDamage(effectiveDamage);
                    spawnImpact(this.x, this.y, this.color);
                    this.active = false;

                    if (owner) {
                        // teleport behind target then slash
                        const angleToTarget = Math.atan2(target.y - owner.y, target.x - owner.x);
                        const behind = angleToTarget + Math.PI;
                        const teleportDist = BALL_RADIUS + 10;
                        owner.x = target.x + Math.cos(behind) * teleportDist;
                        owner.y = target.y + Math.sin(behind) * teleportDist;
                        owner.spinAngle = Math.atan2(target.y - owner.y, target.x - owner.x);
                        owner.ninjaSlashBaseAngle = owner.spinAngle;
                        owner.ninjaSlashTime = NINJA_SLASH_DURATION;
                        owner.ninjaSlashHitDealt = false;
                    }
                    return;
                }

                if (this.type === 'scythe') {
                    const now = performance.now();
                    if (now - this.lastHitTimes[p.id] >= 200) {
                        this.lastHitTimes[p.id] = now;
                        const effectiveDamage = this.damage;
                        p.takeDamage(effectiveDamage);
                        spawnImpact(this.x, this.y, this.color);
                        const owner = this.ownerId === 1 ? p1 : p2;
                        if (owner) {
                            const lifesteal = owner.reaperAbilityTime > 0 ? REAPER_ABILITY_LIFESTEAL : REAPER_BASE_LIFESTEAL;
                            owner.heal(Math.round(effectiveDamage * lifesteal));
                        }
                    }
                    return;
                }

                if (this.type === 'hook') {
                    if (!this.hookHasDamaged) {
                        p.takeDamage(this.damage);
                        this.hookHasDamaged = true;
                    }
                    p.statusSlowTime = BUILDS.shotgun.hookSlowDuration;
                    p.statusSlowMult = BUILDS.shotgun.hookSlowMult;
                    p.pullTowardTime = BUILDS.shotgun.hookPullDuration;
                    p.pullTowardStrength = BUILDS.shotgun.hookPullStrength;
                    p.pullTargetId = this.ownerId;
                    this.hookedTargetId = p.id;
                    return;
                }

                if (this.type !== 'scythe') {
                    let effectiveDamage = this.damage;
                    if (this.type === 'shotgun' && this.maxDistance) {
                        const t = Math.min(1, this.distanceTraveled / this.maxDistance);
                        const mult = 1 - (1 - this.minDamageMult) * t;
                        effectiveDamage *= mult;
                    }
                    p.takeDamage(effectiveDamage);
                    if (this.type === 'shotgun' && p.pullTowardTime > 0) {
                        p.pullTowardTime = 0;
                        p.pullTowardStrength = 0;
                        p.pullTargetId = null;
                        releaseHookOnPlayer(p.id);
                    }
                    if (this.ownerId) {
                        const owner = this.ownerId === 1 ? p1 : p2;
                        if (owner && owner.build === 'pyro' && this.type !== 'shotgun') {
                            screenShake = { x: 0, y: 0, duration: 0.08, intensity: 4 };
                        }
                    }
                    spawnImpact(this.x, this.y, this.color);
                    this.active = false;
                }
            }
        });
    }

    draw(ctx) {
        if (!this.active) return;

        if (this.type === 'hook') {
            const owner = this.ownerId === 1 ? p1 : p2;
            if (owner) {
                ctx.save();
                ctx.strokeStyle = 'rgba(226,232,240,0.65)';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(owner.x, owner.y);
                ctx.lineTo(this.x, this.y);
                ctx.stroke();
                ctx.restore();
            }
        }

        const a = Math.atan2(this.dirY, this.dirX);
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(a);

        // Glow pass
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 12;

        if (this.type === 'arrow') {
            const shaftLen = 24 * this.scale;
            const shaftW = 2.5 * this.scale;
            const headLen = 8 * this.scale;
            const tailLen = 6 * this.scale;

            // shaft
            ctx.strokeStyle = this.color;
            ctx.lineWidth = shaftW;
            ctx.beginPath();
            ctx.moveTo(-tailLen, 0);
            ctx.lineTo(shaftLen, 0);
            ctx.stroke();

            // arrowhead
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(shaftLen + headLen, 0);
            ctx.lineTo(shaftLen, -4 * this.scale);
            ctx.lineTo(shaftLen, 4 * this.scale);
            ctx.closePath();
            ctx.fill();

            // tail feathers
            ctx.strokeStyle = 'rgba(255,255,255,0.85)';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(-tailLen, 0);
            ctx.lineTo(-tailLen - 4 * this.scale, -3 * this.scale);
            ctx.moveTo(-tailLen, 0);
            ctx.lineTo(-tailLen - 4 * this.scale, 3 * this.scale);
            ctx.stroke();

            // inner highlight
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(shaftLen * 0.6, 0);
            ctx.strokeStyle = 'rgba(255,255,255,0.35)';
            ctx.lineWidth = 1;
            ctx.stroke();
        } else if (this.type === 'ninjastar') {
            const size = 14 * this.scale;
            ctx.save();
            ctx.rotate(this.ninjaStarRotation || 0);

            ctx.shadowColor = '#e2e8f0';
            ctx.shadowBlur = 6;

            ctx.fillStyle = '#f1f5f9';
            ctx.beginPath();
            for (let i = 0; i < 4; i++) {
                const a0 = (Math.PI / 2) * i - Math.PI / 2;
                const a1 = a0 + Math.PI / 2;
                const tip = size;
                const inner = size * 0.32;
                if (i === 0) ctx.moveTo(Math.cos(a0) * tip, Math.sin(a0) * tip);
                else ctx.lineTo(Math.cos(a0) * tip, Math.sin(a0) * tip);
                ctx.lineTo(Math.cos((a0 + a1) / 2) * inner, Math.sin((a0 + a1) / 2) * inner);
            }
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = 'rgba(255,255,255,0.9)';
            ctx.lineWidth = 1.15;
            ctx.stroke();

            ctx.strokeStyle = 'rgba(51,65,85,0.45)';
            ctx.lineWidth = 0.9;
            ctx.beginPath();
            for (let i = 0; i < 4; i++) {
                const a = (Math.PI / 2) * i - Math.PI / 2;
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(a) * size * 0.88, Math.sin(a) * size * 0.88);
            }
            ctx.stroke();

            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.22, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(15,23,42,0.5)';
            ctx.lineWidth = 0.8;
            ctx.stroke();

            ctx.shadowBlur = 0;
            ctx.restore();
        } else if (this.type === 'scythe') {
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
            const rot = this.rotation || 0;
            const s = 0.72 * this.scale;
            ctx.save();
            ctx.scale(s, s);
            ctx.rotate(rot);
            drawScytheWeapon(ctx);
            ctx.restore();
        } else if (this.type === 'hook') {
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 2.8;
            ctx.beginPath();
            ctx.moveTo(-18, 0);
            ctx.lineTo(6, 0);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(-6, 0, 6.5, Math.PI * 0.55, Math.PI * 1.45);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(18, 0, 10, -Math.PI * 0.45, Math.PI * 0.45);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(18, -10);
            ctx.lineTo(30, -18);
            ctx.moveTo(18, 10);
            ctx.lineTo(30, 18);
            ctx.stroke();
        } else if (this.type === 'pyrowave') {
            ctx.fillStyle = '#fb923c';
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        } else if (this.type === 'necroorb') {
            ctx.fillStyle = '#a78bfa';
            ctx.beginPath();
            ctx.arc(0, 0, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#f5f3ff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        } else if (this.type === 'shotgun') {
            ctx.fillStyle = '#fde68a';
            ctx.beginPath();
            ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            const baseLen = 18 * this.scale;
            const halfW = 6 * this.scale;
            const back = 8 * this.scale;
            const concave = 4.5 * this.scale;
            ctx.beginPath();
            ctx.moveTo(baseLen, 0);
            ctx.lineTo(-back, -halfW);
            ctx.lineTo(-back + concave, 0);
            ctx.lineTo(-back, halfW);
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgba(255,255,255,0.9)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Subtle inner line
            ctx.beginPath();
            ctx.moveTo(baseLen - 4, 0);
            ctx.lineTo(-back + concave + 1, 0);
            ctx.strokeStyle = 'rgba(255,255,255,0.35)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.restore();
    }
}

// Impact Particle class
class Particle {
    constructor(x, y, dirX, dirY, color, speed, life) {
        this.x = x;
        this.y = y;
        this.dirX = dirX;
        this.dirY = dirY;
        this.color = color;
        this.speed = speed;
        this.life = life;
        this.maxLife = life;
        this.active = true;
        this.radius = 3 + Math.random() * 3;
    }

    update(dt) {
        if (!this.active) return;
        this.life -= dt;
        if (this.life <= 0) { this.active = false; return; }
        this.x += this.dirX * this.speed * dt;
        this.y += this.dirY * this.speed * dt;
        this.speed *= 0.96; // slow down over time
    }

    draw(ctx) {
        if (!this.active) return;
        const alpha = Math.max(0, this.life / this.maxLife);
        const r = this.radius * alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class Clone {
    constructor(ownerId, x, y, color) {
        this.ownerId = ownerId;
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = BALL_RADIUS * 0.7;
        this.hp = 1;
        this.fireTimer = BUILDS.necromancer.shootCooldown;
        this.lifeTime = 30;
        const a = Math.random() * Math.PI * 2;
        this.dirX = Math.cos(a);
        this.dirY = Math.sin(a);
        this.speed = BALL_BASE_SPEED * 0.8;
        this.active = true;
    }

    update(dt) {
        if (!this.active) return;
        this.lifeTime -= dt;
        if (this.lifeTime <= 0) {
            this.active = false;
            spawnImpact(this.x, this.y, this.color);
            return;
        }
        this.x += this.dirX * this.speed * dt;
        this.y += this.dirY * this.speed * dt;

        const distToCenter = Math.hypot(this.x - CENTER_X, this.y - CENTER_Y);
        if (distToCenter + this.radius >= ARENA_RADIUS) {
            const nx = (CENTER_X - this.x) / distToCenter;
            const ny = (CENTER_Y - this.y) / distToCenter;
            const dot = this.dirX * nx + this.dirY * ny;
            if (dot < 0) {
                this.dirX = this.dirX - 2 * dot * nx;
                this.dirY = this.dirY - 2 * dot * ny;
                const inwardBiased = biasDirectionInward(this.dirX, this.dirY, nx, ny, 0.08);
                this.dirX = inwardBiased.x;
                this.dirY = inwardBiased.y;
            }
            const pushIn = (distToCenter + this.radius) - ARENA_RADIUS;
            this.x += nx * pushIn;
            this.y += ny * pushIn;
        }

        if (this.fireTimer > 0) this.fireTimer -= dt;
        if (this.fireTimer <= 0) {
            const owner = this.ownerId === 1 ? p1 : p2;
            if (owner && owner.build === 'necromancer') {
                const target = owner.id === 1 ? p2 : p1;
                const angle = target ? Math.atan2(target.y - this.y, target.x - this.x) : owner.spinAngle;
                owner.fireNecroOrb(true, this.x, this.y, angle);
            }
            this.fireTimer = BUILDS.necromancer.shootCooldown;
        }
    }

    hit() {
        if (!this.active) return;
        this.hp = 0;
        this.active = false;
        spawnImpact(this.x, this.y, this.color);
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.globalAlpha = 0.65;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 7 + Math.sin(performance.now() * 0.01) * 2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(167,139,250,0.4)';
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.restore();
    }
}

class Pickup {
    constructor(type, x, y) {
        this.type = type; // 'medkit' | 'syringe'
        this.x = x;
        this.y = y;
        this.active = true;
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        // Glow
        const col = this.type === 'medkit' ? '#22c55e' : '#dc2626';
        ctx.shadowColor = col;
        ctx.shadowBlur = 18;

        if (this.type === 'medkit') {
            // Box + cross (60% larger)
            const medW = 28 * 1.6;
            const medH = 20 * 1.6;
            const medR = 6 * 1.6;
            const cross = 6 * 1.6;
            ctx.fillStyle = 'rgba(34,197,94,0.22)';
            ctx.strokeStyle = 'rgba(34,197,94,0.95)';
            ctx.lineWidth = 2;
            drawRoundedRect(ctx, -medW / 2, -medH / 2, medW, medH, medR);
            ctx.fill();
            ctx.stroke();

            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgba(255,255,255,0.9)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-cross, 0);
            ctx.lineTo(cross, 0);
            ctx.moveTo(0, -cross);
            ctx.lineTo(0, cross);
            ctx.stroke();
        } else {
            // Syringe — flat icon style (tilted ~45°): barrel, red fill, marks, plunger, hub, needle
            ctx.shadowColor = '#dc2626';
            ctx.shadowBlur = 14;
            ctx.rotate(-Math.PI / 4);

            const ink = '#1e1e1e';
            const bw = 13;
            const bh = 26;
            const top = -bh / 2;
            const left = -bw / 2;
            const r = 2.5;

            ctx.lineWidth = 2;
            ctx.strokeStyle = ink;
            ctx.fillStyle = '#fafafa';
            drawRoundedRect(ctx, left, top, bw, bh, r);
            ctx.fill();
            ctx.stroke();

            const midY = top + bh * 0.48;
            const innerL = left + 1.8;
            const innerR = left + bw - 1.8;
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.moveTo(innerL, midY);
            ctx.lineTo(innerR, midY);
            ctx.lineTo(innerR, top + bh - 1.8);
            ctx.lineTo(innerL, top + bh - 1.8);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = ink;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(innerL, midY);
            ctx.lineTo(innerR, midY);
            ctx.stroke();

            ctx.lineWidth = 1.6;
            for (let i = 0; i < 3; i++) {
                const my = top + 4 + i * 2.4;
                if (my >= midY - 0.5) break;
                ctx.beginPath();
                ctx.moveTo(left + 2.5, my);
                ctx.lineTo(left + 8.2, my);
                ctx.stroke();
            }

            const flangeW = 5;
            const flangeH = 3;
            ctx.fillStyle = ink;
            ctx.fillRect(left - flangeW + 0.5, top + 1.5, flangeW, flangeH);
            ctx.fillRect(left + bw - 0.5, top + 1.5, flangeW, flangeH);

            ctx.fillStyle = ink;
            ctx.fillRect(left - 1, top - 8, bw + 2, 5);
            ctx.fillRect(left + bw / 2 - 5, top - 12, 10, 4);

            ctx.shadowBlur = 0;
            ctx.fillStyle = ink;
            ctx.beginPath();
            ctx.moveTo(left + bw / 2 - 2.5, top + bh - 1.5);
            ctx.lineTo(left + bw / 2 + 2.5, top + bh - 1.5);
            ctx.lineTo(left + bw / 2 + 1.5, top + bh + 3);
            ctx.lineTo(left + bw / 2 - 1.5, top + bh + 3);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = ink;
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(left + bw / 2, top + bh + 3);
            ctx.lineTo(left + bw / 2, top + bh + 12);
            ctx.stroke();
        }

        ctx.restore();
    }
}

function drawRoundedRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
}

function spawnImpact(x, y, color) {
    // Spawn 12 particles in a starburst
    for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 / 12) * i + (Math.random() - 0.5) * 0.5;
        const speed = 150 + Math.random() * 200;
        const life = 0.25 + Math.random() * 0.2;
        particles.push(new Particle(x, y, Math.cos(angle), Math.sin(angle), color, speed, life));
    }
    // Also spawn a few white sparks
    for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 100 + Math.random() * 150;
        const life = 0.15 + Math.random() * 0.15;
        particles.push(new Particle(x, y, Math.cos(angle), Math.sin(angle), '#ffffff', speed, life));
    }
    // Trigger screen shake
    screenShake = { x: 0, y: 0, duration: 0.15, intensity: 13 };
}

function spawnSmokePoof(x, y) {
    for (let i = 0; i < 96; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 80 + Math.random() * 260;
        const life = 0.6 + Math.random() * 0.45;
        const smokeColor = Math.random() > 0.45 ? '#94a3b8' : '#cbd5e1';
        particles.push(new Particle(x, y, Math.cos(angle), Math.sin(angle), smokeColor, speed, life));
    }
}

function spawnDeathExplosion(x, y, color) {
    // Massive colored blast
    for (let i = 0; i < 360; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 420 + Math.random() * 1400;
        const life = 1.2 + Math.random() * 1.3;
        particles.push(new Particle(x, y, Math.cos(angle), Math.sin(angle), color, speed, life));
    }

    // Bright sparks and core flash
    for (let i = 0; i < 170; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 520 + Math.random() * 1200;
        const life = 0.8 + Math.random() * 0.9;
        const sparkColor = Math.random() > 0.5 ? '#ffffff' : '#fbbf24';
        particles.push(new Particle(x, y, Math.cos(angle), Math.sin(angle), sparkColor, speed, life));
    }

    // Outer shock ring made from slower debris
    for (let i = 0; i < 130; i++) {
        const angle = (Math.PI * 2 * i) / 130;
        const speed = 320 + Math.random() * 260;
        const life = 0.9 + Math.random() * 0.45;
        particles.push(new Particle(x, y, Math.cos(angle), Math.sin(angle), 'rgba(241,245,249,0.85)', speed, life));
    }

    // Extreme screen shake
    screenShake = { x: 0, y: 0, duration: 0.9, intensity: 42 };
}

let p1, p2;

function randBetween(min, max) {
    return min + Math.random() * (max - min);
}

function spawnPickup() {
    const type = Math.random() < 0.5 ? 'medkit' : 'syringe';
    for (let attempt = 0; attempt < 12; attempt++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * (ARENA_RADIUS - 80) + 25;
        const x = CENTER_X + Math.cos(angle) * r;
        const y = CENTER_Y + Math.sin(angle) * r;
        const d1 = p1 ? Math.hypot(x - p1.x, y - p1.y) : 9999;
        const d2 = p2 ? Math.hypot(x - p2.x, y - p2.y) : 9999;
        if (d1 > BALL_RADIUS * 2.2 && d2 > BALL_RADIUS * 2.2) {
            pickups.push(new Pickup(type, x, y));
            return;
        }
    }

    // fallback (rare)
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * (ARENA_RADIUS - 80) + 25;
    pickups.push(new Pickup(type, CENTER_X + Math.cos(angle) * r, CENTER_Y + Math.sin(angle) * r));
}

function updateBotDifficultyButtons() {
    document.querySelectorAll('.bot-difficulty-option').forEach(btn => {
        btn.classList.toggle('selected', btn.getAttribute('data-bot-difficulty') === botDifficulty);
    });
}

function configureMenuForMode(mode) {
    currentGameMode = mode;
    const isBotsMode = mode === 'bots';
    botSettings.classList.toggle('hidden', !isBotsMode);
    menuSubtitle.textContent = isBotsMode
        ? 'Pick your build, set the bot build, then choose a difficulty.'
        : 'Pick a build for each player, then start the round.';
    menuPlayer1Title.textContent = 'PLAYER 1';
    menuPlayer2Title.textContent = isBotsMode ? 'BOT' : 'PLAYER 2';
    player1Name.textContent = 'PLAYER 1';
    player2Name.textContent = isBotsMode ? `BOT ${botDifficulty.toUpperCase()}` : 'PLAYER 2';
    startRoundBtn.textContent = isBotsMode ? 'START BOT MATCH' : 'START ROUND';
    menuHint.innerHTML = isBotsMode
        ? 'P1: Dash <span class="key">E</span> Shoot <span class="key">R</span> Ability <span class="key">F</span><br>The bot controls itself based on the selected difficulty.'
        : 'P1: Dash <span class="key">E</span> | Shoot <span class="key">R</span> | Ability <span class="key">F</span><br>P2: Dash <span class="key">O</span> | Shoot <span class="key">P</span> | Ability <span class="key">L</span>';
    updateBotDifficultyButtons();
}

function initGame() {
    // Top Right to Bottom Left
    p1 = new Player(1, '#3b82f6', CENTER_X + 100, CENTER_Y - 100, Math.PI * 0.75, selectedBuilds[1]);
    // Bottom Left to Top Right
    p2 = new Player(
        2,
        '#ef4444',
        CENTER_X - 100,
        CENTER_Y + 100,
        -Math.PI * 0.25,
        selectedBuilds[2],
        { isBot: currentGameMode === 'bots', botDifficulty }
    );
    
    bullets = [];
    particles = [];
    pickups = [];
    summons = [];
    screenShake = { x: 0, y: 0, duration: 0, intensity: 0 };
    collisionDamageCooldown = 0;
    gameOver = false;
    roundEndActive = false;
    if (koRevealTimeout) {
        clearTimeout(koRevealTimeout);
        koRevealTimeout = null;
    }
    if (rematchRevealTimeout) {
        clearTimeout(rematchRevealTimeout);
        rematchRevealTimeout = null;
    }
    gameOverScreen.classList.remove('ko-animate', 'show-rematch');
    gameOverScreen.classList.add('hidden');
    rematchBtn.classList.add('hidden');
    titleScreen.classList.add('hidden');
    menuScreen.classList.add('hidden');
    inMenu = false;
    
    // Reset key states on restart otherwise they might stay stuck if held
    for (let key in keys) keys[key] = false;
    
    p1.updateUI();
    p2.updateUI();

    // schedule first pickup spawn
    pickupSpawnTimer = randBetween(PICKUP_SPAWN_MIN, PICKUP_SPAWN_MAX);
    
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function showTitleScreen() {
    gameOver = true;
    inMenu = true;
    roundEndActive = false;
    if (koRevealTimeout) {
        clearTimeout(koRevealTimeout);
        koRevealTimeout = null;
    }
    if (rematchRevealTimeout) {
        clearTimeout(rematchRevealTimeout);
        rematchRevealTimeout = null;
    }
    gameOverScreen.classList.remove('ko-animate', 'show-rematch');
    gameOverScreen.classList.add('hidden');
    rematchBtn.classList.add('hidden');
    menuScreen.classList.add('hidden');
    titleScreen.classList.remove('hidden');
}

function showBuildMenu(mode = currentGameMode) {
    // reset states so you always start from the build menu
    configureMenuForMode(mode);
    gameOver = true;
    inMenu = true;
    roundEndActive = false;
    if (koRevealTimeout) {
        clearTimeout(koRevealTimeout);
        koRevealTimeout = null;
    }
    if (rematchRevealTimeout) {
        clearTimeout(rematchRevealTimeout);
        rematchRevealTimeout = null;
    }
    gameOverScreen.classList.remove('ko-animate', 'show-rematch');
    gameOverScreen.classList.add('hidden');
    rematchBtn.classList.add('hidden');
    titleScreen.classList.add('hidden');
    menuScreen.classList.remove('hidden');
}

function startRoundFromMenu() {
    gameOver = false;
    initGame();
}

function endGame(winnerId) {
    gameOver = true;
    roundEndActive = false;
    if (koRevealTimeout) {
        clearTimeout(koRevealTimeout);
        koRevealTimeout = null;
    }
    if (rematchRevealTimeout) {
        clearTimeout(rematchRevealTimeout);
        rematchRevealTimeout = null;
    }
    gameOverScreen.classList.remove('ko-animate', 'show-rematch');
    void gameOverScreen.offsetWidth;
    gameOverScreen.classList.remove('hidden');
    const isBotWinner = currentGameMode === 'bots' && winnerId === 2;
    winnerText.textContent = 'KO';
    winnerText.style.color = winnerId === 1 ? 'var(--p1-color)' : 'var(--p2-color)';
    winnerText.style.textShadow = `0 0 20px ${winnerId === 1 ? 'rgba(59, 130, 246, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`;
    rematchBtn.textContent = isBotWinner ? `REMATCH VS ${botDifficulty.toUpperCase()} BOT` : 'REMATCH';
    rematchBtn.classList.add('hidden');
    gameOverScreen.classList.add('ko-animate');
    rematchRevealTimeout = setTimeout(() => {
        rematchBtn.classList.remove('hidden');
        gameOverScreen.classList.add('show-rematch');
        rematchRevealTimeout = null;
    }, 1000);
}

function drawArena() {
    const scale = canvas.width / 800;
    const outerBorderInset = 8 * scale;
    const outerBorderWidth = 8 * scale;

    // Outer border
    ctx.beginPath();
    ctx.arc(CENTER_X, CENTER_Y, ARENA_RADIUS + outerBorderInset, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.lineWidth = outerBorderWidth;
    ctx.strokeStyle = '#334155';
    ctx.stroke();
    
    // Inner floor
    ctx.beginPath();
    ctx.arc(CENTER_X, CENTER_Y, ARENA_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    // Railgun ability visual: wavy neon circumference while active
    const rail1 = p1 && p1.build === 'railgun' && p1.boundaryZapTime > 0;
    const rail2 = p2 && p2.build === 'railgun' && p2.boundaryZapTime > 0;
    if (rail1 || rail2) {
        const color = rail1 ? (p1.buildCfg.beamColor) : (p2.buildCfg.beamColor);
        const time = performance.now() / 250;
        ctx.save();
        ctx.beginPath();
        const r = ARENA_RADIUS - 2;
        for (let i = 0; i <= 220; i++) {
            const t = (i / 220) * Math.PI * 2;
            const wobble = Math.sin(t * 10 + time) * 2.5 + Math.sin(t * 22 - time * 1.4) * 1.2;
            const rr = r + wobble;
            const x = CENTER_X + Math.cos(t) * rr;
            const y = CENTER_Y + Math.sin(t) * rr;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 18;
        ctx.globalAlpha = 0.85;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
    }
    
    // Grid pattern for aesthetics
    ctx.save();
    ctx.beginPath();
    ctx.arc(CENTER_X, CENTER_Y, ARENA_RADIUS, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    ctx.translate(CENTER_X, CENTER_Y);
    const step = 40;
    for (let i = -ARENA_RADIUS; i <= ARENA_RADIUS; i += step) {
        ctx.beginPath(); ctx.moveTo(i, -ARENA_RADIUS); ctx.lineTo(i, ARENA_RADIUS); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-ARENA_RADIUS, i); ctx.lineTo(ARENA_RADIUS, i); ctx.stroke();
    }
    ctx.restore();
}

function gameLoop(timestamp) {
    // Delta time in seconds
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05) * gameSpeedScale; // Cap dt at 50ms to prevent glitches if tab is inactive
    lastTime = timestamp;

    // Update screen shake
    if (screenShake.duration > 0) {
        screenShake.duration -= dt;
        screenShake.x = (Math.random() - 0.5) * screenShake.intensity * 2;
        screenShake.y = (Math.random() - 0.5) * screenShake.intensity * 2;
        screenShake.intensity *= 0.9; // decay
    } else {
        screenShake.x = 0;
        screenShake.y = 0;
    }
    if (collisionDamageCooldown > 0) collisionDamageCooldown -= dt;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply screen shake offset
    ctx.save();
    ctx.translate(screenShake.x, screenShake.y);

    drawArena();

    if (!gameOver && !inMenu) {
        p1.update(dt);
        p2.update(dt);
        resolvePlayerCollision(p1, p2);
        
        // Update bullets and remove inactive ones
        bullets.forEach(b => b.update(dt));
        bullets = bullets.filter(b => b.active);

        // Update particles
        particles.forEach(p => p.update(dt));
        particles = particles.filter(p => p.active);

        summons.forEach(s => s.update(dt));
        summons = summons.filter(s => s.active);
        summons.forEach(s => {
            resolveJuggernautCloneCollision(p1, s);
            resolveJuggernautCloneCollision(p2, s);
        });

        // Spawn pickups (medkit/syringe)
        pickupSpawnTimer -= dt;
        if (pickupSpawnTimer <= 0) {
            spawnPickup();
            pickupSpawnTimer = randBetween(PICKUP_SPAWN_MIN, PICKUP_SPAWN_MAX);
        }

        // Handle pickup collisions (first touch wins)
        pickups.forEach(pk => {
            if (!pk.active) return;
            const dist1 = Math.hypot(pk.x - p1.x, pk.y - p1.y);
            if (dist1 <= BALL_RADIUS + PICKUP_RADIUS) {
                if (pk.type === 'medkit') p1.heal(MEDKIT_HEAL);
                else if (pk.type === 'syringe') p1.nextAttackDamageMult = SYRINGE_MULT;
                pk.active = false;
                return;
            }
            const dist2 = Math.hypot(pk.x - p2.x, pk.y - p2.y);
            if (dist2 <= BALL_RADIUS + PICKUP_RADIUS) {
                if (pk.type === 'medkit') p2.heal(MEDKIT_HEAL);
                else if (pk.type === 'syringe') p2.nextAttackDamageMult = SYRINGE_MULT;
                pk.active = false;
            }
        });
        pickups = pickups.filter(pk => pk.active);
    } else if (roundEndActive && !inMenu) {
        particles.forEach(p => p.update(dt));
        particles = particles.filter(p => p.active);
    }

    // Always draw even if game over so the explosion/last state remains
    bullets.forEach(b => b.draw(ctx));
    summons.forEach(s => s.draw(ctx));
    pickups.forEach(pk => pk.draw(ctx));
    p1.draw(ctx);
    p2.draw(ctx);
    particles.forEach(p => p.draw(ctx));

    ctx.restore(); // Undo screen shake translate

    if ((!gameOver || roundEndActive) && !inMenu) {
        requestAnimationFrame(gameLoop);
    }
}

function resizeCanvas() {
    // Calculate canvas size based on viewport to maintain proper scaling
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Keep the frame closer to the arena border
    let canvasSize = Math.min(viewportWidth * 0.88, viewportHeight * 0.88);
    
    // Ensure minimum size for gameplay
    canvasSize = Math.max(canvasSize, 440);
    
    // For mobile, allow it to be larger if in landscape
    if (viewportWidth > viewportHeight && viewportWidth <= 768) {
        canvasSize = Math.min(viewportWidth * 0.94, viewportHeight * 0.94);
    }
    
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    
    // Update constants based on new canvas size
    // Baseline: canvas 800x800, arena radius 388
    const scale = canvasSize / 800;
    ARENA_RADIUS = 388 * scale;
    CENTER_X = canvas.width / 2;
    CENTER_Y = canvas.height / 2;
    
    // If game is running, reposition players if they're outside bounds
    if (p1 && p2 && !gameOver && !inMenu) {
        // Keep players within arena bounds
        const repositionPlayer = (player) => {
            const distFromCenter = Math.sqrt((player.x - CENTER_X) ** 2 + (player.y - CENTER_Y) ** 2);
            if (distFromCenter > ARENA_RADIUS - BALL_RADIUS) {
                const angle = Math.atan2(player.y - CENTER_Y, player.x - CENTER_X);
                player.x = CENTER_X + Math.cos(angle) * (ARENA_RADIUS - BALL_RADIUS - 10);
                player.y = CENTER_Y + Math.sin(angle) * (ARENA_RADIUS - BALL_RADIUS - 10);
            }
        };
        repositionPlayer(p1);
        repositionPlayer(p2);
    }
}

// Handle window resize
window.addEventListener('resize', resizeCanvas);

// Initial resize after DOM loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', resizeCanvas);
} else {
    resizeCanvas();
}

// Start
showTitleScreen();
