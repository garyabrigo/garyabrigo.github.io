import fs from 'node:fs';
import path from 'node:path';

// Read from the canonical source so t-0003 can regenerate projects.json and assets,
// and rebuilding the site picks up the changes automatically.
const PROJECTS_JSON_PATH = '/home/tars/Proyectos/CV/portfolio-spec/projects.json';
const raw = fs.readFileSync(PROJECTS_JSON_PATH, 'utf-8');
const projectsData = JSON.parse(raw);

export type Lang = 'es' | 'en';

export interface Project {
  id: string;
  order: number;
  featured: boolean;
  category: string;
  context: {
    type: { es: string; en: string };
    course: { es: string; en: string };
    team: { es: string; en: string };
    authorship_note: { es: string; en: string };
    date: string | null;
  };
  title: { es: string; en: string };
  tagline: { es: string; en: string };
  problem: { es: string; en: string };
  data: { es: string; en: string };
  data_source_url: string | null;
  tools: string[];
  methods: { es: string[]; en: string[] };
  results: { es: string; en: string }[];
  results_status: string;
  results_note: { es: string; en: string } | null;
  results_source: string | null;
  cover: string | null;
  gallery: string[];
  local: {
    root: string;
    folder: string;
    files?: Record<string, unknown>;
  };
  links: { repo: string | null; demo: string | null };
  open_questions: string[];
}

export const projects: Project[] = projectsData.projects as Project[];
export const categories = projectsData.categories as Record<string, { es: string; en: string }>;

export function getProjectById(id: string): Project | undefined {
  return projects.find(p => p.id === id);
}

export function getFeaturedProjects(): Project[] {
  return projects.filter(p => p.featured).sort((a, b) => a.order - b.order);
}

export function getMoreProjects(): Project[] {
  return projects.filter(p => !p.featured).sort((a, b) => a.order - b.order);
}

export function t(obj: { es: string; en: string } | undefined, lang: Lang): string {
  if (!obj) return '';
  return obj[lang] || obj.es || '';
}

export function getStatus(status: string): 'verified' | 'partial' | 'pending' | 'incomplete' {
  const s = status.toLowerCase();
  if (s.startsWith('verificado')) return 'verified';
  if (s.startsWith('parcial')) return 'partial';
  if (s.startsWith('incompleto')) return 'incomplete';
  return 'pending';
}

export function cleanTool(tool: string): string | null {
  if (tool.includes('(por confirmar)') || tool.includes('(to be confirmed)')) return null;
  return tool;
}

export function getTools(project: Project): string[] {
  return project.tools.map(cleanTool).filter((t): t is string => t !== null);
}

export function getResults(project: Project, lang: Lang): { items: string[]; note?: string } {
  const status = getStatus(project.results_status);
  if (status === 'pending') return { items: [] };
  const items = project.results.map(r => t(r, lang));

  // results_note from projects.json takes precedence (e.g. Sun50 correction).
  const sourceNote = project.results_note ? t(project.results_note, lang) : null;
  if (status === 'partial') {
    const note = sourceNote || (lang === 'es'
      ? 'Resultados completos: próximamente'
      : 'Full results: coming soon');
    return { items, note };
  }
  if (sourceNote) {
    return { items, note: sourceNote };
  }
  return { items };
}

export function getAllTools(): string[] {
  const set = new Set<string>();
  for (const p of projects) {
    for (const tool of getTools(p)) set.add(tool);
  }
  const skills = [
    'Python', 'SQL', 'Databricks', 'PySpark', 'scikit-learn', 'TensorFlow',
    'Power BI', 'Looker Studio', 'pandas', 'MLflow', 'Hugging Face Transformers'
  ];
  for (const s of skills) set.add(s);
  return Array.from(set).sort();
}

export function getCourse(project: Project, lang: Lang): string {
  return t(project.context.course, lang);
}

export function getTeam(project: Project, lang: Lang): string {
  return t(project.context.team, lang);
}

export const nav = {
  es: {
    projects: 'Proyectos',
    about: 'Sobre mí',
    contact: 'Contacto',
    cv: 'CV',
    home: 'Inicio'
  },
  en: {
    projects: 'Projects',
    about: 'About',
    contact: 'Contact',
    cv: 'CV',
    home: 'Home'
  }
};

export const meta = {
  es: {
    title: 'Gary Daniel Abrigo — Analista de datos',
    description: 'Portafolio de análisis de datos, machine learning y visualización. Proyectos reales con métricas verificadas.',
    role: 'Analista de datos · Data Science',
    heroTagline: 'Contador/Auditor y Analista de Datos, especializado en la extracción, validación y reporting estratégico de datos clave.',
    valueLine: 'Convierto datos en decisiones: tableros con historia, modelos evaluados con honestidad.',
    ctaProjects: 'Ver proyectos',
    ctaCv: 'Descargar CV',
    stack: 'Stack',
    featuredOverline: 'Proyecto destacado',
    moreProjects: 'Más proyectos',
    aboutTitle: 'Sobre mí',
    aboutText: 'Contador/Auditor y Analista de Datos con base contable. Especializado en extracción, validación y reporting estratégico de datos clave (ventas, inventario, nóminas/ISR). Domino Excel avanzado, SQL, Python, Power BI, Looker Studio y Databricks para automatizar procesos y generar inteligencia de negocio. Formación continua en Data Science e IT Management.',
    educationTitle: 'Formación',
    certificationsTitle: 'Certificaciones',
    contactTitle: 'Contacto',
    contactText: '¿Buscas un analista que entienda el negocio y lo respalde con datos? Escríbeme o revisa mi trabajo en GitHub.',
    cvComing: 'CV PDF: próximamente',
    linkedinPlaceholder: 'LinkedIn',
    resultsComing: 'Resultados completos: próximamente',
    viewProject: 'Ver proyecto',
    problem: 'Problema',
    data: 'Datos',
    methods: 'Métodos',
    results: 'Resultados',
    gallery: 'Galería',
    tools: 'Herramientas',
    links: 'Enlaces',
    back: 'Volver',
    universityWork: 'Trabajo universitario',
    emailCopied: 'Email copiado',
    emailLabel: 'Email'
  },
  en: {
    title: 'Gary Daniel Abrigo — Data Analyst',
    description: 'Portfolio of data analysis, machine learning and visualisation. Real projects with verified metrics.',
    role: 'Data Analyst · Data Science',
    heroTagline: 'Accountant/Auditor and Data Analyst specialised in extracting, validating and strategically reporting key data.',
    valueLine: 'Turning data into decisions: dashboards with a story, models evaluated honestly.',
    ctaProjects: 'View projects',
    ctaCv: 'Download CV',
    stack: 'Stack',
    featuredOverline: 'Featured project',
    moreProjects: 'More projects',
    aboutTitle: 'About me',
    aboutText: 'Accountant/Auditor and Data Analyst with an accounting background. Specialised in extracting, validating and strategically reporting key data (sales, inventory, payroll/ISR). Advanced Excel, SQL, Python, Power BI, Looker Studio and Databricks for process automation and business intelligence. Continuing education in Data Science and IT Management.',
    educationTitle: 'Education',
    certificationsTitle: 'Certifications',
    contactTitle: 'Contact',
    contactText: 'Looking for an analyst who understands the business and backs it up with data? Email me or check my work on GitHub.',
    cvComing: 'CV PDF: coming soon',
    linkedinPlaceholder: 'LinkedIn',
    resultsComing: 'Full results: coming soon',
    viewProject: 'View project',
    problem: 'Problem',
    data: 'Data',
    methods: 'Methods',
    results: 'Results',
    gallery: 'Gallery',
    tools: 'Tools',
    links: 'Links',
    back: 'Back',
    universityWork: 'University work',
    emailCopied: 'Email copied',
    emailLabel: 'Email'
  }
};

export const education = {
  es: [
    { school: 'Universidad Rafael Landívar', degree: 'Especialización en Data Science y Maestría en IT Management', period: '2026 – 2027 (en curso)' },
    { school: 'Universidad de San Carlos de Guatemala (USAC)', degree: 'Maestría en Administración Financiera', period: '2023 – 2024 (no finalizada)' },
    { school: 'Universidad San Carlos de Guatemala', degree: 'Contaduría Pública y Auditoría', period: '2018 – 2023' }
  ],
  en: [
    { school: 'Universidad Rafael Landívar', degree: 'Specialisation in Data Science and Master in IT Management', period: '2026 – 2027 (in progress)' },
    { school: 'Universidad de San Carlos de Guatemala (USAC)', degree: 'Master in Financial Administration', period: '2023 – 2024 (not completed)' },
    { school: 'Universidad San Carlos de Guatemala', degree: 'Public Accounting and Auditing', period: '2018 – 2023' }
  ]
};

export const certifications = [
  { name: 'Microsoft Certified: Power Platform Fundamentals (PL-900)', issuer: 'Microsoft', date: '2025' },
  { name: 'Databricks Fundamentals Accreditation', issuer: 'Databricks', date: '2026' },
  { name: 'Lean Six Sigma Yellow Belt Certified', issuer: 'Corporación Multi Inversiones', date: '2025' }
];

export const owner = projectsData.owner as {
  github: string;
  site: string;
  email: string;
  email_public: boolean;
};

export const personal = {
  name: 'Gary Daniel Abrigo Raymundo',
  email: owner.email_public ? owner.email : 'abrigogary@gmail.com',
  github: 'https://github.com/d4nnABR',
  linkedin: 'https://www.linkedin.com/in/garyabr/',
  location: 'Guatemala'
};

export const siteUrl = 'https://garyabrigo.github.io';

export function getLanguagePath(path: string, targetLang: Lang): string {
  const clean = path.replace(/^\/(en\/)?/, '/').replace(/\/$/, '') || '/';
  if (targetLang === 'en') {
    if (clean === '/') return '/en/';
    return '/en' + clean;
  }
  return clean || '/';
}

// Ensure asset paths are absolute so they work from pages at any depth.
export function assetPath(src: string | null | undefined): string | null {
  if (!src) return null;
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/')) return src;
  return '/' + src.replace(/^\//, '');
}

// Pre-build helper: copy assets from the canonical source so rebuilds stay fresh.
export function syncAssets(): void {
  const source = '/home/tars/Proyectos/CV/portfolio-spec/assets';
  const dest = path.resolve('public/assets');
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  for (const file of fs.readdirSync(source)) {
    if (!file.endsWith('.webp')) continue;
    fs.copyFileSync(path.join(source, file), path.join(dest, file));
  }
}
