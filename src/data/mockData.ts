export interface ProductItem {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: "electronics" | "cosmetics" | "fashion";
  subCategory?: string;
  buyPrice: number;
  sellPrice: number;
  originalPrice: number;
  stock: number;
  inStock: boolean;
  images: string[];
  isOffer: boolean;
  offerBadge?: string;
  isFeatured: boolean;
  specifications: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderRecord {
  _id: string;
  orderId: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  note?: string;
  items: Array<{
    product?: string;
    name: string;
    image: string;
    quantity: number;
    buyPrice: number;
    sellPrice: number;
    subtotal: number;
    profit: number;
  }>;
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  totalBuyCost: number;
  totalProfit: number;
  status: "pending" | "in_progress" | "in_courier" | "delivered" | "cancelled";
  paymentMethod: "cash_on_delivery";
  statusHistory: Array<{
    status: string;
    changedAt: Date;
    note?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface OfferRecord {
  _id: string;
  title: string;
  subtitle: string;
  bannerImage: string;
  discountPercentage: number;
  badge: string;
  link: string;
  active: boolean;
  isNoticeTicker: boolean;
  noticeText?: string;
  createdAt: Date;
}

// 1. In-Memory Products Store
export const mockProducts: ProductItem[] = [
  // ELECTRONICS
  {
    _id: "prod-elec-1",
    name: "Wireless ANC Pro Over-Ear Headphones",
    slug: "wireless-anc-pro-headphones",
    description:
      "High fidelity audio with active noise cancellation, 40-hour battery life, and ultra-comfortable memory foam ear cushions.",
    category: "electronics",
    subCategory: "Audio & Gadgets",
    buyPrice: 1800,
    sellPrice: 3200,
    originalPrice: 4000,
    stock: 45,
    inStock: true,
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80",
    ],
    isOffer: true,
    offerBadge: "20% OFF",
    isFeatured: true,
    specifications: {
      Battery: "40 Hours",
      Bluetooth: "v5.3",
      Warranty: "1 Year",
    },
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    _id: "prod-elec-2",
    name: "Ultra AMOLED Smart Watch v2",
    slug: "ultra-amoled-smart-watch-v2",
    description:
      "1.96-inch HD AMOLED display, Bluetooth calling, SpO2 & 24/7 heart rate monitor, IP68 water resistant casing.",
    category: "electronics",
    subCategory: "Smart Wearables",
    buyPrice: 1400,
    sellPrice: 2450,
    originalPrice: 3500,
    stock: 60,
    inStock: true,
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=80",
    ],
    isOffer: true,
    offerBadge: "FLASH SALE",
    isFeatured: true,
    specifications: {
      Display: "1.96 AMOLED",
      Waterproof: "IP68",
      Battery: "7 Days",
    },
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    _id: "prod-elec-3",
    name: "MagSafe 10000mAh Ultra Slim Power Bank",
    slug: "magsafe-10000mah-ultra-slim-power-bank",
    description:
      "Pocket-sized magnetic wireless fast charging power bank with PD 22.5W USB-C output and LED digital display.",
    category: "electronics",
    subCategory: "Mobile Accessories",
    buyPrice: 950,
    sellPrice: 1750,
    originalPrice: 2200,
    stock: 35,
    inStock: true,
    images: [
      "https://images.unsplash.com/photo-1609592806787-3d9c5b881335?w=800&q=80",
    ],
    isOffer: false,
    offerBadge: "",
    isFeatured: false,
    specifications: {
      Capacity: "10,000 mAh",
      Output: "22.5W Fast Charge",
    },
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    _id: "prod-elec-4",
    name: "Dual Driver Wireless Gaming Earbuds",
    slug: "dual-driver-wireless-gaming-earbuds",
    description:
      "Ultra-low 45ms gaming latency, immersive 3D surround sound, RGB charging case, and ENC microphone for crystal clear voice chat.",
    category: "electronics",
    subCategory: "Audio & Gadgets",
    buyPrice: 850,
    sellPrice: 1599,
    originalPrice: 2199,
    stock: 50,
    inStock: true,
    images: [
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80",
    ],
    isOffer: true,
    offerBadge: "27% OFF",
    isFeatured: true,
    specifications: {
      Latency: "45ms",
      Playtime: "32 Hours with Case",
    },
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },

  // COSMETICS
  {
    _id: "prod-cosm-1",
    name: "Hyaluronic Acid & Niacinamide Glow Serum 30ml",
    slug: "hyaluronic-acid-niacinamide-glow-serum",
    description:
      "Advanced hydrating and skin barrier restoring formula that brightens complexion, diminishes dark spots, and smooths fine lines.",
    category: "cosmetics",
    subCategory: "Skincare",
    buyPrice: 650,
    sellPrice: 1350,
    originalPrice: 1800,
    stock: 80,
    inStock: true,
    images: [
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80",
      "https://images.unsplash.com/photo-1608248597359-5a1e8093be78?w=800&q=80",
    ],
    isOffer: true,
    offerBadge: "25% OFF",
    isFeatured: true,
    specifications: {
      Volume: "30 ml",
      SkinType: "All Skin Types",
    },
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    _id: "prod-cosm-2",
    name: "Matte Velvet Waterproof Lip Tint Set (6 Shades)",
    slug: "matte-velvet-waterproof-lip-tint-set",
    description:
      "Non-drying, transfer-proof luxury matte liquid lipstick collection with rich pigmentation and 16-hour long-lasting wear.",
    category: "cosmetics",
    subCategory: "Makeup",
    buyPrice: 750,
    sellPrice: 1450,
    originalPrice: 1950,
    stock: 40,
    inStock: true,
    images: [
      "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&q=80",
    ],
    isOffer: false,
    offerBadge: "",
    isFeatured: true,
    specifications: {
      Shades: "6 Luxury Shades",
      Finish: "Soft Matte",
    },
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    _id: "prod-cosm-3",
    name: "Rosemary & Biotin Scalp Revitalizing Oil 100ml",
    slug: "rosemary-biotin-scalp-revitalizing-oil",
    description:
      "Natural herbal hair growth formula infused with pure rosemary essential oil, biotin, and castor oil for thicker, fuller hair.",
    category: "cosmetics",
    subCategory: "Haircare",
    buyPrice: 450,
    sellPrice: 950,
    originalPrice: 1250,
    stock: 65,
    inStock: true,
    images: [
      "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80",
    ],
    isOffer: true,
    offerBadge: "24% OFF",
    isFeatured: false,
    specifications: {
      Volume: "100 ml",
      Ingredients: "100% Organic",
    },
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    _id: "prod-cosm-4",
    name: "Luxury French Noir Eau De Parfum 100ml",
    slug: "luxury-french-noir-eau-de-parfum",
    description:
      "Mesmerizing notes of amber, Italian bergamot, woody cedarwood, and rich vanilla. Long-lasting luxury projection.",
    category: "cosmetics",
    subCategory: "Fragrances",
    buyPrice: 1200,
    sellPrice: 2490,
    originalPrice: 3200,
    stock: 30,
    inStock: true,
    images: [
      "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&q=80",
    ],
    isOffer: true,
    offerBadge: "HOT DEAL",
    isFeatured: true,
    specifications: {
      Type: "Eau De Parfum",
      Longevity: "12+ Hours",
    },
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },

  // FASHION
  {
    _id: "prod-fash-1",
    name: "Premium Structured Minimalist Leather Backpack",
    slug: "premium-structured-minimalist-leather-backpack",
    description:
      "Crafted from premium vegan leather with a padded 15.6-inch laptop compartment, waterproof zippers, and ergonomic shoulder straps.",
    category: "fashion",
    subCategory: "Bags & Accessories",
    buyPrice: 1300,
    sellPrice: 2499,
    originalPrice: 3200,
    stock: 35,
    inStock: true,
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80",
    ],
    isOffer: true,
    offerBadge: "22% OFF",
    isFeatured: true,
    specifications: {
      Material: "Premium Vegan Leather",
      LaptopSize: "Up to 15.6 inch",
    },
    createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    _id: "prod-fash-2",
    name: "Classic Stainless Steel Chronograph Quartz Watch",
    slug: "classic-stainless-steel-chronograph-watch",
    description:
      "Timeless luxury analog dial with sapphire crystal glass, luminous hands, Japanese quartz movement, and 50m water resistance.",
    category: "fashion",
    subCategory: "Watches & Jewelry",
    buyPrice: 1100,
    sellPrice: 2250,
    originalPrice: 2950,
    stock: 45,
    inStock: true,
    images: [
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&q=80",
    ],
    isOffer: false,
    offerBadge: "",
    isFeatured: true,
    specifications: {
      Movement: "Japanese Quartz",
      Glass: "Sapphire Crystal",
    },
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    _id: "prod-fash-3",
    name: "Heavyweight Oversized Cotton Drop-Shoulder Tee",
    slug: "heavyweight-oversized-cotton-drop-shoulder-tee",
    description:
      "240 GSM 100% combed organic cotton with reinforced ribbed collar and relaxed streetwear silhouette.",
    category: "fashion",
    subCategory: "Apparel",
    buyPrice: 380,
    sellPrice: 790,
    originalPrice: 1100,
    stock: 75,
    inStock: true,
    images: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80",
    ],
    isOffer: true,
    offerBadge: "BEST VALUE",
    isFeatured: false,
    specifications: {
      Fabric: "100% Cotton 240 GSM",
      Fit: "Oversized Streetwear",
    },
    createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    _id: "prod-fash-4",
    name: "Handcrafted Top-Grain Bifold Leather Wallet",
    slug: "handcrafted-top-grain-bifold-leather-wallet",
    description:
      "Slim design with RFID blocking protection, 8 card slots, dual cash compartments, and handcrafted perimeter stitching.",
    category: "fashion",
    subCategory: "Wallets & Accessories",
    buyPrice: 420,
    sellPrice: 890,
    originalPrice: 1200,
    stock: 50,
    inStock: true,
    images: [
      "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80",
    ],
    isOffer: false,
    offerBadge: "",
    isFeatured: false,
    specifications: {
      Material: "Genuine Top Grain Leather",
      RFID: "Protected",
    },
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    _id: "prod-elec-5",
    name: "Wireless RGB Mechanical Gaming Keyboard",
    slug: "wireless-rgb-mechanical-gaming-keyboard",
    description:
      "65% compact layout with hot-swappable custom red switches, tri-mode connection (Bluetooth/2.4G/Type-C), and dynamic RGB backlighting.",
    category: "electronics",
    subCategory: "Computer Accessories",
    buyPrice: 2100,
    sellPrice: 3499,
    originalPrice: 4200,
    stock: 25,
    inStock: true,
    images: [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80",
    ],
    isOffer: true,
    offerBadge: "17% OFF",
    isFeatured: true,
    specifications: {
      Switch: "Linear Red Switches",
      Connectivity: "Tri-Mode Wireless & USB-C",
      Battery: "3000 mAh",
    },
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    _id: "prod-elec-6",
    name: "Fast Wireless 3-in-1 Charging Dock",
    slug: "fast-wireless-3-in-1-charging-dock",
    description:
      "Simultaneously charges your smartphone, smartwatch, and wireless earbuds with smart heat dissipation and Qi fast-charging protection.",
    category: "electronics",
    subCategory: "Mobile Accessories",
    buyPrice: 1200,
    sellPrice: 2150,
    originalPrice: 2800,
    stock: 40,
    inStock: true,
    images: [
      "https://images.unsplash.com/photo-1622445262464-84b1456045b6?w=800&q=80",
    ],
    isOffer: false,
    offerBadge: "",
    isFeatured: false,
    specifications: {
      Output: "15W Max Qi Charging",
      Compatibility: "iOS & Android",
    },
    createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    _id: "prod-cosm-5",
    name: "Pure Tea Tree Clarifying Facial Cleanser 150ml",
    slug: "pure-tea-tree-clarifying-facial-cleanser",
    description:
      "Gentle foaming cleanser with organic tea tree leaf extract and 0.5% salicylic acid to clear pores, prevent breakouts, and soothe redness.",
    category: "cosmetics",
    subCategory: "Skincare",
    buyPrice: 480,
    sellPrice: 980,
    originalPrice: 1350,
    stock: 60,
    inStock: true,
    images: [
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80",
    ],
    isOffer: true,
    offerBadge: "HOT DEAL",
    isFeatured: false,
    specifications: {
      Volume: "150 ml",
      Benefit: "Acne Defense & Oil Control",
    },
    createdAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    _id: "prod-cosm-6",
    name: "Ultra Shield SPF 50+ Invisible Sunscreen Gel 50ml",
    slug: "ultra-shield-spf-50-invisible-sunscreen-gel",
    description:
      "Water-light broad-spectrum UVA/UVB defense with zero white cast, fast absorption, and hydrating hyaluronic acid base.",
    category: "cosmetics",
    subCategory: "Sun Care",
    buyPrice: 550,
    sellPrice: 1190,
    originalPrice: 1600,
    stock: 70,
    inStock: true,
    images: [
      "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&q=80",
    ],
    isOffer: true,
    offerBadge: "25% OFF",
    isFeatured: true,
    specifications: {
      SPF: "50+ PA++++",
      Texture: "Non-Greasy Water Gel",
    },
    createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    _id: "prod-fash-5",
    name: "Polarized Retro Aviator Sunglasses UV400",
    slug: "polarized-retro-aviator-sunglasses-uv400",
    description:
      "Classic teardrop aviator frame in lightweight surgical titanium alloy with glare-reducing 9-layer TAC polarized lenses.",
    category: "fashion",
    subCategory: "Eyewear",
    buyPrice: 580,
    sellPrice: 1290,
    originalPrice: 1750,
    stock: 55,
    inStock: true,
    images: [
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80",
    ],
    isOffer: true,
    offerBadge: "26% OFF",
    isFeatured: false,
    specifications: {
      Lens: "Polarized UV400 TAC",
      Frame: "Titanium Alloy Gold",
    },
    createdAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    _id: "prod-fash-6",
    name: "Premium Handcrafted Suede Chelsea Boots",
    slug: "premium-handcrafted-suede-chelsea-boots",
    description:
      "Water-repellent genuine suede leather with flexible elastic side gussets, leather pull tab, and cushioned Goodyear-welted rubber outsole.",
    category: "fashion",
    subCategory: "Footwear",
    buyPrice: 2200,
    sellPrice: 3850,
    originalPrice: 4900,
    stock: 20,
    inStock: true,
    images: [
      "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800&q=80",
    ],
    isOffer: false,
    offerBadge: "",
    isFeatured: true,
    specifications: {
      Upper: "Genuine Suede Leather",
      Sole: "Anti-Slip Durable Rubber",
    },
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
];

// 2. In-Memory Offers Store
export const mockOffers: OfferRecord[] = [
  {
    _id: "offer-1",
    title: "গ্র্যান্ড সিজনাল অফার ও মেগা ডিসকাউন্ট",
    subtitle: "ইলেকট্রনিক্স, কসমেটিক্স এবং প্রিমিয়াম ফ্যাশনে ৩৫% পর্যন্ত বিশাল ছাড়!",
    bannerImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80",
    discountPercentage: 35,
    badge: "HOT DEALS",
    link: "/?category=all",
    active: true,
    isNoticeTicker: false,
    createdAt: new Date(),
  },
  {
    _id: "offer-2",
    title: "লেটেস্ট স্মার্ট গ্যাজেট ও অরিজিনাল অডিও গিয়ার",
    subtitle: "১০০% অরিজিনাল ব্র্যান্ড ওয়ারেন্টি সহ দেশব্যাপী দ্রুত ক্যাশ অন ডেলিভারি।",
    bannerImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&q=80",
    discountPercentage: 25,
    badge: "TECH SPECIAL",
    link: "/?category=electronics",
    active: true,
    isNoticeTicker: false,
    createdAt: new Date(),
  },
  {
    _id: "offer-3",
    title: "প্রিমিয়াম স্কিনকেয়ার ও লাক্সারি পারফিউম",
    subtitle: "ত্বকের বিশেষ যত্নে সেরা সব অথেনটিক বিউটি কেয়ার প্রোডাক্ট।",
    bannerImage: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=1600&q=80",
    discountPercentage: 30,
    badge: "BEAUTY & CARE",
    link: "/?category=cosmetics",
    active: true,
    isNoticeTicker: false,
    createdAt: new Date(),
  },
  {
    _id: "offer-notice",
    title: "Top Ticker",
    subtitle: "",
    bannerImage: "",
    discountPercentage: 0,
    badge: "NOTICE",
    link: "#",
    active: true,
    isNoticeTicker: true,
    noticeText:
      "⭐ AuraMart স্পেশাল অফার! সারা বাংলাদেশে ক্যাশ অন ডেলিভারি (Cash on Delivery) সুবিধা। অর্ডার করতে যেকোনো পণ্যে ক্লিক করুন! হেল্পলাইন: 01700-000000",
    createdAt: new Date(),
  },
];

// 3. In-Memory Orders Store with Real-world Details
export const mockOrders: OrderRecord[] = [
  {
    _id: "ord-1",
    orderId: "#AUR-829101",
    customerName: "মোঃ তানভীর হোসেন",
    phone: "01712345678",
    address: "বাসা ২৪, রোড ৭, সেক্টর ৩, উত্তরা",
    city: "Dhaka (Inside Dhaka)",
    note: "বিকেলে ডেলিভারি দিন এবং কল করে আসবেন",
    items: [
      {
        product: "prod-elec-1",
        name: "Wireless ANC Pro Over-Ear Headphones",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
        quantity: 1,
        buyPrice: 1800,
        sellPrice: 3200,
        subtotal: 3200,
        profit: 1400,
      },
    ],
    subtotal: 3200,
    deliveryCharge: 70,
    totalAmount: 3270,
    totalBuyCost: 1800,
    totalProfit: 1400,
    status: "pending",
    paymentMethod: "cash_on_delivery",
    statusHistory: [
      {
        status: "pending",
        changedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        note: "গ্রাহক ক্যাশ অন ডেলিভারিতে অর্ডার করেছেন",
      },
    ],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    _id: "ord-2",
    orderId: "#AUR-773912",
    customerName: "সাদিয়া রহমান",
    phone: "01898765432",
    address: "ফ্ল্যাট ৪বি, ধানমন্ডি ২৭",
    city: "Dhaka (Inside Dhaka)",
    note: "ভঙ্গুর জিনিস সাবধানে ডেলিভারি করবেন",
    items: [
      {
        product: "prod-cosm-1",
        name: "Hyaluronic Acid & Niacinamide Glow Serum 30ml",
        image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80",
        quantity: 2,
        buyPrice: 650,
        sellPrice: 1350,
        subtotal: 2700,
        profit: 1400,
      },
    ],
    subtotal: 2700,
    deliveryCharge: 70,
    totalAmount: 2770,
    totalBuyCost: 1300,
    totalProfit: 1400,
    status: "in_progress",
    paymentMethod: "cash_on_delivery",
    statusHistory: [
      {
        status: "pending",
        changedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        note: "অর্ডার গ্রহণ করা হয়েছে",
      },
      {
        status: "in_progress",
        changedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
        note: "প্যাকেজিং সম্পন্ন ও ইনভয়েস তৈরি",
      },
    ],
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    _id: "ord-3",
    orderId: "#AUR-664120",
    customerName: "কামরুল ইসলাম",
    phone: "01911223344",
    address: "হোল্ডিং ১২, জিইসি মোড়",
    city: "Chittagong (Outside Dhaka)",
    note: "না পেলে রিসেপশনে রেখে যাবেন",
    items: [
      {
        product: "prod-elec-2",
        name: "Ultra AMOLED Smart Watch v2",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
        quantity: 1,
        buyPrice: 1400,
        sellPrice: 2450,
        subtotal: 2450,
        profit: 1050,
      },
      {
        product: "prod-fash-1",
        name: "Premium Structured Minimalist Leather Backpack",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
        quantity: 1,
        buyPrice: 1300,
        sellPrice: 2499,
        subtotal: 2499,
        profit: 1199,
      },
    ],
    subtotal: 4949,
    deliveryCharge: 130,
    totalAmount: 5079,
    totalBuyCost: 2700,
    totalProfit: 2249,
    status: "in_courier",
    paymentMethod: "cash_on_delivery",
    statusHistory: [
      {
        status: "pending",
        changedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        note: "অর্ডার গ্রহণ",
      },
      {
        status: "in_courier",
        changedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        note: "Steadfast Courier এ হস্তান্তর করা হয়েছে - ট্র্যাকিং #SF884920",
      },
    ],
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    _id: "ord-4",
    orderId: "#AUR-551092",
    customerName: "আয়েশা সিদ্দিকা",
    phone: "01688112233",
    address: "শাহী ঈদগাহ রোড, সিলেট",
    city: "Sylhet (Outside Dhaka)",
    note: "",
    items: [
      {
        product: "prod-cosm-4",
        name: "Luxury French Noir Eau De Parfum 100ml",
        image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&q=80",
        quantity: 2,
        buyPrice: 1200,
        sellPrice: 2490,
        subtotal: 4980,
        profit: 2580,
      },
    ],
    subtotal: 4980,
    deliveryCharge: 130,
    totalAmount: 5110,
    totalBuyCost: 2400,
    totalProfit: 2580,
    status: "delivered",
    paymentMethod: "cash_on_delivery",
    statusHistory: [
      {
        status: "delivered",
        changedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        note: "গ্রাহক পণ্য বুঝে পেয়েছেন এবং ক্যাশ টাকা দিয়েছেন",
      },
    ],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
];
