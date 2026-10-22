// Synthetic shooter for testing coach.js without a camera.
// Builds a 3D stick figure through a jump shot, then projects it for each camera view.
import { L } from '../coach.js';

const DEF = {
  view: 'front', fps: 30, kneeMin: 112, tDip: -0.42, tLegs: -0.1, jump: 0.12,
  setWrist: { y: 0.25, z: 0.2, x: -0.08 }, setElbow: { y: 0.0, z: 0.28, x: -0.05 },
  relElev: 70, relOut: -0.03, relBend: 0, hold: 0.9, guidePush: 0, guideFwd: 0, drift: { x: 0, z: 0.08 },
  snap: true, pocketW: { x: -0.06, y: -0.15, z: 0.32 }, pocketE: { x: 0.02, y: -0.25, z: 0.1 }, stance: 0.36, noise: 1.2, lead: 2.6, tail: 1.6, legsVisible: true,
};

const lerp = (a, b, u) => a + (b - a) * u;
const clamp01 = (u) => Math.max(0, Math.min(1, u));
const lp = (A, B, u) => ({ x: lerp(A.x, B.x, u), y: lerp(A.y, B.y, u), z: lerp(A.z, B.z, u) });
function gauss() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

export function makeShot(over = {}, t0 = 0) {
  const o = { ...DEF, ...over, setWrist: { ...DEF.setWrist, ...(over.setWrist || {}) }, setElbow: { ...DEF.setElbow, ...(over.setElbow || {}) }, drift: { ...DEF.drift, ...(over.drift || {}) } };
  const g = 9.81, tUp = o.jump > 0 ? Math.sqrt((2 * o.jump) / g) : 0;
  const tTake = o.tLegs, tApex = tTake + tUp, tLand = tTake + 2 * tUp;
  const frames = [];
  for (let t = -o.lead; t <= o.tail; t += 1 / o.fps) {
    // knees
    let k = 175;
    const tStart = o.tDip - 0.4;
    if (t > tStart && t <= o.tDip) k = lerp(175, o.kneeMin, clamp01((t - tStart) / 0.4));
    else if (t > o.tDip && t <= o.tLegs) k = lerp(o.kneeMin, 172, clamp01((t - o.tDip) / (o.tLegs - o.tDip)));
    else if (t > o.tLegs && o.jump > 0 && t > tLand && t < tLand + 0.35) k = 172 - 25 * Math.sin(Math.PI * (t - tLand) / 0.35);
    else if (t > o.tLegs) k = 172;
    let air = 0;
    if (o.jump > 0 && t > tTake && t < tLand) { const s = t - tTake; air = (Math.sqrt(2 * g * o.jump)) * s - 0.5 * g * s * s; }
    const du = o.jump > 0 ? clamp01((t - tTake) / (2 * tUp)) : clamp01((t - o.tLegs) / 0.4);
    const bx = o.drift.x * du, bz = o.drift.z * du;
    const half = (k * Math.PI) / 360, thigh = 0.45;
    const ankleY = 0.08 + air, kneeY = ankleY + thigh * Math.sin(half), hipY = kneeY + thigh * Math.sin(half);
    const kneeZ = thigh * Math.cos(half) * 0.9;
    const shY = hipY + 0.5, earY = shY + 0.2;
    const P = {};
    const set = (i, x, y, z) => (P[i] = { x: x + bx, y, z: z + bz });
    set(L.lAn, -o.stance / 2, ankleY, 0); set(L.rAn, o.stance / 2, ankleY, 0);
    set(L.lKn, -o.stance / 2.2, kneeY, kneeZ); set(L.rKn, o.stance / 2.2, kneeY, kneeZ);
    set(L.lHip, -0.1, hipY, 0); set(L.rHip, 0.1, hipY, 0);
    set(L.lSh, -0.18, shY, 0); set(L.rSh, 0.18, shY, 0);
    set(L.lEar, -0.075, earY, -0.02); set(L.rEar, 0.075, earY, -0.02);
    set(L.nose, 0, earY - 0.01, 0.1);
    for (let i = 1; i <= 10; i++) if (!P[i]) set(i, 0, earY, 0.05);
    for (const i of [29, 30, 31, 32]) set(i, i % 2 ? -o.stance / 2 : o.stance / 2, ankleY, 0.05);

    // shooting arm (right), keyframes relative to shoulder
    const pocketW = o.pocketW, pocketE = o.pocketE;
    const setW = o.setWrist, setE = o.setElbow;
    const el = (o.relElev * Math.PI) / 180;
    // relBend pushes the elbow off the shoulder-wrist line = arm not straight at release
  const relE = { x: o.relOut / 2, y: 0.3 * Math.sin(el) - o.relBend * Math.cos(el), z: 0.3 * Math.cos(el) + o.relBend * Math.sin(el) };
    const relW = { x: o.relOut, y: 0.6 * Math.sin(el), z: 0.6 * Math.cos(el) };
    let W, E;
    if (t <= -0.7) { W = pocketW; E = pocketE; }
    else if (t <= -0.22) { const u = (t + 0.7) / 0.48; W = lp(pocketW, setW, u); E = lp(pocketE, setE, u); }
    else if (t <= 0) { const u = (t + 0.22) / 0.22; W = lp(setW, relW, u); E = lp(setE, relE, u); }
    else if (t <= o.hold) { W = relW; E = relE; }
    else { const u = clamp01((t - o.hold) / 0.35); W = lp(relW, pocketW, u); E = lp(relE, pocketE, u); }
    const sh = P[L.rSh];
    set(L.rEl, sh.x - bx + E.x, sh.y + E.y, sh.z - bz + E.z);
    set(L.rWr, sh.x - bx + W.x, sh.y + W.y, sh.z - bz + W.z);
    const wr = P[L.rWr], elb = P[L.rEl];
    const fd = { x: wr.x - elb.x, y: wr.y - elb.y, z: wr.z - elb.z };
    const fn = Math.hypot(fd.x, fd.y, fd.z) || 1;
    if (o.snap && t > 0.08 && t < o.hold) set(L.rIdx, wr.x - bx, wr.y - 0.08, wr.z - bz + 0.05);
    else set(L.rIdx, wr.x - bx + (fd.x / fn) * 0.09, wr.y + (fd.y / fn) * 0.09, wr.z - bz + (fd.z / fn) * 0.09);
    set(L.rThumb ?? 22, wr.x - bx, wr.y, wr.z - bz); set(18, wr.x - bx, wr.y, wr.z - bz);

    // guide hand (left): rides beside the ball, stays put at release unless it pushes
    const ballSide = (Wp) => ({ x: sh.x - bx + Wp.x - 0.13, y: sh.y + Wp.y - 0.03, z: sh.z - bz + Wp.z + 0.04 });
    let G;
    if (t <= -0.22) G = ballSide(t <= -0.7 ? pocketW : lp(pocketW, setW, (t + 0.7) / 0.48));
    else {
      const g0 = ballSide(setW);
      const u = clamp01((t + 0.22) / 0.3);
      G = { x: g0.x + o.guidePush * u, y: g0.y + 0.05 * u, z: g0.z + o.guideFwd * u };
      if (t > o.hold) { const v = clamp01((t - o.hold) / 0.35); const gp = ballSide(pocketW); G = lp(G, gp, v); }
    }
    set(L.lWr, G.x, G.y, G.z);
    const extOff = o.guideFwd > 0 && t > -0.1;
    set(L.lEl, extOff ? lerp(-0.18, G.x, 0.5) : -0.26, extOff ? lerp(P[L.lSh].y, G.y, 0.5) : G.y - 0.24, extOff ? lerp(0, G.z - bz, 0.5) : 0.12);
    set(L.lIdx, G.x - bx, G.y + 0.05, G.z - bz); set(17, G.x - bx, G.y, G.z - bz); set(21, G.x - bx, G.y, G.z - bz);

    frames.push(project(P, t + t0, o));
  }
  return frames;
}

function project(P, t, o) {
  const s = 300, cx = 360, cy = 1150;
  const hip = { x: (P[L.lHip].x + P[L.rHip].x) / 2, y: (P[L.lHip].y + P[L.rHip].y) / 2, z: (P[L.lHip].z + P[L.rHip].z) / 2 };
  const p = [], w = [];
  for (let i = 0; i < 33; i++) {
    const q = P[i] || { x: 0, y: 1, z: 0 };
    let ix;
    if (o.view === 'front') ix = cx - q.x * s;
    else if (o.view === 'back') ix = cx + q.x * s;
    else if (o.view === 'right') ix = cx + q.z * s;
    else ix = cx - q.z * s;
    let v = 0.98;
    if (!o.legsVisible && [25, 26, 27, 28, 29, 30, 31, 32].includes(i)) v = 0.1;
    p.push({ x: ix + gauss() * o.noise, y: cy - q.y * s + gauss() * o.noise, v });
    w.push({ x: q.x - hip.x + gauss() * 0.004, y: -(q.y - hip.y) + gauss() * 0.004, z: q.z - hip.z + gauss() * 0.004 });
  }
  return { t, p, w };
}
