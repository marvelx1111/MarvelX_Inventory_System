import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Car } from '../data/cars';
import { formatPrice } from '../data/cars';
import { generateCarImage } from '../utils/carCanvas';
import { animateCounter, EASE, prefersReducedMotion } from '../utils/motion';

gsap.registerPlugin(ScrollTrigger);

interface FeaturedScrollProps {
  cars: Car[];
  onCursorDrag: () => void;
  onCursorDefault: () => void;
}

export function FeaturedScroll({
  cars,
  onCursorDrag,
  onCursorDefault,
}: FeaturedScrollProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track || prefersReducedMotion()) return;

    const panels = track.querySelectorAll('.featured__panel');
    const totalScroll = track.scrollWidth - window.innerWidth;

    const tween = gsap.to(track, {
      x: () => -totalScroll,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${totalScroll}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        onEnter: onCursorDrag,
        onLeave: onCursorDefault,
        onEnterBack: onCursorDrag,
        onLeaveBack: onCursorDefault,
      },
    });

    panels.forEach((panel, i) => {
      const num = panel.querySelector('.featured__number');
      const img = panel.querySelector('.featured__image');
      const specs = panel.querySelectorAll('.featured__spec-value');

      if (num) {
        ScrollTrigger.create({
          trigger: panel,
          containerAnimation: tween,
          start: 'left 60%',
          onEnter: () => {
            animateCounter(num as HTMLElement, i + 1, { duration: 1, decimals: 0 });
          },
        });
      }

      if (img) {
        gsap.fromTo(
          img,
          { scale: 1.2, clipPath: 'inset(20% 20% 20% 20%)' },
          {
            scale: 1,
            clipPath: 'inset(0% 0% 0% 0%)',
            ease: EASE.out,
            scrollTrigger: {
              trigger: panel,
              containerAnimation: tween,
              start: 'left 80%',
              end: 'left 30%',
              scrub: 1,
            },
          },
        );
      }

      specs.forEach((spec) => {
        const target = parseFloat(spec.getAttribute('data-value') ?? '0');
        const suffix = spec.getAttribute('data-suffix') ?? '';
        ScrollTrigger.create({
          trigger: panel,
          containerAnimation: tween,
          start: 'left 50%',
          onEnter: () => {
            animateCounter(spec as HTMLElement, target, {
              duration: 1.5,
              decimals: spec.getAttribute('data-decimals') ? 1 : 0,
              suffix,
            });
          },
        });
      });
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [cars, onCursorDrag, onCursorDefault]);

  return (
    <section className="featured" id="featured" ref={sectionRef}>
      <div className="featured__intro">
        <span className="section-label">Highlights</span>
        <h2 className="featured__title">Featured machines</h2>
      </div>
      <div className="featured__track" ref={trackRef}>
        {cars.map((car, i) => (
          <div className="featured__panel" key={car.id}>
            <div className="featured__panel-inner">
              <span className="featured__number">0{i + 1}</span>
              <div className="featured__content">
                <h3 className="featured__name">{car.name}</h3>
                <p className="featured__tagline">{car.tagline}</p>
                <div className="featured__specs">
                  <div className="featured__spec">
                    <span className="featured__spec-label">Horsepower</span>
                    <span
                      className="featured__spec-value"
                      data-value={car.horsepower}
                    >
                      0
                    </span>
                  </div>
                  <div className="featured__spec">
                    <span className="featured__spec-label">0-60 mph</span>
                    <span
                      className="featured__spec-value"
                      data-value={car.zeroToSixty}
                      data-decimals="1"
                      data-suffix="s"
                    >
                      0
                    </span>
                  </div>
                  <div className="featured__spec">
                    <span className="featured__spec-label">Top Speed</span>
                    <span
                      className="featured__spec-value"
                      data-value={car.topSpeed}
                      data-suffix=" mph"
                    >
                      0
                    </span>
                  </div>
                </div>
                <span className="featured__price">{formatPrice(car.price)}</span>
              </div>
              <div
                className="featured__image"
                style={{
                  backgroundImage: `url(${generateCarImage(car, 900, 600)})`,
                }}
                role="img"
                aria-label={car.name}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
