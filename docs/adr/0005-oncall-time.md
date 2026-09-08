# ADR 0005 — elapsed-time rotations and total override order

Status: implemented pure resolver; calendar-based product scheduling remains open.

Store a UTC instant anchor, positive elapsed rotation seconds, nonempty ordered roster and valid named timezone. Compute floor((instant-anchor)/duration), using nonnegative modulo for instants before the anchor. The same instant with a different offset must resolve identically. Named zones are for display in this initial policy; a “handoff at 09:00 local every Monday” policy is a distinct calendar rule requiring further implementation.

Overrides use half-open [start,end) intervals. Highest numeric priority wins; equal priorities use ordinal UUID text order. Invalid intervals/empty responders fail explicitly. The policy is deterministic and testable around DST transitions without depending on machine-local timezone. Validate conflicting overrides in the future editor and explain this precedence to operators.

Final review added two regressions that failed against the initial implementation: one tick before a distant handoff was rounded onto the boundary, and duplicate override IDs could defeat the promised tie order. The resolver now computes floor division with integer UTC ticks and rejects duplicate override identities.
