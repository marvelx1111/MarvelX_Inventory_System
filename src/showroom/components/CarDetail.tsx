import { useCallback, useEffect, useRef } from 'react';
import gsap from 'gsap';
import type { Car } from '../data/cars';
import { formatPrice } from '../data/cars';
import { generateCarImage } from '../utils/carCanvas';
import { createShowroomScene } from '../three/proceduralCar';
import { animateCounter, DURATION, EASE, prefersReducedMotion } from '../utils/motion';
import { Magnetic } from './Magnetic';

interface CarDetailProps {
  car: Car;
  onClose: () => void;
  flipOrigin: DOMRect | null;
}

export function CarDetail({ car, onClose, flipOrigin }: CarDetailProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const isDragging = useRef(false);
  const lastX = useRef(0);

  useEffect(() => {
    const overlay = overlayRef.current;
    const content = contentRef.current;
    if (!overlay || !content) return;

    document.body.style.overflow = 'hidden';

    if (!prefersReducedMotion()) {
      const originX = flipOrigin ? flipOrigin.left + flipOrigin.width / 2 : window.innerWidth / 2;
      const originY = flipOrigin ? flipOrigin.top + flipOrigin.height / 2 : window.innerHeight / 2;
      const originXPct = (originX / window.innerWidth) * 100;
      const originYPct = (originY / window.innerHeight) * 100;

      gsap.fromTo(
        overlay,
        { clipPath: `circle(0% at ${originXPct}% ${originYPct}%)` },
        {
          clipPath: 'circle(150% at 50% 50%)',
          duration: DURATION.slow,
          ease: EASE.inOut,
        },
      );

      const lines = content.querySelectorAll('.reveal-line');
      gsap.fromTo(
        lines,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: DURATION.normal,
          ease: EASE.out,
          stagger: 0.08,
          delay: 0.35,
        },
      );
    }

    const hpEl = content.querySelector('[data-hp]');
    const torqueEl = content.querySelector('[data-torque]');
    const speedEl = content.querySelector('[data-speed]');

    if (hpEl) animateCounter(hpEl as HTMLElement, car.horsepower, { duration: 1.5 });
    if (torqueEl) animateCounter(torqueEl as HTMLElement, car.torque, { duration: 1.5 });
    if (speedEl) animateCounter(speedEl as HTMLElement, car.topSpeed, { duration: 1.5, suffix: ' mph' });

    return () => {
      document.body.style.overflow = '';
    };
  }, [car, flipOrigin]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = createShowroomScene(canvas, {
      bodyColor: car.color,
      accentColor: car.accentColor,
    });

    const onResize = () => scene.resize();
    window.addEventListener('resize', onResize);

    const onPointerDown = (e: PointerEvent) => {
      isDragging.current = true;
      lastX.current = e.clientX;
      canvas.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const delta = (e.clientX - lastX.current) * 0.01;
      rotationRef.current += delta;
      scene.setRotation(rotationRef.current);
      lastX.current = e.clientX;
    };

    const onPointerUp = () => {
      isDragging.current = false;
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);

    return () => {
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      scene.cleanup();
    };
  }, [car]);

  const handleClose = useCallback(() => {
    const overlay = overlayRef.current;
    if (!overlay || prefersReducedMotion()) {
      onClose();
      return;
    }

    gsap.to(overlay, {
      clipPath: 'circle(0% at 50% 50%)',
      duration: DURATION.normal,
      ease: EASE.in,
      onComplete: onClose,
    });
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleClose]);

  return (
    <div className="detail" ref={overlayRef} role="dialog" aria-modal="true" aria-label={`${car.name} details`}>
      <button className="detail__close" onClick={handleClose} aria-label="Close detail view">
        <span />
        <span />
      </button>

      <div className="detail__layout">
        <div className="detail__canvas" ref={canvasRef} aria-label={`360 view of ${car.name}. Drag to rotate.`}>
          <p className="detail__rotate-hint">Drag to rotate</p>
        </div>
        <div className="detail__content" ref={contentRef}>
          <span className="detail__brand reveal-line">{car.brand}</span>
          <h2 className="detail__name reveal-line">{car.name}</h2>
          <p className="detail__tagline reveal-line">{car.tagline}</p>
          <p className="detail__desc reveal-line">{car.description}</p>

          <div className="detail__stats reveal-line">
            <div className="detail__stat">
              <span className="detail__stat-value" data-hp>0</span>
              <span className="detail__stat-label">Horsepower</span>
            </div>
            <div className="detail__stat">
              <span className="detail__stat-value" data-torque>0</span>
              <span className="detail__stat-label">Torque (lb-ft)</span>
            </div>
            <div className="detail__stat">
              <span className="detail__stat-value" data-speed>0</span>
              <span className="detail__stat-label">Top Speed</span>
            </div>
          </div>

          <div className="detail__specs reveal-line">
            {car.specs.map((spec) => (
              <div key={spec.label} className="detail__spec-row">
                <span>{spec.label}</span>
                <span>{spec.value}</span>
              </div>
            ))}
            <div className="detail__spec-row">
              <span>Transmission</span>
              <span>{car.transmission}</span>
            </div>
            <div className="detail__spec-row">
              <span>Drivetrain</span>
              <span>{car.drivetrain}</span>
            </div>
          </div>

          <div className="detail__footer reveal-line">
            <span className="detail__price">{formatPrice(car.price)}</span>
            <Magnetic className="detail__reserve" strength={0.3}>
              Reserve this vehicle
            </Magnetic>
          </div>
        </div>
      </div>

      <div
        className="detail__fallback-image"
        style={{ backgroundImage: `url(${generateCarImage(car, 600, 400)})` }}
        aria-hidden="true"
      />
    </div>
  );
}
