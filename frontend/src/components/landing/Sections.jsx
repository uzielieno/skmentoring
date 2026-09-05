/* eslint-disable react/no-unescaped-entities */
import { Link } from "react-router-dom";
import Marquee from "react-fast-marquee";
import { motion } from "framer-motion";
import { ArrowUpRight, Target, Play, CheckCircle2 } from "lucide-react";
import Reveal from "./Reveal";
import { STEPS, IMAGES } from "./data";

/* ---------- Social proof ---------- */
export function SocialProof() {
  const stats = [
    { v: "+400", l: "étudiants accompagnés" },
    { v: "4,9/5", l: "satisfaction moyenne" },
    { v: "92%", l: "atteignent leur objectif" },
    { v: "3 sem.", l: "délai moyen d'un premier résultat" },
  ];
  return (
    <section className="relative border-y border-white/10 bg-brand-surface" data-testid="social-proof">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        {stats.map((s, i) => (
          <Reveal key={s.l} delay={i * 0.08}>
            <div className="text-center md:text-left">
              <div className="font-serif text-4xl md:text-5xl text-white">{s.v}</div>
              <div className="mt-2 text-sm text-white/60">{s.l}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- Editorial marquee ---------- */
export function BrandMarquee() {
  const words = ["TAGE MAGE", "CV qui convertit", "LinkedIn premium", "Entretiens maîtrisés", "Stage", "Alternance", "CDI", "Grandes écoles"];
  return (
    <div className="py-10 border-b border-white/10 bg-brand-ink overflow-hidden" data-testid="marquee">
      <Marquee speed={40} gradient={false} autoFill>
        {words.map((w, i) => (
          <span key={i} className="mx-8 inline-flex items-center gap-8 font-serif text-4xl md:text-6xl">
            <span className={i % 2 ? "text-stroke" : "text-white"}>{w}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-brand" />
          </span>
        ))}
      </Marquee>
    </div>
  );
}

/* ---------- How it works (numbered manifesto) ---------- */
export function HowItWorks() {
  return (
    <section id="methode" className="max-w-[1400px] mx-auto px-6 md:px-10 py-28" data-testid="how-it-works">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.25em] text-brand font-semibold">La méthode</p>
        <h2 className="mt-4 font-display font-extrabold text-4xl md:text-6xl text-white max-w-3xl tracking-tight">
          Un parcours clair, du diagnostic au résultat.
        </h2>
      </Reveal>

      <div className="mt-16 grid gap-px bg-white/10 border border-white/10 rounded-3xl overflow-hidden md:grid-cols-2">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.06}>
            <div className="relative bg-brand-surface p-10 md:p-14 h-full group hover:bg-brand-elevated transition-colors duration-300">
              <span className="pointer-events-none absolute -top-6 right-6 font-serif text-[9rem] leading-none text-white/[0.04] select-none">
                {s.n}
              </span>
              <div className="relative">
                <span className="text-brand font-mono text-sm">{s.n}</span>
                <h3 className="mt-3 font-display font-bold text-2xl text-white">{s.t}</h3>
                <p className="mt-4 text-white/60 leading-relaxed max-w-md">{s.d}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- Offers (two dedicated tracks) ---------- */
function OfferCard({ img, tag, title, desc, points, reverse }) {
  return (
    <div className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${reverse ? "lg:[direction:rtl]" : ""}`}>
      <Reveal className="lg:[direction:ltr]">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 group">
          <img src={img} alt={title} className="w-full h-[420px] object-cover object-center grayscale-[15%] transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-ink/60 to-transparent" />
        </div>
      </Reveal>
      <Reveal delay={0.1} className="lg:[direction:ltr]">
        <span className="inline-block rounded-full border border-brand/40 bg-brand/10 px-4 py-1.5 text-xs uppercase tracking-widest text-brand">{tag}</span>
        <h3 className="mt-6 font-display font-extrabold text-3xl md:text-4xl text-white tracking-tight">{title}</h3>
        <p className="mt-4 text-white/60 leading-relaxed">{desc}</p>
        <ul className="mt-8 space-y-3">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-3 text-white/80">
              <CheckCircle2 size={20} className="text-brand mt-0.5 shrink-0" /> {p.icon ? null : p}
            </li>
          ))}
        </ul>
        <a href="#tarifs" className="mt-8 inline-flex items-center gap-2 text-brand font-semibold hover:gap-3 transition-all">
          Voir l'offre <ArrowUpRight size={18} />
        </a>
      </Reveal>
    </div>
  );
}

export function Offers() {
  return (
    <section id="offres" className="border-t border-white/10 bg-brand-ink py-28" data-testid="offers">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.25em] text-brand font-semibold">Deux parcours</p>
          <h2 className="mt-4 font-display font-extrabold text-4xl md:text-6xl text-white max-w-3xl tracking-tight">
            Choisis l'objectif. On s'occupe du chemin.
          </h2>
        </Reveal>

        <div className="mt-20 space-y-28">
          <OfferCard
            img={IMAGES.tage}
            tag="Concours"
            title="Préparation TAGE MAGE"
            desc="Une préparation exigeante et structurée pour viser le score qui ouvre les portes des meilleures écoles de management."
            points={["Méthodologie des 6 sous-tests", "Examens blancs corrigés", "Coaching et stratégie du jour J", "Suivi de progression personnalisé"]}
          />
          <OfferCard
            reverse
            img={IMAGES.emploi}
            tag="Employabilité"
            title="Pack Emploi — Stage, alternance & CDI"
            desc="Du CV à l'offre signée. On optimise ton image professionnelle et on te prépare à convaincre en entretien."
            points={["CV & LinkedIn optimisés", "Préparation intensive aux entretiens", "Stratégie de candidature qui sort du lot", "Accompagnement jusqu'à la signature"]}
          />
        </div>
      </div>
    </section>
  );
}

/* ---------- Mentors block ---------- */
export function FreeContent() {
  return (
    <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-28" data-testid="mentors">
      <div className="rounded-[2.5rem] border border-white/10 bg-brand-surface p-8 md:p-14">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-1.5 text-xs uppercase tracking-widest text-white/70">
              <span className="w-1.5 h-1.5 rounded-full bg-brand" /> Nos mentors
            </span>
            <h2 className="mt-6 font-display font-extrabold text-3xl md:text-5xl text-white tracking-tight">
              Des mentors qui ont fait le chemin avant toi.
            </h2>
            <p className="mt-5 text-white/60 leading-relaxed max-w-md">
              Diplômés des meilleures écoles, passés par des grandes entreprises et fondateurs de leur propre parcours — nos mentors t'accompagnent avec l'exigence d'un coach et la bienveillance d'un grand frère. Ils partagent leur méthode, leurs erreurs et leurs raccourcis pour t'éviter de perdre du temps.
            </p>
            <ul className="mt-8 space-y-3 text-white/80">
              {["Parcours réels, résultats prouvés", "Écoute franche et retours actionnables", "Accompagnement humain, jamais scolaire"].map((t) => (
                <li key={t} className="flex items-start gap-3"><CheckCircle2 size={18} className="text-brand mt-0.5 shrink-0" /> {t}</li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden border border-white/10 group" data-testid="mentors-media">
              <div className="grid grid-cols-2 h-full">
                <div className="relative overflow-hidden border-r border-white/10">
                  <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=900&auto=format&fit=crop&q=80"
                    alt="Mentor SK Mentoring" className="w-full h-full object-cover grayscale-[10%] transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="relative overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&auto=format&fit=crop&q=80"
                    alt="Mentor SK Mentoring" className="w-full h-full object-cover grayscale-[10%] transition-transform duration-700 group-hover:scale-105" />
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-brand-ink to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between rounded-2xl bg-brand-ink/80 backdrop-blur-md border border-white/10 px-5 py-3.5">
                <div>
                  <div className="text-white text-sm font-display font-bold">Rencontre l'équipe</div>
                  <div className="text-white/60 text-xs mt-0.5">Vidéo bientôt disponible</div>
                </div>
                <span className="grid place-items-center w-10 h-10 rounded-full bg-brand text-brand-ink"><Play size={16} /></span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------- Distinction (payment / region) ---------- */
export function Distinction() {
  const cards = [
    { icon: Target, t: "Je prépare le TAGE MAGE", d: "Objectif score. Préparation intensive, méthodo et examens blancs pour intégrer l'école de tes rêves.", cta: "Préparer le concours", track: "tage" },
    { icon: ArrowUpRight, t: "Je recherche un travail", d: "Objectif emploi. CV, LinkedIn, entretiens et stratégie pour décrocher un stage, une alternance ou un CDI.", cta: "Décrocher un poste", track: "job" },
  ];
  return (
    <section className="max-w-[1400px] mx-auto px-6 md:px-10 pb-28" data-testid="distinction">
      <Reveal>
        <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white tracking-tight text-center max-w-3xl mx-auto">
          Tu es là pour quoi, exactement&nbsp;?
        </h2>
      </Reveal>
      <div className="mt-14 grid md:grid-cols-2 gap-6">
        {cards.map((c, i) => (
          <Reveal key={c.track} delay={i * 0.1}>
            <Link to={`/inscription?track=${c.track}`} data-testid={`distinction-${c.track}`}>
              <div className="group h-full rounded-3xl border border-white/10 bg-brand-surface p-10 md:p-12 hover:bg-brand hover:border-brand transition-colors duration-300">
                <c.icon size={32} className="text-brand group-hover:text-brand-ink transition-colors" />
                <h3 className="mt-6 font-display font-bold text-2xl md:text-3xl text-white group-hover:text-brand-ink transition-colors">{c.t}</h3>
                <p className="mt-4 text-white/60 group-hover:text-brand-ink/80 leading-relaxed transition-colors">{c.d}</p>
                <span className="mt-8 inline-flex items-center gap-2 font-semibold text-brand group-hover:text-brand-ink transition-colors">
                  {c.cta} <ArrowUpRight size={18} />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
