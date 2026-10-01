# HME Kewirausahaan

Website resmi Sub Kewirausahaan HME yang memfasilitasi katalog produk, Open Order, checkout, tracking pesanan, serta panel admin untuk mengelola produk dan pesanan.

## Audit cepat dan asumsi

- Aplikasi ini adalah platform penjualan berbasis periode, bukan marketplace yang selalu aktif. Penjualan hanya dibuka saat ada Open Order aktif.
- Semua keputusan penting seperti status toko, validasi kuota, stok, dan validasi pembayaran harus ditentukan di server agar pengguna tidak bisa memanipulasi data dari client.
- Database menjadi sumber kebenaran utama; UI hanya menampilkan data yang di-izinkan.
- Role admin dibatasi ke server-side supaya hanya akun yang valid dapat masuk ke `/admin/*`.

## Struktur folder

- `src/app` — halaman aplikasi, route API, dan layout Next.js.
- `src/components` — komponen UI bersama seperti navbar, sidebar admin, dan tombol.
- `src/lib` — helper domain seperti `auth`, `catalog`, dan Prisma client.
- `prisma` — schema Prisma dan seed proyek.
- `scripts` — CLI operasional seperti `create-admin`.

## Persyaratan

- Node.js 20+
- PostgreSQL
- npm

## Setup lingkungan

1. Salin file `.env.example` menjadi `.env`.
2. Isi variabel database dan secret:

```bash
cp .env.example .env
```

Contoh isi `.env` yang valid:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hme_kewirausahaan?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/hme_kewirausahaan?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="ganti-dengan-string-rahasia-yang-panjang"
ADMIN_EMAIL="admin@hme.ac.id"
ADMIN_PASSWORD="strong-password-here"
```

Catatan:
- `ADMIN_PASSWORD` dipakai saat membuat admin pertama lewat CLI.
- Untuk deployment di Vercel, simpan variabel tersebut di environment variables project.

## Migrasi database

```bash
npx prisma migrate dev --name init
```

Jika belum ada migration local, jalankan:

```bash
npx prisma db push
```

## Seed data

```bash
npx prisma db seed
```

Seed akan membuat admin default sesuai `ADMIN_EMAIL` dan `ADMIN_PASSWORD` jika tersedia, serta sample Open Order dan produk demo.

## Membuat admin pertama

```bash
npm run create-admin
```

Jika password ingin di-override dari CLI:

```bash
ADMIN_PASSWORD="password-baru" npm run create-admin
```

Atau:

```bash
npm run create-admin -- "password-baru"
```

## Menjalankan aplikasi

```bash
npm install
npm run dev
```

Buka URL berikut di browser:

- Frontend: http://localhost:3000
- Admin: http://localhost:3000/admin/login

## Build untuk production

```bash
npm run build
npm run start
```

## Operasional admin

1. Login ke halaman admin dengan email yang dibuat via CLI.
2. Kelola Open Order, produk, dan status pesanan dari sidebar.
3. Gunakan halaman produk untuk menambahkan varian, stok, target pre-order, dan status.
4. Pastikan setiap perubahan status pesanan dilakukan secara konsisten dengan aturan order dan payment yang berlaku di aplikasi.

## Deploy ke Vercel

1. Siapkan repository Git.
2. Hubungkan project ke Vercel.
3. Tambahkan semua environment variables dari `.env` ke project settings.
4. Deploy dengan PostgreSQL production dan jalankan migrasi Prisma di environment deployment.
5. Pastikan `NEXTAUTH_SECRET` dan `DATABASE_URL` valid sebelum produksi dibuka.

## Catatan keamanan

- Tidak ada credential hardcoded di UI.
- Session admin disimpan dan dicek di server.
- Semua validasi penting berada di backend.
- Data sensitif seperti NIM, WhatsApp, email, dan bukti pembayaran hanya ditampilkan untuk role admin yang berwenang.

