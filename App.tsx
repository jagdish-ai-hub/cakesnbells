
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import CategoryPage from './pages/CategoryPage';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import WishlistPage from './pages/WishlistPage';
import AdminPage from './pages/AdminPage';
import Navbar from './components/Navbar';
import { CustomerDetails, OrderItem } from './types';
import { ProductProvider } from './context/ProductContext';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App: React.FC = () => {
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [lastOrder, setLastOrder] = useState<{
    item: OrderItem;
    customer: CustomerDetails;
  } | undefined>();

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('Install prompt is ready');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If app is already installed
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      console.log('App was installed');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const toggleWishlist = (id: string) => {
    setWishlist(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <ProductProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen bg-[#fffafa] flex flex-col font-sans selection:bg-pink-100 selection:text-pink-600">
          <Navbar 
            wishlistCount={wishlist.length} 
            canInstall={!!deferredPrompt} 
            onInstall={handleInstallClick} 
          />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home wishlist={wishlist} onToggleWishlist={toggleWishlist} />} />
              <Route path="/category/:id" element={<CategoryPage wishlist={wishlist} onToggleWishlist={toggleWishlist} />} />
              <Route path="/product/:id" element={<ProductDetail wishlist={wishlist} onToggleWishlist={toggleWishlist} />} />
              <Route path="/checkout" element={<Checkout setLastOrder={setLastOrder} />} />
              <Route path="/payment" element={<Payment lastOrder={lastOrder} />} />
              <Route path="/wishlist" element={<WishlistPage wishlist={wishlist} onToggleWishlist={toggleWishlist} />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<Home wishlist={wishlist} onToggleWishlist={toggleWishlist} />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ProductProvider>
  );
};

export default App;
