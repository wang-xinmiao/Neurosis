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

## 白质连接模块

当前版本使用 NiiVue 完成 TRX/TRK/TCK 数据解析，三维画面由独立的 Three.js
渲染层绘制，支持：

- 按主要通路查看弓状束、扣带束、皮质脊髓束、下纵束、上纵束、钩束、胼胝体和额枕下束。
- 纯黑科研渲染背景、抗锯齿、双层柔和发光和屏幕空间管状纤维。
- 经典方向着色：红色=左右，绿色=前后，蓝色=上下。
- 可调短流线过滤阈值、纤维粗细和显示比例。
- 可选玻璃脑外轮廓，并可关闭以获得更纯粹的白质视图。
- 单条通路聚焦：选中通路保持高亮，其他纤维降低透明度。
- 与默认模式、注意、执行控制和感觉运动网络做三维叠加。
- 在浏览器本地导入 `.trx`、`.trk`、`.tck` 或 `.vtk` 纤维束文件。
- 使用合并后的半透明 HCP 皮层网格显示彩色脑表面；可随时关闭以恢复灰度脑模板。
- 在“结构连接矩阵”中查看 AAL116 脑区之间的映射流线数量，并可按八类主要纤维束筛选。

为避免三维场景信息过载，皮层外壳使用低饱和蓝灰渐变；功能网络叠加默认关闭。
矩阵模式会隐藏三维控制与右侧纤维束列表，默认显示连接度最高的 16 个脑区，
可通过“显示脑区”滑块扩展到 32 个。

内置演示数据位于 `docs/data/tracts/yeh2022.trx`，来源和注意事项见同目录的
`README.md`。功能网络在当前版本中使用演示连接组，不代表真实个体的 fMRI
统计结果。

结构连接矩阵由 `docs/data/structural_connectivity.json` 提供。生成方法为：
读取 TRX 纤维束端点，在 MNI 空间中查找 8 mm 范围内最近的 AAL116 标签，
统计不同脑区标签之间的原始流线数。它用于教学和可视化演示，不等同于个体
受试者的连接概率或 FA 值。如需重新生成：

```bash
python pipeline/merge_cortex_shell.py
python pipeline/build_structural_connectivity.py
```

查看方式：

```bash
cd docs
python -m http.server 8090
```

浏览器打开 `http://localhost:8090`，点击顶部“白质连接”，等待纤维束加载完成
即可旋转、缩放、切换纤维束并调整叠加内容。不要直接双击 `index.html`，
因为浏览器会阻止本地页面读取 `data/` 中的医学影像文件。

性能说明：

- 离开“结构分区”模块时，页面会自动释放该模块约 390 个三维网格和 WebGL
  资源，避免与白质纤维束同时占用显存。
- 白质模块默认使用 25% 流线采样和 50 mm 短流线阈值。若电脑或集显仍然卡顿，
  可把“显示比例”调到 10%，并关闭玻璃脑或功能网络叠加。

## 本地运行

```bash
cd docs
python3 -m http.server 8090
```
浏览器打开 http://localhost:8090

## 多模态前端模块使用说明

- 功能网络：在“功能网络”中选择 Yeo7/Yeo17，使用球棒图查看节点与 FC 连接；连线为 Three.js `CylinderGeometry`，半径按权重映射到 0.3–2.0。节点透明碰撞球体和加粗拾取圆柱用于 Raycaster，点击节点/连线更新右侧详情并高亮 ROI。
- FC 热力图：行列顺序跟随当前图谱，按网络分组排序并绘制分组边框；色标固定为 [-1,1]，红色正相关、蓝色负相关。矩阵加载后自动检查全 1/全 0 异常，阈值滑块会弱化低值格子，点击格子联动球棒图和 NiiVue ROI 高亮。
- 白质连接：`.trk/.tck` 可导入，`readTRK/readTCK` 解析后使用 `downsampleStreamlines()` 抽稀；支持 FA/方向 RGB 着色和经典纤维束显隐。
- 激活图：三个正交切面共享 MNI 坐标 `[x,y,z]`，点击任一切面或拖动底部 X/Y/Z 滑块会同步切换三张解剖切片，并对坐标做 MNI 边界钳制；Z 阈值控制激活掩码。
- 所有 NIfTI 图谱/激活资源加载前校验 affine；图谱切换会清空旧选中、显隐和高亮状态。Schaefer7/Schaefer17 资源缺失时由资源管理器尝试后台下载，并使用下载锁避免重复请求。

### 核心代码

- `docs/js/network-resources.js`：资源下载锁、矩阵/标签/affine 校验、矩阵异常检测。
- `docs/js/network-renderer.js`：Three.js 球棒图、圆柱线宽映射、碰撞体拾取、共享相机场景。
- `docs/js/tract-renderer.js`：TRK/TCK 解析、纤维下采样、FA/方向着色。
- `docs/js/functional-network.js`：Yeo 映射、热力图校验、激活三切面坐标同步、状态管理。
