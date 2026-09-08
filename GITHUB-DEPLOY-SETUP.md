# GitHub Pages dan Supabase Secrets

## Supabase Database

Jalankan `supabase-setup.sql` di Supabase SQL Editor. Untuk mode sederhana, jalankan juga `supabase-policy-secure.sql` agar frontend dapat menyimpan dan membaca hasil melalui publishable key.

## GitHub Actions Secrets

Buka repository GitHub, lalu pilih **Settings > Secrets and variables > Actions > New repository secret**. Tambahkan:

- Untuk deploy halaman statis saja, tidak ada secret Supabase yang diperlukan.

Jangan menambahkan secret ke `index.html`, SQL, commit, issue, atau log workflow.

## Teacher Login API

Login guru menggunakan Edge Function `evaluation-api`, bukan file yang dijalankan oleh GitHub Pages. Function tersebut harus dideploy ke project Supabase terlebih dahulu. Dari root repository, jalankan:

```powershell
supabase login
supabase link --project-ref vjqqcdniqrqhylxswxmw
supabase secrets set DB_SERVICE_ROLE_KEY="PASTE_SERVICE_ROLE_KEY_HERE" EDGE_AUTH_SECRET="GENERATE_A_LONG_RANDOM_SECRET_HERE"
supabase functions deploy evaluation-api --no-verify-jwt
```

Nilai `DB_SERVICE_ROLE_KEY` dan `EDGE_AUTH_SECRET` hanya disimpan sebagai secret Supabase. Setelah function aktif, halaman GitHub Pages dapat memanggil endpoint login di `/functions/v1/evaluation-api`.

## GitHub Pages

Pada repository GitHub, buka **Settings > Pages**, lalu pilih **Source: GitHub Actions**. Workflow `.github/workflows/deploy.yml` akan otomatis menjalankan deploy setiap ada push ke branch `main`.

Workflow hanya mengunggah `index.html` dan `imsmanifest.xml` ke Pages. Folder `supabase`, SQL, dan dependency tidak ikut dipublikasikan sebagai artifact Pages. Karena itu, push ke GitHub tidak otomatis mendeploy Edge Function.

## Keamanan

`SUPABASE_URL` dan publishable/anon key di `index.html` bukan secret dan memang dapat terlihat oleh browser. Mode sederhana ini mengutamakan kemudahan deploy; karena policy `anon` dapat membaca data, jangan gunakan untuk data yang sangat rahasia.
