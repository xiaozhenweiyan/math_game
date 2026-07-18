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
    const px = 4; // 像素单位

    // 纯白色数字"1"，使用像素艺术风格绘制
    // 网格：8列 x 12行（每格 4px = px）
    ctx.fillStyle = '#ffffff';

    // "1"的像素图案（8x12 网格）
    // 1 = 填充白色像素, 0 = 透明
    const pattern = [
        [0,0,1,1,1,0,0,0],  // 顶部斜线装饰（像数字1的衬线）
        [0,1,1,1,1,0,0,0],  // 斜线过渡
        [0,0,0,1,1,0,0,0],  // 收窄到竖线
        [0,0,0,1,1,0,0,0],  // 竖线
        [0,0,0,1,1,0,0,0],  // 竖线
        [0,0,0,1,1,0,0,0],  // 竖线
        [0,0,0,1,1,0,0,0],  // 竖线
        [0,0,0,1,1,0,0,0],  // 竖线
        [0,0,0,1,1,0,0,0],  // 竖线
        [0,0,0,1,1,0,0,0],  // 竖线
        [0,1,1,1,1,1,1,0],  // 底座横线
        [1,1,1,1,1,1,1,1],  // 底座加宽
    ];

    // 绘制像素图案
    for (let row = 0; row < pattern.length; row++) {
        for (let col = 0; col < pattern[row].length; col++) {
            if (pattern[row][col] === 1) {
                ctx.fillRect(
                    p.x + col * px,
                    p.y + row * px,
                    px,
                    px
                );
            }
        }
    }

    // 玩家底部阴影（在地上的投影，让角色有立体感）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(p.x - px, p.y + p.height, p.width + px * 2, px);
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
