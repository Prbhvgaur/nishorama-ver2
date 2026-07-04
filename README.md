# Nishorama Luxury E-commerce Demo

A single-file premium storefront concept for Nishorama, built as a self-contained `index.html` with inline CSS and JavaScript.

## What’s inside

- Editorial hero with luxury typography and warm beige palette
- Separate `categories.html` catalog page with 10 product families and 50 demo items
- Separate `orders.html` history page with track/report actions
- Working header actions for search, account, and bag
- Quantity-aware cart with subtotal and persistence across pages
- Account drawer with a simple sign-in demo state
- Signature scroll interaction: the Drape Corridor
- Newsletter capture, trust strip, and cleaned-up footer

## How to run

Open `index.html` directly in a browser, or serve the folder locally:

```bash
python -m http.server 4173
```

Then visit:

```text
http://127.0.0.1:4173/index.html
```

You can also open:

- `categories.html` for the full catalog
- `orders.html` for the order history demo

## Notes

- The layout is designed to work on desktop and mobile.
- The page respects reduced-motion preferences.
- Product images and type styling use live remote assets, so an internet connection is recommended for the best visual match.
- Cart and account state persist in the browser via local storage.
