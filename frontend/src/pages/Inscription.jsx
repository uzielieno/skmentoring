/* eslint-disable react/no-unescaped-entities */
import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Check, Loader2 } from "lucide-react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { COUNTRIES } from "@/components/landing/data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Inscription() {
  const [params] = useSearchParams();
  const initialPlan = params.get("plan") || (params.get("track") === "job" ? "pack_emploi" : "tage_mage");
  const initialServices = (params.get("services") || "").split(",").filter(Boolean);

  const [plans, setPlans] = useState([]);
  const [planId, setPlanId] = useState(initialPlan);
  const [services, setServices] = useState(Object.fromEntries(initialServices.map((s) => [s, true])));
  const [form, setForm] = useState({ name: "", email: "", phone: "", country: "", installments: "1", message: "", level: "", job_type: "stage_alt" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => { api.get("/plans").then(({ data }) => setPlans(data)).catch(() => {}); }, []);

  const plan = useMemo(() => plans.find((p) => p.id === planId) || plans[0], [plans, planId]);
  const isCustom = plan?.type === "custom";
  const isPackEmploi = plan?.id === "pack_emploi";
  const total = isCustom
    ? (plan.services || []).reduce((s, x) => s + (services[x.id] ? x.price : 0), 0)
    : isPackEmploi
    ? (form.job_type === "cdi" ? 499 : 150)
    : plan?.price || 0;

  const set = (k) => (e) => setForm({ ...form, [k]: e?.target ? e.target.value : e });

  const submit = async (e) => {
    e.preventDefault();
    if (!plan) return;
    if (!form.name || !form.email || !form.phone || !form.country) {
      toast.error("Merci de compléter tous les champs obligatoires.");
      return;
    }
    if (isCustom && total === 0) {
      toast.error("Sélectionne au moins une prestation.");
      return;
    }
    setLoading(true);
    try {
      const svcIds = isCustom ? (plan.services || []).filter((s) => services[s.id]).map((s) => s.name) : [];
      const payload = {
        name: form.name, email: form.email, phone: form.phone,
        track: plan.track || "job", plan: plan.id, country: form.country,
        installments: Number(form.installments), message: form.message,
        services: svcIds, total_price: total, level: form.level,
        job_type: isPackEmploi ? form.job_type : "",
      };
      await api.post("/inscriptions", payload);
      const { data: links } = await api.get("/payment-links");
      const linkKey = isPackEmploi
        ? `pack_emploi_${form.job_type}_${form.installments}`
        : `${plan.id}_${form.installments}`;
      const link = links[linkKey] || "";
      setDone({
        link,
        planName: plan.name,
        installments: form.installments,
        total,
        services: svcIds,
        jobLabel: isPackEmploi ? (form.job_type === "cdi" ? "CDI" : "Stage / Alternance") : "",
      });
      toast.success("Inscription enregistrée ! Vérifie ta boîte mail.");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Erreur lors de l'envoi.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-brand-ink text-white grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-14 border-r border-white/10 bg-brand-surface sticky top-0 h-screen">
        <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors" data-testid="back-home">
          <ArrowLeft size={18} /> <span className="font-display font-extrabold text-lg text-white">SK Mentoring</span>
        </Link>
        <div>
          <h1 className="font-serif text-5xl leading-tight">Une inscription.<br />Un vrai parcours.</h1>
          <p className="mt-6 text-white/60 max-w-md leading-relaxed">Renseigne tes informations, choisis ton mode de paiement, et notre équipe te recontacte pour lancer ton accompagnement.</p>
          <ul className="mt-10 space-y-3 text-white/70">
            {["Accompagnement 100% en ligne", "Paiement en 1, 2, 3 ou 4 fois", "Réponse rapide de notre équipe"].map((t) => (
              <li key={t} className="flex items-center gap-3"><CheckCircle2 className="text-brand" size={18} /> {t}</li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-white/40">© {new Date().getFullYear()} SK Mentoring</p>
      </div>

      <div className="flex items-center justify-center p-6 md:p-14">
        {done ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md" data-testid="success-block">
            <div className="text-center">
              <div className="mx-auto grid place-items-center w-16 h-16 rounded-full bg-brand/15 text-brand"><CheckCircle2 size={32} /></div>
              <h2 className="mt-6 font-display font-extrabold text-3xl">Dernière étape : ton paiement</h2>
              <p className="mt-3 text-white/60 text-sm">Un email de confirmation vient de t'être envoyé.</p>
            </div>
            <div className="mt-8 rounded-2xl border border-white/10 bg-brand-surface p-6" data-testid="order-recap">
              <div className="text-xs uppercase tracking-widest text-white/40">Récapitulatif</div>
              <div className="mt-3 flex items-start justify-between">
                <div>
                  <div className="font-display font-bold text-white">{done.planName}</div>
                  {done.jobLabel ? <div className="text-xs text-white/50 mt-0.5">{done.jobLabel}</div> : null}
                  {done.services?.length ? <div className="text-xs text-white/50 mt-0.5">{done.services.join(" · ")}</div> : null}
                  <div className="text-xs text-white/50 mt-0.5">Paiement en {done.installments} fois</div>
                </div>
                <div className="text-right">
                  <div className="font-serif text-3xl text-brand">{done.total}€</div>
                </div>
              </div>
            </div>
            {done.link ? (
              <a href={done.link} target="_blank" rel="noreferrer" data-testid="payment-link">
                <button className="mt-6 w-full rounded-full bg-brand py-4 font-bold text-brand-ink hover:scale-[1.02] transition-transform inline-flex items-center justify-center gap-2">Payer maintenant <ArrowUpRight size={18} /></button>
              </a>
            ) : (
              <div className="mt-6 rounded-2xl border border-white/10 bg-brand-surface p-6 text-sm text-white/70 text-center">Le lien de paiement pour cette combinaison n'est pas encore configuré. Notre équipe te contacte très vite.</div>
            )}
            <Link to="/" className="mt-6 block text-center text-sm text-white/50 hover:text-white underline underline-offset-4">Retour à l'accueil</Link>
          </motion.div>
        ) : (
          <form onSubmit={submit} className="w-full max-w-lg" data-testid="inscription-form">
            <Link to="/" className="lg:hidden inline-flex items-center gap-2 text-white/60 mb-8"><ArrowLeft size={18} /> Retour</Link>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight">Finalise ton inscription</h2>
            <p className="mt-2 text-white/55">Quelques infos et c'est parti.</p>

            {/* Plan chooser */}
            <div className="mt-8 grid grid-cols-3 gap-2">
              {plans.map((p) => (
                <button type="button" key={p.id} onClick={() => setPlanId(p.id)} data-testid={`choice-${p.id}`}
                  className={`rounded-2xl border p-4 text-left transition-colors duration-200 ${
                    planId === p.id ? "border-brand bg-brand/10" : "border-white/10 bg-brand-surface hover:border-white/30"
                  }`}>
                  <div className="text-xs font-semibold text-white">{p.name}</div>
                  <div className="text-brand text-sm font-bold mt-1">{p.type === "custom" ? "à la carte" : p.id === "pack_emploi" ? "dès 150€" : `${p.price}€`}</div>
                </button>
              ))}
            </div>

            {/* Custom services picker */}
            {isPackEmploi && (
              <div className="mt-6" data-testid="jobtype-picker">
                <Label className="text-white/70">Je recherche</Label>
                <Select value={form.job_type} onValueChange={set("job_type")}>
                  <SelectTrigger data-testid="select-jobtype" className="mt-2 bg-brand-surface border-white/10 h-12 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-brand-elevated border-white/10 text-white">
                    <SelectItem value="stage_alt">Stage / Alternance — 150€</SelectItem>
                    <SelectItem value="cdi">CDI — 499€</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {isCustom && (
              <div className="mt-6 space-y-2" data-testid="services-picker">
                <Label className="text-white/70">Prestations souhaitées</Label>
                {(plan.services || []).map((s) => (
                  <label key={s.id} data-testid={`svc-${s.id}`}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 cursor-pointer ${
                      services[s.id] ? "border-brand bg-brand/10" : "border-white/10 bg-brand-surface"
                    }`}>
                    <div className="flex items-center gap-3">
                      <span className={`grid place-items-center w-5 h-5 rounded-md border ${services[s.id] ? "border-brand bg-brand" : "border-white/20"}`}>
                        {services[s.id] && <Check size={13} className="text-brand-ink" />}
                      </span>
                      <span className="text-white text-sm">{s.name}</span>
                    </div>
                    <span className="text-brand font-bold text-sm">{s.price}€</span>
                    <input type="checkbox" className="hidden" checked={!!services[s.id]}
                      onChange={(e) => setServices({ ...services, [s.id]: e.target.checked })} />
                  </label>
                ))}
                <div className="flex justify-between text-sm text-white/70 pt-2">
                  <span>Total</span><span className="text-brand font-bold text-lg" data-testid="insc-total">{total}€</span>
                </div>
              </div>
            )}

            <div className="mt-6 space-y-5">
              <div>
                <Label htmlFor="name" className="text-white/70">Nom complet *</Label>
                <Input id="name" data-testid="input-name" value={form.name} onChange={set("name")} placeholder="Ex : Aïcha Mballa" className="mt-2 bg-brand-surface border-white/10 h-12 text-white" />
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="email" className="text-white/70">Email *</Label>
                  <Input id="email" type="email" data-testid="input-email" value={form.email} onChange={set("email")} placeholder="toi@email.com" className="mt-2 bg-brand-surface border-white/10 h-12 text-white" />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-white/70">Téléphone / WhatsApp *</Label>
                  <Input id="phone" data-testid="input-phone" value={form.phone} onChange={set("phone")} placeholder="+237 6 00 00 00 00" className="mt-2 bg-brand-surface border-white/10 h-12 text-white" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <Label className="text-white/70">Pays de résidence *</Label>
                  <Select value={form.country} onValueChange={set("country")}>
                    <SelectTrigger data-testid="select-country" className="mt-2 bg-brand-surface border-white/10 h-12 text-white"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent className="bg-brand-elevated border-white/10 text-white">{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white/70">Niveau</Label>
                  <Select value={form.level} onValueChange={set("level")}>
                    <SelectTrigger data-testid="select-level" className="mt-2 bg-brand-surface border-white/10 h-12 text-white"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent className="bg-brand-elevated border-white/10 text-white">
                      {["Licence 2","Licence 3","Master 1","Master 2","Jeune diplômé","Autre"].map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-white/70">Paiement en</Label>
                <Select value={form.installments} onValueChange={set("installments")}>
                  <SelectTrigger data-testid="select-installments" className="mt-2 bg-brand-surface border-white/10 h-12 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-brand-elevated border-white/10 text-white">{[1, 2, 3, 4].map((n) => <SelectItem key={n} value={String(n)}>{n} fois</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="message" className="text-white/70">Un mot sur ton objectif (facultatif)</Label>
                <textarea id="message" data-testid="input-message" value={form.message} onChange={set("message")} rows={3}
                  placeholder="Ex : Je vise l'EDHEC, ou je cherche une alternance en marketing…"
                  className="mt-2 w-full rounded-lg bg-brand-surface border border-white/10 p-3 text-white placeholder:text-white/30 focus:outline-none focus:border-brand" />
              </div>
            </div>

            <button type="submit" disabled={loading} data-testid="submit-inscription"
              className="mt-8 w-full flex items-center justify-center gap-2 rounded-full bg-brand py-4 font-bold text-brand-ink hover:scale-[1.02] transition-transform disabled:opacity-60">
              {loading ? <><Loader2 className="animate-spin" size={18} /> Envoi…</> : <>Valider mon inscription {total > 0 ? `· ${total}€` : ""} <ArrowUpRight size={18} /></>}
            </button>
            <p className="mt-4 text-center text-xs text-white/40">En validant, tu recevras un email de confirmation et le lien de paiement adapté.</p>
          </form>
        )}
      </div>
    </div>
  );
}
