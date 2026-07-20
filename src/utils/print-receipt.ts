/**
 * Print an HTML fragment in an isolated iframe so the main app
 * never gets stuck in print media / overflow / overlay state.
 */
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

  const styles = Array.from(
    document.querySelectorAll('link[rel="stylesheet"], style'),
  )
    .map((el) => el.outerHTML)
    .join('\n');

  const safeTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${safeTitle}</title>
  ${styles}
  <style>
    @page { size: A4; margin: 10mm; }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff !important;
      color: #111 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body { padding: 0; }
    .sale-receipt-sheet {
      width: 100% !important;
      max-width: none !important;
      min-height: auto !important;
      margin: 0 !important;
      box-shadow: none !important;
    }
  </style>
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

  // Some browsers fire afterprint; others restore focus after the dialog closes.
  const onFocusCleanup = () => {
    // Ignore focus flicker when the dialog first opens
    if (Date.now() - startedAt < 900) return;
    window.setTimeout(cleanup, 250);
  };

  win.addEventListener('afterprint', cleanup);
  window.addEventListener('focus', onFocusCleanup);

  const triggerPrint = () => {
    try {
      win.focus();
      win.print();
    } catch {
      cleanup();
      return;
    }
    // Last-resort cleanup if neither afterprint nor focus fires
    window.setTimeout(cleanup, 120_000);
  };

  // Let stylesheets + layout settle before opening the dialog
  window.setTimeout(triggerPrint, 200);
}
