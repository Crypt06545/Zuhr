This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


app/
├── layout.jsx                # (<App /> Layout / Root Layout)
├── page.jsx                  # (Home - /)
├── not-found.jsx             # (NotFound component - *)
│
├── products/
│   ├── page.jsx              # (ProductsPage - /products)
│   └── [slug]/
│       └── page.jsx          # (ProductDetails - /products/:slug)
│
├── profile/
│   └── page.jsx              # (UserProfile - /profile)
│
├── track-order/
│   ├── page.jsx              # (TrackOrderPage - /track-order)
│   └── [orderId]/
│       └── page.jsx          # (TrackOrderPage with ID - /track-order/:orderId)
│
├── cart/
│   └── page.jsx              # (CartPage - /cart)
│
├── checkout/
│   └── page.jsx              # (CheckoutPage - /checkout)
│
├── contact/
│   └── page.jsx              # (Contact - /contact)
│
├── about/
│   └── page.jsx              # (AboutUs - /about)
│
├── datapolicy/
│   └── page.jsx              # (PrivacyPolicy - /datapolicy)
│
├── after-sales-policy/
│   └── page.jsx              # (AfterSalesSupport - /after-sales-policy)
│
├── verify-email/
│   └── page.jsx              # (VerifyEmail - /verify-email)
│
├── (auth)/                    # Route Group (Guest Routes)
│   ├── layout.jsx            # (<GuestRoute /> logic wrap করার জন্য)
│   ├── login/
│   │   └── page.jsx          # (Login - /login)
│   ├── register/
│   │   └── page.jsx          # (Register - /register)
│   ├── forgot-password/
│   │   └── page.jsx          # (ForgotPasswordForm - /forgot-password)
│   ├── verify-otp/
│   │   └── page.jsx          # (VerifyOtpForm - /verify-otp)
│   └── reset-password/
│       └── page.jsx          # (ResetPasswordForm - /reset-password)
│
└── admin/                     # Protected Admin Routes
    └── dashboard/
        ├── layout.jsx        # (<ProtectedRoute /> + <DashLayout />)
        ├── page.jsx          # (Dashboard - /admin/dashboard)
        ├── analytics/
        │   └── page.jsx      # (Analytics - /admin/dashboard/analytics)
        ├── products/
        │   └── page.jsx      # (AllProducts - /admin/dashboard/products)
        ├── categories/
        │   └── page.jsx      # (AllCategories - /admin/dashboard/categories)
        ├── coupons/
        │   └── page.jsx      # (AllCoupons - /admin/dashboard/coupons)
        ├── orders/
        │   ├── page.jsx      # (AllOrders - /admin/dashboard/orders)
        │   └── invoice/
        │       └── page.jsx  # (AdminInvoiceView - /admin/dashboard/orders/invoice)
        ├── customers/
        │   └── page.jsx      # (Customer - /admin/dashboard/customers)
        ├── inventory/
        │   └── page.jsx      # (Inventory - /admin/dashboard/inventory)
        └── expenses/
            └── page.jsx      # (Expenses - /admin/dashboard/expenses)
