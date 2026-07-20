/**
 * Print an HTML fragment in an isolated iframe so the main app
 * never gets stuck in print media / overflow / overlay state.
 *
 * Stylesheets are rewritten to absolute URLs (iframe is about:blank),
 * and critical letterhead CSS is inlined so the Marvel X logo always prints.
 */

function toAbsoluteUrl(url: string): string {
  try {
    return new URL(url, window.location.href).href;
  } catch {
    return url;
  }
}

function absolutizeHtmlUrls(html: string): string {
  return html.replace(
    /\b(src|href)=["']([^"']+)["']/gi,
    (_match, attr: string, value: string) => {
      if (
        !value ||
        value.startsWith('data:') ||
        value.startsWith('blob:') ||
        value.startsWith('#') ||
        value.startsWith('mailto:') ||
        value.startsWith('tel:')
      ) {
        return `${attr}="${value}"`;
      }
      return `${attr}="${toAbsoluteUrl(value)}"`;
    },
  );
}

function collectStylesheetTags(): string {
  return Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .map((el) => {
      const href = el.getAttribute('href');
      if (!href) return el.outerHTML;
      const abs = toAbsoluteUrl(href);
      return `<link rel="stylesheet" href="${abs}" />`;
    })
    .concat(Array.from(document.querySelectorAll('style')).map((el) => el.outerHTML))
    .join('\n');
}

/** Self-contained letterhead + layout fallbacks when Tailwind fails to load in time */
const RECEIPT_PRINT_CSS = `
  @page { size: A4; margin: 10mm; }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff !important;
    color: #111 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    font-family: Arial, Helvetica, sans-serif;
  }
  .sale-receipt-sheet {
    width: 100% !important;
    max-width: none !important;
    min-height: auto !important;
    margin: 0 !important;
    box-shadow: none !important;
    background: #fff !important;
    color: #111 !important;
    box-sizing: border-box;
  }
  .mx-receipt-letterhead {
    text-align: center;
    padding-bottom: 8px;
    border-bottom: 2.5px solid #000;
  }
  .mx-brand {
    display: inline-flex;
    align-items: baseline;
    gap: 1px;
    letter-spacing: -0.5px;
  }
  .mx-brand-marvel {
    font-size: 34px !important;
    font-weight: 800 !important;
    font-style: italic !important;
    color: #4b5563 !important;
    line-height: 1 !important;
    letter-spacing: -0.5px;
  }
  .mx-brand-x {
    display: inline-block !important;
    font-size: 42px !important;
    font-weight: 900 !important;
    font-style: italic !important;
    color: #e10600 !important;
    line-height: 0.85 !important;
    transform: skewX(-8deg);
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .mx-receipt-redbar {
    height: 10px !important;
    background: #e10600 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
`;

function waitForStyles(doc: Document, timeoutMs = 1500): Promise<void> {
  const links = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'));
  if (links.length === 0) return Promise.resolve();

  return new Promise((resolve) => {
    let remaining = links.length;
    const done = () => {
      remaining -= 1;
      if (remaining <= 0) resolve();
    };
    const timer = window.setTimeout(() => resolve(), timeoutMs);
    for (const link of links) {
      const el = link as HTMLLinkElement;
      if (el.sheet) {
        done();
        continue;
      }
      el.addEventListener('load', () => {
        if (remaining === 1) window.clearTimeout(timer);
        done();
      });
      el.addEventListener('error', () => {
        if (remaining === 1) window.clearTimeout(timer);
        done();
      });
    }
  });
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

  const styles = collectStylesheetTags();
  const bodyHtml = absolutizeHtmlUrls(html);
  const safeTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const baseHref = `${window.location.origin}/`;

  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <base href="${baseHref}" />
  <title>${safeTitle}</title>
  ${styles}
  <style>${RECEIPT_PRINT_CSS}</style>
</head>
<body>${bodyHtml}</body>
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

  void waitForStyles(doc).then(() => {
    // Extra frame for layout after CSS applies
    window.setTimeout(() => {
      try {
        win.focus();
        win.print();
      } catch {
        cleanup();
        return;
      }
      window.setTimeout(cleanup, 120_000);
    }, 150);
  });
}
