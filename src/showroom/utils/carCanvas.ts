import type { Car, BodyType } from '../data/cars';

const cache = new Map<string, string>();

export function generateCarImage(car: Car, width = 800, height = 500): string {
  const key = `${car.id}-${width}-${height}`;
  if (cache.has(key)) return cache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(
    width * 0.5,
    height * 0.55,
    0,
    width * 0.5,
    height * 0.55,
    width * 0.7,
  );
  grad.addColorStop(0, adjustBrightness(car.color, 30));
  grad.addColorStop(0.4, car.color);
  grad.addColorStop(1, '#030303');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 20; i++) {
    ctx.strokeStyle = car.accentColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.5 + i * (height / 20));
    ctx.lineTo(width, height * 0.5 + i * (height / 20) + 40);
    ctx.stroke();
  }
  ctx.restore();

  const floorGrad = ctx.createLinearGradient(0, height * 0.6, 0, height);
  floorGrad.addColorStop(0, 'transparent');
  floorGrad.addColorStop(1, 'rgba(0,0,0,0.75)');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, height * 0.45, width, height * 0.55);

  drawCarSilhouette(ctx, width, height, car);

  const glowGrad = ctx.createRadialGradient(
    width * 0.5,
    height * 0.5,
    0,
    width * 0.5,
    height * 0.5,
    width * 0.45,
  );
  glowGrad.addColorStop(0, `${car.accentColor}28`);
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.font = `300 ${width * 0.07}px system-ui, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText(car.brand, width - 24, height - 24);

  ctx.fillStyle = car.accentColor;
  ctx.globalAlpha = 0.4;
  ctx.font = `400 ${width * 0.025}px system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(car.bodyType.toUpperCase(), 24, height - 24);
  ctx.globalAlpha = 1;

  const dataUrl = canvas.toDataURL('image/png');
  cache.set(key, dataUrl);
  return dataUrl;
}

function drawCarSilhouette(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  car: Car,
) {
  const cx = w * 0.5;
  const cy = h * 0.58;
  const scale = w / 800;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  const bodyGrad = ctx.createLinearGradient(-200, -80, 200, 40);
  bodyGrad.addColorStop(0, adjustBrightness(car.color, 50));
  bodyGrad.addColorStop(0.5, car.color);
  bodyGrad.addColorStop(1, adjustBrightness(car.color, -40));

  ctx.fillStyle = bodyGrad;
  drawBodyByType(ctx, car.bodyType);

  ctx.strokeStyle = car.accentColor;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(-190, 8);
  ctx.lineTo(210, 8);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#0a0a0f';
  drawWindows(ctx, car.bodyType);

  const wheelY = 32;
  const wheelR = 34;
  [-145, 135].forEach((wx) => {
    ctx.fillStyle = '#0d0d0d';
    ctx.beginPath();
    ctx.arc(wx, wheelY, wheelR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = car.accentColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(wx, wheelY, wheelR - 10, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#222';
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      ctx.fillRect(
        wx + Math.cos(angle) * 14 - 2,
        wheelY + Math.sin(angle) * 14 - 2,
        4,
        4,
      );
    }
  });

  ctx.fillStyle = car.accentColor;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.ellipse(-175, 18, 14, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(215, 18, 10, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.restore();
}

function drawBodyByType(ctx: CanvasRenderingContext2D, type: BodyType) {
  ctx.beginPath();
  switch (type) {
    case 'suv':
      ctx.moveTo(-210, 25);
      ctx.lineTo(-195, -20);
      ctx.lineTo(-100, -50);
      ctx.lineTo(80, -55);
      ctx.lineTo(200, -35);
      ctx.lineTo(230, 5);
      ctx.lineTo(235, 30);
      ctx.lineTo(-205, 35);
      break;
    case 'sedan':
      ctx.moveTo(-220, 22);
      ctx.lineTo(-200, -5);
      ctx.lineTo(-80, -45);
      ctx.lineTo(60, -50);
      ctx.lineTo(190, -25);
      ctx.lineTo(230, 5);
      ctx.lineTo(238, 28);
      ctx.lineTo(-215, 32);
      break;
    case 'convertible':
      ctx.moveTo(-220, 20);
      ctx.lineTo(-180, 0);
      ctx.lineTo(-40, -35);
      ctx.lineTo(80, -38);
      ctx.lineTo(200, -15);
      ctx.lineTo(235, 22);
      ctx.lineTo(-215, 30);
      break;
    case 'hypercar':
      ctx.moveTo(-210, 18);
      ctx.lineTo(-170, -15);
      ctx.lineTo(-30, -55);
      ctx.lineTo(100, -60);
      ctx.lineTo(220, -20);
      ctx.lineTo(245, 15);
      ctx.lineTo(220, 28);
      ctx.lineTo(-200, 30);
      break;
    default:
      ctx.moveTo(-220, 20);
      ctx.lineTo(-200, -10);
      ctx.lineTo(-120, -55);
      ctx.lineTo(-40, -60);
      ctx.lineTo(60, -65);
      ctx.lineTo(140, -60);
      ctx.lineTo(200, -30);
      ctx.lineTo(230, 0);
      ctx.lineTo(240, 25);
      ctx.lineTo(220, 35);
      ctx.lineTo(-210, 35);
  }
  ctx.closePath();
  ctx.fill();
}

function drawWindows(ctx: CanvasRenderingContext2D, type: BodyType) {
  ctx.beginPath();
  if (type === 'suv') {
    ctx.moveTo(-120, -42);
    ctx.lineTo(60, -48);
    ctx.lineTo(70, -25);
    ctx.lineTo(-110, -20);
  } else if (type === 'convertible') {
    ctx.moveTo(-50, -30);
    ctx.lineTo(70, -33);
    ctx.lineTo(75, -18);
    ctx.lineTo(-45, -15);
  } else if (type === 'hypercar') {
    ctx.moveTo(-80, -48);
    ctx.lineTo(40, -55);
    ctx.lineTo(50, -38);
    ctx.lineTo(-70, -32);
  } else {
    ctx.moveTo(-60, -58);
    ctx.lineTo(40, -63);
    ctx.lineTo(50, -45);
    ctx.lineTo(-50, -42);
  }
  ctx.closePath();
  ctx.fill();
}

function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + percent));
  const b = Math.min(255, Math.max(0, (num & 0xff) + percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
