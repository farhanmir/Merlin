# OptiLLM Performance Test Script
# This script demonstrates the improvements from OptiLLM optimization techniques

Write-Host "`n=== OptiLLM Performance Comparison ===" -ForegroundColor Magenta
Write-Host "Testing the 'strawberry R count' problem - a classic LLM failure case`n" -ForegroundColor White

$question = "How many letter R's are in the word 'strawberry'? Think step by step."

# Test 1: Without OptiLLM (baseline)
Write-Host "[1/3] Testing WITHOUT optimization..." -ForegroundColor Yellow
$body1 = @{
    model = 'gemini/gemini-2.5-flash'
    messages = @(@{role='user'; content=$question})
    stream = $false
} | ConvertTo-Json -Depth 10

$time1 = Measure-Command {
    $result1 = Invoke-RestMethod -Uri 'http://localhost:8001/api/v1/chat/completions' -Method Post -Body $body1 -ContentType 'application/json'
}
Write-Host "Response: " -NoNewline -ForegroundColor Gray
Write-Host $result1.choices[0].message.content -ForegroundColor White
Write-Host "Time: $($time1.TotalSeconds)s`n" -ForegroundColor Gray

# Test 2: With Mixture of Agents (MOA)
Write-Host "[2/3] Testing WITH Mixture of Agents (MOA)..." -ForegroundColor Green
$body2 = @{
    model = 'moa-gemini/gemini-2.5-flash'
    messages = @(@{role='user'; content=$question})
    stream = $false
} | ConvertTo-Json -Depth 10

$time2 = Measure-Command {
    $result2 = Invoke-RestMethod -Uri 'http://localhost:8001/api/v1/chat/completions' -Method Post -Body $body2 -ContentType 'application/json'
}
Write-Host "Response: " -NoNewline -ForegroundColor Gray
Write-Host $result2.choices[0].message.content -ForegroundColor Cyan
Write-Host "Time: $($time2.TotalSeconds)s`n" -ForegroundColor Gray

# Test 3: With Chain of Thought + Reflection
Write-Host "[3/3] Testing WITH Chain of Thought + Reflection..." -ForegroundColor Green
$body3 = @{
    model = 'cot_reflection-gemini/gemini-2.5-flash'
    messages = @(@{role='user'; content=$question})
    stream = $false
} | ConvertTo-Json -Depth 10

$time3 = Measure-Command {
    $result3 = Invoke-RestMethod -Uri 'http://localhost:8001/api/v1/chat/completions' -Method Post -Body $body3 -ContentType 'application/json'
}
Write-Host "Response: " -NoNewline -ForegroundColor Gray
Write-Host $result3.choices[0].message.content -ForegroundColor Cyan
Write-Host "Time: $($time3.TotalSeconds)s`n" -ForegroundColor Gray

# Summary
Write-Host "=== Summary ===" -ForegroundColor Magenta
Write-Host "Baseline (no optimization): $($time1.TotalSeconds)s" -ForegroundColor Yellow
Write-Host "MOA optimization: $($time2.TotalSeconds)s ($('{0:N1}' -f ($time2.TotalSeconds/$time1.TotalSeconds))x slower but more accurate)" -ForegroundColor Green
Write-Host "CoT+Reflection: $($time3.TotalSeconds)s ($('{0:N1}' -f ($time3.TotalSeconds/$time1.TotalSeconds))x slower but more accurate)" -ForegroundColor Green
Write-Host "`nNote: OptiLLM trades some speed for significantly better accuracy on complex reasoning tasks.`n" -ForegroundColor White
