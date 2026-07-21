# Lakeview Homes Property Website

A buyer-facing property presentation for 301 Ilang-Ilang Street, Lakeview Homes Subdivision, Putatan, Muntinlupa City. Built with Vite, React, Tailwind CSS, and the RealMatch Supabase project.

## Property presentation

The property comprises two adjoining titled lots offered together:

- Lot 5-A: 95 sqm
- Lot 5-B: 100 sqm
- Combined titled area: 195 sqm

The public page includes the real-property gallery, location advantages, property composition, title disclosures, buyer inquiry actions, and viewing contact links.

## Goodvibes LTD private demo

The site has a server-controlled homeowner preview and manual GCash activation workflow.

- Preview duration: 60 seconds
- Activation price: ₱5,000
- Payment method: supplied Goodvibes LTD GCash QR
- Payment verification: manual review by Goodvibes LTD
- Administrator email: `markjohnsonbanatao888@gmail.com`
- Administrator page: `/goodvibes-admin`

After the preview expires, the homeowner can scan the GCash QR, submit the payment reference and receipt, and wait for verification. The receipt is stored privately in the RealMatch Supabase Storage bucket. Once the administrator approves the request, the property website becomes active and unlocks automatically.

## Administration

Open `/goodvibes-admin`, request a secure sign-in link, and use the link sent to `markjohnsonbanatao888@gmail.com`.

The dashboard allows the administrator to:

- review activation submissions;
- view receipts through short-lived signed URLs;
- approve and activate the property website;
- reject invalid submissions.

## Stack

- Vite 5 and React 18
- Tailwind CSS 3
- Framer Motion
- Lucide React
- React Hook Form and Zod
- RealMatch Supabase database, Storage, Auth, and Edge Function

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Property photos

The real property images are stored under `public/property/`. The supplied payment QR is stored at `public/payments/goodvibes-gcash-qr.svg`.

## Important payment note

A static GCash QR does not provide automatic payment confirmation. The payment must be manually reviewed by Goodvibes LTD. After an authorized administrator approves the submission, the website unlocks automatically without a code change or redeployment.

Deployment refresh: production build requested for `lakeview-putatan.vercel.app` on 2026-07-21.
