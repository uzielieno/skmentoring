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
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

# --- Config ---
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
ADMIN_EMAIL = os.environ['ADMIN_EMAIL']
ADMIN_PASSWORD = os.environ['ADMIN_PASSWORD']

EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ['EMERGENT_EMAIL_KEY']
EMAIL_FROM_NAME = os.environ['EMAIL_FROM_NAME']

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()
api_router = APIRouter(prefix="/api")

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


class Registration(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: str
    track: str                 # "job" | "tage_mage"
    plan: str                  # "tage_mage" | "pack_emploi"
    country: str
    installments: int          # 1..4
    message: Optional[str] = ""
    status: str = "nouveau"    # nouveau | contacte | paye
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class RegistrationCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    track: str
    plan: str
    country: str
    installments: int = 1
    message: Optional[str] = ""


class StatusUpdate(BaseModel):
    status: str


class PaymentLinksUpdate(BaseModel):
    links: Dict[str, str]


PLAN_LABELS = {"tage_mage": "Préparation TAGE MAGE (299€)", "pack_emploi": "Pack Emploi (499€)"}


async def send_confirmation_email(reg: Registration, payment_link: str):
    plan_label = PLAN_LABELS.get(reg.plan, reg.plan)
    pay_block = ""
    if payment_link:
        pay_block = f"""
        <tr><td style="padding:24px 0;">
          <a href="{payment_link}" style="background:#FF5E00;color:#0A0A0A;text-decoration:none;font-weight:700;padding:16px 32px;border-radius:999px;display:inline-block;">Finaliser mon paiement</a>
        </td></tr>"""
    html = f"""
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:40px 0;font-family:Arial,sans-serif;">
      <tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#141414;border:1px solid #27272A;border-radius:16px;padding:40px;">
          <tr><td style="color:#FF5E00;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Mentoring</td></tr>
          <tr><td style="color:#ffffff;font-size:26px;font-weight:700;padding-top:12px;">Bienvenue {reg.name} 👋</td></tr>
          <tr><td style="color:#A1A1AA;font-size:15px;line-height:1.7;padding-top:16px;">
            Ton inscription au parcours <b style="color:#fff;">{plan_label}</b> a bien été enregistrée.
            Paiement choisi : <b style="color:#fff;">{reg.installments} fois</b>.<br/><br/>
            Notre équipe te recontacte très vite pour lancer ton accompagnement. En attendant, tu peux finaliser ton paiement ci-dessous.
          </td></tr>
          {pay_block}
          <tr><td style="color:#52525B;font-size:12px;padding-top:24px;border-top:1px solid #27272A;">
            Une question ? Réponds simplement à cet email.
          </td></tr>
        </table>
      </td></tr>
    </table>"""
    payload = {
        "to": [reg.email],
        "subject": "Ton inscription Mentoring est confirmée 🎯",
        "html": html,
        "from_name": EMAIL_FROM_NAME,
    }
    try:
        async with httpx.AsyncClient(timeout=30) as c:
            resp = await c.post(f"{EMAIL_BASE_URL}/api/v1/email/send",
                                headers={"X-Email-Key": EMAIL_KEY}, json=payload)
        resp.raise_for_status()
    except Exception as e:
        logger.error(f"Email send error: {e}")


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


@api_router.post("/inscriptions", response_model=Registration)
async def create_inscription(payload: RegistrationCreate):
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
async def login(payload: LoginRequest):
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


@app.on_event("shutdown")
async def shutdown():
    client.close()
