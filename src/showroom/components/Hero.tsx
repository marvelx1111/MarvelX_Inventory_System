import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createShowroomScene } from '../three/proceduralCar';
import { splitTextToSpans, DURATION, EASE, prefersReducedMotion } from '../utils/motion';

gsap.registerPlugin(ScrollTrigger);

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const headline = headlineRef.current;
    const sub = subRef.current;
    const scroll = scrollRef.current;
    const content = contentRef.current;
    const section = sectionRef.current;
    if (!canvas || !headline || !sub || !scroll || !content || !section) return;

    const scene = createShowroomScene(canvas, {
      bodyColor: '#12121a',
      accentColor: '#d4af37',
    });

    const onResize = () => scene.resize();
    window.addEventListener('resize', onResize);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      scene.setMouse(x, y);
    };
    window.addEventListener('mousemove', onMouseMove);

    if (!prefersReducedMotion()) {
      const chars = splitTextToSpans(headline, 'chars');
      gsap.set(chars, { y: '110%', opacity: 0 });

      const tl = gsap.timeline({ delay: 3.1 });
      tl.to(chars, {
        y: 0,
        opacity: 1,
        duration: DURATION.reveal,
        ease: EASE.out,
        stagger: 0.035,
      })
        .to(
          sub,
          { clipPath: 'inset(0% 0% 0% 0%)', duration: DURATION.normal, ease: EASE.out },
          '-=0.9',
        )
        .to(scroll, { opacity: 1, y: 0, duration: DURATION.fast, ease: EASE.out }, '-=0.5');

      gsap.to(content, {
        y: 120,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.2,
        },
      });

      gsap.to(canvas, {
        scale: 1.08,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      });
    } else {
      gsap.set(sub, { clipPath: 'inset(0% 0% 0% 0%)' });
      gsap.set(scroll, { opacity: 1, y: 0 });
    }

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      scene.cleanup();
    };
  }, []);

  return (
    <section className="hero" ref={sectionRef} id="hero">
      <div className="hero__canvas" ref={canvasRef} aria-hidden="true" />
      <div className="hero__vignette" aria-hidden="true" />
      <div className="hero__content" ref={contentRef}>
        <p className="hero__eyebrow reveal-line">Est. 2019 — Lahore & Karachi</p>
        <h1 className="hero__headline" ref={headlineRef}>
          MARVELX
        </h1>
        <p className="hero__sub" ref={subRef}>
          Pakistan&apos;s definitive automotive atelier.
          <br />
          Where precision engineering meets uncompromising design.
        </p>
      </div>
      <div className="hero__scroll" ref={scrollRef}>
        <span>Scroll to explore</span>
        <div className="hero__scroll-line" />
      </div>
    </section>
  );
}
