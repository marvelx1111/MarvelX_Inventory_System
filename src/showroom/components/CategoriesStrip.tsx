import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { bodyTypes } from '../data/cars';
import { DURATION, EASE, prefersReducedMotion } from '../utils/motion';

gsap.registerPlugin(ScrollTrigger);

const categoryMeta: Record<string, { label: string; desc: string }> = {
  coupe: { label: 'Coupé', desc: 'Sculpted velocity' },
  sedan: { label: 'Sedan', desc: 'Executive presence' },
  suv: { label: 'SUV', desc: 'Command & comfort' },
  convertible: { label: 'Convertible', desc: 'Open-air theatre' },
  hypercar: { label: 'Hypercar', desc: 'Beyond limits' },
};

export function CategoriesStrip() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion()) return;

    const items = section.querySelectorAll('.categories__item');
    gsap.fromTo(
      items,
      { y: 60, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: DURATION.slow,
        ease: EASE.out,
        stagger: 0.1,
        scrollTrigger: {
          trigger: section,
          start: 'top 85%',
        },
      },
    );
  }, []);

  return (
    <section className="categories" ref={sectionRef} aria-label="Vehicle categories">
      <div className="categories__header">
        <span className="section-label reveal-line">MarvelX Signature</span>
        <h2 className="categories__title reveal-line">Curated by discipline</h2>
      </div>
      <div className="categories__grid">
        {bodyTypes.map((type) => (
          <a key={type} href="#inventory" className="categories__item">
            <span className="categories__item-label">{categoryMeta[type].label}</span>
            <span className="categories__item-desc">{categoryMeta[type].desc}</span>
            <span className="categories__item-line" aria-hidden="true" />
          </a>
        ))}
      </div>
    </section>
  );
}
