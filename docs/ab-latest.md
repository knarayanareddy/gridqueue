# Synthetic gate A/B

Run `make ab` to reproduce. Both arms use the same hand-written synthetic cases, not real model output.

| | Before (gate on) | After (gate on) | Gate off |
|---|---:|---:|---:|
| Fabrications blocked | 21/21 | 21/21 | 0/21 |
| Genuine values kept | 10/10 | 10/10 | 10/10 |
| Misattributions caught | 1/5 | 2/5 | 0/5 |
| Correct of values shown | 10/14 | 10/13 | 10/36 |

This gate verifies surface support, not semantic entailment. Results: `runs/ab-baseline.json`, `runs/ab_experiment_results.json`.
