# ሳቪ – Savvy Market

Savvy Market is a student-focused e-commerce platform designed for **Addis Ababa University (AAU)** students.
It allows students to **buy, sell, and discover goods and services** within the university community in a safe and organized marketplace.

The platform replaces scattered selling on Telegram groups and channels by providing a **centralized, trusted, and structured marketplace** where students can list products, offer tutoring, sell course materials, and connect with buyers.

---

## Overview

Savvy Market enables students to:

- Buy and sell **legal goods** within the university community
- Offer **tutoring services**
- Sell **course materials or digital resources**
- Manage their own **seller storefront**
- Discover competitors and market prices
- Safely complete transactions with **verified accounts**

The platform also introduces a **commission-based marketplace model**, allowing the platform to sustain itself while supporting student entrepreneurs.

---

## Key Features

### User Accounts

- Secure user registration and login
- Email verification using Supabase Auth
- User profiles with activity history
- Seller verification option

### Marketplace

- Product listings with images, descriptions, and pricing
- Categories for goods, services, and tutoring
- Search and filtering for easy discovery
- Seller storefront pages

### Orders & Transactions

- Buyers can place orders directly from listings
- Sellers manage their own delivery arrangements
- Order status tracking
- Commission-based platform revenue

### Seller Dashboard

- Create, edit, and delete listings
- Track sales and orders
- View listing performance

### Reviews & Trust

- Buyers can rate and review sellers
- Builds a reputation system inside the marketplace

### Admin Management

- Monitor listings
- Moderate inappropriate products
- Manage disputes
- Platform analytics

---

## Tech Stack

Frontend

- React / Next.js
- TailwindCSS (UI styling)

Backend

- Supabase

Services Used

- Supabase Authentication (user accounts & verification)
- Supabase Postgres Database
- Supabase Storage (images and files)

Hosting

- Vercel

---

## Database Structure (Conceptual)

Main entities used in the system:

- users
- sellers
- listings
- orders
- payments
- reviews
- disputes

These entities manage the marketplace workflow including listings, orders, transactions, and user reputation.

---

## Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/samuel-0228/sabi-market.git
cd sabi-market
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create environment variables

Create a `.env.local` file and add:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the development server

```bash
npm run dev
```

The application will run on:

```
http://localhost:3000
```

---

## Project Structure

```
savvy-market/
│
├── components
│   ├── product
│   ├── seller
│   └── ui
│
├── pages
│   ├── index
│   ├── auth
│   ├── dashboard
│   ├── orders
│   └── listings
│
├── lib
│   └── supabase
│
├── public
│   └── images
│
└── styles
```

---

## Platform Workflow

1. User registers and verifies email.
2. User can browse listings or create a seller listing.
3. Buyers place orders from the listing page.
4. Sellers handle delivery or meetup.
5. Buyers confirm order completion.
6. Platform deducts commission from the transaction.

---

## Future Improvements

Planned features include:

- Escrow payment system
- Advanced seller analytics
- Smart product recommendations
- Mobile application
- Expansion to other Ethiopian universities
- In-platform messaging between buyers and sellers

---

## Contribution

Contributions are welcome.
If you would like to improve the platform, feel free to open a pull request or submit an issue.

---

## License

This project is licensed under the MIT License.

---

## Author

Created for the Addis Ababa University student community.

**ሳቢ – Savvy Market**
