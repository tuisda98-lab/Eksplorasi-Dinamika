# GitHub Pages dan Supabase Secrets

## Supabase Database

Jalankan `supabase-setup.sql` di Supabase SQL Editor. Untuk mode sederhana, jalankan juga `supabase-policy-secure.sql` agar frontend dapat menyimpan dan membaca hasil melalui publishable key.

## GitHub Actions Secrets

Buka repository GitHub, lalu pilih **Settings > Secrets and variables > Actions > New repository secret**. Tambahkan:

- Tidak ada secret Supabase yang diperlukan untuk deploy halaman statis.

Tidak perlu menjalankan atau mengatur Edge Function untuk mode sederhana ini. Jangan menambahkan secret ke `index.html`, SQL, commit, issue, atau log workflow.

## GitHub Pages

Pada repository GitHub, buka **Settings > Pages**, lalu pilih **Source: GitHub Actions**. Workflow `.github/workflows/deploy.yml` akan otomatis menjalankan deploy setiap ada push ke branch `main`.

Workflow hanya mengunggah `index.html` dan `imsmanifest.xml` ke Pages. Folder `supabase`, SQL, dan dependency tidak ikut dipublikasikan sebagai artifact Pages.

## Keamanan

`SUPABASE_URL` dan publishable/anon key di `index.html` bukan secret dan memang dapat terlihat oleh browser. Mode sederhana ini mengutamakan kemudahan deploy; karena policy `anon` dapat membaca data, jangan gunakan untuk data yang sangat rahasia.
