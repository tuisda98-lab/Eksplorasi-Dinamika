# GitHub Pages dan Supabase Secrets

## GitHub Actions Secrets

Buka repository GitHub, lalu pilih **Settings > Secrets and variables > Actions > New repository secret**. Tambahkan:

- `SUPABASE_ACCESS_TOKEN`: access token dari Supabase Account > Access Tokens. Dipakai GitHub Actions untuk deploy function.
- `SUPABASE_SERVICE_ROLE_KEY`: service role key dari Supabase Project Settings > API. Hanya dipasang sebagai secret Edge Function.
- `EDGE_AUTH_SECRET`: secret acak panjang untuk menandatangani sesi guru.

Jangan menambahkan nilai secret ke `index.html`, SQL, commit, issue, atau log workflow.

## GitHub Pages

Pada repository GitHub, buka **Settings > Pages**, lalu pilih **Source: GitHub Actions**. Workflow `.github/workflows/deploy.yml` akan otomatis menjalankan deploy setiap ada push ke branch `main`.

Workflow hanya mengunggah `index.html` dan `imsmanifest.xml` ke Pages. Folder `supabase`, SQL, dan dependency tidak ikut dipublikasikan sebagai artifact Pages.

## Supabase Database

Jalankan `supabase-policy-secure.sql` satu kali setelah `supabase-setup.sql`. Policy tersebut mencabut akses langsung `anon` ke tabel nilai. Browser hanya boleh memanggil Edge Function.

## Keamanan

`SUPABASE_URL` dan publishable/anon key di `index.html` bukan secret dan memang dapat terlihat oleh browser. Keamanan sebenarnya berasal dari Row Level Security dan Edge Function. `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN`, dan `EDGE_AUTH_SECRET` tidak pernah boleh dimasukkan ke repository.
