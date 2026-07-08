import gsap from 'gsap';

export const EASE = {
  out: 'power4.out',
  in: 'power4.in',
  inOut: 'power4.inOut',
  expo: 'expo.out',
  expoIn: 'expo.in',
} as const;

export const DURATION = {
  fast: 0.4,
  normal: 0.8,
  slow: 1.2,
  reveal: 1.4,
} as const;

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function splitTextToSpans(
  element: HTMLElement,
  type: 'chars' | 'words' | 'lines' = 'chars',
): HTMLSpanElement[] {
  const text = element.textContent ?? '';
  element.textContent = '';
  element.setAttribute('aria-label', text);

  const spans: HTMLSpanElement[] = [];

  if (type === 'chars') {
    [...text].forEach((char) => {
      const span = document.createElement('span');
      span.className = 'split-char';
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.setAttribute('aria-hidden', 'true');
      element.appendChild(span);
      spans.push(span);
    });
  } else if (type === 'words') {
    text.split(' ').forEach((word, i, arr) => {
      const span = document.createElement('span');
      span.className = 'split-word';
      span.textContent = word;
      span.setAttribute('aria-hidden', 'true');
      element.appendChild(span);
      if (i < arr.length - 1) {
        element.appendChild(document.createTextNode(' '));
      }
      spans.push(span);
    });
  }

  return spans;
}

export function animateCounter(
  element: HTMLElement,
  target: number,
  options: {
    duration?: number;
    decimals?: number;
    suffix?: string;
    prefix?: string;
  } = {},
): gsap.core.Tween {
  const { duration = 2, decimals = 0, suffix = '', prefix = '' } = options;
  const obj = { value: 0 };

  return gsap.to(obj, {
    value: target,
    duration: prefersReducedMotion() ? 0 : duration,
    ease: EASE.out,
    onUpdate: () => {
      element.textContent = `${prefix}${obj.value.toFixed(decimals)}${suffix}`;
    },
  });
}

export function revealLines(
  container: HTMLElement,
  selector = '.reveal-line',
): gsap.core.Timeline {
  const lines = container.querySelectorAll<HTMLElement>(selector);
  const tl = gsap.timeline();

  if (prefersReducedMotion()) {
    gsap.set(lines, { clipPath: 'inset(0% 0% 0% 0%)', y: 0, opacity: 1 });
    return tl;
  }

  gsap.set(lines, { clipPath: 'inset(100% 0% 0% 0%)', y: '100%' });

  tl.to(lines, {
    clipPath: 'inset(0% 0% 0% 0%)',
    y: 0,
    duration: DURATION.reveal,
    ease: EASE.out,
    stagger: 0.12,
  });

  return tl;
}
