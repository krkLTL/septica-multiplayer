$ErrorActionPreference = "Continue"
$tests = @(
  "v002-endgame-regression.js",
  "v003-refill-regression.js",
  "v004-take-ownership-regression.js",
  "v005-cutting-regression.js",
  "v006-concession-regression.js",
  "v007-final-sequence-regression.js",
  "v008-scoring-regression.js",
  "v009-multiround-diagnostic.js"
)
Write-Host "=== SEPTICA DIAGNOSTIC SUITE ==="
$failed = 0
foreach ($test in $tests) {
  Write-Host ""
  Write-Host ">>> $test"
  node ".\tests\diagnostics\$test"
  if ($LASTEXITCODE -ne 0) { $failed++; Write-Host "FAIL: $test" }
}
Write-Host ""
if ($failed -eq 0) { Write-Host "=== ALL DIAGNOSTICS PASSED ==="; exit 0 }
Write-Host "=== $failed DIAGNOSTIC(S) FAILED ==="
exit 1
