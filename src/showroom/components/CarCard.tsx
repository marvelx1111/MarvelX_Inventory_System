import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Car } from '../data/cars';
import { formatPrice } from '../data/cars';
import { generateCarImage } from '../utils/carCanvas';
import { DURATION, EASE, prefersReducedMotion } from '../utils/motion';

gsap.registerPlugin(ScrollTrigger);

interface CarCardProps {
  car: Car;
  index: number;
  onSelect: (car: Car, element: HTMLElement) => void;
  onCursorEnter: () => void;
  onCursorLeave: () => void;
}

export function CarCard({
  car,
  index,
  onSelect,
  onCursorEnter,
  onCursorLeave,
}: CarCardProps) {
  const cardRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const imageSrc = useRef('');

  useEffect(() => {
    imageSrc.current = generateCarImage(car);
    const image = imageRef.current;
    if (image) {
      image.style.backgroundImage = `url(${imageSrc.current})`;
    }
  }, [car]);

  useEffect(() => {
    const card = cardRef.current;
    if (!card || prefersReducedMotion()) return;

    gsap.fromTo(
      card,
      { y: 80, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: DURATION.slow,
        ease: EASE.out,
        scrollTrigger: {
          trigger: card,
          start: 'top 90%',
          toggleActions: 'play none none reverse',
        },
        delay: (index % 3) * 0.1,
      },
    );
  }, [index]);

  const handleMove = (e: React.MouseEvent) => {
    if (prefersReducedMotion()) return;
    const card = cardRef.current;
    const image = imageRef.current;
    if (!card || !image) return;

    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    gsap.to(card, {
      x: x * 14,
      y: y * 14,
      duration: 0.5,
      ease: 'power3.out',
    });
    gsap.to(image, {
      x: x * -24,
      y: y * -24,
      scale: 1.1,
      duration: 0.6,
      ease: 'power3.out',
    });
  };

  const handleLeave = () => {
    const card = cardRef.current;
    const image = imageRef.current;
    if (!card || !image) return;
    gsap.to(card, { x: 0, y: 0, duration: 0.6, ease: 'power3.out' });
    gsap.to(image, { x: 0, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' });
    onCursorLeave();
  };

  return (
    <article
      className="car-card"
      ref={cardRef}
      data-car-id={car.id}
      data-flip-id={car.id}
      onMouseMove={handleMove}
      onMouseEnter={onCursorEnter}
      onMouseLeave={handleLeave}
      onClick={() => cardRef.current && onSelect(car, cardRef.current)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          cardRef.current && onSelect(car, cardRef.current);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`View ${car.name} details`}
    >
      <div className="car-card__image-wrap">
        <div
          className="car-card__image"
          ref={imageRef}
          role="img"
          aria-label={`${car.name} — ${car.tagline}`}
        />
        <div className="car-card__overlay">
          <span className="car-card__view">View</span>
        </div>
      </div>
      <div className="car-card__info">
        <div className="car-card__top">
          <h3 className="car-card__name">{car.name}</h3>
          <span className="car-card__year">{car.year}</span>
        </div>
        <p className="car-card__tagline">{car.tagline}</p>
        <div className="car-card__specs">
          <span>{car.horsepower} HP</span>
          <span>{car.zeroToSixty}s 0-60</span>
          <span>{car.bodyType}</span>
        </div>
        <div className="car-card__price">{formatPrice(car.price)}</div>
      </div>
    </article>
  );
}
