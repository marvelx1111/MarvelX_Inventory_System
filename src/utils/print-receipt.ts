/**
 * Print an HTML fragment in an isolated iframe.
 * Receipt HTML must include its own <style> block (see VehicleSaleReceipt)
 * so the PDF matches the on-screen preview without relying on app Tailwind.
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
  Object.assign(iframe.style, {
    position: 'fixed',
    right: '0',
    bottom: '0',
    width: '0',
    height: '0',
    border: '0',
    opacity: '0',
    pointerEvents: 'none',
  });
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = iframe.contentDocument;
  if (!win || !doc) {
    iframe.remove();
    document.body.style.overflow = previousOverflow;
    return;
  }

  // Ensure styles exist even if the cloned node somehow omitted <style>
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
    @page { size: A4 portrait; margin: 0; }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 210mm;
      height: 297mm;
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

  // Give the browser a beat to layout tables + colors before opening the dialog
  window.setTimeout(() => {
    try {
      win.focus();
      win.print();
    } catch {
      cleanup();
      return;
    }
    window.setTimeout(cleanup, 120_000);
  }, 400);
}
