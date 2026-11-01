#!/usr/bin/env python3
"""Generate Korean synthetic invocation guides from MIT-licensed MeloTTS, never impersonating monks."""
from __future__ import annotations
import hashlib, json, math, pathlib, subprocess, tempfile
import numpy as np
import soundfile as sf
from melo.api import TTS

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "audio" / "dharma-hall"
CATALOG = OUT / "catalog.json"
DATA = ROOT / "data" / "online-sansa.json"
PHRASES = {
  "daewung": ("석가모니불", "석가모니불 명호 낭독"),
  "geungnak": ("나무아미타불", "아미타불 명호 낭독"),
  "gwanum": ("관세음보살", "관세음보살 명호 낭독"),
  "munsu": ("나무문수보살", "문수보살 명호 낭독"),
  "yaksa": ("나무약사여래", "약사여래 명호 낭독"),
  "jijang": ("나무지장보살", "지장보살 명호 낭독"),
}
SOURCE = "https://huggingface.co/myshell-ai/MeloTTS-Korean"
LICENSE = "https://github.com/myshell-ai/MeloTTS/blob/main/LICENSE"

def check_audio(path):
  r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a:0",
                      "-show_entries", "stream=sample_rate,codec_name:format=duration",
                      "-of", "json", str(path)], capture_output=True, text=True, check=True)
  j = json.loads(r.stdout)
  duration = float(j["format"]["duration"])
  assert 15 <= duration <= 300, (path, duration)
  assert j["streams"][0]["codec_name"] == "mp3", (path, j)
  assert path.stat().st_size > 10000, path
  return duration

def main():
  torch_model = TTS(language="KR", device="cpu")
  speaker = torch_model.hps.data.spk2id["KR"]
  data = json.loads(DATA.read_text(encoding="utf-8"))
  tracks = json.loads(CATALOG.read_text(encoding="utf-8"))
  generated = []
  for hid, (phrase, title) in PHRASES.items():
    with tempfile.TemporaryDirectory() as work:
      file = pathlib.Path(work) / "synth.wav"
      # This is a synthesized *spoken* invocation, not a ritual chant recording.
      utterance = " ".join([phrase + "." for _ in range(22)])
      torch_model.tts_to_file(utterance, speaker, str(file), speed=0.86, quiet=True)
      audio, sr = sf.read(str(file), dtype="float32")
      if audio.ndim > 1: audio = audio.mean(axis=1)
      assert sr >= 16000 and len(audio) / sr >= 15, (hid, len(audio), sr)
      assert np.isfinite(audio).all() and np.sqrt(np.mean(audio**2)) > 0.005, hid
      dest = OUT / ("recitation-" + hid + ".mp3")
      subprocess.run(["ffmpeg", "-hide_banner", "-nostdin", "-loglevel", "error",
                      "-y", "-i", str(file), "-ar", "44100", "-ac", "1",
                      "-codec:a", "libmp3lame", "-b:a", "96k", str(dest)], check=True)
    duration = check_audio(dest)
    tid = "recitation-" + hid
    record = {
      "id": tid, "title": title + " · AI 합성 음성", "kind": "chant",
      "src": "./audio/dharma-hall/" + dest.name,
      "creator": "산사노트 · MeloTTS 한국어 합성 음성",
      "source": SOURCE, "originalMedia": "https://sansanote.com/audio/dharma-hall/" + dest.name,
      "license": "MIT (MeloTTS)", "licenseURL": LICENSE,
      "changes": "Original Korean invocation script, synthesized speech; not a monk's voice, live chant, or temple recording.",
      "description": "법당별 명호를 천천히 반복하는 한국어 합성 낭독. 실제 스님의 정근이나 의식 음원은 아닙니다.",
      "duration": round(duration, 3), "bytes": dest.stat().st_size,
      "sha256": hashlib.sha256(dest.read_bytes()).hexdigest(),
      "verified": True, "gain": 0.8, "allowedHalls": [hid]
    }
    generated.append(record)
    print(f"{hid}: {duration:.2f}s {record['bytes']} bytes")
  tracks = [t for t in tracks if not t["id"].startswith("recitation-")] + generated
  for hall in data["halls"]:
    hid = hall["id"]
    tid = "recitation-" + hid
    if tid not in hall["tracks"]: hall["tracks"].append(tid)
    for step in hall["sequence"]:
      if step["pose"] == "listen":
        step["track"] = tid
        step["offset"] = 0
        step["audioAt"] = step["start"]
        step["audioEnd"] = min(next(t["duration"] for t in generated if t["id"] == tid), step["end"] - step["start"])
    hall["syntheticRecitationId"] = tid
    hall["audioNote"] = "실제 스님이나 사찰의 정근 녹음이 아니라 한국어 AI 합성 명호 낭독입니다."
  CATALOG.write_text(json.dumps(tracks, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
  DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

if __name__ == "__main__":
  main()
