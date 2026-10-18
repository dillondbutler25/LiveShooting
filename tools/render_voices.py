# Renders every coach line in lines.js to audio clips, one folder per studio voice.
#
#   pip install kokoro-onnx soundfile
#   download kokoro-v1.0.onnx + voices-v1.0.bin from
#   https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
#   python3 tools/render_voices.py --model <dir with those two files>
#
# Voice model: Kokoro-82M (Apache 2.0), https://huggingface.co/hexgrad/Kokoro-82M
# Clips are trimmed, loudness-matched (EBU R128, -16 LUFS), and saved as mono MP3.
import argparse, hashlib, json, os, subprocess, sys, tempfile, pathlib
import soundfile as sf

ROOT = pathlib.Path(__file__).resolve().parent.parent
VOICES = {  # folder name -> Kokoro voice id
    'michael': 'am_michael',
    'fenrir': 'am_fenrir',
    'puck': 'am_puck',
    'heart': 'af_heart',
    'bella': 'af_bella',
}
# Delivery per kind of line: hype a bit quicker, fixes at a clear, even pace.
SPEED = {'hype': 1.1, 'streak': 1.1, 'clean': 1.05, 'praise': 1.05, 'fix': 0.98, 'sys': 1.0}

def lines():
    js = "import('./lines.js').then(m=>process.stdout.write(JSON.stringify(m.LINES)))"
    return json.loads(subprocess.check_output(['node', '--input-type=module', '-e', js], cwd=ROOT))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--model', default='.')
    ap.add_argument('--only', help='comma list of voice folders')
    args = ap.parse_args()
    from kokoro_onnx import Kokoro
    k = Kokoro(os.path.join(args.model, 'kokoro-v1.0.onnx'), os.path.join(args.model, 'voices-v1.0.bin'))
    L = lines()
    voices = {n: v for n, v in VOICES.items() if not args.only or n in args.only.split(',')}
    for name, vid in voices.items():
        out = ROOT / 'audio' / name
        out.mkdir(parents=True, exist_ok=True)
        man_path = out / 'manifest.json'
        manifest = json.loads(man_path.read_text()) if man_path.exists() else {}
        done = 0
        for lid, text in L.items():
            h = hashlib.sha1(f'{vid}|{SPEED.get(lid.split(".")[0], 1)}|{text}'.encode()).hexdigest()[:10]
            mp3 = out / f'{lid}.mp3'
            if manifest.get(lid, {}).get('h') == h and mp3.exists():
                continue
            audio, sr = k.create(text, voice=vid, speed=SPEED.get(lid.split('.')[0], 1.0), lang='en-us')
            with tempfile.NamedTemporaryFile(suffix='.wav') as tmp:
                sf.write(tmp.name, audio, sr)
                # trim leading/trailing silence, then match loudness
                af = ('silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,'
                      'areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,'
                      'loudnorm=I=-16:TP=-1.5:LRA=11')
                subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', tmp.name, '-af', af,
                                '-ar', '24000', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '64k', str(mp3)], check=True)
            dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(mp3)]))
            manifest[lid] = {'h': h, 'dur': round(dur, 2)}
            done += 1
        for lid in list(manifest):
            if lid not in L:
                manifest.pop(lid); (out / f'{lid}.mp3').unlink(missing_ok=True)
        man_path.write_text(json.dumps(manifest, indent=0, sort_keys=True))
        print(f'{name}: {done} rendered, {len(manifest)} total', flush=True)

if __name__ == '__main__':
    main()
