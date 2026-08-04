import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, Star } from "lucide-react";
import { IMAGES } from "./data";

const line = {
  hidden: { y: "110%" },
  show: (i) => ({ y: "0%", transition: { duration: 0.9, delay: 0.15 * i, ease: [0.22, 1, 0.36, 1] } }),
};

const HERO_LINES = ["Ton parcours", "vers la réussite,", "sans détour."];

export default function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-end overflow-hidden pt-28 pb-16" data-testid="hero">
      {/* Floating clipped image */}
      <motion.div
        style={{ y: imgY }}
        className="absolute right-0 top-24 md:top-28 w-[46%] h-[70%] hidden lg:block"
      >
        <div className="relative w-full h-full overflow-hidden rounded-[2rem] border border-white/10">
          <motion.img
            style={{ scale: imgScale }}
            src={IMAGES.hero}
            alt="Jeune diplômé confiant"
            className="w-full h-full object-cover object-top grayscale-[15%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-ink via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between rounded-2xl bg-brand-ink/70 backdrop-blur-md border border-white/10 px-5 py-4">
            <div>
              <div className="flex gap-1 text-brand">
                {[...Array(5)].map((_, i) => <Star key={i} size={13} fill="#FF5E00" />)}
              </div>
              <p className="text-xs text-white/70 mt-1">Noté 4,9/5 par nos étudiants</p>
            </div>
            <span className="font-serif text-3xl text-white">+400</span>
          </div>
        </div>
      </motion.div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-10 w-full">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
          <span className="text-xs uppercase tracking-[0.2em] text-white/80">TAGE MAGE · Stage · Alternance · CDI</span>
        </motion.div>

        <h1 className="font-serif font-medium text-white text-[3.2rem] leading-[0.95] sm:text-7xl lg:text-[7.5rem] tracking-tight max-w-5xl">
          {HERO_LINES.map((l, i) => (
            <span key={i} className="mask-reveal">
              <motion.span variants={line} custom={i} initial="hidden" animate="show" className="block">
                {i === 2 ? <span className="text-brand italic">{l}</span> : l}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.7 }}
          className="mt-8 max-w-xl text-lg text-white/70 leading-relaxed"
        >
          On accompagne les étudiants et jeunes diplômés dans un parcours complet — pas des prestations isolées.
          Réussis le TAGE MAGE ou décroche le poste que tu vises. Concrètement.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05, duration: 0.7 }}
          className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        >
          <Link to="/inscription" data-testid="hero-cta">
            <button className="group flex items-center gap-3 rounded-full bg-brand pl-7 pr-3 py-3 font-bold text-brand-ink transition-transform duration-300 hover:scale-[1.04]">
              Démarrer mon accompagnement
              <span className="grid place-items-center w-9 h-9 rounded-full bg-brand-ink text-brand transition-transform duration-300 group-hover:rotate-45">
                <ArrowUpRight size={18} />
              </span>
            </button>
          </Link>
          <a href="#methode" className="text-sm text-white/70 hover:text-white transition-colors underline underline-offset-4">
            Voir comment ça marche
          </a>
        </motion.div>
      </div>
    </section>
  );
}
