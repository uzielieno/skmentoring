/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";

const links = [
  { label: "Parcours", href: "#offres" },
  { label: "Méthode", href: "#methode" },
  { label: "Tarifs", href: "#tarifs" },
  { label: "Témoignages", href: "#temoignages" },
  { label: "FAQ", href: "#faq" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        scrolled ? "bg-brand-ink/90 backdrop-blur-xl border-b border-white/10" : "bg-transparent"
      }`}
      data-testid="navbar"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-20 flex items-center justify-between">
        <Link to="/" data-testid="logo" className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand" />
          <span className="font-display font-extrabold text-xl tracking-tight text-white">Mentoring</span>
        </Link>

        <nav className="hidden md:flex items-center gap-9">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-white/70 hover:text-white transition-colors duration-200">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/inscription" data-testid="nav-cta">
            <button className="group relative overflow-hidden rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-brand-ink transition-transform duration-300 hover:scale-[1.04]">
              Je m'inscris
            </button>
          </Link>
        </div>

        <button className="md:hidden text-white" onClick={() => setOpen(!open)} data-testid="menu-toggle">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-brand-ink border-t border-white/10 px-6 py-6 flex flex-col gap-4">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-white/80 py-1">
              {l.label}
            </a>
          ))}
          <Link to="/inscription" onClick={() => setOpen(false)}>
            <button className="w-full rounded-full bg-brand px-6 py-3 font-bold text-brand-ink">Je m'inscris</button>
          </Link>
        </div>
      )}
    </motion.header>
  );
}
