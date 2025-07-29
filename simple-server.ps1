# Simple HTTP Server in PowerShell
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://localhost:8000/')
$listener.Start()
Write-Host 'Server started at http://localhost:8000/'
Write-Host 'Press Ctrl+C to stop'

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $localPath = $request.Url.LocalPath
        if ($localPath -eq '/') {
            $localPath = '/index.html'
        }
        
        $filePath = Join-Path (Get-Location) $localPath.TrimStart('/')
        
        Write-Host "Request: $($request.Url.ToString())"
        Write-Host "File path: $filePath"
        
        if (Test-Path $filePath -PathType Leaf) {
            try {
                $content = [System.IO.File]::ReadAllBytes($filePath)
                $extension = [System.IO.Path]::GetExtension($filePath).ToLower()
                
                switch ($extension) {
                    '.html' { $response.ContentType = 'text/html' }
                    '.css' { $response.ContentType = 'text/css' }
                    '.js' { $response.ContentType = 'application/javascript' }
                    '.json' { $response.ContentType = 'application/json' }
                    default { $response.ContentType = 'text/plain' }
                }
                
                $response.ContentLength64 = $content.Length
                $response.StatusCode = 200
                $response.OutputStream.Write($content, 0, $content.Length)
                Write-Host "Served: $filePath (200)"
            }
            catch {
                Write-Host "Error reading file: $_"
                $response.StatusCode = 500
            }
        }
        else {
            $response.StatusCode = 404
            $errorContent = [System.Text.Encoding]::UTF8.GetBytes('File not found')
            $response.ContentLength64 = $errorContent.Length
            $response.OutputStream.Write($errorContent, 0, $errorContent.Length)
            Write-Host "Not found: $filePath (404)"
        }
        
        $response.Close()
    }
}
finally {
    $listener.Stop()
    Write-Host 'Server stopped'
}