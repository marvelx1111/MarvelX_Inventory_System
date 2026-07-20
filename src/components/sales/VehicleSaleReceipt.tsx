import type { Customer, PaymentMethod, Vehicle, VehicleDocument } from '@/types';
import { formatPaymentMethod } from '@/utils/constants';
import { formatDate, formatPKR } from '@/utils/format';
import { amountToWordsPKR, cnicDigits } from '@/utils/number-words';

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
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="grid grid-cols-[auto_1fr] items-end gap-x-1.5 gap-y-0.5">
      <span className="whitespace-nowrap text-[9.5px] text-zinc-500">{label}</span>
      <span className="min-h-[14px] border-b border-black px-0.5 pb-px text-[10.5px] font-semibold text-zinc-900">
        {value || '—'}
      </span>
    </div>
  );
}

function CnicBoxes({ cnic }: { cnic: string }) {
  const digits = cnicDigits(cnic);
  return (
    <div className="flex items-center gap-[3px]">
      {digits.slice(0, 5).map((d, i) => (
        <span
          key={`a${i}`}
          className="flex h-[15px] w-3 items-center justify-center border border-black text-[9px] font-bold"
        >
          {d}
        </span>
      ))}
      <span className="mb-0.5 w-2 border-b border-black" />
      {digits.slice(5, 12).map((d, i) => (
        <span
          key={`b${i}`}
          className="flex h-[15px] w-3 items-center justify-center border border-black text-[9px] font-bold"
        >
          {d}
        </span>
      ))}
      <span className="mb-0.5 w-2 border-b border-black" />
      <span className="flex h-[15px] w-3 items-center justify-center border border-black text-[9px] font-bold">
        {digits[12]}
      </span>
    </div>
  );
}

function PersonBlock({
  title,
  person,
}: {
  title: string;
  person?: Customer | null;
}) {
  return (
    <section>
      <h3 className="mb-1.5 border-b border-black pb-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-900">
        {title}
      </h3>
      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Full name" value={person?.full_name} />
        <Field label="Phone" value={person?.mobile} />
        <div className="grid gap-0.5 sm:col-span-2">
          <span className="text-[9.5px] text-zinc-500">CNIC</span>
          <CnicBoxes cnic={person?.cnic ?? ''} />
        </div>
        <div className="sm:col-span-2">
          <Field
            label="Permanent address"
            value={[person?.address, person?.city].filter(Boolean).join(', ')}
          />
        </div>
      </div>
    </section>
  );
}

export function VehicleSaleReceipt({
  receiptNo,
  date,
  vehicle,
  buyer,
  seller,
  document,
  authorizedName = 'Marvel X',
  amountReceived = 0,
  salePrice,
  balance,
  paymentMethod,
}: VehicleSaleReceiptProps) {
  const received = amountReceived;
  const price = salePrice ?? received;
  const remaining = balance ?? Math.max(0, price - received);
  const saleDate = new Date(date);
  const dayName = Number.isNaN(saleDate.getTime())
    ? '—'
    : saleDate.toLocaleDateString('en-PK', { weekday: 'long' });

  const vehicleTitle = [vehicle.make, vehicle.model, vehicle.variant].filter(Boolean).join(' ');
  const paymentLabel = paymentMethod ? formatPaymentMethod(paymentMethod) : '';

  return (
    <article className="sale-receipt-sheet mx-auto flex min-h-[297mm] w-[210mm] max-w-full flex-col bg-white px-8 pb-0 pt-6 text-[10.5px] leading-snug text-zinc-900 print:px-0 print:pt-0">
      <header
        className="mx-receipt-letterhead border-b-[2.5px] border-black pb-2 text-center"
        style={{
          textAlign: 'center',
          paddingBottom: 8,
          borderBottom: '2.5px solid #000',
        }}
      >
        <div
          className="mx-brand"
          aria-label="Marvel X"
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 1,
            letterSpacing: '-0.5px',
          }}
        >
          <span
            className="mx-brand-marvel"
            style={{
              fontSize: 34,
              fontWeight: 800,
              fontStyle: 'italic',
              color: '#4b5563',
              lineHeight: 1,
              fontFamily: 'Arial Black, Arial, Helvetica, sans-serif',
            }}
          >
            MARVEL
          </span>
          <span
            className="mx-brand-x"
            style={{
              display: 'inline-block',
              fontSize: 42,
              fontWeight: 900,
              fontStyle: 'italic',
              color: '#e10600',
              lineHeight: 0.85,
              transform: 'skewX(-8deg)',
              fontFamily: 'Arial Black, Arial, Helvetica, sans-serif',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
            }}
          >
            X
          </span>
        </div>
      </header>

      <div className="mt-2.5 mb-2 flex items-end justify-between gap-3">
        <h1 className="m-0 text-[15px] font-bold uppercase tracking-wide">
          Vehicle Sale &amp; Purchase Receipt
        </h1>
        <div className="grid min-w-[210px] grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-[10px]">
          <span className="text-zinc-500">Receipt No.</span>
          <span className="border-b border-black font-semibold">{receiptNo}</span>
          <span className="text-zinc-500">Date</span>
          <span className="border-b border-black font-semibold">{formatDate(date)}</span>
          <span className="text-zinc-500">Day</span>
          <span className="border-b border-black font-semibold">{dayName}</span>
          <span className="text-zinc-500">Stock No.</span>
          <span className="border-b border-black font-semibold">{vehicle.stock_number}</span>
        </div>
      </div>

      <div className="mt-2 space-y-2.5">
        <PersonBlock title="1. Seller details" person={seller} />

        <section>
          <h3 className="mb-1.5 border-b border-black pb-0.5 text-[10px] font-bold uppercase tracking-wider">
            2. Vehicle details
          </h3>
          <div className="grid gap-1.5 sm:grid-cols-3">
            <Field label="Registration No." value={vehicle.registration_number} />
            <Field label="Chassis No." value={vehicle.chassis_number} />
            <Field label="Engine No." value={vehicle.engine_number} />
            <Field label="Make / Model" value={vehicleTitle} />
            <Field label="Model year" value={String(vehicle.model_year || '')} />
            <Field label="Color" value={vehicle.color} />
            <Field label="Registration city" value={vehicle.registration_city} />
            <Field
              label="Fuel / Transmission"
              value={[vehicle.fuel_type, vehicle.transmission].filter(Boolean).join(' / ')}
            />
            <Field
              label="Mileage"
              value={vehicle.mileage ? `${vehicle.mileage.toLocaleString('en-PK')} km` : ''}
            />
          </div>
          <div className="mt-1.5 grid gap-1.5 sm:grid-cols-4">
            <Field label="Original registration book" value={document?.registration_book ? 'Yes' : 'No'} />
            <Field label="Original file" value={document?.original_file ? 'Yes' : 'No'} />
            <Field label="Tax token" value={document?.tax_token ? 'Yes' : 'No'} />
            <Field label="Insurance" value={document?.insurance ? 'Yes' : 'No'} />
          </div>
        </section>

        <PersonBlock title="3. Buyer details" person={buyer} />

        <section>
          <h3 className="mb-1.5 border-b border-black pb-0.5 text-[10px] font-bold uppercase tracking-wider">
            4. Payment
          </h3>
          <div className="grid gap-1.5 sm:grid-cols-2">
            <Field
              label="Amount received (cash / cheque advance)"
              value={
                paymentLabel
                  ? `${formatPKR(received)} (${paymentLabel})`
                  : formatPKR(received)
              }
            />
            <Field label="Amount in words" value={amountToWordsPKR(received)} />
            <Field label="Sale / purchase price" value={formatPKR(price)} />
            <Field label="Balance remaining" value={formatPKR(remaining)} />
          </div>
        </section>

        <div className="border border-black p-2 text-justify text-[9.5px]">
          <strong>Seller&apos;s declaration:</strong> I confirm that I have sold the above vehicle with
          complete documents. As of this date, the vehicle is free from theft claims, unpaid
          installments, court cases, and other legal disputes. If any such issue arises relating to
          the period before this sale, the <strong>seller</strong> shall be solely responsible —{' '}
          <strong>not Marvel X showroom</strong>. I sign this receipt of my own free will, in full
          consciousness, and in the presence of witnesses.
        </div>

        <section className="grid gap-2 sm:grid-cols-3" aria-label="Signatures">
          <div className="flex min-h-[160px] flex-col border border-black p-2">
            <h4 className="mb-1.5 border-b border-zinc-300 pb-1 text-center text-[9.5px] font-bold uppercase tracking-wide">
              Seller
            </h4>
            <div className="space-y-1.5">
              <Field label="Signature" value="" />
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <span className="text-[9.5px] text-zinc-500">Thumb</span>
                  <div className="mt-0.5 flex h-9 items-center justify-center border border-dashed border-zinc-500 text-[8.5px] text-zinc-500">
                    Thumb
                  </div>
                </div>
                <div>
                  <span className="text-[9.5px] text-zinc-500">Stamp</span>
                  <div className="mt-0.5 flex h-9 items-center justify-center border border-dashed border-zinc-500 text-[8.5px] text-zinc-500">
                    Ticket
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-auto border-t border-zinc-300 pt-1.5">
              <p className="mb-1 text-[8.5px] font-bold uppercase tracking-wide">Witness (seller)</p>
              <Field label="Name" value="" />
              <Field label="Phone" value="" />
              <Field label="Signature" value="" />
            </div>
          </div>

          <div className="flex min-h-[160px] flex-col border border-black p-2">
            <h4 className="mb-1.5 border-b border-zinc-300 pb-1 text-center text-[9.5px] font-bold uppercase tracking-wide">
              Buyer acknowledgment
            </h4>
            <p className="mb-1.5 flex-1 text-justify text-[8.8px]">
              I confirm that I have inspected the vehicle, received the original documents (file,
              registration book, and transfer papers), and am satisfied with their condition. From
              this point forward, responsibility for the vehicle is mine. The vehicle has been
              purchased on an &lsquo;as-is, where-is&rsquo; basis. The buyer has inspected and
              accepted the vehicle in its current condition. No claims, complaints, or warranties of
              any kind will be accepted after the date of purchase.
            </p>
            <Field label="Buyer signature" value="" />
            <div className="mt-1.5">
              <Field label="Authorized signature" value={authorizedName} />
            </div>
            <div className="mt-auto flex h-10 items-end justify-center border-[1.5px] border-black pb-1 text-[9px] font-bold uppercase tracking-wide">
              Showroom
            </div>
          </div>

          <div className="flex min-h-[160px] flex-col border border-black p-2">
            <h4 className="mb-1.5 border-b border-zinc-300 pb-1 text-center text-[9.5px] font-bold uppercase tracking-wide">
              Buyer
            </h4>
            <div className="space-y-1.5">
              <Field label="Signature" value="" />
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <span className="text-[9.5px] text-zinc-500">Thumb</span>
                  <div className="mt-0.5 flex h-9 items-center justify-center border border-dashed border-zinc-500 text-[8.5px] text-zinc-500">
                    Thumb
                  </div>
                </div>
                <div>
                  <span className="text-[9.5px] text-zinc-500">Stamp</span>
                  <div className="mt-0.5 flex h-9 items-center justify-center border border-dashed border-zinc-500 text-[8.5px] text-zinc-500">
                    Ticket
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-auto border-t border-zinc-300 pt-1.5">
              <p className="mb-1 text-[8.5px] font-bold uppercase tracking-wide">Witness (buyer)</p>
              <Field label="Name" value="" />
              <Field label="Phone" value="" />
              <Field label="Signature" value="" />
            </div>
          </div>
        </section>

        <p className="border border-black bg-zinc-50 px-2 py-1.5 text-[9.5px] font-semibold">
          Note: The buyer must transfer the vehicle into their own name within{' '}
          <strong>15 days</strong>. After that, the showroom will not be responsible.
        </p>
      </div>

      <footer className="mt-auto pt-2">
        <div className="border-t-2 border-black pt-2">
          <div className="grid gap-2 pb-2.5 sm:grid-cols-3">
            <div className="flex gap-1.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-500 text-[10px] text-white">
                ☎
              </span>
              <div>
                <strong className="block text-[9px]">Call to find out more</strong>
                <span className="block text-[9px]">+92 307 7766300</span>
              </div>
            </div>
            <div className="flex gap-1.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-500 text-[10px] text-white">
                ◎
              </span>
              <div>
                <strong className="block text-[9px]">More info</strong>
                <span className="block text-[9px]">www.marvelx.com.pk</span>
                <span className="block text-[9px]">marvelxpk@gmail.com</span>
              </div>
            </div>
            <div className="flex gap-1.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-500 text-[10px] text-white">
                📍
              </span>
              <div>
                <strong className="block text-[9px]">Address</strong>
                <span className="block text-[9px]">435/G-4 Block, Johar Town, Lahore.</span>
              </div>
            </div>
          </div>
        </div>
        <div
          className="mx-receipt-redbar mx-[-2rem] h-2.5 print:mx-0"
          style={{ backgroundColor: '#e10600', height: '10px' }}
          aria-hidden="true"
        />
      </footer>
    </article>
  );
}
