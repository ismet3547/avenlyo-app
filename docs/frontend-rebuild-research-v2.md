# Avenlyo — Sıfırdan frontend yenileme araştırması

- **Tarih:** 18 Ekim 2026 · Europe/Istanbul
- **Repo:** [ismet3547/avenlyo-app](https://github.com/ismet3547/avenlyo-app)
- **Yeni çalışma branchi:** `feat/frontend-rebuild-v2`
- **İncelenen ana sürüm:** `ed945629cfe04b7097c6a94e8699603f2b9b5792`
- **Aşama:** Araştırma ve tasarım önerisi. Uygulama kodu yazılmadı.

Bu rapor; kaynak kodundan doğrulanan mevcut durumu, resmi ürün ve teknik kaynaklardan edinilen bilgileri ve Avenlyo için önerilen kararları ayrı tutar. Öneriler bir kullanıcı araştırmasının ölçülmüş sonucu veya seçilmiş nihai tasarım değildir.

## Karar özeti

Avenlyo'nun yeni frontend'i, müşterinin konuşmasını ve ekip üyesinin o anda yapabileceği işi merkeze almalı. Kullanıcı bir konuşmayı açtığında **kim yanıtlıyor, AI çalışıyor mu, benim yapmam gereken ne** sorularını hemen cevaplayabilmeli.

Araştırmanın önerdiği başlangıç:

1. **Yeni arayüz katmanını mevcut Next.js/React yapısı üzerinde kurmak.** Route, oturum, API ve veri sözleşmelerini başlangıç zemini olarak kullanmak; sayfa kompozisyonunu ve bileşen sistemini yeniden tasarlamak.
2. **Konuşma odaklı, kuyruğuna kolay dönülebilen bir çalışma alanını denemek.** Müşteri ayrıntılarını ve bildirim kayıtlarını ihtiyaç anında açmak. Ana işlem, konuşmanın durumu ile aynı yerde bulunmalı.
3. **Kurulum ile günlük operasyonu farklı önceliklerle sunmak.** Yeni çalışma alanında doğru ilk adım; aktif kullanımda bekleyen gerçek müşteri işi öne çıkmalı.
4. **Test verisini görünür biçimde ayırmak.** Mevcut ana ekran ve talepler listesi test kayıtlarını da kapsıyor. Operasyonel göstergelerin kapsamı yeniden tanımlanmalı.
5. **Tasarım kararından önce iki farklı yerleşimi aynı görevlerle karşılaştırmak.** Renk, font ve animasyon seçimini yapısal kararın yerine kullanmamak.

Önerilen başarı ölçütü: kullanıcı müşteri işini bulur, yetkisini anlar ve sonucu belirsizleştirmeden bir sonraki işlemi tamamlar. Görsel karakter bu davranışı desteklemeli.

## 1. Repo, branchler ve başlangıç noktası

| Kaynak | İncelenen sürüm | Bulgusu ve araştırmadaki rolü |
| --- | --- | --- |
| `main` | `ed945629cfe04b7097c6a94e8699603f2b9b5792` | Website Chat, Instagram ve insan devralmasını içeren çalışmanın mevcut varsayılan tabanı. Yeni branch için seçilen başlangıç. |
| `feat/product-ui-v1` | `163431736271e1ce58ba4389e5527e0c905df3d2` | [Açık taslak PR #3](https://github.com/ismet3547/avenlyo-app/pull/3). Product UI V2 başlıklı bir uygulama değişikliği içeriyor; `main` ile birleşmemiş. |
| `feat/frontend-recreation-v1` | `aaa34e726ceb331fa380e13a6e2396553a56823a` | Önceki araştırmalar, wireframe'ler, görsel yönler ve referans görselleri. `main` ile karşılaştırmada `apps`, `packages`, `supabase` veya lockfile değişikliği yok. |

Önceki araştırma branchindeki üç Inbox karşılaştırması, rafine edilmiş Inbox görseli ve yeni nesil ürün referans panosu görsel olarak incelendi. Bu çalışma onların sonuçlarını güncel bir tasarım tercihi saymaz; aynı sorunları tekrar üretmemek için referans olarak değerlendirir.

**Önemli gözlem:** önceki üç görsel yönde navigasyon, kuyruk, konuşma ve bağlam sütunu büyük ölçüde aynı kalıyor. Bu, renk ve tipografi karşılaştırması sağlar; farklı bir kullanım modelini sınamak için yeterli değildir. Yeni çalışma önce ekranın neyi öne çıkardığını değiştirmeli.

Yeni branchin ilk değişikliği bu araştırma belgesidir. Nihai görsel yön, uygulama kapsamı ve geçiş sırası birlikte netleştirildikten sonra frontend uygulaması başlayabilir.

## 2. Yöntem ve kanıt sınırları

Bu turda GitHub üzerinden repo, branchler ve açık PR incelendi; kaynak kodu yerel bir kopyada tarandı. Ana sayfalar, layout, formlar, konuşma bileşenleri, oturum/üyelik yardımcıları, API geçişleri, paylaşılan tipler ve ilgili konuşma RPC'leri okundu. Mevcut test yapılandırması ve iki tarayıcı akışı gözden geçirildi.

Ana sürümde kaynak envanteri:

| Ölçüm | Sonuç | Anlamı |
| --- | --- | --- |
| `page.tsx` dosyası | 19 | Dinamik ayrıntı sayfaları, auth, demo ve yönlendirme sayfası dahil; 19 ayrı kullanıcı işi anlamına gelmez. |
| Web TSX dosyası | 42 | Sayfalar, layout ve bileşenler dahil. |
| `use client` içeren TSX | 11 | Etkileşimli katman zaten kısmen ayrılmış. |
| `components/ui` temel bileşeni | 5 | Button, Badge, Input, Card, Textarea. Tam bir tasarım sistemi henüz yok. |
| Web TSX içinde `next/font` kullanımı | 0 | CSS'te Inter adı var; bu, font dosyasının uygulama tarafından yüklendiğini kanıtlamıyor. |
| Mevcut tarayıcı senaryo dosyası | 2 | Foundation ve Channels akışları. |

**Bu araştırmanın sınırı:** oturum açılmış canlı bir müşteri çalışma alanı gezilmedi; yerel uygulama ve kabul testleri çalıştırılmadı. Ortamda Docker ve Supabase CLI bulunmuyor. Bu nedenle hız, gerçek cihaz davranışı, erişilebilirlik uyumu veya canlı sağlayıcı teslimatı için ölçülmüş sonuç iddia edilmiyor. PR açıklamasındaki doğrulama beyanları da bu turun test sonucu değildir.

Rakip araştırması resmi yardım sayfaları, ürün sayfaları ve sürüm notlarına dayanır. Ürünlerin hesap gerektiren alanlarında deneme yapılmadı. Mevcut repo panolarındaki statik görseller incelendi; rakiplerin bütün ekranları ve animasyon süreleri ölçülmedi.

## 3. Ürün neyi çözmeye çalışıyor?

Kaynaklardan çıkan ürün modeli: işletmenin yayımladığı bilgilerle soruları cevaplamak, gerçek hizmet ilgisini ve müşteri tarafından belirtilen iletişim bilgilerini kaydetmek, gerektiğinde konuşmayı ekibe devretmek.

İlk tasarım hipotezi, küçük bir işletme sahibi ve az kişili ekibin kullanımıdır. Hedef sektör, ekip büyüklüğü ve günlük mesaj hacmi bu turda kullanıcıdan doğrulanmadı.

| Kullanıcı / bağlam | Temel iş | Tasarım sonucu |
| --- | --- | --- |
| İşletme sahibi, ilk kurulum | İşletmesini anlatmak, bilgi yayımlamak, ajanı denemek, kanal açmak | Bağımlılıkları açıklayan kısa kurulum yolu; her adım gerçek kayıtlardan türetilmeli. |
| İşletme sahibi, günlük kullanım | Bekleyen konuşmayı ve işe dönüşebilecek talebi görmek | Operasyonun başında müşteri işi; kurulum açıklamaları gerektiğinde görünmeli. |
| Ekip üyesi | Konuşmayı devralmak ve güvenle cevaplamak | Sahiplik, AI durumu ve gönderim sonucu sürekli anlaşılır olmalı. |
| Website Chat ziyaretçisi | İşletme hakkında yanıt veya bir insana erişim | Küçük, okunaklı ve klavyeyle kullanılabilir widget; durumlar sade dilde anlatılmalı. |
| Instagram müşterisi | Başlattığı DM konuşmasını sürdürmek | Kanalın mevcut metin ve cevap penceresi sınırları doğru temsil edilmeli. |

### Dört ana akış

**Kurulum:** hesap → çalışma alanı → işletme bilgisi / yapılandırılmış ajan ayarları → Text veya FAQ taslağı → yayımlama → kayıtlı ayarlarla test → kanal kurulumu.

**Günlük iş:** gerçek konuşmalar → ilgili konuşma → mevcut durum ve müşteri mesajları → uygunsa devralma → insan yanıtı → kaydedilme / sağlayıcı kabulü / belirsizlik sonucunu görme.

**Bilgi güncelleme:** yayımlanmış içeriği düzenleme → taslağa dönüşme → inceleme → yeniden yayımlama → kayıtlı bilgiyle test. Bu geçiş görünür olmalı; düzenleme sonrası içeriğin hâlâ kullanıldığı izlenimi oluşmamalı.

**İnsan müdahalesi:** AI durur → konuşma uygun üye tarafından devralınır → ekip cevaplar → bırakma veya açıkça AI'ı sürdürme. Bırakma işlemi AI'ı kendiliğinden çalıştırmaz.

## 4. Mevcut frontend'in öncelikli bulguları

Buradaki önem sırası tasarım ve uygulama planlaması içindir. Kullanıcı testleriyle ölçülmüş hata sıklığı değildir.

| Öncelik | Gözlem | Kaynak | Yenileme kararı |
| --- | --- | --- | --- |
| P0 | Konuşma, AI, sahiplik, talep niteliği ve teslimat rozetleri yan yana okunuyor. | `inbox-conversation.tsx`, `inbox/page.tsx` | Her durumu ayrı anlamıyla ele al; önce kimin yanıtlayabileceğini göster. |
| P0 | Devralma işlemi yan kartta, yazma alanı konuşmanın altında. | `inbox-conversation.tsx` | Devralma ve yanıt verme geçişini aynı işlem alanında birleştir. |
| P0 | Ana ekran metrikleri testleri içeriyor; Leads sorgusu da tüm kaynakları getiriyor. | `app/app/page.tsx`, `leads/page.tsx` | Müşteri operasyonu ile test kapsamını açıkça ayır; sayaçları doğru kaynakla hesapla. |
| P0 | Kaydetme, yayımlama ve test etme farklı sonuçlar doğuruyor. | Knowledge actions/form, Test Agent | Her işlemin neyi değiştirdiğini kendi bağlamında belirt. |
| P0 | Sonucu doğrulanamayan gönderimlerde aynı içerik ve kimliğin korunması gerekiyor. | TestChat, InboxConversation, widget | Yeniden deneme sırasında yeni mesaj üretme; belirsizliği başarı gibi göstermeme. |
| P1 | Tüm sayfalar aynı genişlik ve padding sınırına alınıyor. | `app/app/layout.tsx` | Inbox için ekranı kullanan çalışma alanı; belge ve ayarlar için uygun okuma genişliği. |
| P1 | Inbox ve Conversations ayrı ana menülerde; Conversations müşteri ve test kayıtlarını birlikte listeliyor. | Sidebar, Conversations page | Müşteri işi Inbox'ta; test geçmişi Agent / Test altında bulunabilir. Eski URL'ler korunmalı. |
| P1 | Ana ekran üç kurulum kartı, üç metrik kartı ve ek çağrı alanını birlikte sunuyor. | `app/app/page.tsx` | İlk kullanım ve aktif kullanım için farklı öncelik sırası. |
| P1 | Knowledge iki sütunlu kartlarla en fazla 100 öğe getiriyor. | `knowledge/page.tsx` | Başlık, tür, yayın durumu ve son değişikliğin taranabildiği satır yapısı. |
| P1 | Leads mobilde en az 650px genişlikte tablo kullanıyor. | `leads/page.tsx` | Küçük ekranda birincil iletişim ve konuşma bağlantısını içeren satırlar. |
| P1 | Agent formunun üstündeki serbest brief, runtime'a verilen talimat değil. | `schemas.ts`, runtime ve mimari | Brief'in idari not rolünü açıkla; davranışı değiştiren gerçek kontrolleri öne çıkar. |
| P1 | Hata ve auth metinlerinde yerel Supabase kurulumu, migration ve localhost posta kutusu anlatılıyor. | AppError, AuthForm, auth actions | Kullanıcıya anlaşılır hata / toparlanma yolu; geliştirici teşhisini ürün akışından çıkar. |
| P1 | Bazı metadata ve işlem açıklamaları 10px. Font ailesi uygulama tarafından sabitlenmemiş. | CSS ve bileşenler | Okunabilir ölçek, denetlenen font yükleme ve uzun metin denemeleri. |
| P1 | Tek genel loading iskeleti farklı sayfaları temsil ediyor. | `app/app/loading.tsx` | Liste, konuşma ve editör için yerleşime uygun yüklenme görünümü. |
| P2 | Polling başarısızlığı hata yazıyor; arka plan güncellemesinin sonraki başarısı aynı hata alanını temizlemiyor. | `inbox-conversation.tsx` polling bölümü | Bağlantı sağlığını işlem hatasından ayır; toparlanmayı görünür kıl. Çalışma zamanı testi gerekli. |
| P2 | Menü, kart ve sayfa açıklamalarında tekrar eden eğitim metni var. | Sidebar ve PageHeader kullanımları | İlk kullanım yardımı kısa ve bağlamsal; sık kullanımda işin kendisine daha fazla alan. |

## 5. Karşılaştırmalı ürün araştırması

Bu ürünler aynı kullanıcı kitlesine veya kapsama sahip değil. Amaç özellik sayısını eşitlemek değil; belirli bir etkileşim problemini nasıl çözdüklerini anlamak.

| Ürün / yüzey | Doğrulanan örüntü | Avenlyo'ya aktarılabilir karar | Kapsam sınırı |
| --- | --- | --- | --- |
| [Intercom Inbox](https://www.intercom.com/helpdesk/inbox) ve [Fin](https://fin.ai/help/en/articles/13975995-fin-ai-agent-explained) | Bilgi, test, kanal kullanımı ve insan devri ilişkili iş akışları olarak açıklanıyor. | Yayımlanmış bilgi → kayıtlı ayarlarla test → müşteri konuşması arasında açık geçişler. | Fin'in puanlama, kapsamlı simülasyon ve prosedür özellikleri Avenlyo'da mevcut sayılmamalı. |
| [Front Inbox](https://help.front.com/en/articles/3889728) ve [AI ataması](https://help.front.com/en/articles/4991744) | Daraltılabilir navigasyon, kompakt konuşma başlığı, açık atama ve AI/insan iş paylaşımı. | Konuşmaya alan açan kabuk; işlem yetkisini başlık ve yazma alanıyla bağlama. | Front'un Open/Later/Done, atama kuralları ve hover davranışları doğrudan kopyalanmamalı. Avenlyo'nun karşılık gelen veri ve işlemleri farklı. |
| [Crisp Shared Inbox](https://crisp.chat/en/shared-inbox/) | KOBİ iletişimini ortak gelen kutusunda ve müşteri bağlamında birleştirme yaklaşımı. | Küçük ekibin az sayıda temel işlemi öğrenerek kullanabilmesi; kanalın konuşmanın kaynağı olarak görünmesi. | Profil zenginleştirme, analitik veya bütün kanal entegrasyonları mevcut ürün kapsamı değildir. |
| [Plain](https://www.plain.com/) | Çok kanallı müşteri konuşması ile AI ve insan çalışmasını aynı bağlamda anlatıyor. | Konuşmayı birincil iş nesnesi yapmak; kaynak ve aktörü anlaşılır biçimde göstermek. | Genel otomasyon, çoklu ajan ve sistemler arası işlem yetenekleri bu yenilemeye otomatik olarak dahil olmaz. |
| [Linear Inbox](https://linear.app/docs/inbox), [3 Eylül 2026 güncellemesi](https://linear.app/changelog/2026-09-03-priority-inbox) | Önem gerektiren işin ayrılması, liste ile ayrıntı arasında hızlı gezinme ve klavye desteği. | Bekleyen gerçek işin daha kolay bulunması; seçimi ve dönüş konumunu koruyan kuyruk. | Linear'ın Inbox'ı bildirim merkezidir. Okunmamış / erteleme / öncelik sınıfları Avenlyo'ya hazır özellik olarak taşınamaz. |
| [Attio kayıt sayfası, 28 Mayıs 2026](https://attio.com/changelog/2026/record-page-redesign) | Başlık ve ana işlemler yakın; ek alanlar ve yorumlar gerektiğinde açılıyor; otomasyon olayları başlangıçta daraltılıyor. | Müşteri talebinin temel bilgileri ile konuşmaya geçişi yakın tutmak; ikincil kayıt ayrıntılarını açılır hale getirmek. | Zengin CRM kayıt modeli, pipeline veya otomasyon geçmişi varmış gibi gösterilmemeli. |
| [Granola görsel yenilemesi](https://www.granola.ai/blog/a-new-look-for-granola) | Sakin çalışma deneyimi ile kendine ait görsel kimliğin birlikte ele alınması. | Avenlyo'nun karakterini okunabilirlik, tipografi ve tutarlı çalışma yüzeyinde kurmak. | Granola'nın marka arka planı uygulama zemini gibi alınmamalı; not alma işi ile müşteri operasyonu farklı. |
| [Notion Mail lansmanı, 15 Nisan 2025](https://www.notion.com/releases/2025-04-15) | Belirli işlere odaklanan görünümler ve bağlam içinde yazma. | Kullanıcıya gerçekten gereken alt kümeyi açık adlarla göstermek. | Özel görünümler, AI etiketleme ve zamanlama mevcut Avenlyo yeteneği değildir. Bu kaynak tarihli bir tasarım örneğidir. |

**Sentez — araştırmacı yorumu:** en güçlü ortak ders, işlem ile bağlam arasındaki mesafeyi azaltmak. Daha az görünür kontrol ancak temel işin bulunabilirliğini koruyorsa yararlı. Bu çıkarım, Avenlyo kullanıcılarıyla yapılmış bir karşılaştırmalı test sonucu değildir.

## 6. Önerilen bilgi mimarisi

Ana navigasyon günlük müşteri işi ile ajan hazırlığını gruplayabilir. Çalışma alanı seçimi ve hesap işlemleri ayrı bir hesap alanında bulunabilir.

| Grup | Kullanıcı etiketi adayı | Mevcut route | Gerekçe / değişiklik |
| --- | --- | --- | --- |
| Günlük iş | Genel bakış / Home | `/app` | Kurulum veya bekleyen müşteri işi, çalışma alanının durumuna göre öne çıkar. |
| Günlük iş | Gelen kutusu / Inbox | `/app/inbox`, `/app/inbox/[id]` | Gerçek müşteri konuşmalarının ana çalışma alanı. |
| Günlük iş | Talepler / Inquiries | `/app/leads`, `/app/leads/[id]` | İletişim bilgili hizmet ilgisi; CRM pipeline anlamı yüklemeden. |
| Ajan hazırlığı | Ajan / Agent | `/app/agent` | Hedef, ton ve iletişim alanları. |
| Ajan hazırlığı | Bilgi / Knowledge | `/app/knowledge`, `/new`, `/[id]` | Kullanım yetkisi yayımlamayla verilen bilgi kütüphanesi. |
| Ajan hazırlığı | Kanallar / Channels | `/app/channels` | Website Chat kurulumu ve Instagram'ın gerçek yönetimli durumu. |
| Agent içinden | Test ve test geçmişi | `/app/test-agent`, mevcut `/app/conversations` | Testlerin müşteri operasyonuna karışmasını azaltır. Geçmiş sorgusunun kapsamı ayrıca düzeltilmeli. |
| Hesap / çalışma alanı | Ayarlar, çalışma alanları, çıkış | `/app/settings`, `/workspaces` | Sık kullanılan müşteri işlerinden daha düşük görsel öncelik. |

Menü dili henüz seçilmedi. Mevcut uygulama İngilizce ve kök `lang` değeri `en`. Türkçe ilk arayüz seçilirse yalnızca menü adları değil, formlar, hata metinleri, tarih biçimi ve sayfa dil bilgisi birlikte ele alınmalı.

Eski derin bağlantılar korunmalı. Conversations içindeki gerçek konuşmaların Inbox'a gitmesi sürdürülebilir; test geçmişi için açık bir giriş ve `test_agent` kapsamı gerekir.

## 7. Önce sınanması gereken yapısal seçenekler

| Yaklaşım | Yerleşim ve çalışma biçimi | Güçlü taraf | Doğrulanacak nokta |
| --- | --- | --- | --- |
| A — Kuyruk odaklı | Masaüstünde sürekli kuyruk + konuşma; ayrıntılar gerektiğinde açılır. | Çok sayıda konuşma arasında karşılaştırma ve hızlı geçiş. | Az veri bulunan çalışma alanında gereksiz alan kaplıyor mu? |
| B — Konuşma odaklı | Konuşma baskın; kuyruk daraltılabilir veya açılabilir; bağlam paneli isteğe bağlı. | Uzun mesajları okuma ve cevaplama için sakin yüzey; daha dar ekranlara uyarlanabilir. | Sıradaki iş ve listeye dönüş kolay bulunuyor mu? |
| C — İş özeti odaklı | Girişte gerçek kurulum engelleri ve müdahale gereken işler; ilgili nesneye geçiş. | Ara sıra giren işletme sahibinin nereye başlayacağını anlaması. | Ana ekran ile Inbox arasında fazladan yönlendirme oluşturuyor mu? |

**İlk öneri:** B'yi ana Inbox hipotezi, A'yı karşılaştırma seçeneği yapmak. C'nin faydalı kısmını Home önceliklendirmesinde sınamak. Geniş ekranda kuyruk görünürlüğü korunabilir; kalıcı dört sütun bir tasarım şartı olmamalı.

İki prototip aynı içerik ve görevlerle karşılaştırılmalı: aynı konuşmalar, aynı uzun mesaj, aynı sahiplik çakışması, aynı belirsiz gönderim. İlk turda nötr bir görsel dil kullanmak, yerleşimin etkisini daha anlaşılır kılar. Sonraki görsel turda font ve renk değişkenleri ayrıca değerlendirilebilir.

## 8. Ekran bazlı yenileme brief'i

| Yüzey | Yeni deneyimin merkezi | Birincil işlem | Tasarımın koruyacağı gerçek |
| --- | --- | --- | --- |
| Sign in / Sign up | Kısa form, anlaşılır doğrulama ve sonuç | Giriş / hesap oluşturma | Mevcut email/parola akışı; çalışmayan SSO veya parola sıfırlama bağlantısı eklenmemeli. |
| Workspaces | İşletmeyi seçme veya oluşturma | Çalışma alanına geç / oluştur | Seçim yetki değildir; üyelik sunucuda kontrol edilir. |
| Home — yeni | Gerçek eksik adımlardan bir sonraki iş | Bilgi ekle, yayımla veya test et | Tek bir yapay hazır olma yüzdesi üretmek yerine koşullar ayrı gösterilmeli. |
| Home — aktif | Müdahale gereken müşteri işi ve son etkinlik | Konuşmayı aç | Yüklenen alt küme tüm kuyruk gibi sunulmamalı; test sayıları ayrılmalı. |
| Inbox listesi | Müşteri, son mesaj, kaynak ve işlem gereksinimi | Konuşmayı aç | Mevcut snapshot 50 kayıttır; okunmamış durumu yoktur. |
| Inbox konuşması | Okunabilir geçmiş, açık sahiplik, durumla ilişkili işlem | Devral / insan yanıtı gönder | Başka üyenin sahipliği, duraklama ve belirsiz gönderim korunur. |
| Talep listesi | İletişim, ilgi, kaynak ve nitelik | Konuşmayı aç | Tek konuşmaya bağlı talep; tüm kayıtların mevcut iş durumu `new`. |
| Talep ayrıntısı | Müşterinin verdiği bilgiler ve kısa talep özeti | Bağlı konuşmayı aç | Doğrulanmış kimlik veya kanallar arası birleşik müşteri profili varsayılmaz. |
| Agent | Yapılandırılmış davranış seçenekleri ve kaydetme durumu | Ayarları kaydet | Serbest brief runtime talimatı değildir; insan devri zorunlu. |
| Knowledge listesi | Hızlı taranan başlık, tür, yayın durumu ve tarih | Bilgi ekle / ilgili öğeyi aç | Text ve FAQ mevcut; URL tarayıcı veya dosya içe aktarma hazır değildir. |
| Knowledge editörü | İçeriği yazma ve yayın etkisini anlama | Taslağı kaydet; ayrı yayımla | Düzenleme yayımlanmış öğeyi taslağa döndürür. |
| Channels | Her kanalın gerçek durumu ve ilgili sonraki adım | Website Chat'i yapılandır | Website Ready, ilk müşteri mesajının geldiği anlamına gelmez. |
| Instagram bölümü | Bağlı hesap veya yönetimli kurulum bilgisi | Mevcut yönetim işlemi | Self-service OAuth akışı yok; sahte “Instagram'a bağlan” düğmesi gösterilmemeli. |
| Test Agent | Açık test bağlamında gerçek kayıtlı ayarları deneme | Test mesajı gönder | Kaydedilmemiş ayarları veya taslak bilgiyi kullanıyormuş izlenimi verilmemeli. |
| Test geçmişi | Test oturumunu bulma ve sürdürme | Teste devam et | Gerçek müşteri Inbox'ından ayrılır; eski route erişimi korunur. |
| Settings | İşletme adı ve gerekli çalışma alanı bilgisi | İşletme adını kaydet | Davet, faturalama, üye yönetimi ve bildirim alıcısı ayarı mevcut değil. |
| Website widget | Kısa karşılama, mesajlaşma ve insan bekleme durumu | Mesaj gönder / aynı mesajı yeniden dene | Ziyaretçi oturumu, geçmiş, kaynak ve teslimat mantığı korunur. |
| Loading / empty / error | Kullanıcının bulunduğu işe uygun açıklama | İlgili toparlanma veya başlangıç işlemi | Yükleme, gerçek boşluk, filtre sonucu yokluğu ve hata ayrı durumlardır. |

### Home ayrıntısı

Yeni çalışma alanında kurulum öne çıkabilir; aktif çalışma alanında bekleyen gerçek iş önce gelmeli. Kurulum tamamlandı bilgisini `setup_brief` dolu olması gibi tek bir işaretten üretmek yeterli değildir. Yayımlanmış bilgi, kayıtlı ayarlar, test geçmişi ve kanal durumu ayrı gerçeklerdir.

Bir kanalın etkin olması, tüm kurulumun veya mesaj akışının uçtan uca doğrulandığı anlamına gelmez. “Hazır”, “etkin” ve “müşteri mesajı alındı” etiketleri kendi kanıtlarıyla gösterilmeli.

### Agent ayrıntısı

Hedefler, ton ve istenen iletişim bilgileri düzenleme alanının ana unsurları olmalı. Kaydedilmemiş seçimlerden üretilen açıklama varsa “düzenlediğiniz yapılandırma” olarak etiketlenmeli. Gerçek Test Agent son kaydedilen ayarları ve yayımlanmış bilgiyi kullanır.

Uzun bir form ile aynı içeriği tekrar eden kalıcı bir özet sütunu yerine, değişikliğin etkisini ilgili kontrolün yanında açıklamak sınanabilir. Kaydetme durumu ve test bağlantısı kolay bulunmalı.

## 9. Konuşma durum modeli: tasarım sözleşmesi

AI modu, sahiplik, talep niteliği ve teslimat birbirinden farklı boyutlardır. Tek bir renkli “durum” etiketi hepsini temsil etmemeli.

| Gerçek durum | Görünür ana açıklama adayı | Birincil işlem | Sonuç |
| --- | --- | --- | --- |
| AI aktif, atama yok | AI yanıtları etkin | Gerekliyse konuşmayı devral | Sunucu onayından sonra atama oluşur ve AI durur. |
| AI durmuş, atama yok | Ekip yanıtı bekleniyor | Konuşmayı devral | Kullanıcı kendi adına sahiplenir; ardından yazabilir. |
| Kullanıcıya atanmış | Bu konuşmayı siz yönetiyorsunuz | İnsan yanıtı gönder | AI durmuş kalır; mesajın gerçek sonucu gösterilir. |
| Başka üyeye atanmış | Başka bir ekip üyesi yönetiyor | Konuşmayı oku | Yetkisiz gönderim veya devralma sunulmaz. Çakışma sonrası görünüm yenilenir. |
| Konuşma bırakılmış | Atanmamış · AI durmuş | Devral veya açıkça AI'ı sürdür | Bırakma AI'ı etkinleştirmez. |
| AI'ı sürdürme tamamlanmış | AI sonraki müşteri mesajına yanıt verebilir | Sonraki işe geç | Atama temizlenir; geçmişte bekleyen mesaja otomatik cevap üretilmez. |

Devralma bağlı talebin niteliğini `needs_human` durumuna da getirebilir. AI'ı sürdürmek talebi otomatik olarak önceki niteliğine döndürmez. Bu nedenle müşteri işi için hayali bir çözülme / tamamlanma zaman çizelgesi üretilmemeli.

### Yazma alanı

- Henüz devralınmamış konuşmada büyük, kullanılamayan textarea yerine kısa bir devralma açıklaması ve işlem sınanmalı.
- Başarılı devralmadan sonra odak yazma alanına geçebilir. Sunucu cevabı gelmeden yetki verilmiş gibi görünmemeli.
- Yazarken içerik, bağlantı kesintisinde ve aynı konuşmadaki görünüm değişiminde korunmalı. Kalıcı cihazlar arası taslak yeni bir özellik olarak ayrıca değerlendirilir.
- Desktop için `Cmd/Ctrl+Enter` kısayolu önerilebilir; textarea'da Enter yeni satır davranışı ve IME kullanımı korunmalı. Mobilde görünür gönder düğmesi temel yoldur.
- Belirsiz istekte yeniden deneme, aynı içerik ve aynı mesaj kimliğini kullanmalı. İstek belirsizken onunla çakışan yeni işlem açılmamalı.
- Kullanıcı eski mesajları okuyorsa yeni mesaj gelişi onu aşağı atlamamalı. Son mesaja dönüş açık bir işlemle sağlanabilir; bu gösterge kalıcı okunmamış sayacı sayılmamalı.

### Teslimat dili

| Backend durumu | Kullanıcıya anlatılabilecek gerçek | Kaçınılacak çıkarım |
| --- | --- | --- |
| `pending` | Gönderim bekliyor | Müşteriye ulaştı. |
| `sending` | Gönderiliyor | Kesin başarı. |
| Website `available` | Mesaj kaydedildi ve ziyaretçinin erişimine açık | Ziyaretçi okudu. |
| Instagram `sent` | Instagram mesajı kabul etti | Cihaza teslim edildi / okundu. |
| `unknown` | Gönderim sonucu doğrulanamadı | Başarısız olduğu kesin veya otomatik tekrar güvenli. |
| `failed` | Gönderim başarısız | Müşteri kaydı da silindi. |
| `blocked` | Gönderim engellendi; uygun neden açıklanır | Tekrar düğmesiyle sınırın aşılabileceği. |

Personel email bildirimi ayrı bir kayıt türüdür. Bildirim başarısızlığı, konuşmanın veya talebin hiç kaydedilmediği anlamına gelmez. Mevcut üründe zaten oluşturulmuş sağlayıcı teslimatını yeniden gönderme işlemi bulunmuyor.

## 10. Gerçek verinin tasarıma getirdiği sınırlar

| Veri / davranış | Şu anki sınır | Tasarım veya veri okuma kararı |
| --- | --- | --- |
| Inbox listesi | Son etkinliğe göre 50 gerçek konuşma; offset sayfalama | “Bu sayfada ara / filtrele” küresel arama gibi gösterilmemeli. Tam kuyruk filtresi ayrıca tanımlanmalı. |
| Konuşma geçmişi | Son 100 mesaj ve önceki mesaj cursor'ı | Önceki mesaj yükleme ve okuma konumu korunmalı. |
| Thread içindeki talep | Yalnızca id, ad, nitelik | Email, telefon, şirket ve özet için mevcut talep ayrıntısına gitmek veya yetkili ek okuma tasarlamak gerekir. |
| Knowledge ve Leads listesi | İlk sorguda en fazla 100 kayıt | Sonuçların kapsamı belirtilmeli; büyüme için sayfalama ayrı iş. |
| Conversations geçmişi | Test ve müşteri kayıtları birlikte | Test geçmişi olarak kullanılacaksa veri sorgusu `test_agent` kapsamına alınmalı. |
| Üye kimliği | Atanan kullanıcı kimliği; isim/avatar garantisi yok | Profil adı, fotoğrafı veya takım adı uydurulmamalı. |
| Instagram yanıtı | Repoda 24 saatlik kontrol ve 1000 UTF-8 byte insan yanıtı sınırı | Karakter sayacı tek başına yeterli değil; Türkçe ve emoji içeren mesajlar denenmeli. Bu, uygulanan repo sözleşmesidir. |
| Website kanal durumu | Enabled, izinli origin'ler ve son etkinlik | Etkinlik ile kurulum durumunu ayrı anlatmalı. |

Mevcut sözleşmede bulunmayan başlıca unsurlar: kalıcı okunmamış işareti, okundu bilgisi, yazıyor / çevrimiçi durumu, çöz / ertele işlemi, SLA, AI güven puanı, memnuniyet skoru, gelir veya dönüşüm oranı, pipeline aşamaları, dahili not, dosya eki, takım atama seçicisi ve kanallar arası müşteri birleştirme.

Bu alanlardan biri ürün kapsamına alınırsa yalnızca görsel kontrol eklemek yeterli değildir; veri modeli, yetki, API ve kabul senaryosu birlikte tanımlanmalıdır.

## 11. Teknoloji değerlendirmesi

### İncelenen bağımlılıklar

Kaynak: `apps/web/package.json` ve kök `package.json`. Bunlar repodaki sabit sürümlerdir; “en güncel sürüm” listesi değildir.

| Katman | Repodaki sürüm |
| --- | --- |
| Next.js | 16.4.0 |
| React / React DOM | 19.3.0 |
| Tailwind CSS | 4.3.3 |
| TypeScript | 5.9.3 |
| Supabase SSR / JS | 0.12.7 / 2.117.3 |
| Zod | 4.6.7 |
| pnpm | 9.15.9 |
| Node koşulu | 22.12.0 veya üstü |

### Karar matrisi

| Konu | Öneri | Neden / tekrar değerlendirme koşulu |
| --- | --- | --- |
| Framework | Next.js App Router üzerinde devam | Mevcut route, SSR oturum, Server Action ve API geçişleri yeniden platform kurmayı gerektirmiyor. [Resmi bileşen rehberi](https://nextjs.org/docs/app/getting-started/server-and-client-components). |
| Vite + React Router veya başka framework'e geçiş | İlk yenilemenin varsayılanı yapma | Görsel ve etkileşim hedefleri mevcut altyapıyla gerçekleştirilebilir. Ayrı platform gereksinimi ortaya çıkarsa oturum ve dağıtım maliyetiyle birlikte karar verilir. |
| Sunucu / istemci ayrımı | Veri ve oturum sunucuda; etkileşim sınırlı istemci bileşenlerinde | Kabuk ve bütün sayfaları tek büyük client uygulamasına dönüştürmeden yeni UI kurulabilir. |
| UI temeli | Mevcut Tailwind ve kaynak kodu sahiplenilen bileşen yaklaşımı | `components.json` shadcn düzeni tanımlıyor; mevcut beş primitive'den sistem büyütülebilir. [shadcn resmi yaklaşımı](https://ui.shadcn.com/docs). |
| Dialog / drawer / menü | Erişilebilir temel davranışı olan primitive seç; ilgili bileşeni özelleştir | Repoda Radix Slot var; bu bütün dialog/menu paketlerinin kurulu olduğunu göstermez. Gereken paketler uygulama sırasında açıkça seçilip sabitlenmeli. |
| Formlar | Mevcut Server Action + `useActionState` + Zod başlangıcı | Mevcut formlar için yeni form çatısı zorunlu görünmüyor. Karmaşık bağımlı alan ihtiyacı oluşursa değerlendirilir. |
| Global state | Önce URL, sunucu verisi ve yerel etkileşim state'ini ayır | Tekrarlanan veri sahipliği yaratmadan kuyruk, seçim, taslak ve işlem durumları yönetilmeli. Redux/Zustand varsayılan bağımlılık olmamalı. |
| TanStack Query / SWR | Polling ve cache ihtiyacı somutlaştığında tek veri sahibi olacak biçimde değerlendir | RSC, yerel state ve query cache aynı thread'in farklı gerçeklerini yönetmemeli. İlk karar yeni paket eklemek değildir. |
| Gerçek zaman | Önce mevcut polling sözleşmesini koru ve toparlanmayı iyileştir | Inbox 4 saniye, açık widget 2,5 saniye aralıklı sorguluyor. WebSocket/Realtime geçişi ayrı bir veri ve yetki kararı. |
| Hareket | İlk sürümde sınırlı CSS geçişleri | Panel ve durum geçişleri için yeterli olabilir. Ek animasyon paketi somut ihtiyaçla gerekçelendirilmeli. |
| Test altyapısı | Mevcut Playwright ve Vitest temeli | Yeni yapı davranış sözleşmelerini koruyarak test edilebilir. Erişilebilirlik taraması uygulama aşamasında eklenebilir. |
| Sürüm güncellemesi | Tasarımdan ayrı, küçük ve doğrulanan değişiklik | Bu araştırmada paket veya lockfile değiştirilmedi. Kodlamadan önce güncel resmi sürüm notları tekrar kontrol edilmeli. |

### Oturum ve API sınırı

Supabase'in güncel SSR belgeleri oturum verisinin doğrulanmasını vurguluyor. Mevcut proxy `getClaims`, üyelik yardımcıları `getUser` kullanıyor; API'ye token ancak doğrulama sonrasında aktarılıyor. Tasarım yenilemesi bu akışı ve çalışma alanı üyeliğini korumalı. `getSession` içindeki kullanıcı nesnesi tek başına yetki kaynağına dönüşmemeli. [Resmi SSR rehberi](https://supabase.com/docs/guides/auth/server-side/creating-a-client).

Mevcut `private, no-store`, origin kontrolü, sunucu doğrulaması ve API-only secret ayrımı korunmalı. Bu tur canlı Supabase projesine erişilmedi, güvenlik denetimi tamamlandığı iddia edilmiyor. [Changelog](https://supabase.com/changelog) araştırma sırasında incelendi; altyapı yükseltmesi yapılmadı.

### Önerilen frontend sorumlulukları

Bu tablo hedef düzen önerisidir; henüz dosya taşınmadı.

| Alan | Sorumluluk |
| --- | --- |
| `components/ui` | Button, Field, Menu, Dialog, Sheet, Tooltip, status metni gibi temel parçalar. |
| `components/shell` | Navigasyon, çalışma alanı seçimi, mobil kabuk, sayfa çerçevesi. |
| `features/inbox` | Kuyruk, konuşma, sahiplik işlemleri, yazma alanı, teslimat gösterimi. |
| `features/agent` | Yapılandırma, kaydetme durumu ve teste geçiş. |
| `features/knowledge` | Kütüphane, editör, yayın işlemleri ve sonuçları. |
| `features/leads` | Talep listesi, kanıtlı iletişim bilgileri ve konuşma ilişkisi. |
| `features/channels` | Mevcut kanal durumları ve kurulum kontrolleri. |
| `lib` / veri yardımcıları | Sunucudaki yetkili okumalar ve UI'ya uygun açık tipler. |
| `app` | Route bileşimi, erişim sınırı, loading/error ve sayfa metadata'sı. |

İlk bileşen haritası: AppShell, WorkspaceMenu, MobileNavigation, WorkSummary, SetupChecklist, ConversationQueue, ConversationRow, ConversationHeader, OwnershipActions, Transcript, ReplyComposer, DeliveryStatus, ContextDisclosure, InquiryRow, KnowledgeRow, PublicationActions ve FormFeedback.

Widget `apps/api/src/channels/widget.ts` içinde API tarafından sunuluyor. Görsel yenileme kapsamına alınabilir; oturum, retry, polling ve mesaj güvenliği aynı dosyada bulunduğundan sunum değişiklikleri bu davranışlardan dikkatle ayrılmalı. Web uygulamasının CSS'i widget'ın Shadow DOM'una kendiliğinden taşınmaz.

## 12. Görsel sistem için araştırma brief'i

Henüz nihai palet, logo veya font seçilmedi. Önce çalışma yüzeyi belirlenmeli; ardından aynı seçilmiş akış üzerinde görsel seçenekler karşılaştırılmalı.

| Karar alanı | Başlangıç önerisi | Gerekçe / kontrol |
| --- | --- | --- |
| Genel karakter | Sakin, net ve iş sırasında kullanılabilen bir ürün | Uzun konuşmalarda okunabilirlik; işlemlerin kolay ayırt edilmesi. |
| Tipografi | Tek güçlü UI ailesi; ana içerik 14–16px, metadata çoğunlukla 12–13px | Bunlar tasarım başlangıç değerleri; WCAG'nin zorunlu font boyutları değildir. |
| Font araştırması | Mevcut Inter ile Geist / Instrument Sans adaylarını gerçek metinlerde karşılaştır | Türkçe glifler, rakamlar, uzun işletme adları, lisans ve yükleme biçimi kontrol edilmeli. |
| Başlıklar | Her sayfada büyük pazarlama başlığı yerine işin ölçeğine uygun hiyerarşi | Inbox'ta konuşma ve yazma alanına yer bırakır. |
| Renk | Nötr yüzeyler, sınırlı marka vurgusu, ayrı işlevsel durum renkleri | Marka rengi duraklama, hata ve başarıyı aynı anda temsil etmemeli. |
| Durum | Metin + gerektiğinde ikon + renk | Renk algısına bağımlı olmayan açıklık. |
| Yüzey / sınır | İş gruplarını gerektiği kadar ayıran border ve boşluk | Her bilgi bir kart ve rozet gerektirmez. |
| Yoğunluk | Kuyrukta tarama; konuşmada okuma; editörde yazma odağı | Tüm ekranlara tek kart ölçüsü ve boşluk düzeni uygulamamak. |
| İkon | Tutarlı Lucide ailesi, açık işlem etiketleri | İkonun küçük olması etkileşim hedefinin küçük olmasını gerektirmez. |
| Radius / gölge | Az sayıda token; gölgeyi açılan katmanlarda kullan | Önceliği dekoratif kart katmanlarıyla karıştırmamak. |
| Karanlık tema | İlk kapsam kararı olarak ayrıca ele al | Yeni bir tema seçeneği eklenirse bütün semantik renk ve odak durumları doğrulanmalı. |

Renk token'ları role göre tanımlanmalı: canvas, surface, text, muted-text, border, accent, focus, success, attention, danger ve selection. AI'ın durmuş olması tek başına hata rengi gerektirmez; durum ve neden birlikte değerlendirilir.

## 13. Etkileşim ve hareket

Aşağıdaki süreler Avenlyo için başlangıç önerileridir; rakiplerden ölçülmüş değerler değildir.

| Etkileşim | Öneri | Korunacak davranış |
| --- | --- | --- |
| Hover / focus / seçim | Yaklaşık 100–150ms renk geçişi | Odak göstergesi beklemeden algılanmalı. |
| Ayrıntı paneli / mobil menü | Yaklaşık 160–220ms kısa geçiş | Açılış odağı, Escape, kapanışta odağın geri dönüşü. |
| Konuşma seçimi | Seçim hemen görünür; içerik gerçek yükleme durumunu gösterir | Yanlış müşterinin eski içeriği yeni başlık altında görünmemeli. |
| Devral / bırak / sürdür | Bekleme ve sunucu sonucu açık | İyimser görünüm yetki gerçeğini ileri almamalı. |
| Yeni mesaj | Okuma konumuna saygılı ekleme | Zorunlu otomatik kaydırma olmamalı. |
| Kaydet / yayımla | Yerel ve erişilebilir sonuç metni | Başarısız işlem başarılı renk / animasyon göstermemeli. |
| Yüklenme | İşe uygun iskelet; gerekirse sakin ilerleme metni | Yapay AI düşünme adımları veya ilerleme yüzdesi üretmemeli. |
| Reduced motion | Hareketi kaldıran veya belirgin azaltan alternatif | İşlem sonucu ve odak bilgisi yine görünür olmalı. |

Modal mobil menü veya modal bağlam paneli seçilirse WAI-ARIA dialog örüntüsüne uygun odak yönetimi gerekir. Masaüstü widget'ın modal olup olmadığı ayrıca açık seçilmeli; tüm ekranı kaplamayan bir widget'a yanlış modal davranış yüklenmemeli.

## 14. Mobil ve responsive davranış

| Genişlik / ortam | Denenecek yerleşim | Kritik doğrulama |
| --- | --- | --- |
| 1440px | Kuyruk + geniş konuşma; isteğe bağlı bağlam | Ayrıntılar açıkken metin sıkışmıyor; ana işlem görünür. |
| 1280px | Bağlam kapalı varsayılan; navigasyon daraltılabilir | Metin ve yazma alanı kullanılabilir genişlikte. |
| 1024px | Daha dar kabuk; kuyruk açılıp kapatılabilir | Sıradaki konuşmaya geçiş kaybolmuyor. |
| 768px | Liste ve konuşma için odaklı görünüm | Geri dönüş, seçili öğe ve kaydırma konumu korunuyor. |
| 390 / 360px | Tek ana görev yüzeyi; görünür geri ve ayrıntı işlemleri | Uzun ad, email, hata ve mesaj taşmıyor. |
| 320 CSS px | Reflow ve büyütme incelemesi | Ana iş için iki yönlü kaydırma gerekmiyor; gerekli tablo istisnaları ayrıca değerlendirilir. |
| iOS Safari / Android Chrome, klavye açık | Okunabilir konuşma ve erişilebilir gönderim | Yazma alanı klavyenin arkasında kalmıyor; odak kaybolmuyor. |

Sadece genişliği küçültülmüş masaüstü screenshot'ı mobil doğrulama sayılmaz. Dikey alan, dinamik viewport, safe-area, metin büyütme ve sanal klavye birlikte denenmeli. `dvh` kullanımı tek başına tüm klavye sorunlarının çözümü kabul edilmemeli.

## 15. Erişilebilirlik hedefleri

Hedef **WCAG 2.2 AA** olmalı. Başlangıç kontrolleri: normal metinde 4.5:1 kontrast, büyük metinde 3:1; AA minimum etkileşim hedefi 24×24 CSS px veya kriterin geçerli istisnaları. Sık kullanılan mobil işlemler için 44×44 hedef alanı tasarım tercihi olarak önerilir; 44px AA minimumu diye sunulmamalı. [WCAG Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/).

Klavye odağı görünmeli ve sabit başlık / footer altında tamamen gizlenmemeli. Modal açılışta odağı içeri almalı; Tab sırası içeride kalmalı; kapanışta uygun tetikleyiciye dönmeli. [WAI-ARIA modal dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

Form etiketi, hata ilişkisi, sayfa başlığı sırası, navigasyon adı, durum metni ve yeni mesaj duyuruları incelenmeli. Her polling sonucunu veya bütün geçmişi yeniden seslendirmek yerine anlamlı değişiklikler duyurulmalı. Otomatik tarama, elle klavye ve ekran okuyucu incelemesiyle tamamlanmalı; otomatik test tek başına uyum kanıtı değildir. [Playwright erişilebilirlik rehberi](https://playwright.dev/docs/accessibility-testing).

## 16. Performans ve algılanan hız

Mevcut sürüm için Lighthouse, Web Vitals veya bundle ölçümü yapılmadı. Aşağıdaki değerler hedef olarak önerilir:

| Ölçüm | Hedef | Doğrulama yaklaşımı |
| --- | --- | --- |
| LCP | En fazla 2,5 saniye | Mobil ve desktop gerçek kullanımda ayrı, p75. |
| INP | En fazla 200ms | Gerçek etkileşimler ve saha ölçümü. |
| CLS | En fazla 0,1 | Yüklenme, font ve panel değişimlerinde yerleşim kararlılığı. |

Kaynak: [Google Web Vitals](https://web.dev/articles/vitals). Lighthouse tek başına gerçek INP ölçümü yerine geçmez.

Uygulama kararları: istemci JavaScript sınırını küçük tutmak; fontları denetlemek; skeleton ölçülerini gerçek içerikle uyumlu kılmak; mesaj eklemelerinde gereksiz tüm ekran render'ını önlemek; büyük listeler için önce mevcut 50/100 kayıt sınırlarının gerçek davranışını ölçmek. Sanallaştırma veya yeni cache kütüphanesi ölçülen ihtiyaç olmadan başlangıç zorunluluğu değildir.

Widget'ın host sitenin ana işini ve mobil etkileşimini aksatmaması ayrıca ölçülmeli. Yapay gecikme veya gösterişli giriş animasyonu algılanan hız hedefinin parçası olmamalı.

## 17. Kapsamı üç düzeyde yönetmek

| Düzey | Örnekler | Çalışma biçimi |
| --- | --- | --- |
| Frontend sunumu ve etkileşimi | Kabuk, tipografi, navigasyon, kuyruk / konuşma yerleşimi, form feedback, responsive yapı, widget sunumu | Yenilemenin ana kapsamı. Mevcut iş ve yetki sözleşmeleri korunur. |
| Mevcut yetkilerle veri okuma düzenlemesi | Testleri müşteri sayaçlarından ayırma, test geçmişini filtreleme, izinli alanlardan ek talep bilgisi okuma | Açık sorgu kapsamı ve doğrulama gerektirir; yalnızca CSS değişikliği olarak değerlendirilmemeli. |
| Yeni ürün / backend yeteneği | Küresel arama, okunmamış durumu, çöz / ertele, notlar, ekler, takım profili, pipeline, gerçek analitik | Veri ve API tasarımı ayrı iş olarak ele alınır; tasarımda hazır özellik gibi kullanılmaz. |

Bağımsızlık sözleşmesi de korunmalı: bu repo kendi API ve Supabase sınırına sahip. Eski Avenlyo veya pazarlama reposu otomatik uygulama bağımlılığı haline getirilmemeli.

## 18. Yeni branch için uygulama yol haritası

Takvim tahmini verilmedi. Her adımın çıktısı ve tamamlanma koşulu netleştirilerek ilerlemek daha güvenilir.

| Sıra | Çıktı | Tamamlanma koşulu |
| --- | --- | --- |
| 0 | Bu araştırma ve karar günlüğü | Başlangıç SHA'sı, kapsam, mevcut yetenekler ve açık kararlar kayıtlı. |
| 1 | Kısa ürün brief'i ve iki yapısal wireframe | Home, Inbox, Agent ve mobil örnekler aynı senaryolarla karşılaştırılabilir. |
| 2 | Tıklanabilir etkileşim prototipi | Devralma, yanıtlama, belirsiz sonuç, bağlam açma ve geri dönüş denenebilir. Gerçek olmayan veri açıkça etiketli. |
| 3 | Seçilen görsel sistem ve temel bileşenler | Token'lar, tipografi, odak, buton, alan, dialog ve feedback durumları tutarlı. |
| 4 | Kabuk, auth ve çalışma alanları | Doğrudan URL, oturum, üyelik ve mobil navigasyon davranışları korunmuş. |
| 5 | Inbox'ın baştan sona uygulaması | Kuyruk → konuşma → devral → gönder / yeniden dene → bırak / sürdür akışı doğrulanmış. |
| 6 | Bilgi, Agent ve Test Agent | Taslak / yayımlanmış / kayıtlı ayar sınırları ve owner/member farkı açık. |
| 7 | Talepler, kanallar, Home ve ayarlar | Müşteri/test kapsamı doğru; mevcut kanal durumları gerçek kayıtlardan geliyor. |
| 8 | Widget ve bütünleşik kalite kontrol | Sunum yenilenmiş; ziyaretçi oturumu, retry ve insan yanıtı davranışı korunmuş. |
| 9 | İncelenebilir PR ve geçiş notu | Değişiklikler, davranış kanıtı, screenshot'lar ve kalan sınırlamalar somut. |

Her aşama küçük ve incelenebilir commit / PR parçalarıyla ilerleyebilir. Framework yükseltmesi, veri sözleşmesi genişletmesi ve görsel uygulama aynı büyük değişiklikte karıştırılmamalı.

## 19. Doğrulama planı ve kabul ölçütleri

### Korunacak ürün senaryoları

1. Owner bilgi ekler, taslak kaydeder, yayımlar ve kayıtlı ayarlarla test eder. Düzenleme sonrası tekrar yayımlama gereği anlaşılır.
2. Member ayarları ve bilgiyi görebilir; owner işlemi yapamaz. Gerçek konuşmayı yetkisi kapsamında devralabilir.
3. Website Chat müşterisi bir insana erişim istediğinde AI durur; ekip aynı konuşmadan devam eder.
4. İki üyenin devralma yarışında sunucunun gerçek sonucu arayüze yansır. Yetkisiz yazma açılmaz.
5. Bırakma AI'ı durmuş bırakır. Açık sürdürme sonraki müşteri mesajını etkiler ve sahipliği temizler.
6. Ağ cevabı kaybolursa aynı mesaj kimliğiyle tekrar edilir; ikinci müşteri / insan mesajı oluşturulmaz.
7. Instagram'ın mevcut byte ve cevap penceresi kontrolü doğru sonuç verir; `sent` ve `unknown` ayrılır.
8. Test konuşmaları ve test talepleri müşteri operasyonu gibi sunulmaz; personel bildirimi doğurmaz.
9. Uzun geçmiş, önceki mesaj yükleme ve yeni mesaj gelişi okuma konumunu korur.
10. Çalışma alanı değişimi, doğrudan ayrıntı URL'si ve oturum süresinin dolması sınırları korur.
11. Widget kapatıldığında odak uygun tetikleyiciye döner; yeniden açma ve belirsiz mesajı tekrar deneme çalışır.
12. Liste yüklenemediğinde “hiç iş yok” veya sıfır sayaç gösterilmez; toparlanma yolu bulunur.

### Kullanılabilirlik çalışması önerisi

İlk karşılaştırma için 3–5 hedef kullanıcıyla kısa görev oturumları yeterli bir başlangıç olabilir; bu sayı istatistiksel genelleme iddiası taşımaz. Görevler: müdahale bekleyen konuşmayı bulma, kimin yanıtlayabileceğini açıklama, devralıp cevaplama, bilgiyi güncelleyip yayımlama, test ile gerçek konuşmayı ayırma ve mobilde listeye dönme.

Önerilen ilk kabul eşiği: beş katılımcılı bir turda en az dört kişinin ana görevleri yönlendirme olmadan tamamlaması; hiçbir katılımcının bırakmayı AI'ı sürdürmek veya taslak kaydetmeyi yayımlamak olarak yorumlamaması. Tamamlama süresi ve işlem sayısı mevcut sürümle ölçülerek karşılaştırılmalı; bu raporda hız kazanımı ölçülmedi.

### Teknik kontroller

Uygulama aşamasında repo komutları ve CI gereklilikleri korunmalı: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`; ilgili değişiklikler için mevcut browser ve kabul akışları. Veritabanı kontrolleri uygun yerel / CI ortamında yapılmalı. Burada bu komutların geçtiği iddia edilmiyor.

Görsel kontrol en az 1440, 1280, 1024, 768, 390 ve 360px genişlikleri; boş, dolu, loading, hata, AI durmuş, başkasına atanmış ve belirsiz gönderim durumlarını içermeli. Chromium yanında WebKit ve Firefox kapsaması planlanmalı; gerçek iOS/Android klavye testi ayrıca gerekli.

## 20. Kodlamadan önce netleştirilecek kararlar

| Karar | Neyi değiştirir | Şimdiki varsayım |
| --- | --- | --- |
| İlk müşteri segmenti ve günlük mesaj hacmi | Kuyruk yoğunluğu, kurulum dili, Home önceliği | Küçük işletme / az kişili ekip bir hipotez. |
| İlk arayüz dili | Tüm ürün metni, `lang`, tarih ve dil genişliği testleri | Mevcut İngilizce kaynak korunuyor; Türkçe tercih doğrulanmadı. |
| A ve B yerleşimlerinin seçimi | Navigasyon, kalıcı kuyruk ve odaklı konuşma davranışı | B öneriliyor; görev testi sonucu henüz yok. |
| Widget'ın aynı turdaki kapsamı | İkinci yüzeyin görsel ve etkileşim QA miktarı | Aynı tasarım diline dahil edilmesi öneriliyor. |
| Yeni özellik beklentisi | Veri/API kapsamının büyüyüp büyümeyeceği | İlk kapsam mevcut ürünün frontend yenilemesi. |

Bir sonraki somut çalışma, **Home + Inbox + Agent için iki yapısal wireframe ve Inbox'ın kritik geçişlerini gösteren küçük bir prototip brief'i** olmalı. Önce konuşma ve işlem hiyerarşisi; ardından renk, font ve görsel karakter değerlendirilir.

## 21. Kaynak dizini

### Repo kanıtları

Bağlantılar araştırmada incelenen sürüme sabitlenmiştir.

- [Ana sürüm](https://github.com/ismet3547/avenlyo-app/tree/ed945629cfe04b7097c6a94e8699603f2b9b5792)
- [Web package.json](https://github.com/ismet3547/avenlyo-app/blob/ed945629cfe04b7097c6a94e8699603f2b9b5792/apps/web/package.json)
- [Uygulama layout'u](https://github.com/ismet3547/avenlyo-app/blob/ed945629cfe04b7097c6a94e8699603f2b9b5792/apps/web/app/app/layout.tsx)
- [Sidebar](https://github.com/ismet3547/avenlyo-app/blob/ed945629cfe04b7097c6a94e8699603f2b9b5792/apps/web/components/sidebar.tsx)
- [Home ve sayaçlar](https://github.com/ismet3547/avenlyo-app/blob/ed945629cfe04b7097c6a94e8699603f2b9b5792/apps/web/app/app/page.tsx)
- [Inbox listesi](https://github.com/ismet3547/avenlyo-app/blob/ed945629cfe04b7097c6a94e8699603f2b9b5792/apps/web/app/app/inbox/page.tsx)
- [Inbox konuşma bileşeni](https://github.com/ismet3547/avenlyo-app/blob/ed945629cfe04b7097c6a94e8699603f2b9b5792/apps/web/components/inbox-conversation.tsx)
- [Knowledge listesi](https://github.com/ismet3547/avenlyo-app/blob/ed945629cfe04b7097c6a94e8699603f2b9b5792/apps/web/app/app/knowledge/page.tsx)
- [Agent formu](https://github.com/ismet3547/avenlyo-app/blob/ed945629cfe04b7097c6a94e8699603f2b9b5792/apps/web/components/agent-form.tsx)
- [Leads listesi](https://github.com/ismet3547/avenlyo-app/blob/ed945629cfe04b7097c6a94e8699603f2b9b5792/apps/web/app/app/leads/page.tsx)
- [Kanallar](https://github.com/ismet3547/avenlyo-app/blob/ed945629cfe04b7097c6a94e8699603f2b9b5792/apps/web/app/app/channels/page.tsx)
- [Test Agent etkileşimi](https://github.com/ismet3547/avenlyo-app/blob/ed945629cfe04b7097c6a94e8699603f2b9b5792/apps/web/components/test-chat.tsx)
- [Paylaşılan veri tipleri](https://github.com/ismet3547/avenlyo-app/blob/ed945629cfe04b7097c6a94e8699603f2b9b5792/packages/shared/src/database.ts)
- [Yapılandırma ve doğrulama şemaları](https://github.com/ismet3547/avenlyo-app/blob/ed945629cfe04b7097c6a94e8699603f2b9b5792/packages/shared/src/schemas.ts)
- [Channels ve Handoff migration / RPC sözleşmeleri](https://github.com/ismet3547/avenlyo-app/blob/ed945629cfe04b7097c6a94e8699603f2b9b5792/supabase/migrations/20261014211810_channels_handoff_v1.sql)
- [Widget kaynağı](https://github.com/ismet3547/avenlyo-app/blob/ed945629cfe04b7097c6a94e8699603f2b9b5792/apps/api/src/channels/widget.ts)
- [Mimari](https://github.com/ismet3547/avenlyo-app/blob/ed945629cfe04b7097c6a94e8699603f2b9b5792/docs/architecture.md)
- [Bağımsızlık sözleşmesi](https://github.com/ismet3547/avenlyo-app/blob/ed945629cfe04b7097c6a94e8699603f2b9b5792/docs/independence-contract.md)
- [Tarayıcı test yapılandırması](https://github.com/ismet3547/avenlyo-app/blob/ed945629cfe04b7097c6a94e8699603f2b9b5792/playwright.config.ts)
- [Önceki araştırma branchi](https://github.com/ismet3547/avenlyo-app/tree/aaa34e726ceb331fa380e13a6e2396553a56823a/docs)
- [Önceki görsel yön karşılaştırmaları](https://github.com/ismet3547/avenlyo-app/tree/aaa34e726ceb331fa380e13a6e2396553a56823a/design-prototypes/frontend-visual-directions)
- [Önceki yeni nesil ürün araştırması](https://github.com/ismet3547/avenlyo-app/blob/aaa34e726ceb331fa380e13a6e2396553a56823a/docs/frontend-new-generation-research-v1.md)
- [Birleşmemiş Product UI PR #3](https://github.com/ismet3547/avenlyo-app/pull/3)

### Resmi web kaynakları

18 Ekim 2026 tarihinde erişildi. Tarihli sürüm notları tarihsel bağlamlarıyla kullanıldı; canlı ürün sayfalarının bütün görüntülerinin aynı günkü sürümü gösterdiği varsayılmadı.

1. [Intercom Inbox](https://www.intercom.com/helpdesk/inbox)
2. [Fin AI Agent explained](https://fin.ai/help/en/articles/13975995-fin-ai-agent-explained)
3. [Front Inbox deneyimi](https://help.front.com/en/articles/3889728)
4. [Front AI ajanları](https://help.front.com/en/articles/4991744)
5. [Crisp Shared Inbox](https://crisp.chat/en/shared-inbox/)
6. [Plain ürün yüzeyi](https://www.plain.com/)
7. [Linear Inbox rehberi](https://linear.app/docs/inbox)
8. [Linear Priority Inbox — 3 Eylül 2026](https://linear.app/changelog/2026-09-03-priority-inbox)
9. [Attio kayıt sayfası yenilemesi — 28 Mayıs 2026](https://attio.com/changelog/2026/record-page-redesign)
10. [Granola görsel sistem yenilemesi](https://www.granola.ai/blog/a-new-look-for-granola)
11. [Notion Mail — 15 Nisan 2025](https://www.notion.com/releases/2025-04-15)
12. [Next.js Server ve Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
13. [Supabase SSR client / oturum doğrulaması](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
14. [Supabase Changelog](https://supabase.com/changelog)
15. [shadcn/ui yaklaşımı](https://ui.shadcn.com/docs)
16. [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)
17. [WAI-ARIA Modal Dialog örüntüsü](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
18. [Playwright erişilebilirlik testi](https://playwright.dev/docs/accessibility-testing)
19. [Google Web Vitals](https://web.dev/articles/vitals)
