#!/bin/zsh
# NeuroViz NiiVue 迁移：第1步 下载 NiiVue 库 + 清理旧方案文件
cd "$(dirname "$0")/.."

OUT="docs/vendor/niivue/niivue.umd.js"
mkdir -p docs/vendor/niivue

echo "==> 1/2 下载 NiiVue（依次尝试多个源，失败自动换下一个）"

echo "[源1] 国内 npm 镜像 npmmirror（不需要代理，通常最快）"
if curl -L -m 90 "https://registry.npmmirror.com/@niivue/niivue/latest" -o /tmp/niivue_pkg.json 2>/dev/null; then
  TARBALL=$(/opt/anaconda3/bin/python3 -c "import json;print(json.load(open('/tmp/niivue_pkg.json'))['dist']['tarball'])" 2>/dev/null)
  # npmmirror 返回的 tarball 地址同样是 npmmirror 域名
  if [ -n "$TARBALL" ]; then
    echo "    tarball: $TARBALL"
    curl -L -m 300 "$TARBALL" -o /tmp/niivue.tgz 2>/dev/null && tar -xzf /tmp/niivue.tgz -C /tmp package/dist/niivue.umd.js 2>/dev/null && cp /tmp/package/dist/niivue.umd.js "$OUT"
  fi
fi

if [ ! -s "$OUT" ]; then
  echo "[源2] jsdelivr + 代理7890"
  curl -L -m 300 -x http://127.0.0.1:7890 "https://cdn.jsdelivr.net/npm/@niivue/niivue@latest/dist/niivue.umd.js" -o "$OUT" 2>/dev/null
fi

if [ ! -s "$OUT" ]; then
  echo "[源3] unpkg + 代理7890"
  curl -L -m 300 -x http://127.0.0.1:7890 "https://unpkg.com/@niivue/niivue@latest/dist/niivue.umd.js" -o "$OUT" 2>/dev/null
fi

if [ ! -s "$OUT" ]; then
  echo "✗ 所有源均失败。请检查 VPN 是否连接正常，然后重跑本脚本。"
  echo "  （也可以手动在浏览器打开 https://cdn.jsdelivr.net/npm/@niivue/niivue@latest/dist/niivue.umd.js 另存为 $OUT）"
  exit 1
fi

echo "✓ 下载成功："
ls -la "$OUT"

echo ""
echo "==> 2/2 删除旧方案文件（OBJ 模型 / Three.js / 旧脚本）"
rm -rf docs/models
rm -rf docs/vendor/three
rm -f docs/js/three-brain.js
rm -f docs/generate_atlas_objs.py docs/prepare_atlases.py
rm -f docs/index.html.backup docs/server.log
rm -rf legacy
rm -f three-brain-fast.js test_permission.txt

echo "✓ 清理完成，当前项目体积："
du -sh docs
echo ""
echo "==> 下一步运行数据管线："
echo "    cd /Users/urmyhope-/Documents/NeuroViz"
echo "    python3 pipeline/prepare_niivue_data.py"
