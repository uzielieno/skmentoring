# PRD — Mentoring (Landing de conversion)

## Problème / Vision
Landing page premium orientée conversion pour "Mentoring" (nom provisoire) : coaching étudiants & jeunes diplômés. Deux parcours : préparation TAGE MAGE (299€) et Pack Emploi stage/alternance/CDI (499€). Objectif : transformer un visiteur (YouTube/TikTok/WhatsApp/flyer) en inscription payée en un minimum d'étapes.

## Personas
- Étudiant préparant le TAGE MAGE (concours écoles de commerce).
- Jeune diplômé cherchant stage / alternance / CDI (CV, LinkedIn, entretiens).

## Stack & Architecture
- Frontend: React + Tailwind + framer-motion + lenis (smooth scroll) + react-fast-marquee, shadcn/ui (accordion, select, table, input, label), sonner.
- Backend: FastAPI + MongoDB (motor). Auth admin JWT (bcrypt), Resend (email Emergent-managed).
- Routes front: `/` (landing), `/inscription`, `/admin` + `/admin/login`.
- API: `/api/inscriptions` (POST public), `/api/payment-links` (GET public), `/api/auth/login`, `/api/auth/me`, `/api/admin/inscriptions` (GET/PATCH), `/api/admin/payment-links` (GET/PUT), `/api/admin/stats`.

## Implémenté (2026-08-04)
- Landing complète : Hero kinétique (reveal masqué ligne par ligne + parallax image), preuve sociale, méthode (manifeste numéroté), marquee éditorial, 2 offres dédiées, contenu gratuit, bloc distinction parcours, tarifs (2 plans + CTA), témoignages, FAQ (accordion), CTA final, footer.
- Page inscription : choix parcours, formulaire (nom, email, téléphone, pays, paiement 1/2/3/4 fois, message) → enregistrement DB + email de confirmation + affichage du lien de paiement adapté.
- Back-office admin (JWT) : stats, tableau des inscriptions, recherche, changement de statut (nouveau/contacté/payé), éditeur des liens de paiement externes par plan × échéance.
- Emails de confirmation via Resend (vérifié : 202 Accepted).
- Palette Orange (#FF5E00) / Noir / Blanc. Fonts Playfair Display + Outfit + Manrope.

## Backlog
- P1: Statut de paiement automatique (webhook) si passage à un vrai PSP (Stripe France).
- P1: Export CSV des inscriptions depuis l'admin.
- P2: Notification email à l'équipe à chaque nouvelle inscription.
- P2: Multi-admins / rôles, page /admin protégée par ProtectedRoute côté serveur.
- P2: Blog / ressources gratuites réelles (YouTube, modèles CV).

## Credentials
Voir `/app/memory/test_credentials.md` (admin@mentoring.com / Mentoring2025!).
