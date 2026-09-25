import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { Admin } from "./models/Admin";
import { Product } from "./models/Product";
import { Offer } from "./models/Offer";
import { Order } from "./models/Order";

const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/auramart";

const seedData = async () => {
  try {
    console.log("Connecting to MongoDB for seeding...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    // 1. Seed or update Admin
    const adminEmail = (process.env.ADMIN_EMAIL || "afnan@gmail.com").toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || "afnan31403140";

    let admin = await Admin.findOne({ email: adminEmail });
    if (!admin) {
      admin = new Admin({
        name: "Afnan Johad",
        email: adminEmail,
        password: adminPassword,
        role: "admin",
      });
      await admin.save();
      console.log(`✅ Admin created: ${adminEmail}`);
    } else {
      admin.password = adminPassword;
      await admin.save();
      console.log(`✅ Admin updated with provided credentials: ${adminEmail}`);
    }

    // 2. Clear and seed Products
    await Product.deleteMany({});

    const initialProducts = [
      // ELECTRONICS
      {
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
      },
      {
        name: "Ultra AMOLED Smart Watch v2",
        slug: "ultra-amoled-smart-watch-v2",
        description:
          "1.96-inch HD AMOLED display, Bluetooth calling, SpO2 & 24/7 heart rate monitor, IP68 water resistant zinc alloy casing.",
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
      },
      {
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
      },
      {
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
      },

      // COSMETICS
      {
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
          Origin: "Imported Premium",
        },
      },
      {
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
          Finish: "Soft Matte Velvet",
        },
      },
      {
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
          Ingredients: "100% Organic Extracts",
        },
      },
      {
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
          Volume: "100 ml",
          Longevity: "12+ Hours",
        },
      },

      // FASHION
      {
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
      },
      {
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
          Glass: "Scratch-resistant Sapphire",
        },
      },
      {
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
          Fabric: "100% Combed Cotton 240 GSM",
          Fit: "Streetwear Oversized",
        },
      },
      {
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
          RFID: "Enabled",
        },
      },
    ];

    const insertedProducts = await Product.insertMany(initialProducts);
    console.log(`✅ Seeded ${insertedProducts.length} products across Electronics, Cosmetics, and Fashion.`);

    // 3. Clear and seed Offers & Special Notice Ticker
    await Offer.deleteMany({});

    const initialOffers = [
      {
        title: "Exclusive Tech & Glamour Season Sale",
        subtitle: "Up to 35% Discount on Electronics, Cosmetics & Premium Fashion!",
        bannerImage:
          "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80",
        discountPercentage: 35,
        badge: "HOT DEALS",
        link: "/?category=all",
        active: true,
        isNoticeTicker: false,
      },
      {
        title: "Latest Smart Gadgets & Audio Gear",
        subtitle: "Fast Cash On Delivery Nationwide with 100% Original Guarantee",
        bannerImage:
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&q=80",
        discountPercentage: 25,
        badge: "TECH SPECIAL",
        link: "/?category=electronics",
        active: true,
        isNoticeTicker: false,
      },
      {
        title: "Glowing Skin & Premium Fragrance Collection",
        subtitle: "Enhance your beauty routine with authentic luxury skincare",
        bannerImage:
          "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=1600&q=80",
        discountPercentage: 30,
        badge: "BEAUTY FEST",
        link: "/?category=cosmetics",
        active: true,
        isNoticeTicker: false,
      },
      // Scrolling Notice Ticker (Top Bar)
      {
        title: "Welcome Notice",
        subtitle: "",
        active: true,
        isNoticeTicker: true,
        noticeText:
          "⭐ AuraMart স্পেশাল অফার! সারা বাংলাদেশে ক্যাশ অন ডেলিভারি (Cash on Delivery) সুবিধা। অর্ডার করতে এখনই যেকোনো পণ্যে ক্লিক করুন! হেল্পলাইন: 01700-000000",
      },
    ];

    await Offer.insertMany(initialOffers);
    console.log(`✅ Seeded promotional banners and notice ticker.`);

    // 4. Seed initial realistic Orders for Profit/Loss tracking and Pending list demonstration
    await Order.deleteMany({});

    const sampleOrders = [
      {
        orderId: "#AUR-829101",
        customerName: "Md. Tanvir Hossain",
        phone: "01712345678",
        address: "House 24, Road 7, Sector 3, Uttara",
        city: "Dhaka",
        note: "Please call before delivery in afternoon",
        items: [
          {
            product: insertedProducts[0]._id,
            name: insertedProducts[0].name,
            image: insertedProducts[0].images[0],
            quantity: 1,
            buyPrice: insertedProducts[0].buyPrice, // 1800
            sellPrice: insertedProducts[0].sellPrice, // 3200
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
            note: "New order placed by customer via Cash on Delivery",
          },
        ],
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        orderId: "#AUR-773912",
        customerName: "Sadia Rahman",
        phone: "01898765432",
        address: "Flat 4B, Dhanmondi 27",
        city: "Dhaka",
        note: "Fragile items, handle with care",
        items: [
          {
            product: insertedProducts[4]._id, // Serum
            name: insertedProducts[4].name,
            image: insertedProducts[4].images[0],
            quantity: 2,
            buyPrice: insertedProducts[4].buyPrice, // 650
            sellPrice: insertedProducts[4].sellPrice, // 1350
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
            note: "Order placed",
          },
          {
            status: "in_progress",
            changedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
            note: "Packaging and invoice generated",
          },
        ],
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        orderId: "#AUR-664120",
        customerName: "Kamrul Islam",
        phone: "01911223344",
        address: "Holding 12, GEC Circle",
        city: "Chittagong (Outside Dhaka)",
        note: "Leave at reception if unavailable",
        items: [
          {
            product: insertedProducts[1]._id, // Smartwatch
            name: insertedProducts[1].name,
            image: insertedProducts[1].images[0],
            quantity: 1,
            buyPrice: insertedProducts[1].buyPrice, // 1400
            sellPrice: insertedProducts[1].sellPrice, // 2450
            subtotal: 2450,
            profit: 1050,
          },
          {
            product: insertedProducts[8]._id, // Backpack
            name: insertedProducts[8].name,
            image: insertedProducts[8].images[0],
            quantity: 1,
            buyPrice: insertedProducts[8].buyPrice, // 1300
            sellPrice: insertedProducts[8].sellPrice, // 2499
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
            note: "Order placed",
          },
          {
            status: "in_progress",
            changedAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
            note: "Handed over to fulfillment",
          },
          {
            status: "in_courier",
            changedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
            note: "Picked up by Steadfast Courier - Tracking #SF884920",
          },
        ],
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      },
      {
        orderId: "#AUR-551092",
        customerName: "Ayesha Siddiqua",
        phone: "01688112233",
        address: "Shahi Eidgah Road, Sylhet",
        city: "Sylhet (Outside Dhaka)",
        note: "",
        items: [
          {
            product: insertedProducts[7]._id, // French Noir Perfume
            name: insertedProducts[7].name,
            image: insertedProducts[7].images[0],
            quantity: 2,
            buyPrice: insertedProducts[7].buyPrice, // 1200
            sellPrice: insertedProducts[7].sellPrice, // 2490
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
            status: "pending",
            changedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            note: "Order placed",
          },
          {
            status: "in_progress",
            changedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            note: "Confirmed",
          },
          {
            status: "in_courier",
            changedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            note: "In transit",
          },
          {
            status: "delivered",
            changedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            note: "Delivered & Cash collected",
          },
        ],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    ];

    await Order.insertMany(sampleOrders);
    console.log(`✅ Seeded ${sampleOrders.length} sample orders with full profit/loss data.`);

    console.log("\n🎉 Database seeding finished successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedData();
