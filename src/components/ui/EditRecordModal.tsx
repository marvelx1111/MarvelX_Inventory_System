import { useEffect, useId, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

export type EditFieldType = 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'textarea';

export interface EditFieldConfig {
  key: string;
  label: string;
  type?: EditFieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  rows?: number;
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
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            Save changes
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => {
          const value = form[field.key] ?? '';
          const error = errors[field.key];
          const onChange = (v: string) => setForm((prev) => ({ ...prev, [field.key]: v }));

          if (field.type === 'select' && field.options) {
            return (
              <Select
                key={field.key}
                label={field.label}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                options={field.options}
                error={error}
              />
            );
          }

          if (field.type === 'textarea') {
            return (
              <Textarea
                key={field.key}
                label={field.label}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={field.rows ?? 3}
                error={error}
                placeholder={field.placeholder}
              />
            );
          }

          return (
            <Input
              key={field.key}
              label={field.label}
              type={field.type ?? 'text'}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              required={field.required}
              error={error}
              placeholder={field.placeholder}
            />
          );
        })}
      </form>
    </Modal>
  );
}
