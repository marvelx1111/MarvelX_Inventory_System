import { useRef, type ReactNode, type MouseEvent, type CSSProperties } from 'react';
import gsap from 'gsap';
import { prefersReducedMotion } from '../utils/motion';

interface MagneticProps {
  children: ReactNode;
  className?: string;
  strength?: number;
  as?: 'button' | 'a' | 'div';
  onClick?: () => void;
  href?: string;
  type?: 'button' | 'submit';
  'aria-label'?: string;
  style?: CSSProperties;
}

export function Magnetic({
  children,
  className = '',
  strength = 0.35,
  as = 'button',
  onClick,
  href,
  type = 'button',
  'aria-label': ariaLabel,
  style,
}: MagneticProps) {
  const ref = useRef<HTMLSpanElement>(null);

  const handleMove = (e: MouseEvent) => {
    if (prefersReducedMotion()) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    gsap.to(el, {
      x: x * strength,
      y: y * strength,
      duration: 0.4,
      ease: 'power3.out',
    });
  };

  const handleLeave = () => {
    if (prefersReducedMotion()) return;
    const el = ref.current;
    if (!el) return;
    gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'power3.out' });
  };

  const shared = {
    className: `magnetic ${className}`,
    onMouseMove: handleMove,
    onMouseLeave: handleLeave,
    style,
  };

  if (as === 'a') {
    return (
      <a {...shared} href={href} onClick={onClick} aria-label={ariaLabel}>
        <span className="magnetic__inner" ref={ref}>{children}</span>
      </a>
    );
  }

  if (as === 'div') {
    return (
      <div {...shared} onClick={onClick} role={onClick ? 'button' : undefined} aria-label={ariaLabel}>
        <span className="magnetic__inner" ref={ref}>{children}</span>
      </div>
    );
  }

  return (
    <button {...shared} type={type} onClick={onClick} aria-label={ariaLabel}>
      <span className="magnetic__inner" ref={ref}>{children}</span>
    </button>
  );
}
