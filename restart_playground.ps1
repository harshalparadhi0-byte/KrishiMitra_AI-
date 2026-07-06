# Helper script to restart KrishiMitra playground on Windows

$Ports = @(8000, 18081, 8090)

foreach ($Port in $Ports) {
    Write-Host "Checking port $Port..."
    $Connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($Connections) {
        foreach ($Conn in $Connections) {
            $PIDToKill = $Conn.OwningProcess
            if ($PIDToKill) {
                Write-Host "Terminating process $PIDToKill on port $Port..."
                Stop-Process -Id $PIDToKill -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

Write-Host "Restarting dev server & playground..."
# Start uvicorn FastAPI app and agents-cli playground
Start-Process -NoNewWindow -FilePath "uv" -ArgumentList "run", "uvicorn", "app.fast_api_app:app", "--host", "0.0.0.0", "--port", "8000"
Start-Process -NoNewWindow -FilePath "uv" -ArgumentList "run", "agents-cli", "playground"
Write-Host "Playground started! Access at http://localhost:18081"
