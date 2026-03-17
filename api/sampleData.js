const sampleCategories = [
  {
    name: "Gaming",
    slug: "gaming",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Smartphones",
    slug: "smartphones",
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Audio",
    slug: "audio",
    image:
      "https://images.unsplash.com/photo-1518443895914-8e55f0a9f65b?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Computers",
    slug: "computers",
    image:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Cameras",
    slug: "cameras",
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Wearables",
    slug: "wearables",
    image:
      "https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Smart Home",
    slug: "smart-home",
    image:
      "https://images.unsplash.com/photo-1518443895914-8e55f0a9f65b?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Accessories",
    slug: "accessories",
    image:
      "https://images.unsplash.com/photo-1511385348-a52b4a160dc2?auto=format&fit=crop&w=900&q=80"
  }
];

const sampleProducts = [
  {
    name: "Pulse Controller X",
    category: "Gaming",
    price: 129,
    rating: 4.8,
    badge: "Hot Deal",
    tagline: "Adaptive triggers, zero lag wireless.",
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
    tags: ["featured", "hero"]
  },
  {
    name: "Aurora Buds",
    category: "Audio",
    price: 179,
    rating: 4.7,
    badge: "New Arrival",
    tagline: "Crystal clarity, studio tuned.",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
    tags: ["featured"]
  },
  {
    name: "Orbit Home Speaker",
    category: "Smart Home",
    price: 249,
    rating: 4.6,
    badge: "Trending",
    tagline: "Room-filling sound with smart voice.",
    image:
      "https://images.unsplash.com/photo-1518443895914-8e55f0a9f65b?auto=format&fit=crop&w=1200&q=80",
    tags: ["featured", "trending"]
  },
  {
    name: "NeoBook Pro 16",
    category: "Computers",
    price: 1899,
    rating: 4.9,
    badge: "Top Rated",
    tagline: "Ultra thin, ultra fast, all day power.",
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
    tags: ["featured"]
  },
  {
    name: "Skyline Drone 4K",
    category: "Cameras",
    price: 699,
    rating: 4.5,
    badge: "Best Value",
    tagline: "Stabilized 4K with 30 min flight.",
    image:
      "https://images.unsplash.com/photo-1508615070457-7baeba4003ab?auto=format&fit=crop&w=1200&q=80",
    tags: ["trending"]
  },
  {
    name: "Prism Fold",
    category: "Smartphones",
    price: 1399,
    rating: 4.4,
    badge: "Exclusive",
    tagline: "Edge-to-edge foldable display.",
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
    tags: ["trending"]
  },
  {
    name: "Vivid Watch S",
    category: "Wearables",
    price: 299,
    rating: 4.6,
    badge: "Popular",
    tagline: "Health insights in real time.",
    image:
      "https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=1200&q=80",
    tags: ["trending"]
  },
  {
    name: "Vector Lens Kit",
    category: "Accessories",
    price: 89,
    rating: 4.3,
    badge: "Limited",
    tagline: "Pro-grade shots for your phone.",
    image:
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1200&q=80",
    tags: ["trending"]
  }
];

module.exports = {
  sampleCategories,
  sampleProducts
};
