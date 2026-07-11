-- Showroom and PPF Studio rent & salary expense categories
UPDATE expense_categories
SET category_name = 'Showroom Salaries',
    description = 'Showroom staff salaries and benefits'
WHERE category_id = 'cat_006';

INSERT INTO expense_categories (category_id, category_name, description)
VALUES
  ('cat_007', 'Showroom Rent', 'Showroom premises rent and lease'),
  ('cat_008', 'PPF Studio Rent', 'PPF studio premises rent and lease'),
  ('cat_009', 'PPF Studio Salaries', 'PPF studio staff salaries and benefits')
ON CONFLICT (category_id) DO UPDATE
SET category_name = EXCLUDED.category_name,
    description = EXCLUDED.description;
