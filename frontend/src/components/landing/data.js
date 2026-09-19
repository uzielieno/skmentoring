export const IMAGES = {
  hero: "https://customer-assets-0z36b82j.emergentagent.net/job_pathway-success-3/artifacts/6zzvf2cu_ChatGPT%20Image%2019%20sept.%202026%2C%2018_41_54.png",
  emploi: "https://customer-assets-0z36b82j.emergentagent.net/job_pathway-success-3/artifacts/me7wo6p3_ChatGPT%20Image%2019%20sept.%202026%2C%2018_42_11.png",
  tage: "https://customer-assets-0z36b82j.emergentagent.net/job_pathway-success-3/artifacts/0d7f9y58_ChatGPT%20Image%2019%20sept.%202026%2C%2018_45_24.png",
  testimonial: "https://customer-assets-0z36b82j.emergentagent.net/job_pathway-success-3/artifacts/mnsxtd1e_ChatGPT%20Image%2019%20sept.%202026%2C%2019_02_49.png",
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
