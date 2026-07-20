/** Dense A4 one-page receipt styles matching Marvel X sample letterhead. */
export const RECEIPT_SHEET_CSS = `
.mx-receipt, .mx-receipt * { box-sizing: border-box; }
.mx-receipt {
  --ink: #111;
  --muted: #333;
  --red: #e10600;
  width: 210mm;
  max-width: 100%;
  height: 297mm;
  max-height: 297mm;
  margin: 0 auto;
  padding: 7mm 9mm 5mm;
  overflow: hidden;
  background: #fff !important;
  color: var(--ink) !important;
  font-family: Calibri, 'Segoe UI', Arial, Helvetica, sans-serif;
  font-size: 9px;
  line-height: 1.25;
  display: flex;
  flex-direction: column;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
.mx-receipt-letterhead {
  text-align: center;
  padding-bottom: 3px;
  border-bottom: 1.5px solid #000;
  flex-shrink: 0;
}
.mx-receipt-brand {
  display: inline-flex;
  align-items: baseline;
  gap: 0;
  letter-spacing: -1px;
}
.mx-receipt-brand-marvel {
  font-size: 28px;
  font-weight: 800;
  font-style: italic;
  color: #3f3f46 !important;
  line-height: 1;
  font-family: Arial Black, Impact, Arial, Helvetica, sans-serif;
}
.mx-receipt-brand-x {
  display: inline-block;
  font-size: 34px;
  font-weight: 900;
  font-style: italic;
  color: var(--red) !important;
  line-height: 0.85;
  transform: skewX(-8deg);
  font-family: Arial Black, Impact, Arial, Helvetica, sans-serif;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
.mx-receipt-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-top: 5px;
  margin-bottom: 4px;
  flex-shrink: 0;
}
.mx-receipt-doc-title {
  margin: 0;
  padding-top: 2px;
  font-size: 12.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--ink) !important;
  font-family: Calibri, 'Segoe UI', Arial, Helvetica, sans-serif;
}
.mx-receipt-meta {
  width: 195px;
  flex-shrink: 0;
  border-collapse: collapse;
  font-size: 9px;
}
.mx-receipt-meta td {
  border: none !important;
  padding: 1px 0;
  vertical-align: baseline;
  color: var(--ink) !important;
  background: transparent !important;
}
.mx-receipt-meta td:first-child {
  width: 72px;
  font-weight: 700;
  white-space: nowrap;
  padding-right: 2px;
}
.mx-receipt-meta td:nth-child(2) {
  width: 8px;
  font-weight: 700;
  padding: 0 4px 0 0;
}
.mx-receipt-meta td:last-child {
  font-weight: 400;
}
.mx-receipt-section {
  margin-top: 4px;
  flex-shrink: 0;
}
.mx-receipt-section-title {
  margin: 0 0 2px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--ink) !important;
}
.mx-receipt-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.mx-receipt-table td {
  border: 1px solid #000;
  padding: 2.5px 5px;
  vertical-align: middle;
  font-size: 9px;
  color: var(--ink) !important;
  background: #fff !important;
  height: 15px;
}
.mx-receipt-table .lbl {
  width: 18%;
  font-weight: 700;
  white-space: nowrap;
}
.mx-receipt-table .val {
  width: 32%;
  font-weight: 400;
  word-wrap: break-word;
}
.mx-receipt-table .lbl-wide {
  width: 22%;
  font-weight: 700;
  white-space: nowrap;
}
.mx-receipt-table .val-wide {
  width: 78%;
  font-weight: 400;
}
.mx-receipt-legal {
  margin: 0;
  padding: 4px 6px;
  border: 1px solid #000;
  font-size: 8px;
  line-height: 1.3;
  text-align: justify;
  color: var(--ink) !important;
  background: #fff !important;
}
.mx-receipt-signs {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  margin-top: 0;
}
.mx-receipt-signs > tbody > tr > td {
  border: 1px solid #000;
  padding: 4px 5px;
  vertical-align: top;
  width: 33.33%;
  height: 108px;
  background: #fff !important;
  color: var(--ink) !important;
}
.mx-receipt-signs h4 {
  margin: 0 0 4px;
  font-size: 8.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  text-align: center;
  color: var(--ink) !important;
}
.mx-receipt-ack {
  margin: 0 0 3px;
  font-size: 6.8px;
  line-height: 1.2;
  text-align: justify;
  color: var(--ink) !important;
}
.mx-receipt-sig-line {
  border-bottom: 1px solid #000;
  height: 22px;
  margin: 2px 0 5px;
}
.mx-receipt-sign-row {
  display: grid;
  grid-template-columns: 58px 1fr;
  gap: 2px;
  margin-bottom: 2px;
  font-size: 8px;
  min-height: 11px;
}
.mx-receipt-sign-row .k { font-weight: 700; }
.mx-receipt-stamp {
  margin: 4px auto 6px;
  width: 92%;
  height: 38px;
  border: 1.5px dashed #555;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #444 !important;
}
.mx-receipt-note {
  margin: 4px 0 0;
  font-size: 8.5px;
  font-weight: 600;
  color: var(--ink) !important;
  background: transparent !important;
  border: none;
  padding: 0;
  flex-shrink: 0;
}
.mx-receipt-footer {
  margin-top: auto;
  padding-top: 4px;
  flex-shrink: 0;
}
.mx-receipt-footer-rule {
  border-top: 1px solid #000;
  padding-top: 4px;
}
.mx-receipt-contacts {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  font-size: 7.5px;
  color: var(--ink) !important;
}
.mx-receipt-contact {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  white-space: nowrap;
}
.mx-receipt-contact .ico {
  width: 11px;
  text-align: center;
  flex-shrink: 0;
  font-size: 8px;
}
.mx-receipt-sep {
  color: #666;
  user-select: none;
  flex-shrink: 0;
}
@media print {
  @page { size: A4 portrait; margin: 0; }
  html, body {
    width: 210mm;
    height: 297mm;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
  }
  .mx-receipt {
    width: 210mm !important;
    height: 297mm !important;
    max-height: 297mm !important;
    margin: 0 !important;
    padding: 7mm 9mm 5mm !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    box-shadow: none !important;
  }
}
`.trim();
