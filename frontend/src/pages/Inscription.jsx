/* eslint-disable react/no-unescaped-entities */
import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Loader2, Target, Briefcase } from "lucide-react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { COUNTRIES, PLANS } from "@/components/landing/data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const PARCOURS = [
  { key: "tage_mage", track: "tage_mage", plan: "tage_mage", title: "Je prépare le TAGE MAGE", price: "299€", icon: Target },
  { key: "job", track: "job", plan: "pack_emploi", title: "Je recherche un travail", price: "499€", icon: Briefcase },
];

export default function Inscription() {
  const [params] = useSearchParams();
  const initial = params.get("track") === "job" || params.get("plan") === "pack_emploi" ? "job" : "tage_mage";

  const [choice, setChoice] = useState(initial);
  const [form, setForm] = useState({ name: "", email: "", phone: "", country: "", installments: "1", message: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null); // {paymentLink}

  const parcours = useMemo(() => PARCOURS.find((p) => p.key === choice), [choice]);

  const set = (k) => (e) => setForm({ ...form, [k]: e?.target ? e.target.value : e });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.country) {
      toast.error("Merci de compléter tous les champs obligatoires.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name, email: form.email, phone: form.phone,
        track: parcours.track, plan: parcours.plan, country: form.country,
        installments: Number(form.installments), message: form.message,
      };
      await api.post("/inscriptions", payload);
      const { data: links } = await api.get("/payment-links");
      const link = links[`${parcours.plan}_${form.installments}`] || "";
      setDone({ link });
      toast.success("Inscription enregistrée ! Vérifie ta boîte mail.");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Erreur lors de l'envoi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-ink text-white grid lg:grid-cols-2">
      {/* Left editorial */}
      <div className="hidden lg:flex flex-col justify-between p-14 border-r border-white/10 bg-brand-surface sticky top-0 h-screen">
        <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors" data-testid="back-home">
          <ArrowLeft size={18} /> <span className="font-display font-extrabold text-lg text-white">Mentoring</span>
        </Link>
        <div>
          <h1 className="font-serif text-5xl leading-tight">Une inscription.<br />Un vrai parcours.</h1>
          <p className="mt-6 text-white/60 max-w-md leading-relaxed">
            Renseigne tes informations, choisis ton mode de paiement, et notre équipe te recontacte pour lancer ton accompagnement.
          </p>
          <ul className="mt-10 space-y-3 text-white/70">
            {["Accompagnement 100% en ligne", "Paiement en 1, 2, 3 ou 4 fois", "Réponse rapide de notre équipe"].map((t) => (
              <li key={t} className="flex items-center gap-3"><CheckCircle2 className="text-brand" size={18} /> {t}</li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-white/40">© {new Date().getFullYear()} Mentoring</p>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 md:p-14">
        {done ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md text-center" data-testid="success-block"
          >
            <div className="mx-auto grid place-items-center w-16 h-16 rounded-full bg-brand/15 text-brand">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="mt-6 font-display font-extrabold text-3xl">Inscription confirmée 🎯</h2>
            <p className="mt-4 text-white/60">
              Un email de confirmation vient de t'être envoyé. Dernière étape : finaliser ton paiement.
            </p>
            {done.link ? (
              <a href={done.link} target="_blank" rel="noreferrer" data-testid="payment-link">
                <button className="mt-8 w-full rounded-full bg-brand py-4 font-bold text-brand-ink hover:scale-[1.02] transition-transform inline-flex items-center justify-center gap-2">
                  Finaliser mon paiement <ArrowUpRight size={18} />
                </button>
              </a>
            ) : (
              <div className="mt-8 rounded-2xl border border-white/10 bg-brand-surface p-6 text-sm text-white/70">
                Notre équipe te transmettra le lien de paiement adapté à ton pays (paiement en ligne, Orange Money ou Mobile Money) très rapidement.
              </div>
            )}
            <Link to="/" className="mt-6 inline-block text-sm text-white/50 hover:text-white underline underline-offset-4">
              Retour à l'accueil
            </Link>
          </motion.div>
        ) : (
          <form onSubmit={submit} className="w-full max-w-lg" data-testid="inscription-form">
            <Link to="/" className="lg:hidden inline-flex items-center gap-2 text-white/60 mb-8"><ArrowLeft size={18} /> Retour</Link>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight">Finalise ton inscription</h2>
            <p className="mt-2 text-white/55">Quelques infos et c'est parti.</p>

            {/* Parcours choice */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              {PARCOURS.map((p) => (
                <button
                  type="button" key={p.key} onClick={() => setChoice(p.key)}
                  data-testid={`choice-${p.key}`}
                  className={`rounded-2xl border p-5 text-left transition-colors duration-200 ${
                    choice === p.key ? "border-brand bg-brand/10" : "border-white/10 bg-brand-surface hover:border-white/30"
                  }`}
                >
                  <p.icon size={22} className={choice === p.key ? "text-brand" : "text-white/60"} />
                  <div className="mt-3 font-semibold text-sm">{p.title}</div>
                  <div className="text-brand text-sm font-bold mt-1">{p.price}</div>
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <Label htmlFor="name" className="text-white/70">Nom complet *</Label>
                <Input id="name" data-testid="input-name" value={form.name} onChange={set("name")}
                  placeholder="Ex : Aïcha Mballa" className="mt-2 bg-brand-surface border-white/10 h-12 text-white" />
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="email" className="text-white/70">Email *</Label>
                  <Input id="email" type="email" data-testid="input-email" value={form.email} onChange={set("email")}
                    placeholder="toi@email.com" className="mt-2 bg-brand-surface border-white/10 h-12 text-white" />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-white/70">Téléphone / WhatsApp *</Label>
                  <Input id="phone" data-testid="input-phone" value={form.phone} onChange={set("phone")}
                    placeholder="+237 6 00 00 00 00" className="mt-2 bg-brand-surface border-white/10 h-12 text-white" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <Label className="text-white/70">Pays de résidence *</Label>
                  <Select value={form.country} onValueChange={set("country")}>
                    <SelectTrigger data-testid="select-country" className="mt-2 bg-brand-surface border-white/10 h-12 text-white">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent className="bg-brand-elevated border-white/10 text-white">
                      {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white/70">Paiement en</Label>
                  <Select value={form.installments} onValueChange={set("installments")}>
                    <SelectTrigger data-testid="select-installments" className="mt-2 bg-brand-surface border-white/10 h-12 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-brand-elevated border-white/10 text-white">
                      {[1, 2, 3, 4].map((n) => <SelectItem key={n} value={String(n)}>{n} fois</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="message" className="text-white/70">Un mot sur ton objectif (facultatif)</Label>
                <textarea id="message" data-testid="input-message" value={form.message} onChange={set("message")} rows={3}
                  placeholder="Ex : Je vise l'EDHEC, ou je cherche une alternance en marketing…"
                  className="mt-2 w-full rounded-lg bg-brand-surface border border-white/10 p-3 text-white placeholder:text-white/30 focus:outline-none focus:border-brand" />
              </div>
            </div>

            <button
              type="submit" disabled={loading} data-testid="submit-inscription"
              className="mt-8 w-full flex items-center justify-center gap-2 rounded-full bg-brand py-4 font-bold text-brand-ink hover:scale-[1.02] transition-transform disabled:opacity-60"
            >
              {loading ? <><Loader2 className="animate-spin" size={18} /> Envoi…</> : <>Valider mon inscription <ArrowUpRight size={18} /></>}
            </button>
            <p className="mt-4 text-center text-xs text-white/40">En validant, tu recevras un email de confirmation et le lien de paiement adapté.</p>
          </form>
        )}
      </div>
    </div>
  );
}
