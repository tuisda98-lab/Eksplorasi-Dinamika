# Evaluation API Edge Function

## Deploy

Install and log in to the Supabase CLI, then run from the repository root:

```powershell
supabase functions deploy evaluation-api --no-verify-jwt
supabase secrets set DB_SERVICE_ROLE_KEY="PASTE_SERVICE_ROLE_KEY_HERE" EDGE_AUTH_SECRET="GENERATE_A_LONG_RANDOM_SECRET_HERE"
```

Set secrets before deploying or redeploy after setting them. Never commit either secret or put them in `index.html`.

The deployed endpoint is:

```text
https://vjqqcdniqrqhylxswxmw.supabase.co/functions/v1/evaluation-api
```

## Operations

- `POST { action: "login", username, passwordHash }` returns a short-lived teacher token.
- `POST { action: "submit", name, studentClass, score }` stores a student result.
- `POST { action: "list" }` requires `Authorization: Bearer <teacher-token>`.
- `POST { action: "delete" }` requires `Authorization: Bearer <teacher-token>`.

Run `supabase-policy-secure.sql` in Supabase SQL Editor after the original setup SQL. This removes direct anonymous REST access to evaluation results. The Edge Function uses the private `service_role` key server-side.
