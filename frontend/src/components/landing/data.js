export const IMAGES = {
  hero: "https://images.unsplash.com/photo-1589386417686-0d34b5903d23?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1Mjh8MHwxfHNlYXJjaHwzfHxjb25maWRlbnQlMjBibGFjayUyMHlvdW5nJTIwcHJvZmVzc2lvbmFsfGVufDB8fHx8MTc4NTg3NzgyMXww&ixlib=rb-4.1.0&q=85",
  testimonial: "https://images.unsplash.com/photo-1573496799515-eebbb63814f2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1Mjh8MHwxfHNlYXJjaHwyfHxjb25maWRlbnQlMjBibGFjayUyMHlvdW5nJTIwcHJvZmVzc2lvbmFsfGVufDB8fHx8MTc4NTg3NzgyMXww&ixlib=rb-4.1.0&q=85",
  tage: "https://images.unsplash.com/photo-1514369118554-e20d93546b30?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1Mjh8MHwxfHNlYXJjaHwyfHxtaXhlZCUyMHJhY2UlMjBzdHVkZW50JTIwc3R1ZHlpbmd8ZW58MHx8fHwxNzg1ODc3ODIxfDA&ixlib=rb-4.1.0&q=85",
  emploi: "https://images.unsplash.com/photo-1573164574511-73c773193279?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTV8MHwxfHNlYXJjaHwxfHxibGFjayUyMHByb2Zlc3Npb25hbHMlMjBtZWV0aW5nfGVufDB8fHx8MTc4NTg3NzgyMXww&ixlib=rb-4.1.0&q=85",
};

export const STEPS = [
  { n: "01", t: "Diagnostic offert", d: "Un premier échange pour comprendre ton objectif : réussir le TAGE MAGE ou décrocher un stage, une alternance, un CDI." },
  { n: "02", t: "Ton plan sur-mesure", d: "On construit ensemble une feuille de route claire, semaine par semaine, adaptée à ton niveau et ton emploi du temps." },
  { n: "03", t: "Accompagnement rapproché", d: "Sessions de coaching, corrections, entraînements réels et retours personnalisés jusqu'à l'objectif." },
  { n: "04", t: "Résultat concret", d: "Un score qui ouvre les portes des meilleures écoles, ou une offre signée. On vise le résultat, pas la théorie." },
];

export const PLANS = [
  {
    id: "tage_mage",
    name: "Préparation TAGE MAGE",
    price: "299",
    tagline: "Vise le score qui ouvre les grandes écoles.",
    track: "tage_mage",
    features: [
      "Méthodologie complète des 6 sous-tests",
      "Banque d'entraînements + examens blancs",
      "Sessions de coaching en direct",
      "Corrections détaillées et suivi de progression",
      "Stratégie de gestion du temps le jour J",
    ],
  },
  {
    id: "pack_emploi",
    name: "Pack Emploi",
    price: "499",
    tagline: "Du CV à l'offre signée. Stage, alternance ou CDI.",
    track: "job",
    featured: true,
    features: [
      "CV & profil LinkedIn optimisés par des pros",
      "Préparation intensive aux entretiens",
      "Stratégie de candidature qui sort du lot",
      "Techniques pour décrocher stage / alternance / CDI",
      "Suivi personnalisé jusqu'à la signature",
    ],
  },
];

export const TESTIMONIALS = [
  { name: "Aïcha M.", role: "Admise à l'EDHEC", text: "J'étais bloquée à 280 au TAGE MAGE. Après l'accompagnement, j'ai décroché 410 et intégré l'école que je visais. Le suivi fait toute la différence." },
  { name: "Yannick T.", role: "Alternance décrochée · Paris", text: "Mon CV ne passait aucun filtre. Ils ont tout repris, retravaillé mon LinkedIn et préparé mes entretiens. J'ai signé mon alternance en 3 semaines." },
  { name: "Sarah D.", role: "CDI · Data Analyst", text: "Le coaching entretien m'a transformée. J'arrive enfin à raconter mon parcours avec confiance. Résultat : un CDI que je n'espérais plus." },
  { name: "Emmanuel K.", role: "Score 435 au TAGE MAGE", text: "Une méthode carrée, des correcteurs exigeants et bienveillants. Rien de scolaire, du concret. Je recommande les yeux fermés." },
];

export const FAQ = [
  { q: "Le TAGE MAGE et le Pack Emploi, je choisis lequel ?", a: "Si tu prépares un concours d'école de commerce, choisis la préparation TAGE MAGE. Si ton objectif est de décrocher un stage, une alternance ou un CDI, prends le Pack Emploi. Au moment de l'inscription, tu précises simplement ton parcours." },
  { q: "Comment se passe le paiement ?", a: "Tu peux régler en 1, 2, 3 ou 4 fois. Selon ton pays de résidence, un lien de paiement adapté te sera transmis après ton inscription (paiement en ligne, Orange Money ou Mobile Money)." },
  { q: "Je réside hors de France, est-ce possible ?", a: "Oui. L'accompagnement est 100% en ligne. Nous adaptons simplement le mode de paiement à ton pays de résidence." },
  { q: "Combien de temps dure l'accompagnement ?", a: "Cela dépend de ton objectif et de ton point de départ. On construit ensemble une feuille de route réaliste dès le diagnostic offert." },
  { q: "Et si je ne suis pas satisfait ?", a: "On avance par étapes avec des points réguliers. Notre but est ton résultat : si quelque chose ne va pas, on ajuste immédiatement le plan." },
];

export const COUNTRIES = ["Cameroun", "France", "Côte d'Ivoire", "Sénégal", "Bénin", "Gabon", "Belgique", "Canada", "Autre"];
