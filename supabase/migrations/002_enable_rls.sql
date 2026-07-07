-- Dev RLS policies (permissive — tighten before production)
-- Applied via Supabase MCP migration: enable_rls_policies

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'roles','permissions','role_permissions','app_users','customers','expense_categories',
    'purchases','vehicles','vehicle_documents','vehicle_expenses','showroom_expenses',
    'sales','sale_payments','delivery_records','investors','investments','investor_returns',
    'ppf_customers','ppf_vehicles','ppf_brands','ppf_rolls','ppf_stock_transactions',
    'ppf_packages','ppf_job_cards','ppf_job_materials','ppf_job_labor','ppf_sales',
    'ppf_payments','ppf_warranties','audit_logs'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR SELECT TO anon, authenticated USING (true)', t || '_select', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR INSERT TO anon, authenticated WITH CHECK (true)', t || '_insert', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)', t || '_update', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR DELETE TO anon, authenticated USING (true)', t || '_delete', t);
  END LOOP;
END $$;
