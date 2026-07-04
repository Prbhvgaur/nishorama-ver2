(() => {
  const Store = window.NishoramaStore;
  if (!Store) {
    return;
  }

  const CART_KEY = "nishorama-cart-v2";
  const WISHLIST_KEY = "nishorama-wishlist-v2";
  const RECENT_KEY = "nishorama-recent-v2";
  const AUTH_KEY = "nishorama-auth-v1";

  const loadJson = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  const saveJson = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const formatPrice = (value) => `INR ${Number(value).toLocaleString("en-IN")}`;
  const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const preferredMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const body = document.body;
  const colorToHex = (name) => {
    const key = name.toLowerCase();
    if (key.includes("ivory") || key.includes("champagne")) return "#f3ede2";
    if (key.includes("rose")) return "#d3a08a";
    if (key.includes("clay") || key.includes("copper")) return "#b98a68";
    if (key.includes("gold")) return "#d1ad77";
    if (key.includes("espresso") || key.includes("noir")) return "#2a211a";
    if (key.includes("sand")) return "#d8b89a";
    if (key.includes("mink")) return "#8f7869";
    if (key.includes("plum")) return "#6b4a4a";
    return "#c6ab92";
  };

  const state = {
    cart: new Map(loadJson(CART_KEY, [])),
    wishlist: new Set(loadJson(WISHLIST_KEY, [])),
    recent: loadJson(RECENT_KEY, []),
    auth: loadJson(AUTH_KEY, null),
  };
  let activeQuickAddPopover = null;

  const stateToStorage = () => {
    saveJson(CART_KEY, Array.from(state.cart.entries()));
    saveJson(WISHLIST_KEY, Array.from(state.wishlist));
    saveJson(RECENT_KEY, state.recent.slice(0, 8));
    saveJson(AUTH_KEY, state.auth);
  };

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("aria-live", "polite");
  document.body.appendChild(toast);
  let toastTimer = null;

  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
  };

  const recordRecent = (productId) => {
    state.recent = [productId, ...state.recent.filter((id) => id !== productId)].slice(0, 6);
    stateToStorage();
  };

  const updateBadge = (selector, value) => {
    const el = document.querySelector(selector);
    if (el) {
      el.textContent = String(value);
    }
  };

  const updateWishlistButtons = () => {
    document.querySelectorAll("[data-wishlist-toggle]").forEach((button) => {
      const productId = button.dataset.productId;
      const active = state.wishlist.has(productId);
      button.dataset.active = String(active);
      button.setAttribute("aria-pressed", String(active));
      button.innerHTML = active
        ? '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 21s-7.5-4.7-7.5-10.7A4.7 4.7 0 0 1 9.2 5.6 4.9 4.9 0 0 1 12 7.2a4.9 4.9 0 0 1 2.8-1.6 4.7 4.7 0 0 1 4.7 4.7C19.5 16.3 12 21 12 21Z"/></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s-7.5-4.7-7.5-10.7A4.7 4.7 0 0 1 9.2 5.6 4.9 4.9 0 0 1 12 7.2a4.9 4.9 0 0 1 2.8-1.6 4.7 4.7 0 0 1 4.7 4.7C19.5 16.3 12 21 12 21Z"/></svg>';
    });
    updateBadge("#wishlistCount", state.wishlist.size);
  };

  const updateCartButtons = () => {
    document.querySelectorAll("[data-quick-add]").forEach((button) => {
      const productId = button.dataset.productId;
      const qty = state.cart.get(productId) || 0;
      button.dataset.added = String(qty > 0);
      button.textContent = qty > 0 ? `Add Another (${qty})` : "Quick Add";
    });
    updateBadge("#bagCount", Array.from(state.cart.values()).reduce((sum, qty) => sum + qty, 0));
  };

  const setRecent = (productId) => {
    recordRecent(productId);
    renderSearchOverlay();
  };

  const productById = (id) => Store.productMap.get(id);
  const productBySlug = (slug) => Store.products.find((product) => product.slug === slug || product.id === slug);

  const ensureProductId = (element) => {
    if (element.dataset.productId) {
      return element.dataset.productId;
    }
    const title = element.querySelector("h3")?.textContent?.trim() || "";
    const category = element.querySelector(".tag, .badge")?.textContent?.trim() || "";
    const matches = Store.products.find((product) => {
      const normalized = `${product.title} ${product.category}`.toLowerCase();
      return normalized.includes(title.toLowerCase()) || normalized.includes(category.toLowerCase());
    });
    if (matches) {
      element.dataset.productId = matches.id;
      return matches.id;
    }
    return null;
  };

  const cartTotal = () => Array.from(state.cart.entries()).reduce((sum, [productId, qty]) => {
    const product = productById(productId);
    return sum + ((product?.price || 0) * qty);
  }, 0);

  const openDrawer = (drawer, layer) => {
    if (!drawer || !layer) {
      return;
    }
    drawer.hidden = false;
    layer.hidden = false;
    if (drawer === bagPanel && bagToggle) {
      bagToggle.setAttribute("aria-expanded", "true");
    }
    requestAnimationFrame(() => {
      layer.classList.add("is-open");
      drawer.classList.add("is-open");
    });
    body.style.overflow = "hidden";
  };

  const closeDrawer = (drawer, layer) => {
    if (!drawer || !layer) {
      return;
    }
    layer.classList.remove("is-open");
    drawer.classList.remove("is-open");
    if (drawer === bagPanel && bagToggle) {
      bagToggle.setAttribute("aria-expanded", "false");
    }
    body.style.overflow = "";
    window.setTimeout(() => {
      drawer.hidden = true;
      layer.hidden = true;
    }, 180);
  };

  const bagLayer = document.getElementById("bagLayer");
  const bagPanel = document.getElementById("bagPanel");
  const bagContent = document.getElementById("bagContent");
  const bagToggle = document.getElementById("bagToggle");
  const closeBagButton = document.getElementById("closeBag");
  const wishlistToggle = document.getElementById("wishlistToggle");

  const renderBag = () => {
    if (!bagContent) return;
    if (state.cart.size === 0) {
      bagContent.innerHTML = `
        <div class="empty-state">
          <strong>Your bag is still being edited.</strong>
          <p>Add a look from the product pages or quick add popover to see it here.</p>
        </div>
      `;
      return;
    }

    const items = Array.from(state.cart.entries()).map(([productId, qty]) => {
      const product = productById(productId);
      if (!product) return "";
      return `
        <article class="cart-item">
          <div class="cart-top">
            <div>
              <strong>${product.title}</strong>
              <p>${product.description}</p>
            </div>
            <strong>${formatPrice(product.price * qty)}</strong>
          </div>
          <div class="cart-meta">
            <span>${product.category}</span>
            <span>${qty} units</span>
          </div>
          <div class="panel-actions">
            <div class="qty">
              <button type="button" data-cart-action="decrease" data-product-id="${productId}">-</button>
              <span>${qty}</span>
              <button type="button" data-cart-action="increase" data-product-id="${productId}">+</button>
            </div>
            <button class="remove-item" type="button" data-cart-action="remove" data-product-id="${productId}">Remove</button>
          </div>
        </article>
      `;
    }).join("");

    bagContent.innerHTML = `
      <div class="cart-list">${items}</div>
      <div style="height:1rem"></div>
      <div class="cart-summary">
        <div class="summary-row"><span>Subtotal</span><strong>${formatPrice(cartTotal())}</strong></div>
        <div class="summary-row"><span>Shipping</span><span>Calculated at checkout</span></div>
        <div class="summary-row"><span>Gift wrap</span><span>Complimentary over INR 18,000</span></div>
      </div>
      <a class="button primary drawer-cta" href="checkout.html">Checkout</a>
    `;
  };

  const syncCart = () => {
    updateCartButtons();
    renderBag();
    stateToStorage();
  };

  const addToCart = (productId, quantity = 1) => {
    state.cart.set(productId, (state.cart.get(productId) || 0) + quantity);
    syncCart();
    showToast("Added to bag");
  };

  const setCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      state.cart.delete(productId);
    } else {
      state.cart.set(productId, quantity);
    }
    syncCart();
  };

  const wishlistPage = document.querySelector('[data-page="wishlist"]');
  const productPage = document.querySelector('[data-page="product"]');
  const categoriesPage = document.querySelector('[data-page="categories"]');

  const openQuickAddPopover = (product) => {
    let popover = document.getElementById("quickAddPopover");
    if (!popover) {
      popover = document.createElement("div");
      popover.id = "quickAddPopover";
      popover.className = "quick-add-popover";
      popover.hidden = true;
      popover.innerHTML = `
        <div class="drawer-head">
          <div>
            <span class="eyebrow">Quick Add</span>
            <h3 id="quickAddTitle">Select a size before adding.</h3>
          </div>
          <button class="close-button" type="button" data-close-quick aria-label="Close quick add">
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 6l12 12"></path><path d="M18 6L6 18"></path></svg>
          </button>
        </div>
        <div class="quick-add-body"></div>
      `;
      document.body.appendChild(popover);
    }
    const bodyNode = popover.querySelector(".quick-add-body");
    let selectedSize = null;
    let qty = 1;
    bodyNode.innerHTML = `
      <div class="quick-add-card">
        <img src="${product.images[0]}" alt="${product.title}">
        <div>
          <strong>${product.title}</strong>
          <p>${formatPrice(product.price)}</p>
          <p>${product.description}</p>
        </div>
      </div>
      <div class="quick-add-section">
        <span class="meta-label">Size</span>
        <div class="chip-row">
          ${product.sizes.map((size) => `<button class="chip" type="button" data-quick-size="${size}">${size}</button>`).join("")}
        </div>
      </div>
      <div class="quick-add-section">
        <span class="meta-label">Quantity</span>
        <div class="qty">
          <button type="button" data-qty-minus>-</button>
          <span data-qty-value>1</span>
          <button type="button" data-qty-plus>+</button>
        </div>
      </div>
      <div class="panel-actions">
        <button class="button primary" type="button" data-confirm-add disabled>Add to Bag</button>
      </div>
    `;

    const chips = Array.from(bodyNode.querySelectorAll("[data-quick-size]"));
    const qtyValue = bodyNode.querySelector("[data-qty-value]");
    const confirm = bodyNode.querySelector("[data-confirm-add]");
    const close = popover.querySelector("[data-close-quick]");

    const refresh = () => {
      qtyValue.textContent = String(qty);
      confirm.disabled = !selectedSize;
      chips.forEach((chip) => chip.classList.toggle("is-active", chip.dataset.quickSize === selectedSize));
    };

    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        selectedSize = chip.dataset.quickSize;
        refresh();
      });
    });
    bodyNode.querySelector("[data-qty-minus]").addEventListener("click", () => {
      qty = Math.max(1, qty - 1);
      refresh();
    });
    bodyNode.querySelector("[data-qty-plus]").addEventListener("click", () => {
      qty += 1;
      refresh();
    });
    confirm.addEventListener("click", () => {
      if (!selectedSize) {
        showToast("Choose a size first");
        return;
      }
      addToCart(product.id, qty);
      popover.hidden = true;
      popover.classList.remove("is-open");
      activeQuickAddPopover = null;
    });
    close.addEventListener("click", () => {
      popover.hidden = true;
      popover.classList.remove("is-open");
      activeQuickAddPopover = null;
    });

    popover.hidden = false;
    refresh();
    popover.classList.add("is-open");
    activeQuickAddPopover = popover;
  };

  const renderSearchModal = () => {
    let overlay = document.getElementById("searchOverlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "searchOverlay";
      overlay.className = "search-overlay";
      overlay.hidden = true;
      overlay.innerHTML = `
        <div class="search-overlay-backdrop" data-close-search></div>
        <section class="search-overlay-panel" role="dialog" aria-modal="true" aria-labelledby="searchOverlayTitle">
          <div class="drawer-head">
            <div>
              <span class="eyebrow">Search the House</span>
              <h3 id="searchOverlayTitle">Find a look by mood, silhouette, or occasion.</h3>
              <p>Search sarees, kurtis, occasionwear, or any product family.</p>
            </div>
            <button class="close-button" type="button" data-close-search aria-label="Close search">
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 6l12 12"></path><path d="M18 6L6 18"></path></svg>
            </button>
          </div>
          <div class="search-grid">
            <div class="search-column">
              <label class="searchbar" for="searchInput">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                  <circle cx="11" cy="11" r="6"></circle>
                  <path d="M20 20l-3.5-3.5"></path>
                </svg>
                <input id="searchInput" type="search" placeholder="Search sarees, kurtis, occasionwear..." autocomplete="off">
              </label>
              <div class="search-tags">
                <span class="meta-label">Trending Searches</span>
                <div class="chip-row" data-trending></div>
              </div>
              <div class="search-tags">
                <span class="meta-label">Recently Viewed</span>
                <div class="recent-grid" data-recent></div>
              </div>
            </div>
            <div class="search-results" data-search-results></div>
          </div>
        </section>
      `;
      document.body.appendChild(overlay);
    }

    const input = overlay.querySelector("#searchInput");
    const results = overlay.querySelector("[data-search-results]");
    const trending = overlay.querySelector("[data-trending]");
    const recent = overlay.querySelector("[data-recent]");
    const render = () => {
      const value = input.value.trim();
      const matches = Store.searchProducts({ query: value, sort: "popular" }).slice(0, 8);
      results.innerHTML = matches.length
        ? matches.map((product) => `
            <article class="search-result">
              <button type="button" class="search-result-link" data-open-product="${product.id}">
                <img src="${product.images[0]}" alt="${product.title}">
                <div>
                  <strong>${product.title}</strong>
                  <p>${product.category}</p>
                </div>
                <span>${formatPrice(product.price)}</span>
              </button>
            </article>
          `).join("")
        : `<div class="search-empty"><strong>No matches found.</strong><p>Try a broader term like festive, saree, or kurti.</p></div>`;
    };

    trending.innerHTML = ["kurti", "saree", "lehenga", "co-ord", "anarkali", "wedding"].map((tag) =>
      `<button class="chip" type="button" data-search-tag="${tag}">${tag}</button>`
    ).join("");

    recent.innerHTML = state.recent.length
      ? state.recent.map((id) => {
          const product = productById(id);
          return product ? `
            <button class="recent-item" type="button" data-open-product="${product.id}">
              <img src="${product.images[0]}" alt="${product.title}">
              <strong>${product.title}</strong>
            </button>
          ` : "";
        }).join("")
      : `<div class="search-empty"><strong>No recent views yet.</strong><p>Open a product to populate this space.</p></div>`;

    input.oninput = render;
    overlay.querySelectorAll("[data-close-search]").forEach((button) => {
      button.addEventListener("click", () => {
        overlay.hidden = true;
      });
    });
    overlay.querySelectorAll("[data-search-tag]").forEach((button) => {
      button.addEventListener("click", () => {
        input.value = button.dataset.searchTag;
        render();
        input.focus();
      });
    });
    overlay.addEventListener("click", (event) => {
      const productBtn = event.target.closest("[data-open-product]");
      if (!productBtn) return;
      const product = productById(productBtn.dataset.openProduct);
      if (product) {
        location.href = `product.html?id=${encodeURIComponent(product.id)}`;
      }
    });
    render();
    return overlay;
  };

  const openSearch = () => {
    const overlay = document.getElementById("searchOverlay") || renderSearchModal();
    overlay.hidden = false;
    overlay.classList.add("is-open");
    body.style.overflow = "hidden";
    const input = overlay.querySelector("#searchInput");
    setTimeout(() => input?.focus(), 50);
  };

  const closeSearch = () => {
    const overlay = document.getElementById("searchOverlay");
    if (!overlay) return;
    overlay.hidden = true;
    overlay.classList.remove("is-open");
    body.style.overflow = "";
  };

  const initGlobalControls = () => {
    const searchBtn = document.querySelector("#searchToggle, [data-open-search]");
    if (searchBtn) {
      searchBtn.addEventListener("click", (event) => {
        event.preventDefault();
        openSearch();
      });
    }

    document.addEventListener("click", (event) => {
      const productButton = event.target.closest("[data-open-product]");
      if (productButton) {
        const product = productById(productButton.dataset.openProduct);
        if (product) {
          recordRecent(product.id);
          location.href = `product.html?id=${encodeURIComponent(product.id)}`;
        }
      }

      const wishlistButton = event.target.closest("[data-wishlist-toggle]");
      if (wishlistButton) {
        const productId = wishlistButton.dataset.productId;
        if (state.wishlist.has(productId)) {
          state.wishlist.delete(productId);
          showToast("Removed from wishlist");
        } else {
          state.wishlist.add(productId);
          showToast("Saved to wishlist");
        }
        updateWishlistButtons();
        stateToStorage();
      }

      const quickAddButton = event.target.closest("[data-quick-add]");
      if (quickAddButton) {
        const product = productById(quickAddButton.dataset.productId);
        if (product) {
          openQuickAddPopover(product);
        }
      }

      if (activeQuickAddPopover && !event.target.closest("#quickAddPopover") && !event.target.closest("[data-quick-add]")) {
        activeQuickAddPopover.hidden = true;
        activeQuickAddPopover.classList.remove("is-open");
        activeQuickAddPopover = null;
      }

      const bagAction = event.target.closest("[data-cart-action]");
      if (bagAction) {
        const productId = bagAction.dataset.productId;
        const action = bagAction.dataset.cartAction;
        const qty = state.cart.get(productId) || 0;
        if (action === "increase") setCartQuantity(productId, qty + 1);
        if (action === "decrease") setCartQuantity(productId, qty - 1);
        if (action === "remove") setCartQuantity(productId, 0);
      }

      if (event.target.closest("#bagBackdrop")) {
        closeDrawer(bagPanel, bagLayer);
      }
    });

    if (bagToggle) {
      bagToggle.addEventListener("click", () => {
        if (bagPanel.hidden) {
          renderBag();
          openDrawer(bagPanel, bagLayer);
        } else {
          closeDrawer(bagPanel, bagLayer);
        }
      });
    }

    if (closeBagButton) {
      closeBagButton.addEventListener("click", () => {
        closeDrawer(bagPanel, bagLayer);
      });
    }

    document.querySelectorAll("[data-close-search]").forEach((button) => button.addEventListener("click", closeSearch));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeSearch();
        if (activeQuickAddPopover) {
          activeQuickAddPopover.hidden = true;
          activeQuickAddPopover.classList.remove("is-open");
          activeQuickAddPopover = null;
        }
        if (!bagPanel?.hidden) closeDrawer(bagPanel, bagLayer);
      }
    });
  };

  const enhanceCards = () => {
    document.querySelectorAll(".product-card").forEach((card) => {
      const productId = ensureProductId(card);
      if (!productId) return;
      const product = productById(productId);
      if (!product) return;
      card.dataset.productId = product.id;
      const media = card.querySelector(".product-media");
      if (media && !media.querySelector("[data-wishlist-toggle]")) {
        const heart = document.createElement("button");
        heart.className = "wishlist-button";
        heart.type = "button";
        heart.dataset.wishlistToggle = "true";
        heart.dataset.productId = product.id;
        heart.setAttribute("aria-label", `Save ${product.title}`);
        media.appendChild(heart);
      }
      if (media && !media.querySelector("[data-quick-add]")) {
        const quick = document.createElement("button");
        quick.className = "quick-add-overlay";
        quick.type = "button";
        quick.dataset.quickAdd = "true";
        quick.dataset.productId = product.id;
        quick.textContent = "Quick Add";
        media.appendChild(quick);
      }
      card.addEventListener("click", (event) => {
        if (event.target.closest("button, a")) return;
        recordRecent(product.id);
        location.href = `product.html?id=${encodeURIComponent(product.id)}`;
      });
    });
  };

  const renderWishlistPage = () => {
    const mount = document.getElementById("wishlistRoot");
    if (!mount) return;
    const items = [...state.wishlist].map((id) => productById(id)).filter(Boolean);
    if (!items.length) {
      mount.innerHTML = `
        <div class="empty-state">
          <strong>Your wishlist is waiting to be filled.</strong>
          <p>Save pieces from the catalog or product pages and they will appear here.</p>
        </div>
      `;
      return;
    }
    mount.innerHTML = `
      <div class="product-grid wishlist-grid">
        ${items.map((product) => `
          <article class="product-card" data-product-id="${product.id}">
            <div class="product-media">
              <img src="${product.images[0]}" alt="${product.title}">
            </div>
            <div class="product-body">
              <div class="product-title">
                <div>
                  <h3>${product.title}</h3>
                  <p>${product.category}</p>
                </div>
                <span class="price">${formatPrice(product.price)}</span>
              </div>
              <div class="panel-actions">
                <button class="button primary" type="button" data-wishlist-move="${product.id}">Move to Bag</button>
                <button class="button secondary" type="button" data-wishlist-remove="${product.id}">Remove</button>
              </div>
            </div>
          </article>
        `).join("")}
      </div>
    `;
    mount.querySelectorAll("[data-wishlist-remove]").forEach((button) => {
      button.addEventListener("click", () => {
        state.wishlist.delete(button.dataset.wishlistRemove);
        updateWishlistButtons();
        stateToStorage();
        renderWishlistPage();
      });
    });
    mount.querySelectorAll("[data-wishlist-move]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.wishlistMove;
        state.cart.set(id, (state.cart.get(id) || 0) + 1);
        syncCart();
        showToast("Moved to bag");
      });
    });
  };

  const renderProductPage = () => {
    const mount = document.getElementById("productRoot");
    if (!mount) return;
    const id = new URLSearchParams(location.search).get("id");
    const product = productById(id) || Store.products[0];
    if (!product) return;
    recordRecent(product.id);
    mount.innerHTML = `
      <div class="pdp-grid">
        <div class="pdp-gallery">
          <div class="hero-image"><img id="pdpMainImage" src="${product.images[0]}" alt="${product.title}"></div>
          <div class="thumb-strip">
            ${product.images.map((src, index) => `<button class="thumb${index === 0 ? " is-active" : ""}" type="button" data-thumb="${src}"><img src="${src}" alt="${product.title} view ${index + 1}"></button>`).join("")}
          </div>
        </div>
        <div class="pdp-copy">
          <div class="breadcrumbs"><a href="index.html">Home</a> / <a href="categories.html">${product.category}</a> / <span>${product.title}</span></div>
          <span class="eyebrow">Product detail</span>
          <h1>${product.title}</h1>
          <div class="pdp-price">${formatPrice(product.price)}</div>
          <p>${product.description}</p>
          <div class="quick-add-section">
            <span class="meta-label">Sizes</span>
            <div class="chip-row" data-pdp-sizes>
              ${product.sizes.map((size) => `<button class="chip" type="button" data-pdp-size="${size}">${size}</button>`).join("")}
            </div>
            <button class="inline-link" type="button" data-size-guide>Size Guide</button>
            <div class="search-suggestions" data-size-guide-panel hidden>
              <span class="meta-label">Size Guide</span>
              <ul>
                <li><span>XS / S</span> <strong>0-2 in bust ease</strong></li>
                <li><span>M / L</span> <strong>2-4 in bust ease</strong></li>
                <li><span>XL / XXL</span> <strong>4-6 in bust ease</strong></li>
                <li><span>Custom</span> <strong>Tailoring support available</strong></li>
              </ul>
            </div>
          </div>
          <div class="quick-add-section">
            <span class="meta-label">Colours</span>
            <div class="swatch-row">
              ${product.colors.map((color) => `<span class="swatch" title="${color}" style="background:${colorToHex(color)}"></span>`).join("")}
            </div>
          </div>
          <div class="quick-add-section">
            <span class="meta-label">Quantity</span>
            <div class="qty" data-pdp-qty>
              <button type="button" data-minus>-</button>
              <span data-value>1</span>
              <button type="button" data-plus>+</button>
            </div>
          </div>
          <div class="panel-actions">
            <button class="button primary" type="button" data-add-pdp disabled>Add to Bag</button>
            <button class="button secondary" type="button" data-wishlist-toggle="true" data-product-id="${product.id}">Wishlist</button>
          </div>
          <div class="accordion">
            <details open>
              <summary>Fabric & care</summary>
              <p>${product.fabricNote}. ${product.care}</p>
            </details>
            <details>
              <summary>Delivery & returns</summary>
              <p>${product.delivery} Returns accepted on eligible pieces within seven days.</p>
            </details>
          </div>
          <div class="related">
            <span class="meta-label">You may also like</span>
            <div class="product-grid related-grid">
              ${Store.relatedByCategory(product).slice(0, 4).map((item) => `
                <article class="product-card" data-open-product="${item.id}">
                  <div class="product-media"><img src="${item.images[0]}" alt="${item.title}"></div>
                  <div class="product-body">
                    <div class="product-title">
                      <div>
                        <h3>${item.title}</h3>
                        <p>${item.category}</p>
                      </div>
                      <span class="price">${formatPrice(item.price)}</span>
                    </div>
                  </div>
                </article>
              `).join("")}
            </div>
          </div>
        </div>
      </div>
    `;

    const mainImage = mount.querySelector("#pdpMainImage");
    mount.querySelectorAll("[data-thumb]").forEach((thumb) => {
      thumb.addEventListener("click", () => {
        mainImage.src = thumb.dataset.thumb;
      });
    });

    const sizeButtons = Array.from(mount.querySelectorAll("[data-pdp-size]"));
    const qtyValue = mount.querySelector("[data-value]");
    const addButton = mount.querySelector("[data-add-pdp]");
    let selectedSize = null;
    let quantity = 1;
    const refresh = () => {
      qtyValue.textContent = String(quantity);
      addButton.disabled = !selectedSize;
      sizeButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.pdpSize === selectedSize));
    };
    sizeButtons.forEach((button) => button.addEventListener("click", () => {
      selectedSize = button.dataset.pdpSize;
      refresh();
    }));
    mount.querySelector("[data-minus]").addEventListener("click", () => { quantity = Math.max(1, quantity - 1); refresh(); });
    mount.querySelector("[data-plus]").addEventListener("click", () => { quantity += 1; refresh(); });
    addButton.addEventListener("click", () => {
      if (!selectedSize) return showToast("Choose a size first");
      addToCart(product.id, quantity);
    });
    const sizeGuideToggle = mount.querySelector("[data-size-guide]");
    const sizeGuidePanel = mount.querySelector("[data-size-guide-panel]");
    sizeGuideToggle?.addEventListener("click", () => {
      if (!sizeGuidePanel) return;
      sizeGuidePanel.hidden = !sizeGuidePanel.hidden;
    });
    refresh();
  };

  const initFilterSidebar = () => {
    const root = document.getElementById("filterRoot");
    if (!root) return;
    const filterOptions = {
      size: ["XS", "S", "M", "L", "XL", "XXL", "Custom"],
      type: ["Kurti", "Saree", "Lehenga Set", "Co-ord Set", "Anarkali", "Gown", "Sharara Set", "Fusion Set", "Occasion Jacket"],
      material: ["Silk", "Cotton", "Georgette", "Chiffon", "Velvet", "Organza"],
      occasion: ["Wedding", "Festive", "Casual", "Party"]
    };
    const categoryColors = ["Ivory", "Rose Clay", "Soft Gold", "Espresso", "Sand", "Mink", "Copper"];
    const countFor = (key, value) => {
      switch (key) {
        case "size":
          return Store.products.filter((product) => product.sizes.includes(value)).length;
        case "type":
          return Store.products.filter((product) => product.type === value).length;
        case "material":
          return Store.products.filter((product) => product.fabrics.includes(value)).length;
        case "occasion":
          return Store.products.filter((product) => product.occasions.includes(value)).length;
        case "color":
          return Store.products.filter((product) => product.colors.some((color) => color.toLowerCase() === value.toLowerCase())).length;
        default:
          return 0;
      }
    };
    root.innerHTML = `
      <aside class="filter-sidebar">
        <div class="filter-head">
          <span class="eyebrow">Filters</span>
          <button class="link-button" type="button" data-clear-filters>Clear all</button>
        </div>
        ${Object.entries(filterOptions).map(([key, values]) => `
          <details class="filter-group" open>
            <summary>${key === "occasion" ? "Occasion" : key === "material" ? "Material" : key === "type" ? "Type" : key === "color" ? "Colour" : "Size"}</summary>
            <div class="filter-group-body" data-filter-group="${key}">
              ${values.map((value) => `<label class="filter-option"><input type="checkbox" value="${value}" data-filter="${key}"> ${value} <span class="filter-stats">(${countFor(key, value)})</span></label>`).join("")}
            </div>
          </details>
        `).join("")}
        <details class="filter-group" open>
          <summary>Colour</summary>
          <div class="swatch-grid" data-filter-group="color">
            ${categoryColors.map((color) => `<button class="swatch-option" type="button" data-color="${color}" title="${color}"><span class="swatch" style="background:${colorToHex(color)}"></span><span>${color} (${countFor("color", color)})</span></button>`).join("")}
          </div>
        </details>
        <details class="filter-group" open>
          <summary>Price</summary>
          <div class="price-range">
            <input type="range" min="7000" max="20000" step="100" value="20000" data-max-price>
            <div class="price-row"><span>Up to</span><strong data-price-label>INR 20,000</strong></div>
          </div>
        </details>
        <div class="panel-actions">
          <button class="button primary" type="button" data-apply-filters>Apply</button>
        </div>
      </aside>
    `;
  };

  const initCategoriesPage = () => {
    const root = document.getElementById("catalogRoot");
    if (!root) return;
    const filterRoot = document.getElementById("filterRoot");
    const sortSelect = document.getElementById("sortSelect");
    const selectedFilters = document.getElementById("selectedFilters");
    const countLabel = document.getElementById("matchCount");
    const searchInput = document.getElementById("categorySearch");
    const applyFilters = document.querySelector("[data-apply-filters]");
    const clearFilters = document.querySelector("[data-clear-filters]");
    const maxPrice = document.querySelector("[data-max-price]");
    const priceLabel = document.querySelector("[data-price-label]");

    const filters = { size: [], color: [], type: [], material: [], occasion: [], minPrice: null, maxPrice: 20000 };
    const sort = () => sortSelect?.value || "featured";

    const render = () => {
      const results = Store.searchProducts({
        query: searchInput?.value || "",
        sort: sort(),
        filters
      });
      countLabel.textContent = `${results.length} items`;
      root.innerHTML = `
        <div class="product-grid">
          ${results.map((product) => `
            <article class="product-card" data-product-id="${product.id}">
              <div class="product-media">
                <img src="${product.images[0]}" alt="${product.title}">
                <span class="badge">${product.category}</span>
              </div>
              <div class="product-body">
                <div class="product-title">
                  <div>
                    <h3>${product.title}</h3>
                    <p>${product.description}</p>
                  </div>
                  <span class="price">${formatPrice(product.price)}</span>
                </div>
                <div class="tag-row">
                  <span class="tag">${product.category}</span>
                  <span class="tag">${product.material}</span>
                  <span class="tag">Hand-finished</span>
                </div>
                <button class="quick-add" type="button" data-quick-add="true" data-product-id="${product.id}">Quick Add</button>
              </div>
            </article>
          `).join("")}
        </div>
      `;
      enhanceCards();
      updateWishlistButtons();
      updateCartButtons();
      renderFilterChips();
    };

    const renderFilterChips = () => {
      const chips = [
        ...filters.size.map((value) => ({ key: "size", value })),
        ...filters.color.map((value) => ({ key: "color", value })),
        ...filters.type.map((value) => ({ key: "type", value })),
        ...filters.material.map((value) => ({ key: "material", value })),
        ...filters.occasion.map((value) => ({ key: "occasion", value })),
      ];
      selectedFilters.innerHTML = chips.length
        ? chips.map((chip) => `<button class="chip is-active" type="button" data-remove-filter="${chip.key}:${chip.value}">${chip.value} x</button>`).join("")
        : `<span class="chip">No filters selected</span>`;
    };

    const syncUI = () => {
      priceLabel.textContent = formatPrice(filters.maxPrice || 20000);
      render();
    };

    root.addEventListener("click", (event) => {
      const remove = event.target.closest("[data-remove-filter]");
      if (!remove) return;
      const [key, value] = remove.dataset.removeFilter.split(":");
      filters[key] = filters[key].filter((entry) => entry !== value);
      syncUI();
    });

    filterRoot.addEventListener("change", (event) => {
      const checkbox = event.target.closest("[data-filter]");
      if (!checkbox) return;
      const key = checkbox.dataset.filter;
      filters[key] = Array.from(filterRoot.querySelectorAll(`[data-filter="${key}"]:checked`)).map((item) => item.value);
      renderFilterChips();
    });

    filterRoot.addEventListener("click", (event) => {
      const swatch = event.target.closest("[data-color]");
      if (!swatch) return;
      const color = swatch.dataset.color;
      if (!filters.color.includes(color)) {
        filters.color.push(color);
      } else {
        filters.color = filters.color.filter((item) => item !== color);
      }
      renderFilterChips();
    });

    maxPrice?.addEventListener("input", () => {
      filters.maxPrice = Number(maxPrice.value);
      priceLabel.textContent = formatPrice(filters.maxPrice);
    });

    sortSelect?.addEventListener("change", render);
    searchInput?.addEventListener("input", render);
    applyFilters?.addEventListener("click", render);
    clearFilters?.addEventListener("click", () => {
      Object.keys(filters).forEach((key) => {
        filters[key] = Array.isArray(filters[key]) ? [] : (key === "maxPrice" ? 20000 : null);
      });
      filterRoot.querySelectorAll('input[type="checkbox"]').forEach((input) => { input.checked = false; });
      if (maxPrice) maxPrice.value = "20000";
      if (searchInput) searchInput.value = "";
      renderFilterChips();
      render();
    });

    render();
  };

  const initWishlistPage = () => {
    renderWishlistPage();
    updateWishlistButtons();
  };

  const initProductPage = () => {
    renderProductPage();
    updateWishlistButtons();
  };

  const injectHeaderButtons = () => {
    const actions = document.querySelector(".nav-actions, .nav-tools");
    if (!actions) return;
    if (!document.getElementById("wishlistToggle")) {
      const btn = document.createElement("button");
      btn.className = "tool-button";
      btn.id = "wishlistToggle";
      btn.type = "button";
      btn.setAttribute("aria-label", "Open wishlist");
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s-7.5-4.7-7.5-10.7A4.7 4.7 0 0 1 9.2 5.6 4.9 4.9 0 0 1 12 7.2a4.9 4.9 0 0 1 2.8-1.6 4.7 4.7 0 0 1 4.7 4.7C19.5 16.3 12 21 12 21Z"/></svg>
        <span class="bag-count" id="wishlistCount">0</span>
      `;
      actions.insertBefore(btn, actions.children[1] || null);
    }
    const wish = document.getElementById("wishlistToggle");
    wish.addEventListener("click", () => {
      location.href = "wishlist.html";
    });
  };

  const init = () => {
    injectHeaderButtons();
    renderSearchModal();
    initGlobalControls();
    enhanceCards();
    updateWishlistButtons();
    updateCartButtons();
    syncCart();

    if (categoriesPage) {
      initFilterSidebar();
      initCategoriesPage();
    }

    if (wishlistPage) {
      initWishlistPage();
    }

    if (productPage) {
      initProductPage();
    }

    const searchOverlay = document.getElementById("searchOverlay");
    if (searchOverlay) {
      searchOverlay.addEventListener("click", (event) => {
        if (event.target.classList.contains("search-overlay-backdrop")) {
          searchOverlay.hidden = true;
          body.style.overflow = "";
        }
      });
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
