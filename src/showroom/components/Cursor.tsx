import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { prefersReducedMotion } from '../utils/motion';

export type CursorState = 'default' | 'hover' | 'view' | 'drag' | 'hidden';

interface CursorProps {
  state: CursorState;
}

export function Cursor({ state }: CursorProps) {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const onMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
    };

    const tick = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.15;
      pos.current.y += (target.current.y - pos.current.y) * 0.15;
      gsap.set(dot, { x: pos.current.x, y: pos.current.y });
      gsap.set(ring, { x: pos.current.x, y: pos.current.y });
    };

    window.addEventListener('mousemove', onMove);
    gsap.ticker.add(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      gsap.ticker.remove(tick);
    };
  }, []);

  useEffect(() => {
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!ring) return;

    if (prefersReducedMotion()) return;

    const sizes: Record<CursorState, number> = {
      default: 40,
      hover: 64,
      view: 80,
      drag: 56,
      hidden: 0,
    };

    gsap.to(ring, {
      width: sizes[state],
      height: sizes[state],
      opacity: state === 'hidden' ? 0 : 1,
      duration: 0.4,
      ease: 'power3.out',
    });

    if (label) {
      const labels: Record<CursorState, string> = {
        default: '',
        hover: '',
        view: 'View',
        drag: 'Drag',
        hidden: '',
      };
      label.textContent = labels[state];
      gsap.to(label, {
        opacity: state === 'view' || state === 'drag' ? 1 : 0,
        duration: 0.3,
      });
    }
  }, [state]);

  if (prefersReducedMotion()) return null;

  return (
    <div className="cursor" aria-hidden="true">
      <div className="cursor__dot" ref={dotRef} />
      <div className="cursor__ring" ref={ringRef}>
        <span className="cursor__label" ref={labelRef} />
      </div>
    </div>
  );
}
