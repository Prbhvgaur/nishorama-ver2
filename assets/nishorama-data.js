(() => {
  const imagePool = [
    "https://unsplash.com/photos/LQ_ro5OjyEs/download?force=true&w=1400&q=80",
    "https://unsplash.com/photos/eJLP9Sib5Ws/download?force=true&w=1400&q=80",
    "https://unsplash.com/photos/GoagZ4LVSfo/download?force=true&w=1400&q=80",
    "https://unsplash.com/photos/MOXm5jc8I0A/download?force=true&w=1400&q=80",
    "https://unsplash.com/photos/ZIScMboV_YY/download?force=true&w=1400&q=80",
    "https://unsplash.com/photos/XSFMcYFVp_A/download?force=true&w=1400&q=80",
    "https://unsplash.com/photos/uphWgr380Ts/download?force=true&w=1400&q=80",
    "https://unsplash.com/photos/_ZGvkavajjQ/download?force=true&w=1400&q=80",
    "https://unsplash.com/photos/scTC9VKQPkk/download?force=true&w=1400&q=80"
  ];

  const categorySpecs = [
    {
      label: "Kurti Sets",
      slug: "kurti-sets",
      type: "Kurti",
      base: 8800,
      materials: ["Cotton", "Georgette", "Organza"],
      occasions: ["Casual", "Festive"],
      colors: ["Ivory", "Rose Clay", "Soft Gold"]
    },
    {
      label: "Corset Tops",
      slug: "corset-tops",
      type: "Corset",
      base: 7600,
      materials: ["Silk", "Organza", "Velvet"],
      occasions: ["Party", "Festive"],
      colors: ["Clay", "Espresso", "Champagne"]
    },
    {
      label: "Dresses",
      slug: "dresses",
      type: "Gown",
      base: 9900,
      materials: ["Georgette", "Chiffon", "Silk"],
      occasions: ["Party", "Wedding"],
      colors: ["Ivory", "Noir", "Dune"]
    },
    {
      label: "Co-ords",
      slug: "co-ords",
      type: "Co-ord Set",
      base: 10500,
      materials: ["Cotton", "Silk", "Georgette"],
      occasions: ["Casual", "Party"],
      colors: ["Sand", "Mink", "Copper"]
    },
    {
      label: "Sarees",
      slug: "sarees",
      type: "Saree",
      base: 12900,
      materials: ["Silk", "Organza", "Chiffon"],
      occasions: ["Wedding", "Festive"],
      colors: ["Ivory", "Gold", "Rose"]
    },
    {
      label: "Anarkalis",
      slug: "anarkalis",
      type: "Anarkali",
      base: 11800,
      materials: ["Georgette", "Cotton", "Silk"],
      occasions: ["Festive", "Wedding"],
      colors: ["Ivory", "Clay", "Gilded"]
    },
    {
      label: "Lehenga Sets",
      slug: "lehenga-sets",
      type: "Lehenga Set",
      base: 15400,
      materials: ["Silk", "Velvet", "Organza"],
      occasions: ["Wedding", "Party"],
      colors: ["Rose", "Gold", "Espresso"]
    },
    {
      label: "Sharara Sets",
      slug: "sharara-sets",
      type: "Sharara Set",
      base: 11200,
      materials: ["Georgette", "Cotton", "Silk"],
      occasions: ["Festive", "Wedding"],
      colors: ["Sand", "Clay", "Mink"]
    },
    {
      label: "Fusion Sets",
      slug: "fusion-sets",
      type: "Fusion Set",
      base: 10300,
      materials: ["Cotton", "Silk", "Chiffon"],
      occasions: ["Casual", "Party"],
      colors: ["Ivory", "Noir", "Copper"]
    },
    {
      label: "Occasion Jackets",
      slug: "occasion-jackets",
      type: "Occasion Jacket",
      base: 9700,
      materials: ["Velvet", "Silk", "Organza"],
      occasions: ["Party", "Wedding"],
      colors: ["Espresso", "Noir", "Gold"]
    }
  ];

  const namePrefixes = ["Ivory", "Rose", "Clay", "Noir", "Gilded"];
  const nameSuffixes = {
    "Kurti Sets": "Kurti Set",
    "Corset Tops": "Corset Top",
    "Dresses": "Drape Dress",
    "Co-ords": "Co-ord Set",
    "Sarees": "Saree",
    "Anarkalis": "Anarkali",
    "Lehenga Sets": "Lehenga Set",
    "Sharara Sets": "Sharara Set",
    "Fusion Sets": "Fusion Set",
    "Occasion Jackets": "Occasion Jacket"
  };

  const notes = [
    "with hand-finished detailing",
    "for day-to-night styling",
    "cut in a softer ceremonial line",
    "for a warmer evening palette",
    "with light structure and ease"
  ];

  const fabricCare = {
    Silk: "Dry clean only. Steam lightly from the reverse side.",
    Cotton: "Gentle cold wash or dry clean depending on embellishment.",
    Georgette: "Dry clean recommended. Do not wring.",
    Chiffon: "Dry clean only. Store flat or on a padded hanger.",
    Velvet: "Dry clean only. Keep away from direct heat.",
    Organza: "Dry clean only. Handle with care around trims."
  };

  const occasionTypeMap = {
    Wedding: ["Wedding", "Reception"],
    Festive: ["Festive", "Celebration"],
    Casual: ["Casual", "Day Event"],
    Party: ["Party", "Cocktail"]
  };

  const products = categorySpecs.flatMap((category, categoryIndex) =>
    namePrefixes.map((prefix, index) => {
      const id = `${category.slug}-${index + 1}`;
      const title = `${prefix} ${nameSuffixes[category.label]}`;
      const price = category.base + (index * 650) + (categoryIndex * 140);
      const primaryMaterial = category.materials[index % category.materials.length];
      const primaryColor = category.colors[index % category.colors.length];
      const secondaryColor = category.colors[(index + 1) % category.colors.length];
      const tertiaryColor = category.colors[(index + 2) % category.colors.length];
      const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
      const images = [
        imagePool[(categoryIndex + index) % imagePool.length],
        imagePool[(categoryIndex + index + 2) % imagePool.length],
        imagePool[(categoryIndex + index + 4) % imagePool.length]
      ];
      const shortDescription = `${category.label} ${notes[index]}`;
      const fabricNote = `${primaryMaterial} ${category.type.toLowerCase()} with hand-finished accents`;
      const care = fabricCare[primaryMaterial] || "Dry clean recommended.";
      const delivery = categoryIndex % 2 === 0 ? "Dispatch in 48 hours for ready-to-ship sizes." : "Made-to-order timing confirmed after checkout.";
      const colorSwatches = [primaryColor, secondaryColor, tertiaryColor];
      const occasionLabel = category.occasions[index % category.occasions.length];
      const popularity = 100 - (categoryIndex * 4) - index;

      return {
        id,
        slug: id,
        title,
        price,
        category: category.label,
        categorySlug: category.slug,
        type: category.type,
        material: primaryMaterial,
        fabrics: category.materials,
        occasions: category.occasions,
        colors: colorSwatches,
        sizes,
        images,
        description: shortDescription,
        fabricNote,
        care,
        delivery,
        occasionLabel,
        popularity,
        newness: 100 - (index * 3) - categoryIndex,
      };
    })
  );

  const productMap = new Map(products.map((product) => [product.id, product]));
  const categoryMap = new Map(categorySpecs.map((category) => [category.slug, category]));

  const relatedByCategory = (product) =>
    products
      .filter((item) => item.categorySlug === product.categorySlug && item.id !== product.id)
      .slice(0, 8);

  const searchProducts = ({ query = "", category = "all", sort = "featured", filters = {} } = {}) => {
    const q = query.trim().toLowerCase();
    let items = products.slice();

    if (category !== "all") {
      items = items.filter((product) => product.categorySlug === category);
    }

    if (filters.size && filters.size.length) {
      items = items.filter((product) => filters.size.some((size) => product.sizes.includes(size)));
    }

    if (filters.color && filters.color.length) {
      items = items.filter((product) =>
        filters.color.some((color) => product.colors.some((item) => item.toLowerCase() === color.toLowerCase()))
      );
    }

    if (filters.type && filters.type.length) {
      items = items.filter((product) => filters.type.includes(product.type));
    }

    if (filters.material && filters.material.length) {
      items = items.filter((product) => filters.material.some((material) => product.fabrics.includes(material)));
    }

    if (filters.occasion && filters.occasion.length) {
      items = items.filter((product) => filters.occasion.some((occ) => product.occasions.includes(occ)));
    }

    if (filters.minPrice != null) {
      items = items.filter((product) => product.price >= filters.minPrice);
    }

    if (filters.maxPrice != null) {
      items = items.filter((product) => product.price <= filters.maxPrice);
    }

    if (q) {
      items = items.filter((product) =>
        [product.title, product.category, product.type, product.material, product.description, ...product.colors, ...product.fabrics]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    switch (sort) {
      case "price-low":
        items.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        items.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        items.sort((a, b) => b.newness - a.newness);
        break;
      case "popular":
        items.sort((a, b) => b.popularity - a.popularity);
        break;
      default:
        items.sort((a, b) => b.popularity - a.popularity);
        break;
    }

    return items;
  };

  window.NishoramaStore = {
    categorySpecs,
    categoryMap,
    products,
    productMap,
    relatedByCategory,
    searchProducts,
    imagePool,
  };
})();
