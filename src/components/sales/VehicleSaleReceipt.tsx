import type { ReactNode } from 'react';
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

function MetaRow({ label, value }: { label: string; value?: string }) {
  return (
    <tr>
      <td>{label}</td>
      <td>:</td>
      <td>{value || ''}</td>
    </tr>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <tr>
      <td className="lbl-wide">{label}</td>
      <td className="val-wide">{value || ''}</td>
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
      <td className="lbl">{leftLabel}</td>
      <td className="val">{leftValue || ''}</td>
      <td className="lbl">{rightLabel}</td>
      <td className="val">{rightValue || ''}</td>
    </tr>
  );
}

function SignBlock({
  title,
  name,
  cnic,
  children,
}: {
  title: string;
  name?: string;
  cnic?: string;
  children?: ReactNode;
}) {
  return (
    <td>
      <h4>{title}</h4>
      {children}
      {!children && <div className="mx-receipt-sig-line" />}
      {name !== undefined && (
        <div className="mx-receipt-sign-row">
          <span className="k">Name:</span>
          <span>{name || ''}</span>
        </div>
      )}
      {cnic !== undefined && (
        <div className="mx-receipt-sign-row">
          <span className="k">CNIC:</span>
          <span>{cnic || ''}</span>
        </div>
      )}
      <div className="mx-receipt-sign-row" style={{ marginTop: 6 }}>
        <span className="k">Witness Name:</span>
        <span />
      </div>
      <div className="mx-receipt-sign-row">
        <span className="k">CNIC:</span>
        <span />
      </div>
    </td>
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
    (!Number.isNaN(saleDate.getTime())
      ? new Date().toLocaleTimeString('en-PK', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      : '');

  const modelLabel = [vehicle.model, vehicle.variant].filter(Boolean).join(' ');
  const paymentLabel = paymentMethod ? formatPaymentMethod(paymentMethod) : '';
  const amountCell = paymentLabel
    ? `${formatPKR(received)} ${paymentLabel}`
    : formatPKR(received);

  return (
    <article className="mx-receipt sale-receipt-sheet">
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
            <MetaRow label="Receipt No." value={receiptNo} />
            <MetaRow label="Date" value={formatDate(date)} />
            <MetaRow label="Day" value={dayName} />
            <MetaRow label="Time" value={timeLabel} />
          </tbody>
        </table>
      </div>

      <section className="mx-receipt-section">
        <h2 className="mx-receipt-section-title">1. Seller Details</h2>
        <table className="mx-receipt-table">
          <tbody>
            <DetailRow label="Name" value={seller?.full_name} />
            <DetailRow label="S/O" value={personSo(seller)} />
            <DetailRow label="Phone" value={seller?.mobile} />
            <DetailRow label="CNIC" value={seller?.cnic ? formatCNIC(seller.cnic) : ''} />
            <DetailRow label="Address" value={personAddress(seller)} />
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
              leftValue=""
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
            <DetailRow label="Name" value={buyer?.full_name} />
            <DetailRow label="S/O" value={personSo(buyer)} />
            <DetailRow label="Phone" value={buyer?.mobile} />
            <DetailRow label="CNIC" value={buyer?.cnic ? formatCNIC(buyer.cnic) : ''} />
            <DetailRow label="Address" value={personAddress(buyer)} />
          </tbody>
        </table>
      </section>

      <section className="mx-receipt-section">
        <h2 className="mx-receipt-section-title">4. Payment Details</h2>
        <table className="mx-receipt-table">
          <tbody>
            <DetailRow label="Amount" value={amountCell} />
            <DetailRow label="Amount in Words" value={amountToWordsPKR(received)} />
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
          buyer from any previous legal issues.
        </div>
      </section>

      <section className="mx-receipt-section" aria-label="Signatures">
        <h2 className="mx-receipt-section-title">6. Signatures</h2>
        <table className="mx-receipt-signs">
          <tbody>
            <tr>
              <SignBlock
                title="Seller"
                name={seller?.full_name}
                cnic={seller?.cnic ? formatCNIC(seller.cnic) : ''}
              />
              <td>
                <h4>Buyer Acknowledgment (With Showroom)</h4>
                <p className="mx-receipt-ack">
                  I confirm that I have inspected the vehicle and received the original documents.
                  The vehicle is purchased on an &lsquo;as-is, where-is&rsquo; basis. No claims,
                  complaints, or warranties will be accepted after the date of purchase.
                </p>
                <div className="mx-receipt-stamp">Showroom Stamp</div>
                <div className="mx-receipt-sign-row">
                  <span className="k">Witness Name:</span>
                  <span />
                </div>
                <div className="mx-receipt-sign-row">
                  <span className="k">CNIC:</span>
                  <span />
                </div>
              </td>
              <SignBlock
                title="Buyer"
                name={buyer?.full_name}
                cnic={buyer?.cnic ? formatCNIC(buyer.cnic) : ''}
              />
            </tr>
          </tbody>
        </table>
      </section>

      <p className="mx-receipt-note">
        <strong>7. Important Note:</strong> It is the responsibility of the buyer to transfer the
        ownership of the above vehicle within 15 days from the date of purchase.
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
            <span className="mx-receipt-sep">|</span>
            <span className="mx-receipt-contact">
              <span className="ico" aria-hidden="true">
                ◎
              </span>
              www.marvelx.com.pk
            </span>
            <span className="mx-receipt-sep">|</span>
            <span className="mx-receipt-contact">
              <span className="ico" aria-hidden="true">
                ✉
              </span>
              marvelxpk@gmail.com
            </span>
            <span className="mx-receipt-sep">|</span>
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
