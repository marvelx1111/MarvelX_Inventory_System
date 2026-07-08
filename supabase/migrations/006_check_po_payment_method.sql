-- Add Check/PO as a payment method (replaces Cheque in the UI).
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'check_po';
