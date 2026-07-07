import { useEffect, useId, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

export type EditFieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'number'
  | 'date'
  | 'select'
  | 'textarea'
  | 'heading';

export interface EditFieldConfig {
  key: string;
  label: string;
  type?: EditFieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  rows?: number;
  fullWidth?: boolean;
}

export interface EditRecordModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  fields: EditFieldConfig[];
  values: Record<string, string>;
  onSave: (values: Record<string, string>) => Promise<void> | void;
  saving?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  saveLabel?: string;
}

export function EditRecordModal({
  open,
  onClose,
  title,
  description,
  fields,
  values,
  onSave,
  saving = false,
  size = 'lg',
  saveLabel = 'Save changes',
}: EditRecordModalProps) {
  const formId = useId();
  const [form, setForm] = useState(values);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm(values);
      setErrors({});
    }
  }, [open, values]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    for (const field of fields) {
      if (field.type === 'heading') continue;
      if (field.required && !form[field.key]?.trim()) {
        nextErrors[field.key] = `${field.label} is required`;
      }
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    await onSave(form);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size={size}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            {saveLabel}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const value = form[field.key] ?? '';
          const error = errors[field.key];
          const onChange = (v: string) => setForm((prev) => ({ ...prev, [field.key]: v }));
          const spanClass = field.fullWidth || field.type === 'textarea' || field.type === 'heading'
            ? 'sm:col-span-2'
            : '';

          if (field.type === 'heading') {
            return (
              <p
                key={field.key}
                className={`text-sm font-semibold text-[var(--text-primary)] ${spanClass}`}
              >
                {field.label}
              </p>
            );
          }

          if (field.type === 'select' && field.options) {
            return (
              <div key={field.key} className={spanClass}>
                <Select
                  label={field.label}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  options={field.options}
                  error={error}
                />
              </div>
            );
          }

          if (field.type === 'textarea') {
            return (
              <div key={field.key} className={spanClass}>
                <Textarea
                  label={field.label}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  rows={field.rows ?? 3}
                  error={error}
                  placeholder={field.placeholder}
                />
              </div>
            );
          }

          return (
            <div key={field.key} className={spanClass}>
              <Input
                label={field.label}
                type={field.type ?? 'text'}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={field.required}
                error={error}
                placeholder={field.placeholder}
              />
            </div>
          );
        })}
      </form>
    </Modal>
  );
}
