import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { DURATION, EASE, prefersReducedMotion } from '../utils/motion';

interface PreloaderProps {
  onComplete: () => void;
}

export function Preloader({ onComplete }: PreloaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const counter = counterRef.current;
    const brand = brandRef.current;
    const tagline = taglineRef.current;
    const curtain = curtainRef.current;
    const line = lineRef.current;
    if (!container || !counter || !brand || !tagline || !curtain || !line) return;

    if (prefersReducedMotion()) {
      container.style.display = 'none';
      onComplete();
      return;
    }

    const chars = brand.querySelectorAll('.preloader-char');
    const counterObj = { value: 0 };

    const tl = gsap.timeline({
      onComplete: () => {
        container.style.display = 'none';
        onComplete();
      },
    });

    tl.to(counterObj, {
      value: 100,
      duration: 2.4,
      ease: EASE.expo,
      onUpdate: () => {
        counter.textContent = String(Math.round(counterObj.value)).padStart(3, '0');
      },
    })
      .to(
        line,
        { scaleX: 1, duration: 1.8, ease: EASE.inOut },
        0.2,
      )
      .to(
        chars,
        {
          y: 0,
          opacity: 1,
          duration: DURATION.slow,
          ease: EASE.out,
          stagger: 0.05,
        },
        0.5,
      )
      .to(
        tagline,
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: DURATION.normal,
          ease: EASE.out,
        },
        1.4,
      )
      .to(
        [counter, brand, tagline, line],
        {
          opacity: 0,
          y: -24,
          duration: DURATION.fast,
          ease: EASE.in,
          stagger: 0.04,
        },
        2.7,
      )
      .to(
        curtain,
        {
          scaleY: 0,
          transformOrigin: 'top center',
          duration: DURATION.slow,
          ease: EASE.inOut,
        },
        2.9,
      );

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  return (
    <div className="preloader" ref={containerRef} aria-hidden="true">
      <div className="preloader__inner">
        <span className="preloader__counter" ref={counterRef}>
          000
        </span>
        <div className="preloader__line" ref={lineRef} aria-hidden="true" />
        <div className="preloader__brand" ref={brandRef} aria-label="MARVELX">
          {'MARVELX'.split('').map((char, i) => (
            <span key={i} className="preloader-char">
              {char}
            </span>
          ))}
        </div>
        <p className="preloader__tagline" ref={taglineRef}>
          Beyond extraordinary
        </p>
      </div>
      <div className="preloader__curtain" ref={curtainRef} />
    </div>
  );
}
