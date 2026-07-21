# Lakeview Homes — Property Preview

A single-page property-listing site for a **195 sqm house-and-lot** in Lakeview Homes
Subdivision, Putatan, Muntinlupa City. Built with Vite + React + Tailwind CSS.

The property comprises two adjoining titled lots (Lot 5-A: 95 sqm, Lot 5-B: 100 sqm)
sold together, with an existing single-storey structure. The page is a preview only —
all figures, titles, annotations, and financing details are presented as **subject to
independent verification**.

## Stack

- **Vite 5** + **React 18**
- **Tailwind CSS 3**
- **framer-motion** — animations & lightbox transitions
- **lucide-react** — icons
- **react-hook-form** + **zod** — the inquiry form and validation

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # production build to ./dist
npm run preview  # preview the production build
```

## Sections

Hero · Property facts · Buyer disclosures · Lot composition · Categorised photo gallery
(with filter + lightbox) · Due-diligence documents · Buying-process timeline · FAQ ·
Inquiry form · Footer.

## Photos

The 11 property photos live in `public/property/`, organised by area:

```
public/property/
  exterior/       facade.jpg, gate.jpg, street.jpg
  living/         coffered-ceiling.jpg, living-room.jpg, staircase.jpg
  bedrooms/       brick-accent.jpg, wardrobe.jpg
  kitchen-dining/ kitchen.jpg, dining.jpg
  office/         home-office.jpg
```

To swap or add photos, drop files into these folders and update the `IMAGES` array in
`src/App.jsx`.

## Inquiry form

The form validates client-side (react-hook-form + zod) and currently simulates
submission (logs to the console). Wire the `onSubmit` handler in `src/App.jsx` to a real
endpoint or email service to receive live inquiries.

## Notes

Property content is a preview and does not constitute an offer or warranty. See the
disclaimer in the site footer.
