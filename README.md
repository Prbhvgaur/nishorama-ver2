# Nishorama Luxury E-commerce Demo

A premium multi-page storefront concept for Nishorama, built with static HTML, CSS, and JavaScript.

## What's inside

- Editorial homepage with luxury typography and a warm beige palette
- `categories.html` catalog page with 10 product families, 50 demo items, filters, quick add, and search overlay
- `product.html` product detail page with gallery, size guide, wishlist, and related items
- `wishlist.html` saved-items page with move-to-bag and remove actions
- `orders.html` order history page with track/report actions
- Working header actions for search, wishlist, account, and bag
- Quantity-aware cart with subtotal and persistence across pages
- Account drawer with a simple sign-in demo state
- Signature scroll interaction: the Drape Corridor
- Newsletter capture, trust strip, and polished footer treatment

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
- `product.html?id=kurti-sets-1` for a product detail demo
- `wishlist.html` for saved items
- `orders.html` for the order history demo

## Notes

- The layout is designed to work on desktop and mobile.
- The page respects reduced-motion preferences.
- Product images and type styling use live remote assets, so an internet connection is recommended for the best visual match.
- Cart and account state persist in the browser via local storage.
- Shared catalog data lives in `assets/nishorama-data.js`, and shared interactions live in `assets/nishorama-runtime.js`.
