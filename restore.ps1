$body = @"
[
  { "title": "옥상 우레탄 방수 시공", "image_data": "assets/images/case_roof_1_1.jpg", "display_order": 0 },
  { "title": "외벽 방수 시공", "image_data": "assets/images/case_wall_2_1.jpg", "display_order": 1 },
  { "title": "수영장 특수 방수 시공", "image_data": "assets/images/case_pool_3_1.png", "display_order": 2 },
  { "title": "목재 데크 및 외벽 방수 시공", "image_data": "assets/images/case_deck_4_1.jpg", "display_order": 3 },
  { "title": "상가 외벽 방수 시공", "image_data": "assets/images/case_exterior_5_1.jpg", "display_order": 4 },
  { "title": "고층 건물 외벽 방수 시공", "image_data": "assets/images/case_highrise_15_1.png", "display_order": 5 },
  { "title": "지붕 우레탄 방수 시공", "image_data": "assets/images/case_roof_7_1.png", "display_order": 6 },
  { "title": "건물 페인트 및 방수 시공", "image_data": "assets/images/case_paint_12_1.jpg", "display_order": 7 }
]
"@

$headers = @{
    "apikey" = "sb_secret_wTBy4gbFlASE6rT0w1oufg_VV_4Eco7"
    "Authorization" = "Bearer sb_secret_wTBy4gbFlASE6rT0w1oufg_VV_4Eco7"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
    "User-Agent" = "curl/7.68.0"
}

try {
    Invoke-RestMethod -Uri "https://ymgcvcmnwisszabcyisg.supabase.co/rest/v1/portfolios" -Method Post -Headers $headers -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
} catch {
    $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $ErrResp = $streamReader.ReadToEnd()
    $streamReader.Close()
    Write-Host $ErrResp
}
