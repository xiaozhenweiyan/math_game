# 像素数学大冒险 (Pixel Math Adventure)

一个复古深空像素风格的数学游戏，基于 HTML5 Canvas 开发。

## 游戏特色（当前版本）

- 复古深空像素风格 UI
- 开始界面
- 玩家角色（数字"1"）
- 基础移动控制（A/D 或方向键左右移动）
- 跳跃功能（W/↑/空格）
- 重力与碰撞检测

## 操作说明

| 按键 | 功能 |
|------|------|
| A / ← | 向左移动 |
| D / → | 向右移动 |
| W / ↑ / 空格 | 跳跃 |

## 如何运行

### 方式一：直接打开

直接在浏览器中打开 `index.html` 文件即可开始游戏。

### 方式二：本地服务器（推荐）

使用任意本地 HTTP 服务器运行，例如：

```bash
# Python 3
python3 -m http.server 8000

# Node.js (需要安装 http-server)
npx http-server -p 8000
```

然后在浏览器中访问 `http://localhost:8000`。

## 技术栈

- **HTML5** - 页面结构
- **CSS3** - 样式设计（复古像素风格）
- **JavaScript** - 游戏逻辑
- **Canvas API** - 游戏渲染

## 项目结构

```
.
├── index.html      # 主页面
├── css/
│   └── style.css   # 样式文件
├── js/
│   └── game.js     # 游戏逻辑
└── README.md       # 项目说明
```

## 部署到 GitHub Pages

1. 将项目推送到 GitHub 仓库
2. 进入仓库的 **Settings** → **Pages**
3. 在 **Build and deployment** 部分：
   - Source 选择 `Deploy from a branch`
   - Branch 选择 `main`（或 `master`），目录选择 `/ (root)`
4. 点击 **Save**
5. 等待几分钟后，即可通过 `https://<你的用户名>.github.io/<仓库名>/` 访问游戏

## 后续计划

- [ ] 数学玩法（加减乘除运算挑战）
- [ ] 关卡系统
- [ ] 敌人与障碍物
- [ ] 道具与收集品
- [ ] 分数系统
- [ ] 音效与背景音乐
- [ ] 更多角色皮肤
- [ ] 移动端适配

## License

MIT
