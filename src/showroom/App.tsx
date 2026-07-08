import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';
import { cars as allCars, featuredCars, type Car, type BodyType } from './data/cars';
import { useLenis } from './hooks/useLenis';
import { revealLines, prefersReducedMotion } from './utils/motion';
import { Preloader } from './components/Preloader';
import { GrainOverlay } from './components/GrainOverlay';
import { Cursor, type CursorState } from './components/Cursor';
import { Navigation } from './components/Navigation';
import { Hero } from './components/Hero';
import { CategoriesStrip } from './components/CategoriesStrip';
import { FilterBar, type SortOption } from './components/FilterBar';
import { InventoryGrid } from './components/InventoryGrid';
import { FeaturedScroll } from './components/FeaturedScroll';
import { Footer } from './components/Footer';
import { CarDetail } from './components/CarDetail';

gsap.registerPlugin(ScrollTrigger, Flip);

export function ShowroomApp() {
  const [loaded, setLoaded] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [flipOrigin, setFlipOrigin] = useState<DOMRect | null>(null);
  const [cursorState, setCursorState] = useState<CursorState>('default');
  const [activeBody, setActiveBody] = useState<BodyType | 'all'>('all');
  const [activeSort, setActiveSort] = useState<SortOption>('price-desc');
  const flipStateRef = useRef<Flip.FlipState | null>(null);
  const mainRef = useRef<HTMLElement>(null);

  useLenis(loaded);

  const filteredCars = useMemo(() => {
    let result = [...allCars];
    if (activeBody !== 'all') {
      result = result.filter((c) => c.bodyType === activeBody);
    }
    switch (activeSort) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'year-asc':
        result.sort((a, b) => a.year - b.year);
        break;
      case 'year-desc':
        result.sort((a, b) => b.year - a.year);
        break;
    }
    return result;
  }, [activeBody, activeSort]);

  useEffect(() => {
    if (!loaded) return;
    const main = mainRef.current;
    if (!main) return;

    revealLines(main);

    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, [loaded]);

  const captureFlipState = useCallback(() => {
    const cards = document.querySelectorAll('.car-card');
    flipStateRef.current = Flip.getState(cards);
  }, []);

  useEffect(() => {
    if (!flipStateRef.current) return;
    Flip.from(flipStateRef.current, {
      duration: 0.7,
      ease: 'power4.inOut',
      stagger: 0.04,
      absolute: true,
      onComplete: () => {
        flipStateRef.current = null;
        ScrollTrigger.refresh();
      },
    });
  }, [filteredCars]);

  const handleSelectCar = useCallback((car: Car, element: HTMLElement) => {
    if (prefersReducedMotion()) {
      setSelectedCar(car);
      return;
    }

    const rect = element.getBoundingClientRect();
    setFlipOrigin(rect);

    const state = Flip.getState(element);
    const clone = element.cloneNode(true) as HTMLElement;
    clone.classList.add('car-card--clone');
    document.body.appendChild(clone);

    gsap.set(clone, {
      position: 'fixed',
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      zIndex: 200,
      margin: 0,
    });

    element.style.opacity = '0';

    gsap.to(clone, {
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      borderRadius: 0,
      duration: 0.85,
      ease: 'power4.inOut',
      onComplete: () => {
        clone.remove();
        element.style.opacity = '';
        Flip.from(state, { duration: 0 });
        setSelectedCar(car);
      },
    });
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedCar(null);
    setFlipOrigin(null);
  }, []);

  return (
    <>
      {!loaded && <Preloader onComplete={() => setLoaded(true)} />}
      <GrainOverlay />
      <Cursor state={cursorState} />
      <Navigation onInventoryClick={() => {}} />

      <main className={`showroom ${loaded ? 'is-loaded' : ''}`} ref={mainRef}>
        <Hero />
        <CategoriesStrip />
        <FilterBar
          activeBody={activeBody}
          activeSort={activeSort}
          onBodyChange={setActiveBody}
          onSortChange={setActiveSort}
          onBeforeFilter={captureFlipState}
        />
        <InventoryGrid
          cars={filteredCars}
          onSelect={handleSelectCar}
          onCursorEnter={() => setCursorState('view')}
          onCursorLeave={() => setCursorState('default')}
        />
        <FeaturedScroll
          cars={featuredCars}
          onCursorDrag={() => setCursorState('drag')}
          onCursorDefault={() => setCursorState('default')}
        />
        <Footer />
      </main>

      {selectedCar && (
        <CarDetail car={selectedCar} onClose={handleCloseDetail} flipOrigin={flipOrigin} />
      )}
    </>
  );
}
