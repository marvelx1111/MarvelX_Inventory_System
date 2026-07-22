-- Other Showroom: miscellaneous (food, tea, etc.)
INSERT INTO expense_categories (category_id, category_name, description)
VALUES (
  'cat_010',
  'Miscellaneous',
  'Food, tea, and other general showroom expenses'
)
ON CONFLICT (category_id) DO UPDATE
SET category_name = EXCLUDED.category_name,
    description = EXCLUDED.description;
