from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import logging
import uuid
import jwt
import bcrypt
import httpx
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict

from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# --- Config (all from environment) ---
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
ADMIN_EMAIL = os.environ['ADMIN_EMAIL']
ADMIN_PASSWORD = os.environ['ADMIN_PASSWORD']

# Brevo (Sendinblue) transactional email
BREVO_API_KEY = os.environ.get('BREVO_API_KEY', '')
BREVO_API_URL = os.environ.get('BREVO_API_URL', 'https://api.brevo.com/v3/smtp/email')
EMAIL_FROM_NAME = os.environ.get('EMAIL_FROM_NAME', 'SK Mentoring')
EMAIL_FROM_ADDRESS = os.environ.get('EMAIL_FROM_ADDRESS', 'no-reply@example.com')
EMAIL_TEAM_NOTIFICATION = os.environ.get('EMAIL_TEAM_NOTIFICATION', '')

# Cloudflare R2 (S3-compatible) — used by helpers in storage.py if uploads are added
R2_ACCESS_KEY_ID = os.environ.get('R2_ACCESS_KEY_ID', '')
R2_SECRET_ACCESS_KEY = os.environ.get('R2_SECRET_ACCESS_KEY', '')
R2_BUCKET_NAME = os.environ.get('R2_BUCKET_NAME', '')
R2_ENDPOINT_URL = os.environ.get('R2_ENDPOINT_URL', '')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Rate limiter (per client IP). Uses X-Forwarded-For when behind a proxy.
def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for", "")
    if fwd:
        return fwd.split(",")[0].strip()
    return get_remote_address(request)

limiter = Limiter(key_func=_client_ip)
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Trop de tentatives, réessaie dans quelques minutes."},
        headers={"Retry-After": "60"},
    )

# Default payment link config (admin can override). Keys: {plan}_{installments}
DEFAULT_PAYMENT_LINKS: Dict[str, str] = {
    "tage_mage_1": "", "tage_mage_2": "", "tage_mage_3": "", "tage_mage_4": "",
    "pack_emploi_1": "", "pack_emploi_2": "", "pack_emploi_3": "", "pack_emploi_4": "",
}


# --- Security helpers ---
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id, "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_admin(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Non authentifié")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"email": payload.get("email")}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Utilisateur introuvable")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expirée")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")


# --- Models ---
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegistrationCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    track: str
    plan: str
    country: str
    installments: int = 1
    message: Optional[str] = ""
    services: List[str] = []
    total_price: float = 0
    level: str = ""
    job_type: str = ""


class Registration(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: str
    track: str
    plan: str
    country: str
    installments: int          # 1..4
    message: Optional[str] = ""
    services: List[str] = []
    total_price: float = 0
    level: str = ""
    job_type: str = ""
    status: str = "nouveau"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class StatusUpdate(BaseModel):
    status: str


class PaymentLinksUpdate(BaseModel):
    links: Dict[str, str]


class PlanService(BaseModel):
    id: str
    name: str
    price: float


class PlanVariant(BaseModel):
    id: str
    name: str
    price: float


class Plan(BaseModel):
    id: str
    name: str
    price: float
    tagline: str = ""
    features: List[str] = []
    services: List[PlanService] = []
    variants: List[PlanVariant] = []
    type: str = "fixed"  # "fixed" | "custom"
    track: str = "job"
    featured: bool = False
    order: int = 0
    active: bool = True
    deletable: bool = True


class SiteSettings(BaseModel):
    site_name: str = "SK Mentoring"
    contact_email: str = ""
    whatsapp: str = ""
    tagline: str = ""
    linkedin: str = ""
    whatsapp_url: str = ""
    instagram: str = ""
    youtube: str = ""
    tiktok: str = ""
    facebook: str = ""


DEFAULT_PLANS: List[dict] = [
    {"id": "tage_mage", "name": "Préparation TAGE MAGE", "price": 299,
     "tagline": "Vise le score qui ouvre les grandes écoles.",
     "features": ["Méthodologie complète des 6 sous-tests", "Banque d'entraînements + examens blancs",
                  "Sessions de coaching en direct", "Corrections détaillées et suivi de progression",
                  "Stratégie de gestion du temps le jour J"],
     "type": "fixed", "track": "tage_mage", "featured": False, "order": 1, "active": True, "deletable": False},
    {"id": "pack_emploi", "name": "Pack Emploi", "price": 150,
     "tagline": "Du CV à l'offre signée. Stage, alternance ou CDI.",
     "features": ["CV & profil LinkedIn optimisés par des pros", "Préparation intensive aux entretiens",
                  "Stratégie de candidature qui sort du lot", "Techniques pour décrocher stage / alternance / CDI",
                  "Suivi personnalisé jusqu'à la signature"],
     "variants": [
         {"id": "stage_alt", "name": "Stage / Alternance", "price": 150},
         {"id": "cdi", "name": "CDI", "price": 499},
     ],
     "type": "fixed", "track": "job", "featured": True, "order": 2, "active": True, "deletable": False},
    {"id": "custom", "name": "À la carte", "price": 0,
     "tagline": "Choisis exactement les prestations dont tu as besoin.",
     "features": [],
     "services": [
         {"id": "cv", "name": "Optimiser mon CV", "price": 20},
         {"id": "entretien", "name": "Coaching pour un entretien", "price": 25},
         {"id": "lm", "name": "Rédaction d'une lettre de motivation", "price": 10},
     ],
     "type": "custom", "track": "job", "featured": False, "order": 3, "active": True, "deletable": False},
]


PLAN_LABELS = {"tage_mage": "Préparation TAGE MAGE", "pack_emploi": "Pack Emploi", "custom": "Prestations à la carte"}


async def get_plan_name(plan_id: str) -> str:
    p = await db.plans.find_one({"id": plan_id}, {"_id": 0, "name": 1})
    return p["name"] if p else PLAN_LABELS.get(plan_id, plan_id)


async def send_email_brevo(to_email: str, subject: str, html: str, to_name: str = "") -> bool:
    """Send a transactional email via Brevo API. Returns True on success."""
    if not BREVO_API_KEY:
        logger.warning("BREVO_API_KEY not configured — skipping email send")
        return False
    payload = {
        "sender": {"name": EMAIL_FROM_NAME, "email": EMAIL_FROM_ADDRESS},
        "to": [{"email": to_email, "name": to_name or to_email}],
        "subject": subject,
        "htmlContent": html,
    }
    try:
        async with httpx.AsyncClient(timeout=30) as c:
            resp = await c.post(
                BREVO_API_URL,
                headers={"api-key": BREVO_API_KEY, "content-type": "application/json", "accept": "application/json"},
                json=payload,
            )
        resp.raise_for_status()
        return True
    except Exception as e:
        logger.error(f"Brevo email send error: {e}")
        return False


def _client_email_html(brand: str, reg_name: str, plan_name: str, details_line: str, payment_link: str) -> str:
    pay_block = ""
    if payment_link:
        pay_block = f"""
        <tr><td style="padding:24px 0;">
          <a href="{payment_link}" style="background:#FF5E00;color:#0A0A0A;text-decoration:none;font-weight:700;padding:16px 32px;border-radius:999px;display:inline-block;">Finaliser mon paiement</a>
        </td></tr>"""
    return f"""
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:40px 0;font-family:Arial,sans-serif;">
      <tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#141414;border:1px solid #27272A;border-radius:16px;padding:40px;">
          <tr><td style="color:#FF5E00;font-size:13px;letter-spacing:2px;text-transform:uppercase;">{brand}</td></tr>
          <tr><td style="color:#ffffff;font-size:26px;font-weight:700;padding-top:12px;">Bienvenue {reg_name} 👋</td></tr>
          <tr><td style="color:#A1A1AA;font-size:15px;line-height:1.7;padding-top:16px;">
            Ton inscription au parcours <b style="color:#fff;">{plan_name}</b> a bien été enregistrée.<br/>
            {details_line}<br/><br/>
            Notre équipe te recontacte très vite pour lancer ton accompagnement. En attendant, tu peux finaliser ton paiement ci-dessous.
          </td></tr>
          {pay_block}
          <tr><td style="color:#52525B;font-size:12px;padding-top:24px;border-top:1px solid #27272A;">
            Une question ? Réponds simplement à cet email.
          </td></tr>
        </table>
      </td></tr>
    </table>"""


def _team_email_html(brand: str, reg: "Registration", plan_name: str) -> str:
    rows = [
        ("Nom", reg.name), ("Email", reg.email), ("Téléphone", reg.phone),
        ("Pays", reg.country), ("Niveau", reg.level or "—"),
        ("Parcours", plan_name), ("Option", reg.job_type or "—"),
        ("Prestations", ", ".join(reg.services) if reg.services else "—"),
        ("Paiement", f"{reg.installments} fois"),
        ("Total", f"{reg.total_price:.0f} €" if reg.total_price else "—"),
        ("Commentaire", reg.message or "—"),
    ]
    rows_html = "".join(
        f'<tr><td style="padding:6px 12px;color:#6b7280;width:140px;">{k}</td>'
        f'<td style="padding:6px 12px;color:#111;font-weight:600;">{v}</td></tr>'
        for k, v in rows
    )
    return f"""
    <div style="font-family:Arial,sans-serif;background:#f7f7f8;padding:32px;">
      <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <div style="background:#0A0A0A;color:#FF5E00;padding:18px 24px;font-weight:700;letter-spacing:2px;text-transform:uppercase;font-size:12px;">{brand} · Nouvelle inscription</div>
        <div style="padding:20px 12px;">
          <table cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;">{rows_html}</table>
        </div>
        <div style="padding:12px 24px;background:#f9fafb;color:#6b7280;font-size:12px;">Reçu le {reg.created_at}</div>
      </div>
    </div>"""


async def send_confirmation_email(reg: "Registration", payment_link: str):
    plan_name = await get_plan_name(reg.plan)
    site = await db.settings.find_one({"_id": "site"}) or {}
    brand = site.get("site_name") or EMAIL_FROM_NAME
    details_line = f"Paiement choisi : <b style=\"color:#fff;\">{reg.installments} fois</b>."
    if reg.services:
        details_line += f"<br/>Prestations sélectionnées : <b style=\"color:#fff;\">{', '.join(reg.services)}</b>."
    if reg.total_price:
        details_line += f"<br/>Total : <b style=\"color:#FF5E00;\">{reg.total_price:.0f} €</b>."

    # 1. Confirmation email to the student
    await send_email_brevo(
        to_email=reg.email,
        to_name=reg.name,
        subject=f"Ton inscription {brand} est confirmée 🎯",
        html=_client_email_html(brand, reg.name, plan_name, details_line, payment_link),
    )

    # 2. Notification email to the team (if configured)
    if EMAIL_TEAM_NOTIFICATION:
        await send_email_brevo(
            to_email=EMAIL_TEAM_NOTIFICATION,
            subject=f"[{brand}] Nouvelle inscription — {reg.name}",
            html=_team_email_html(brand, reg, plan_name),
        )


# --- Public routes ---
@api_router.get("/")
async def root():
    return {"message": "Mentoring API"}


async def get_links_doc() -> Dict[str, str]:
    doc = await db.settings.find_one({"_id": "payment_links"})
    links = dict(DEFAULT_PAYMENT_LINKS)
    if doc and isinstance(doc.get("links"), dict):
        links.update(doc["links"])
    return links


@api_router.get("/payment-links")
async def public_payment_links():
    return await get_links_doc()


@api_router.get("/plans", response_model=List[Plan])
async def public_plans():
    docs = await db.plans.find({"active": True}, {"_id": 0}).sort("order", 1).to_list(50)
    return docs


@api_router.get("/site")
async def public_site():
    doc = await db.settings.find_one({"_id": "site"})
    if not doc:
        return SiteSettings().model_dump()
    doc.pop("_id", None)
    return doc


@api_router.post("/inscriptions", response_model=Registration)
@limiter.limit("10/minute")
async def create_inscription(request: Request, payload: RegistrationCreate):
    if payload.installments not in (1, 2, 3, 4):
        raise HTTPException(status_code=400, detail="Nombre de paiements invalide")
    reg = Registration(**payload.model_dump())
    await db.registrations.insert_one(reg.model_dump())
    links = await get_links_doc()
    link = links.get(f"{reg.plan}_{reg.installments}", "")
    await send_confirmation_email(reg, link)
    return reg


# --- Auth ---
@api_router.post("/auth/login")
@limiter.limit("5/minute")
async def login(request: Request, payload: LoginRequest):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    token = create_access_token(str(user.get("id", email)), email)
    return {"token": token, "user": {"email": email, "name": user.get("name", "Admin")}}


@api_router.get("/auth/me")
async def me(admin: dict = Depends(get_current_admin)):
    return admin


# --- Admin protected ---
@api_router.get("/admin/inscriptions", response_model=List[Registration])
async def list_inscriptions(admin: dict = Depends(get_current_admin)):
    docs = await db.registrations.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)
    return docs


@api_router.patch("/admin/inscriptions/{reg_id}")
async def update_inscription(reg_id: str, payload: StatusUpdate, admin: dict = Depends(get_current_admin)):
    res = await db.registrations.update_one({"id": reg_id}, {"$set": {"status": payload.status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Inscription introuvable")
    return {"ok": True}


@api_router.get("/admin/payment-links")
async def admin_get_links(admin: dict = Depends(get_current_admin)):
    return await get_links_doc()


@api_router.put("/admin/payment-links")
async def admin_set_links(payload: PaymentLinksUpdate, admin: dict = Depends(get_current_admin)):
    await db.settings.update_one({"_id": "payment_links"},
                                 {"$set": {"links": payload.links}}, upsert=True)
    return await get_links_doc()


@api_router.get("/admin/plans", response_model=List[Plan])
async def admin_list_plans(admin: dict = Depends(get_current_admin)):
    docs = await db.plans.find({}, {"_id": 0}).sort("order", 1).to_list(50)
    return docs


@api_router.put("/admin/plans/{plan_id}", response_model=Plan)
async def admin_update_plan(plan_id: str, payload: Plan, admin: dict = Depends(get_current_admin)):
    existing = await db.plans.find_one({"id": plan_id}, {"_id": 0, "deletable": 1})
    doc = payload.model_dump()
    doc["id"] = plan_id
    if existing and existing.get("deletable") is False:
        doc["deletable"] = False  # protect defaults
    await db.plans.update_one({"id": plan_id}, {"$set": doc}, upsert=True)
    return doc


@api_router.post("/admin/plans", response_model=Plan)
async def admin_create_plan(payload: Plan, admin: dict = Depends(get_current_admin)):
    if await db.plans.find_one({"id": payload.id}):
        raise HTTPException(status_code=400, detail="Un plan avec cet identifiant existe déjà.")
    doc = payload.model_dump()
    doc["deletable"] = True
    await db.plans.insert_one(dict(doc))
    return doc


@api_router.delete("/admin/plans/{plan_id}")
async def admin_delete_plan(plan_id: str, admin: dict = Depends(get_current_admin)):
    p = await db.plans.find_one({"id": plan_id}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Plan introuvable")
    if p.get("deletable") is False:
        raise HTTPException(status_code=400, detail="Ce plan ne peut pas être supprimé.")
    await db.plans.delete_one({"id": plan_id})
    return {"ok": True}


@api_router.post("/admin/plans/reset")
async def admin_reset_plans(admin: dict = Depends(get_current_admin)):
    await db.plans.delete_many({})
    await db.plans.insert_many([dict(p) for p in DEFAULT_PLANS])
    return {"ok": True}


@api_router.get("/admin/site", response_model=SiteSettings)
async def admin_get_site(admin: dict = Depends(get_current_admin)):
    doc = await db.settings.find_one({"_id": "site"})
    if not doc:
        return SiteSettings()
    doc.pop("_id", None)
    return SiteSettings(**doc)


@api_router.put("/admin/site", response_model=SiteSettings)
async def admin_set_site(payload: SiteSettings, admin: dict = Depends(get_current_admin)):
    await db.settings.update_one({"_id": "site"}, {"$set": payload.model_dump()}, upsert=True)
    return payload


@api_router.get("/admin/stats")
async def admin_stats(admin: dict = Depends(get_current_admin)):
    total = await db.registrations.count_documents({})
    tage = await db.registrations.count_documents({"plan": "tage_mage"})
    emploi = await db.registrations.count_documents({"plan": "pack_emploi"})
    paye = await db.registrations.count_documents({"status": "paye"})
    return {"total": total, "tage_mage": tage, "pack_emploi": emploi, "paye": paye}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    existing = await db.users.find_one({"email": ADMIN_EMAIL.lower()})
    if existing is None:
        await db.users.insert_one({
            "id": str(uuid.uuid4()), "email": ADMIN_EMAIL.lower(),
            "password_hash": hash_password(ADMIN_PASSWORD),
            "name": "Admin", "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Admin seeded")
    elif not verify_password(ADMIN_PASSWORD, existing["password_hash"]):
        await db.users.update_one({"email": ADMIN_EMAIL.lower()},
                                  {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}})

    if await db.plans.count_documents({}) == 0:
        await db.plans.insert_many([dict(p) for p in DEFAULT_PLANS])
        logger.info("Default plans seeded")


@app.on_event("shutdown")
async def shutdown():
    client.close()


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", "8001"))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run("server:app", host=host, port=port, reload=False)
