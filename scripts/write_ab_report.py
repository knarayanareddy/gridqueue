"""Write the before/after table from recorded experiment files, not hard-coded outcomes."""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
before = json.loads((root / "runs/ab-baseline.json").read_text())
after = json.loads((root / "runs/ab_experiment_results.json").read_text())

def arm(result, name):
    return next(a for a in result["arms"] if a["arm"] == name)

def metrics(a):
    f, g, m = a["fabricated_values"], a["counters"]["genuine"], a["counters"]["misattributed"]
    shown = f["passed"] + g["passed"] + m["passed"]
    return [f'{f["total"]-f["passed"]}/{f["total"]}', f'{g["passed"]}/{g["total"]}',
            f'{m["total"]-m["passed"]}/{m["total"]}', f'{g["passed"]}/{shown}']

columns = [metrics(arm(before, "gate_on")), metrics(arm(after, "gate_on")), metrics(arm(after, "gate_off"))]
rows = ["Fabrications blocked", "Genuine values kept", "Misattributions caught", "Correct of values shown"]
text = '# Synthetic gate A/B\n\nRun `make ab` to reproduce. Both arms use the same hand-written synthetic cases, not real model output.\n\n| | Before (gate on) | After (gate on) | Gate off |\n|---|---:|---:|---:|\n'
text += ''.join(f'| {name} | ' + ' | '.join(c[i] for c in columns) + ' |\n' for i, name in enumerate(rows))
text += '\nThis gate verifies surface support, not semantic entailment. Results: `runs/ab-baseline.json`, `runs/ab_experiment_results.json`.\n'
(root / 'docs/ab-latest.md').write_text(text)
print(text)
