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
    MAX_FALL_SPEED: 15
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

    // 左右边界限制
    if (p.x < 0) {
        p.x = 0;
    }
    if (p.x + p.width > CONFIG.CANVAS_WIDTH) {
        p.x = CONFIG.CANVAS_WIDTH - p.width;
    }

    // 地板碰撞检测
    if (p.y + p.height >= CONFIG.FLOOR_Y) {
        p.y = CONFIG.FLOOR_Y - p.height;
        p.velocityY = 0;
        p.isOnGround = true;
    } else {
        p.isOnGround = false;
    }
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
}

// ==================== 渲染函数 ====================
function render() {
    clearCanvas();
    renderBackground();
    renderFloor();
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

// ==================== 渲染玩家 ====================
function renderPlayer() {
    if (!game.player) return;

    const p = game.player;
    const ctx = game.ctx;
    const px = 4;

    // 角色主体阴影（底部）
    ctx.fillStyle = CONFIG.PLAYER_COLOR_DARK;
    ctx.fillRect(p.x + px, p.y + p.height - px, p.width - px, px);

    // 角色主体阴影（右侧）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(p.x + p.width - px, p.y + px, px, p.height - px);

    // 角色主体
    ctx.fillStyle = CONFIG.PLAYER_COLOR;
    ctx.fillRect(p.x, p.y, p.width - px, p.height - px);

    // 角色高光（顶部）
    ctx.fillStyle = CONFIG.PLAYER_COLOR_LIGHT;
    ctx.fillRect(p.x, p.y, p.width - px, px);

    // 角色高光（左侧）
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(p.x, p.y + px, px, p.height - px * 2);

    // 数字"1"像素图案
    ctx.fillStyle = '#ffffff';

    // 数字"1"的顶部点
    ctx.fillRect(p.x + p.width / 2 - px / 2, p.y + px * 2, px, px);

    // 数字"1"的竖线
    ctx.fillRect(p.x + p.width / 2 - px / 2, p.y + px * 4, px, p.height - px * 8);

    // 数字"1"的底部横线
    ctx.fillRect(p.x + px * 2, p.y + p.height - px * 4, p.width - px * 5, px);

    // 数字"1"的阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(p.x + p.width / 2 + px / 2, p.y + px * 4, px, p.height - px * 8);
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
