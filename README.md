# Scentra Backend

Backend API for a perfume e-commerce platform with authentication, catalog/discovery, cart/checkout, order tracking, delivery operations, admin analytics, and AI chatbot recommendations.

## Tech Stack
- Node.js + Express 5 + TypeScript
- Prisma ORM + PostgreSQL
- JWT authentication
- Socket.IO for real-time delivery chat/tracking events
- Multer for image uploads (avatars, product images, brand logos)
- Firebase Admin + Firestore + Nodemailer for OTP email verification
- Optional AI providers for chatbot (Groq, OpenAI, Hugging Face, Ollama)

## Core Features

### 1) Authentication & User Profile
- User registration with hashed password and mandatory email verification
- OTP verification flow and resend cooldown
- Alternative Firebase OTP signup flow (`/signup` + `/verify-otp`)
- JWT login/logout (stateless logout)
- Get current profile (`/me`) and personal stats (`/me/stats`)
- Update profile (name, phone, avatar URL)
- Upload/delete avatar image
- Change password
- Role-aware access control (`admin`, `customer`, `delivery_person`)

### 2) Home Experience
- Home endpoint serving:
  - Promotional banners
  - New arrivals list
- Automatic conversion of stored image paths to absolute URLs

### 3) Product Catalog
- Product listing with filters:
  - `brand_id`
  - `gender`
  - `fragrance_family`
  - `is_new_arrival`
  - search text (name/description/brand)
  - pagination (`page`, `limit`)
- Product details with:
  - brand data
  - sizes/prices
  - reviews and average rating
- Product reviews (1–5 rating)
- Admin product CRUD
- Admin product image upload
- Admin brand logo upload
- Validation for size payloads, duplicates, stock/price correctness

### 4) Discover Module
- Discover landing data:
  - fragrance families aggregation
  - trending products (by sold quantity)
  - featured brands
- Brand search by name
- Product filtering by gender/family
- Brand details with products
- Popular houses list with product previews

### 5) Cart Management
- Get cart items + computed summary
  - subtotal
  - tax (15% estimate from cart service)
  - total
- note: final checkout currently recalculates tax at 8% in order placement logic
- Add item by product + size
- Update quantity and size selection
- Remove single item
- Clear all cart items
- Stock validation on add/update

### 6) Address Book
- List user addresses (default first)
- Add new address with optional geo coordinates
- Update address
- Delete address
- Default address management logic (single default)

### 7) Payment Methods
- Add payment method (card or wallet metadata)
- List payment methods
- Update payment method
- Delete payment method

### 8) Orders & Checkout
- Place order from current cart
  - verifies cart/address
  - decrements inventory in transaction
  - calculates totals (8% tax + express shipping fee)
  - note: checkout tax calculation currently differs from cart estimate
  - creates order items
  - clears cart
  - awards loyalty points
  - inserts initial system delivery message
- Auto payment simulation that confirms pending orders after placement
- Order history
- Order details by ID
- Customer tracker payload (order + delivery messages)
- Customer order actions:
  - mark received
  - cancel
- Customer delivery chat messages + message seen receipts

### 9) Delivery Operations
- Delivery-only protected APIs
- View available orders to claim
- View assigned orders
- Claim order (sets to shipped and assigns delivery person)
- Update live delivery location (lat/lng + timestamp)
- Delivery tracker payload
- Delivery-to-customer chat messaging
- Delivery message seen receipts

### 10) Real-time Tracking & Chat (Socket.IO)
- Join/leave room per order (`order:{id}`)
- Real-time delivery typing indicators
- Real-time new delivery message broadcast
- Real-time read receipt events
- Socket-side message read persistence helper

### 11) Admin Dashboard & Operations
- Dashboard KPIs:
  - total revenue
  - total orders
  - total customers
  - pending orders
  - low stock items
- Top-selling product leaderboard
- Analytics overview by period (`week`, `month`, `year`)
  - revenue time series
  - order status distribution
- Admin order listing (search/filter/pagination)
- Admin order status updates
- Inventory view with low-stock filter
- Stock update by product size

### 12) AI Chatbot
- Endpoint for standard response and SSE streaming response
- Two chat modes:
  - **General assistant** mode for open conversation
  - **Shopping assistant** mode for perfume recommendation
- Recommendation extraction based on:
  - budget
  - fragrance family
  - gender
  - search terms/history
- Multi-provider AI fallback chain and graceful degradation
- Budget truth-guard to prevent misleading “within budget” claims
- Arabic and English reply behavior

### 13) Seed Data
- Full seed script to initialize:
  - users (admin/customer/delivery)
  - brands, products, sizes, banners
  - addresses, payment methods
  - carts, wishlists, reviews
  - realistic order lifecycle + delivery messages
- Includes image materialization into `/uploads/*`

## API Route Groups
- `/api/auth`
- `/api/home`
- `/api/discover`
- `/api/products`
- `/api/cart`
- `/api/address`
- `/api/payment`
- `/api/orders`
- `/api/wishlist`
- `/api/admin`
- `/api/delivery`
- `/api/chatbot`

## Environment Variables
Required and optional variables used by the backend:

### Required for core startup
- `DATABASE_URL` (PostgreSQL connection string)
- `JWT_SECRET`

### Server and upload configuration
- `PORT` (optional, defaults to 4001; if busy, it retries sequentially on 4002, 4003, ... up to 10 attempts)
- `MAX_FILE_SIZE` (optional upload limit, bytes)
- `NODE_ENV` (optional, affects dev logging)

### Required for email + Firebase OTP flow
- `FIREBASE_PROJECT_ID`
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`

### Optional AI provider config (chatbot)
- `GROQ_API_KEY`, `GROQ_MODEL`
- `OPENAI_API_KEY`, `OPENAI_MODEL`
- `HUGGINGFACE_API_KEY` or `HF_API_KEY`
- `HUGGINGFACE_MODEL` or `HF_MODEL`
- `OLLAMA_BASE_URL`, `OLLAMA_MODEL`

## Local Setup
1. Install dependencies
   - `npm install`
2. Configure `.env` with required values
3. Run migrations
   - `npx prisma migrate deploy`
4. Seed database (optional but recommended)
   - `npx prisma db seed`
5. Start development server
   - `npm run dev`

## Scripts
- `npm run dev` → starts server with nodemon + ts-node
- `npm test` → placeholder script (test suite is not implemented yet in this repository)

## Notes
- Uploaded files are served from `/uploads`
- Auth middleware requires `Authorization: Bearer <token>`
- Admin and delivery routes enforce role checks via middleware
