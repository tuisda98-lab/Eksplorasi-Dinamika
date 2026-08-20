# GitHub Pages dan Supabase Secrets

## Supabase Function Secrets

Buka project Supabase, lalu masuk ke **Edge Functions > Secrets**. Tambahkan:

- `DB_SERVICE_ROLE_KEY`: service role/secret key dari Project Settings > API. Nama ini tidak memakai prefix `SUPABASE_` karena prefix tersebut dicadangkan oleh Supabase.
- `EDGE_AUTH_SECRET`: secret acak panjang yang dibuat sendiri.

Secret ini disimpan langsung di Supabase dan tidak perlu dikirim melalui GitHub Actions. Jangan menaruh nilainya di repository.

## GitHub Actions Secrets

Buka repository GitHub, lalu pilih **Settings > Secrets and variables > Actions > New repository secret**. Tambahkan:

- `SUPABASE_ACCESS_TOKEN`: access token dari Supabase Account > Access Tokens. Dipakai GitHub Actions untuk deploy function.

Jangan menambahkan nilai secret ke `index.html`, SQL, commit, issue, atau log workflow.

## GitHub Pages

Pada repository GitHub, buka **Settings > Pages**, lalu pilih **Source: GitHub Actions**. Workflow `.github/workflows/deploy.yml` akan otomatis menjalankan deploy setiap ada push ke branch `main`.

Workflow hanya mengunggah `index.html` dan `imsmanifest.xml` ke Pages. Folder `supabase`, SQL, dan dependency tidak ikut dipublikasikan sebagai artifact Pages.

## Supabase Database

Jalankan `supabase-policy-secure.sql` satu kali setelah `supabase-setup.sql`. Policy tersebut mencabut akses langsung `anon` ke tabel nilai. Browser hanya boleh memanggil Edge Function.

## Keamanan

`SUPABASE_URL` dan publishable/anon key di `index.html` bukan secret dan memang dapat terlihat oleh browser. Keamanan sebenarnya berasal dari Row Level Security dan Edge Function. `DB_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN`, dan `EDGE_AUTH_SECRET` tidak pernah boleh dimasukkan ke repository.
