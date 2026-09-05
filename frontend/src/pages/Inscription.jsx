/* eslint-disable react/no-unescaped-entities */
import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Check, Loader2, ShieldCheck, Lock, Zap, Sparkles, MessageCircle } from "lucide-react";
import { api, formatApiErrorDetail, safeArray, safeObject } from "@/lib/api";
import { COUNTRIES } from "@/components/landing/data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Inscription() {
  const [params] = useSearchParams();
  const initialPlan = params.get("plan") || (params.get("track") === "job" ? "pack_emploi" : "tage_mage");
  const initialServices = (params.get("services") || "").split(",").filter(Boolean);

  const [plans, setPlans] = useState([]);
  const [plansState, setPlansState] = useState("loading"); // loading | ok | error
  const [planId, setPlanId] = useState(initialPlan);
  const [services, setServices] = useState(Object.fromEntries(initialServices.map((s) => [s, true])));
  const [form, setForm] = useState({ name: "", email: "", phone: "", country: "", installments: "1", message: "", level: "", variant: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    api.get("/plans")
      .then(({ data }) => {
        const arr = safeArray(data, "/plans");
        setPlans(arr);
        setPlansState(arr.length ? "ok" : "error");
      })
      .catch(() => setPlansState("error"));
  }, []);

  const plan = useMemo(() => plans.find((p) => p.id === planId) || plans[0], [plans, planId]);
  const isCustom = plan?.type === "custom";
  const hasVariants = !!(plan && Array.isArray(plan.variants) && plan.variants.length > 0);
  const currentVariant = hasVariants ? (plan.variants.find((v) => v.id === form.variant) || plan.variants[0]) : null;
  const total = isCustom
    ? (Array.isArray(plan?.services) ? plan.services : []).reduce((s, x) => s + (services[x.id] ? x.price : 0), 0)
    : hasVariants
    ? (currentVariant?.price || 0)
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
      const svcIds = isCustom ? (Array.isArray(plan.services) ? plan.services : []).filter((s) => services[s.id]).map((s) => s.name) : [];
      const payload = {
        name: form.name, email: form.email, phone: form.phone,
        track: plan.track || "job", plan: plan.id, country: form.country,
        installments: Number(form.installments), message: form.message,
        services: svcIds, total_price: total, level: form.level,
        job_type: hasVariants ? (currentVariant?.id || "") : "",
      };
      await api.post("/inscriptions", payload);
      const { data: links } = await api.get("/payment-links");
      const linksObj = safeObject(links, "/payment-links");
      const linkKey = hasVariants
        ? `${plan.id}_${currentVariant.id}_${form.installments}`
        : `${plan.id}_${form.installments}`;
      const link = linksObj[linkKey] || "";
      setDone({
        link,
        planName: plan.name,
        installments: form.installments,
        total,
        services: svcIds,
        jobLabel: hasVariants ? (currentVariant?.name || "") : "",
      });
      toast.success("Inscription enregistrée ! Vérifie ta boîte mail.");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Erreur lors de l'envoi.");
    } finally { setLoading(false); }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-brand-ink text-white" data-testid="payment-page">
        <header className="border-b border-white/10 bg-brand-ink/80 backdrop-blur-xl">
          <div className="max-w-[1200px] mx-auto px-6 md:px-10 h-20 flex items-center justify-between">
            <Link to="/" data-testid="back-home" className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand" />
              <span className="font-display font-extrabold text-white">SK Mentoring</span>
            </Link>
            <div className="flex items-center gap-2 text-xs text-white/50">
              <ShieldCheck size={14} className="text-brand" /> Paiement 100% sécurisé
            </div>
          </div>
        </header>

        <main className="max-w-[1200px] mx-auto px-6 md:px-10 py-12 md:py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} data-testid="success-block">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-brand/15 border border-brand/30 px-4 py-1.5 text-xs uppercase tracking-widest text-brand">
                <CheckCircle2 size={13} /> Inscription enregistrée
              </span>
              <h1 className="mt-6 font-serif text-4xl md:text-6xl leading-[1.05] tracking-tight">
                Bienvenue {form.name.split(" ")[0]},<br />
                <span className="text-brand italic">une dernière étape.</span>
              </h1>
              <p className="mt-5 text-white/60 max-w-xl leading-relaxed">
                Un email de confirmation a été envoyé à <b className="text-white">{form.email}</b>. Finalise ton paiement pour démarrer ton accompagnement immédiatement.
              </p>
            </div>

            <div className="mt-12 grid lg:grid-cols-[1.1fr_0.9fr] gap-8">
              {/* Left: order + CTA */}
              <div className="rounded-3xl border border-white/10 bg-brand-surface p-8 md:p-10" data-testid="order-recap">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-widest text-white/40">Récapitulatif de commande</div>
                  <div className="text-xs text-white/40">#{Math.random().toString(36).slice(2, 8).toUpperCase()}</div>
                </div>
                <div className="mt-6 space-y-4">
                  <div className="flex items-start justify-between pb-4 border-b border-white/10">
                    <div>
                      <div className="font-display font-bold text-white text-lg">{done.planName}</div>
                      {done.jobLabel ? <div className="text-sm text-white/50 mt-0.5">Option : {done.jobLabel}</div> : null}
                      {done.services?.length ? <div className="text-sm text-white/50 mt-0.5">{done.services.join(" · ")}</div> : null}
                    </div>
                    <div className="font-serif text-2xl text-white">{done.total}€</div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Modalité de paiement</span>
                    <span className="text-white">{done.installments} fois</span>
                  </div>
                  {done.installments > 1 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Soit chaque échéance</span>
                      <span className="text-white">{Math.round(done.total / done.installments)}€</span>
                    </div>
                  )}
                  <div className="pt-4 border-t border-white/10 flex items-end justify-between">
                    <span className="text-white/60">Total à régler</span>
                    <div className="font-serif text-4xl text-brand">{done.total}€</div>
                  </div>
                </div>

                {done.link ? (
                  <a href={done.link} target="_blank" rel="noreferrer" data-testid="payment-link" className="block mt-8">
                    <button className="group w-full flex items-center justify-center gap-3 rounded-full bg-brand py-5 font-bold text-brand-ink hover:scale-[1.02] transition-transform">
                      <Lock size={18} /> Payer {done.total}€ maintenant
                      <ArrowUpRight size={20} className="transition-transform group-hover:rotate-45" />
                    </button>
                  </a>
                ) : (
                  <div className="mt-8 rounded-2xl border border-brand/30 bg-brand/10 p-5 text-sm text-white/80" data-testid="payment-missing">
                    <div className="font-semibold text-brand mb-1">Ton conseiller va te recontacter</div>
                    Le lien de paiement pour cette combinaison est en cours de préparation. Notre équipe te contacte sous 24h avec le lien adapté à ton pays.
                  </div>
                )}
                <p className="mt-4 text-center text-xs text-white/40 flex items-center justify-center gap-2">
                  <Lock size={11} /> Redirection vers un environnement de paiement sécurisé
                </p>
              </div>

              {/* Right: trust + support */}
              <div className="space-y-4">
                {[
                  { I: ShieldCheck, t: "Paiement 100% sécurisé", d: "Redirection vers un prestataire de paiement chiffré. SK Mentoring ne stocke aucune donnée bancaire." },
                  { I: Zap, t: "Accès sous 24h", d: "Dès le paiement confirmé, ton conseiller te contacte pour lancer le premier rendez-vous." },
                  { I: Sparkles, t: "Satisfaction suivie", d: "Points d'étape réguliers. Si ça ne fonctionne pas comme attendu, on ajuste immédiatement le plan." },
                ].map((it) => (
                  <div key={it.t} className="rounded-2xl border border-white/10 bg-brand-surface p-5 flex gap-4">
                    <span className="grid place-items-center w-10 h-10 rounded-full bg-brand/15 text-brand shrink-0"><it.I size={18} /></span>
                    <div>
                      <div className="font-semibold text-white">{it.t}</div>
                      <div className="text-sm text-white/55 mt-1 leading-relaxed">{it.d}</div>
                    </div>
                  </div>
                ))}
                <div className="rounded-2xl border border-white/10 bg-brand-surface p-5">
                  <div className="font-semibold text-white flex items-center gap-2"><MessageCircle size={17} className="text-brand" /> Une question avant de payer ?</div>
                  <p className="text-sm text-white/55 mt-2 leading-relaxed">Réponds simplement à ton email de confirmation, on te répond dans la journée.</p>
                  <Link to="/" className="mt-3 inline-block text-sm text-brand hover:underline">Retour à l'accueil</Link>
                </div>
              </div>
            </div>

            <div className="mt-14 pt-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-white/40">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><Lock size={12} /> Chiffrement SSL</span>
                <span className="flex items-center gap-1.5"><ShieldCheck size={12} /> Données protégées</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 size={12} /> Sans engagement de durée</span>
              </div>
              <span>© {new Date().getFullYear()} SK Mentoring</span>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

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
        <form onSubmit={submit} className="w-full max-w-lg" data-testid="inscription-form">
            <Link to="/" className="lg:hidden inline-flex items-center gap-2 text-white/60 mb-8"><ArrowLeft size={18} /> Retour</Link>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight">Finalise ton inscription</h2>
            <p className="mt-2 text-white/55">Quelques infos et c'est parti.</p>

            {plansState === "loading" && (
              <div className="mt-8 rounded-2xl border border-white/10 bg-brand-surface p-6 text-sm text-white/60 flex items-center gap-3" data-testid="plans-loading">
                <Loader2 className="animate-spin text-brand" size={16} /> Chargement des offres…
              </div>
            )}
            {plansState === "error" && (
              <div className="mt-8 rounded-2xl border border-brand/30 bg-brand/10 p-6" data-testid="plans-error">
                <div className="font-semibold text-brand mb-1">Offres momentanément indisponibles</div>
                <p className="text-sm text-white/70">Nos parcours ne peuvent pas être chargés pour l'instant. Réessaie dans quelques instants ou reviens à l'accueil.</p>
                <Link to="/" className="mt-3 inline-block text-sm text-brand hover:underline">Retour à l'accueil</Link>
              </div>
            )}

            {plansState === "ok" && (<>
            {/* Plan chooser */}
            <div className="mt-8 grid grid-cols-3 gap-2">
              {(Array.isArray(plans) ? plans : []).map((p) => (
                <button type="button" key={p.id} onClick={() => setPlanId(p.id)} data-testid={`choice-${p.id}`}
                  className={`rounded-2xl border p-4 text-left transition-colors duration-200 ${
                    planId === p.id ? "border-brand bg-brand/10" : "border-white/10 bg-brand-surface hover:border-white/30"
                  }`}>
                  <div className="text-xs font-semibold text-white">{p.name}</div>
                  <div className="text-brand text-sm font-bold mt-1">{p.type === "custom" ? "à la carte" : (Array.isArray(p.variants) && p.variants.length > 0) ? `dès ${Math.min(...p.variants.map((v) => v.price))}€` : `${p.price}€`}</div>
                </button>
              ))}
            </div>

            {/* Variant picker (e.g. Pack Emploi: Stage/Alt vs CDI) */}
            {hasVariants && (
              <div className="mt-6" data-testid="variant-picker">
                <Label className="text-white/70">Je recherche</Label>
                <Select value={currentVariant?.id || ""} onValueChange={set("variant")}>
                  <SelectTrigger data-testid="select-variant" className="mt-2 bg-brand-surface border-white/10 h-12 text-white"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent className="bg-brand-elevated border-white/10 text-white">
                    {(Array.isArray(plan.variants) ? plan.variants : []).map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.name} — {v.price}€</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {isCustom && (
              <div className="mt-6 space-y-2" data-testid="services-picker">
                <Label className="text-white/70">Prestations souhaitées</Label>
                {(Array.isArray(plan.services) ? plan.services : []).map((s) => (
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
            </>)}
          </form>
      </div>
    </div>
  );
}
