/**
 * Print an HTML fragment in an isolated iframe at exact A4 size
 * (210mm × 297mm) so Save as PDF matches a physical A4 page.
 */

import { RECEIPT_SHEET_CSS } from '@/components/sales/receiptSheetCss';

function escapeTitle(title: string): string {
  return title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function printHtmlFragment(html: string, title: string): void {
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = '';

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.setAttribute('title', title);
  // Real A4 layout box (off-screen) — zero-size iframes print at wrong scale
  Object.assign(iframe.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    width: '210mm',
    height: '297mm',
    border: '0',
    opacity: '0',
    pointerEvents: 'none',
    zIndex: '-1',
  });
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = iframe.contentDocument;
  if (!win || !doc) {
    iframe.remove();
    document.body.style.overflow = previousOverflow;
    return;
  }

  const hasEmbeddedStyle = /<style[\s>]/i.test(html);
  const styleBlock = hasEmbeddedStyle
    ? ''
    : `<style>${RECEIPT_SHEET_CSS}</style>`;

  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeTitle(title)}</title>
  <style>
    @page {
      size: 210mm 297mm;
      margin: 0;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 210mm !important;
      height: 297mm !important;
      overflow: hidden !important;
      background: #fff !important;
      color: #111 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  </style>
  ${styleBlock}
</head>
<body>${html}</body>
</html>`);
  doc.close();

  let cleaned = false;
  const startedAt = Date.now();
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    window.removeEventListener('focus', onFocusCleanup);
    win.removeEventListener('afterprint', cleanup);
    iframe.remove();
    document.body.style.overflow = previousOverflow;
  };

  const onFocusCleanup = () => {
    if (Date.now() - startedAt < 900) return;
    window.setTimeout(cleanup, 250);
  };

  win.addEventListener('afterprint', cleanup);
  window.addEventListener('focus', onFocusCleanup);

  window.setTimeout(() => {
    try {
      win.focus();
      win.print();
    } catch {
      cleanup();
      return;
    }
    window.setTimeout(cleanup, 120_000);
  }, 450);
}
