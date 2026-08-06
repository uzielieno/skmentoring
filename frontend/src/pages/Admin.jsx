import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  LogOut, Loader2, Users, GraduationCap, Briefcase, BadgeCheck, Link2, RefreshCw, Save, Search,
} from "lucide-react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const PLAN_LABEL = { tage_mage: "TAGE MAGE", pack_emploi: "Pack Emploi" };
const STATUS = { nouveau: "text-brand bg-brand/15", contacte: "text-blue-400 bg-blue-400/15", paye: "text-emerald-400 bg-emerald-400/15" };
const STATUS_OPTS = ["nouveau", "contacte", "paye"];

function Login({ onLogged }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("mentoring_token", data.token);
      onLogged();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-brand-ink text-white p-6">
      <form onSubmit={submit} className="w-full max-w-sm" data-testid="admin-login-form">
        <div className="flex items-center gap-2 mb-8">
          <span className="w-2.5 h-2.5 rounded-full bg-brand" />
          <span className="font-display font-extrabold text-xl">SK Mentoring · Admin</span>
        </div>
        <h1 className="font-display font-extrabold text-3xl">Espace équipe</h1>
        <p className="mt-2 text-white/55 text-sm">Connecte-toi pour consulter les inscriptions.</p>
        <div className="mt-8 space-y-4">
          <div>
            <Label className="text-white/70">Email</Label>
            <Input data-testid="login-email" value={email} onChange={(e) => setEmail(e.target.value)} type="email"
              className="mt-2 bg-brand-surface border-white/10 h-12 text-white" />
          </div>
          <div>
            <Label className="text-white/70">Mot de passe</Label>
            <Input data-testid="login-password" value={password} onChange={(e) => setPassword(e.target.value)} type="password"
              className="mt-2 bg-brand-surface border-white/10 h-12 text-white" />
          </div>
        </div>
        <button type="submit" disabled={loading} data-testid="login-submit"
          className="mt-8 w-full flex items-center justify-center gap-2 rounded-full bg-brand py-3.5 font-bold text-brand-ink hover:scale-[1.02] transition-transform disabled:opacity-60">
          {loading ? <Loader2 className="animate-spin" size={18} /> : "Se connecter"}
        </button>
      </form>
    </div>
  );
}

function LinksEditor() {
  const [links, setLinks] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/admin/payment-links").then(({ data }) => setLinks(data)).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/admin/payment-links", { links });
      toast.success("Liens de paiement enregistrés.");
    } catch { toast.error("Échec de l'enregistrement."); }
    finally { setSaving(false); }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-brand-surface p-6" data-testid="links-editor">
      <div className="flex items-center gap-2 mb-5"><Link2 className="text-brand" size={18} /><h3 className="font-display font-bold">Liens de paiement externes</h3></div>
      <div className="grid md:grid-cols-2 gap-6">
        {["tage_mage", "pack_emploi"].map((plan) => (
          <div key={plan}>
            <div className="text-sm font-semibold text-white/80 mb-3">{PLAN_LABEL[plan]}</div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map((n) => {
                const key = `${plan}_${n}`;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs text-white/40 w-14 shrink-0">{n} fois</span>
                    <Input data-testid={`link-${key}`} value={links[key] || ""} placeholder="https://…"
                      onChange={(e) => setLinks({ ...links, [key]: e.target.value })}
                      className="bg-brand-ink border-white/10 h-10 text-white text-sm" />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <button onClick={save} disabled={saving} data-testid="save-links"
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-brand-ink hover:scale-[1.02] transition-transform">
        {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Enregistrer
      </button>
    </div>
  );
}

function Dashboard({ onLogout }) {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([api.get("/admin/inscriptions"), api.get("/admin/stats")]);
      setRows(r.data); setStats(s.data);
    } catch (err) {
      if (err.response?.status === 401) onLogout();
    } finally { setLoading(false); }
  }, [onLogout]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (id, status) => {
    try {
      await api.patch(`/admin/inscriptions/${id}`, { status });
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
      toast.success("Statut mis à jour.");
      load();
    } catch { toast.error("Échec de la mise à jour."); }
  };

  const filtered = rows.filter((r) =>
    [r.name, r.email, r.phone, r.country].join(" ").toLowerCase().includes(q.toLowerCase()));

  const cards = [
    { icon: Users, l: "Total inscriptions", v: stats.total ?? 0 },
    { icon: GraduationCap, l: "TAGE MAGE", v: stats.tage_mage ?? 0 },
    { icon: Briefcase, l: "Pack Emploi", v: stats.pack_emploi ?? 0 },
    { icon: BadgeCheck, l: "Payés", v: stats.paye ?? 0 },
  ];

  return (
    <div className="min-h-screen bg-brand-ink text-white">
      <header className="border-b border-white/10 sticky top-0 bg-brand-ink/90 backdrop-blur-xl z-10">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-brand" /><span className="font-display font-extrabold">SK Mentoring · Admin</span></div>
          <div className="flex items-center gap-3">
            <button onClick={load} data-testid="refresh-btn" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm hover:border-brand transition-colors"><RefreshCw size={15} /> Actualiser</button>
            <button onClick={onLogout} data-testid="logout-btn" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20 transition-colors"><LogOut size={15} /> Déconnexion</button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 md:px-10 py-10 space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <div key={c.l} className="rounded-2xl border border-white/10 bg-brand-surface p-6" data-testid={`stat-${c.l}`}>
              <c.icon className="text-brand" size={20} />
              <div className="mt-4 font-serif text-4xl">{c.v}</div>
              <div className="text-sm text-white/55 mt-1">{c.l}</div>
            </div>
          ))}
        </div>

        <LinksEditor />
        <SiteEditor />
        <PlansEditor />

        <div className="rounded-2xl border border-white/10 bg-brand-surface overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-white/10">
            <h3 className="font-display font-bold">Inscriptions</h3>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <Input data-testid="search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…"
                className="pl-9 h-10 w-56 bg-brand-ink border-white/10 text-white text-sm" />
            </div>
          </div>
          {loading ? (
            <div className="p-16 grid place-items-center text-white/50"><Loader2 className="animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center text-white/50" data-testid="empty-state">Aucune inscription pour le moment.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-testid="inscriptions-table">
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white/50">Étudiant</TableHead>
                    <TableHead className="text-white/50">Contact</TableHead>
                    <TableHead className="text-white/50">Parcours</TableHead>
                    <TableHead className="text-white/50">Pays</TableHead>
                    <TableHead className="text-white/50">Paiement</TableHead>
                    <TableHead className="text-white/50">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id} className="border-white/10" data-testid={`row-${r.id}`}>
                      <TableCell className="font-medium text-white">{r.name}
                        <div className="text-xs text-white/40">{new Date(r.created_at).toLocaleDateString("fr-FR")}</div>
                      </TableCell>
                      <TableCell className="text-white/70 text-sm">{r.email}<div className="text-xs text-white/40">{r.phone}</div></TableCell>
                      <TableCell><span className="rounded-full bg-white/10 px-3 py-1 text-xs">{PLAN_LABEL[r.plan] || r.plan}</span></TableCell>
                      <TableCell className="text-white/70 text-sm">{r.country}</TableCell>
                      <TableCell className="text-white/70 text-sm">{r.installments} fois</TableCell>
                      <TableCell>
                        <Select value={r.status} onValueChange={(v) => changeStatus(r.id, v)}>
                          <SelectTrigger data-testid={`status-${r.id}`} className={`h-8 w-32 border-0 text-xs font-semibold ${STATUS[r.status] || ""}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-brand-elevated border-white/10 text-white">
                            {STATUS_OPTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
      </main>
    </div>
  );
}

export default function Admin() {
  const [authed, setAuthed] = useState(!!localStorage.getItem("mentoring_token"));
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("mentoring_token");
    setAuthed(false);
    navigate("/admin/login");
  };

  if (!authed) return <Login onLogged={() => setAuthed(true)} />;
  return <Dashboard onLogout={logout} />;
}

function SiteEditor() {
  const [s, setS] = useState({ site_name: "", contact_email: "", whatsapp: "", tagline: "" });
  const [saving, setSaving] = useState(false);
  useEffect(() => { api.get("/admin/site").then(({ data }) => setS(data)).catch(() => {}); }, []);
  const save = async () => {
    setSaving(true);
    try { await api.put("/admin/site", s); toast.success("Paramètres du site enregistrés."); }
    catch { toast.error("Échec."); } finally { setSaving(false); }
  };
  const fields = [
    { k: "site_name", l: "Nom du site" },
    { k: "contact_email", l: "Email de contact" },
    { k: "whatsapp", l: "WhatsApp / Téléphone" },
    { k: "tagline", l: "Tagline (optionnel)" },
  ];
  return (
    <div className="rounded-2xl border border-white/10 bg-brand-surface p-6" data-testid="site-editor">
      <h3 className="font-display font-bold mb-5">Paramètres du site</h3>
      <div className="grid md:grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.k}>
            <Label className="text-white/60 text-xs">{f.l}</Label>
            <Input data-testid={`site-${f.k}`} value={s[f.k] || ""} onChange={(e) => setS({ ...s, [f.k]: e.target.value })}
              className="mt-1 bg-brand-ink border-white/10 h-10 text-white text-sm" />
          </div>
        ))}
      </div>
      <button onClick={save} disabled={saving} data-testid="save-site"
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-brand-ink hover:scale-[1.02] transition-transform">
        {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Enregistrer
      </button>
    </div>
  );
}

function PlansEditor() {
  const [plans, setPlans] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const load = () => api.get("/admin/plans").then(({ data }) => setPlans(data)).catch(() => {});
  useEffect(() => { load(); }, []);
  const update = (i, patch) => setPlans(plans.map((p, k) => (k === i ? { ...p, ...patch } : p)));
  const updateSvc = (i, si, patch) => update(i, { services: plans[i].services.map((s, k) => (k === si ? { ...s, ...patch } : s)) });
  const addSvc = (i) => update(i, { services: [...(plans[i].services || []), { id: `svc_${Date.now()}`, name: "Nouvelle prestation", price: 0 }] });
  const rmSvc = (i, si) => update(i, { services: plans[i].services.filter((_, k) => k !== si) });
  const save = async (p) => {
    setSavingId(p.id);
    try { await api.put(`/admin/plans/${p.id}`, { ...p, price: Number(p.price) || 0 }); toast.success(`${p.name} enregistré.`); load(); }
    catch { toast.error("Échec."); } finally { setSavingId(null); }
  };
  const reset = async () => {
    if (!window.confirm("Réinitialiser les plans par défaut ?")) return;
    await api.post("/admin/plans/reset"); toast.success("Plans réinitialisés."); load();
  };
  return (
    <div className="rounded-2xl border border-white/10 bg-brand-surface p-6" data-testid="plans-editor">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display font-bold">Gestion des plans & prestations</h3>
        <button onClick={reset} data-testid="reset-plans" className="text-xs text-white/50 hover:text-white underline">Réinitialiser par défaut</button>
      </div>
      <div className="space-y-4">
        {plans.map((p, i) => (
          <div key={p.id} data-testid={`plan-edit-${p.id}`} className="rounded-xl border border-white/10 bg-brand-ink p-5">
            <div className="grid md:grid-cols-4 gap-3">
              <div><Label className="text-white/50 text-xs">ID</Label><Input value={p.id} disabled className="mt-1 bg-brand-surface border-white/10 h-9 text-white/60 text-sm" /></div>
              <div><Label className="text-white/50 text-xs">Nom</Label><Input value={p.name} onChange={(e) => update(i, { name: e.target.value })} className="mt-1 bg-brand-surface border-white/10 h-9 text-white text-sm" /></div>
              <div><Label className="text-white/50 text-xs">Prix (€)</Label><Input type="number" value={p.price} onChange={(e) => update(i, { price: e.target.value })} className="mt-1 bg-brand-surface border-white/10 h-9 text-white text-sm" /></div>
              <div><Label className="text-white/50 text-xs">Ordre</Label><Input type="number" value={p.order} onChange={(e) => update(i, { order: Number(e.target.value) })} className="mt-1 bg-brand-surface border-white/10 h-9 text-white text-sm" /></div>
            </div>
            <div className="mt-3">
              <Label className="text-white/50 text-xs">Tagline</Label>
              <Input value={p.tagline} onChange={(e) => update(i, { tagline: e.target.value })} className="mt-1 bg-brand-surface border-white/10 h-9 text-white text-sm" />
            </div>
            {p.type === "custom" ? (
              <div className="mt-4">
                <Label className="text-white/50 text-xs">Prestations à la carte</Label>
                <div className="mt-2 space-y-2">
                  {(p.services || []).map((s, si) => (
                    <div key={si} className="flex gap-2 items-center">
                      <Input value={s.name} onChange={(e) => updateSvc(i, si, { name: e.target.value })} placeholder="Nom" className="flex-1 bg-brand-surface border-white/10 h-9 text-white text-sm" />
                      <Input type="number" value={s.price} onChange={(e) => updateSvc(i, si, { price: Number(e.target.value) || 0 })} placeholder="Prix" className="w-24 bg-brand-surface border-white/10 h-9 text-white text-sm" />
                      <button onClick={() => rmSvc(i, si)} className="text-white/40 hover:text-red-400 text-xs">Suppr.</button>
                    </div>
                  ))}
                  <button onClick={() => addSvc(i)} className="text-brand text-xs hover:underline">+ Ajouter une prestation</button>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <Label className="text-white/50 text-xs">Détails (une ligne par item)</Label>
                <textarea value={(p.features || []).join("\n")} onChange={(e) => update(i, { features: e.target.value.split("\n") })} rows={4}
                  className="mt-1 w-full rounded-md bg-brand-surface border border-white/10 p-2 text-white text-sm focus:outline-none focus:border-brand" />
              </div>
            )}
            <div className="mt-4 flex items-center gap-4">
              <label className="flex items-center gap-2 text-white/70 text-xs"><input type="checkbox" checked={!!p.active} onChange={(e) => update(i, { active: e.target.checked })} /> Actif</label>
              <label className="flex items-center gap-2 text-white/70 text-xs"><input type="checkbox" checked={!!p.featured} onChange={(e) => update(i, { featured: e.target.checked })} /> Le plus demandé</label>
              <button onClick={() => save(p)} disabled={savingId === p.id} data-testid={`save-plan-${p.id}`}
                className="ml-auto inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-bold text-brand-ink hover:scale-[1.02] transition-transform">
                {savingId === p.id ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Enregistrer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
