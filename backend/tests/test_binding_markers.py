"""Planning language must never be elevated to a binding promise."""
from types import SimpleNamespace

import pytest

from app.stages.s5_answer import NON_BINDING_MARKERS, _Gate, _gate_claim, _markers


@pytest.mark.parametrize("marker", NON_BINDING_MARKERS)
def test_marker_downgrades_binding_claim(marker):
    quote = f"De datum is {marker}: 2028 voor de aansluiting."
    doc = {"document_id": "doc", "url": "https://example.org", "publication_date": "2026-01-01",
           "direction_split_available": True, "retrieved_at": "2026-01-01T00:00:00Z", "sha256": "a" * 64}
    ctx = SimpleNamespace(document=lambda _: doc, doc_texts={"doc": quote}, direction="consumption",
                          location={"dso": "Example"}, retrieval={"synthetic": True}, llm_ledger_id=None,
                          add_citation=lambda _: "cit")
    raw = {"document_id": "doc", "verbatim_quote": quote, "binding": "binding",
           "binding_evidence_quote": quote, "indicative_earliest_date": "2028",
           "congestion_registered": True, "queue_status": "WAITLIST", "confidence": 1.0}
    claim = _gate_claim(ctx, _Gate(), raw)
    assert claim is not None
    assert claim["binding"] == "non_binding"
    assert marker in claim["non_binding_markers_found"]


def test_markers_do_not_match_inside_unrelated_words():
    assert "aim" not in _markers("A claim is binding.")
