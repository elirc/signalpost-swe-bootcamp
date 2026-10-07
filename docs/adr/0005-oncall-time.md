# ADR 0005 — elapsed-time rotations and total override order

Status: implemented pure resolver; calendar-based product scheduling remains open.

Store a UTC instant anchor, positive elapsed rotation seconds, nonempty ordered roster and valid named timezone. Compute floor((instant-anchor)/duration), using nonnegative modulo for instants before the anchor. The same instant with a different offset must resolve identically. Named zones are for display in this initial policy; a “handoff at 09:00 local every Monday” policy is a distinct calendar rule requiring further implementation.

Overrides use half-open [start,end) intervals. Highest numeric priority wins; equal priorities use ordinal UUID text order. Invalid intervals/empty responders fail explicitly. The policy is deterministic and testable around DST transitions without depending on machine-local timezone. Validate conflicting overrides in the future editor and explain this precedence to operators.

Final review added two regressions that failed against the initial implementation: one tick before a distant handoff was rounded onto the boundary, and duplicate override IDs could defeat the promised tie order. The resolver now computes floor division with integer UTC ticks and rejects duplicate override identities.

## Where this lives in code

`OnCallResolver.Resolve` in `services/sentinel/Domain.cs:34-53`:

- Timezone must resolve (`TimeZoneInfo.FindSystemTimeZoneById`, line 36); positive rotation and non-blank
  responders (37-38); `End > Start` and non-blank override responders (39-40); unique override ids (41-42).
- Active override: half-open `Start <= instant < End`, highest `Priority`, then ordinal `Id.ToString("D")`
  (line 43).
- Rotation: integer UTC ticks, truncating division corrected to floor for pre-anchor instants (lines 46-50),
  then a non-negative modulo into the roster (line 51).
- Called from the evaluator when a rule has a schedule (`Evaluator.cs:79-83`).

**Check:** for an anchor at `00:00Z`, a 3600 s rotation and roster `[a, b, c]`, compute the responder one second
*before* the anchor by following lines 46-51 — truncation gives slot 0, the floor correction gives `-1`, the
modulo gives index 2, so `c`.
