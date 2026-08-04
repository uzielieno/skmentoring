/* eslint-disable react/no-unescaped-entities */
import { Link } from "react-router-dom";
import { Check, ArrowUpRight, Star, Quote } from "lucide-react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "../ui/accordion";
import Reveal from "./Reveal";
import { PLANS, TESTIMONIALS, FAQ, IMAGES } from "./data";

export function Pricing() {
  return (
    <section id="tarifs" className="border-t border-white/10 bg-brand-surface py-28" data-testid="pricing">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <Reveal className="text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-brand font-semibold">Tarifs</p>
          <h2 className="mt-4 font-display font-extrabold text-4xl md:text-6xl text-white tracking-tight">
            Un investissement, pas une dépense.
          </h2>
          <p className="mt-4 text-white/60 max-w-xl mx-auto">Paiement possible en 1, 2, 3 ou 4 fois. Choisis ton parcours et lance-toi.</p>
        </Reveal>

        <div className="mt-16 grid lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {PLANS.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.1}>
              <div
                data-testid={`plan-${p.id}`}
                className={`relative h-full flex flex-col rounded-3xl border p-10 md:p-12 transition-transform duration-300 hover:-translate-y-1 ${
                  p.featured ? "border-brand bg-brand-ink" : "border-white/10 bg-brand-ink"
                }`}
              >
                {p.featured && (
                  <span className="absolute -top-3 right-8 rounded-full bg-brand px-4 py-1 text-xs font-bold text-brand-ink">
                    Le plus demandé
                  </span>
                )}
                <h3 className="font-display font-bold text-2xl text-white">{p.name}</h3>
                <p className="mt-2 text-white/55 text-sm">{p.tagline}</p>
                <div className="mt-8 flex items-end gap-1">
                  <span className="font-serif text-6xl text-white">{p.price}€</span>
                  <span className="mb-2 text-white/50 text-sm">/ parcours</span>
                </div>
                <ul className="mt-8 space-y-3 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-white/80 text-sm">
                      <span className="grid place-items-center w-5 h-5 rounded-full bg-brand/15 text-brand shrink-0 mt-0.5">
                        <Check size={12} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to={`/inscription?plan=${p.id}`} data-testid={`plan-cta-${p.id}`} className="mt-10">
                  <button
                    className={`group w-full flex items-center justify-center gap-2 rounded-full py-4 font-bold transition-transform duration-300 hover:scale-[1.02] ${
                      p.featured ? "bg-brand text-brand-ink" : "bg-white text-brand-ink"
                    }`}
                  >
                    Je m'inscris à ce parcours
                    <ArrowUpRight size={18} className="transition-transform group-hover:rotate-45" />
                  </button>
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
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
          <h2 className="mt-4 font-display font-extrabold text-4xl md:text-5xl text-white tracking-tight">
            Des réussites concrètes.
          </h2>
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
                  <div>
                    <div className="font-display font-bold text-white">{t.name}</div>
                    <div className="text-sm text-brand">{t.role}</div>
                  </div>
                  <div className="flex gap-0.5 text-brand">
                    {[...Array(5)].map((_, k) => <Star key={k} size={13} fill="#FF5E00" />)}
                  </div>
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
          <h2 className="mt-4 font-display font-extrabold text-4xl md:text-5xl text-white tracking-tight">
            Les questions que tu te poses.
          </h2>
        </Reveal>
        <Reveal>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {FAQ.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border border-white/10 rounded-2xl bg-brand-ink px-6 data-[state=open]:border-brand/40"
              >
                <AccordionTrigger className="text-left text-white hover:no-underline py-6 font-display font-semibold text-lg">
                  {f.q}
                </AccordionTrigger>
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
          <h2 className="relative font-display font-extrabold text-4xl md:text-6xl text-brand-ink tracking-tight max-w-3xl mx-auto">
            Ta réussite commence par une inscription.
          </h2>
          <p className="relative mt-5 text-brand-ink/80 max-w-lg mx-auto">
            Un flyer, une vidéo, un message — peu importe d'où tu viens. La prochaine étape se joue maintenant.
          </p>
          <Link to="/inscription" data-testid="final-cta-btn" className="relative inline-block mt-10">
            <button className="rounded-full bg-brand-ink px-9 py-4 font-bold text-white transition-transform duration-300 hover:scale-105">
              Je m'inscris maintenant
            </button>
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-brand-ink" data-testid="footer">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand" />
            <span className="font-display font-extrabold text-xl text-white">Mentoring</span>
          </div>
          <p className="mt-4 text-white/50 max-w-sm leading-relaxed">
            L'accompagnement complet des étudiants et jeunes diplômés. Du TAGE MAGE à l'emploi, on vise le résultat.
          </p>
        </div>
        <div>
          <div className="text-sm font-semibold text-white mb-4">Parcours</div>
          <ul className="space-y-2 text-white/55 text-sm">
            <li><a href="#offres" className="hover:text-brand">TAGE MAGE</a></li>
            <li><a href="#offres" className="hover:text-brand">Pack Emploi</a></li>
            <li><a href="#tarifs" className="hover:text-brand">Tarifs</a></li>
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
      <div className="border-t border-white/10 py-6 text-center text-xs text-white/40">
        © {new Date().getFullYear()} Mentoring. Tous droits réservés.
      </div>
    </footer>
  );
}
