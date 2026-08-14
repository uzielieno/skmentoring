"""Backend regression tests for SK Mentoring landing conversion.
Covers: auth, plans, site settings (with 6 socials), inscriptions with job_type,
payment links (incl. pack_emploi variants)."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://pathway-success-3.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@mentoring.com"
ADMIN_PASSWORD = "Mentoring2025!"


@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def token(client):
    r = client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"login failed {r.status_code} {r.text}"
    tok = r.json().get("access_token") or r.json().get("token")
    assert tok
    return tok


@pytest.fixture(scope="session")
def auth_client(client, token):
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client


# ------- Health / public -------
def test_plans_public(client):
    r = client.get(f"{API}/plans")
    assert r.status_code == 200
    data = r.json()
    ids = [p["id"] for p in data]
    assert "tage_mage" in ids and "pack_emploi" in ids and "custom" in ids
    by_id = {p["id"]: p for p in data}
    # pack_emploi must have both variants
    pe_variants = by_id["pack_emploi"].get("variants", [])
    vids = {v["id"]: v["price"] for v in pe_variants}
    assert vids.get("stage_alt") == 150, f"stage_alt price expected 150, got {vids}"
    assert vids.get("cdi") == 499, f"cdi price expected 499, got {vids}"
    # tage_mage & custom variants empty
    assert by_id["tage_mage"].get("variants", []) == []
    assert by_id["custom"].get("variants", []) == []


def test_admin_update_pack_emploi_variants_and_reset(auth_client, client):
    # Get pack_emploi
    r = auth_client.get(f"{API}/admin/plans")
    assert r.status_code == 200
    plans = {p["id"]: p for p in r.json()}
    pe = plans["pack_emploi"]
    # Modify variants
    pe["variants"] = [
        {"id": "stage_alt", "name": "Stage / Alternance", "price": 180},
        {"id": "cdi", "name": "CDI", "price": 550},
    ]
    r = auth_client.put(f"{API}/admin/plans/pack_emploi", json=pe)
    assert r.status_code == 200, r.text
    # Verify public reflects
    r2 = client.get(f"{API}/plans")
    by_id = {p["id"]: p for p in r2.json()}
    vids = {v["id"]: v["price"] for v in by_id["pack_emploi"]["variants"]}
    assert vids["stage_alt"] == 180 and vids["cdi"] == 550
    # Reset to defaults for other tests
    rr = auth_client.post(f"{API}/admin/plans/reset")
    assert rr.status_code == 200
    r3 = client.get(f"{API}/plans")
    by_id2 = {p["id"]: p for p in r3.json()}
    vids2 = {v["id"]: v["price"] for v in by_id2["pack_emploi"]["variants"]}
    assert vids2["stage_alt"] == 150 and vids2["cdi"] == 499


def test_site_public(client):
    r = client.get(f"{API}/site")
    assert r.status_code == 200
    d = r.json()
    for k in ["linkedin", "whatsapp_url", "instagram", "youtube", "tiktok", "facebook"]:
        assert k in d


# ------- Admin site settings persistence -------
def test_admin_site_put_and_persist(auth_client):
    payload = {
        "site_name": "SK Mentoring",
        "contact_email": "contact@sk.test",
        "whatsapp": "+237600000000",
        "tagline": "Test tagline",
        "linkedin": "https://linkedin.com/company/skmentoring",
        "whatsapp_url": "https://wa.me/237600000000",
        "instagram": "https://instagram.com/skmentoring",
        "youtube": "https://youtube.com/@skmentoring",
        "tiktok": "https://tiktok.com/@skmentoring",
        "facebook": "https://facebook.com/skmentoring",
    }
    r = auth_client.put(f"{API}/admin/site", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    for k, v in payload.items():
        assert data[k] == v, f"{k} not returned"
    # Persist check via public endpoint
    r2 = requests.get(f"{API}/site")
    assert r2.status_code == 200
    d2 = r2.json()
    for k, v in payload.items():
        assert d2.get(k) == v, f"{k} did not persist"


# ------- Inscription with job_type -------
def test_inscription_pack_emploi_stage_alt(client):
    payload = {
        "name": "TEST User Stage",
        "email": "test_stage@example.com",
        "phone": "+237600000000",
        "track": "job",
        "plan": "pack_emploi",
        "country": "France",
        "installments": 2,
        "message": "test",
        "services": [],
        "total_price": 150,
        "level": "Master 2",
        "job_type": "stage_alt",
    }
    r = client.post(f"{API}/inscriptions", json=payload)
    assert r.status_code in (200, 201), r.text
    d = r.json()
    assert d["job_type"] == "stage_alt"
    assert d["total_price"] == 150


def test_inscription_pack_emploi_cdi(client):
    payload = {
        "name": "TEST User CDI",
        "email": "test_cdi@example.com",
        "phone": "+237600000000",
        "track": "job",
        "plan": "pack_emploi",
        "country": "France",
        "installments": 1,
        "message": "test",
        "services": [],
        "total_price": 499,
        "level": "Master 2",
        "job_type": "cdi",
    }
    r = client.post(f"{API}/inscriptions", json=payload)
    assert r.status_code in (200, 201), r.text
    d = r.json()
    assert d["job_type"] == "cdi"
    assert d["total_price"] == 499


# ------- Admin payment links -------
def test_admin_payment_links_get_put(auth_client):
    r = auth_client.get(f"{API}/admin/payment-links")
    assert r.status_code == 200
    payload = {
        "links": {
            "pack_emploi_stage_alt_1": "https://pay.test/pe_stage_1",
            "pack_emploi_stage_alt_2": "https://pay.test/pe_stage_2",
            "pack_emploi_cdi_1": "https://pay.test/pe_cdi_1",
            "tage_mage_1": "https://pay.test/tage_1",
        }
    }
    r = auth_client.put(f"{API}/admin/payment-links", json=payload)
    assert r.status_code == 200, r.text
    # Verify public
    r2 = requests.get(f"{API}/payment-links")
    assert r2.status_code == 200
    d = r2.json()
    for k, v in payload["links"].items():
        assert d.get(k) == v
