import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';

// Restrained take on the cinematic-scroll-storytelling recipe: smooth scroll,
// once-only reveals, word-by-word kinetic titles, subtle image parallax and a
// footer hand-off. No preloader, blur or pinning (they hurt LCP/perf here).
// Reveals only touch opacity + transform so links stay focusable.

gsap.registerPlugin(ScrollTrigger, CustomEase);
CustomEase.create('fluid', '0.32,0.72,0,1');

const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));

function splitWords(el: HTMLElement) {
  if (el.dataset.split === 'ready') return $$('.sw', el);
  const nodes = Array.from(el.childNodes);
  el.textContent = '';
  for (const node of nodes) {
    if (node.nodeType !== Node.TEXT_NODE) {
      el.appendChild(node);
      continue;
    }
    for (const part of (node.textContent || '').split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        el.appendChild(document.createTextNode(part));
      } else {
        const w = document.createElement('span');
        w.className = 'sw';
        w.style.display = 'inline-block';
        w.textContent = part;
        el.appendChild(w);
      }
    }
  }
  el.dataset.split = 'ready';
  return $$('.sw', el);
}

function reveal(targets: Element[], trigger: Element, opts: { y?: number; stagger?: number; start?: string } = {}) {
  if (!targets.length) return;
  gsap.fromTo(
    targets,
    { y: opts.y ?? 32, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.9,
      ease: 'fluid',
      stagger: opts.stagger ?? 0.08,
      clearProps: 'transform,opacity',
      scrollTrigger: { trigger, start: opts.start ?? 'top 86%', once: true }
    }
  );
}

export function init() {
  const root = document.documentElement;
  const desktop = matchMedia('(min-width: 900px)');

  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 0.95, anchors: { offset: -64 } });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  root.classList.add('has-cinematic');

  // Section titles: masked word rise.
  for (const title of $$('.section-title')) {
    const words = splitWords(title);
    gsap.fromTo(
      words,
      { yPercent: 60, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 0.85,
        ease: 'fluid',
        stagger: 0.06,
        clearProps: 'transform,opacity',
        scrollTrigger: { trigger: title, start: 'top 88%', once: true }
      }
    );
  }
  for (const header of $$('.section-header .section-number, .project-header > *')) {
    reveal([header], header, { y: 20 });
  }

  // Featured projects: image + copy reveal, gentle desync parallax on desktop.
  for (const card of $$('.featured-card')) {
    reveal($$('.featured-image', card), card, { y: 48 });
    reveal($$('.featured-content > *', card), card, { y: 28, stagger: 0.07, start: 'top 78%' });
  }
  if (desktop.matches) {
    for (const img of $$('.featured-image')) {
      gsap.fromTo(
        img,
        { y: 36 },
        {
          y: -36,
          ease: 'none',
          scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true }
        }
      );
    }
  }

  // About: tagline-style word activation. Words go muted -> ink one by one as they cross a
  // trigger line; colour (not opacity) so contrast stays AA in both states and themes.
  const wordObserver = new IntersectionObserver(
    entries => {
      for (const e of entries) {
        const above = e.boundingClientRect.top < (e.rootBounds?.height ?? innerHeight) * 0.6;
        e.target.classList.toggle('sw-lit', e.isIntersecting || above);
      }
    },
    { rootMargin: '0px 0px -40% 0px' }
  );
  for (const p of $$('.about-bio p')) {
    p.classList.add('sw-tagline');
    splitWords(p).forEach(w => wordObserver.observe(w));
  }
  for (const col of $$('.about-education')) reveal($$(':scope > *', col), col, { y: 24, stagger: 0.05 });

  // More projects: rows enter in batches as they scroll in.
  ScrollTrigger.batch('.more-row', {
    start: 'top 92%',
    once: true,
    onEnter: batch =>
      gsap.fromTo(
        batch,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'fluid', stagger: 0.05, overwrite: true, clearProps: 'transform,opacity' }
      )
  });

  for (const c of $$('.contact-inner')) {
    reveal($$(':scope > *:not(.section-header)', c), c, { y: 24, stagger: 0.07, start: 'top 80%' });
  }
  for (const block of $$('.detail-block')) reveal([block], block, { y: 28 });

  // Hero copy drifts up and softens as you leave the hero.
  const hero = document.querySelector<HTMLElement>('.hero');
  const heroContent = document.querySelector<HTMLElement>('.hero-content');
  if (hero && heroContent) {
    gsap.to(heroContent, {
      y: -48,
      opacity: 0.35,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
    });
  }

  // Footer slow hand-off.
  const footer = document.querySelector('.site-footer');
  if (footer) {
    gsap.fromTo(
      footer,
      { yPercent: -8, opacity: 0.8 },
      {
        yPercent: 0,
        opacity: 1,
        ease: 'none',
        scrollTrigger: { trigger: footer, start: 'top bottom', end: 'top 60%', scrub: true }
      }
    );
  }

  const refresh = () => ScrollTrigger.refresh();
  window.addEventListener('load', refresh, { once: true });
  document.fonts?.ready.then(refresh);
  desktop.addEventListener('change', refresh);

}
