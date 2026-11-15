// Interface strings and Turkish site content. English site texts live in sites.js / narration.json;
// the Turkish here translates them fact for fact (see SOURCES.md for the sources behind both).

import NARRATION_EN from './narration.json';
import NARRATION_TR from './narration.tr.json';

export const NARRATION = { en: NARRATION_EN, tr: NARRATION_TR };

export const UI = {
  en: {
    sub: 'Roman Mersin · ten places',
    introEyebrow: 'A 3D map of Roman Mersin',
    introText: 'Pirates, Cleopatra, a city for Pompey and a cave for a monster. Ten Roman places on the real landscape of Türkiye’s Mediterranean coast.',
    beginSound: 'Start the tour with sound', beginQuiet: 'Start the tour quietly',
    loading: 'Raising the Taurus mountains…',
    hint: 'A guided tour starts first — stop it any time to explore. Drag to orbit · scroll to zoom · right-drag to pan · click a beacon',
    hintTouch: 'A guided tour starts first — stop it any time to explore. Drag to orbit · pinch to zoom · two fingers to pan · tap a beacon',
    tour: '▶ Tour', stopTour: '■ Stop tour', sound: 'Sound', day: '☀ Day', dusk: '☾ Golden hour', roads: 'Roads', overview: 'Overview', map: 'Map',
    tTour: 'Guided tour (T)', tSound: 'Sound & narration (M)', tDusk: 'Golden hour (G)', tRoads: 'Roman roads (R)', tHome: 'Whole map (H)', tLang: 'Türkçe (L)', langBtn: 'TR', langIntro: 'Türkçe',
    prev: '‹ Prev', next: 'Next ›', close: 'Close', prevAria: 'Previous site', nextAria: 'Next site',
    today: 'today', listen: '♪ Listen', lookFor: 'Look for', howWeKnow: 'How we know', sources: 'Sources', openMap: 'open map',
    legend: 'Real elevation (SRTM), ×2.6 vertical', legendLong: '. Monuments are stylised miniatures, not to scale. Roads are schematic; rivers follow DEM valley floors',
    north: 'N', northTitle: 'North', sitesAria: 'Sites', controlsAria: 'Map controls', canvasAria: '3D map of Roman-era Mersin province',
    noWebgl: 'This map needs WebGL, which this browser or device could not start.', lost: 'The 3D view was interrupted — reload the page to continue.', loadFail: 'Could not load the map: ',
    docTitle: 'Roman Mersin — a 3D map of ancient Cilicia',
  },
  tr: {
    sub: 'Roma Dönemi Mersin · on yer',
    introEyebrow: 'Roma Dönemi Mersin’in 3B haritası',
    introText: 'Korsanlar, Kleopatra, Pompeius’un kenti ve bir canavarın mağarası. Türkiye’nin Akdeniz kıyısının gerçek arazisi üzerinde on Roma yerleşimi.',
    beginSound: 'Turu sesli başlat', beginQuiet: 'Turu sessiz başlat',
    loading: 'Toroslar yükseliyor…',
    hint: 'Önce rehberli tur başlar; dilediğiniz an durdurup kendiniz gezebilirsiniz. Sürükleyerek döndürün · kaydırarak yakınlaşın · sağ tuşla sürükleyerek kaydırın · bir işarete tıklayın',
    hintTouch: 'Önce rehberli tur başlar; dilediğiniz an durdurup kendiniz gezebilirsiniz. Sürükleyerek döndürün · iki parmakla yakınlaşın ve kaydırın · bir işarete dokunun',
    tour: '▶ Tur', stopTour: '■ Turu durdur', sound: 'Ses', day: '☀ Gündüz', dusk: '☾ Gün batımı', roads: 'Yollar', overview: 'Genel görünüm', map: 'Harita',
    tTour: 'Rehberli tur (T)', tSound: 'Ses ve anlatım (M)', tDusk: 'Gün batımı ışığı (G)', tRoads: 'Roma yolları (R)', tHome: 'Tüm harita (H)', tLang: 'English (L)', langBtn: 'EN', langIntro: 'English',
    prev: '‹ Önceki', next: 'Sonraki ›', close: 'Kapat', prevAria: 'Önceki yer', nextAria: 'Sonraki yer',
    today: 'bugün', listen: '♪ Dinle', lookFor: 'Görülecekler', howWeKnow: 'Nereden biliyoruz', sources: 'Kaynaklar', openMap: 'haritada aç',
    legend: 'Gerçek yükselti verisi (SRTM), düşeyde ×2,6', legendLong: '. Yapılar ölçeksiz, stilize minyatürlerdir. Yollar şematiktir; ırmaklar yükselti modelindeki vadi tabanlarını izler',
    north: 'K', northTitle: 'Kuzey', sitesAria: 'Yerler', controlsAria: 'Harita denetimleri', canvasAria: 'Roma Dönemi Mersin ilinin 3B haritası',
    noWebgl: 'Bu harita WebGL gerektirir; tarayıcınız ya da cihazınız WebGL’i başlatamadı.', lost: '3B görünüm kesildi — devam etmek için sayfayı yenileyin.', loadFail: 'Harita yüklenemedi: ',
    docTitle: 'Roma Dönemi Mersin — antik Kilikya’nın 3B haritası',
  },
};

export const SITES_TR = {
  anemurium: {
    name: 'Anemurium', modern: 'Anamur · Eski Anamur',
    tagline: 'Anadolu’nun en güney ucunda, olduğu gibi ayakta kalmış koca bir Roma kenti.',
    era: ['Roma İmparatorluk Dönemi', 'MS 1.–4. yy', 'yak. 7. yy’da terk edildi'],
    body: [
      'Anemurium, Küçük Asya’nın en güney noktası olan Anamur Burnu’nda, tam karşıdaki Kıbrıs’a bakar. Üzerine hiç modern kent kurulmadığı için, çatısız ama tonozları hâlâ yerinde yapılardan oluşan sokaklarıyla kumsaldan arkadaki yamaca doğru tırmanarak günümüze ulaşmıştır.',
      'En parlak dönemi MS 2.–3. yüzyıllardır. Geç Antik Çağ’da gözden düşmüş, bu kıyıya yönelik Arap akınlarının yaşandığı 7. yüzyıl dolaylarında terk edilmiştir.',
    ],
    look: [
      'Büyük bir tiyatro ve tam karşısında, meclis binası olarak da kullanılan küçük, üstü örtülü bir odeon',
      'Üç büyük, bir küçük hamam; en iyi korunmuş olanın palaestrası mozaik döşelidir',
      'MS 1.–4. yüzyıllara ait, ev biçimli, beşik tonozlu yaklaşık 350 mezardan oluşan nekropol; bazılarının içi hâlâ boyalıdır',
    ],
    evidence: '1960’lardan itibaren Kanadalı ekiplerce kazılmıştır (Elisabeth Alföldi-Rosenbaum, ardından British Columbia Üniversitesi’nden James Russell); nihai yayının ilk cildi 2021’de çıkmıştır. Türkiye’nin UNESCO Geçici Listesi’ne giden yolundadır.',
    fun: 'Adı Yunanca anemos’tan, yani “rüzgâr”dan gelir. Burunda durunca nedenini anlarsınız.',
  },
  seleucia: {
    name: 'Seleucia ad Calycadnum', modern: 'Silifke',
    tagline: 'Tek başına bir Korint sütunu, bir leylek yuvası ve Vespasianus’un valisinin imzasını taşıyan bir köprü.',
    era: ['Kuruluş yak. MÖ 296–280', 'Roma köprüsü MS 77–78', 'Tapınak MS 2. yy'],
    body: [
      'Kenti I. Seleukos Nikator, Kalykadnos (Göksu) ırmağı kıyısında kurmuş, yakındaki Holmi limanının halkını buraya taşımıştır. Roma döneminde de Dağlık Kilikya’nın başlıca kentlerinden biri olarak kalmıştır.',
      'Bugün büyük bölümünü Silifke örter; yine de Roma kenti yer yer kendini gösterir: çoğunlukla Jüpiter Tapınağı diye anılan 2. yüzyıl tapınağı (özgün hâlinde 8 × 14 Korint sütunlu, sonradan kiliseye çevrilmiş), kayaya oyulmuş bir sarnıç (Tekir Ambarı), kaya mezarlarından oluşan bir nekropol ve ilk kez MS 77–78’de vali L. Octavius Memor tarafından taş köprüyle aşılan ırmak geçidi.',
    ],
    look: [
      'Jüpiter Tapınağı: kentin ortasındaki podyumu ve ayakta kalan tek sütunu',
      'Göksu üzerindeki taş köprü — çok onarım görmüş, ama Roma temelleri üzerinde',
      'Kentin hemen güneyinde Azize Thekla’nın mağara kilisesi, Aya Tekla',
    ],
    evidence: 'Köprünün tarihi ve yaptıranı ithaf yazıtından bilinir. Tapınağın Jüpiter/Zeus’a adandığı bir yazıtla kanıtlanmış değildir, gelenekseldir; bir kaynak daha erken, Seleukos dönemine ait bir kökeni savunur.',
    fun: 'Ayakta kalan sütunun tepesine leylekler yuva yapar; bu yüzden yöre halkı ona Leylek Tapınağı da der.',
  },
  diocaesarea: {
    name: 'Diokaisareia', modern: 'Uzuncaburç',
    tagline: 'Toroslar’da 1.200 metrede, Hellenistik bir Zeus tapınağının çevresinde bir tapınak kenti.',
    era: ['Hellenistik kutsal alan', 'Vespasianus döneminde kent', 'Tiyatro MS 161–169'],
    body: [
      'Burası, Olba’nın rahip-krallarınca yönetilen Zeus Olbios kutsal alanıydı. Vespasianus döneminde (MS 69–79) Olba’dan ayrılarak başlı başına bir kent oldu ve Diokaisareia adını aldı. Roma kenti eski tapınağın çevresine yerleştirildi: sütunlu cadde, tören kapısı, tiyatro, çeşme yapısı.',
      'Türkçe adı, köyün üzerinde hâlâ yükselen uzun Hellenistik kuleden gelir.',
    ],
    look: [
      'Zeus Olbios Tapınağı — Hellenistik, peripteros planlı, otuz kadar sütunu hâlâ ayakta; sonradan kiliseye çevrilmiştir',
      'Oppius ile Kyria’nın kente armağanı olan Tykhe Tapınağı (MS 1. yy); yüksek sütunları arşitravın bir bölümünü hâlâ taşır',
      'Tiyatro (Marcus Aurelius ve Lucius Verus dönemi, yaklaşık 2.500 kişilik) ve anıtsal kapı',
    ],
    evidence: 'Zeus tapınağının erken Hellenistik döneme tarihlenmesi (kimi zaman I. Seleukos’a atfedilir) mimari üsluba dayanır; tiyatro yazıtıyla tarihlenir. 2.500 kişilik kapasite bir gezi rehberinin tahminidir. Kent statüsü kesin bir yıl verilmeden Vespasianus dönemine (MS 69–79) tarihlenir; tapınak 5. yüzyılda kiliseye dönüştürülmüştür.',
    fun: 'Seleukeia’ya inen taş döşeli yolun kenarında, Demircili’de (antik İmbriogon) Roma anıt mezarları hâlâ ayaktadır.',
  },
  cennet: {
    name: 'Korykos Mağarası', modern: 'Cennet ve Cehennem',
    tagline: 'Zeus’un canavar Typhon’u hapsettiği söylenen iki dev obruk.',
    era: ['Hellenistik Çağ’dan beri kutsal', 'Roma kutsal alanı', 'Şapel MS 5. yy'],
    body: [
      'Cennet, 250 × 110 m genişliğinde ve yaklaşık 70 m derinliğinde çökmüş bir mağaradır; kısa bir yürüyüş ötesindeki Cehennem ise 70 × 50 m genişliğinde, 128 m derinliğinde, dik duvarlı ve içine hiç girilemeyen bir kuyudur.',
      'Antik yazarlar burayı Korykos Mağarası olarak tanırdı. Strabon dünyanın en iyi safranının burada yetiştiğini söyler; Pomponius Mela inişi uzun uzun, büyük bir zevkle anlatır. Söylenceye göre Cehennem, Zeus onu Etna’nın altına gömmeden önce Typhon’un geçici zindanıydı.',
    ],
    look: [
      'Güney kenarın birkaç metre ötesindeki “tapınak-kilise”: 5. yüzyılda kiliseye çevrilmiş bir Zeus tapınağı',
      'Cennet’e inen yaklaşık 300 basamak ve mağara ağzındaki 5. yüzyıla ait Meryem Ana şapeli',
      'Mağaranın içinden gelen yeraltı ırmağının uğultusu',
    ],
    evidence: 'Obrukların ölçüleri modern ölçüm değerleridir. Buranın Strabon’un (14.5.5) ve Mela’nın Korykos Mağarası olduğu genel olarak kabul edilir.',
    fun: 'Pindaros da Aiskhylos da “Kilikya mağarası”nı Typhon’un ini olarak anar — burası 2.500 yıllık bir turistik yer.',
  },
  adamkayalar: {
    name: 'Adamkayalar', modern: 'Şeytan Deresi Kanyonu',
    tagline: 'Bir kanyon duvarına oyulmuş, 1.800 yıldır vadiyi gözleyen Roma dönemi ataları.',
    era: ['Büyük olasılıkla MS 2. yy'],
    body: [
      'Kızkalesi’nin yaklaşık 7 km içerisinde, Şeytan Deresi vadisinin yüksek kayalığında dokuz nişe on sekiz figür oyulmuştur: on bir erkek, dört kadın, iki çocuk ve bir dağ keçisi. Kimileri ölü yemeğinde uzanmış gibidir, kimileri asker olarak betimlenmiştir; bir alınlığın üzerinde iki Roma kartalı durur.',
      'Kim oldukları konusunda pek az şey kayıtlıdır. Çoğunlukla yörenin ileri gelenleri için birkaç kuşak boyunca yapılmış mezar anıtları olarak yorumlanırlar.',
    ],
    look: [
      'Ölü yemeği sahneleri — sedire uzanmış ölü ve yanındaki ailesi',
      'Ayakta duran asker figürleri',
      'Kanyona tepeden bakış (patika dik ve korunaksızdır)',
    ],
    evidence: 'MS 2. yüzyıl tarihi üsluba dayalı bir tahmindir. 2019’da, heykellerin içinde altın saklı olduğuna inanan defineciler birkaç figüre ağır hasar vermiştir.',
    fun: 'Yöre halkı onlara yalnızca “adam kayalar” demiş. Ad öyle kalmış.',
  },
  korykos: {
    name: 'Korykos', modern: 'Kızkalesi',
    tagline: 'Roma’nın korsanlara karşı donanma üssü — sonradan denizde yüzen bir kaleyle taçlandı.',
    era: ['Roma limanı ve darphanesi', 'İmparatorluk donanma üssü', 'Kaleler 12.–13. yy'],
    body: [
      'Korykos bu kıyı şeridinin liman kentiydi. Roma yönetiminde kendi yasalarını korudu, kendi sikkesini bastı; imparatorlar korsanları gözlemek için buraya savaş gemileri yerleştirdi. Bir saatlik yürüyüş mesafesinde, batıdaki Korykos Mağarası adını bu kentten almıştır.',
      'Bugün ilk göze çarpan, Orta Çağ’dır: kara kalesi ve ünlü deniz kalesi (Kızkalesi), 12. yüzyıl başında Bizanslılarca yeniden tahkim edilmiş, ardından Kilikya Ermeni Krallığı’nın elinde kalmıştır. Ama kara kalesi sözcüğün tam anlamıyla Roma kentinden yapılmıştır — duvarlarının her yerinde sütun tamburları ve yazıtlı bloklar vardır.',
    ],
    look: [
      'Kara kalesinde yeniden kullanılmış bir Roma kemeri/kapısı',
      'İç kesime doğru uzanan, kaya mezarları ve lahitlerden oluşan büyük nekropol',
      'Kalenin kuzeydoğusundaki Erken Hıristiyanlık bazilikaları',
    ],
    evidence: 'Kaleler Roma değil, Orta Çağ yapısıdır — simge yapı oldukları için modelde gösterilmiş ve öyle etiketlenmiştir. Burada sıralanan Roma dönemi kalıntıları yayımlanmış yerleşim tanımlarını izler. (Kimi zaman buraya yerleştirilen MÖ 191 Korykos Deniz Savaşı, İonia’daki öteki Korykos açıklarında yapılmıştır.)',
    fun: 'Söylence şöyle: kızının yılan sokmasıyla öleceği söylenen bir kral ona denizin ortasında bir kale yaptırır. Yılan bir üzüm sepetinin içinde gelir.',
  },
  elaiussa: {
    name: 'Elaiussa Sebaste', modern: 'Ayaş',
    tagline: 'Kıyıdaki Roma tiyatrosu: Augustus’un adını taşıyan ada kentinin üstünde 2.300 kişilik oturma yeri.',
    era: ['Kuruluş MÖ 2. yy', 'Augustus döneminde yeniden kuruldu', 'Tiyatro yak. MS 100–169'],
    body: [
      'Elaiussa (“zeytin kenti”), kıyıya bir kum diliyle bağlanan küçük bir adada doğdu. Augustus’un bağlı kralı Kappadokia Kralı Arkhelaos burada yeni bir kent kurdu ve adını Sebaste — Yunanca “Augusta” — koydu. Kıyı MS 70’lerde güvenliğe kavuştuktan sonra kent hızla gelişti.',
      'Tiyatro, kıyı yolunun hemen üstündeki tepeye oyulmuştur. Roma Sapienza Üniversitesi burayı 1995–1999’da kazdı: yapımına 2. yüzyılın ilk yarısında başlanmış, Marcus Aurelius ve Lucius Verus döneminde (161–169) tamamlanmıştır. Planı yarım daireden biraz büyüktür; 55 m çapında ve yaklaşık 2.300 seyircilidir. MS 300 dolaylarında kısmen yıkılmış durumdaydı.',
    ],
    look: [
      'Tiyatro; yolun hemen karşısında agora ve içindeki Bizans kilisesi',
      'Bir zamanlar 6 × 12 sütunlu olan, burun üzerindeki tapınak',
      'Lamos ırmağından su getiren su kemerleri ve yüz kadar anıtsal mezardan oluşan nekropol',
    ],
    evidence: 'Tarihler, çap ve kapasite Sapienza kazısından alınmıştır (E. Equini Schneider; tiyatro yayını E. Borgia). Kapasite bir rekonstrüksiyon tahminidir.',
    fun: 'Antik ada bugün bir yarımadadır — liman alüvyonla doldu, deniz çekildi.',
  },
  kanlidivane: {
    name: 'Kanytelis', modern: 'Kanlıdivane',
    tagline: 'Yaklaşık 70 metre derinliğindeki bir obruğun kıyısına kurulmuş bir kent.',
    era: ['Olba kulesi, Hellenistik', 'Roma mezarları', 'MS 5. yy’da Neapolis olarak yeniden kuruldu'],
    body: [
      'Kanytelis, Olba rahip-krallığına bağlıydı. En eski yapısı olan güneybatı kenardaki kule, “Olba rahip-kralı Tarkyaris’in oğlu Teukros tarafından Zeus için yaptırıldı” diye okunan bir yazıt taşır. Roma döneminde burası küçük bir kente dönüştü; II. Theodosius zamanında Neapolis adıyla bir Hıristiyan merkezi olarak yeniden kuruldu.',
      'Her şey obruğun çevresine dizilmiştir — bir kaynağa göre uzun ekseni yaklaşık 130 m, bir başkasına göre 170 × 200 m; derinliği 60–70 m. İç duvarlarına yöre ailelerinin kabartmaları oyulmuştur.',
    ],
    look: [
      'Olba kulesi ve obruğun kıyısında duran çatısız bazilikalar',
      'Aba adlı bir kadının kocası ve oğulları için yaptırdığı tapınak-mezar',
      'Obruğun içindeki kaya kabartmaları ve kuzeydeki lahitli nekropol',
    ],
    evidence: 'Ölçüler yayımlanmış tanımlara dayanır (derinlik 60 m ya da 70 m olarak verilir). Kulenin adak yazıtı ve Aba mezarı kendi yazıtlarından bilinir.',
    fun: 'Kanlıdivane kabaca “kanlı delilik yeri” demektir — söylenceye göre suçlular çukurdaki yabani hayvanlara atılırmış. Asıl suçlu büyük olasılıkla kızıla çalan kayadır.',
  },
  soli: {
    name: 'Soli-Pompeiopolis', modern: 'Viranşehir, Mezitli (Mersin)',
    tagline: 'Pompeius’un emekli korsanlar için kurduğu kent; sütunlu caddesi denize doğru yürür.',
    era: ['Yunan kolonisi yak. MÖ 700', 'MÖ 67’de Pompeius yeniden kurdu', 'Sütunlu cadde MS 2.–3. yy'],
    body: [
      'Soli eski bir Yunan kolonisiydi; MÖ 83’te Ermenistan Kralı Tigranes kenti boşalttı. MÖ 67’de denizleri korsanlardan yeni temizlemiş olan Pompeius, teslim olan korsanların bir bölümünü buraya yerleştirdi ve kente kendi adını verdi.',
      'Kentin gözbebeği, kentten limana uzanan sütunlu caddedir: 14,5 m genişliğinde, iki sıra hâlinde yaklaşık 200 Korint sütunlu. Yayımlanan uzunluklar değişir (350–450 m); ayaktaki sütun sayısı da öyle — kazı ekibi sütunları yeniden diktikçe kabaca 33 ile 47 arasında. Sütun gövdelerindeki konsollar bir zamanlar imparatorların ve kentin ileri gelenlerinin heykellerini taşırdı.',
    ],
    look: [
      'Sütunlu cadde — sütunların ortasındaki konsollara dikkat edin',
      'MS 130 dolaylarında yenilenmiş, Roma betonundan liman mendirekleri',
      'Tunç Çağı’na uzanan katmanlarıyla Soli Höyük',
    ],
    evidence: '1999’dan beri Remzi Yağcı (Dokuz Eylül Üniversitesi) başkanlığında kazılmaktadır. Limanın tarihlenmesi ROMACONS beton karot projesine dayanır. Kent MS 525’te bir depremle yerle bir olmuştur.',
    fun: '“Solesizm” — dilbilgisi hatası — sözcüğü Soli’den gelir; kentin kolonistleri bozuk Yunancalarıyla alay konusu olmuştu.',
  },
  tarsus: {
    name: 'Tarsus', modern: 'Tarsus',
    tagline: 'Roma Kilikyası’nın başkenti: Kleopatra buraya yelken açtı, Aziz Pavlus burada doğdu, bir imparator buraya gömüldü.',
    era: ['MÖ 67’den itibaren Roma başkenti', 'Antonius ile Kleopatra MÖ 41', 'Iulianus MS 363’te gömüldü'],
    body: [
      'Pompeius, MÖ 67’de Tarsus’u Kilikya eyaletinin başkenti yaptı. MÖ 41’de Kleopatra, Marcus Antonius’la buluşmak için Kydnos ırmağından yukarı yelken açtı. Havari Pavlus kendisini “hiç de önemsiz olmayan bir kentin yurttaşı” diye tanıttı — işte o kent burası. İmparator Iulianus 363’te surların dışına gömüldü.',
      'Roma kenti, bugünkü kentin metrelerce altındadır; bu yüzden pencerelerden görünür: kent merkezinde sütun kaideleriyle birlikte bazalt döşeli bir cadde, bir tapınağın dev beton çekirdeği (Donuktaş), bir hamam duvarı ve ayakta kalan tek kapı.',
    ],
    look: [
      '“Kleopatra Kapısı” — ayakta kalan tek kent kapısı; ağır biçimde onarılmıştır (bugünkü dokusu büyük olasılıkla Kleopatra’dan sonraya aittir)',
      'Merkezdeki kazılmış Roma caddesi ve 2. yüzyıla ait dev tapınak platformu Donuktaş',
      'Kentin kuzeyinde, Sağlıklı’da: Kilikya Kapıları’na yönelen, yaklaşık 3 km’si sağlam, 3 m genişliğinde taş döşeli Roma yolu',
    ],
    evidence: 'Kapının bugünkü biçimi, daha eski bir kapının yerinde Bizans ya da Abbasi dönemine tarihlenir. Donuktaş uzun süre “Sardanapalos’un mezarı” diye anılmış; kazılar onun bir Roma tapınağı olduğunu göstermiştir. Yol ölçüleri Kültür ve Turizm Bakanlığı’na aittir.',
    fun: 'Plutarkhos’a göre Kleopatra, kıçı altın kaplama, yelkenleri mor, kürekleri gümüş bir tekneyle, Aphrodite gibi giyinmiş olarak geldi. Antonius’un hiç şansı yoktu.',
  },
};
