/**
 * Marvel X sale receipt — exact A4 portrait (210×297mm).
 * Matched to the letterhead sample: logo top-right, bold section
 * titles, regular-weight table text, compact title→table gaps.
 */
export const RECEIPT_SHEET_CSS = `
.mx-receipt, .mx-receipt * { box-sizing: border-box; }
.mx-receipt {
  --ink: #111;
  --label-bg: #f0f0f0;
  --red: #e10600;
  --page-w: 210mm;
  --page-h: 297mm;
  width: var(--page-w);
  min-width: var(--page-w);
  max-width: var(--page-w);
  height: var(--page-h);
  min-height: var(--page-h);
  max-height: var(--page-h);
  margin: 0 auto;
  padding: 5mm 10mm 0;
  overflow: hidden;
  background: #fff !important;
  color: var(--ink) !important;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 9px;
  line-height: 1.2;
  display: block;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

/* Sample places MARVEL X on the top-right (X ~76% across the page) */
.mx-receipt-letterhead {
  text-align: right;
  padding: 0 0 3px;
  border-bottom: 1.25px solid #000;
}
.mx-receipt-brand {
  display: inline-flex;
  align-items: baseline;
  gap: 0;
  letter-spacing: -1px;
}
.mx-receipt-brand-marvel {
  font-size: 26px;
  font-weight: 800;
  font-style: italic;
  color: #4b5563 !important;
  line-height: 1;
  font-family: Arial Black, Arial, Helvetica, sans-serif;
}
.mx-receipt-brand-x {
  display: inline-block;
  margin-left: -5px;
  font-size: 34px;
  font-weight: 900;
  font-style: italic;
  color: var(--red) !important;
  line-height: 0.82;
  transform: skewX(-8deg);
  font-family: Arial Black, Arial, Helvetica, sans-serif;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

.mx-receipt-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-top: 5px;
  margin-bottom: 4px;
}
.mx-receipt-doc-title {
  margin: 0;
  padding-top: 1px;
  font-size: 12.5px;
  font-weight: 800 !important;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: var(--ink) !important;
}
.mx-receipt-meta {
  width: 200px;
  flex-shrink: 0;
  border-collapse: collapse;
  font-size: 9px;
}
.mx-receipt-meta td {
  border: none !important;
  padding: 0.5px 0;
  vertical-align: baseline;
  color: var(--ink) !important;
  background: transparent !important;
}
.mx-receipt-meta td:first-child {
  width: 74px;
  font-weight: 700 !important;
  white-space: nowrap;
}
.mx-receipt-meta td:nth-child(2) {
  width: 8px;
  font-weight: 700 !important;
  padding: 0 4px 0 0;
}
.mx-receipt-meta td:last-child {
  font-weight: 700 !important;
}

.mx-receipt-main {
  display: block;
  padding-top: 1px;
}

/* Between sections ≈ one row; title sits tight on its table */
.mx-receipt-section {
  margin: 0 0 5px;
}
.mx-receipt-section-title {
  margin: 0 0 2px;
  padding: 0;
  font-size: 9.5px;
  font-weight: 800 !important;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--ink) !important;
  background: transparent !important;
  border: none !important;
}

.mx-receipt-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.mx-receipt-table td {
  border: 1px solid #000;
  padding: 3.5px 7px;
  vertical-align: middle;
  font-size: 9px;
  font-weight: 400 !important;
  color: var(--ink) !important;
}
/* Sample: grey label cells, regular (not bold) label text */
.mx-receipt-table .lbl,
.mx-receipt-table .lbl-wide {
  font-weight: 400 !important;
  white-space: nowrap;
  background: var(--label-bg) !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
.mx-receipt-table .lbl { width: 16%; }
.mx-receipt-table .lbl-wide { width: 18%; }
.mx-receipt-table .val,
.mx-receipt-table .val-wide {
  font-weight: 400 !important;
  background: #fff !important;
  word-wrap: break-word;
  overflow-wrap: anywhere;
}
.mx-receipt-table .val { width: 34%; }
.mx-receipt-table .val-wide { width: 82%; }

.mx-receipt-legal {
  margin: 0;
  padding: 4px 7px;
  border: 1px solid #000;
  font-size: 7.7px;
  line-height: 1.28;
  text-align: justify;
  font-weight: 400 !important;
  color: var(--ink) !important;
  background: #fff !important;
}

.mx-receipt-signs {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.mx-receipt-signs > tbody > tr > td {
  border: 1px solid #000;
  padding: 0;
  vertical-align: top;
  width: 33.33%;
  height: 108px;
  background: #fff !important;
  color: var(--ink) !important;
}
.mx-receipt-sign-head {
  margin: 0;
  padding: 3px 4px;
  font-size: 8.5px;
  font-weight: 800 !important;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  text-align: center;
  color: var(--ink) !important;
  background: var(--label-bg) !important;
  border-bottom: 1px solid #000;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
.mx-receipt-sign-body {
  padding: 4px 6px 3px;
}
.mx-receipt-ack {
  margin: 0 0 3px;
  font-size: 6.5px;
  line-height: 1.2;
  text-align: justify;
  font-weight: 400 !important;
  color: var(--ink) !important;
}
.mx-receipt-sig-line {
  border-bottom: 1px solid #000;
  height: 18px;
  margin: 2px 0 4px;
}
.mx-receipt-sign-row {
  display: grid;
  grid-template-columns: 62px 1fr;
  gap: 2px;
  margin-bottom: 1.5px;
  font-size: 8px;
  min-height: 10px;
  font-weight: 400 !important;
}
.mx-receipt-sign-row .k { font-weight: 700 !important; }
.mx-receipt-stamp {
  margin: 3px auto 5px;
  width: 88%;
  height: 34px;
  border: 1.5px dashed #555;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 7.5px;
  font-weight: 700 !important;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #444 !important;
}

.mx-receipt-closing {
  margin-top: 0;
}
.mx-receipt-note {
  margin: 0;
  font-size: 8.5px;
  color: var(--ink) !important;
  background: transparent !important;
  border: none;
  padding: 0;
}
.mx-receipt-note strong {
  font-weight: 800 !important;
  text-transform: uppercase;
}
.mx-receipt-note-text {
  font-weight: 400 !important;
}
.mx-receipt-footer {
  margin-top: 3px;
  padding: 0;
}
.mx-receipt-footer-rule {
  border-top: 1px solid #000;
  padding-top: 2px;
  padding-bottom: 2px;
}
.mx-receipt-contacts {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: space-between;
  gap: 3px;
  font-size: 7.5px;
  font-weight: 400 !important;
  color: var(--ink) !important;
}
.mx-receipt-contact {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
.mx-receipt-contact .ico {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #111 !important;
  color: #fff !important;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 7px;
  line-height: 1;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
.mx-receipt-sep {
  color: #666;
  user-select: none;
  flex-shrink: 0;
}
.mx-receipt-redbar {
  display: block;
  width: calc(100% + 20mm);
  margin: 3px -10mm 0;
  height: 7px;
  background: #e10600 !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

@media print {
  @page {
    size: 210mm 297mm;
    margin: 0;
  }
  html, body {
    width: 210mm !important;
    height: 297mm !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
  }
  .mx-receipt {
    width: 210mm !important;
    min-width: 210mm !important;
    max-width: 210mm !important;
    height: 297mm !important;
    min-height: 297mm !important;
    max-height: 297mm !important;
    margin: 0 !important;
    padding: 5mm 10mm 0 !important;
    zoom: 1 !important;
    transform: none !important;
    page-break-after: avoid !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    box-shadow: none !important;
  }
}
`.trim();
