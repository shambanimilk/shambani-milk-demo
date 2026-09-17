/* Shambani Milk — News & Updates posts.
 *
 * To add a post: append an object to this array, newest-first order is not
 * required (posts are sorted by dateISO automatically). Fields:
 *   slug     — unique, used in the URL: blog.html?p=<slug>
 *   dateISO  — "YYYY-MM-DD"
 *   img      — card image path under assets/img/ (optional)
 *   example  — true marks placeholder content pending client confirmation
 *   en / sw  — { title, excerpt, body } per language; body is HTML
 */
window.SHAMBANI_POSTS = [
  {
    slug: "our-new-website",
    dateISO: "2026-09-17",
    img: "assets/img/hero-home.webp",
    example: true,
    en: {
      title: "Our new website is live",
      excerpt: "A fresh look for Shambani Milk — browse our products, find shops near you and order on WhatsApp, in English or Swahili.",
      body: "<p>Welcome to the new Shambani Milk website. We built it with one goal: make it easy for our customers to find what they need.</p><p>Here is what you can do now:</p><ul><li>Browse the full product range — fresh milk, mtindi and yoghurt</li><li>Find shops stocking Shambani products near you, anywhere in Morogoro, Dar es Salaam, Dodoma and Pwani</li><li>Message us instantly on WhatsApp</li><li>Read everything in English or Swahili</li></ul><p>Ladha halisi ya Maziwa — the real taste of milk.</p>"
    },
    sw: {
      title: "Tovuti yetu mpya imeanza",
      excerpt: "Mwonekano mpya wa Shambani Milk — tazama bidhaa zetu, pata maduka karibu nawe na agiza kwa WhatsApp, kwa Kiingereza au Kiswahili.",
      body: "<p>Karibu kwenye tovuti mpya ya Shambani Milk. Tuliijenga na lengo moja: kuwawezesha wateja wetu kupata wanachohitaji kwa urahisi.</p><p>Haya hapa unayoweza kufanya sasa:</p><ul><li>Kutazama bidhaa zetu zote — maziwa safi, mtindi na yogati</li><li>Kupata maduka yanayouza bidhaa za Shambani karibu nawe, Morogoro, Dar es Salaam, Dodoma na Pwani</li><li>Kututumia ujumbe mara moja kwa WhatsApp</li><li>Kusoma kila kitu kwa Kiingereza au Kiswahili</li></ul><p>Ladha halisi ya Maziwa.</p>"
    }
  },
  {
    slug: "product-range-and-packs",
    dateISO: "2026-09-10",
    img: "assets/img/yogurt-range.webp",
    example: true,
    en: {
      title: "Our product range: from 250ml cups to 5L packs",
      excerpt: "Fresh milk, mtindi and yoghurt in the sizes Tanzanian families actually use — from single-serve cups to family packs.",
      body: "<p>Every Shambani product starts the same way: fresh milk collected each morning from around 400 family farms in Morogoro, pasteurised the same day at our Tungi factory.</p><p>Our current range:</p><ul><li><strong>Fresh milk</strong> — 500ml, 1L, 3L and 5L</li><li><strong>Mtindi</strong> — 250ml, 450ml and 1L</li><li><strong>Yoghurt</strong> — 150ml cups and 1kg–4kg tubs in plain, vanilla and strawberry</li></ul><p>For today's prices and delivery options, message us on WhatsApp — retail and bulk orders are both welcome.</p>"
    },
    sw: {
      title: "Bidhaa zetu: kutoka kikombe cha 250ml hadi pakiti ya 5L",
      excerpt: "Maziwa safi, mtindi na yogati kwa saizi ambazo familia za Tanzania zinatumia — kutoka vikombe vya mtu mmoja hadi pakiti kubwa za familia.",
      body: "<p>Kila bidhaa ya Shambani huanza vivyo hivyo: maziwa safi yanayokusanywa kila asubuhi kutoka kwa familia takribani 400 za wakulima Morogoro, na kufanywa usalama siku hiyo hiyo kwenye kiwanda chetu Tungi.</p><p>Orodha ya bidhaa zetu kwa sasa:</p><ul><li><strong>Maziwa safi</strong> — 500ml, 1L, 3L na 5L</li><li><strong>Mtindi</strong> — 250ml, 450ml na 1L</li><li><strong>Yogati</strong> — vikombe vya 150ml na vyombo vya 1kg–4kg — asili, vanila na strawberry</li></ul><p>Kwa bei za leo na chaguo za usafirishaji, tutumie ujumbe kwa WhatsApp — maagizo ya rejareja na kwa wingi yanakaribishwa.</p>"
    }
  },
  {
    slug: "the-farmers-behind-the-milk",
    dateISO: "2026-09-03",
    img: "assets/img/impact-event.webp",
    example: true,
    en: {
      title: "The farmers behind the milk",
      excerpt: "87% of our ~400 milk producers are Maasai women. Every litre you buy keeps a farming family growing.",
      body: "<p>Shambani's milk begins before dawn, on around 400 smallholder farms across the hills of Morogoro. 87% of these producers are Maasai women, for whom milk income means school fees, household security and a stake in Tanzania's growth.</p><p>We collect fresh milk daily, pay our producers fairly and promptly, and process it at our Tungi factory — a farm-to-family chain that keeps value where it starts: in the community.</p><p>When you choose Shambani at your local shop, you are part of that chain.</p>"
    },
    sw: {
      title: "Wakulima wanaosimama nyuma ya maziwa",
      excerpt: "Asilimia 87 ya wazalishaji takribani 400 wa maziwa wetu ni wanawake Wamasai. Kila lita unayonunua inafanya familia ya mkulima kuendelea kukua.",
      body: "<p>Maziwa ya Shambani huanza kabla ya mwengeo, kwenye mashamba ya familia takribani 400 katika vilima vya Morogoro. Asilimia 87 ya wazalishaji hawa ni wanawake Wamasai, ambao kwa mioyo yao kipato cha maziwa kinamaanisha ada za shule, usalama wa kaya na sehemu katika maendeleo ya Tanzania.</p><p>Tunakusanya maziwa safi kila siku, tunawalipa wazalishaji wetu kwa haki na kwa wakati, na tunayasafirisha kwenye kiwanda chetu Tungi — mnyororo kutoka shambani hadi familia unaoishikia thamani pale ulipoanza: ndani ya jamii.</p><p>Unapochagua Shambani dukani, wewe ni sehemu ya mnyororo huo.</p>"
    }
  }
];
