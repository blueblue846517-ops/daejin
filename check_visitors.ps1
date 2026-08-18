$headers = @{
    "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZ2N2Y21ud2lzc3phYmN5aXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NzA2NDksImV4cCI6MjEwMjU0NjY0OX0._ICc_P7jiNY07K7Omu0WII_XOQyoc85A3KCXrt35jI0"
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZ2N2Y21ud2lzc3phYmN5aXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NzA2NDksImV4cCI6MjEwMjU0NjY0OX0._ICc_P7jiNY07K7Omu0WII_XOQyoc85A3KCXrt35jI0"
}
try {
    Invoke-RestMethod -Uri "https://ymgcvcmnwisszabcyisg.supabase.co/rest/v1/visitors?select=*" -Method Get -Headers $headers | ConvertTo-Json
} catch {
    $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    Write-Host $streamReader.ReadToEnd()
}
