# LiveShooting: what it grades and why

This is the research behind the LiveShooting demo, written so it can be ported into CourtVision later. It covers every check the app runs, the camera angles each one works from, the target numbers, and where those numbers come from.

**How to read the "Basis" column**
- **Research**: the number comes from a published study.
- **Coaching**: the cue comes from established coaching material; the cut-off number is ours.
- **Starting point**: a first guess for this demo. Tune it after real testing.

## What a phone camera can and can't see

The app tracks 33 body points (MediaPipe Pose) on every frame. It sees joints, not the ball. So it can grade body mechanics, but not arc, spin, entry angle (Noah's 45/11/0), or whether the shot went in. Each angle sees different things:

| Camera spot | Sees well | Can't judge well |
|---|---|---|
| In front / behind | Elbow alignment, ball position side to side, shot line, guide hand, feet width, drifting sideways, set point height | Ball behind the head, release angle, fading back |
| Right / left side | Knee bend, set point height, ball behind the head, release angle, wrist snap, fading back, leaning | Elbow flare, shot line, drifting sideways |

Side view from the shooting-hand side is the most reliable for arm readings (right side for righties). From the other side the shooting arm is partly hidden behind the body.

## The checks

| Check | Angles | What's measured | Good | Flagged | Basis |
|---|---|---|---|---|---|
| Legs (knee bend) | All | Smallest knee angle in the dip (180° = straight) | 95–135° | Over 145° (too straight) or under 85° (too deep) | Research: proficient shooters dip to about 104–115° (Cabarkapa 2021, 2023) |
| Set height | All | Shooting wrist height at launch, vs the ears, in shoulder-to-ear units | Around eyes to forehead | Wrist above the top of the head (ball on the head), or below the chin | Coaching: Ben's breakdown v3 Fix #1; Wissel. Cut-offs are a starting point |
| Ball in front | Side | Wrist position vs the ear at launch | In front of or level with the ear | More than ~0.3 units behind the ear | Coaching: Wissel (beginners shoot "from behind the head"); Engelland moved Kawhi Leonard's release point from above his head to in front of his face (Grantland). Cut-off is a starting point |
| Shooting pocket | Front/back | Wrist position sideways vs the middle of the body | Between the shooting eye and shooting shoulder | At or past the middle of the head, or far outside the shoulder | Coaching: jr.nba.com, Wissel; Ben's breakdown (ball centered on the head). Starting point |
| Elbow | Front/back | Forearm tilt from vertical, elbow outside the wrist | Under 12° | Over 22° | Research: keeping the forearm closest to vertical was the key variable separating makes from misses (Cabarkapa 2021). Cut-offs are a starting point |
| Shot line | Front/back | Wrist vs shooting shoulder at release | Within 0.45 half-shoulder widths | Over 0.7 (crossing the face or swinging out) | Coaching: jr.nba.com ("arm moves straight up and down"). Starting point. Related research: shot-to-shot consistency predicts left-right accuracy (Slegers & Love 2022), and shot-plane alignment predicted free-throw precision (ISBS 2023) |
| Rhythm (jump shot) | All | Release time vs the top of the jump | Up to 0.12 s after the peak | More than 0.2 s after (shooting on the way down) | Research: release around the peak (Satern 1993); elite shooters release 0–0.12 s after the peak on short and mid shots (Podmenik 2021) |
| Rhythm (set shot) | All | Time between legs straightening and the arm firing | Under 0.22 s | Over 0.35 s (legs, then arm) | Coaching: Ben's breakdown v3 Fix #4; Breakthrough ("extend the legs as you release"). Starting point |
| Guide hand | All (best front/back) | Off hand moving toward the shooting side, or pushing forward with a straight arm, through release | Stays still | Moves more than 0.45 half-shoulder widths | Coaching: Breakthrough ("no force or spin"), jr.nba.com. Starting point |
| Release (arm straight) | All | Straightest shooting elbow at release | 155° or more | Under 145° | Research: about 160–168° at release (Cabarkapa 2023) |
| Release angle | Side | Shooting arm angle above flat at release | 60° or more | Under 52° (pushing out, flat shot) | Starting point, based on ball release angles of about 50–55° (Cabarkapa 2021; Satern 1993) |
| Follow-through hold | All | Seconds the arm stays up and straight after release | 0.7 s or more | Under 0.5 s | Coaching: hold it until the ball hits the rim (Breakthrough, Wissel). Starting point |
| Wrist snap | Side | Fingers below the wrist after release | Snapped | Hand stays stiff | Coaching: jr.nba.com ("snapping your wrist in a downward waving motion"), Wissel |
| Base | Front/back | Ankle gap vs shoulder gap at the dip | 0.75–1.5× | Under 0.55× or over 1.9× | Coaching: feet about shoulder width (Wissel, Breakthrough). Starting point |
| Balance (sideways) | Front/back | Hip movement from takeoff to landing | Under 18 cm | Over 30 cm | Coaching: land where you took off (Breakthrough). Research: elite shooters drift more on long shots (Podmenik 2021), so this is loose on purpose |
| Balance (fade) | Side | Hip movement forward or back | Up to 65 cm forward | Fading back more than 8 cm, or flying forward over 65 cm | Coaching: "land a few inches in front" (Breakthrough). Research: elite shooters move 21–49 cm forward on jumpers (Podmenik 2021) |
| Landing | Side | Trunk lean at landing | Upright | Leaning back over 15° | Coaching: "head over your feet" (Wissel). Starting point |

## How a shot is detected

1. The app is armed when the ball is in both hands. The camera can't see the ball, so it looks for the posture: both wrists close together (within about 0.75 torso lengths), off the hips, no higher than the ears, and still for 0.25 s. This works at any height, so no waist reset is needed. Hands hanging at the sides, or both arms up overhead, don't count. (Dropping both wrists below the shoulders still arms it, as before.) Starting-point numbers, to be tuned.
2. One wrist rises above the ears with the elbow nearly straight, within 1.6 s of being low. That's a shot. That arm is the shooting arm.
3. The app keeps recording for 1.25 s to see the follow-through and landing, then grades the shot.
4. **Set point** is the moment the shooting forearm starts straightening fast (over 150°/s). That's where the ball launched from.
5. **Release** is the moment the elbow is straightest just after the trigger.

## How the coach talks

The coach's lines are written and delivered the way good coaches cue, not the way a manual reads.

- **One cue per rep.** After every shot it says one thing done well, then the single most important fix. In a 2025 study of junior gymnasts, feedback on key elements only beat correcting every error at post-test (Niźnikowski et al. 2025). A cueing summary of Nick Winkelman's work puts it this way: "One clear external cue beats a checklist of internal instructions the athlete can't hold in mind while moving."
- **Point at the target when possible.** Lines like "Point it at the rim," "Reach for the top of the square" and "Reach into the cookie jar" aim attention at the rim, the ball, or an image. In Gabriele Wulf's experiments, an external focus like this beat body-part instructions, and the advantage held after the cues were removed (Wulf et al. 1998). Some cues still name a body part when that's the clearest way to say it ("Elbow in").
- **Short and spoken.** Each fix is under about 10 words, with contractions and two-beat rhythm ("Hold that finish. Don't drop it."). There's a short breath between the praise and the fix, and a longer one before a repeat warning.
- **Variety.** Most cues have two or more phrasings, and the coach rotates them so back-to-back reps don't sound like a loop. Hype calls never repeat within five shots.
- **Hype on clean reps (switched off for now, until the voice is right).** When every check passes, the coach fires a hype call ("Ice in your veins!", "You've got that dog in you!"). At 3, 5 and 8 clean reps in a row it calls the streak. Hype is based on form only, because the camera can't see makes. The code is still there; the app currently runs with it off.
- **Same fix three times running:** the coach tells the player to slow down and shoot close to the rim, the foundations-first order from Ben's notes.
- **Ranking:** fixes are ranked foundation-first, in this order: balance and base, set point, elbow and shot line, rhythm, guide hand, legs, release, follow-through.
- **Words:** they follow Ben's kid-readable rule: short sentences, no coach jargon.

### Voices

- **Studio voices** are clips recorded ahead of time with Kokoro-82M, an open-source neural text-to-speech model (Apache 2.0) that ranks among the most natural-sounding free voices. Every line is rendered in five voices: Michael, Fenrir and Puck (male), and Heart and Bella (female). Heart and Bella carry the model's top quality grades (A and A−); the male voices are rated C+. Each clip is trimmed and loudness-matched to −16 LUFS, so every line is equally loud.
- **Pace:** hype lines run about 10% faster than normal, fixes slightly slower, for clarity. The average is about 3 words per second, a brisk coaching pace.
- **iPhone voice** uses the phone's own text-to-speech as a fallback. It sounds better after you download an Enhanced or Premium voice in iOS Settings.
- **Changing lines:** edit `lines.js`, then run `python3 tools/render_voices.py --model <folder>` to re-record only the lines that changed.

## Known limits (be honest with testers)

- No ball tracking, so no arc, spin, entry angle, or makes and misses.
- A single camera turns 3D motion into 2D. Angles are most accurate when the camera is square to the body (straight in front, behind, or to the side), not diagonal.
- Thresholds marked "starting point" are not validated. The next step is recording 20–30 shots from known good shooters and Dillon, then tuning.

## Sources

- Cabarkapa D. et al. (2021). Kinetic and kinematic characteristics of proficient and non-proficient 2-point and 3-point basketball shooters. *Sports*, 10(1), 2. https://pmc.ncbi.nlm.nih.gov/articles/PMC8822900
- Cabarkapa D., Fry A.C., Carlson K.M., Poggio J.P., Deane M.A. (2021). Key kinematic components for optimal basketball free throw shooting performance. *Central European Journal of Sport Sciences and Medicine*, 36(4), 5–15. https://wnus.usz.edu.pl/cejssm/de/issue/1215/article/19306/
- Cabarkapa D. et al. (2023). Biomechanical characteristics of proficient free-throw shooters: markerless motion capture analysis. *Frontiers in Sports and Active Living*, 5:1208915. https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2023.1208915/pdf
- University of Kansas (2022). Study photographically identifies characteristics that make proficient basketball scorers. https://news.ku.edu/2022/05/26/study-photographically-identifies-characteristics-make-proficient-basketball-scorers
- Podmenik N., Supej M., Debevec H., Erčulj F. (2021). Common movement patterns of the jump shot while increasing the distance from the basket in elite basketball players. *Journal of Human Kinetics*, 78, 29–39. https://johk.pl/wp-content/uploads/2023/04/10078-78-2021-v78-2021-03.pdf
- Satern M.N. (1993). Kinematic parameters of basketball jump shots projected from varying distances. ISBS Proceedings. https://ojs.ub.uni-konstanz.de/cpa/article/view/1736
- Slegers N., Love D. (2022). The role of ball backspin alignment and variability in basketball shooting. *Journal of Sports Sciences*. https://digitalcommons.georgefox.edu/mece_fac/130
- Relationship between kinematic characteristics and free-throw shooting precision: markerless motion capture analysis (2023). ISBS Proceedings Archive 41(1). https://lida.sport-iat.de/dbb/Record/4083642?lng=en
- Stojanović E. et al. (2019). Kinematic parameters of jump shot in elite male basketball players. *Facta Universitatis: Physical Education and Sport*, 17(2). https://casopisi.junis.ni.ac.rs/index.php/FUPhysEdSport/article/view/3908
- Wissel H. Shooting mechanics (via Coach's Clipboard). https://www.coachesclipboard.net/WisselShootingMechanics.html
- Breakthrough Basketball. How to shoot a basketball: proper shooting form. https://www.breakthroughbasketball.com/fundamentals/shooting-technique
- Jr. NBA. How to shoot a basketball. https://jr.nba.com/shooting/
- Grantland. The Shot Doctor (Chip Engelland). https://grantland.com/features/the-shot-doctor/
- Wulf G., Höß M., Prinz W. (1998). Instructions for motor learning: differential effects of internal versus external focus of attention. *Journal of Motor Behavior*, 30(2). Summary: https://us.humankinetics.com/blogs/excerpt/the-benefits-of-an-external-focus
- Coachway. Nick Winkelman: cueing for coaches. https://coachway.io/articles/nick-winkelman-cueing-for-coaches/
- Niźnikowski T. et al. (2025). Enhancing the learning of sports skills through verbal feedback. *Frontiers in Sports and Active Living*, 7. https://frontiersin.org/articles/10.3389/fspor.2025.1519365/full
- Kokoro-82M voice model and voice grades. https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md
- Further reading, not yet used for a number: Knudson D. (1993). Biomechanics of the basketball jump shot: six key teaching points. *JOPERD*.
