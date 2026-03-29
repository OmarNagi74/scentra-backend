import bcrypt from "bcryptjs";
import { FragranceFamily, Gender, OrderStatus, Role } from "@prisma/client";
import { prisma } from "../model/prisma";

//run using npx prisma db seed
// admin@scentra.dev / Admin@12345
// sara@scentra.dev / Customer@12345
// omar@scentra.dev / Customer@12345

type ProductSeed = {
  key: string;
  brand_id: string;
  name: string;
  description: string;
  story: string;
  image_url: string;
  gender: Gender;
  fragrance_family: FragranceFamily;
  top_notes: string;
  middle_notes: string;
  base_notes: string;
  is_featured: boolean;
  is_new_arrival: boolean;
  sizes: Array<{ size: string; price: number; stock: number }>;
};

async function clearDatabase(): Promise<void> {
  await prisma.review.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.address.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.productSize.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.user.deleteMany();
}

async function main(): Promise<void> {
  await clearDatabase();

  const adminPassword = await bcrypt.hash("Admin@12345", 10);
  const customerPassword = await bcrypt.hash("Customer@12345", 10);

  const admin = await prisma.user.create({
    data: {
      full_name: "Admin One",
      email: "admin@scentra.dev",
      password_hash: adminPassword,
      role: Role.admin,
      is_email_verified: true,
      points: 500,
      phone: "+201000000001",
    },
  });

  const customer = await prisma.user.create({
    data: {
      full_name: "Sara Ahmed",
      email: "sara@scentra.dev",
      password_hash: customerPassword,
      role: Role.customer,
      is_email_verified: true,
      points: 120,
      phone: "+201000000002",
    },
  });

  const customerTwo = await prisma.user.create({
    data: {
      full_name: "Omar Hassan",
      email: "omar@scentra.dev",
      password_hash: customerPassword,
      role: Role.customer,
      is_email_verified: true,
      points: 40,
      phone: "+201000000003",
    },
  });

  await prisma.cart.createMany({
    data: [
      { user_id: admin.id },
      { user_id: customer.id },
      { user_id: customerTwo.id },
    ],
  });

  await prisma.wishlist.createMany({
    data: [
      { user_id: admin.id },
      { user_id: customer.id },
      { user_id: customerTwo.id },
    ],
  });

  const maison = await prisma.brand.create({
    data: {
      name: "Maison Lumiere",
      logo_url: "https://images.unsplash.com/photo-1612817288484-6f916006741a",
    },
  });

  const noir = await prisma.brand.create({
    data: {
      name: "Noir Atelier",
      logo_url: "https://images.unsplash.com/photo-1523293182086-7651a899d37f",
    },
  });

  const aqua = await prisma.brand.create({
    data: {
      name: "Aqua Botanica",
      logo_url: "https://images.unsplash.com/photo-1541643600914-78b084683601",
    },
  });

  const productSeeds: ProductSeed[] = [
    {
      key: "velvetRose",
      brand_id: maison.id,
      name: "Velvet Rose",
      description: "Soft rose and powdery musk with warm amber depth.",
      story: "A romantic evening scent with a modern floral trail.",
      image_url: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539",
      gender: Gender.female,
      fragrance_family: FragranceFamily.floral,
      top_notes: "Lychee, Pink Pepper",
      middle_notes: "Rose, Peony",
      base_notes: "Musk, Amber",
      is_featured: true,
      is_new_arrival: true,
      sizes: [
        { size: "50ml", price: 120, stock: 50 },
        { size: "100ml", price: 195, stock: 30 },
      ],
    },
    {
      key: "amberOud",
      brand_id: noir.id,
      name: "Amber Oud Reserve",
      description: "Dark oud wrapped in amber and saffron.",
      story: "Rich signature scent for evening wear.",
      image_url: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75",
      gender: Gender.unisex,
      fragrance_family: FragranceFamily.oriental,
      top_notes: "Saffron, Bergamot",
      middle_notes: "Oud, Rose",
      base_notes: "Amber, Vanilla",
      is_featured: true,
      is_new_arrival: false,
      sizes: [
        { size: "50ml", price: 210, stock: 25 },
        { size: "100ml", price: 320, stock: 15 },
      ],
    },
    {
      key: "citrusDrift",
      brand_id: aqua.id,
      name: "Citrus Drift",
      description: "Sparkling citrus over marine woods.",
      story: "A bright daytime scent with clean projection.",
      image_url: "https://images.unsplash.com/photo-1615634260167-c8cdede054de",
      gender: Gender.male,
      fragrance_family: FragranceFamily.citrus,
      top_notes: "Grapefruit, Lemon",
      middle_notes: "Neroli, Ginger",
      base_notes: "Cedar, White Musk",
      is_featured: false,
      is_new_arrival: true,
      sizes: [
        { size: "50ml", price: 95, stock: 60 },
        { size: "100ml", price: 150, stock: 40 },
      ],
    },
    {
      key: "oceanVetiver",
      brand_id: aqua.id,
      name: "Ocean Vetiver",
      description: "Salty sea breeze with green vetiver.",
      story: "Fresh and mineral for warm climates.",
      image_url: "https://images.unsplash.com/photo-1563170351-be82bc888aa4",
      gender: Gender.male,
      fragrance_family: FragranceFamily.aquatic,
      top_notes: "Sea Salt, Lime",
      middle_notes: "Lavender, Cypress",
      base_notes: "Vetiver, Moss",
      is_featured: false,
      is_new_arrival: false,
      sizes: [
        { size: "50ml", price: 110, stock: 45 },
        { size: "100ml", price: 175, stock: 20 },
      ],
    },
    {
      key: "cedarNoir",
      brand_id: noir.id,
      name: "Cedar Noir",
      description: "Smoky cedar and spices with leather facets.",
      story: "A confident woody profile for night events.",
      image_url: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9",
      gender: Gender.unisex,
      fragrance_family: FragranceFamily.woody,
      top_notes: "Cardamom, Black Pepper",
      middle_notes: "Cedarwood, Leather",
      base_notes: "Patchouli, Tonka",
      is_featured: true,
      is_new_arrival: false,
      sizes: [
        { size: "50ml", price: 145, stock: 35 },
        { size: "100ml", price: 230, stock: 18 },
      ],
    },
    {
      key: "whiteMuskLinen",
      brand_id: maison.id,
      name: "White Musk Linen",
      description: "Clean musk blended with airy florals.",
      story: "Soft everyday comfort scent.",
      image_url: "https://images.unsplash.com/photo-1541643600914-78b084683601",
      gender: Gender.unisex,
      fragrance_family: FragranceFamily.fresh,
      top_notes: "Aldehydes, Pear",
      middle_notes: "Iris, Lily",
      base_notes: "White Musk, Sandalwood",
      is_featured: false,
      is_new_arrival: true,
      sizes: [
        { size: "50ml", price: 90, stock: 70 },
        { size: "100ml", price: 145, stock: 42 },
      ],
    },
  ];

  const productIds: Record<string, string> = {};

  for (const seed of productSeeds) {
    const { key, sizes, ...productData } = seed;
    const product = await prisma.product.create({
      data: {
        ...productData,
        sizes: { create: sizes },
      },
    });
    productIds[key] = product.id;
  }

  await prisma.banner.createMany({
    data: [
      {
        image_url: "https://images.unsplash.com/photo-1594035910387-fea47794261f",
        title: "Best Seller: Amber Oud Reserve",
        product_id: productIds.amberOud,
      },
      {
        image_url: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539",
        title: "New Arrival: Velvet Rose",
        product_id: productIds.velvetRose,
      },
      {
        image_url: "https://images.unsplash.com/photo-1615634260167-c8cdede054de",
        title: "Summer Picks",
        product_id: productIds.citrusDrift,
      },
    ],
  });

  const customerMainAddress = await prisma.address.create({
    data: {
      user_id: customer.id,
      label: "Home",
      street: "12 Nile Street",
      city: "Cairo",
      state: "Cairo",
      zip_code: "11511",
      country: "Egypt",
      is_default: true,
    },
  });

  await prisma.address.create({
    data: {
      user_id: customer.id,
      label: "Office",
      street: "88 Business Park",
      city: "Cairo",
      state: "Cairo",
      zip_code: "11835",
      country: "Egypt",
      is_default: false,
    },
  });

  const customerTwoAddress = await prisma.address.create({
    data: {
      user_id: customerTwo.id,
      label: "Home",
      street: "5 Corniche Road",
      city: "Alexandria",
      state: "Alexandria",
      zip_code: "21519",
      country: "Egypt",
      is_default: true,
    },
  });

  await prisma.paymentMethod.createMany({
    data: [
      { user_id: customer.id, type: "card", provider: "visa", last4: "4242" },
      { user_id: customer.id, type: "card", provider: "mastercard", last4: "5454" },
      { user_id: customer.id, type: "digital_wallet", provider: "apple_pay", last4: null },
    ],
  });

  const customerCart = await prisma.cart.findUnique({ where: { user_id: customer.id } });
  const customerWishlist = await prisma.wishlist.findUnique({ where: { user_id: customer.id } });
  const customerTwoWishlist = await prisma.wishlist.findUnique({ where: { user_id: customerTwo.id } });

  if (!customerCart || !customerWishlist || !customerTwoWishlist) {
    throw new Error("Cart or wishlist creation failed during seed.");
  }

  await prisma.cartItem.createMany({
    data: [
      { cart_id: customerCart.id, product_id: productIds.cedarNoir, size: "50ml", quantity: 1 },
      { cart_id: customerCart.id, product_id: productIds.whiteMuskLinen, size: "100ml", quantity: 2 },
    ],
  });

  await prisma.wishlistItem.createMany({
    data: [
      { wishlist_id: customerWishlist.id, product_id: productIds.oceanVetiver },
      { wishlist_id: customerWishlist.id, product_id: productIds.citrusDrift },
      { wishlist_id: customerTwoWishlist.id, product_id: productIds.velvetRose },
    ],
  });

  await prisma.order.create({
    data: {
      user_id: customer.id,
      address_id: customerMainAddress.id,
      status: OrderStatus.delivered,
      total_price: 653.2,
      payment_method: "visa",
      delivery_method: "express",
      order_items: {
        create: [
          { product_id: productIds.amberOud, quantity: 2, price: 210, size: "50ml" },
          { product_id: productIds.velvetRose, quantity: 1, price: 120, size: "50ml" },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      user_id: customerTwo.id,
      address_id: customerTwoAddress.id,
      status: OrderStatus.paid,
      total_price: 102.6,
      payment_method: "mastercard",
      delivery_method: "standard",
      order_items: {
        create: [{ product_id: productIds.citrusDrift, quantity: 1, price: 95, size: "50ml" }],
      },
    },
  });

  await prisma.review.createMany({
    data: [
      {
        user_id: customer.id,
        product_id: productIds.velvetRose,
        rating: 5,
        comment: "Beautiful floral scent with strong performance.",
      },
      {
        user_id: customer.id,
        product_id: productIds.amberOud,
        rating: 4,
        comment: "Very rich and long lasting.",
      },
    ],
  });

  console.log("Seed completed successfully.");
  console.log("Admin login: admin@scentra.dev / Admin@12345");
  console.log("Customer login: sara@scentra.dev / Customer@12345");
  console.log("Customer login: omar@scentra.dev / Customer@12345");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
