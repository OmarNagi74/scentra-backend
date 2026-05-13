# Scentra Backend — Feature Presentation

## Slide 1: Product Overview
- Scentra Backend powers a fragrance e-commerce platform.
- Supports customer, admin, and delivery workflows.
- Combines REST APIs, real-time events, and AI recommendations.

## Slide 2: Platform Capabilities at a Glance
- Authentication with email verification and OTP
- Product catalog and discovery experiences
- Cart, wishlist, addresses, payment methods
- Checkout, order lifecycle, and live delivery tracking
- Admin analytics, inventory, and order operations
- AI chatbot for shopping and general assistance

## Slide 3: User Roles
- **Customer**: browse, buy, track, chat with delivery, review products
- **Admin**: manage products/inventory/orders and monitor business metrics
- **Delivery Person**: claim orders, update location, communicate with customer

## Slide 4: Authentication & Security
- Passwords are hashed using bcrypt
- JWT-based auth for protected APIs
- Role-based access control in middleware
- Email verification required in main register/login flow
- Signup and OTP verification rate-limited to reduce abuse

## Slide 5: Catalog & Product Experience
- Product listing with filter + search + pagination
- Product details include notes, story, sizes, and brand data
- Ratings and review support
- Admin product CRUD
- Image upload support for products and brand logos

## Slide 6: Home & Discover Experience
- Home endpoint returns banners + new arrivals
- Discover endpoint surfaces:
  - fragrance families
  - trending products (sales-based)
  - featured brands
- Additional discover APIs for brand search, filtering, and brand detail pages

## Slide 7: Cart, Wishlist, Address, Payment
- Cart supports add/update/remove/clear with stock checks
- Cart summary calculates subtotal, tax, and total
- Wishlist supports add/remove/clear
- Address module supports CRUD + default address behavior + geo-coordinates
- Payment method module supports CRUD for customer payment instruments

## Slide 8: Checkout & Order Lifecycle
- Order placement from cart is transactional
- Automatically decrements stock and creates order items
- Calculates taxes + optional express shipping
- Clears cart and awards loyalty points
- Adds system delivery messages for timeline visibility
- Simulated payment confirmation upgrades order from pending to paid

## Slide 9: Delivery Module
- Delivery partner sees available and assigned orders
- Can claim order (assign + set shipped status)
- Can update live location coordinates
- Can exchange messages with customer per order
- Can mark message read status

## Slide 10: Real-Time Layer (Socket.IO)
- Rooms scoped by order ID
- Real-time events:
  - new delivery message
  - typing indicator
  - read receipts
- Improves tracking and customer-delivery communication UX

## Slide 11: Admin Dashboard & Operations
- Dashboard KPI summary:
  - revenue, customers, orders, pending, low stock
- Sales leaderboard of top products
- Revenue analytics by week/month/year
- Order status distribution analytics
- Admin order search/filter/pagination
- Inventory inspection + stock patch endpoints

## Slide 12: AI Chatbot
- Supports standard and streaming API responses (SSE)
- Detects intent: shopping vs general assistant mode
- Shopping mode extracts budget/family/gender/keywords and ranks products
- Multi-provider AI fallback chain (Groq/OpenAI/HuggingFace/Ollama)
- Arabic and English support
- Includes budget truth guard for safer recommendation messaging

## Slide 13: Data & Seeding
- Prisma schema models users, products, sizes, orders, messages, payments, banners, etc.
- Seed script provisions realistic demo data for all flows
- Seed also prepares local upload assets and sample operational records

## Slide 14: Deployment/Run Requirements
- Required: `DATABASE_URL`, `JWT_SECRET`
- Required for OTP/email: `FIREBASE_PROJECT_ID`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`
- Optional AI provider keys for enhanced chatbot quality
- Development run command: `npm run dev`

## Slide 15: Business Value
- End-to-end commerce operations in one backend
- Strong role isolation for operations and logistics
- Real-time post-purchase experience
- Built-in analytics for admin decision making
- AI assistant increases product discovery and conversion potential
