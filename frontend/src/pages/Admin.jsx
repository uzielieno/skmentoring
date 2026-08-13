/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  LayoutDashboard, Users, Package, Link2, Settings, LogOut, Loader2, Save, Search, Filter,
  RefreshCw, Plus, Trash2, GraduationCap, Briefcase, BadgeCheck,
} from "lucide-react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { COUNTRIES } from "@/components/landing/data";

const STATUS_COLOR = (s) => {
  if (s === "nouveau") return "text-brand bg-brand/15";
  if (s === "contacte") return "text-blue-400 bg-blue-400/15";
  if (s && s.startsWith("paye")) return "text-emerald-400 bg-emerald-400/15";
  return "text-white/70 bg-white/10";
};

function statusOptions(installments) {
  const opts = ["nouveau", "contacte"];
  const n = Math.max(1, Number(installments) || 1);
  for (let i = 1; i <= n; i++) opts.push(`paye_${i}_${n}`);
  return opts;
}
const statusLabel = (s) => s?.startsWith("paye_") ? `Payé ${s.split("_")[1]}/${s.split("_")[2]}` : (s === "contacte" ? "Contacté" : "Nouveau");

/* ------------------ LOGIN ------------------ */
function Login({ onLogged }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("mentoring_token", data.token); onLogged();
    } catch (err) { toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Connexion impossible."); }
    finally { setLoading(false); }
  };
  return (
    <div className="min-h-screen grid place-items-center bg-brand-ink text-white p-6">
      <form onSubmit={submit} className="w-full max-w-sm" data-testid="admin-login-form">
        <div className="flex items-center gap-2 mb-8"><span className="w-2.5 h-2.5 rounded-full bg-brand" /><span className="font-display font-extrabold text-xl">SK Mentoring · Admin</span></div>
        <h1 className="font-display font-extrabold text-3xl">Espace équipe</h1>
        <p className="mt-2 text-white/55 text-sm">Connecte-toi pour consulter les inscriptions.</p>
        <div className="mt-8 space-y-4">
          <div><Label className="text-white/70">Email</Label><Input data-testid="login-email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-2 bg-brand-surface border-white/10 h-12 text-white" /></div>
          <div><Label className="text-white/70">Mot de passe</Label><Input data-testid="login-password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="mt-2 bg-brand-surface border-white/10 h-12 text-white" /></div>
        </div>
        <button type="submit" disabled={loading} data-testid="login-submit" className="mt-8 w-full flex items-center justify-center gap-2 rounded-full bg-brand py-3.5 font-bold text-brand-ink hover:scale-[1.02] transition-transform disabled:opacity-60">{loading ? <Loader2 className="animate-spin" size={18} /> : "Se connecter"}</button>
      </form>
    </div>
  );
}

/* ------------------ DASHBOARD (stats) ------------------ */
function DashboardView({ stats }) {
  const cards = [
    { icon: Users, l: "Total inscriptions", v: stats.total ?? 0 },
    { icon: GraduationCap, l: "TAGE MAGE", v: stats.tage_mage ?? 0 },
    { icon: Briefcase, l: "Pack Emploi", v: stats.pack_emploi ?? 0 },
    { icon: BadgeCheck, l: "Payés", v: stats.paye ?? 0 },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.l} className="rounded-2xl border border-white/10 bg-brand-surface p-6" data-testid={`stat-${c.l}`}>
          <c.icon className="text-brand" size={20} />
          <div className="mt-4 font-serif text-4xl">{c.v}</div>
          <div className="text-sm text-white/55 mt-1">{c.l}</div>
        </div>
      ))}
    </div>
  );
}

/* ------------------ INSCRIPTIONS ------------------ */
function InscriptionsView({ rows, plans, onChangeStatus, loading, onReload }) {
  const [q, setQ] = useState("");
  const [f, setF] = useState({ plan: "all", status: "all", country: "all" });
  const planLabel = (id) => plans.find((p) => p.id === id)?.name || id;

  const filtered = rows.filter((r) => {
    const s = [r.name, r.email, r.phone, r.country, r.message, r.level].join(" ").toLowerCase();
    if (q && !s.includes(q.toLowerCase())) return false;
    if (f.plan !== "all" && r.plan !== f.plan) return false;
    if (f.country !== "all" && r.country !== f.country) return false;
    if (f.status !== "all") {
      if (f.status === "paye" && !r.status?.startsWith("paye")) return false;
      if (f.status !== "paye" && r.status !== f.status) return false;
    }
    return true;
  });

  return (
    <div className="rounded-2xl border border-white/10 bg-brand-surface overflow-hidden" data-testid="inscriptions-view">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-white/10">
        <h3 className="font-display font-bold">Inscriptions ({filtered.length})</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <Input data-testid="search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="pl-9 h-10 w-56 bg-brand-ink border-white/10 text-white text-sm" />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <button data-testid="filter-btn" className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm hover:border-brand"><Filter size={14} /> Filtres</button>
            </PopoverTrigger>
            <PopoverContent className="bg-brand-elevated border-white/10 text-white w-72 space-y-4 p-4">
              <div>
                <Label className="text-white/60 text-xs">Plan</Label>
                <Select value={f.plan} onValueChange={(v) => setF({ ...f, plan: v })}>
                  <SelectTrigger data-testid="filter-plan" className="mt-1 bg-brand-ink border-white/10 h-9 text-white text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-brand-elevated border-white/10 text-white">
                    <SelectItem value="all">Tous</SelectItem>
                    {plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/60 text-xs">Statut</Label>
                <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
                  <SelectTrigger data-testid="filter-status" className="mt-1 bg-brand-ink border-white/10 h-9 text-white text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-brand-elevated border-white/10 text-white">
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="nouveau">Nouveau</SelectItem>
                    <SelectItem value="contacte">Contacté</SelectItem>
                    <SelectItem value="paye">Payé (toutes tranches)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/60 text-xs">Pays</Label>
                <Select value={f.country} onValueChange={(v) => setF({ ...f, country: v })}>
                  <SelectTrigger data-testid="filter-country" className="mt-1 bg-brand-ink border-white/10 h-9 text-white text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-brand-elevated border-white/10 text-white">
                    <SelectItem value="all">Tous</SelectItem>
                    {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <button onClick={() => setF({ plan: "all", status: "all", country: "all" })} className="text-xs text-white/50 hover:text-white underline">Réinitialiser</button>
            </PopoverContent>
          </Popover>
          <button onClick={onReload} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm hover:border-brand"><RefreshCw size={14} /></button>
        </div>
      </div>
      {loading ? (
        <div className="p-16 grid place-items-center text-white/50"><Loader2 className="animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="p-16 text-center text-white/50" data-testid="empty-state">Aucune inscription.</div>
      ) : (
        <div className="overflow-x-auto">
          <Table data-testid="inscriptions-table">
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/50">Étudiant</TableHead>
                <TableHead className="text-white/50">Contact</TableHead>
                <TableHead className="text-white/50">Niveau</TableHead>
                <TableHead className="text-white/50">Parcours</TableHead>
                <TableHead className="text-white/50">Pays</TableHead>
                <TableHead className="text-white/50">Paiement</TableHead>
                <TableHead className="text-white/50">Commentaire client</TableHead>
                <TableHead className="text-white/50">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} className="border-white/10 align-top" data-testid={`row-${r.id}`}>
                  <TableCell className="font-medium text-white">{r.name}<div className="text-xs text-white/40">{new Date(r.created_at).toLocaleDateString("fr-FR")}</div></TableCell>
                  <TableCell className="text-white/70 text-sm">{r.email}<div className="text-xs text-white/40">{r.phone}</div></TableCell>
                  <TableCell className="text-white/70 text-sm">{r.level || "—"}</TableCell>
                  <TableCell><span className="rounded-full bg-white/10 px-3 py-1 text-xs whitespace-nowrap">{planLabel(r.plan)}</span>{r.job_type ? <div className="text-xs text-white/50 mt-1">{r.job_type === "cdi" ? "CDI" : "Stage / Alternance"}</div> : null}{r.services?.length ? <div className="text-xs text-white/40 mt-1">{r.services.join(", ")}</div> : null}{r.total_price ? <div className="text-xs text-brand mt-0.5">{r.total_price}€</div> : null}</TableCell>
                  <TableCell className="text-white/70 text-sm">{r.country}</TableCell>
                  <TableCell className="text-white/70 text-sm">{r.installments} fois</TableCell>
                  <TableCell className="text-white/70 text-sm max-w-[240px]"><div className="whitespace-pre-wrap">{r.message || <span className="text-white/30">—</span>}</div></TableCell>
                  <TableCell>
                    <Select value={r.status} onValueChange={(v) => onChangeStatus(r.id, v)}>
                      <SelectTrigger data-testid={`status-${r.id}`} className={`h-8 w-36 border-0 text-xs font-semibold ${STATUS_COLOR(r.status)}`}><SelectValue>{statusLabel(r.status)}</SelectValue></SelectTrigger>
                      <SelectContent className="bg-brand-elevated border-white/10 text-white">
                        {statusOptions(r.installments).map((s) => <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

/* ------------------ PLANS ------------------ */
function PlansView({ plans, onReload }) {
  const [savingId, setSavingId] = useState(null);
  const [creating, setCreating] = useState(false);

  const update = async (p) => {
    setSavingId(p.id);
    try { await api.put(`/admin/plans/${p.id}`, { ...p, price: Number(p.price) || 0 }); toast.success("Enregistré."); onReload(); }
    catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); } finally { setSavingId(null); }
  };
  const del = async (p) => {
    if (!window.confirm(`Supprimer "${p.name}" ?`)) return;
    try { await api.delete(`/admin/plans/${p.id}`); toast.success("Plan supprimé."); onReload(); }
    catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
  };
  const create = async (type) => {
    const id = window.prompt(`ID unique (ex : coaching_pro) pour ce nouveau plan ${type === "custom" ? "à la carte" : "fixe"} :`);
    if (!id) return;
    const payload = {
      id: id.toLowerCase().replace(/\s+/g, "_"), name: "Nouveau plan", price: 0, tagline: "",
      features: type === "fixed" ? ["Détail 1"] : [], services: type === "custom" ? [] : [],
      type, track: "job", featured: false, order: 99, active: true, deletable: true,
    };
    setCreating(true);
    try { await api.post("/admin/plans", payload); toast.success("Plan créé."); onReload(); }
    catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); } finally { setCreating(false); }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-brand-surface p-6" data-testid="plans-view">
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <h3 className="font-display font-bold">Gestion des plans</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => create("fixed")} disabled={creating} data-testid="add-plan-fixed" className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-bold text-brand-ink hover:scale-[1.02] transition-transform"><Plus size={14} /> Plan fixe</button>
          <button onClick={() => create("custom")} disabled={creating} data-testid="add-plan-custom" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-brand-ink hover:scale-[1.02] transition-transform"><Plus size={14} /> Plan à la carte</button>
        </div>
      </div>
      <div className="space-y-4">
        {plans.map((p, i) => <PlanEditor key={p.id} p={p} onSave={update} onDelete={del} saving={savingId === p.id} />)}
      </div>
    </div>
  );
}

function PlanEditor({ p, onSave, onDelete, saving }) {
  const [d, setD] = useState(p);
  useEffect(() => setD(p), [p]);
  const upd = (patch) => setD({ ...d, ...patch });
  const updSvc = (si, patch) => upd({ services: d.services.map((s, k) => (k === si ? { ...s, ...patch } : s)) });
  const addSvc = () => upd({ services: [...(d.services || []), { id: `svc_${Date.now()}`, name: "Nouvelle prestation", price: 0 }] });
  const rmSvc = (si) => upd({ services: d.services.filter((_, k) => k !== si) });
  return (
    <div data-testid={`plan-edit-${p.id}`} className="rounded-xl border border-white/10 bg-brand-ink p-5">
      <div className="grid md:grid-cols-4 gap-3">
        <div><Label className="text-white/50 text-xs">ID</Label><Input value={d.id} disabled className="mt-1 bg-brand-surface border-white/10 h-9 text-white/60 text-sm" /></div>
        <div><Label className="text-white/50 text-xs">Nom</Label><Input value={d.name} onChange={(e) => upd({ name: e.target.value })} className="mt-1 bg-brand-surface border-white/10 h-9 text-white text-sm" /></div>
        <div><Label className="text-white/50 text-xs">Prix (€)</Label><Input type="number" value={d.price} onChange={(e) => upd({ price: e.target.value })} className="mt-1 bg-brand-surface border-white/10 h-9 text-white text-sm" /></div>
        <div><Label className="text-white/50 text-xs">Ordre</Label><Input type="number" value={d.order} onChange={(e) => upd({ order: Number(e.target.value) })} className="mt-1 bg-brand-surface border-white/10 h-9 text-white text-sm" /></div>
      </div>
      <div className="mt-3"><Label className="text-white/50 text-xs">Tagline</Label><Input value={d.tagline || ""} onChange={(e) => upd({ tagline: e.target.value })} className="mt-1 bg-brand-surface border-white/10 h-9 text-white text-sm" /></div>
      {d.type === "custom" ? (
        <div className="mt-4">
          <Label className="text-white/50 text-xs">Prestations à la carte</Label>
          <div className="mt-2 space-y-2">
            {(d.services || []).map((s, si) => (
              <div key={si} className="flex gap-2 items-center">
                <Input value={s.name} onChange={(e) => updSvc(si, { name: e.target.value })} placeholder="Nom" className="flex-1 bg-brand-surface border-white/10 h-9 text-white text-sm" />
                <Input type="number" value={s.price} onChange={(e) => updSvc(si, { price: Number(e.target.value) || 0 })} placeholder="Prix" className="w-24 bg-brand-surface border-white/10 h-9 text-white text-sm" />
                <button onClick={() => rmSvc(si)} className="text-white/40 hover:text-red-400 text-xs">Suppr.</button>
              </div>
            ))}
            <button onClick={addSvc} className="text-brand text-xs hover:underline">+ Ajouter une prestation</button>
          </div>
        </div>
      ) : (
        <div className="mt-4"><Label className="text-white/50 text-xs">Détails (une ligne par item)</Label>
          <textarea value={(d.features || []).join("\n")} onChange={(e) => upd({ features: e.target.value.split("\n") })} rows={4} className="mt-1 w-full rounded-md bg-brand-surface border border-white/10 p-2 text-white text-sm focus:outline-none focus:border-brand" />
        </div>
      )}
      <div className="mt-4 flex items-center gap-4 flex-wrap">
        <label className="flex items-center gap-2 text-white/70 text-xs"><input type="checkbox" checked={!!d.active} onChange={(e) => upd({ active: e.target.checked })} /> Actif</label>
        <label className="flex items-center gap-2 text-white/70 text-xs"><input type="checkbox" checked={!!d.featured} onChange={(e) => upd({ featured: e.target.checked })} /> Le plus demandé</label>
        <span className="text-xs text-white/40">{d.deletable === false ? "Plan par défaut (non supprimable)" : "Plan personnalisé"}</span>
        <div className="ml-auto flex items-center gap-2">
          {d.deletable !== false && <button onClick={() => onDelete(d)} data-testid={`del-plan-${p.id}`} className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300"><Trash2 size={12} /> Supprimer</button>}
          <button onClick={() => onSave(d)} disabled={saving} data-testid={`save-plan-${p.id}`} className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-bold text-brand-ink hover:scale-[1.02] transition-transform">{saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------ LINKS ------------------ */
function subsets(arr) {
  const out = [];
  for (let m = 1; m < 1 << arr.length; m++) {
    const s = [];
    for (let i = 0; i < arr.length; i++) if (m & (1 << i)) s.push(arr[i]);
    out.push(s);
  }
  return out;
}

function LinksView({ plans }) {
  const [links, setLinks] = useState({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { api.get("/admin/payment-links").then(({ data }) => setLinks(data)).catch(() => {}); }, []);

  const combos = useMemo(() => {
    const map = {};
    plans.filter((p) => p.active).forEach((p) => {
      if (p.id === "pack_emploi") {
        const groups = [];
        [{ id: "stage_alt", label: "Stage / Alternance (150€)" }, { id: "cdi", label: "CDI (499€)" }].forEach((jt) => {
          [1, 2, 3, 4].forEach((n) => groups.push({ key: `pack_emploi_${jt.id}_${n}`, label: `${jt.label} · ${n} fois` }));
        });
        map[p.name] = groups;
      } else if (p.type === "fixed") {
        map[p.name] = [1, 2, 3, 4].map((n) => ({ key: `${p.id}_${n}`, label: `${n} fois` }));
      } else if (p.type === "custom") {
        const ids = (p.services || []).map((s) => s.id).sort();
        const nameMap = Object.fromEntries((p.services || []).map((s) => [s.id, s.name]));
        const groups = [];
        subsets(ids).forEach((sub) => {
          [1, 2, 3, 4].forEach((n) => {
            groups.push({
              key: `${p.id}_${sub.join("+")}_${n}`,
              label: `${sub.map((i) => nameMap[i]).join(" + ")} · ${n} fois`,
            });
          });
        });
        map[p.name] = groups;
      }
    });
    return map;
  }, [plans]);

  const save = async () => {
    setSaving(true);
    try { await api.put("/admin/payment-links", { links }); toast.success("Liens enregistrés."); }
    catch { toast.error("Échec."); } finally { setSaving(false); }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-brand-surface p-6" data-testid="links-view">
      <div className="flex items-center gap-2 mb-5"><Link2 className="text-brand" size={18} /><h3 className="font-display font-bold">Liens de paiement externes</h3></div>
      <p className="text-sm text-white/50 mb-5">Colle ici tes liens (Stripe, Orange Money, MoMo, PayPal…). Ils apparaîtront automatiquement dans le mail de confirmation et sur l'écran de succès.</p>
      <div className="space-y-6">
        {Object.entries(combos).map(([planName, items]) => (
          <div key={planName}>
            <div className="text-sm font-semibold text-white/90 mb-3">{planName}</div>
            <div className="space-y-2">
              {items.map((it) => (
                <div key={it.key} className="flex items-center gap-2">
                  <span className="text-xs text-white/50 min-w-[240px] shrink-0">{it.label}</span>
                  <Input data-testid={`link-${it.key}`} value={links[it.key] || ""} placeholder="https://…"
                    onChange={(e) => setLinks({ ...links, [it.key]: e.target.value })}
                    className="bg-brand-ink border-white/10 h-9 text-white text-sm" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button onClick={save} disabled={saving} data-testid="save-links" className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-brand-ink hover:scale-[1.02] transition-transform">{saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Enregistrer</button>
    </div>
  );
}

/* ------------------ SETTINGS ------------------ */
function SettingsView() {
  const [s, setS] = useState({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { api.get("/admin/site").then(({ data }) => setS(data)).catch(() => {}); }, []);
  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        site_name: s.site_name || "", contact_email: s.contact_email || "",
        whatsapp: s.whatsapp || "", tagline: s.tagline || "",
        linkedin: s.linkedin || "", whatsapp_url: s.whatsapp_url || "",
        instagram: s.instagram || "", youtube: s.youtube || "",
        tiktok: s.tiktok || "", facebook: s.facebook || "",
      };
      await api.put("/admin/site", payload); toast.success("Enregistré.");
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Échec."); }
    finally { setSaving(false); }
  };
  const general = [
    { k: "site_name", l: "Nom du site" }, { k: "contact_email", l: "Email de contact" },
    { k: "whatsapp", l: "WhatsApp / Téléphone (affichage)" }, { k: "tagline", l: "Tagline" },
  ];
  const socials = [
    { k: "linkedin", l: "LinkedIn (URL)" },
    { k: "whatsapp_url", l: "WhatsApp (lien wa.me/…)" },
    { k: "instagram", l: "Instagram (URL)" },
    { k: "youtube", l: "YouTube (URL)" },
    { k: "tiktok", l: "TikTok (URL)" },
    { k: "facebook", l: "Facebook (URL)" },
  ];
  const renderField = (f) => (
    <div key={f.k}>
      <Label className="text-white/60 text-xs">{f.l}</Label>
      <Input data-testid={`site-${f.k}`} value={s[f.k] || ""} onChange={(e) => setS((prev) => ({ ...prev, [f.k]: e.target.value }))} className="mt-1 bg-brand-ink border-white/10 h-10 text-white text-sm" />
    </div>
  );
  return (
    <div className="space-y-6" data-testid="settings-view">
      <div className="rounded-2xl border border-white/10 bg-brand-surface p-6">
        <div className="flex items-center gap-2 mb-5"><Settings className="text-brand" size={18} /><h3 className="font-display font-bold">Général</h3></div>
        <div className="grid md:grid-cols-2 gap-4">{general.map(renderField)}</div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-brand-surface p-6">
        <h3 className="font-display font-bold mb-5">Réseaux sociaux</h3>
        <p className="text-xs text-white/50 mb-4">Colle l'URL complète (https://…). Les boutons s'affichent automatiquement dans le footer si l'URL est renseignée.</p>
        <div className="grid md:grid-cols-2 gap-4">{socials.map(renderField)}</div>
      </div>
      <button onClick={save} disabled={saving} data-testid="save-site" className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-bold text-brand-ink hover:scale-[1.02] transition-transform">{saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Enregistrer les paramètres</button>
    </div>
  );
}

/* ------------------ SHELL ------------------ */
function Shell({ onLogout }) {
  const [tab, setTab] = useState("dashboard");
  const [rows, setRows] = useState([]);
  const [plans, setPlans] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, s, p] = await Promise.all([api.get("/admin/inscriptions"), api.get("/admin/stats"), api.get("/admin/plans")]);
      setRows(r.data); setStats(s.data); setPlans(p.data);
    } catch (err) { if (err.response?.status === 401) onLogout(); }
    finally { setLoading(false); }
  }, [onLogout]);
  useEffect(() => { load(); }, [load]);

  const changeStatus = async (id, status) => {
    try {
      await api.patch(`/admin/inscriptions/${id}`, { status });
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
      toast.success("Statut mis à jour.");
      const s = await api.get("/admin/stats"); setStats(s.data);
    } catch { toast.error("Échec."); }
  };

  const nav = [
    { k: "dashboard", l: "Tableau de bord", i: LayoutDashboard },
    { k: "inscriptions", l: "Inscriptions", i: Users },
    { k: "plans", l: "Plans", i: Package },
    { k: "links", l: "Liens de paiement", i: Link2 },
    { k: "settings", l: "Paramètres", i: Settings },
  ];

  return (
    <div className="min-h-screen bg-brand-ink text-white grid md:grid-cols-[260px_1fr]">
      <aside className="border-r border-white/10 bg-brand-surface p-6 md:sticky md:top-0 md:h-screen flex flex-col" data-testid="sidebar">
        <div className="flex items-center gap-2 mb-10"><span className="w-2.5 h-2.5 rounded-full bg-brand" /><span className="font-display font-extrabold">SK Mentoring</span></div>
        <nav className="space-y-1 flex-1">
          {nav.map((n) => (
            <button key={n.k} onClick={() => setTab(n.k)} data-testid={`nav-${n.k}`}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${tab === n.k ? "bg-brand text-brand-ink font-bold" : "text-white/70 hover:bg-white/5 hover:text-white"}`}>
              <n.i size={17} /> {n.l}
            </button>
          ))}
        </nav>
        <button onClick={onLogout} data-testid="logout-btn" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 px-3 py-2.5 text-sm text-white/70"><LogOut size={15} /> Déconnexion</button>
      </aside>
      <main className="p-6 md:p-10 space-y-6 min-w-0">
        <div className="flex items-center justify-between">
          <h1 className="font-display font-extrabold text-2xl md:text-3xl">{nav.find((n) => n.k === tab)?.l}</h1>
          <button onClick={load} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm hover:border-brand"><RefreshCw size={14} /> Actualiser</button>
        </div>
        {tab === "dashboard" && <DashboardView stats={stats} />}
        {tab === "inscriptions" && <InscriptionsView rows={rows} plans={plans} onChangeStatus={changeStatus} loading={loading} onReload={load} />}
        {tab === "plans" && <PlansView plans={plans} onReload={load} />}
        {tab === "links" && <LinksView plans={plans} />}
        {tab === "settings" && <SettingsView />}
      </main>
    </div>
  );
}

export default function Admin() {
  const [authed, setAuthed] = useState(!!localStorage.getItem("mentoring_token"));
  const navigate = useNavigate();
  const logout = () => { localStorage.removeItem("mentoring_token"); setAuthed(false); navigate("/admin/login"); };
  if (!authed) return <Login onLogged={() => setAuthed(true)} />;
  return <Shell onLogout={logout} />;
}
