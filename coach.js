// coach.js — shot detection + form grading for the Live Shot Coach demo.
// Pure logic, no DOM: index.html feeds it pose frames, it returns graded shots.
// Every threshold lives in T below, tagged with where it comes from.
// "src:" = a published study or coaching source (see RESEARCH.md).
// "demo:" = a starting value picked for this demo; tune it after real testing.

import { LINES, variants } from './lines.js';

export const L = {
  nose: 0, lEar: 7, rEar: 8, lSh: 11, rSh: 12, lEl: 13, rEl: 14, lWr: 15, rWr: 16,
  lIdx: 19, rIdx: 20, lHip: 23, rHip: 24, lKn: 25, rKn: 26, lAn: 27, rAn: 28,
};
const ARM = {
  L: { sh: L.lSh, el: L.lEl, wr: L.lWr, idx: L.lIdx },
  R: { sh: L.rSh, el: L.rEl, wr: L.rWr, idx: L.rIdx },
};

export const T = {
  // Knee bend at the bottom of the dip (inner knee angle, 180 = straight).
  // src: Cabarkapa 2021/2023 — proficient shooters ~104–115° in the prep phase.
  kneeGood: [95, 135], kneeOk: 145, kneeTooDeep: 85,
  // Elbow straightness at release. src: Cabarkapa 2023 — ~160–168° at release.
  extGood: 155, extOk: 145,
  // Set-point height: shooting wrist vs ear line, in "head units" (shoulder-to-ear height).
  // demo: wrist above ~0.6 units = ball sitting on top of the head (Ben's Fix #1).
  setHighFix: 0.6, setHighOk: 0.45, setLowFix: -0.75,
  // Side view: wrist behind the ear = ball behind the head.
  // src: Wissel (beginners shoot "from behind the head"); Engelland moved Kawhi's
  // release point from above his head to in front of his face. demo: values.
  setBehindFix: -0.3, setBehindOk: -0.12,
  // Front/back: where the set point sits sideways, in half-shoulder-widths toward
  // the shooting side. 0 = middle of the head. src: Ben's breakdown (ball "centered"),
  // jr.nba / Wissel (ball lined up with the shooting side). demo: values.
  latCenterFix: 0.0, latGood: 0.1, latWideFix: 1.3,
  // Elbow flare: forearm tilt from vertical, elbow outside the wrist (front/back).
  // src: Cabarkapa 2021 — forearm closest to vertical separated makes from misses.
  // demo: degrees.
  flareOk: 12, flareFix: 22,
  // Release shot line: wrist vs shooting shoulder at release (front/back). demo.
  lineOk: 0.45, lineFix: 0.7,
  // Arm angle at release, side view, degrees above horizontal. demo, based on
  // ~50–55° ball release angles (Cabarkapa 2021, Satern 1993) and "shoot up".
  armFix: 52, armOk: 60,
  // Timing. src: Satern 1993 (release around the jump peak), Podmenik 2021 (elite
  // shooters release 0–0.12 s after the peak at short/mid range), Ben's Fix #4
  // (legs finish, then the arm fires). demo: cut-offs.
  apexLateOk: 0.12, apexLateFix: 0.2, legGapOk: 0.22, legGapFix: 0.35,
  // Follow-through hold, seconds arm stays up after release.
  // src: Breakthrough / Wissel — hold it until the ball reaches the rim. demo: seconds.
  holdGood: 0.7, holdOk: 0.5,
  // Guide hand push, in half-shoulder-widths (front/back) or head units (side). demo.
  guideOk: 0.3, guideFix: 0.45, guideFwdFix: 0.6,
  // Feet width = ankle gap / shoulder gap. src: Wissel, Breakthrough (shoulder width). demo range.
  baseNarrowFix: 0.55, baseGood: [0.75, 1.5], baseWideFix: 1.9,
  // Drift from takeoff to landing, metres. src: Breakthrough ("land a few inches in
  // front"); Podmenik 2021 (elite 21–49 cm forward on jumpers, sideways drift grows
  // with distance). demo: cut-offs.
  sideDriftOk: 0.18, sideDriftFix: 0.3, backFix: -0.08, fwdFix: 0.65,
  leanBackFix: 15,
  jumpMin: 0.05, // metres of hip rise that counts as a jump shot
};

// ---------- geometry ----------
const vis = (p) => (p ? (p.v ?? 1) : 0);
const ok = (p, min = 0.45) => p && vis(p) >= min;
function angle3(a, b, c) {
  if (!a || !b || !c) return NaN;
  const u = [a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0)];
  const w = [c.x - b.x, c.y - b.y, (c.z || 0) - (b.z || 0)];
  const d = u[0] * w[0] + u[1] * w[1] + u[2] * w[2];
  const n = Math.hypot(...u) * Math.hypot(...w);
  return n ? (Math.acos(Math.max(-1, Math.min(1, d / n))) * 180) / Math.PI : NaN;
}
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: ((a.z || 0) + (b.z || 0)) / 2, v: Math.min(vis(a), vis(b)) });
function median(arr) {
  const a = arr.filter((v) => Number.isFinite(v)).sort((x, y) => x - y);
  if (!a.length) return NaN;
  const m = a.length >> 1;
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}
function std(arr) {
  const a = arr.filter(Number.isFinite);
  if (a.length < 2) return NaN;
  const m = a.reduce((s, v) => s + v, 0) / a.length;
  return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1));
}

// Joint angle: 3D world landmarks when present (more reliable), else image plane.
function jointAngle(f, a, b, c) {
  if (f.w) {
    const r = angle3(f.w[a], f.w[b], f.w[c]);
    if (Number.isFinite(r)) return r;
  }
  return angle3(f.p[a], f.p[b], f.p[c]);
}
function kneeAngle(f) {
  const vals = [];
  if (ok(f.p[L.lKn]) && ok(f.p[L.lAn], 0.35)) vals.push(jointAngle(f, L.lHip, L.lKn, L.lAn));
  if (ok(f.p[L.rKn]) && ok(f.p[L.rAn], 0.35)) vals.push(jointAngle(f, L.rHip, L.rKn, L.rAn));
  return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : NaN;
}
const elbowAngle = (f, arm) => jointAngle(f, arm.sh, arm.el, arm.wr);
function earY(f) {
  const a = f.p[L.lEar], b = f.p[L.rEar];
  if (ok(a, 0.3) && ok(b, 0.3)) return (a.y + b.y) / 2;
  if (ok(a, 0.3)) return a.y;
  if (ok(b, 0.3)) return b.y;
  return f.p[L.nose].y;
}
const shMid = (f) => mid(f.p[L.lSh], f.p[L.rSh]);
const hipMid = (f) => mid(f.p[L.lHip], f.p[L.rHip]);

// One Euro–style light smoothing so jitter doesn't fake movement.
export class Smoother {
  constructor(alpha = 0.55) { this.a = alpha; this.prev = null; }
  apply(pts) {
    if (!this.prev || this.prev.length !== pts.length) { this.prev = pts.map((p) => ({ ...p })); return this.prev; }
    this.prev = pts.map((p, i) => {
      const q = this.prev[i];
      return { x: q.x + this.a * (p.x - q.x), y: q.y + this.a * (p.y - q.y), z: (q.z || 0) + this.a * ((p.z || 0) - (q.z || 0)), v: p.v };
    });
    return this.prev;
  }
  reset() { this.prev = null; }
}

// ---------- shot detection ----------
// A shot = a wrist that was below the shoulders rises above the ears with the
// elbow nearly straight. Then we keep recording ~1.25 s for the follow-through
// and landing before grading.
export class ShotDetector {
  constructor(opts = {}) {
    this.post = opts.post ?? 1.25;
    this.keep = 4.5;
    this.frames = [];
    this.state = 'arming';
    this.pending = null;
    this.lastLowT = -1e9;
    this.onShot = opts.onShot || (() => {});
  }
  reset() { this.frames = []; this.state = 'arming'; this.pending = null; this.lastLowT = -1e9; }
  push(f) {
    // f = { t, p: [33 {x,y,v}] image px, w: [33 {x,y,z}] metres or null }
    const last = this.frames[this.frames.length - 1];
    if (last && f.t <= last.t) { this.frames = []; this.state = 'arming'; this.pending = null; } // clock jumped back
    this.frames.push(f);
    while (this.frames.length && f.t - this.frames[0].t > this.keep) this.frames.shift();
    const sh = shMid(f);
    const bothLow = ['L', 'R'].every((s) => f.p[ARM[s].wr].y > sh.y);
    if (bothLow) this.lastLowT = f.t;

    if (this.state === 'arming') {
      if (bothLow) this.state = 'ready';
      return null;
    }
    if (this.state === 'ready') {
      const ey = earY(f);
      const H = Math.max(1, sh.y - ey);
      let best = null;
      for (const s of ['L', 'R']) {
        const arm = ARM[s];
        const wr = f.p[arm.wr];
        if (!ok(wr, 0.4) || !ok(f.p[arm.el], 0.4)) continue;
        const above = (ey - wr.y) / H;
        if (above < 0.1) continue;
        const el = elbowAngle(f, arm);
        if (el < 128) continue; // low enough to still catch bent-arm push shots
        if (!best || wr.y < f.p[ARM[best].wr].y) best = s;
      }
      if (best && f.t - this.lastLowT < 1.6) {
        this.state = 'collecting';
        this.pending = { side: best, tTrig: f.t };
      }
      return null;
    }
    if (this.state === 'collecting') {
      if (f.t - this.pending.tTrig >= this.post) {
        const shot = { side: this.pending.side, tTrig: this.pending.tTrig, frames: this.frames.slice() };
        this.state = 'cooldown';
        this.pending = null;
        this.onShot(shot);
        return shot;
      }
      return null;
    }
    if (this.state === 'cooldown') {
      if (bothLow) this.state = 'ready';
    }
    return null;
  }
}

// ---------- grading ----------
// view: 'front' | 'back' | 'left' | 'right'  (which side of the shooter the camera sees)
// hand: 'R' | 'L' (the player's stated shooting hand; used for wording only)
export function analyzeShot(shot, cfg) {
  const { view, hand = 'R' } = cfg;
  const side = view === 'front' || view === 'back' ? 'frontal' : 'side';
  const arm = ARM[shot.side];
  const off = ARM[shot.side === 'L' ? 'R' : 'L'];
  const F = shot.frames.filter((f) => f.t >= shot.tTrig - 1.9);
  const at = (t) => F.reduce((b, f) => (Math.abs(f.t - t) < Math.abs(b.t - t) ? f : b), F[0]);
  const range = (a, b) => F.filter((f) => f.t >= a && f.t <= b);
  const notes = [];
  const m = { fps: NaN };
  if (F.length < 12) return { error: 'Not enough frames to grade that shot. Try better light or Fast mode.' };
  m.fps = (F.length - 1) / (F[F.length - 1].t - F[0].t);

  // Release = moment the shooting elbow is straightest just after the trigger.
  const relWin = range(shot.tTrig - 0.12, shot.tTrig + 0.3);
  let tRel = shot.tTrig, extMax = -1;
  for (const f of relWin) {
    const e = elbowAngle(f, arm);
    if (e > extMax) { extMax = e; tRel = f.t; }
  }
  for (const f of relWin) { if (elbowAngle(f, arm) >= extMax - 4) { tRel = f.t; break; } }
  m.ext = extMax;

  // Scales.
  const pre = range(tRel - 1.8, tRel);
  const H = median(pre.map((f) => shMid(f).y - earY(f)));
  const halfSW = median(pre.map((f) => dist(f.p[L.lSh], f.p[L.rSh]) / 2));
  const legPx = median(pre.map((f) => (dist(f.p[L.lHip], f.p[L.lAn]) + dist(f.p[L.rHip], f.p[L.rAn])) / 2));
  const legM = median(pre.filter((f) => f.w).map((f) => (dist3(f.w[L.lHip], f.w[L.lAn]) + dist3(f.w[L.rHip], f.w[L.rAn])) / 2));
  const mpp = Number.isFinite(legM) && legPx > 0 ? legM / legPx : 0.85 / (legPx || 1);
  const legsVisible = pre.filter((f) => ok(f.p[L.lAn], 0.5) || ok(f.p[L.rAn], 0.5)).length > pre.length * 0.6;
  if (!legsVisible) notes.push('Feet out of view, so leg checks were skipped. Step back or tilt the phone down.');

  // Facing direction in side views: +1 if the shooter faces image-right.
  let facing = 1;
  if (side === 'side') {
    const s = median(pre.map((f) => f.p[L.nose].x - (f.p[L.lEar].x + f.p[L.rEar].x) / 2));
    facing = s >= 0 ? 1 : -1;
  }
  // Outward = from the body's middle toward the shooting shoulder, in image x.
  const outward = Math.sign(median(pre.map((f) => f.p[arm.sh].x - shMid(f).x))) || 1;

  // Dip = deepest knee bend before release.
  let tDip = NaN, kneeMin = NaN;
  if (legsVisible) {
    for (const f of range(tRel - 1.6, tRel)) {
      const k = kneeAngle(f);
      if (Number.isFinite(k) && !(k >= kneeMin)) { kneeMin = k; tDip = f.t; }
    }
  }
  m.knee = kneeMin;

  // Legs straight again after the dip.
  let tLegs = NaN;
  if (Number.isFinite(tDip)) {
    for (const f of range(tDip, tRel + 0.4)) { if (kneeAngle(f) >= 158) { tLegs = f.t; break; } }
  }

  // Jump: hip rise above standing height.
  const standing = range(tRel - 1.9, Number.isFinite(tDip) ? tDip : tRel - 0.5).filter((f) => kneeAngle(f) > 155);
  const baseY = median((standing.length ? standing : range(tRel - 1.9, tRel - 1.2)).map((f) => hipMid(f).y));
  let apexY = Infinity, tApex = NaN;
  for (const f of range(Number.isFinite(tDip) ? tDip : tRel - 0.6, tRel + 0.7)) {
    const y = hipMid(f).y;
    if (y < apexY) { apexY = y; tApex = f.t; }
  }
  m.jump = Number.isFinite(baseY) ? (baseY - apexY) * mpp : NaN;
  const jumped = legsVisible && m.jump >= T.jumpMin;
  let tLand = F[F.length - 1].t;
  if (jumped) {
    for (const f of range(tApex, tRel + 1.3)) { if (hipMid(f).y >= baseY - 0.03 / mpp) { tLand = f.t; break; } }
  }
  m.relVsApex = jumped ? tRel - tApex : NaN;
  m.legGap = Number.isFinite(tLegs) ? tRel - tLegs : NaN;

  // Set point = the launch moment: the last frame before release where the
  // shooting elbow is still near its most-bent angle. After this the arm fires.
  // Walk back from release while the elbow is still straightening fast
  // (> 150°/s). The first slow frame is where the shot launched from.
  const win = range(tRel - 1.0, tRel);
  const eA = win.map((f) => elbowAngle(f, arm));
  let fSet = null;
  for (let i = win.length - 2; i >= 2; i--) {
    const v = (eA[i + 1] - eA[i - 2]) / (win[i + 1].t - win[i - 2].t);
    if (v < 150) { fSet = win[i]; break; }
  }
  fSet = fSet || at(tRel - 0.25);
  const elSet = elbowAngle(fSet, arm);
  m.lowSet = fSet.p[arm.wr].y > fSet.p[arm.sh].y;
  m.elbowAtSet = elSet;
  m.setHeight = (earY(fSet) - fSet.p[arm.wr].y) / H;
  if (side === 'side') {
    // Furthest-back the wrist gets around the launch (ball behind the head at any point).
    const earX = (f) => (ok(f.p[shot.side === 'L' ? L.lEar : L.rEar], 0.3) ? f.p[shot.side === 'L' ? L.lEar : L.rEar].x : (f.p[L.lEar].x + f.p[L.rEar].x) / 2);
    const around = range(fSet.t - 0.15, Math.min(fSet.t + 0.1, tRel - 0.05)).filter((f) => f.p[arm.wr].y < f.p[arm.sh].y);
    m.setForward = Math.min(((fSet.p[arm.wr].x - earX(fSet)) * facing) / H, ...around.map((f) => ((f.p[arm.wr].x - earX(f)) * facing) / H));
  } else {
    m.setLateral = ((fSet.p[arm.wr].x - shMid(fSet).x) * outward) / halfSW;
    const dx = (fSet.p[arm.el].x - fSet.p[arm.wr].x) * outward;
    const dy = fSet.p[arm.el].y - fSet.p[arm.wr].y;
    m.flare = dy > 0 ? (Math.atan2(dx, dy) * 180) / Math.PI : NaN;
  }

  // Release geometry.
  const fRel = at(tRel);
  if (side === 'side') {
    const s = fRel.p[arm.sh], w = fRel.p[arm.wr];
    m.armAngle = (Math.atan2(s.y - w.y, (w.x - s.x) * facing) * 180) / Math.PI;
  } else {
    m.releaseLine = ((fRel.p[arm.wr].x - fRel.p[arm.sh].x) * outward) / halfSW;
  }

  // Follow-through hold: arm stays up and long after release.
  let tDrop = F[F.length - 1].t;
  for (const f of range(tRel, tRel + 2)) {
    if (f.p[arm.wr].y > earY(f) || elbowAngle(f, arm) < 120) { tDrop = f.t; break; }
  }
  m.hold = tDrop - tRel;
  m.holdCapped = tDrop >= F[F.length - 1].t - 1e-6;

  // Wrist snap, side view only: fingers point down after release.
  if (side === 'side') {
    const post = range(tRel + 0.1, tRel + 0.6).filter((f) => ok(f.p[arm.idx], 0.4) && ok(f.p[arm.wr], 0.5));
    if (post.length >= 3) {
      const fl = post.filter((f) => f.p[arm.idx].y > f.p[arm.wr].y + 0.12 * dist(f.p[arm.el], f.p[arm.wr]));
      m.snap = fl.length / post.length;
    }
  }

  // Guide hand.
  const offVisible = ok(fSet.p[off.wr], 0.5) && ok(fRel.p[off.wr], 0.5);
  if (offVisible) {
    const pushWin = range(fSet.t, tRel + 0.2);
    if (side === 'frontal') {
      // Measured against the shoulders so drifting in the air doesn't count.
      const x0 = fSet.p[off.wr].x - shMid(fSet).x;
      // Toward the shooting side = pushing across the ball.
      m.guidePush = Math.max(0, ...pushWin.map((f) => ((f.p[off.wr].x - shMid(f).x - x0) * outward) / halfSW));
    } else {
      const d0 = (fSet.p[off.wr].x - fSet.p[off.sh].x) * facing;
      const pushes = pushWin.filter((f) => elbowAngle(f, off) >= 150);
      m.guidePush = pushes.length ? Math.max(0, ...pushes.map((f) => ((f.p[off.wr].x - f.p[off.sh].x) * facing - d0) / H)) : 0;
    }
  }

  // Base width (front/back), at the dip.
  if (side === 'frontal' && legsVisible) {
    const fd = Number.isFinite(tDip) ? at(tDip) : at(tRel - 0.4);
    m.base = dist(fd.p[L.lAn], fd.p[L.rAn]) / (2 * halfSW);
  }

  // Drift takeoff -> landing, metres in image plane.
  if (legsVisible) {
    const f0 = Number.isFinite(tDip) ? at(tDip) : at(tRel - 0.4);
    const f1 = at(jumped ? tLand : tRel + 0.5);
    const dx = (hipMid(f1).x - hipMid(f0).x) * mpp;
    if (side === 'side') m.driftFwd = dx * facing;
    else m.driftSide = dx;
    if (side === 'side') {
      const fl = at(Math.min(tLand + 0.1, F[F.length - 1].t));
      const s = shMid(fl), h = hipMid(fl);
      m.leanBack = (-Math.atan2((s.x - h.x) * facing, h.y - s.y) * 180) / Math.PI; // + = leaning back
    }
  }

  const checks = gradeChecks(m, { view, side, hand, jumped, legsVisible, outward });
  return { m, checks, notes, side: shot.side, tRel };
}
const dist3 = (a, b) => (a && b ? Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0)) : NaN);

// ---------- checks -> statuses ----------
// Each check carries `key` (the fix line prefix in lines.js) and `pkey` (its praise prefix).
const fin = Number.isFinite;
const say1 = (prefix) => LINES[prefix + '.1'] || LINES[prefix] || '';
function gradeChecks(m, c) {
  const out = [];
  const H = c.hand === 'L' ? 'L' : 'R';
  const add = (id, area, weight, status, sev, detail, key, pkey) =>
    out.push({ id, area, weight, status, sev, detail, key, pkey, cue: say1(key), praise: say1(pkey) });

  // Balance & base
  if (c.side === 'frontal' && fin(m.base)) {
    const b = m.base, d = `Feet ${b.toFixed(2)}× shoulder width`;
    if (b < T.baseNarrowFix) add('base', 'Base', 1, 'fix', 0.6, d, 'fix.base.narrow', 'praise.base');
    else if (b > T.baseWideFix) add('base', 'Base', 1, 'fix', 0.5, d, 'fix.base.wide', 'praise.base');
    else add('base', 'Base', 1, b >= T.baseGood[0] && b <= T.baseGood[1] ? 'good' : 'ok', 0.2, d, 'fix.base.ok', 'praise.base');
  }
  if (fin(m.driftSide)) {
    const d = Math.abs(m.driftSide);
    // Image +x is the shooter's left in a front view, right in a back view.
    const towardLeft = c.view === 'front' ? m.driftSide > 0 : m.driftSide < 0;
    const dir = towardLeft ? 'left' : 'right';
    const st = d > T.sideDriftFix ? 'fix' : d > T.sideDriftOk ? 'ok' : 'good';
    add('drift', 'Balance', 1, st, Math.min(1, d / 0.5), `Drifted ${(d * 100).toFixed(0)} cm ${dir}`, `fix.drift.${dir}`, 'praise.drift');
  }
  if (fin(m.driftFwd)) {
    const d = m.driftFwd;
    if (d < T.backFix) add('drift', 'Balance', 1, 'fix', Math.min(1, -d / 0.3), `Faded back ${(-d * 100).toFixed(0)} cm`, 'fix.drift.back', 'praise.drift');
    else if (d > T.fwdFix) add('drift', 'Balance', 1, 'fix', 0.5, `Jumped forward ${(d * 100).toFixed(0)} cm`, 'fix.drift.fwd', 'praise.drift');
    else add('drift', 'Balance', 1, 'good', 0, `Landed ${(d * 100).toFixed(0)} cm forward`, 'fix.drift.back', 'praise.drift');
  }
  if (fin(m.leanBack) && m.leanBack > T.leanBackFix) {
    add('lean', 'Landing', 0.95, 'fix', Math.min(1, m.leanBack / 35), `Leaning back ${m.leanBack.toFixed(0)}° at landing`, 'fix.lean', 'praise.drift');
  }

  // Set point
  if (fin(m.setHeight)) {
    const h = m.setHeight;
    if (h > T.setHighFix) add('setHeight', 'Set height', 0.95, 'fix', Math.min(1, (h - 0.4) / 0.6), 'Ball set on top of the head', 'fix.setHeight.high', 'praise.setHeight');
    else if (h > T.setHighOk) add('setHeight', 'Set height', 0.95, 'ok', 0.3, 'Set point a little high', 'fix.setHeight.ok', 'praise.setHeight');
    else if (h < T.setLowFix || m.lowSet) add('setHeight', 'Set height', 0.95, 'fix', 0.6, 'Ball pushed from below the chin', 'fix.setHeight.low', 'praise.setHeight');
    else add('setHeight', 'Set height', 0.95, 'good', 0, 'Set point at forehead height', 'fix.setHeight.high', 'praise.setHeight');
  }
  if (fin(m.setForward)) {
    const s = m.setForward;
    const st = s < T.setBehindFix ? 'fix' : s < T.setBehindOk ? 'ok' : 'good';
    add('setBehind', 'Ball in front', 0.95, st, Math.min(1, -s / 0.8), st === 'good' ? 'Ball in front of the head' : 'Ball went behind the head', 'fix.setBehind', 'praise.setBehind');
  }
  if (fin(m.setLateral)) {
    const s = m.setLateral;
    if (s < T.latCenterFix) add('setLat', 'Shooting pocket', 0.9, 'fix', 0.7, 'Ball in the middle of the head', `fix.setLat.center.${H}`, 'praise.setLat');
    else if (s > T.latWideFix) add('setLat', 'Shooting pocket', 0.9, 'fix', 0.5, 'Ball far outside the shoulder', `fix.setLat.wide.${H}`, 'praise.setLat');
    else add('setLat', 'Shooting pocket', 0.9, s >= T.latGood ? 'good' : 'ok', 0.25, 'Ball lined up on the shooting side', `fix.setLat.ok.${H}`, 'praise.setLat');
  }

  // Elbow & line
  if (fin(m.flare)) {
    const a = m.flare;
    const st = a > T.flareFix ? 'fix' : a > T.flareOk ? 'ok' : 'good';
    add('elbow', 'Elbow', 0.9, st, Math.min(1, a / 40), `Forearm tilted ${Math.max(0, a).toFixed(0)}° off vertical`, 'fix.elbow', 'praise.elbow');
  }
  if (fin(m.releaseLine)) {
    const l = m.releaseLine;
    const st = Math.abs(l) > T.lineFix ? 'fix' : Math.abs(l) > T.lineOk ? 'ok' : 'good';
    add('line', 'Shot line', 0.85, st, Math.min(1, Math.abs(l)), st === 'good' ? 'Straight shot line' : l < 0 ? 'Arm crossed toward the middle' : 'Arm swung outside', l < 0 ? 'fix.line.in' : 'fix.line.out', 'praise.line');
  }

  // Timing
  if (c.jumped && fin(m.relVsApex)) {
    const d = m.relVsApex;
    const st = d > T.apexLateFix ? 'fix' : d > T.apexLateOk ? 'ok' : 'good';
    add('timing', 'Rhythm', 0.85, st, Math.min(1, d / 0.35), `Release ${d >= 0 ? (d * 1000).toFixed(0) + ' ms after' : (-d * 1000).toFixed(0) + ' ms before'} the top of the jump`, 'fix.timing.late', 'praise.timing');
  } else if (fin(m.legGap)) {
    const g = m.legGap;
    const st = g > T.legGapFix ? 'fix' : g > T.legGapOk ? 'ok' : 'good';
    add('timing', 'Rhythm', 0.85, st, Math.min(1, g / 0.6), `Arm fired ${(g * 1000).toFixed(0)} ms after the legs`, 'fix.timing.gap', 'praise.timing');
  }

  // Guide hand
  if (fin(m.guidePush)) {
    const g = m.guidePush;
    const fixAt = c.side === 'frontal' ? T.guideFix : T.guideFwdFix;
    const okAt = c.side === 'frontal' ? T.guideOk : T.guideFwdFix * 0.66;
    const st = g > fixAt ? 'fix' : g > okAt ? 'ok' : 'good';
    add('guide', 'Guide hand', 0.8, st, Math.min(1, g / (fixAt * 2)), st === 'good' ? 'Guide hand stayed quiet' : 'Guide hand pushed the ball', 'fix.guide', 'praise.guide');
  }

  // Legs
  if (c.legsVisible && fin(m.knee)) {
    const k = m.knee, d = `Knees bent to ${k.toFixed(0)}°`;
    if (k > T.kneeOk) add('knees', 'Legs', 0.75, 'fix', Math.min(1, (k - 135) / 30), d, 'fix.knees.shallow', 'praise.knees');
    else if (k > T.kneeGood[1]) add('knees', 'Legs', 0.75, 'ok', 0.3, d, 'fix.knees.ok', 'praise.knees');
    else if (k < T.kneeTooDeep) add('knees', 'Legs', 0.75, 'fix', 0.4, d, 'fix.knees.deep', 'praise.knees');
    else add('knees', 'Legs', 0.75, 'good', 0, d, 'fix.knees.shallow', 'praise.knees');
  }

  // Release
  if (fin(m.ext)) {
    const e = m.ext;
    const st = e < T.extOk ? 'fix' : e < T.extGood ? 'ok' : 'good';
    add('ext', 'Release', 0.7, st, Math.min(1, (165 - e) / 35), `Elbow ${e.toFixed(0)}° at release`, 'fix.ext', 'praise.ext');
  }
  if (fin(m.armAngle)) {
    const a = m.armAngle;
    const st = a < T.armFix ? 'fix' : a < T.armOk ? 'ok' : 'good';
    add('arc', 'Release angle', 0.7, st, Math.min(1, (65 - a) / 25), `Arm ${a.toFixed(0)}° above flat at release`, 'fix.arc', 'praise.arc');
  }

  // Finish
  if (fin(m.hold)) {
    const h = m.hold;
    const st = h >= T.holdGood || m.holdCapped ? 'good' : h >= T.holdOk ? 'ok' : 'fix';
    add('hold', 'Follow-through', 0.6, st, Math.min(1, (0.8 - h) / 0.8), `Held the finish ${m.holdCapped ? '1.2+' : h.toFixed(2)} s`, 'fix.hold', 'praise.hold');
  }
  if (fin(m.snap)) {
    const st = m.snap >= 0.4 ? 'good' : m.snap >= 0.15 ? 'ok' : 'fix';
    add('snap', 'Wrist snap', 0.5, st, 0.5, st === 'good' ? 'Wrist snapped down' : 'Wrist stayed stiff', 'fix.snap', 'praise.snap');
  }
  return out;
}

// ---------- spoken feedback ----------
// Returns the clip ids to play, in order. Rules (see RESEARCH.md):
// - Clean rep: a hype call (never one of the last few), or a streak call at 3/5/8.
// - Otherwise: one praise, a beat, then the single most important fix.
// - Same fix three reps running: suggest slowing down and going close.
export class Voice {
  constructor(opts = {}) {
    this.hype = opts.hype ?? true;
    this.recentHype = [];
    this.lastPraise = '';
    this.fixStreak = { id: '', n: 0 };
    this.cleanStreak = 0;
    this.turn = {};
    this.rand = opts.rand || Math.random;
  }
  // Rotate through a cue's phrasings so back-to-back reps don't sound identical.
  pick(prefix) {
    const v = variants(prefix);
    if (!v.length) return LINES[prefix] ? prefix : null;
    const i = (this.turn[prefix] = ((this.turn[prefix] ?? -1) + 1) % v.length);
    return v[i];
  }
  pickHype() {
    const pool = variants('hype').filter((id) => !this.recentHype.includes(id));
    const id = pool[Math.floor(this.rand() * pool.length)];
    this.recentHype.push(id);
    if (this.recentHype.length > 5) this.recentHype.shift();
    return id;
  }
  compose(result) {
    if (result.error) { this.cleanStreak = 0; return this.out(['sys.cantread'], null); }
    const checks = result.checks;
    const rank = (c) => c.weight * (0.5 + c.sev);
    const fixes = checks.filter((c) => c.status === 'fix').sort((a, b) => rank(b) - rank(a));
    const oks = checks.filter((c) => c.status === 'ok').sort((a, b) => b.weight - a.weight);
    const goods = checks.filter((c) => c.status === 'good').sort((a, b) => b.weight - a.weight);
    const praise = goods.find((g) => g.pkey !== this.lastPraise) || goods[0];
    const top = fixes[0] || oks[0] || null;
    const ids = [];
    if (!top) {
      this.cleanStreak++;
      this.fixStreak = { id: '', n: 0 };
      const s = this.cleanStreak;
      if (this.hype && (s === 3 || s === 5 || s === 8)) ids.push(`streak.${s}`);
      else if (this.hype) ids.push(this.pickHype());
      else { ids.push(this.pick('clean')); if (praise) ids.push(this.pick(praise.pkey)); }
    } else {
      this.cleanStreak = 0;
      if (praise) ids.push(this.pick(praise.pkey));
      if (top.status === 'ok' && !fixes.length) ids.push('sys.smallthing');
      ids.push(this.pick(top.key));
      if (this.fixStreak.id === top.id) this.fixStreak.n++; else this.fixStreak = { id: top.id, n: 1 };
      if (this.fixStreak.n === 3) ids.push('sys.repeat');
    }
    if (praise) this.lastPraise = praise.pkey;
    return this.out(ids.filter(Boolean), top);
  }
  out(ids, top) { return { ids, say: ids.map((id) => LINES[id]).join(' '), top }; }
}

// ---------- session summary ----------
export function summarize(results) {
  const graded = results.filter((r) => !r.error);
  const counts = {};
  for (const r of graded) for (const c of r.checks) {
    counts[c.id] ??= { area: c.area, id: c.id, fix: 0, ok: 0, good: 0, cue: c.cue, detail: c.detail };
    counts[c.id][c.status]++;
  }
  const rows = Object.values(counts).sort((a, b) => b.fix - a.fix || b.ok - a.ok);
  const avg = (k) => median(graded.map((r) => r.m[k]));
  return {
    shots: results.length,
    graded: graded.length,
    rows,
    knee: avg('knee'),
    ext: avg('ext'),
    hold: avg('hold'),
    lineSpread: std(graded.map((r) => r.m.releaseLine)),
    topFix: rows.find((r) => r.fix > 0) || null,
  };
}
