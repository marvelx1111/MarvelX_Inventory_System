/** Convert a whole PKR amount into English words (lac/crore style for Pakistan). */
export function amountToWordsPKR(amount: number): string {
  const n = Math.round(Math.abs(amount));
  if (n === 0) return 'Zero rupees only';

  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const twoDigits = (num: number): string => {
    if (num < 20) return ones[num];
    const t = Math.floor(num / 10);
    const o = num % 10;
    return `${tens[t]}${o ? ` ${ones[o]}` : ''}`.trim();
  };

  const threeDigits = (num: number): string => {
    const h = Math.floor(num / 100);
    const rest = num % 100;
    if (h && rest) return `${ones[h]} Hundred ${twoDigits(rest)}`;
    if (h) return `${ones[h]} Hundred`;
    return twoDigits(rest);
  };

  const crore = Math.floor(n / 10_000_000);
  const lac = Math.floor((n % 10_000_000) / 100_000);
  const thousand = Math.floor((n % 100_000) / 1000);
  const rem = n % 1000;

  const parts: string[] = [];
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lac) parts.push(`${twoDigits(lac)} Lac`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (rem) parts.push(threeDigits(rem));

  return `${parts.join(' ')} only`;
}

export function cnicDigits(cnic: string): string[] {
  const digits = cnic.replace(/\D/g, '').slice(0, 13).split('');
  while (digits.length < 13) digits.push('');
  return digits;
}
