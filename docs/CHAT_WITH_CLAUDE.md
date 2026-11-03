# Perbedaan Hostinger shared hosting dan VPS

**Created:** 11/3/2026 0:52:38  
**Updated:** 11/3/2026 21:11:21  
**Exported:** 11/3/2026 21:23:01  
**Link:** [https://claude.ai/chat/e1bce1f3-a572-43e9-8698-21be933d8fcf](https://claude.ai/chat/e1bce1f3-a572-43e9-8698-21be933d8fcf)  

## User:

![1793629795362_image.png](https://claude.ai/api/6b5ece3d-c226-4f2c-9202-20edb27576be/files/0c006cad-307c-41ef-996e-acf7e231a090/preview)

![1793629803069_image.png](https://claude.ai/api/6b5ece3d-c226-4f2c-9202-20edb27576be/files/15b0341e-9b6c-4f2c-9cc2-aaee9a1dc3d9/preview)

![1793629821127_image.png](https://claude.ai/api/6b5ece3d-c226-4f2c-9202-20edb27576be/files/399bd162-92eb-49d3-9a90-74a13957148c/preview)

![1793629833411_image.png](https://claude.ai/api/6b5ece3d-c226-4f2c-9202-20edb27576be/files/9c539c50-41a5-43f6-84e8-54f85b6303a7/preview)

![1793629847231_image.png](https://claude.ai/api/6b5ece3d-c226-4f2c-9202-20edb27576be/files/fa1d52d8-7a6b-4e27-8ab3-c1b98ea42037/preview)

![1793629868210_image.png](https://claude.ai/api/6b5ece3d-c226-4f2c-9202-20edb27576be/files/a896a349-5cbb-4a05-8651-c8a8a22e55ad/preview)

![1793634710697_image.png](https://claude.ai/api/6b5ece3d-c226-4f2c-9202-20edb27576be/files/0471f706-aac1-460b-91b2-3d691f7328f9/preview)

Apa saja yang bisa aku dapatkan dari langganan paket Unlimited web hosting di hostinger ini? Misalnya benefitnya, dan keterbatasannya apa saja. Aku sebenarnya ingin coba pakai VPS, tapi aku belum punya pengalaman sama sekali mengelola web app menggunakan VPS, jadi aku akan mulai dengan shared hosting dulu (nama produk Website Hosting). Aku biasanya membangun web menggunakan Vite (React) + Supabase sebagai BaaS, lalu deployment dan hostingnya menggunakan Vercel (import project via github), dan domainnya dari Hostinger (domain only). Kira-kira kapan aku harus menggunakan layanan shared hosting dan kapan harus VPS? Terus, ada beberapa layanan atau produk hostinger lainnya yang sepertinya masih perlu aku pelajari bedanya apa saja

## Assistant:

> Memutuskan apakah perlu mencari informasi tambahan.

Aku cek dulu dokumentasi Hostinger untuk detail yang tidak terlihat di screenshot, terutama soal Node.js dan limitasi shared hosting.

> Membandingkan spesifikasi VPS dengan kebutuhan proyek.

Singkatnya: untuk stack Vite + Supabase + Vercel yang sekarang kamu pakai, shared hosting hampir tidak menambah apa-apa. Detailnya di bawah.

## Yang kamu dapat di paket Unlimited

Dari screenshot-mu:
- **Resource:** 50 GB NVMe, 2 CPU core, 3 GB RAM, 60 PHP worker, 600.000 inode, bandwidth unlimited, dan website unlimited.
- **Database:** 150 database dengan total kapasitas 3 GB.
- **Backup:** backup harian dan fitur restore data. Paket Single dan Premium tidak punya ini.
- **Node.js:** 5 Web App. Ini satu-satunya fitur yang relevan untuk developer React.
- **Email:** mailbox unlimited per website, gratis 1 tahun.
- **Lainnya:** domain gratis 1 tahun, SSL, CDN, proteksi privasi WHOIS, bantuan prioritas 24/7, 1000 kredit AI Builder, dan AI email marketing (hingga 100 subscriber).

Paket Web App Node.js di hPanel hanya tersedia di Business Web Hosting atau paket Cloud, dan tiap paket punya jatah jumlah Web App. Spesifikasi "Unlimited" di Indonesia (50 GB, 2 core, 3 GB RAM, 5 Web App) sama dengan paket Business di negara lain. Jadi kemungkinan besar ini produk yang sama dengan nama berbeda, tapi itu inferensiku dari kecocokan spesifikasi.

Deployment dari GitHub juga didukung. Untuk situs statis/PHP ada auto-deploy via Git, dan untuk aplikasi Node.js yang butuh build ada integrasi GitHub.

## Keterbatasan

- **Harga perpanjangan:** promo Rp35.900/bln hanya untuk kontrak 48 bulan yang dibayar lunas di awal (Rp1.723.200). Setelah itu perpanjangan Rp121.900/bln, sekitar 3,4 kali lipat. Ada garansi uang kembali 30 hari, jadi putuskan dalam jendela itu.
- **"Unlimited" bukan berarti tanpa batas:** semua website berbagi jatah 50 GB, 2 core, 3 GB RAM, dan inode yang sama. Tidak ada biaya overage mendadak untuk lonjakan traffic biasa, tapi penggunaan tinggi yang terus-menerus harus sesuai kapasitas paket. Satu reviewer juga melaporkan server bisa melambat saat salah satu situs berat mengalami lonjakan traffic, karena semuanya di paket yang sama.
- **Tidak ada akses root:** kamu tidak bisa memasang Docker, Redis, atau worker sendiri. Untuk Node.js, Hostinger membuat file .htaccess untuk mengarahkan request ke proses Node, dan file itu dibuat ulang tiap redeploy, jadi jangan diedit manual. Reviewer yang sama juga mengeluh build command tidak bisa di-override, tapi itu satu review, jadi anggap anekdot.
- **Tidak ada Dedicated IP:** fitur ini hanya ada di Ecommerce Startup.
- **Database bawaan MySQL/MariaDB**, bukan PostgreSQL. Ini tidak masalah buatmu karena sudah memakai Supabase.

## Relevansi untuk stack-mu

Vite (React) menghasilkan file statis, jadi Vercel sudah cukup, termasuk preview deployment per PR. Kamu bisa menaruh hasil build di Hostinger, tapi tidak ada keuntungan nyata dibanding Vercel. Domain dari Hostinger tetap bisa diarahkan ke Vercel lewat DNS, seperti yang sudah kamu lakukan. Domain gratis 1 tahun juga kemungkinan hanya berlaku untuk pendaftaran baru, jadi cek dulu di checkout.

Shared hosting baru masuk akal kalau:
- kamu mengelola banyak situs kecil atau situs klien (WordPress atau landing page) dengan biaya tetap,
- kamu butuh email domain sendiri (misalnya nama@domainmu.com),
- proyekmu komersial dan kamu ingin menghindari biaya Vercel Pro. Setahuku paket Hobby Vercel ditujukan untuk penggunaan non-komersial, jadi cek syarat terbarunya.

## Kapan shared, kapan VPS

**Shared hosting** cocok untuk situs statis, WordPress, PHP, dan aplikasi Node kecil dengan traffic yang bisa diprediksi. Kamu tidak perlu mengurus server, dan biayanya tetap.

**VPS** dipakai saat kamu butuh kontrol penuh, misalnya Docker, self-host n8n atau Postgres, WebSocket server, background worker, atau aplikasi yang melewati batas shared hosting. Bayarannya adalah tanggung jawab: kamu sendiri yang mengurus server, versi Node.js, process manager, update, dan keamanan.

Shared hosting bukan batu loncatan menuju VPS, karena skill-nya berbeda. Shared memakai panel hPanel, sedangkan VPS memakai Linux CLI, firewall, dan SSH. Kalau tujuanmu belajar VPS, belajar langsung di VPS kecil lebih efisien. KVM 1 punya 1 vCPU, 4 GB RAM, 50 GB NVMe, dan 4 TB bandwidth, dan KVM 2 punya 2 vCPU, 8 GB RAM, 100 GB NVMe. Harganya beragam antar sumber (promo sekitar $5–6,5/bln untuk KVM 1), jadi cek halaman VPS untuk harga rupiah terbaru. Kabarnya periode langganan VPS tersedia 1, 12, dan 24 bulan, jadi kamu bisa mencoba sebulan tanpa terkunci 4 tahun. Satu ulasan juga mencatat bahwa kenaikan harga saat renewal besar dan CPU bisa di-throttle.

## Produk Hostinger lain (dari menu di screenshot terakhir)

| Produk | Singkatnya |
|---|---|
| Web hosting | Shared hosting, yang sedang kamu lihat |
| Cloud hosting | Masih managed lewat hPanel, tapi lebih bertenaga dari shared dan dibuat untuk traffic lebih tinggi |
| Managed WordPress | WordPress dengan tool AI dan update otomatis |
| WooCommerce hosting | Dioptimalkan untuk toko online |
| Web App hosting | Deploy aplikasi Node.js dari GitHub atau AI coding assistant. Kemungkinan infrastrukturnya sama dengan paket Unlimited yang kamu lihat |
| VPS hosting | Server virtual KVM dengan root access dan Docker. Kamu yang mengelola |
| AI managed VPS | VPS yang dikelola lewat bahasa sehari-hari, tanpa perlu skill teknis |
| Aplikasi 1 klik | Deploy aplikasi open source ke VPS dengan satu klik |
| Agency hosting | Mengelola hingga 300 website klien dari satu dashboard white label |
| GPU hosting | Sewa GPU cloud per jam, untuk workload AI/ML |

Yang perlu kamu pelajari lebih dulu adalah perbedaan Web App hosting, Cloud, dan VPS. Sisanya tidak relevan untuk stack-mu. Kredit AI Builder juga tidak terpakai kalau kamu coding sendiri.

## Saran

Kalau tujuannya belajar server, ambil VPS KVM 1 atau 2 dengan kontrak pendek sebagai sandbox, lalu coba deploy Vite + Docker di dalamnya. Kalau tujuannya mengirim produk, tetap pakai Vercel + Supabase dan jangan kunci 48 bulan di Hostinger dulu. Pertimbangkan Unlimited hanya kalau kamu butuh banyak situs atau email domain.

Apakah proyek yang kamu bangun itu komersial atau klien? Itu yang paling menentukan apakah Hostinger shared layak dipertimbangkan.

---

**Sources:**

- [docs.hostinger.com](https://docs.hostinger.com/getting-started/overview)
- [creating an app](https://docs.hostinger.com/node.js/creating-an-app)
- [React hosting](https://www.hostinger.com/my/web-apps-hosting/react-hosting)
- [React hosting](https://www.hostinger.com/ph/web-apps-hosting/react-hosting)
- [Github copilot hosting](https://www.hostinger.com/my/web-apps-hosting/github-copilot-hosting)
- [Preact hosting](https://www.hostinger.com/ph/web-apps-hosting/preact-hosting)
- [www.g2.com](https://www.g2.com/products/hostinger/reviews?country=20)
- [Hostinger VPS logo](https://learnwithhasan.com/self-hosting-hub/vps-providers/hostinger-vps/)
- [Best VPS hosting of 2026](https://www.techradar.com/news/best-vps-hosting)
- [vps hosting](https://www.hostinger.com/vps-hosting.md)
- [KVM 1 by Hostinger](https://vpsbenchmarks.com/hosters/hostinger/plans/kvm-1)
- [Which Hostinger VPS Plan for an AI Agent? KVM 1 vs KVM 2 vs KVM 4](https://findstack.com/resources/hostinger-vps-for-ai-agents)
- [Hostinger VPS](https://www.itechguides.com/best/vps-hosting/hostinger-vps/)
- [Hostinger Instance Types](https://vpsbenchmarks.com/instance_types/hostinger)
- [getdeploying.com](https://getdeploying.com/hostinger)
- [us.fitgap.com](https://us.fitgap.com/products/hostinger)
- [hostinger vps hosting review](https://hostadvice.com/hosting-company/hostinger-reviews/hostinger-vps-hosting-review/)
- [Hostinger VPS Review: Pricing, Pros & Cons, Alternatives](https://hostscore.net/choose/hostinger-vps-alternatives/)
- [Best cheap VPS hosting 2025](https://techradar.com/news/cheap-vps-hosting-deals)
- [hostinger nodejs hosting review](https://hostadvice.com/hosting-company/hostinger-reviews/hostinger-nodejs-hosting-review/)
- [vpsbenchmarks.com](https://vpsbenchmarks.com/hosters/hostinger)
- [Hostinger VPS – KVM-Virtualisierung, Performance & komplette Übersicht](https://www.l-iz.de/vpn/erfahrungen/hostinger-vps/)
- [Quanto custa uma VPS? Preço atualizado 2026](https://horadecodar.com.br/?p=38029)
- [hostinger linux hosting review](https://hostadvice.com/hosting-company/hostinger-reviews/hostinger-linux-hosting-review/)
- [Web Hosting](https://desking.app/blog/hostinger-vps-plans-pricing-and-which-plan-to-choose)

## User:

Noted.
Sebenarnya web yang akan aku bangun ini konsepnya mirip seperti CIPS Indonesia (https://www.cips-indonesia.org/) dan CELIOS (https://celios.co.id/) yang kurang lebih akan berisi berbagai kebutuhan publikasi yang akan jadi nilai utama web, lalu learning hub (karena 80% konsep dan fitur rencananya diambil dari CIPS Indonesia), serta dashboard untuk pengelola (admin), dan user umum. Kedepannya akan direncanakan integrasi fitur "Subscription" bagi user agar bisa mengakses dokumen-dokumen publikasi yang sifatnya lebih eksklusif, jadi untuk user secara umum bahkan yang sudah login dan punya akun akan tetap diberi akses terbatas pada publikasi-publikasi yang ada. Maka dari itu aku ingin mendiskusikan hal-hal teknis sebelum menentukan arsitektur dan infrastruktur yang akan aku pilih nantinya

## Assistant:

> Weighing whether to check how CIPS and CELIOS are built.

Aku lihat dulu kedua situs referensimu untuk memahami struktur dan fitur yang kamu maksud.

> Memeriksa biaya dan batasan layanan hosting.

Kedua situs itu cukup berbeda dari sisi teknis, dan itu berguna sebagai referensi. CIPS dibangun di Wix dan didesain agensi eksternal. Learning Hub-nya berisi playlist video dan game untuk mahasiswa dan dosen, jadi sebagian besar kontennya embed, bukan sistem pembelajaran dengan progress tracking. CELIOS lebih kompleks: ada toggle bahasa ID/EN, halaman search, publikasi yang dikelompokkan per jenis dan per "desk" isu, serta tools interaktif di subdomain terpisah. Dari situ kebutuhan teknis inti-mu terlihat: konten publikasi yang SEO-heavy, bilingual, terklasifikasi, plus lapisan akses (gating) yang belum ada di kedua situs itu.

## Keputusan arsitektur, urut dari dampak terbesar

**1. Jangan SPA murni (Vite client-side).**
Nilai utama situs ini adalah publikasi yang harus ditemukan lewat Google dan tampil rapi saat dibagikan di WhatsApp, X, atau LinkedIn. Crawler pratinjau link umumnya tidak menjalankan JavaScript, jadi og:title dan og:image per publikasi tidak akan terbaca dari SPA. Googlebot bisa merender JS, tapi HTML yang sudah jadi lebih andal. Kamu butuh SSR/SSG/ISR. Next.js adalah pilihan paling natural untuk deployment Vercel dan masih React. Astro bagus kalau mayoritas halaman adalah konten, tapi bagian dashboard dan auth lebih nyaman di Next.js.

**2. Siapkan keputusan CMS lebih awal.**
Admin dashboard untuk publikasi bukan sekadar CRUD. Staf non-teknis butuh draft, jadwal terbit, versioning, rich text, media library, preview, taksonomi, dan terjemahan. Membangun semua itu sendiri di atas Supabase bisa memakan sebagian besar waktu proyek. Ada tiga jalur:

- **Admin custom di Supabase:** kontrol penuh, tapi kamu membangun semua fitur editorial itu.
- **Payload CMS 3:** dipasang langsung di dalam aplikasi Next.js App Router, dengan panel admin, API, autentikasi, access control, dan live preview, serta mendukung Postgres termasuk Supabase. Fitur editorial seperti draft/versions dan localization sudah tersedia. Kekurangannya, kamu punya dua sistem izin (access control Payload dan RLS Supabase), jadi harus dirancang agar tidak bentrok.
- **CMS hosted (misalnya Sanity):** editor nyaman dan managed, tapi menambah vendor, dan data entitlement-nya harus dijembatani dengan Supabase.

Satu catatan jujur: kalau yang dibutuhkan hanya situs publikasi, Wix atau WordPress selesai dalam hitungan hari, seperti CIPS. Build custom baru sepadan karena gating, subscription, dan dashboard-mu.

**3. Model akses dan gating.**
Rancang sekarang, meski subscription baru menyusul. Beri setiap dokumen kolom `access_level` (publik, terdaftar, subscriber) dan buat konsep entitlement di database. Dengan begitu, nanti subscription hanya mengubah kebijakan, bukan migrasi besar. Prinsip yang perlu dipegang:

- Metadata, ringkasan, dan abstrak tetap publik agar bisa diindeks. Hanya file lengkapnya yang digating.
- Simpan PDF eksklusif di private bucket dan sajikan lewat endpoint server yang mengecek entitlement lalu memberi signed URL berumur pendek. Jangan taruh di folder `public`.
- Cek akses di level database (RLS) dan server, bukan cuma lewat conditional rendering React. Di SPA, variabel `VITE_*` ikut ter-bundle ke browser, jadi secret (misalnya service role key) harus tinggal di server. Ini alasan lain untuk tidak memakai SPA murni.
- Dokumen yang sudah diunduh tidak bisa dikontrol lagi. Watermark per-user bisa jadi opsi nanti.

**4. Subscription di Indonesia.**
Banyak orang tidak punya kartu kredit. Xendit menawarkan recurring lewat e-wallet, kartu, dan direct debit, dan menyebut sedikitnya pemilik kartu kredit sebagai tantangan. Midtrans juga mendukung recurring payment. Pertimbangkan juga model "bayar per periode lewat VA/QRIS + pengingat perpanjangan", yang umum dipakai karena auto-debit tidak tersedia untuk semua metode (ini pengamatanku, bukan klaim dari sumber). Status langganan harus diperbarui lewat webhook yang idempotent, bukan dari redirect di browser. Onboarding payment gateway biasanya butuh dokumen badan hukum, jadi cek lebih awal status legal organisasinya.

**5. Bilingual dan search.**
Putuskan sejak awal apakah terjemahan berupa entri terpisah yang saling terhubung (seperti CIPS yang memuat versi EN dan ID sebagai dua entri) atau field-level localization. Ini sulit dirombak belakangan. Routing `/id` dan `/en` plus hreflang juga perlu direncanakan. Untuk search, mulai dari Postgres full-text search + `pg_trgm`, termasuk teks hasil ekstraksi PDF saat upload, lalu naik ke Meilisearch/Typesense kalau perlu.

**6. Hal kecil yang sering terlewat:**
- Email auth bawaan Supabase hanya cukup untuk uji coba, jadi pasang custom SMTP sebelum rilis.
- Pakai YouTube embed untuk video Learning Hub, jangan self-host.
- Newsletter pakai layanan eksternal, jangan dibangun sendiri.
- Data pengguna terikat UU Pelindungan Data Pribadi (UU 27/2022), jadi siapkan kebijakan privasi, consent, dan mekanisme penghapusan data. Konsultasikan ke ahli hukum.

## Dampak ke infrastruktur

Ada koreksi untuk jawabanku sebelumnya: karena proyek ini komersial, **Vercel Hobby tidak bisa dipakai.** Hobby melarang penggunaan komersial, dan Pro berharga $20 per user per bulan. Situs klien dan produk berbayar masuk kategori komersial. Supabase Free juga tidak layak untuk produksi karena project-nya di-pause setelah seminggu tidak aktif. Supabase Pro ($25/bln) mencakup 8 GB database, 250 GB egress, 100 GB file storage, dan 100.000 MAU. Jadi batas bawah realistisnya sekitar $45/bln (Vercel Pro + Supabase Pro). Egress PDF adalah pos biaya yang perlu diawasi, karena kelebihan di atas 250 GB dikenai $0.09/GB.

Di titik ini, produk Hostinger yang kita bahas tadi jadi relevan. Ada tiga opsi:

- **Vercel Pro + Supabase Pro:** paling mulus (preview deployment, ISR, tanpa mengurus server), tapi biaya dalam dolar dan bertambah per seat.
- **Hostinger Web App (Node.js) + Supabase Pro:** lebih murah dan sudah ada email domain. Seorang reviewer berhasil men-deploy proyek Next.js lewat integrasi GitHub di Hostinger, tapi reviewer yang sama mencatat keterbatasan build command. Resource-nya (3 GB RAM, 2 core, dibagi dengan situs lain) harus diuji untuk Next.js SSR dengan admin panel. Payload sendiri bisa di-deploy di mana pun yang menjalankan Node.js/Next.js, tapi aku belum menemukan konfirmasi Payload di Hostinger, jadi uji dulu di staging.
- **VPS (Docker/Coolify):** paling murah per resource dan jadi sarana belajar yang bagus, tapi seluruh operasional (keamanan, backup, SSL, update) menjadi tanggunganmu. Untuk situs produksi organisasi, aku sarankan VPS dipakai sebagai staging atau sandbox belajar dulu, bukan langsung produksi.

Pilihan CMS tadi menentukan banyak hal di sini. Kalau memakai Payload di dalam Next.js, satu aplikasi bisa jalan di Vercel atau Node hosting, dan kamu tidak butuh server terpisah.

Satu hal yang paling menentukan arah berikutnya: **siapa yang akan mengelola konten sehari-hari, dan seberapa teknis mereka?** Kalau stafnya non-teknis dan rutin menerbitkan, CMS dengan alur editorial jadi hampir wajib. Kalau kamu sendiri yang mengelola, admin custom yang ringan masih masuk akal.

---

**Sources:**

- [Supabase Pricing Calculator](https://makerkit.dev/pricing-calculator/supabase)
- [Supabase Pricing: 2026 Guide to Plans, Limits, and Real-World Costs](https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/amp/)
- [Supabase Pricing: 2026 Guide to Plans, Limits, and Real-World Costs](https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/)
- [supabase pricing](https://makerkit.dev/blog/saas/supabase-pricing)
- [# Supabase Pricing: Free Tier Limits, Pro Costs & Egress](https://www.activepieces.com/blog/supabase-pricing-free-tier-limits-pro-costs-egress.md)
- [Supabase vs PlanetScale](https://makerkit.dev/pricing-calculator/supabase-vs-planetscale)
- [the true cost of supabase a comprehensive guide to pricing integration and maintenance](https://metacto.com/blogs/the-true-cost-of-supabase-a-comprehensive-guide-to-pricing-integration-and-maintenance)
- [# Supabase Pricing in 2026: What You'll Actually Pay (with Calculator)](https://makerkit.dev/blog/md/saas/supabase-pricing)
- [# Supabase vs AWS: Feature and Pricing Comparison (2026)](https://www.bytebase.com/blog/supabase-vs-aws-pricing.md)
- [Supabase vs Neon](https://makerkit.dev/pricing-calculator/supabase-vs-neon)
- [🎯 Quick Answer: How much does Supabase cost?](https://www.nocode.mba/articles/supabase-pricing)
- [Supabase vs Xata](https://makerkit.dev/pricing-calculator/supabase-vs-xata)
- [Supabase Pricing Explained: Free, Pro, Team & Enterprise Plans](https://focusreactive.com/blog/supabase-price/)
- [supabase pricing](https://www.cloudzero.com/blog/supabase-pricing/)
- [How billing works](https://Supabase.io/docs/guides/platform/org-based-billing)
- [Supabase Pricing in 2026: Every Tier, Hidden Costs, and When Firebase or Neon Wins](https://toolradar.com/blog/supabase-pricing-2026)
- [toolradar.com](https://toolradar.com/tools/supabase/pricing)
- [apicostcalc.com](https://apicostcalc.com/supabase.html)
- [Supabase pricing explained: what the Free plan really costs you in 2026](https://livemy.app/blog/supabase-pricing)
- [Pricing & Plans](https://docs.it.apps.vogels.com/docs/vercel/reference/pricing)
- [Vercel Cost in 2026: What You'll Actually Pay (with Calculator)](https://makerkit.dev/blog/saas/vercel-cost)
- [vercel pricing](https://schematichq.com/blog/vercel-pricing)
- [NewGet the latest Pricing Intelligence Report](https://www.vendr.com/marketplace/vercel)
- [Vercel Logo](https://www.joinsecret.com/vercel/pricing)
- [hobby plan](https://vercel.com/docs/plans/hobby-plan)
- [Vercel Logo](https://founders.lakestar.com/vercel/pricing)
- [vercel.com](https://vercel.com/docs/accounts/plans/hobby)
- [vercel.com](https://vercel.com/docs/plans/hobby)
- [www.temperstack.com](https://www.temperstack.com/plans/vercel/)
- [All Vercel Plans & Pricing](https://costbench.com/software/developer-tools/vercel/)
- [Vercel Pricing in 2026: What You'll Pay to Run Your App](https://modelence.com/compare/vercel-pricing)
- [Vercel pricing in 2026: Hobby, Pro, Enterprise — and what the usage bill adds](https://deploycloud-shopify.devcloudsoftware.com/blog/vercel-pricing)
- [is vercel free](https://zplatform.ai/guides/is-vercel-free/)
- [thesearchsherpa.com](https://thesearchsherpa.com/?p=2188)
- [Hosting cost worksheet](https://benchlm.ai/vercel/pricing)
- [Quick Answer](https://costbench.com/software/developer-tools/vercel/discounts/)
- [vercel pricing](https://axonbuild.com/blog/vercel-pricing/)
- [toolradar.com](https://toolradar.com/tools/vercel/pricing)
- [Sign up for Vercel Ship 2025 (NYC and online)](https://https-vercel_com.proxy.bugsmash.io/pricing)
- [# Top Midtrans Alternatives for Indonesian SaaS and E-commerce in 2026](https://dodopayments.com/blogs/midtrans-alternatives)
- [Blog-5 Best Payment Gateways in Indonesia for Global Businesses1085](https://www.photonpay.com/hk/blog/article/payment-gateway-in-indonesia)
- [Blog-5 Best Payment Gateways in Indonesia for Global Businesses1085](https://www.photonpay.com/hk/blog/article/payment-gateway-in-indonesia?lang=en)
- [Perbedaan Midtrans dan Xendit Payment Gateway Serta Kemudahan Integrasi Projek Website Laravel](https://www.buildwithangga.com/tips/perbedaan-midtrans-dan-xendit-payment-gateway-serta-kemudahan-integrasi-projek-website-laravel)
- [Grow Your Business with Xendit's Subscription Feature](https://www.xendit.co/en/products/recurring/)
- [All Content Post](https://onebrick.io/blog/penyedia-layanan-payment-api-indonesia)
- [What Does PT Midtrans Do? A Comprehensive Guide](https://grandavehousing.calpoly.edu/news/what-does-pt-midtrans-do)
- [Midtrans Review: Is It The Best Payment Gateway?](https://grandavehousing.calpoly.edu/news/midtrans-review-is-it-the)
- [Xendit Payment](https://cn.wordpress.org/plugins/woo-xendit-virtual-accounts/)
- [Xendit Payment](https://pcm.wordpress.org/plugins/?p=89753)
- [Midtrans: Your Go-To Payment Gateway](https://grandavehousing.calpoly.edu/news/midtrans-your-go-to-payment)
- [Create an account in less than 5 minutes! Sign up now »](https://www.xendit.co/en/blog/grow-your-business-in-entertainment-gaming/)
- [docs-dev.xendit.co](https://docs-dev.xendit.co/recurring)
- [# Top Xendit Alternatives for Southeast Asian SaaS and Digital Businesses in 2026](https://dodopayments.com/blogs/xendit-alternatives)
- [Enable 38+ payment methods for your business](https://xendit.co/en-id/pricing/)
- [Create an account in less than 5 minutes! Sign up now »](https://www.xendit.co/en/pricing)
- [payload website starter](https://vercel.com/templates/cms/payload-website-starter)
- [Building a Content-Driven Website with Payload CMS 3 and Next.js](https://noqta.tn/en/tutorials/payload-cms-3-nextjs-headless-cms-tutorial-2026)
- [payload application development](https://www.shyft.ai/skills/payload-application-development)
- [From claude-mods](https://www.claudepluginhub.com/skills/0xdarkmatter-claude-mods/payloadcms-ops)
- [payload cms](https://aiidelist.com/ide/payload-cms)
- [From payload](https://www.claudepluginhub.com/skills/payloadcms-payload-tools-claude-plugin-2/payload)
- [From payload](https://www.claudepluginhub.com/skills/getyokedapp-payload-tools-claude-plugin/payload)

## User:

Jika opsinya tetap menggunakan Website Hosting (shared), bahkan ada benefit untuk Node.Js support, apakah tetap worth atau harus gunakan saja paket/produk "Hostinger Web App Hosting" agak lebih aman?

## Assistant:

> Comparing Web App Hosting with the Node.js business plan.

Aku cek dulu halaman produk Web App Hosting Hostinger, supaya perbandingannya berdasarkan spesifikasi terbaru, bukan asumsi.

> Membandingkan batas keamanan kedua paket.

Keduanya produk yang sama. "Web App Hosting" adalah nama pemasaran untuk fitur Node.js yang berjalan di paket Business Web Hosting dan Cloud (Startup, Professional, Enterprise). Deploy-nya lewat GitHub atau upload file. Jadi tidak ada tier "lebih aman" di luar itu. Keputusanmu sebenarnya adalah memilih **Unlimited atau Ecommerce Startup**, bukan shared atau Web App.

Dari screenshot-mu, spesifikasi Unlimited cocok dengan Business, dan Ecommerce Startup cocok dengan Cloud Startup. Ini inferensiku dari kecocokan spesifikasi. Proteksi dasarnya sama: CDN, WAF, DDoS protection, dan SSL terkelola termasuk di paket Business dan Cloud.

| | Unlimited | Ecommerce Startup |
|---|---|---|
| RAM / CPU | 3 GB / 2 core | 4 GB / 4 core |
| Storage | 50 GB | 100 GB |
| Web App Node.js | 5 | 10 |
| Dedicated IP | Tidak | Ya |
| Harga promo | Rp35.900/bln | Rp116.900/bln |
| Perpanjangan | Rp121.900/bln | Rp310.900/bln |

**Layak dicoba, tapi jangan langsung kunci 48 bulan.** Untuk Next.js SSR (apalagi dengan Payload), Unlimited adalah yang paling mepet. Build dan admin panel berjalan di 3 GB RAM yang dipakai bersama semua situs di akunmu. Belum tentu bermasalah, tapi harus diuji. Ecommerce Startup lebih longgar, tapi setelah promo harganya kira-kira $17–21 (kurs Rp15–18 ribu), setara Vercel Pro yang $20 per user per bulan. Keunggulan harganya hanya selama promo. Unlimited tetap jauh lebih murah dari Vercel Pro bahkan setelah perpanjangan.

Langkah yang kusarankan:
1. Mulai dari Unlimited. Upgrade bisa langsung dari hPanel, jadi tidak perlu mengambil tier atas di awal.
2. Manfaatkan garansi 30 hari uang kembali yang tampil di banner Hostinger (cek syarat di checkout). Deploy versi staging Next.js (+ Payload) dan uji: build berhasil, waktu respons halaman, kelancaran admin panel, dan grafik RAM/CPU di hPanel.
3. Jangan simpan upload media di filesystem aplikasi. Filesystem aplikasi tidak boleh otomatis dianggap penyimpanan permanen. Pakai Supabase Storage atau R2.
4. Pertimbangkan periode langganan yang lebih pendek dari 48 bulan untuk tahap awal. Harga bulanannya lebih tinggi, tapi kamu tidak terkunci sebelum arsitekturnya terbukti.

Kalau uji staging lolos, Hostinger masuk akal karena biaya flat dan email domain sudah termasuk. Kalau mepet, Vercel Pro + Supabase Pro tetap pilihan yang lebih mulus untuk produksi. Mau kubantu susun checklist uji 30 harinya?

---

**Sources:**

- [hostinger.com](https://hostinger.com/pricing/1)
- [How to add a Node.js Web App in Hostinger](https://www.hostinger.com/support/?p=6553)
- [How to add a Node.js Web App in Hostinger](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger)
- [New managed web hosting service brings flat-rate node.js pricing](https://www.techradar.com/pro/new-managed-web-hosting-service-brings-flat-rate-node-js-pricing?rand=141)
- [New managed web hosting service brings flat-rate node.js pricing](https://www.techradar.com/pro/new-managed-web-hosting-service-brings-flat-rate-node-js-pricing)
- [6 best Vercel alternatives for application hosting](https://www.hostinger.com/tutorials/?p=146040)
- [Früher Black Friday bei Hostinger: Webhosting-Tarife bis zu 80 Prozent günstiger - mit kleinem Extra](https://www.netzwelt.de/schnaeppchen/247692-frueher-black-friday-hostinger-webhosting-tarife-80-prozent-guenstiger-kleinem-extra.html)
- [hostinger express js hosting review](https://hostadvice.com/hosting-company/hostinger-reviews/hostinger-express-js-hosting-review/)
- [themeisle.com](https://themeisle.com/blog/?p=79888)
- [Plan d’hébergement web de Hostinger : comment choisir le meilleur ?](https://www.hostinger.com/fr/tutoriels/?p=9146)
- [Node.js hosting options at Hostinger](https://www.hostinger.com/support/1583661-is-node-js-supported-at-hostinger/)
- [# Hostinger](https://thegtmdirectory.com/tools/hostinger/md)
- [Node.js Hosting Options at Hostinger: Web Apps, Cloud Hosting, or VPS?](https://www.cloudspress.com/?p=616053)
- [Parcel hosting](https://www.hostinger.com/ph/web-apps-hosting/parcel-hosting)
- [Continue.dev hosting](https://www.hostinger.com/au/web-apps-hosting/continuedev-hosting)
- [Hostinger Logo](https://www.joinsecret.com/de/hostinger/pricing)
- [www.itechguides.com](https://www.itechguides.com/products/hostinger/)
- [8 best Node.js hosting: Top platforms for performance and scalability](https://www.hostinger.com/ph/tutorials/?p=130939)

## User:

Jadi, mana pilihan paling proper untuk kebutuhan saat ini?

## Assistant:

> Comparing the costs of the two hosting options.

Pilihan paling proper untuk kebutuhanmu: **Vercel Pro + Supabase Pro, dengan domain tetap di Hostinger (domain only).**

Alasannya:
- **Hemat tidak sebesar kelihatannya.** Supabase Pro tetap kamu butuhkan di kedua skenario, karena project Free di-pause setelah seminggu tanpa aktivitas. Selisih nyatanya hanya Vercel Pro ($20/user/bln) melawan Hostinger Unlimited (sekitar $2–8/bln, tergantung promo atau perpanjangan). Kira-kira $12–18 per bulan.
- **Kamu membeli pengurangan risiko operasional.** Kamu belum berpengalaman mengelola server. Situs ini akan punya pelanggan berbayar, dan di Vercel kamu tidak mengurus RAM, build, atau proses Node.
- **Cocok dengan alur kerjamu:** import dari GitHub, preview deployment per PR, dan ISR/SSR Next.js berjalan native.

Biaya dasarnya sekitar $45/bln: Vercel Pro $20 per user per bulan dan Supabase Pro $25 per bulan. Untuk tim solo, itu satu seat saja. Pantau egress PDF seiring pertumbuhan trafik.

Hostinger Unlimited baru layak dipilih kalau salah satu ini benar:
- Anggaran bulanan benar-benar ketat.
- Kamu ingin email domain dan hosting dalam satu tagihan rupiah.
- Uji staging 30 hari yang kusebut tadi terbukti lancar.

Bahkan jika terbukti lancar, itu tetap pilihan hemat, bukan pilihan paling aman.

VPS tidak perlu masuk rencana produksi sekarang. Kalau ingin belajar, sewa KVM 1 atau 2 dengan periode pendek sebagai sandbox terpisah.

Fase pengembangan bisa jalan dulu di lokal dengan project Supabase Free untuk dev. Upgrade ke Pro saat situs dipublikasikan atau dipakai organisasi. Pastikan juga ketentuan Hobby Vercel sebelum men-deploy sesuatu yang mendekati komersial.

Langkah berikutnya yang paling berdampak adalah memutuskan CMS (Payload di dalam Next.js atau admin custom), karena itu memengaruhi struktur database dan sistem izin sejak awal. Mau kita bahas itu?

## User:

Jadi, keputusannya, apa saja stack proper yang bisa aku gunakan untuk scope dan konsep pengembangan project ini?

## Assistant:

> Menyusun tahapan rilis dan pengujian akses.

Stack yang kurekomendasikan: **Next.js + Payload CMS + Supabase, di-deploy di Vercel.** Payload dipakai untuk konten dan admin, Supabase untuk pengguna dan akses.

| Layer | Pilihan |
|---|---|
| Framework | Next.js (App Router) + TypeScript, halaman publik pakai SSG/ISR |
| UI | Tailwind CSS + shadcn/ui |
| CMS & admin | Payload 3, dipasang di dalam aplikasi Next.js dan mendukung Postgres termasuk Supabase |
| Database | Supabase Postgres (region Singapore) |
| Auth pengguna umum | Supabase Auth (`@supabase/ssr`) |
| File | Supabase Storage: bucket publik untuk cover dan PDF gratis, bucket privat untuk PDF eksklusif |
| i18n | Payload localization + `next-intl`, rute `/id` dan `/en` |
| Search | Postgres full-text search + `pg_trgm`, naik ke Meilisearch/Typesense bila perlu |
| Video | YouTube embed |
| Email | Resend atau Brevo via SMTP (auth dan transaksional), newsletter lewat layanan terpisah |
| Pembayaran (fase 2) | Xendit atau Midtrans, webhook di route handler Next.js |
| Hosting | Vercel Pro + Supabase Pro (sekitar $45/bln: Vercel Pro $20/user, Supabase Pro $25), domain tetap di Hostinger |
| Monitoring | Sentry + uptime monitor gratis |

**Aturan pembagian:** Payload memiliki konten (publikasi, penulis, topik, event, halaman, learning hub) dan akun admin. Supabase memiliki pengguna umum, langganan, entitlement, log unduhan, dan file privat. Dengan batas ini, dua sistem izin tidak saling tumpang tindih.

**Alur gating unduhan:**
1. Setiap dokumen punya `access_level` di Payload (publik, terdaftar, subscriber).
2. Pengguna menekan unduh, lalu route handler Next.js memeriksa sesi Supabase.
3. Server mencocokkan level dokumen dengan entitlement pengguna.
4. Jika lolos, server memberi signed URL berumur pendek dari bucket privat. Jika tidak, tampilkan halaman upsell.

Metadata dan ringkasan tetap publik supaya terindeks Google.

**Fase pengembangan:**
1. **MVP:** situs publik dua bahasa, CMS dan admin, search, registrasi dan login, serta kerangka `access_level` dan entitlement (tanpa pembayaran).
2. **Subscription:** integrasi payment gateway, webhook idempotent, tabel `subscriptions`, log unduhan.
3. **Pendalaman:** learning hub lebih kaya, event, newsletter, analitik unduhan.

**Dua risiko yang perlu diuji lebih dulu:**
- Integrasi Payload dengan Supabase adalah bagian paling baru bagimu. Payload terhubung langsung ke Postgres, jadi tabelnya tidak dilindungi RLS Supabase dan akses dikontrol Payload sendiri. Di Vercel, gunakan connection pooler Supabase untuk runtime dan koneksi direct untuk migrasi.
- Upload media dan PDF dari Payload tidak boleh disimpan di filesystem aplikasi (serverless). Arahkan lewat storage adapter ke Supabase Storage.

Sebelum berkomitmen, lakukan spike 1–2 hari: Next.js + Payload + Supabase Postgres + Supabase Auth + satu PDF yang digating. Kalau lancar, lanjut. Tambahkan juga tes otomatis (misalnya Playwright) untuk matriks akses: anonim, terdaftar, subscriber, admin. Bug di logika gating adalah bug yang paling mahal.

Kalau ternyata editornya hanya kamu sendiri dan volume konten kecil, pertimbangkan alternatif lebih ringan: admin custom di Next.js dengan Supabase saja (satu auth, satu sistem izin, tapi kamu membangun fitur editorialnya sendiri).

Mau kubuatkan rancangan koleksi Payload dan skema tabel Supabase-nya sebagai langkah berikutnya?

## User:

Nah, kan nantinya akan ada dashboard yang beda-beda, yaitu untuk internal tim dan untuk user publik. Apakah ada pendekatan yang proper untuk konsep ini? Apakah perlu kombinasi stack yang berbeda untuk menangani Dashboard misalnya Vite, sedangkan untuk yang bisa diakses publik itu pakai Next?

## Assistant:

> Memisahkan internal staff dan pengguna publik.

**Tidak perlu stack berbeda.** Pisahkan dashboard berdasarkan route group dan peran pengguna, bukan teknologi. Tiga permukaan itu bisa hidup dalam satu aplikasi Next.js:

| Permukaan | Untuk siapa | Route | Autentikasi | Rendering |
|---|---|---|---|---|
| Situs publik | Semua orang | `/[locale]/...` | Tidak ada | SSG/ISR, terindeks |
| Area akun | Pengguna terdaftar dan subscriber | `/[locale]/account/...` | Supabase Auth | Dinamis, `noindex` |
| Dashboard internal | Tim editorial dan admin | `/admin` (Payload) + view khusus | Payload (akun staf) | Dinamis, `noindex` |

Panel admin Payload sudah menjadi dashboard internal untuk kebutuhan editorial: publikasi, terjemahan, draft, jadwal terbit, media. Area akun untuk pengguna biasanya berisi profil, status langganan dan riwayat tagihan, bookmark, riwayat unduhan, dan preferensi notifikasi. Fitur internal non-editorial, seperti manajemen pengguna dan langganan atau analitik unduhan, bisa dibuat sebagai custom view di dalam Payload atau sebagai route grup `/internal` yang memverifikasi sesi staf di server. Cek dokumentasi Payload untuk cara terbarunya.

**Kenapa tidak memisahkan dashboard ke Vite:**
- **Auth dan session jadi dua kali.** Aplikasi kedua berarti cookie, CORS, dan logika sesi yang diduplikasi.
- **Butuh backend tetap.** Operasi sensitif (mengubah entitlement, refund manual, melihat data pengguna) harus lewat server karena SPA tidak bisa menyimpan secret. Artinya kamu tetap membangun API, dan di Next route handler dan server action sudah tersedia.
- **Deployment dan pemeliharaan ganda.** Dua pipeline, dua set environment variable, dan kode bersama (tipe, kebijakan akses) harus disinkronkan.
- **Keunggulan Vite tidak relevan di sini.** Dashboard memang tidak butuh SEO, tapi Next bisa menjalankan halaman client-heavy dengan `'use client'` plus TanStack Query/Table. Komponen React dan skill Vite-mu tetap terpakai.

**Aturan keamanan:**
1. **Pisahkan identitas staf dan pengguna publik.** Staf ada di Payload, pengguna umum di Supabase. Jangan ada jalur "daftar publik lalu naik jadi admin". Staf yang ingin mengakses konten eksklusif memakai akun publik terpisah atau diberi entitlement khusus.
2. **Otorisasi selalu di server.** Middleware dan sembunyikan menu hanya untuk UX. Setiap route handler dan server action harus mengecek sesi dan peran sendiri.
3. **Service role key hanya di server**, dan hanya dipakai di handler yang sudah lolos pengecekan peran staf.
4. **RLS Supabase tetap aktif** untuk data pengguna (profil, bookmark, riwayat unduhan), sebagai lapisan pertahanan kedua.
5. **Aktifkan MFA untuk akun staf** bila tersedia, dan beri halaman internal `noindex`.
6. **Pisahkan peran staf:** admin (semua akses), editor (konten), dan opsional reviewer atau finance (hanya lihat langganan). Ini disimpan sebagai role di koleksi `users` Payload.

**Kapan baru memisahkan jadi aplikasi kedua:**
- Dashboard internal berkembang menjadi aplikasi bisnis sendiri (CRM, keuangan, laporan kompleks).
- Tim dan jadwal rilisnya berbeda dari situs publik.
- Kamu butuh batas keamanan lebih keras, misalnya subdomain `admin.domain.com` dengan pembatasan akses.

Kalau saat itu tiba, ubah repo menjadi monorepo (Turborepo) dengan paket bersama untuk tipe database, komponen UI, dan kebijakan akses. Aplikasi kedua bisa Next.js lagi atau Vite. Karena kodenya sudah dipisah dalam paket sejak awal, migrasinya tidak sakit. Untuk sekarang, monorepo adalah over-engineering.

Mau kubuatkan struktur folder Next.js-nya (route group, middleware, lokasi kebijakan akses) sebagai langkah berikutnya?

## User:

Untuk awal pengembangan, apa saja tahapan yang harus dilakukan? Misalnya fokus ke fungsional web, pengembangan backend first hingga matang baru menuju frontend? Atau bagaimana?

## Assistant:

> Menyusun tahapan slice bertahap dari fondasi tipis.

**Jangan backend-first sampai matang.** Pendekatan yang lebih aman adalah **fondasi tipis dulu, lalu vertical slice**: tiap tahap membangun satu fitur utuh dari database sampai tampilan, lalu dicoba dengan data dan editor nyata. Backend yang "matang" tanpa frontend hanya berisi asumsi yang belum teruji.

Yang sebaiknya dikunci di awal adalah yang paling mahal diubah: model data, aturan akses (`access_level` dan entitlement), struktur URL/slug, dan strategi bilingual. Sisanya (UI, copy, learning hub) boleh iteratif.

## Tahapan

**0. Persiapan (beberapa hari sampai seminggu)**
- Inventarisasi tipe konten (publikasi, penulis, topik, event, halaman, learning hub) dan kolom tiap tipe.
- Tulis user story dan matriks akses: anonim, terdaftar, subscriber, editor, admin.
- Putuskan pola terjemahan dan buat wireframe kasar tiga halaman: daftar publikasi, detail publikasi, search.
- Gunakan kedua situs referensi sebagai inspirasi struktur saja. Jangan salin konten atau desainnya.

**1. Spike teknis (1–2 hari)**
Next.js + Payload + Supabase Postgres + Supabase Auth + satu PDF yang digating. Tujuannya membuktikan integrasi bisa jalan sebelum kamu berkomitmen.

**2. Fondasi**
- Repo, TypeScript, lint, dan CI. Vercel preview untuk tiap PR.
- Tiga lingkungan: dev, staging, dan produksi, masing-masing dengan project Supabase sendiri.
- Migrasi lewat file (Payload dan Supabase CLI), jangan ubah skema lewat dashboard.
- Routing i18n, layout dasar, storage adapter, SMTP, dan Sentry.
- Model data inti beserta `access_level`, plus tes otomatis untuk matriks akses sejak awal.

**3. Slice 1: publikasi end-to-end** *(nilai terbesar)*
Koleksi di Payload → editor input konten → halaman daftar dan detail (SSG/ISR, meta SEO, og image, hreflang) → search dasar → PDF publik. Deploy ke staging, lalu minta calon editor memasukkan konten nyata. Di sini kamu belajar apakah alur admin-nya benar-benar nyaman.

**4. Slice 2: akun dan gating**
Registrasi, login, area akun minimal, PDF eksklusif via signed URL. Entitlement diberikan manual oleh admin dulu, tanpa pembayaran. Lengkapi tes Playwright untuk semua peran.

**5. Slice 3: pendukung**
Learning hub, event, halaman statis, dan newsletter.

**6. Slice 4: subscription**
Pembayaran di mode sandbox → webhook idempotent → tabel `subscriptions` → halaman tagihan → uji alur gagal bayar, kedaluwarsa, dan perpanjangan → produksi.

**7. Penguatan dan peluncuran**
- Performa (Core Web Vitals), sitemap, robots, structured data, dan aksesibilitas.
- Review keamanan: RLS, secret, dan peran staf.
- Uji restore backup Supabase, pasang monitoring, dan siapkan kebijakan privasi sesuai UU PDP.
- Migrasi konten dan redirect, bila ada situs lama.

## Aturan kerja selama pengembangan
- Satu slice dianggap selesai jika bisa didemokan di staging dan dicoba orang lain, bukan sekadar kodenya jadi.
- Desain visual boleh berjalan paralel (Figma, dll.), tapi jangan finalisasi pixel-perfect sebelum Slice 1 teruji dengan konten asli.
- Urutan Slice 3 dan 4 bisa ditukar sesuai prioritas bisnis. Slice 1 dan 2 sebaiknya tetap berurutan karena Slice 2 bergantung pada model data Slice 1.

Mau kubuatkan breakdown tugas (backlog) terperinci untuk tahap 1 sampai Slice 1?

Powered by Claude Exporter (https://www.ai-chat-exporter.net)
