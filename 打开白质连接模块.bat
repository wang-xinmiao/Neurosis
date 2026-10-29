@echo off
chcp 65001 >nul
cd /d "%~dp0docs"

where python >nul 2>nul
if errorlevel 1 (
    echo 未找到 Python。请先安装 Python，或把本目录交给组员启动本地服务器。
    pause
    exit /b 1
)

powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8090/' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } } catch {}; Start-Process -FilePath 'python' -ArgumentList '-m','http.server','8090','--bind','127.0.0.1' -WorkingDirectory '%~dp0docs' -WindowStyle Hidden; Start-Sleep -Seconds 2"
start "" "http://127.0.0.1:8090/#module3"
exit
