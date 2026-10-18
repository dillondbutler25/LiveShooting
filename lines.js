// Every line the coach can say. One id = one recorded clip per studio voice.
// Ids ending in .1/.2/.3 are variants of the same cue; the coach rotates them so
// it doesn't sound like a loop. Change a line here, then re-render the clips with
// `python3 tools/render_voices.py`.
//
// How these are written (see RESEARCH.md, "How the coach talks"):
// - One cue per shot, under ~10 words. Coaches who correct only the key element
//   get better results than ones who correct everything.
// - Point at the target or an image when possible ("point it at the rim",
//   "reach into the cookie jar"). External-focus cues beat body-part checklists
//   in motor-learning research (Wulf).
// - Short sentences, contractions, a beat between praise and fix. That rhythm
//   is what makes it sound like a person talking, not a manual.
export const LINES = {
  // ---- hype: clean reps (form only; the camera can't see makes) ----
  'hype.1': "That's a big-time shot!",
  'hype.2': "You're built for this!",
  'hype.3': 'Ice in your veins!',
  'hype.4': "Let's go! That's huge!",
  'hype.5': "You've got that dog in you!",
  'hype.6': "You're not afraid of the moment!",
  'hype.7': 'Textbook! Run it back!',
  'hype.8': 'Pure form right there!',
  'hype.9': "That's a pro rep!",
  'hype.10': 'Smooth! Same shot, every time!',
  'hype.11': "That's the one! Lock it in!",
  'hype.12': 'Automatic!',
  'hype.13': 'Clean! Do it again!',
  'hype.14': 'Way to work! That looked easy!',

  'streak.3': "Three clean in a row! You're locked in!",
  'streak.5': "Five straight! That's a shooter right there!",
  'streak.8': "Eight in a row! You're on fire!",

  'clean.1': 'Clean shot.',
  'clean.2': "That's clean.",

  // ---- praise: one thing done well, said before the fix ----
  'praise.base.1': 'Good base.',
  'praise.base.2': 'Feet were set. Good.',
  'praise.drift.1': 'Landed balanced.',
  'praise.drift.2': 'Nice and balanced.',
  'praise.setHeight.1': 'Great set point.',
  'praise.setHeight.2': 'Set point looked right.',
  'praise.setBehind.1': 'Ball stayed out front. Good.',
  'praise.setLat.1': 'Ball on your shooting side. Good.',
  'praise.elbow.1': "Elbow's right under it.",
  'praise.elbow.2': 'Nice elbow.',
  'praise.line.1': 'Straight line to the rim.',
  'praise.timing.1': 'Great rhythm.',
  'praise.timing.2': 'Legs and arm together. Smooth.',
  'praise.guide.1': 'Quiet guide hand.',
  'praise.knees.1': 'Good legs.',
  'praise.knees.2': 'Nice knee bend.',
  'praise.ext.1': 'Nice tall finish.',
  'praise.arc.1': 'Good arc on the release.',
  'praise.hold.1': 'Love that hold.',
  'praise.hold.2': 'Held the finish. Good.',
  'praise.snap.1': 'Good wrist snap.',

  // ---- fixes: the one thing to change ----
  'fix.base.narrow.1': 'Widen your feet. About shoulder width.',
  'fix.base.narrow.2': 'Feet a little wider. Shoulder width.',
  'fix.base.wide.1': 'Feet are too wide. Bring them in to shoulder width.',
  'fix.base.ok.1': 'Set your feet about shoulder width.',
  'fix.drift.left.1': 'You drifted left. Land on your spot.',
  'fix.drift.left.2': 'Drifting left. Go straight up, land on your spot.',
  'fix.drift.right.1': 'You drifted right. Land on your spot.',
  'fix.drift.right.2': 'Drifting right. Go straight up, land on your spot.',
  'fix.drift.back.1': 'You faded back. Land on your spot, or a little forward.',
  'fix.drift.back.2': 'No fade. Jump up, not back.',
  'fix.drift.fwd.1': 'You flew forward. Go up, not out.',
  'fix.lean.1': 'You landed leaning back. Chest over your feet.',
  'fix.setHeight.high.1': 'Stop the ball at your forehead. Not on top of your head.',
  'fix.setHeight.high.2': 'Set it lower. You should see the rim under the ball.',
  'fix.setHeight.ok.1': "Set point's a touch high. Right above your eyebrow.",
  'fix.setHeight.low.1': 'Bring the ball up higher. Above your eyes.',
  'fix.setHeight.low.2': 'Get the ball up to your forehead before you let it go.',
  'fix.setBehind.1': 'Ball went behind your head. Keep it out front.',
  'fix.setBehind.2': 'Keep the ball in front of your forehead. Not behind it.',
  'fix.setLat.center.R.1': "Ball's in the middle of your head. Move it over your right eye.",
  'fix.setLat.center.L.1': "Ball's in the middle of your head. Move it over your left eye.",
  'fix.setLat.wide.R.1': "Ball's too far outside. Bring it in, over your right eye.",
  'fix.setLat.wide.L.1': "Ball's too far outside. Bring it in, over your left eye.",
  'fix.setLat.ok.R.1': 'Move the ball a little more over your right eye.',
  'fix.setLat.ok.L.1': 'Move the ball a little more over your left eye.',
  'fix.elbow.1': 'Elbow in. Point it at the rim.',
  'fix.elbow.2': 'Tuck that elbow. Right under the ball.',
  'fix.line.in.1': 'Your arm crossed your face. Shoot straight up your shooting side.',
  'fix.line.out.1': 'Your arm swung out. Straight line to the rim.',
  'fix.timing.late.1': "You're shooting on the way down. Let it go at the top.",
  'fix.timing.late.2': "Release at the top of your jump. Don't hang.",
  'fix.timing.gap.1': 'Legs and arm together. One smooth motion.',
  'fix.timing.gap.2': "Don't wait at the top. Legs and arm, together.",
  'fix.guide.1': 'Guide hand just rides along. No push.',
  'fix.guide.2': 'Quiet guide hand. Let your shooting hand do the work.',
  'fix.knees.shallow.1': 'Bend your knees more. Your legs are your power.',
  'fix.knees.shallow.2': 'Sit into it. Get your legs under the shot.',
  'fix.knees.ok.1': 'Sit into your shot a little more.',
  'fix.knees.deep.1': 'Too low. A quick, medium dip is plenty.',
  'fix.ext.1': 'Finish tall. Arm all the way straight.',
  'fix.ext.2': 'Reach up. Lock out that arm.',
  'fix.arc.1': 'Shoot up, not out. Reach for the top of the square.',
  'fix.arc.2': 'More arc. Finish high toward the rim.',
  'fix.hold.1': 'Hold your follow-through until it hits the rim.',
  'fix.hold.2': "Hold that finish. Don't drop it.",
  'fix.snap.1': 'Snap the wrist. Reach into the cookie jar.',
  'fix.snap.2': 'Snap it. Fingers point down at the rim.',

  // ---- system ----
  'sys.ready': "Coach is ready. Let's get it.",
  'sys.cantread': "Couldn't read that one. Stay in the frame.",
  'sys.smallthing': 'Small thing.',
  'sys.repeat': 'Third time in a row. Slow it down. Shoot a few close to the rim.',
  'sys.session': 'Good session. Check your recap.',
};

// All variant ids for a cue, e.g. variants('fix.hold') -> ['fix.hold.1', 'fix.hold.2']
export function variants(prefix) {
  return Object.keys(LINES).filter((k) => k.startsWith(prefix + '.') && /^\d+$/.test(k.slice(prefix.length + 1)));
}
