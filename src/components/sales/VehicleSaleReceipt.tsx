import type { Customer, PaymentMethod, Vehicle, VehicleDocument } from '@/types';
import { formatPaymentMethod } from '@/utils/constants';
import { formatCNIC, formatDate, formatPKR } from '@/utils/format';
import { amountToWordsPKR } from '@/utils/number-words';
import { RECEIPT_SHEET_CSS } from '@/components/sales/receiptSheetCss';

export interface VehicleSaleReceiptProps {
  receiptNo: string;
  date: string;
  vehicle: Vehicle;
  buyer?: Customer | null;
  seller?: Customer | null;
  document?: VehicleDocument | null;
  authorizedName?: string;
  amountReceived?: number;
  salePrice?: number;
  balance?: number;
  paymentMethod?: PaymentMethod | null;
  /** Optional father/husband name if stored in remarks as "S/O: …" */
  time?: string;
}

function yesNo(value?: boolean | null): string {
  if (value == null) return '';
  return value ? 'Yes' : 'No';
}

function personSo(person?: Customer | null): string {
  if (!person?.remarks) return '';
  const match = person.remarks.match(/(?:s\/o|d\/o|w\/o|son of|daughter of)\s*[:\-]?\s*(.+)/i);
  return match?.[1]?.trim() ?? '';
}

function personAddress(person?: Customer | null): string {
  if (!person) return '';
  return [person.address, person.city].filter(Boolean).join(', ');
}

function Row({ label, value, labelClass = 'lbl' }: { label: string; value?: string; labelClass?: string }) {
  return (
    <tr>
      <td className={labelClass}>{label}</td>
      <td>{value || ''}</td>
    </tr>
  );
}

function PairRow({
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
}: {
  leftLabel: string;
  leftValue?: string;
  rightLabel: string;
  rightValue?: string;
}) {
  return (
    <tr>
      <td className="lbl-narrow">{leftLabel}</td>
      <td>{leftValue || ''}</td>
      <td className="lbl-narrow">{rightLabel}</td>
      <td>{rightValue || ''}</td>
    </tr>
  );
}

export function VehicleSaleReceipt({
  receiptNo,
  date,
  vehicle,
  buyer,
  seller,
  document,
  amountReceived = 0,
  paymentMethod,
  time,
}: VehicleSaleReceiptProps) {
  const received = amountReceived;
  const saleDate = new Date(date.includes('T') ? date : `${date}T12:00:00`);
  const dayName = Number.isNaN(saleDate.getTime())
    ? ''
    : saleDate.toLocaleDateString('en-PK', { weekday: 'long' });
  const timeLabel =
    time ||
    (Number.isNaN(saleDate.getTime())
      ? ''
      : saleDate.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true }));

  const modelLabel = [vehicle.model, vehicle.variant].filter(Boolean).join(' ');
  const paymentLabel = paymentMethod ? formatPaymentMethod(paymentMethod) : '';
  const amountCell = paymentLabel
    ? `${formatPKR(received)} ${paymentLabel}`
    : formatPKR(received);

  return (
    <article className="mx-receipt sale-receipt-sheet">
      {/* Embedded styles travel with the HTML clone into the print iframe */}
      <style dangerouslySetInnerHTML={{ __html: RECEIPT_SHEET_CSS }} />

      <header className="mx-receipt-letterhead">
        <div className="mx-receipt-brand" aria-label="Marvel X">
          <span className="mx-receipt-brand-marvel">MARVEL</span>
          <span className="mx-receipt-brand-x">X</span>
        </div>
      </header>

      <div className="mx-receipt-title-row">
        <h1 className="mx-receipt-doc-title">Vehicle Sale &amp; Purchase Receipt</h1>
        <table className="mx-receipt-meta">
          <tbody>
            <tr>
              <td>Receipt No.</td>
              <td>{receiptNo}</td>
            </tr>
            <tr>
              <td>Date</td>
              <td>{formatDate(date)}</td>
            </tr>
            <tr>
              <td>Day</td>
              <td>{dayName}</td>
            </tr>
            <tr>
              <td>Time</td>
              <td>{timeLabel}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <section className="mx-receipt-section">
        <h2 className="mx-receipt-section-title">1. Seller Details</h2>
        <table className="mx-receipt-table">
          <tbody>
            <Row label="Name" value={seller?.full_name} />
            <Row label="S/O" value={personSo(seller)} />
            <Row label="Phone" value={seller?.mobile} />
            <Row label="CNIC" value={seller?.cnic ? formatCNIC(seller.cnic) : ''} />
            <Row label="Address" value={personAddress(seller)} />
          </tbody>
        </table>
      </section>

      <section className="mx-receipt-section">
        <h2 className="mx-receipt-section-title">2. Vehicle Details</h2>
        <table className="mx-receipt-table">
          <tbody>
            <PairRow
              leftLabel="Registration No."
              leftValue={vehicle.registration_number}
              rightLabel="Chassis No."
              rightValue={vehicle.chassis_number}
            />
            <PairRow
              leftLabel="Engine No."
              leftValue={vehicle.engine_number}
              rightLabel="Make"
              rightValue={vehicle.make}
            />
            <PairRow
              leftLabel="Model"
              leftValue={modelLabel}
              rightLabel="Engine Capacity"
              rightValue=""
            />
            <PairRow
              leftLabel="Color"
              leftValue={vehicle.color}
              rightLabel="Quota"
              rightValue={vehicle.registration_city}
            />
            <PairRow
              leftLabel="Post Office"
              leftValue={vehicle.registration_city}
              rightLabel="Original Book"
              rightValue={yesNo(document?.registration_book)}
            />
            <PairRow
              leftLabel="Original File"
              leftValue={yesNo(document?.original_file)}
              rightLabel="File Pages"
              rightValue=""
            />
            <PairRow
              leftLabel="Computerized Plate"
              leftValue=""
              rightLabel="Stock No."
              rightValue={vehicle.stock_number}
            />
          </tbody>
        </table>
      </section>

      <section className="mx-receipt-section">
        <h2 className="mx-receipt-section-title">3. Buyer Details</h2>
        <table className="mx-receipt-table">
          <tbody>
            <Row label="Name" value={buyer?.full_name} />
            <Row label="S/O" value={personSo(buyer)} />
            <Row label="Phone" value={buyer?.mobile} />
            <Row label="CNIC" value={buyer?.cnic ? formatCNIC(buyer.cnic) : ''} />
            <Row label="Address" value={personAddress(buyer)} />
          </tbody>
        </table>
      </section>

      <section className="mx-receipt-section">
        <h2 className="mx-receipt-section-title">4. Payment Details</h2>
        <table className="mx-receipt-table">
          <tbody>
            <Row label="Amount" value={amountCell} />
            <Row label="Amount in Words" value={amountToWordsPKR(received)} />
          </tbody>
        </table>
      </section>

      <section className="mx-receipt-section">
        <h2 className="mx-receipt-section-title">5. Seller Declaration</h2>
        <div className="mx-receipt-legal">
          I, the undersigned seller, declare that I am the true and lawful owner of the
          above-mentioned vehicle. All information provided is correct to the best of my knowledge. I
          have received the full and final payment as mentioned above. I further declare that the
          vehicle is free from any legal claims, bank loans, or police reports, and I indemnify the
          buyer from any previous legal issues. The vehicle is sold on an &lsquo;as-is,
          where-is&rsquo; basis. No claims, complaints, or warranties of any kind will be accepted
          after the date of purchase. Marvel X showroom is not responsible for any dispute relating
          to the period before this transaction.
        </div>
      </section>

      <section className="mx-receipt-section" aria-label="Signatures">
        <h2 className="mx-receipt-section-title">6. Signatures</h2>
        <div className="mx-receipt-signs">
          <div className="mx-receipt-sign-col">
            <h4>Seller</h4>
            <div className="mx-receipt-sig-line" />
            <div className="mx-receipt-sign-row">
              <span className="k">Name:</span>
              <span>{seller?.full_name || ''}</span>
            </div>
            <div className="mx-receipt-sign-row">
              <span className="k">CNIC:</span>
              <span>{seller?.cnic ? formatCNIC(seller.cnic) : ''}</span>
            </div>
            <div className="mx-receipt-sign-row" style={{ marginTop: 10 }}>
              <span className="k">Witness:</span>
              <span />
            </div>
            <div className="mx-receipt-sign-row">
              <span className="k">CNIC:</span>
              <span />
            </div>
          </div>

          <div className="mx-receipt-sign-col">
            <h4>Buyer Acknowledgment (With Showroom)</h4>
            <div className="mx-receipt-stamp">Showroom Stamp</div>
            <div className="mx-receipt-sign-row" style={{ marginTop: 'auto' }}>
              <span className="k">Witness:</span>
              <span />
            </div>
            <div className="mx-receipt-sign-row">
              <span className="k">CNIC:</span>
              <span />
            </div>
          </div>

          <div className="mx-receipt-sign-col">
            <h4>Buyer</h4>
            <div className="mx-receipt-sig-line" />
            <div className="mx-receipt-sign-row">
              <span className="k">Name:</span>
              <span>{buyer?.full_name || ''}</span>
            </div>
            <div className="mx-receipt-sign-row">
              <span className="k">CNIC:</span>
              <span>{buyer?.cnic ? formatCNIC(buyer.cnic) : ''}</span>
            </div>
            <div className="mx-receipt-sign-row" style={{ marginTop: 10 }}>
              <span className="k">Witness:</span>
              <span />
            </div>
            <div className="mx-receipt-sign-row">
              <span className="k">CNIC:</span>
              <span />
            </div>
          </div>
        </div>
      </section>

      <p className="mx-receipt-note">
        <strong>7. Important Note:</strong> It is the responsibility of the buyer to transfer the
        ownership of the above vehicle within <strong>15 days</strong> from the date of purchase.
      </p>

      <footer className="mx-receipt-footer">
        <div className="mx-receipt-footer-rule">
          <div className="mx-receipt-contacts">
            <span className="mx-receipt-contact">
              <span className="ico" aria-hidden="true">
                ☎
              </span>
              +92 307 7766300
            </span>
            <span className="mx-receipt-sep" aria-hidden="true">
              |
            </span>
            <span className="mx-receipt-contact">
              <span className="ico" aria-hidden="true">
                ◎
              </span>
              www.marvelx.com.pk
            </span>
            <span className="mx-receipt-sep" aria-hidden="true">
              |
            </span>
            <span className="mx-receipt-contact">
              <span className="ico" aria-hidden="true">
                ✉
              </span>
              marvelxpk@gmail.com
            </span>
            <span className="mx-receipt-sep" aria-hidden="true">
              |
            </span>
            <span className="mx-receipt-contact">
              <span className="ico" aria-hidden="true">
                📍
              </span>
              435/G-4 Block Johar Town Lahore
            </span>
          </div>
        </div>
      </footer>
    </article>
  );
}
