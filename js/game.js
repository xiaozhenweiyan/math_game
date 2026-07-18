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
    PLAYER_START_X: 400,
    PLAYER_START_Y: 452,
    GRAVITY: 0.6,
    JUMP_FORCE: -14,
    MOVE_SPEED: 5,
    MAX_FALL_SPEED: 15,
    PEBBLE_SPACING: 60,
    PEBBLE_MIN_SIZE: 2,
    PEBBLE_MAX_SIZE: 6,
    HOTBAR_SIZE: 10,
    NUMBER_ENTITY_SPAWN_DIST: 1000,
    NUMBER_ENTITY_SPACING: 200,
    NUMBER_ENTITY_SIZE: 28,
    MAX_STACK_SIZE: 100
};

// ==================== 游戏状态 ====================
const GameState = {
    START: 'start',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAMEOVER: 'gameover'
};

// ==================== 伪随机函数 ====================
function pseudoRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

// ==================== 玩家工厂函数 ====================
function createPlayer(x, y) {
    return {
        x: x - CONFIG.PLAYER_WIDTH / 2,
        y: y,
        width: CONFIG.PLAYER_WIDTH,
        height: CONFIG.PLAYER_HEIGHT,
        velocityX: 0,
        velocityY: 0,
        isOnGround: true,
        value: 1  // 玩家当前数字值，初始为1
    };
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
    // 物品栏：10个槽位，null表示空，否则 { value: 数字, count: 数量 }
    inventory: new Array(CONFIG.HOTBAR_SIZE).fill(null),
    selectedSlot: 0,
    // 世界中的数字实体
    numberEntities: [],
    // 已被捡过的槽位（永久记录，防止重复生成）
    collectedSlots: new Set(),
    input: {
        keys: {},
        mouse: { x: 0, y: 0 }
    }
};

// ==================== DOM 元素 ====================
const startBtn = document.getElementById('start-btn');
const startScreen = document.getElementById('start-screen');
const gameScene = document.getElementById('game-scene');
const hotbarSlots = document.querySelectorAll('.hotbar-slot');

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
    game.camera.y = 0;
}

// ==================== 数字实体生成 ====================
function spawnNumberEntities() {
    if (!game.player) return;

    const camX = game.camera.x;
    const spacing = CONFIG.NUMBER_ENTITY_SPACING;

    // 在玩家周围一定范围内生成数字实体（左右都生成，支持无穷远
    const startIndex = Math.floor((camX - CONFIG.NUMBER_ENTITY_SPAWN_DIST) / spacing);
    const endIndex = Math.ceil((camX + CONFIG.CANVAS_WIDTH + CONFIG.NUMBER_ENTITY_SPAWN_DIST) / spacing);

    for (let i = startIndex; i <= endIndex; i++) {
        if (i === 0) continue;

        // 检查这个位置是否已经被捡过（永久不再生成）
        if (game.collectedSlots.has(i)) continue;

        // 检查这个位置是否已经生成过实体
        const exists = game.numberEntities.some(e => e.slotIndex === i);
        if (exists) continue;

        // 伪随机决定是否生成（约50%概率）
        const randVal = pseudoRandom(i * 7777.7);
        if (randVal < 0.5) continue;

        // 生成 1-9 的随机数字
        const value = Math.floor(pseudoRandom(i * 9999.9) * 9) + 1;
        const offsetX = (pseudoRandom(i * 5555.5) - 0.5) * spacing * 0.5;
        const yOffset = Math.floor(pseudoRandom(i * 3333.3) * 100);

        game.numberEntities.push({
            x: i * spacing + offsetX,
            y: CONFIG.FLOOR_Y - CONFIG.NUMBER_ENTITY_SIZE - yOffset,
            width: CONFIG.NUMBER_ENTITY_SIZE,
            height: CONFIG.NUMBER_ENTITY_SIZE,
            value: value,
            slotIndex: i,
            collected: false,
            bobOffset: pseudoRandom(i * 1111.1) * Math.PI * 2
        });
    }

    // 清理远离的实体（超出范围太远的实体从数组移除，但不影响 collectedSlots 记录
    // 已捡过的位置永久保存在 collectedSlots 里，永远不会再生
    game.numberEntities = game.numberEntities.filter(e => {
        const dist = Math.abs(e.x - game.player.x);
        return dist < CONFIG.NUMBER_ENTITY_SPAWN_DIST * 3;
    });
}

// ==================== 数字实体碰撞检测（捡起） ====================
function updateNumberEntities() {
    if (!game.player) return;

    const p = game.player;

    for (let i = 0; i < game.numberEntities.length; i++) {
        const e = game.numberEntities[i];
        if (e.collected) continue;

        // AABB 碰撞检测
        if (p.x < e.x + e.width &&
            p.x + p.width > e.x &&
            p.y < e.y + e.height &&
            p.y + p.height > e.y) {

            // 尝试捡起：先找同类且未满的堆叠，再找空格
            const pickedUp = tryPickupItem(e.value);
            if (pickedUp) {
                // 记录这个位置已被捡过（永久不再生成）
                game.collectedSlots.add(e.slotIndex);
                e.collected = true;
                updateHotbarUI();
            }
        }
    }

    // 移除已收集的实体
    game.numberEntities = game.numberEntities.filter(e => !e.collected);
}

// ==================== 尝试捡起物品（堆叠逻辑） ====================
function tryPickupItem(value) {
    // 第一步：找同类且未满的槽位堆叠
    for (let i = 0; i < game.inventory.length; i++) {
        const slot = game.inventory[i];
        if (slot !== null && slot.value === value && slot.count < CONFIG.MAX_STACK_SIZE) {
            slot.count++;
            return true;
        }
    }

    // 第二步：找空槽位
    for (let i = 0; i < game.inventory.length; i++) {
        if (game.inventory[i] === null) {
            game.inventory[i] = { value: value, count: 1 };
            return true;
        }
    }

    // 背包满了
    return false;
}

// ==================== 使用物品（F键） ====================
function useSelectedItem() {
    const item = game.inventory[game.selectedSlot];
    if (item === null) return;

    // 玩家数字 + 物品数字
    game.player.value += item.value;

    // 堆叠数量减1
    item.count--;
    if (item.count <= 0) {
        game.inventory[game.selectedSlot] = null;
    }

    updateHotbarUI();
}

// ==================== 物品栏 UI 更新 ====================
function updateHotbarUI() {
    hotbarSlots.forEach((slot, index) => {
        const itemSpan = slot.querySelector('.slot-item');
        const countSpan = slot.querySelector('.slot-count');
        const item = game.inventory[index];

        if (item === null) {
            itemSpan.textContent = '';
            countSpan.textContent = '';
        } else {
            itemSpan.textContent = item.value;
            countSpan.textContent = item.count > 1 ? item.count : '';
        }

        if (index === game.selectedSlot) {
            slot.classList.add('selected');
        } else {
            slot.classList.remove('selected');
        }
    });
}

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
    game.camera.x = 0;
    game.camera.y = 0;
    game.inventory = new Array(CONFIG.HOTBAR_SIZE).fill(null);
    game.selectedSlot = 0;
    game.numberEntities = [];
    game.collectedSlots = new Set();

    updateHotbarUI();

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
    spawnNumberEntities();
    updateNumberEntities();
}

// ==================== 渲染函数 ====================
function render() {
    clearCanvas();
    renderBackground();
    renderFloor();
    renderPebbles();
    renderNumberEntities();
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

    game.ctx.fillStyle = CONFIG.FLOOR_SHADOW_COLOR;
    game.ctx.fillRect(0, floorY + CONFIG.FLOOR_HEIGHT, CONFIG.CANVAS_WIDTH, CONFIG.FLOOR_SHADOW_HEIGHT);

    game.ctx.fillStyle = CONFIG.FLOOR_COLOR;
    game.ctx.fillRect(0, floorY, CONFIG.CANVAS_WIDTH, CONFIG.FLOOR_HEIGHT);

    game.ctx.fillStyle = CONFIG.FLOOR_HIGHLIGHT_COLOR;
    game.ctx.fillRect(0, floorY - CONFIG.FLOOR_HIGHLIGHT_HEIGHT, CONFIG.CANVAS_WIDTH, CONFIG.FLOOR_HIGHLIGHT_HEIGHT);
}

// ==================== 渲染石子 ====================
function renderPebbles() {
    const camX = game.camera.x;
    const floorY = CONFIG.FLOOR_Y;
    const spacing = CONFIG.PEBBLE_SPACING;

    const startIndex = Math.floor(camX / spacing) - 1;
    const endIndex = Math.ceil((camX + CONFIG.CANVAS_WIDTH) / spacing) + 1;

    for (let i = startIndex; i <= endIndex; i++) {
        const seed = i * 12345.6789;
        const offsetX = pseudoRandom(seed) * spacing * 0.6;
        const sizeX = CONFIG.PEBBLE_MIN_SIZE + pseudoRandom(seed + 1) * (CONFIG.PEBBLE_MAX_SIZE - CONFIG.PEBBLE_MIN_SIZE);
        const sizeY = CONFIG.PEBBLE_MIN_SIZE + pseudoRandom(seed + 2) * (CONFIG.PEBBLE_MAX_SIZE - CONFIG.PEBBLE_MIN_SIZE);
        const yOffset = pseudoRandom(seed + 3) * 2;

        const worldX = i * spacing + offsetX;
        const screenX = worldX - camX;

        game.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        game.ctx.fillRect(screenX, floorY + CONFIG.FLOOR_HEIGHT + yOffset, sizeX, sizeY);

        game.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        game.ctx.fillRect(screenX, floorY + CONFIG.FLOOR_HEIGHT + yOffset, sizeX, 1);
    }
}

// ==================== 渲染数字实体 ====================
function renderNumberEntities() {
    const ctx = game.ctx;
    const camX = game.camera.x;
    const time = performance.now() / 500;

    for (let i = 0; i < game.numberEntities.length; i++) {
        const e = game.numberEntities[i];
        const screenX = e.x - camX;

        // 超出屏幕的不渲染
        if (screenX < -50 || screenX > CONFIG.CANVAS_WIDTH + 50) continue;

        // 浮动动画
        const bobY = Math.sin(time + e.bobOffset) * 4;
        const drawY = e.y + bobY;

        // 发光底圈
        ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
        ctx.beginPath();
        ctx.arc(screenX + e.width / 2, drawY + e.height / 2, e.width * 0.8, 0, Math.PI * 2);
        ctx.fill();

        // 数字方块背景
        ctx.fillStyle = '#2d2d44';
        ctx.fillRect(screenX, drawY, e.width, e.height);

        // 白色边框
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX, drawY, e.width, e.height);

        // 绘制数字
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(e.value.toString(), screenX + e.width / 2, drawY + e.height / 2);
    }
}

// ==================== 渲染玩家 ====================
function renderPlayer() {
    if (!game.player) return;

    const p = game.player;
    const ctx = game.ctx;

    // 世界坐标转换为屏幕坐标
    const screenX = p.x - game.camera.x;
    const screenY = p.y;

    // 玩家底部阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(screenX - 4, screenY + p.height, p.width + 8, 4);

    // 绘制玩家数字（支持任意数字，包括1000+）
    // 根据数字位数调整字体大小
    const valueStr = p.value.toString();
    const numDigits = valueStr.length;
    let fontSize = 40;
    if (numDigits === 2) fontSize = 36;
    else if (numDigits === 3) fontSize = 30;
    else if (numDigits >= 4) fontSize = 24;

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${fontSize}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // 数字阴影增加立体感
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur = 0;
    ctx.fillText(valueStr, screenX + p.width / 2, screenY + p.height / 2);
    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;
}

// ==================== 输入系统 ====================
function handleKeyDown(e) {
    game.input.keys[e.key] = true;

    // 数字键 1-0 选择物品栏槽位
    if (e.key >= '1' && e.key <= '9') {
        game.selectedSlot = parseInt(e.key) - 1;
        updateHotbarUI();
    } else if (e.key === '0') {
        game.selectedSlot = 9;
        updateHotbarUI();
    }

    // F 键使用物品
    if (e.key === 'f' || e.key === 'F') {
        useSelectedItem();
    }
}

function handleKeyUp(e) {
    game.input.keys[e.key] = false;
}

function handleWheel(e) {
    // 滚轮切换物品栏
    if (game.state !== GameState.PLAYING) return;

    if (e.deltaY > 0) {
        // 向下滚：下一个
        game.selectedSlot = (game.selectedSlot + 1) % CONFIG.HOTBAR_SIZE;
    } else {
        // 向上滚：上一个
        game.selectedSlot = (game.selectedSlot - 1 + CONFIG.HOTBAR_SIZE) % CONFIG.HOTBAR_SIZE;
    }
    updateHotbarUI();
    e.preventDefault();
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
document.addEventListener('wheel', handleWheel, { passive: false });
