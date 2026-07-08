import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Magnetic } from './Magnetic';

export function Footer() {
  const marqueeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const marquee = marqueeRef.current;
    if (!marquee) return;

    const inner = marquee.querySelector('.footer__marquee-inner');
    if (!inner) return;

    gsap.to(inner, {
      x: '-50%',
      duration: 24,
      ease: 'none',
      repeat: -1,
    });
  }, []);

  const handleLinkHover = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const link = e.currentTarget;
    gsap.to(link, {
      skewX: -6,
      x: 12,
      duration: 0.35,
      ease: 'power3.out',
    });
  };

  const handleLinkLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    gsap.to(e.currentTarget, {
      skewX: 0,
      x: 0,
      duration: 0.45,
      ease: 'power3.out',
    });
  };

  return (
    <footer className="footer" id="contact">
      <div className="footer__marquee" ref={marqueeRef} aria-hidden="true">
        <div className="footer__marquee-inner">
          <span>MARVELX — BEYOND EXTRAORDINARY — MARVELX — BEYOND EXTRAORDINARY —</span>
          <span>MARVELX — BEYOND EXTRAORDINARY — MARVELX — BEYOND EXTRAORDINARY —</span>
        </div>
      </div>

      <div className="footer__main">
        <div className="footer__cta-block">
          <h2 className="footer__cta-title reveal-line">
            Ready to define
            <br />
            your next chapter?
          </h2>
          <Magnetic className="footer__cta-btn" strength={0.3}>
            Schedule a private viewing
          </Magnetic>
        </div>

        <div className="footer__links">
          <a
            href="#inventory"
            className="footer__link"
            onMouseEnter={handleLinkHover}
            onMouseLeave={handleLinkLeave}
          >
            Collection
          </a>
          <a
            href="#featured"
            className="footer__link"
            onMouseEnter={handleLinkHover}
            onMouseLeave={handleLinkLeave}
          >
            Featured
          </a>
          <a
            href="mailto:concierge@marvelx.pk"
            className="footer__link"
            onMouseEnter={handleLinkHover}
            onMouseLeave={handleLinkLeave}
          >
            Concierge
          </a>
          <a
            href="#"
            className="footer__link"
            onMouseEnter={handleLinkHover}
            onMouseLeave={handleLinkLeave}
          >
            Privacy
          </a>
        </div>

        <div className="footer__bottom">
          <span>© 2026 MARVELX Automotive</span>
          <span>Lahore — Karachi — Dubai</span>
        </div>
      </div>
    </footer>
  );
}
