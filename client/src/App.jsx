import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Outlet,
  useNavigate,
  Navigate
} from "react-router-dom";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { fallbackCategories, fallbackProducts } from "./data";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Collections", href: "/collections" },
  { label: "Products", href: "/products" },
  { label: "Other Pages", href: "/pages" },
  { label: "Blog Pages", href: "/blog" }
];

const utilityLinks = [
  { label: "Hot Deals", href: "/deals" },
  { label: "Track Your Order", href: "/track" },
  { label: "Store Locator", href: "/stores" }
];

const promoCards = [
  {
    eyebrow: "New Arrivals",
    title: "BambooBuds",
    copy: "Studio sound, soft touch fit.",
    image:
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1000&q=80"
  },
  {
    eyebrow: "New Arrivals",
    title: "HomePod Pro",
    copy: "Immersive room audio.",
    image:
      "https://images.unsplash.com/photo-1518443895914-8e55f0a9f65b?auto=format&fit=crop&w=1000&q=80"
  }
];

const blogPosts = [
  {
    title: "The future of spatial audio",
    tag: "Audio",
    time: "6 min read"
  },
  {
    title: "Top 5 foldables to watch",
    tag: "Mobile",
    time: "4 min read"
  },
  {
    title: "Minimalist desk setups for creators",
    tag: "Workspace",
    time: "5 min read"
  }
];

const storeLocations = [
  {
    city: "San Francisco",
    address: "80 Market Street, Suite 14",
    phone: "(415) 234-1122"
  },
  {
    city: "New York",
    address: "254 Madison Ave, Floor 3",
    phone: "(212) 982-5520"
  },
  {
    city: "Austin",
    address: "301 Congress Ave",
    phone: "(512) 555-4431"
  }
];

const supportPages = [
  {
    title: "Warranty & Returns",
    copy: "Simple return window and extended protection options."
  },
  {
    title: "Gift Cards",
    copy: "Digital cards delivered instantly for any occasion."
  },
  {
    title: "Support Center",
    copy: "Fast answers and live chat with our specialists."
  }
];

const StoreContext = createContext(null);

function readStorage(key, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch (error) {
      return { message: "Invalid JSON response from server." };
    }
  }
  if (text) {
    try {
      return JSON.parse(text);
    } catch (error) {
      const snippet = text.replace(/\s+/g, " ").trim();
      if (snippet) {
        return {
          message:
            snippet.length > 160 ? `${snippet.slice(0, 160)}…` : snippet
        };
      }
    }
  }
  return {
    message: `Server returned ${response.status} ${response.statusText}.`
  };
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function buildApiUrl(path) {
  if (!API_BASE) {
    return path;
  }
  if (API_BASE.endsWith("/") && path.startsWith("/")) {
    return `${API_BASE.slice(0, -1)}${path}`;
  }
  return `${API_BASE}${path}`;
}

function apiFetch(path, options) {
  return fetch(buildApiUrl(path), options);
}

function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("StoreContext not found");
  }
  return context;
}

export default function App() {
  const [categories, setCategories] = useState(fallbackCategories);
  const [products, setProducts] = useState(fallbackProducts);
  const [featured, setFeatured] = useState(
    fallbackProducts.filter((item) => item.tags?.includes("featured"))
  );
  const [trending, setTrending] = useState(
    fallbackProducts.filter((item) => item.tags?.includes("trending"))
  );
  const [hero, setHero] = useState(
    fallbackProducts.find((item) => item.tags?.includes("hero")) ||
      fallbackProducts[0]
  );
  const [spotlight, setSpotlight] = useState(hero);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [wishlist, setWishlist] = useState(() =>
    readStorage("ecommax_wishlist", [])
  );
  const [cartItems, setCartItems] = useState(() =>
    readStorage("ecommax_cart", [])
  );
  const [authToken, setAuthToken] = useState(() =>
    readStorage("ecommax_token", "")
  );
  const [authUser, setAuthUser] = useState(() =>
    readStorage("ecommax_user", null)
  );
  const [myOrders, setMyOrders] = useState([]);
  const [checkoutStatus, setCheckoutStatus] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [adminSummary, setAdminSummary] = useState(null);
  const [adminOrders, setAdminOrders] = useState([]);
  const [adminStatus, setAdminStatus] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState("");
  const [orderId, setOrderId] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [authStatus, setAuthStatus] = useState("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const [categoriesRes, productsRes] = await Promise.all([
          apiFetch("/api/categories"),
          apiFetch("/api/products")
        ]);

        if (!categoriesRes.ok || !productsRes.ok) {
          throw new Error("Failed to fetch");
        }

        const categoriesJson = await categoriesRes.json();
        const productsJson = await productsRes.json();

        if (ignore) {
          return;
        }

        const nextCategories = categoriesJson.data || fallbackCategories;
        const nextProducts = productsJson.data || fallbackProducts;
        const nextFeatured =
          productsJson.featured ||
          nextProducts.filter((item) => item.tags?.includes("featured"));
        const nextTrending =
          productsJson.trending ||
          nextProducts.filter((item) => item.tags?.includes("trending"));
        const nextHero =
          productsJson.hero ||
          nextProducts.find((item) => item.tags?.includes("hero")) ||
          nextProducts[0];

        setCategories(nextCategories);
        setProducts(nextProducts);
        setFeatured(nextFeatured);
        setTrending(nextTrending);
        setHero(nextHero);
        setSpotlight(nextHero);
      } catch (error) {
        if (!ignore) {
          setCategories(fallbackCategories);
          setProducts(fallbackProducts);
          setFeatured(
            fallbackProducts.filter((item) => item.tags?.includes("featured"))
          );
          setTrending(
            fallbackProducts.filter((item) => item.tags?.includes("trending"))
          );
          const nextHero =
            fallbackProducts.find((item) => item.tags?.includes("hero")) ||
            fallbackProducts[0];
          setHero(nextHero);
          setSpotlight(nextHero);
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (hero) {
      setSpotlight(hero);
    }
  }, [hero]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ecommax_wishlist", JSON.stringify(wishlist));
    }
  }, [wishlist]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ecommax_cart", JSON.stringify(cartItems));
    }
  }, [cartItems]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ecommax_token", JSON.stringify(authToken));
    }
  }, [authToken]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ecommax_user", JSON.stringify(authUser));
    }
  }, [authUser]);

  useEffect(() => {
    if (!authToken) {
      setMyOrders([]);
      return;
    }
    loadMyOrders();
  }, [authToken]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return products.filter((item) => {
      const matchesTerm =
        !term ||
        [item.name, item.category, item.badge, item.tagline]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(term));
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;
      return matchesTerm && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const wishlistItems = useMemo(
    () => products.filter((item) => wishlist.includes(item.name)),
    [products, wishlist]
  );

  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const defaultCategoryImage =
    categories[0]?.image || fallbackCategories[0]?.image;

  const displayCategories = [
    { name: "All", image: defaultCategoryImage },
    ...categories
  ];

  function toggleWishlist(item) {
    setWishlist((prev) =>
      prev.includes(item.name)
        ? prev.filter((name) => name !== item.name)
        : [...prev, item.name]
    );
  }

  function addToCart(item) {
    if (!item) {
      return;
    }
    setCartItems((prev) => {
      const existing = prev.find((entry) => entry.name === item.name);
      if (existing) {
        return prev.map((entry) =>
          entry.name === item.name
            ? { ...entry, qty: entry.qty + 1 }
            : entry
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
  }

  function adjustCartQty(name, delta) {
    setCartItems((prev) =>
      prev
        .map((entry) =>
          entry.name === name
            ? { ...entry, qty: Math.max(1, entry.qty + delta) }
            : entry
        )
        .filter((entry) => entry.qty > 0)
    );
  }

  function removeFromCart(name) {
    setCartItems((prev) => prev.filter((entry) => entry.name !== name));
  }

  function handleNewsletterSubmit(event) {
    event.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes("@")) {
      setNewsletterStatus("Please enter a valid email.");
      return;
    }
    setNewsletterStatus("You are on the list. Watch your inbox.");
    setNewsletterEmail("");
  }

  async function handleTrackOrder(event) {
    event.preventDefault();
    if (orderId.trim().length < 5) {
      setOrderStatus("Enter a valid order ID to continue.");
      return;
    }
    setOrderStatus("Looking up your order...");
    try {
      const { response, data } = await authedFetch(
        `/api/orders/track?orderId=${encodeURIComponent(orderId.trim())}`
      );
      if (!response.ok) {
        throw new Error(data.message || "Unable to track order.");
      }
      const placedDate = data.order?.createdAt
        ? new Date(data.order.createdAt).toLocaleDateString()
        : "Unknown date";
      setOrderStatus(
        `Order ${data.order?.id?.slice(-6) || ""} is ${data.order?.status}. Placed ${placedDate}.`
      );
    } catch (error) {
      setOrderStatus(error.message);
    }
  }

  async function authedFetch(url, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }
    const response = await apiFetch(url, { ...options, headers });
    const data = await parseResponse(response);
    return { response, data };
  }

  async function loadMyOrders() {
    if (!authToken) {
      return;
    }
    const { response, data } = await authedFetch("/api/orders/my");
    if (response.ok) {
      setMyOrders(data.orders || []);
    }
  }

  async function createOrder(payload) {
    if (!authToken) {
      setCheckoutStatus("Please sign in before placing an order.");
      return false;
    }
    setCheckoutStatus("");
    setCheckoutLoading(true);
    try {
      const { response, data } = await authedFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(data.message || "Order failed.");
      }
      const newOrderId = data.order?._id;
      if (newOrderId) {
        setOrderId(newOrderId);
        setOrderStatus(
          `Order confirmed. Track with ID: ${newOrderId.slice(-6)}`
        );
      }
      setCheckoutStatus(
        newOrderId
          ? `Order placed. Your tracking ID: ${newOrderId}`
          : "Order placed. Cash on delivery confirmed."
      );
      setCartItems([]);
      await loadMyOrders();
      return true;
    } catch (error) {
      setCheckoutStatus(error.message);
      return false;
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function loadAdminSummary() {
    setAdminStatus("");
    const { response, data } = await authedFetch("/api/admin/summary");
    if (response.ok) {
      setAdminSummary(data);
    } else {
      setAdminStatus(data.message || "Unable to load admin data.");
    }
  }

  async function loadAdminOrders() {
    const { response, data } = await authedFetch("/api/admin/orders");
    if (response.ok) {
      setAdminOrders(data.orders || []);
    }
  }

  async function updateOrderStatus(orderId, status) {
    const { response, data } = await authedFetch(
      `/api/admin/orders/${orderId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status })
      }
    );
    if (!response.ok) {
      throw new Error(data.message || "Failed to update status.");
    }
    return data;
  }

  async function registerUser(payload) {
    setAuthStatus("");
    try {
      const response = await apiFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await parseResponse(response);
      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }
      setAuthToken(data.token);
      setAuthUser(data.user);
      setAuthStatus("Account created. You are signed in.");
      return true;
    } catch (error) {
      setAuthStatus(error.message);
      return false;
    }
  }

  async function loginUser(payload) {
    setAuthStatus("");
    try {
      const response = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await parseResponse(response);
      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }
      setAuthToken(data.token);
      setAuthUser(data.user);
      setAuthStatus("Welcome back.");
      return true;
    } catch (error) {
      setAuthStatus(error.message);
      return false;
    }
  }

  function logoutUser() {
    setAuthToken("");
    setAuthUser(null);
    setAuthStatus("Signed out.");
  }

  const storeValue = {
    categories,
    products,
    featured,
    trending,
    hero,
    spotlight,
    setSpotlight,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    wishlist,
    wishlistItems,
    toggleWishlist,
    cartItems,
    cartCount,
    cartTotal,
    addToCart,
    adjustCartQty,
    removeFromCart,
    newsletterEmail,
    setNewsletterEmail,
    newsletterStatus,
    handleNewsletterSubmit,
    orderId,
    setOrderId,
    orderStatus,
    handleTrackOrder,
    authUser,
    authToken,
    authStatus,
    setAuthStatus,
    registerUser,
    loginUser,
    logoutUser,
    myOrders,
    checkoutStatus,
    checkoutLoading,
    createOrder,
    adminSummary,
    adminOrders,
    adminStatus,
    loadAdminSummary,
    loadAdminOrders,
    updateOrderStatus,
    filteredProducts,
    displayCategories,
    supportPages,
    storeLocations
  };

  return (
    <BrowserRouter>
      <StoreContext.Provider value={storeValue}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/deals" element={<DealsPage />} />
            <Route path="/track" element={<TrackOrderPage />} />
            <Route path="/stores" element={<StoresPage />} />
            <Route path="/pages" element={<OtherPages />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </StoreContext.Provider>
    </BrowserRouter>
  );
}

function Layout() {
  const navigate = useNavigate();
  const { searchTerm, setSearchTerm, cartCount, wishlist, authUser } =
    useStore();

  function handleSearchSubmit(event) {
    event.preventDefault();
    navigate("/products");
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="container topbar-inner">
          <NavLink to="/" className="logo">
            <span className="logo-mark">e</span>
            <span className="logo-text">Commax</span>
          </NavLink>

          <form className="search" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search products, brands, and categories"
              aria-label="Search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <button className="btn btn-primary" type="submit">
              Search
            </button>
          </form>

          <div className="topbar-actions">
            <button
              className="icon-button"
              type="button"
              aria-label="Wishlist"
              onClick={() => navigate("/wishlist")}
            >
              <IconHeart />
              {wishlist.length > 0 && (
                <span className="count-badge">{wishlist.length}</span>
              )}
            </button>
            <button
              className="icon-button"
              type="button"
              aria-label="Cart"
              onClick={() => navigate("/cart")}
            >
              <IconCart />
              {cartCount > 0 && (
                <span className="count-badge">{cartCount}</span>
              )}
            </button>
            <button
              className="icon-button"
              type="button"
              aria-label="Account"
              onClick={() => navigate("/account")}
            >
              <IconUser />
            </button>
          </div>
        </div>

        <div className="container nav-row">
          <nav className="main-nav">
            {navLinks.map((link) => (
              <NavLink
                key={link.label}
                to={link.href}
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
                end={link.href === "/"}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="utility-links">
            {utilityLinks.map((link) => (
              <NavLink
                key={link.label}
                to={link.href}
                className={({ isActive }) =>
                  isActive ? "nav-link utility active" : "nav-link utility"
                }
              >
                {link.label}
              </NavLink>
            ))}
            {authUser?.role === "admin" && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  isActive ? "nav-link utility active" : "nav-link utility"
                }
              >
                Admin
              </NavLink>
            )}
          </div>
        </div>
      </header>

      <main className="page-main">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <div>
            <div className="logo">
              <span className="logo-mark">e</span>
              <span className="logo-text">Commax</span>
            </div>
            <p>
              Premium electronics, curated with bold design and flawless
              performance.
            </p>
          </div>
          <div className="footer-links">
            <NavLink to="/pages">About</NavLink>
            <NavLink to="/track">Support</NavLink>
            <NavLink to="/pages">Shipping</NavLink>
            <NavLink to="/pages">Privacy</NavLink>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HomePage() {
  const navigate = useNavigate();
  const {
    hero,
    featured,
    trending,
    displayCategories,
    setSelectedCategory,
    setSpotlight,
    addToCart,
    toggleWishlist,
    wishlist,
    newsletterEmail,
    setNewsletterEmail,
    newsletterStatus,
    handleNewsletterSubmit
  } = useStore();

  return (
    <>
      <section className="hero container">
        <div className="hero-main">
          <div className="hero-content">
            <p className="eyebrow">Gaming Gear</p>
            <h1>{hero?.name || "Game Controller"}</h1>
            <p className="hero-copy">
              {hero?.tagline ||
                "Precision grips, adaptive triggers, and zero lag wireless control."}
            </p>
            <div className="hero-actions">
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => {
                  setSelectedCategory(hero?.category || "All");
                  navigate("/products");
                }}
              >
                Shop Now
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => {
                  setSpotlight(hero);
                  navigate("/products");
                }}
              >
                View Details
              </button>
            </div>
          </div>
          <div className="hero-media">
            <div className="hero-badge">{hero?.badge || "Hot Deal"}</div>
            <img src={hero?.image} alt={hero?.name} />
          </div>
        </div>

        <div className="hero-side">
          {promoCards.map((card) => (
            <article key={card.title} className="promo-card">
              <div className="promo-content">
                <span>{card.eyebrow}</span>
                <h3>{card.title}</h3>
                <p>{card.copy}</p>
                <button
                  className="text-button"
                  type="button"
                  onClick={() => navigate("/products")}
                >
                  Shop Now
                </button>
              </div>
              <img src={card.image} alt={card.title} />
            </article>
          ))}
        </div>
      </section>

      <section className="category-strip container">
        <div className="category-track">
          {displayCategories.slice(1).map((item) => (
            <button
              key={item.name}
              className="category-pill"
              type="button"
              onClick={() => {
                setSelectedCategory(item.name);
                navigate("/products");
              }}
            >
              <img src={item.image} alt={item.name} />
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="service-row container">
        <div className="service-card">
          <h4>Free US Delivery</h4>
          <p>Fast shipping on orders over $200.</p>
        </div>
        <div className="service-card">
          <h4>Secure Payment</h4>
          <p>Visa, MasterCard, PayPal, and Apple Pay.</p>
        </div>
        <div className="service-card">
          <h4>1 Year Warranty</h4>
          <p>Coverage for manufacturing defects.</p>
        </div>
        <div className="service-card">
          <h4>Support 24/7</h4>
          <p>Chat with our tech team any time.</p>
        </div>
      </section>

      <section className="feature-section container">
        <div className="section-head">
          <h2>Featured Collections</h2>
          <p>Hand-picked drops with premium build and design.</p>
        </div>
        <div className="feature-grid">
          {featured.map((item) => (
            <article key={item.name} className="feature-card">
              <div className="feature-media">
                <span className="chip">{item.badge}</span>
                <img src={item.image} alt={item.name} />
              </div>
              <div className="feature-content">
                <h3>{item.name}</h3>
                <p>{item.tagline}</p>
                <div className="price-row">
                  <span>${item.price}</span>
                  <div className="inline-actions">
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => {
                        setSpotlight(item);
                        navigate("/products");
                      }}
                    >
                      Details
                    </button>
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => addToCart(item)}
                    >
                      Add to cart
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="trending container">
        <div className="section-head">
          <h2>Top Smartphone Trends</h2>
          <p>Curated tech that is shaping tomorrow.</p>
        </div>
        <div className="trend-grid">
          {trending.map((item) => {
            const isWishlisted = wishlist.includes(item.name);
            return (
              <article key={item.name} className="trend-card">
                <div className="trend-media">
                  <img src={item.image} alt={item.name} />
                </div>
                <div className="trend-content">
                  <span>{item.category}</span>
                  <h3>{item.name}</h3>
                  <p>{item.tagline}</p>
                  <div className="price-row">
                    <span>${item.price}</span>
                    <div className="inline-actions">
                      <button
                        className="btn btn-soft"
                        type="button"
                        onClick={() => addToCart(item)}
                      >
                        Shop
                      </button>
                      <button
                        className={`icon-toggle ${
                          isWishlisted ? "active" : ""
                        }`}
                        type="button"
                        onClick={() => toggleWishlist(item)}
                        aria-label="Toggle wishlist"
                      >
                        <IconHeart />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="newsletter" id="newsletter">
        <div className="container newsletter-inner">
          <div>
            <h2>Get early access to weekly drops.</h2>
            <p>Join 25,000+ shoppers getting curated deals and new arrivals.</p>
            {newsletterStatus && <p className="status">{newsletterStatus}</p>}
          </div>
          <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
            <input
              type="email"
              placeholder="Enter your email"
              value={newsletterEmail}
              onChange={(event) => setNewsletterEmail(event.target.value)}
            />
            <button className="btn btn-primary" type="submit">
              Notify me
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

function CollectionsPage() {
  const navigate = useNavigate();
  const {
    featured,
    setSpotlight,
    addToCart,
    displayCategories,
    setSelectedCategory
  } = useStore();

  return (
    <section className="container page-section">
      <div className="section-head">
        <h2>Collections</h2>
        <p>Curated drops tailored for power users.</p>
      </div>
      <div className="category-track">
        {displayCategories.slice(1).map((item) => (
          <button
            key={item.name}
            className="category-pill"
            type="button"
            onClick={() => {
              setSelectedCategory(item.name);
              navigate("/products");
            }}
          >
            <img src={item.image} alt={item.name} />
            <span>{item.name}</span>
          </button>
        ))}
      </div>
      <div className="feature-grid">
        {featured.map((item) => (
          <article key={item.name} className="feature-card">
            <div className="feature-media">
              <span className="chip">{item.badge}</span>
              <img src={item.image} alt={item.name} />
            </div>
            <div className="feature-content">
              <h3>{item.name}</h3>
              <p>{item.tagline}</p>
              <div className="price-row">
                <span>${item.price}</span>
                <div className="inline-actions">
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => {
                      setSpotlight(item);
                      navigate("/products");
                    }}
                  >
                    Details
                  </button>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => addToCart(item)}
                  >
                    Add to cart
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProductsPage() {
  const {
    spotlight,
    setSpotlight,
    addToCart,
    filteredProducts,
    categories,
    selectedCategory,
    setSelectedCategory,
    searchTerm,
    setSearchTerm
  } = useStore();

  return (
    <section className="container page-section">
      <div className="section-head">
        <h2>All Products</h2>
        <p>Search, filter, and add items to your cart.</p>
      </div>

      <div className="spotlight">
        <div className="spotlight-card">
          <div>
            <p className="eyebrow">Product Spotlight</p>
            <h2>{spotlight?.name}</h2>
            <p>{spotlight?.tagline}</p>
            <div className="price-row">
              <span>${spotlight?.price}</span>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => addToCart(spotlight)}
              >
                Add to cart
              </button>
            </div>
          </div>
          <img src={spotlight?.image} alt={spotlight?.name} />
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-tags">
          {["All", ...categories.map((item) => item.name)].map((name) => (
            <button
              key={name}
              className={`tag ${selectedCategory === name ? "active" : ""}`}
              type="button"
              onClick={() => setSelectedCategory(name)}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="filter-input">
          <input
            type="text"
            placeholder="Filter by keyword"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <button
            className="btn btn-soft"
            type="button"
            onClick={() => setSearchTerm("")}
          >
            Clear
          </button>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="empty-state">
          No results yet. Try another search or category.
        </div>
      ) : (
        <div className="product-grid">
          {filteredProducts.map((item) => (
            <article key={item.name} className="product-card">
              <img src={item.image} alt={item.name} />
              <div>
                <span>{item.category}</span>
                <h3>{item.name}</h3>
                <p>{item.tagline}</p>
                <div className="price-row">
                  <span>${item.price}</span>
                  <div className="inline-actions">
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => setSpotlight(item)}
                    >
                      Details
                    </button>
                    <button
                      className="btn btn-soft"
                      type="button"
                      onClick={() => addToCart(item)}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function DealsPage() {
  const { featured, addToCart } = useStore();

  return (
    <section className="container page-section">
      <div className="section-head">
        <h2>Hot Deals</h2>
        <p>Limited-time discounts on our most popular tech.</p>
      </div>
      <div className="deal-grid">
        {featured.slice(0, 6).map((item) => (
          <article key={item.name} className="deal-card">
            <img src={item.image} alt={item.name} />
            <div>
              <h3>{item.name}</h3>
              <p>{item.tagline}</p>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => addToCart(item)}
              >
                Grab deal
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function TrackOrderPage() {
  const { orderId, setOrderId, orderStatus, handleTrackOrder } = useStore();

  return (
    <section className="container page-section">
      <div className="track-card">
        <div>
          <h2>Track your order</h2>
          <p>Enter your order ID to get the latest delivery status.</p>
        </div>
        <form onSubmit={handleTrackOrder}>
          <input
            type="text"
            placeholder="Order ID (full or last 6)"
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
          />
          <button className="btn btn-primary" type="submit">
            Track
          </button>
        </form>
        {orderStatus && <p className="status">{orderStatus}</p>}
      </div>
    </section>
  );
}

function StoresPage() {
  const { storeLocations } = useStore();

  return (
    <section className="container page-section">
      <div className="section-head">
        <h2>Store Locator</h2>
        <p>Find a showroom near you for hands-on demos.</p>
      </div>
      <div className="store-grid">
        {storeLocations.map((store) => (
          <div key={store.city} className="store-card">
            <h3>{store.city}</h3>
            <p>{store.address}</p>
            <p>{store.phone}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function OtherPages() {
  const { supportPages } = useStore();

  return (
    <section className="container page-section">
      <div className="section-head">
        <h2>Other Pages</h2>
        <p>Everything you need to shop with confidence.</p>
      </div>
      <div className="page-grid">
        {supportPages.map((page) => (
          <div key={page.title} className="page-card">
            <h3>{page.title}</h3>
            <p>{page.copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function BlogPage() {
  return (
    <section className="container page-section">
      <div className="section-head">
        <h2>Latest From The Blog</h2>
        <p>Stories, guides, and launch insights.</p>
      </div>
      <div className="blog-grid">
        {blogPosts.map((post) => (
          <article key={post.title} className="blog-card">
            <div className="blog-meta">
              <span>{post.tag}</span>
              <span>{post.time}</span>
            </div>
            <h3>{post.title}</h3>
            <button className="text-button" type="button">
              Read article
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function CartPage() {
  const navigate = useNavigate();
  const {
    cartItems,
    cartCount,
    cartTotal,
    adjustCartQty,
    removeFromCart,
    createOrder,
    checkoutStatus,
    checkoutLoading
  } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState([]);

  function openCheckout(items) {
    setCheckoutItems(items);
    setShowModal(true);
  }

  return (
    <section className="container page-section">
      <div className="section-head">
        <h2>Your Cart</h2>
        <p>{cartCount} items in your cart.</p>
      </div>
      <div className="cart-panel">
        {cartItems.length === 0 ? (
          <div className="empty-state">
            Your cart is empty. Start shopping to add items.
          </div>
        ) : (
          <div className="cart-items">
            {cartItems.map((item) => (
              <div key={item.name} className="cart-item">
                <div className="cart-item-info">
                  <img src={item.image} alt={item.name} />
                  <div>
                    <h4>{item.name}</h4>
                    <p>${item.price}</p>
                  </div>
                </div>
                <div className="cart-qty">
                  <button
                    type="button"
                    onClick={() => adjustCartQty(item.name, -1)}
                  >
                    -
                  </button>
                  <span>{item.qty}</span>
                  <button
                    type="button"
                    onClick={() => adjustCartQty(item.name, 1)}
                  >
                    +
                  </button>
                </div>
                <div className="cart-item-actions">
                  <button
                    className="btn btn-soft"
                    type="button"
                    onClick={() => openCheckout([item])}
                  >
                    Buy now
                  </button>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => removeFromCart(item.name)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <div className="cart-total">
              <strong>Total</strong>
              <strong>${cartTotal.toFixed(2)}</strong>
            </div>
            <div className="cart-actions">
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => openCheckout(cartItems)}
              >
                Buy all (COD)
              </button>
            </div>
          </div>
        )}
      </div>
      <CheckoutModal
        open={showModal}
        onClose={() => setShowModal(false)}
        items={checkoutItems}
        onSubmit={createOrder}
        loading={checkoutLoading}
        status={checkoutStatus}
      />
      <button
        className="btn btn-soft"
        type="button"
        onClick={() => navigate("/products")}
      >
        Continue shopping
      </button>
    </section>
  );
}

function WishlistPage() {
  const navigate = useNavigate();
  const { wishlistItems, addToCart, toggleWishlist, createOrder, checkoutStatus, checkoutLoading } =
    useStore();
  const [showModal, setShowModal] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState([]);

  function openCheckout(items) {
    setCheckoutItems(items);
    setShowModal(true);
  }

  return (
    <section className="container page-section">
      <div className="section-head">
        <h2>Your Wishlist</h2>
        <p>Save items to compare and buy later.</p>
      </div>
      <div className="cart-panel">
        {wishlistItems.length === 0 ? (
          <div className="empty-state">
            Your wishlist is empty. Explore products to add favorites.
          </div>
        ) : (
          <div className="cart-items">
            {wishlistItems.map((item) => (
              <div key={item.name} className="cart-item">
                <div className="cart-item-info">
                  <img src={item.image} alt={item.name} />
                  <div>
                    <h4>{item.name}</h4>
                    <p>${item.price}</p>
                  </div>
                </div>
                <div className="cart-item-actions">
                  <button
                    className="btn btn-soft"
                    type="button"
                    onClick={() => addToCart(item)}
                  >
                    Add to cart
                  </button>
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => openCheckout([{ ...item, qty: 1 }])}
                  >
                    Buy now
                  </button>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => toggleWishlist(item)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <CheckoutModal
        open={showModal}
        onClose={() => setShowModal(false)}
        items={checkoutItems}
        onSubmit={createOrder}
        loading={checkoutLoading}
        status={checkoutStatus}
      />
      <button
        className="btn btn-soft"
        type="button"
        onClick={() => navigate("/products")}
      >
        Browse products
      </button>
    </section>
  );
}

function AccountPage() {
  const {
    authUser,
    authStatus,
    setAuthStatus,
    registerUser,
    loginUser,
    logoutUser,
    myOrders
  } = useStore();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const statusClass =
    authStatus &&
    /(error|failed|invalid|unexpected|unauthorized|not configured)/i.test(
      authStatus
    )
      ? "status error"
      : "status";

  if (authUser?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (mode === "register") {
      await registerUser(form);
    } else {
      await loginUser({ email: form.email, password: form.password });
    }
  }

  return (
    <section className="container page-section account-page">
      <div className="page-card account-card">
        {authUser ? (
          <>
            <h3>Welcome back, {authUser.name}</h3>
            <p>{authUser.email}</p>
            <button className="btn btn-primary" type="button" onClick={logoutUser}>
              Sign out
            </button>
            {authUser.role === "admin" && (
              <p className="muted">Admin access enabled.</p>
            )}
            {authStatus && <p className={statusClass}>{authStatus}</p>}
            <div className="order-list">
              <h4>Recent Orders</h4>
              {myOrders.length === 0 ? (
                <p className="muted">No orders yet.</p>
              ) : (
                myOrders.map((order) => (
                  <div key={order._id} className="order-item">
                    <div>
                      <strong>Order #{order._id.slice(-6)}</strong>
                      <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p>{order.items.length} items</p>
                      <p>${order.subtotal.toFixed(2)}</p>
                      <span className="tag active">{order.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="account-shell">
            <div className="account-intro">
              <div className="account-logo">
                <span className="logo-mark">e</span>
                <span className="logo-text">Commax</span>
              </div>
              <h3>
                {mode === "register" ? "Create account" : "Welcome back"}
              </h3>
            </div>
            <form className="account-form" onSubmit={handleSubmit}>
              {mode === "register" && (
                <label>
                  Full name
                  <input
                    type="text"
                    placeholder="Your name"
                    value={form.name}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        name: event.target.value
                      }))
                    }
                    required
                  />
                </label>
              )}
              <label>
                Email address
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={form.password}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      password: event.target.value
                    }))
                  }
                  required
                  minLength={6}
                />
              </label>
              {mode === "login" ? (
                <button className="link-button link-center" type="button">
                  Forgot password?
                </button>
              ) : null}
              <button className="btn btn-primary" type="submit">
                {mode === "register" ? "Create account" : "Login"}
              </button>
              <p className="account-helper">
                {mode === "register" ? (
                  <>
                    Already a member?{" "}
                    <button
                      className="link-button"
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setAuthStatus("");
                      }}
                    >
                      Sign in
                    </button>
                  </>
                ) : (
                  <>
                    Are you new?{" "}
                    <button
                      className="link-button"
                      type="button"
                      onClick={() => {
                        setMode("register");
                        setAuthStatus("");
                      }}
                    >
                      Sign up
                    </button>
                  </>
                )}
              </p>
              {authStatus && <p className={statusClass}>{authStatus}</p>}
            </form>
          </div>
        )}
      </div>
    </section>
  );
}

function AdminDashboard() {
  const {
    authUser,
    adminSummary,
    adminOrders,
    adminStatus,
    loadAdminSummary,
    loadAdminOrders,
    updateOrderStatus
  } = useStore();
  const [orderQuery, setOrderQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusDrafts, setStatusDrafts] = useState({});
  const [statusUpdating, setStatusUpdating] = useState({});
  const [adminNotice, setAdminNotice] = useState("");
  const allowedStatuses = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled"
  ];

  useEffect(() => {
    if (authUser?.role === "admin") {
      loadAdminSummary();
      loadAdminOrders();
    }
  }, [authUser]);

  const statusOptions = useMemo(() => {
    const unique = new Set();
    (adminOrders || []).forEach((order) => {
      if (order.status) {
        unique.add(order.status);
      }
    });
    return ["all", ...Array.from(unique)];
  }, [adminOrders]);

  const filteredOrders = useMemo(() => {
    const query = orderQuery.trim().toLowerCase();
    return (adminOrders || []).filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }
      if (!query) {
        return true;
      }
      const haystack = [
        order._id || "",
        order.user?.name || "",
        order.user?.email || ""
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [adminOrders, orderQuery, statusFilter]);

  function handleRefresh() {
    loadAdminSummary();
    loadAdminOrders();
  }

  async function handleStatusUpdate(orderId) {
    const nextStatus = statusDrafts[orderId];
    if (!nextStatus) {
      return;
    }
    setStatusUpdating((prev) => ({ ...prev, [orderId]: true }));
    setAdminNotice("");
    try {
      await updateOrderStatus(orderId, nextStatus);
      setAdminNotice("Order status updated.");
      loadAdminOrders();
      loadAdminSummary();
    } catch (error) {
      setAdminNotice(error.message);
    } finally {
      setStatusUpdating((prev) => ({ ...prev, [orderId]: false }));
    }
  }

  if (!authUser || authUser.role !== "admin") {
    return (
      <section className="container page-section">
        <div className="empty-state">Admin access required.</div>
      </section>
    );
  }

  return (
    <section className="container page-section admin-page">
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-brand">
            <span className="logo-mark">e</span>
            <div>
              <p className="eyebrow">Admin</p>
              <strong>Commax Console</strong>
            </div>
          </div>
          <nav className="admin-nav">
            <button className="admin-nav-item active" type="button">
              Overview
            </button>
            <button className="admin-nav-item" type="button">
              Orders
            </button>
            <button className="admin-nav-item" type="button">
              Customers
            </button>
            <button className="admin-nav-item" type="button">
              Settings
            </button>
          </nav>
          <div className="admin-sidebar-card">
            <h4>Quick actions</h4>
            <button className="btn btn-primary" type="button" onClick={handleRefresh}>
              Refresh data
            </button>
            <button className="btn btn-soft" type="button">
              Download report
            </button>
          </div>
        </aside>

        <div className="admin-content">
          <div className="admin-hero">
            <div>
              <p className="eyebrow">Admin Console</p>
              <h2>Operations Dashboard</h2>
              <p className="muted">
                Monitor orders, revenue, and customer activity in real time.
              </p>
            </div>
            <div className="admin-hero-actions">
              <button className="btn btn-soft" type="button">
                Export CSV
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={handleRefresh}
              >
                Refresh
              </button>
            </div>
          </div>
      {adminStatus && <p className="status">{adminStatus}</p>}
      {adminNotice && <p className="status">{adminNotice}</p>}
      <div className="admin-grid">
        <div className="admin-card">
          <h3>Total Users</h3>
          <p>{adminSummary?.usersCount ?? "-"}</p>
          <span className="muted">All registered accounts</span>
        </div>
        <div className="admin-card">
          <h3>Total Orders</h3>
          <p>{adminSummary?.ordersCount ?? "-"}</p>
          <span className="muted">Placed to date</span>
        </div>
        <div className="admin-card">
          <h3>Revenue</h3>
          <p>${(adminSummary?.revenue ?? 0).toFixed(2)}</p>
          <span className="muted">Cash on delivery</span>
        </div>
      </div>
      <div className="admin-insights">
        <div className="insight-card">
          <h4>Order flow</h4>
          <div className="insight-bar">
            <span style={{ width: "62%" }} />
          </div>
          <p className="muted">62% of orders in processing or shipped.</p>
        </div>
        <div className="insight-card">
          <h4>Repeat customers</h4>
          <div className="insight-bar">
            <span style={{ width: "38%" }} />
          </div>
          <p className="muted">38% of orders from returning buyers.</p>
        </div>
      </div>
      <div className="admin-orders">
        <div className="admin-orders-head">
          <div>
            <h3>Recent Orders</h3>
            <p className="muted">Search, filter, and inspect orders.</p>
          </div>
          <div className="admin-controls">
            <input
              className="admin-search"
              type="search"
              placeholder="Search by name, email, or order id"
              value={orderQuery}
              onChange={(event) => setOrderQuery(event.target.value)}
            />
            <select
              className="admin-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === "all" ? "All statuses" : status}
                </option>
              ))}
            </select>
          </div>
        </div>
        {filteredOrders.length === 0 ? (
          <p className="muted">No orders match your filters.</p>
        ) : (
          <div className="admin-table">
            <div className="admin-row admin-row--header">
              <span>Order</span>
              <span>Customer</span>
              <span>Items</span>
              <span>Total</span>
              <span>Status</span>
              <span>Date</span>
              <span>View</span>
              <span>Update</span>
            </div>
            {filteredOrders.map((order) => (
              <div key={order._id} className="admin-row">
                <span className="admin-id">#{order._id.slice(-6)}</span>
                <span className="admin-customer">
                  {order.user?.name || "Unknown user"}
                  <small>{order.user?.email}</small>
                </span>
                <span>{order.items.length}</span>
                <span>${order.subtotal.toFixed(2)}</span>
                <select
                  className="admin-status-select"
                  value={statusDrafts[order._id] || order.status}
                  onChange={(event) =>
                    setStatusDrafts((prev) => ({
                      ...prev,
                      [order._id]: event.target.value
                    }))
                  }
                >
                  {[
                    ...(allowedStatuses.includes(order.status)
                      ? []
                      : [order.status]),
                    ...allowedStatuses
                  ].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <span>
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString()
                    : "-"}
                </span>
                <button
                  className="btn btn-soft"
                  type="button"
                  disabled={statusUpdating[order._id]}
                  onClick={() => setSelectedOrder(order)}
                >
                  View
                </button>
                <button
                  className="btn btn-primary"
                  type="button"
                  disabled={statusUpdating[order._id]}
                  onClick={() => handleStatusUpdate(order._id)}
                >
                  {statusUpdating[order._id] ? "Updating..." : "Update"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
        </div>
      </div>
    </section>
  );
}

function OrderDetailsModal({ order, onClose }) {
  if (!order) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Order Details</p>
            <h3>#{order._id.slice(-6)}</h3>
          </div>
          <button className="modal-close" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="modal-body">
          <div className="modal-summary">
            <div className="summary-row">
              <span>Customer</span>
              <strong>{order.user?.name || "Unknown user"}</strong>
            </div>
            <div className="summary-row">
              <span>Email</span>
              <strong>{order.user?.email || "-"}</strong>
            </div>
            <div className="summary-row">
              <span>Status</span>
              <strong>{order.status}</strong>
            </div>
            <div className="summary-row">
              <span>Total</span>
              <strong>${order.subtotal.toFixed(2)}</strong>
            </div>
          </div>
          <div className="admin-order-details">
            <div>
              <h4>Items</h4>
              <ul>
                {order.items.map((item, index) => (
                  <li key={`${item.name}-${index}`}>
                    {item.name} x{item.qty} — ${item.price}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4>Shipping</h4>
              <p>{order.shipping.fullName}</p>
              <p>{order.shipping.phone}</p>
              <p>{order.shipping.address}</p>
              <p>
                {order.shipping.city}, {order.shipping.postalCode}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckoutModal({ open, onClose, items, onSubmit, loading, status }) {
  const [shipping, setShipping] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: ""
  });

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.qty || 1),
    0
  );

  async function handleSubmit(event) {
    event.preventDefault();
    if (items.length === 0) {
      return;
    }
    const success = await onSubmit({
      items: items.map((item) => ({
        name: item.name,
        price: item.price,
        qty: item.qty || 1
      })),
      shipping,
      paymentMethod: "cod"
    });
    if (success) {
      setShipping({
        fullName: "",
        phone: "",
        address: "",
        city: "",
        postalCode: ""
      });
      onClose();
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Cash on Delivery</p>
            <h3>Complete your order</h3>
          </div>
          <button className="modal-close" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="modal-body">
          <div className="modal-summary">
            {items.map((item) => (
              <div key={item.name} className="summary-row">
                <span>
                  {item.name} x{item.qty || 1}
                </span>
                <strong>${(item.price * (item.qty || 1)).toFixed(2)}</strong>
              </div>
            ))}
            <div className="summary-row total">
              <span>Total</span>
              <strong>${subtotal.toFixed(2)}</strong>
            </div>
          </div>
          <form className="checkout-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <input
                type="text"
                placeholder="Full name"
                value={shipping.fullName}
                onChange={(event) =>
                  setShipping((prev) => ({
                    ...prev,
                    fullName: event.target.value
                  }))
                }
                required
              />
              <input
                type="text"
                placeholder="Phone"
                value={shipping.phone}
                onChange={(event) =>
                  setShipping((prev) => ({ ...prev, phone: event.target.value }))
                }
                required
              />
              <input
                type="text"
                placeholder="Street address"
                value={shipping.address}
                onChange={(event) =>
                  setShipping((prev) => ({
                    ...prev,
                    address: event.target.value
                  }))
                }
                required
              />
              <input
                type="text"
                placeholder="City"
                value={shipping.city}
                onChange={(event) =>
                  setShipping((prev) => ({ ...prev, city: event.target.value }))
                }
                required
              />
              <input
                type="text"
                placeholder="Postal code"
                value={shipping.postalCode}
                onChange={(event) =>
                  setShipping((prev) => ({
                    ...prev,
                    postalCode: event.target.value
                  }))
                }
                required
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Placing order..." : "Place COD order"}
            </button>
            {status && <p className="status">{status}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}

function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <section className="container page-section">
      <div className="empty-state">
        That page is not available yet. Return to the homepage.
      </div>
      <button
        className="btn btn-primary"
        type="button"
        onClick={() => navigate("/")}
      >
        Go Home
      </button>
    </section>
  );
}

function IconHeart() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21s-7-4.5-9.5-8.5C.5 8.5 3 5 6.5 5c2 0 3.5 1 4.5 2.5C12 6 13.5 5 15.5 5 19 5 21.5 8.5 21.5 12.5 19 16.5 12 21 12 21z" />
    </svg>
  );
}

function IconCart() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 5h2l2.5 10h10.5l2-7H7.2" />
      <circle cx="10" cy="19" r="1.6" />
      <circle cx="17" cy="19" r="1.6" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="9" r="4" />
      <path d="M4 20c1.5-3 4.5-5 8-5s6.5 2 8 5" />
    </svg>
  );
}
