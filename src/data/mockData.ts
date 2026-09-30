export interface ProductItem {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
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

// 1. In-Memory Products Store - Managed strictly via MongoDB
export const mockProducts: ProductItem[] = [];

// 2. In-Memory Promotional Offers & Notices
export const mockOffers: OfferRecord[] = [
  {
    _id: "off-1",
    title: "GAXIN MART গ্র্যান্ড সেল — ৩৫% পর্যন্ত বিশাল ছাড়!",
    subtitle: "Men's Fashion, Women's Fashion, Gadgets & Lifestyle পণ্যে সারা বাংলাদেশে ক্যাশ অন ডেলিভারি।",
    bannerImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80",
    discountPercentage: 35,
    badge: "GAXIN SPECIAL",
    link: "/?category=all",
    active: true,
    isNoticeTicker: false,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
  {
    _id: "off-2",
    title: "লেটেস্ট স্মার্ট গ্যাজেটস ও ওয়্যারলেস অডিও",
    subtitle: "১০০% অরিজিনাল ব্র্যান্ড কোয়ালিটি ওয়ারেন্টি সহ দ্রুত ডেলিভারি সুবিধা। WhatsApp: 01356584296",
    bannerImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&q=80",
    discountPercentage: 25,
    badge: "GADGETS FEST",
    link: "/?category=gadgets-electronics",
    active: true,
    isNoticeTicker: false,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
  },
  {
    _id: "off-3",
    title: "এক্সক্লুসিভ ফ্যাশন ও ট্রেন্ডি লাইফস্টাইল কালেকশন",
    subtitle: "পুরুষ ও নারীদের প্রিমিয়াম পোশাক, ব্যাগ ও এক্সেসরিজে স্পেশাল অফার!",
    bannerImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80",
    discountPercentage: 30,
    badge: "TRENDING FASHION",
    link: "/?category=mens-fashion",
    active: true,
    isNoticeTicker: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    _id: "notice-1",
    title: "Header Top Announcement Notice",
    subtitle: "Official Announcement",
    bannerImage: "",
    discountPercentage: 0,
    badge: "SPECIAL NOTICE",
    link: "",
    active: true,
    isNoticeTicker: true,
    noticeText:
      "⭐ GAXIN MART স্পেশাল অফার! সারা বাংলাদেশে দ্রুত ক্যাশ অন ডেলিভারি (Cash on Delivery) সুবিধা। সরাসরি WhatsApp এ মেসেজ বা কল করুন: 01356584296",
    createdAt: new Date(),
  },
];

// 3. In-Memory Orders Store
export const mockOrders: OrderRecord[] = [
  {
    _id: "ord-1",
    orderId: "#GX-982410",
    customerName: "তানভীর আহমেদ",
    phone: "01712345678",
    address: "বাড়ি #২৪, রোড #৭, উত্তরা সেক্টর ৩",
    city: "Dhaka (Inside Dhaka)",
    note: "বিকেলে ডেলিভারি দিলে ভালো হয়",
    items: [
      {
        product: "prod-gadget-1",
        name: "Wireless ANC Pro Over-Ear Hi-Fi Headphones",
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
        note: "অর্ডার গ্রহণ করা হয়েছে - কনফার্মেশনের জন্য কল দেওয়া হবে",
      },
    ],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    _id: "ord-2",
    orderId: "#GX-873912",
    customerName: "সাদিয়া রহমান",
    phone: "01898765432",
    address: "ফ্ল্যাট ৪বি, ধানমন্ডি ২৭",
    city: "Dhaka (Inside Dhaka)",
    note: "সাবধানে ডেলিভারি করবেন",
    items: [
      {
        product: "prod-women-2",
        name: "Luxury Crossbody Structured Leather Handbag",
        image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80",
        quantity: 1,
        buyPrice: 980,
        sellPrice: 1790,
        subtotal: 1790,
        profit: 810,
      },
      {
        product: "prod-men-1",
        name: "Premium Slim-Fit Cotton Formal Shirt",
        image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80",
        quantity: 1,
        buyPrice: 750,
        sellPrice: 1250,
        subtotal: 1250,
        profit: 500,
      },
    ],
    subtotal: 3040,
    deliveryCharge: 70,
    totalAmount: 3110,
    totalBuyCost: 1730,
    totalProfit: 1310,
    status: "in_progress",
    paymentMethod: "cash_on_delivery",
    statusHistory: [
      {
        status: "pending",
        changedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        note: "অর্ডার গ্রহণ",
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
    orderId: "#GX-664120",
    customerName: "কামরুল ইসলাম",
    phone: "01911223344",
    address: "হোল্ডিং ১২, জিইসি মোড়",
    city: "Chittagong (Outside Dhaka)",
    note: "না পেলে রিসেপশনে রেখে যাবেন",
    items: [
      {
        product: "prod-gadget-2",
        name: "Ultra AMOLED Smart Watch v2 with Bluetooth Calling",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
        quantity: 1,
        buyPrice: 1400,
        sellPrice: 2450,
        subtotal: 2450,
        profit: 1050,
      },
    ],
    subtotal: 2450,
    deliveryCharge: 130,
    totalAmount: 2580,
    totalBuyCost: 1400,
    totalProfit: 1050,
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
    orderId: "#GX-551092",
    customerName: "আয়েশা সিদ্দিকা",
    phone: "01688112233",
    address: "শাহী ঈদগাহ রোড, সিলেট",
    city: "Sylhet (Outside Dhaka)",
    note: "",
    items: [
      {
        product: "prod-kid-1",
        name: "Bilingual Interactive Audio Flash Cards Learning Toy",
        image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&q=80",
        quantity: 1,
        buyPrice: 520,
        sellPrice: 990,
        subtotal: 990,
        profit: 470,
      },
    ],
    subtotal: 990,
    deliveryCharge: 130,
    totalAmount: 1120,
    totalBuyCost: 520,
    totalProfit: 470,
    status: "delivered",
    paymentMethod: "cash_on_delivery",
    statusHistory: [
      {
        status: "delivered",
        changedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        note: "গ্রাহক পণ্য বুঝে পেয়েছেন এবং ক্যাশ টাকা পরিশোধ করেছেন",
      },
    ],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
];
