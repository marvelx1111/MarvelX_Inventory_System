/** Fully self-contained receipt styles — printed PDF must not depend on Tailwind. */
export const RECEIPT_SHEET_CSS = `
.mx-receipt, .mx-receipt * { box-sizing: border-box; }
.mx-receipt {
  width: 210mm;
  max-width: 100%;
  min-height: 297mm;
  margin: 0 auto;
  padding: 10mm 12mm 0;
  background: #fff !important;
  color: #111 !important;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 10px;
  line-height: 1.35;
  display: flex;
  flex-direction: column;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
.mx-receipt-letterhead {
  text-align: center;
  padding-bottom: 6px;
  border-bottom: 2px solid #000;
}
.mx-receipt-brand {
  display: inline-flex;
  align-items: baseline;
  gap: 0;
  letter-spacing: -0.5px;
}
.mx-receipt-brand-marvel {
  font-size: 36px;
  font-weight: 800;
  font-style: italic;
  color: #222 !important;
  line-height: 1;
  font-family: Arial Black, Arial, Helvetica, sans-serif;
}
.mx-receipt-brand-x {
  display: inline-block;
  font-size: 44px;
  font-weight: 900;
  font-style: italic;
  color: #e10600 !important;
  line-height: 0.85;
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
  margin-top: 8px;
  margin-bottom: 6px;
}
.mx-receipt-doc-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: #111 !important;
}
.mx-receipt-meta {
  width: 210px;
  flex-shrink: 0;
  border-collapse: collapse;
  font-size: 10px;
}
.mx-receipt-meta td {
  border: 1px solid #000;
  padding: 3px 6px;
  vertical-align: middle;
}
.mx-receipt-meta td:first-child {
  width: 78px;
  font-weight: 700;
  white-space: nowrap;
  background: #fff;
}
.mx-receipt-section {
  margin-top: 7px;
}
.mx-receipt-section-title {
  margin: 0 0 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #111 !important;
}
.mx-receipt-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.mx-receipt-table th,
.mx-receipt-table td {
  border: 1px solid #000;
  padding: 4px 6px;
  vertical-align: top;
  font-size: 10px;
  color: #111 !important;
  background: #fff !important;
}
.mx-receipt-table .lbl {
  width: 28%;
  font-weight: 700;
  white-space: nowrap;
}
.mx-receipt-table .lbl-narrow {
  width: 22%;
  font-weight: 700;
  white-space: nowrap;
}
.mx-receipt-legal {
  margin-top: 7px;
  padding: 6px 7px;
  border: 1px solid #000;
  font-size: 9px;
  text-align: justify;
  color: #111 !important;
  background: #fff !important;
}
.mx-receipt-signs {
  display: grid;
  grid-template-columns: 1fr 1.15fr 1fr;
  gap: 0;
  margin-top: 7px;
  border: 1px solid #000;
}
.mx-receipt-sign-col {
  padding: 6px 7px;
  min-height: 150px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #000;
}
.mx-receipt-sign-col:last-child { border-right: 0; }
.mx-receipt-sign-col h4 {
  margin: 0 0 8px;
  font-size: 9.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  text-align: center;
  color: #111 !important;
}
.mx-receipt-sig-line {
  border-bottom: 1px solid #000;
  min-height: 28px;
  margin-bottom: 6px;
}
.mx-receipt-sign-row {
  display: grid;
  grid-template-columns: 52px 1fr;
  gap: 4px;
  margin-bottom: 3px;
  font-size: 9px;
}
.mx-receipt-sign-row .k { font-weight: 700; }
.mx-receipt-stamp {
  margin: 8px auto;
  width: 88%;
  height: 56px;
  border: 1.5px dashed #444;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #444 !important;
}
.mx-receipt-note {
  margin-top: 7px;
  font-size: 9.5px;
  font-weight: 600;
  border: 1px solid #000;
  padding: 5px 7px;
  color: #111 !important;
  background: #fff !important;
}
.mx-receipt-footer {
  margin-top: auto;
  padding-top: 8px;
}
.mx-receipt-footer-rule {
  border-top: 1.5px solid #000;
  padding-top: 7px;
  padding-bottom: 10px;
}
.mx-receipt-contacts {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px 10px;
  font-size: 9px;
  color: #111 !important;
}
.mx-receipt-contact {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}
.mx-receipt-contact .ico {
  width: 14px;
  text-align: center;
  flex-shrink: 0;
}
.mx-receipt-sep {
  color: #999;
  user-select: none;
}
@media print {
  .mx-receipt {
    width: 100% !important;
    min-height: auto !important;
    padding: 0 !important;
    box-shadow: none !important;
  }
}
`.trim();
