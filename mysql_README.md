# MySQL Deployment Guide

Aplikasi ini sudah diubah agar tidak lagi bergantung pada Supabase. Untuk deployment di Vercel, gunakan API route di `api/evaluation-api.js` dan koneksikan ke database MySQL yang Anda miliki.

## 1) Environment Variables

Atur variabel environment di Vercel Project Settings > Environment Variables:

- `MYSQL_HOST` = host MySQL Anda, contoh: `db.example.com`
- `MYSQL_PORT` = port MySQL, default `3306`
- `MYSQL_DATABASE` = nama database, contoh: `geolearn_db`
- `MYSQL_USER` = username MySQL
- `MYSQL_PASSWORD` = password MySQL
- `MYSQL_AUTH_SECRET` = secret untuk token login guru, contoh string acak panjang
- `MYSQL_SSL` = `true` jika DB Anda memerlukan SSL (opsional)

Catatan: jika Anda menggunakan layanan MySQL yang sudah punya SSL default, isi `MYSQL_SSL=true`.

## 2) SQL Schema

Jalankan SQL berikut di MySQL Anda:

```sql
CREATE TABLE teacher_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash VARCHAR(128) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE evaluation_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  student_class VARCHAR(10) NOT NULL,
  score INT NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Contoh data guru:

```sql
INSERT INTO teacher_accounts (username, password_hash)
VALUES ('guru', 'PASTE_SHA256_HEX_PASSWORD');
```

Untuk password `admin123`, hash SHA-256-nya adalah:

```bash
node -e "console.log(require('crypto').createHash('sha256').update('admin123').digest('hex'))"
```

## 3) Deploy ke Vercel

1. Push repository ke GitHub.
2. Import repository ke Vercel.
3. Pilih framework: `Other` atau otomatis detect.
4. Tetapkan semua variabel environment di atas.
5. Deploy.

Setelah deploy, endpoint API akan tersedia di:

```text
https://YOUR-VERCEL-APP.vercel.app/api/evaluation-api
```

Frontend akan memanggil endpoint ini menggunakan path relatif `/api/evaluation-api`, sehingga tidak perlu menulis URL hardcoded di `index.html`.

## 4) Catatan Keamanan

- Jangan simpan token login guru di localStorage, gunakan sessionStorage seperti saat ini.
- `MYSQL_AUTH_SECRET` harus dijaga kerahasiaannya.
- Admin guru sebaiknya dibuat lewat database MySQL, bukan di frontend.
