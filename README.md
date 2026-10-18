# LiveShooting

AI live shooting feedback: the Live Shot Coach demo for CourtVision.

**Live app:** https://dillondbutler25.github.io/LiveShooting/


A phone-camera shooting coach. Prop up your iPhone, shoot, and after every rep it speaks one coaching cue: one thing you did well and the most important fix. It tracks 33 body points with MediaPipe Pose, entirely on the phone. No video is uploaded anywhere.

This is a standalone demo, kept separate from the main CourtVision prototype. If it tests well, `coach.js` (the grading engine) ports straight into CourtVision.

## Try it

Open the GitHub Pages link in **Safari** on an iPhone. The camera only works over https, so opening `index.html` as a file won't work.

1. Pick where the phone is: in front, behind, right side or left side.
2. Prop it about waist high, 10–15 feet away, in portrait, with your whole body and arms overhead in frame.
3. Turn the ringer on and the volume up, then tap **Start live coaching**.
4. Bring the ball to your waist between shots. That's how the coach knows a new shot is coming.

You can also grade a saved video with **Grade a saved video instead**.

## Files

| File | What it is |
|---|---|
| `index.html` | The app: camera, skeleton overlay, voice, setup and recap screens |
| `coach.js` | Shot detection, grading, and what the coach says. Every threshold is in `T` at the top with its source |
| `lines.js` | Every line the coach can say, including hype calls |
| `audio/` | Studio voice clips, one folder per voice. Re-record with `python3 tools/render_voices.py` |
| `RESEARCH.md` / `research.html` | What each check measures, from which angles, and the studies behind it. Rebuild the HTML with `python3 tools/build_research.py` |
| `tests/` | `node tests/run.mjs` runs 39 checks: simulated shots (good form plus specific flaws from every angle), voice-line coverage, and the hype rules (good form plus specific flaws from every angle) through the engine |
| `vendor/mediapipe/` | MediaPipe Tasks Vision 0.10.14 runtime (Apache 2.0) |
| `models/` | Pose landmarker models: `full` (accurate) and `lite` (fast) |
