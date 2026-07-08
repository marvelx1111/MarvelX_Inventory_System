import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Magnetic } from './Magnetic';

interface NavigationProps {
  onInventoryClick: () => void;
}

export function Navigation({ onInventoryClick }: NavigationProps) {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const onScroll = () => {
      const scrolled = window.scrollY > 60;
      nav.classList.toggle('nav--scrolled', scrolled);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    gsap.fromTo(
      nav,
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: 'power4.out', delay: 3.2 },
    );

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="nav" ref={navRef}>
      <nav className="nav__inner" aria-label="Main navigation">
        <Magnetic as="a" href="#hero" className="nav__logo" strength={0.2}>
          MARVELX
        </Magnetic>

        <ul className="nav__links">
          <li>
            <Magnetic as="a" href="#inventory" className="nav__link" strength={0.25} onClick={onInventoryClick}>
              Collection
            </Magnetic>
          </li>
          <li>
            <Magnetic as="a" href="#featured" className="nav__link" strength={0.25}>
              Featured
            </Magnetic>
          </li>
          <li>
            <Magnetic as="a" href="#contact" className="nav__link" strength={0.25}>
              Contact
            </Magnetic>
          </li>
        </ul>

        <Magnetic className="nav__cta" strength={0.3}>
          Reserve
        </Magnetic>
      </nav>
    </header>
  );
}
