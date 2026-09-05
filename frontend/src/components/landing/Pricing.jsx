/* eslint-disable react/no-unescaped-entities */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ArrowUpRight, Star, Quote, Plus, Linkedin, MessageCircle, Instagram, Youtube, Facebook, Music2 } from "lucide-react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "../ui/accordion";
import Reveal from "./Reveal";
import { TESTIMONIALS, FAQ, IMAGES } from "./data";
import { api, safeArray, safeObject } from "@/lib/api";

function CustomCard({ plan }) {
  const [selected, setSelected] = useState({});
  const services = Array.isArray(plan.services) ? plan.services : [];
  const total = services.reduce((s, x) => s + (selected[x.id] ? x.price : 0), 0);
  const chosen = services.filter((x) => selected[x.id]).map((x) => x.id).join(",");
  const query = chosen ? `?plan=custom&services=${chosen}` : `?plan=custom`;
  return (
    <div className="relative h-full flex flex-col rounded-3xl border border-white/10 bg-brand-ink p-10 md:p-12" data-testid="plan-custom">
      <h3 className="font-display font-bold text-2xl text-white">{plan.name}</h3>
      <p className="mt-2 text-white/55 text-sm">{plan.tagline}</p>
      <div className="mt-6 space-y-3 flex-1">
        {services.map((s) => (
          <label key={s.id} data-testid={`service-${s.id}`}
            className={`flex items-center justify-between rounded-2xl border px-4 py-3 cursor-pointer transition-colors ${
              selected[s.id] ? "border-brand bg-brand/10" : "border-white/10 bg-brand-surface hover:border-white/25"
            }`}>
            <div className="flex items-center gap-3">
              <span className={`grid place-items-center w-5 h-5 rounded-md border ${selected[s.id] ? "border-brand bg-brand" : "border-white/20"}`}>
                {selected[s.id] && <Check size={13} className="text-brand-ink" />}
              </span>
              <span className="text-white text-sm">{s.name}</span>
            </div>
            <span className="text-brand font-bold text-sm">{s.price}€</span>
            <input type="checkbox" className="hidden" checked={!!selected[s.id]}
              onChange={(e) => setSelected({ ...selected, [s.id]: e.target.checked })} />
          </label>
        ))}
      </div>
      <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-6">
        <span className="text-white/60 text-sm">Total</span>
        <span className="font-serif text-4xl text-white" data-testid="custom-total">{total}€</span>
      </div>
      <Link to={`/inscription${query}`} data-testid="plan-cta-custom" className="mt-6">
        <button disabled={total === 0}
          className="group w-full flex items-center justify-center gap-2 rounded-full py-4 font-bold bg-white text-brand-ink transition-transform duration-300 hover:scale-[1.02] disabled:opacity-40">
          Réserver mes prestations
          <ArrowUpRight size={18} className="transition-transform group-hover:rotate-45" />
        </button>
      </Link>
    </div>
  );
}

function FixedCard({ plan }) {
  return (
    <div
      data-testid={`plan-${plan.id}`}
      className={`relative h-full flex flex-col rounded-3xl border p-10 md:p-12 transition-transform duration-300 hover:-translate-y-1 ${
        plan.featured ? "border-brand bg-brand-ink" : "border-white/10 bg-brand-ink"
      }`}
    >
      {plan.featured && (
        <span className="absolute -top-3 right-8 rounded-full bg-brand px-4 py-1 text-xs font-bold text-brand-ink">Le plus demandé</span>
      )}
      <h3 className="font-display font-bold text-2xl text-white">{plan.name}</h3>
      <p className="mt-2 text-white/55 text-sm">{plan.tagline}</p>
      <div className="mt-8 flex items-end gap-1">
        {Array.isArray(plan.variants) && plan.variants.length > 0 ? (
          <>
            <span className="text-white/60 text-sm mb-3 mr-2">à partir de</span>
            <span className="font-serif text-6xl text-white">{Math.min(...plan.variants.map((v) => v.price))}€</span>
            <span className="mb-2 text-white/50 text-sm">/ parcours</span>
          </>
        ) : (
          <>
            <span className="font-serif text-6xl text-white">{plan.price}€</span>
            <span className="mb-2 text-white/50 text-sm">/ parcours</span>
          </>
        )}
      </div>
      <ul className="mt-8 space-y-3 flex-1">
        {(Array.isArray(plan.features) ? plan.features : []).map((f) => (
          <li key={f} className="flex items-start gap-3 text-white/80 text-sm">
            <span className="grid place-items-center w-5 h-5 rounded-full bg-brand/15 text-brand shrink-0 mt-0.5"><Check size={12} /></span>{f}
          </li>
        ))}
      </ul>
      <Link to={`/inscription?plan=${plan.id}`} data-testid={`plan-cta-${plan.id}`} className="mt-10">
        <button className={`group w-full flex items-center justify-center gap-2 rounded-full py-4 font-bold transition-transform duration-300 hover:scale-[1.02] ${
          plan.featured ? "bg-brand text-brand-ink" : "bg-white text-brand-ink"
        }`}>
          Je m'inscris à ce parcours
          <ArrowUpRight size={18} className="transition-transform group-hover:rotate-45" />
        </button>
      </Link>
    </div>
  );
}

export function Pricing() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    api.get("/plans")
      .then(({ data }) => { setPlans(safeArray(data, "/plans")); setError(false); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);
  return (
    <section id="tarifs" className="border-t border-white/10 bg-brand-surface py-28" data-testid="pricing">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <Reveal className="text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-brand font-semibold">Tarifs</p>
          <h2 className="mt-4 font-display font-extrabold text-4xl md:text-6xl text-white tracking-tight">Un investissement, pas une dépense.</h2>
          <p className="mt-4 text-white/60 max-w-xl mx-auto">Paiement possible en 1, 2, 3 ou 4 fois. Choisis ton parcours ou construis-le à la carte.</p>
        </Reveal>
        {loading ? (
          <div className="mt-16 text-center text-white/50" data-testid="pricing-loading">Chargement des offres…</div>
        ) : error || plans.length === 0 ? (
          <div className="mt-16 text-center text-white/60" data-testid="pricing-error">
            Les offres sont temporairement indisponibles. Réessaie dans quelques instants.
          </div>
        ) : (
          <div className="mt-16 grid lg:grid-cols-3 gap-6">
            {plans.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.08}>
                {p.type === "custom" ? <CustomCard plan={p} /> : <FixedCard plan={p} />}
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function Testimonials() {
  return (
    <section id="temoignages" className="max-w-[1400px] mx-auto px-6 md:px-10 py-28" data-testid="testimonials">
      <div className="grid lg:grid-cols-3 gap-10 items-start">
        <Reveal className="lg:sticky lg:top-28">
          <p className="text-xs uppercase tracking-[0.25em] text-brand font-semibold">Ils l'ont fait</p>
          <h2 className="mt-4 font-display font-extrabold text-4xl md:text-5xl text-white tracking-tight">Des réussites concrètes.</h2>
          <div className="mt-8 relative overflow-hidden rounded-3xl border border-white/10">
            <img src={IMAGES.testimonial} alt="Étudiante souriante" className="w-full h-72 object-cover grayscale-[15%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-ink to-transparent" />
          </div>
        </Reveal>
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <div className="h-full rounded-2xl border border-white/10 bg-brand-surface p-8 hover:border-brand/40 transition-colors duration-300">
                <Quote className="text-brand" size={26} />
                <p className="mt-4 text-white/80 leading-relaxed">{t.text}</p>
                <div className="mt-6 flex items-center justify-between">
                  <div><div className="font-display font-bold text-white">{t.name}</div><div className="text-sm text-brand">{t.role}</div></div>
                  <div className="flex gap-0.5 text-brand">{[...Array(5)].map((_, k) => <Star key={k} size={13} fill="#FF5E00" />)}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FaqSection() {
  return (
    <section id="faq" className="border-t border-white/10 bg-brand-surface py-28" data-testid="faq">
      <div className="max-w-3xl mx-auto px-6 md:px-10">
        <Reveal className="text-center mb-14">
          <p className="text-xs uppercase tracking-[0.25em] text-brand font-semibold">FAQ</p>
          <h2 className="mt-4 font-display font-extrabold text-4xl md:text-5xl text-white tracking-tight">Les questions que tu te poses.</h2>
        </Reveal>
        <Reveal>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {FAQ.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border border-white/10 rounded-2xl bg-brand-ink px-6 data-[state=open]:border-brand/40">
                <AccordionTrigger className="text-left text-white hover:no-underline py-6 font-display font-semibold text-lg">{f.q}</AccordionTrigger>
                <AccordionContent className="text-white/60 leading-relaxed pb-6">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-28" data-testid="final-cta">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2.5rem] bg-brand p-12 md:p-20 text-center">
          <span className="pointer-events-none absolute -bottom-16 -right-10 font-serif text-[16rem] leading-none text-brand-ink/10 select-none">↗</span>
          <h2 className="relative font-display font-extrabold text-4xl md:text-6xl text-brand-ink tracking-tight max-w-3xl mx-auto">Ta réussite commence par une inscription.</h2>
          <p className="relative mt-5 text-brand-ink/80 max-w-lg mx-auto">Un flyer, une vidéo, un message — peu importe d'où tu viens. La prochaine étape se joue maintenant.</p>
          <Link to="/inscription" data-testid="final-cta-btn" className="relative inline-block mt-10">
            <button className="rounded-full bg-brand-ink px-9 py-4 font-bold text-white transition-transform duration-300 hover:scale-105">Je m'inscris maintenant</button>
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

export function Footer() {
  const [site, setSite] = useState({});
  useEffect(() => { api.get("/site").then(({ data }) => setSite(safeObject(data, "/site"))).catch(() => {}); }, []);
  const socials = [
    { k: "linkedin", I: Linkedin, l: "LinkedIn" },
    { k: "whatsapp_url", I: MessageCircle, l: "WhatsApp" },
    { k: "instagram", I: Instagram, l: "Instagram" },
    { k: "youtube", I: Youtube, l: "YouTube" },
    { k: "tiktok", I: Music2, l: "TikTok" },
    { k: "facebook", I: Facebook, l: "Facebook" },
  ];
  const visible = socials.filter((s) => (site[s.k] || "").trim());
  return (
    <footer className="border-t border-white/10 bg-brand-ink" data-testid="footer">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-brand" /><span className="font-display font-extrabold text-xl text-white">SK Mentoring</span></div>
          <p className="mt-4 text-white/50 max-w-sm leading-relaxed">L'accompagnement complet des étudiants et jeunes diplômés. Du TAGE MAGE à l'emploi, on vise le résultat.</p>
          <div className="mt-5 space-y-1.5 text-sm">
            {site.whatsapp && (
              <div className="flex items-center gap-2 text-white/70" data-testid="footer-phone">
                <MessageCircle size={15} className="text-brand" />
                <a href={site.whatsapp_url || `https://wa.me/${(site.whatsapp || '').replace(/[^\d]/g, '')}`} target="_blank" rel="noreferrer" className="hover:text-white">{site.whatsapp}</a>
              </div>
            )}
            {site.contact_email && (
              <div className="flex items-center gap-2 text-white/70">
                <ArrowUpRight size={15} className="text-brand" />
                <a href={`mailto:${site.contact_email}`} className="hover:text-white">{site.contact_email}</a>
              </div>
            )}
          </div>
          {visible.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2" data-testid="footer-socials">
              {visible.map((s) => (
                <a key={s.k} href={site[s.k]} target="_blank" rel="noreferrer" aria-label={s.l} data-testid={`social-${s.k}`}
                   className="grid place-items-center w-11 h-11 rounded-full border border-white/10 bg-white/5 text-white/70 hover:text-brand-ink hover:bg-brand hover:border-brand transition-all">
                  <s.I size={17} />
                </a>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="text-sm font-semibold text-white mb-4">Parcours</div>
          <ul className="space-y-2 text-white/55 text-sm">
            <li><a href="#offres" className="hover:text-brand">TAGE MAGE</a></li>
            <li><a href="#offres" className="hover:text-brand">Pack Emploi</a></li>
            <li><a href="#tarifs" className="hover:text-brand">À la carte</a></li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold text-white mb-4">Liens</div>
          <ul className="space-y-2 text-white/55 text-sm">
            <li><a href="#faq" className="hover:text-brand">FAQ</a></li>
            <li><Link to="/inscription" className="hover:text-brand">S'inscrire</Link></li>
            <li><Link to="/admin/login" className="hover:text-brand">Espace admin</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-xs text-white/40">© {new Date().getFullYear()} SK Mentoring. Tous droits réservés.</div>
    </footer>
  );
}
