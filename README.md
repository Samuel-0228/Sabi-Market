# 🛒 Savvy Market – Multi-Vendor E-Commerce Platform

A production-grade multi-vendor marketplace built with **React, Vite, TypeScript, and Supabase**.

This platform enables buyers and sellers to interact in real time, manage orders, and operate a scalable online marketplace with Telegram-style messaging.

---

## 🚀 Tech Stack

- **Frontend:** React + Vite + TypeScript
- **Backend:** Supabase (Postgres, Auth, Realtime)
- **Architecture:** Feature-driven modular structure
- **State Management:** Scoped feature state + minimal global auth/UI state

---

## 📦 Core Features

### 👤 Authentication

- Secure Supabase Auth
- Session hydration on reload
- Auth guard for protected routes
- Role-based access (buyer / seller)

---

### 🛍️ Marketplace

#### Buyers

- Browse product feed
- Search and filter products
- View seller stores
- Add to cart & checkout
- Track order history
- Real-time chat with sellers

#### Sellers

- Create & manage listings
- View listing count and details
- Manage incoming orders
- Update order status
- Seller dashboard overview

---

### 📦 Orders System

Full order lifecycle:

```
pending → paid → processing → shipped → delivered → cancelled/refunded
```

- Server-authoritative order validation
- Stock validation before checkout
- Seller order management
- Buyer order tracking

---

### 💬 Telegram-Style Messaging

- Realtime Supabase subscriptions
- Scoped per conversation
- Optimistic UI updates
- Automatic cleanup on unmount
- No cross-feature side effects

---

## 🧠 Architecture Overview

This project follows a **feature-driven, layered architecture**:

```
src/
├── app/           # App bootstrap & global providers
├── shared/        # Reusable components & utilities
├── entities/      # Domain models (pure data logic)
├── features/      # Business features (chat, orders, feed, etc.)
└── index.tsx
```

### Key Principles

- 🔒 Realtime logic lives ONLY inside the chat feature
- 📦 Orders and feed use request/response (no realtime)
- 🧩 Global state limited to auth and UI preferences
- 🧹 All subscriptions are cleaned up on unmount
- 🛑 No async logic inside store constructors
- ⚡ All data fetches support cancellation via `AbortController`

---

## 🔁 Stability & Lifecycle Safety

The app prevents:

- Infinite loading after reload
- Deadlocks caused by unresolved promises
- Realtime listeners surviving navigation
- Cross-feature state contamination

Session hydration is handled before rendering protected routes.

---

## ⚙️ Local Development

### Prerequisites

- Node.js (v18+ recommended)
- Supabase project

---

### 1️⃣ Clone the repository

```bash
git clone <your-repo-url>
cd savvy-market
```

---

### 2️⃣ Install dependencies

```bash
npm install
```

---

### 3️⃣ Configure environment variables

Create `.env.local`:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

### 4️⃣ Run the app

```bash
npm run dev
```

---

## 🛡 Security & Access Control

- Role-based permissions (buyer vs seller)
- Orders restricted by ownership
- Chat scoped by conversation membership
- Server-side validation of sensitive operations

---

## 📈 Production Readiness

- Clean build (no blocking warnings)
- Memory-safe realtime subscriptions
- No global blocking async state
- Scalable feature isolation
- Modular domain structure

---

## 🎯 Vision

The goal of this platform is to combine:

- 🛍 Shopify-level marketplace reliability
- 💬 Telegram-level messaging responsiveness
- 🧠 Clean, scalable architecture

Designed to scale from MVP to full marketplace without major rewrites.

---

## 📄 License

Private project. All rights reserved.
