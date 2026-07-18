// ==================== 游戏配置常量 ====================
const CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    FLOOR_Y: 500,
    FLOOR_HEIGHT: 4,
    FLOOR_HIGHLIGHT_HEIGHT: 1,
    FLOOR_SHADOW_HEIGHT: 2,
    BG_COLOR: '#1a1a2e',
    FLOOR_COLOR: '#ffffff',
    FLOOR_HIGHLIGHT_COLOR: 'rgba(255, 255, 255, 0.3)',
    FLOOR_SHADOW_COLOR: 'rgba(0, 0, 0, 0.3)',
    FPS: 60,
    PLAYER_WIDTH: 32,
    PLAYER_HEIGHT: 48,
    PLAYER_COLOR: '#ffd700',
    PLAYER_COLOR_DARK: '#b8860b',
    PLAYER_COLOR_LIGHT: '#ffec8b',
    PLAYER_START_X: 400,
    PLAYER_START_Y: 452,
    GRAVITY: 0.6,
    JUMP_FORCE: -14,
    MOVE_SPEED: 5,
    MAX_FALL_SPEED: 15,
    PEBBLE_SPACING: 60,
    PEBBLE_MIN_SIZE: 2,
    PEBBLE_MAX_SIZE: 6
};

// ==================== 游戏状态 ====================
const GameState = {
    START: 'start',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAMEOVER: 'gameover'
};

// ==================== 玩家工厂函数 ====================
function createPlayer(x, y) {
    return {
        x: x - CONFIG.PLAYER_WIDTH / 2,
        y: y,
        width: CONFIG.PLAYER_WIDTH,
        height: CONFIG.PLAYER_HEIGHT,
        velocityX: 0,
        velocityY: 0,
        isOnGround: true
    };
}

// ==================== 玩家更新函数 ====================
function updatePlayer(deltaTime) {
    if (!game.player) return;

    const p = game.player;
    const keys = game.input.keys;

    // 水平移动输入处理
    let moveX = 0;
    if (keys['a'] || keys['A'] || keys['ArrowLeft']) {
        moveX = -CONFIG.MOVE_SPEED;
    } else if (keys['d'] || keys['D'] || keys['ArrowRight']) {
        moveX = CONFIG.MOVE_SPEED;
    }
    p.velocityX = moveX;

    // 跳跃输入处理（只有在地面上才能跳）
    if ((keys['w'] || keys['W'] || keys['ArrowUp'] || keys[' ']) && p.isOnGround) {
        p.velocityY = CONFIG.JUMP_FORCE;
        p.isOnGround = false;
    }

    // 应用重力
    p.velocityY += CONFIG.GRAVITY;

    // 限制最大下落速度
    if (p.velocityY > CONFIG.MAX_FALL_SPEED) {
        p.velocityY = CONFIG.MAX_FALL_SPEED;
    }

    // 更新位置
    p.x += p.velocityX;
    p.y += p.velocityY;

    // 地板碰撞检测
    if (p.y + p.height >= CONFIG.FLOOR_Y) {
        p.y = CONFIG.FLOOR_Y - p.height;
        p.velocityY = 0;
        p.isOnGround = true;
    } else {
        p.isOnGround = false;
    }
}

// ==================== 相机更新函数 ====================
function updateCamera() {
    if (!game.player) return;

    // 相机水平跟随玩家，玩家始终在屏幕中央
    game.camera.x = game.player.x + game.player.width / 2 - CONFIG.CANVAS_WIDTH / 2;

    // 相机垂直不跟随，跳跃时玩家上下移动可见
    game.camera.y = 0;
}

// ==================== 伪随机函数（基于种子，相同x产生相同结果） ====================
function pseudoRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

// ==================== 游戏对象 ====================
const game = {
    canvas: null,
    ctx: null,
    state: GameState.START,
    lastTime: 0,
    deltaTime: 0,
    animationFrameId: null,
    player: null,
    camera: { x: 0, y: 0 },
    input: {
        keys: {},
        mouse: { x: 0, y: 0 }
    }
};

// ==================== DOM 元素 ====================
const startBtn = document.getElementById('start-btn');
const startScreen = document.getElementById('start-screen');
const gameScene = document.getElementById('game-scene');

// ==================== 初始化函数 ====================
function initGame() {
    game.canvas = document.getElementById('game-canvas');
    if (!game.canvas) {
        console.error('找不到 canvas 元素');
        return;
    }

    game.ctx = game.canvas.getContext('2d');
    if (!game.ctx) {
        console.error('无法获取 2D 上下文');
        return;
    }

    game.state = GameState.PLAYING;
    game.lastTime = performance.now();

    game.player = createPlayer(CONFIG.PLAYER_START_X, CONFIG.PLAYER_START_Y);

    console.log('游戏初始化完成');

    gameLoop();
}

// ==================== 游戏主循环 ====================
function gameLoop(currentTime = performance.now()) {
    game.animationFrameId = requestAnimationFrame(gameLoop);

    game.deltaTime = (currentTime - game.lastTime) / 1000;
    game.lastTime = currentTime;

    if (game.state === GameState.PLAYING) {
        update(game.deltaTime);
        render();
    }
}

// ==================== 更新逻辑 ====================
function update(deltaTime) {
    updatePlayer(deltaTime);
    updateCamera();
}

// ==================== 渲染函数 ====================
function render() {
    clearCanvas();
    renderBackground();
    renderFloor();
    renderPebbles();
    renderPlayer();
}

// ==================== 清空画布 ====================
function clearCanvas() {
    game.ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
}

// ==================== 渲染背景 ====================
function renderBackground() {
    game.ctx.fillStyle = CONFIG.BG_COLOR;
    game.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
}

// ==================== 渲染地板 ====================
function renderFloor() {
    const floorY = CONFIG.FLOOR_Y;

    // 地板是无限延伸的，所以总是画满整个屏幕宽度
    // 地板阴影（底部）
    game.ctx.fillStyle = CONFIG.FLOOR_SHADOW_COLOR;
    game.ctx.fillRect(
        0,
        floorY + CONFIG.FLOOR_HEIGHT,
        CONFIG.CANVAS_WIDTH,
        CONFIG.FLOOR_SHADOW_HEIGHT
    );

    // 地板主体
    game.ctx.fillStyle = CONFIG.FLOOR_COLOR;
    game.ctx.fillRect(
        0,
        floorY,
        CONFIG.CANVAS_WIDTH,
        CONFIG.FLOOR_HEIGHT
    );

    // 地板高光（顶部）
    game.ctx.fillStyle = CONFIG.FLOOR_HIGHLIGHT_COLOR;
    game.ctx.fillRect(
        0,
        floorY - CONFIG.FLOOR_HIGHLIGHT_HEIGHT,
        CONFIG.CANVAS_WIDTH,
        CONFIG.FLOOR_HIGHLIGHT_HEIGHT
    );
}

// ==================== 渲染石子 ====================
function renderPebbles() {
    const camX = game.camera.x;
    const floorY = CONFIG.FLOOR_Y;
    const spacing = CONFIG.PEBBLE_SPACING;

    // 计算当前可见范围内有多少颗石子
    const startIndex = Math.floor(camX / spacing) - 1;
    const endIndex = Math.ceil((camX + CONFIG.CANVAS_WIDTH) / spacing) + 1;

    for (let i = startIndex; i <= endIndex; i++) {
        // 基于索引的伪随机，保证同一位置总是相同的石子
        const seed = i * 12345.6789;
        const offsetX = pseudoRandom(seed) * spacing * 0.6;
        const sizeX = CONFIG.PEBBLE_MIN_SIZE + pseudoRandom(seed + 1) * (CONFIG.PEBBLE_MAX_SIZE - CONFIG.PEBBLE_MIN_SIZE);
        const sizeY = CONFIG.PEBBLE_MIN_SIZE + pseudoRandom(seed + 2) * (CONFIG.PEBBLE_MAX_SIZE - CONFIG.PEBBLE_MIN_SIZE);
        const yOffset = pseudoRandom(seed + 3) * 2;

        const worldX = i * spacing + offsetX;
        const screenX = worldX - camX;

        // 石子主体（深灰色）
        game.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        game.ctx.fillRect(
            screenX,
            floorY + CONFIG.FLOOR_HEIGHT + yOffset,
            sizeX,
            sizeY
        );

        // 石子顶部高光
        game.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        game.ctx.fillRect(
            screenX,
            floorY + CONFIG.FLOOR_HEIGHT + yOffset,
            sizeX,
            1
        );
    }
}

// ==================== 渲染玩家 ====================
function renderPlayer() {
    if (!game.player) return;

    const p = game.player;
    const ctx = game.ctx;
    const px = 4;

    // 世界坐标转换为屏幕坐标
    // 水平：玩家世界坐标 - 相机位置（玩家始终在屏幕水平中央）
    // 垂直：直接使用玩家 y 坐标（跳跃时上下移动可见）
    const screenX = p.x - game.camera.x;
    const screenY = p.y;

    // 玩家底部阴影（在地上的投影）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(screenX - px, screenY + p.height, p.width + px * 2, px);

    // 纯白色数字"1"，使用像素艺术风格绘制
    ctx.fillStyle = '#ffffff';

    const pattern = [
        [0,0,1,1,1,0,0,0],
        [0,1,1,1,1,0,0,0],
        [0,0,0,1,1,0,0,0],
        [0,0,0,1,1,0,0,0],
        [0,0,0,1,1,0,0,0],
        [0,0,0,1,1,0,0,0],
        [0,0,0,1,1,0,0,0],
        [0,0,0,1,1,0,0,0],
        [0,0,0,1,1,0,0,0],
        [0,0,0,1,1,0,0,0],
        [0,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1],
    ];

    for (let row = 0; row < pattern.length; row++) {
        for (let col = 0; col < pattern[row].length; col++) {
            if (pattern[row][col] === 1) {
                ctx.fillRect(
                    screenX + col * px,
                    screenY + row * px,
                    px,
                    px
                );
            }
        }
    }
}

// ==================== 输入系统（预留） ====================
function handleKeyDown(e) {
    game.input.keys[e.key] = true;
}

function handleKeyUp(e) {
    game.input.keys[e.key] = false;
}

function handleMouseMove(e) {
    if (!game.canvas) return;
    const rect = game.canvas.getBoundingClientRect();
    game.input.mouse.x = e.clientX - rect.left;
    game.input.mouse.y = e.clientY - rect.top;
}

// ==================== 事件监听 ====================
startBtn.addEventListener('click', () => {
    startScreen.style.display = 'none';
    gameScene.style.display = 'block';
    initGame();
});

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);
