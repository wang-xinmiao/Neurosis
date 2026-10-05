# NeuroViz - 多模态脑影像集成分析平台

大创项目：脑影像可视化分析平台，支持多种脑分区图谱的3D可视化。

## 文件夹结构说明

```
NeuroViz/
├── README.md                 ← 本说明文件
├── 2026脑影像大创立项报告.pdf  ← 立项报告
├── legacy/                   ← 旧版本备份（不要修改）
│   ├── index.html            ← 旧版主页面
│   ├── js/                   ← 旧版代码
│   ├── models/               ← 旧版3D模型
│   └── css/                  ← 旧版样式
└── docs/                     ← ★ 当前项目（GitHub Pages 发布目录）
    ├── index.html            ← 主页面（入口文件）
    ├── css/style.css         ← 页面样式
    ├── js/                   ← JavaScript 代码
    │   ├── app.js            ← 主应用逻辑
    │   ├── three-brain.js    ← 3D脑区渲染
    │   ├── charts.js         ← 图表功能
    │   ├── atlas_data.js     ← 脑分区图谱数据（4种图谱的名称/颜色）
    │   └── data.js           ← 皮层下结构等数据
    ├── models/               ← 3D脑模型（OBJ格式，很大）
    └── vendor/               ← 第三方库（勿改动）
        ├── three/            ← Three.js 3D渲染引擎
        ├── echarts/          ← ECharts 图表库
        └── font-awesome/     ← 图标库
```

## 团队协作

1. 拉取最新代码：`git pull`
2. 修改代码后提交：`git add .` → `git commit -m "说明"`
3. 推送到云端：`git push`
4. 等待1-2分钟，网页自动更新

## 网站地址

https://wang-xinmiao.github.io/Neurosis/

## 本地运行

```bash
cd docs
python3 -m http.server 8090
```
浏览器打开 http://localhost:8090
