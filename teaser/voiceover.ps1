# Step 2 of the teaser: make the voice-over with the Windows built-in voice (offline, free).
# Each line is saved as its own WAV and starts at a fixed time (seconds) that matches a scene in teaser.html.
# Run: powershell -File teaser/voiceover.ps1
Add-Type -AssemblyName System.Speech
$dir = Join-Path $PSScriptRoot 'audio'
New-Item -ItemType Directory -Force $dir | Out-Null

# start, max length in seconds (until the next line), text
$lines = @(
  @(0.6,  4.8, 'This is Rootine. Focus a little. Grow a lot.'),
  @(5.8,  4.2, 'Hard to stay focused? Rootine turns your focus time into a garden.'),
  @(10.3, 6.6, 'Pick a focus rhythm, from a quick sprint to deep work, and choose a seed. Focus longer to unlock trees.'),
  @(17.3, 6.2, 'Stay on task, and your plant grows with the timer. Give up, and it wilts.'),
  @(23.8, 6.7, 'Every finished session becomes a plant. Track your minutes, keep your streak, and earn badges.'),
  @(30.8, 5.7, 'Spend the coins you earn on a cozy yard, with a house, a fence, and even a cat.'),
  @(36.8, 2.9, 'And now, meet Rootie.'),
  @(39.8, 11.0, 'Your A.I. garden helper. Just ask how you are doing, and Rootie sums up your own progress in seconds: your focus time, your streak, and what to work on next.'),
  @(51.2, 4.3, 'Plus tasks, friends, a leaderboard, and dark mode.'),
  @(55.8, 4.2, 'Rootine. Start growing today. It is free.')
)

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voice = $synth.GetInstalledVoices() | Where-Object { $_.Enabled -and $_.VoiceInfo.Gender -eq 'Female' -and $_.VoiceInfo.Culture.Name -eq 'en-US' } | Select-Object -First 1
if ($voice) { $synth.SelectVoice($voice.VoiceInfo.Name) }
$format = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(24000, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)

$plan = @()
for ($i = 0; $i -lt $lines.Count; $i++) {
  $start, $max, $text = $lines[$i]
  $file = Join-Path $dir ("vo-{0:d2}.wav" -f $i)
  # Speak a little slower than normal, and speed up only if the line would run into the next one.
  foreach ($rate in 0, 1, 2, 3, 4) {
    $synth.Rate = $rate
    $synth.SetOutputToWaveFile($file, $format)
    $synth.Speak($text)
    $synth.SetOutputToNull()
    $seconds = ((Get-Item $file).Length - 44) / (24000 * 2)
    if ($seconds -le $max) { break }
  }
  $plan += [pscustomobject]@{ file = (Split-Path $file -Leaf); start = $start; seconds = [math]::Round($seconds, 2); max = $max; rate = $rate; text = $text }
}
$synth.Dispose()
$plan | ConvertTo-Json | Set-Content (Join-Path $dir 'voiceover.json') -Encoding UTF8
$plan | Format-Table start, seconds, max, rate, file -AutoSize
