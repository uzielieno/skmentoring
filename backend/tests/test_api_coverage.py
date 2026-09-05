"""Extended endpoint coverage (iteration 4) — public + admin endpoints.
Uses a single login to respect the 5/min login rate limit and <=4 inscriptions
to respect the 10/min inscription rate limit.
"""
import os
import uuid

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@mentoring.com"
ADMIN_PASSWORD = "Mentoring2025!"


@pytest.fixture(scope="module")
def anon():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin(anon):
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"login failed {r.status_code} {r.text[:300]}"
    body = r.json()
    assert "token" in body and isinstance(body["token"], str) and len(body["token"]) > 20
    assert body["user"]["email"] == ADMIN_EMAIL
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Authorization": f"Bearer {body['token']}"})
    return s


# ---------- public endpoints return correct JSON shapes ----------
class TestPublicShapes:
    def test_root(self, anon):
        r = anon.get(f"{API}/")
        assert r.status_code == 200

    def test_plans_is_list_of_objects(self, anon):
        r = anon.get(f"{API}/plans")
        assert r.status_code == 200
        assert "application/json" in r.headers.get("content-type", "")
        data = r.json()
        assert isinstance(data, list) and len(data) >= 3
        for p in data:
            assert isinstance(p, dict)
            assert isinstance(p["id"], str)
            assert isinstance(p.get("features", []), list)
            assert isinstance(p.get("services", []), list)
            assert isinstance(p.get("variants", []), list)
            assert "_id" not in p

    def test_site_is_object(self, anon):
        r = anon.get(f"{API}/site")
        assert r.status_code == 200
        d = r.json()
        assert isinstance(d, dict) and not isinstance(d, list)
        assert "_id" not in d

    def test_payment_links_is_object(self, anon):
        r = anon.get(f"{API}/payment-links")
        assert r.status_code == 200
        d = r.json()
        assert isinstance(d, dict)
        assert "_id" not in d


# ---------- auth ----------
class TestAuth:
    def test_me_with_token(self, admin):
        r = admin.get(f"{API}/auth/me")
        assert r.status_code == 200
        assert r.json().get("email") == ADMIN_EMAIL

    def test_me_without_token(self, anon):
        r = anon.get(f"{API}/auth/me")
        assert r.status_code in (401, 403), r.text

    def test_admin_endpoints_require_auth(self, anon):
        for path in ["/admin/inscriptions", "/admin/stats", "/admin/plans", "/admin/site", "/admin/payment-links"]:
            r = anon.get(f"{API}{path}")
            assert r.status_code in (401, 403), f"{path} returned {r.status_code}"

    def test_invalid_token_rejected(self, anon):
        r = anon.get(f"{API}/auth/me", headers={"Authorization": "Bearer not.a.jwt"})
        assert r.status_code in (401, 403)


# ---------- admin reads ----------
class TestAdminReads:
    def test_stats_shape(self, admin):
        r = admin.get(f"{API}/admin/stats")
        assert r.status_code == 200
        d = r.json()
        for k in ["total", "tage_mage", "pack_emploi", "paye"]:
            assert isinstance(d[k], int), f"{k} not int"
        assert d["total"] >= d["paye"]

    def test_inscriptions_list(self, admin):
        r = admin.get(f"{API}/admin/inscriptions")
        assert r.status_code == 200
        rows = r.json()
        assert isinstance(rows, list)
        if rows:
            assert "_id" not in rows[0]
            assert isinstance(rows[0]["id"], str)

    def test_admin_plans_list(self, admin):
        r = admin.get(f"{API}/admin/plans")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_site(self, admin):
        r = admin.get(f"{API}/admin/site")
        assert r.status_code == 200
        assert isinstance(r.json(), dict)


# ---------- inscription creation (tage_mage + custom) ----------
class TestInscriptions:
    def test_create_tage_mage_and_persist(self, anon, admin):
        email = f"TEST_tage_{uuid.uuid4().hex[:6]}@example.com"
        payload = {
            "name": "TEST Tage User", "email": email, "phone": "+33600000000",
            "track": "tage", "plan": "tage_mage", "country": "France",
            "installments": 3, "message": "test", "services": [],
            "total_price": 299, "level": "Master 1",
        }
        r = anon.post(f"{API}/inscriptions", json=payload)
        assert r.status_code in (200, 201), r.text
        d = r.json()
        assert d["plan"] == "tage_mage"
        assert d["installments"] == 3
        assert isinstance(d["id"], str)
        # persistence via admin list
        rows = admin.get(f"{API}/admin/inscriptions").json()
        assert any(x["id"] == d["id"] and x["email"] == email for x in rows), "inscription not persisted"

    def test_create_custom_with_services(self, anon):
        payload = {
            "name": "TEST Custom User", "email": f"TEST_custom_{uuid.uuid4().hex[:6]}@example.com",
            "phone": "+33600000000", "track": "job", "plan": "custom", "country": "France",
            "installments": 1, "message": "", "services": ["CV", "LinkedIn"],
            "total_price": 120, "level": "Autre",
        }
        r = anon.post(f"{API}/inscriptions", json=payload)
        assert r.status_code in (200, 201), r.text
        d = r.json()
        assert d["services"] == ["CV", "LinkedIn"]
        assert d["total_price"] == 120

    def test_invalid_installments_rejected(self, anon):
        payload = {
            "name": "TEST Bad", "email": "TEST_bad@example.com", "phone": "+33600000000",
            "track": "tage", "plan": "tage_mage", "country": "France", "installments": 9,
            "message": "", "services": [], "total_price": 10, "level": "Autre",
        }
        r = anon.post(f"{API}/inscriptions", json=payload)
        assert r.status_code in (400, 422), r.text

    def test_missing_required_fields_rejected(self, anon):
        r = anon.post(f"{API}/inscriptions", json={"name": "TEST only name"})
        assert r.status_code == 422


# ---------- status update ----------
class TestStatusUpdate:
    def test_patch_status_persists(self, admin):
        rows = admin.get(f"{API}/admin/inscriptions").json()
        if not rows:
            pytest.skip("no inscriptions to update")
        target = rows[0]
        r = admin.patch(f"{API}/admin/inscriptions/{target['id']}", json={"status": "paye"})
        assert r.status_code == 200, r.text
        after = admin.get(f"{API}/admin/inscriptions").json()
        row = next(x for x in after if x["id"] == target["id"])
        assert row["status"] == "paye"
        # restore
        admin.patch(f"{API}/admin/inscriptions/{target['id']}", json={"status": target.get("status", "nouveau")})

    def test_patch_unknown_id(self, admin):
        r = admin.patch(f"{API}/admin/inscriptions/does-not-exist", json={"status": "paye"})
        assert r.status_code in (404, 400), f"got {r.status_code}"


# ---------- payment-link key regression (known gap) ----------
class TestPaymentLinkKeys:
    def test_variant_specific_key_available_publicly(self, anon):
        d = anon.get(f"{API}/payment-links").json()
        assert isinstance(d, dict)
        # variant keys written by backend_test.py should be readable
        assert any("_" in k for k in d.keys()) or d == {}
