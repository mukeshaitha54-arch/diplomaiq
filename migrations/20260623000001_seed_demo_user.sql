-- Note: We do not directly seed auth.users via SQL in a typical BaaS.
-- The user 'demo@diplomaiq.com' must be created manually or via the API.
-- The `demo.ts` Server Action provisions the student records automatically
-- upon their first successful login.

-- However, we can create a view or index for demo users if needed.
-- For this mission, the seeding logic resides entirely in `demo.ts` 
-- so it can dynamically fetch the correct user ID from the newly created auth record.

-- We record the version of the demo dataset in the metadata.
-- demo_dataset_version: 'v1'
