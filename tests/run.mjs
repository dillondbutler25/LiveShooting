// node tests/run.mjs — checks the shot engine against simulated shots.
import { ShotDetector, analyzeShot, Voice, summarize } from '../coach.js';
import { makeShot } from './sim.mjs';

let pass = 0, fail = 0;
function run(name, over, view, expect) {
  const frames = makeShot({ ...over, view });
  const shots = [];
  const det = new ShotDetector({ onShot: (s) => shots.push(s) });
  for (const f of frames) det.push(f);
  const res = shots.map((s) => analyzeShot(s, { view, hand: 'R' }));
  const fixes = res[0] && !res[0].error ? res[0].checks.filter((c) => c.status === 'fix').map((c) => c.id) : [];
  const okc = res[0] && !res[0].error ? res[0].checks.filter((c) => c.status === 'ok').map((c) => c.id) : [];
  let good = shots.length === (expect.shots ?? 1);
  for (const id of expect.fix || []) if (!fixes.includes(id)) good = false;
  if (expect.clean && fixes.length) good = false;
  for (const id of expect.notFix || []) if (fixes.includes(id)) good = false;
  const say = res[0] ? new Voice().compose(res[0]).say : '';
  console.log(`${good ? 'PASS' : 'FAIL'}  ${view.padEnd(5)} ${name.padEnd(28)} shots=${shots.length} fix=[${fixes}] ok=[${okc}]  "${say}"`);
  if (!good && res[0] && !res[0].error) console.log('      m=', JSON.stringify(res[0].m, (k, v) => (typeof v === 'number' ? +v.toFixed(3) : v)));
  good ? pass++ : fail++;
  return res;
}

const views = ['front', 'back', 'right', 'left'];
for (const v of views) run('good shot', {}, v, { clean: true });
for (const v of ['front', 'back', 'right']) run('set on top of head', { setWrist: { y: 0.42, z: 0.05 }, setElbow: { y: 0.24, z: 0.2 } }, v, { fix: ['setHeight'] });
for (const v of ['front', 'right']) run('shallow knees', { kneeMin: 158 }, v, { fix: ['knees'] });
for (const v of views) run('drops follow-through', { hold: 0.25 }, v, { fix: ['hold'] });
for (const v of ['front', 'back']) run('elbow flare', { setElbow: { x: 0.16 } }, v, { fix: ['elbow'] });
for (const v of ['front', 'back']) run('ball centered on head', { setWrist: { x: -0.24 }, setElbow: { x: -0.12 } }, v, { fix: ['setLat'] });
for (const v of ['front', 'back']) run('guide hand pushes', { guidePush: 0.2 }, v, { fix: ['guide'] });
for (const v of ['front', 'back']) run('drifts sideways', { drift: { x: 0.4 } }, v, { fix: ['drift'] });
for (const v of ['right', 'left']) run('fades back', { drift: { z: -0.25 } }, v, { fix: ['drift'] });
for (const v of ['right', 'left']) run('ball behind head', { setWrist: { z: -0.12 }, setElbow: { z: 0.12 } }, v, { fix: ['setBehind'] });
for (const v of ['right', 'left']) run('flat push release', { relElev: 38 }, v, { fix: ['arc'] });
for (const v of ['right', 'front']) run('arm not straight at release', { relBend: 0.12 }, v, { fix: ['ext'] });
for (const v of ['right', 'front']) run('late release (way down)', { tDip: -0.75, tLegs: -0.42 }, v, { fix: ['timing'] });
for (const v of ['right', 'front']) run('set shot, two-motion', { jump: 0, tDip: -0.8, tLegs: -0.5 }, v, { fix: ['timing'] });
for (const v of ['right']) run('no wrist snap', { snap: false }, v, { fix: ['snap'] });
run('feet out of frame', { legsVisible: false }, 'front', { notFix: ['knees', 'drift', 'base'] });

// Two shots back to back -> two detections.
{
  const a = makeShot({ view: 'front', tail: 1.8 }, 0);
  const b = makeShot({ view: 'front', hold: 0.3 }, 4.6);
  const shots = [];
  const det = new ShotDetector({ onShot: (s) => shots.push(s) });
  for (const f of [...a, ...b]) det.push(f);
  const res = shots.map((s) => analyzeShot(s, { view: 'front', hand: 'R' }));
  const ok = shots.length === 2;
  console.log(`${ok ? 'PASS' : 'FAIL'}  front two shots in a row          shots=${shots.length}`);
  ok ? pass++ : fail++;
  const sum = summarize(res);
  console.log('      summary:', sum.shots, 'shots, top fix:', sum.topFix && sum.topFix.id);
}

// Arms raised slowly and held (stretching) should not count as a shot.
{
  const fr = makeShot({ view: 'front' });
  // freeze arms overhead with no rise: overwrite wrists above head from the start
  for (const f of fr) { f.p[16] = { ...f.p[16], y: f.p[8].y - 80 }; f.p[14] = { ...f.p[14], y: f.p[12].y - 90 }; f.p[15] = { ...f.p[15], y: f.p[7].y - 80 }; }
  const shots = [];
  const det = new ShotDetector({ onShot: (s) => shots.push(s) });
  for (const f of fr) det.push(f);
  const ok = shots.length === 0;
  console.log(`${ok ? 'PASS' : 'FAIL'}  front arms held overhead (no shot)  shots=${shots.length}`);
  ok ? pass++ : fail++;
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
