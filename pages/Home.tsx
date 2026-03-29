
import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useProducts } from '../context/ProductContext';

interface HomeProps {
  wishlist: string[];
  onToggleWishlist: (id: string) => void;
}

// Simple fuzzy matching helper
const calculateRelevance = (query: string, text: string): number => {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 60;
  
  // Fuzzy check for typos (e.g. "button" -> "butterscotch")
  let qIdx = 0;
  let matches = 0;
  for (let i = 0; i < t.length && qIdx < q.length; i++) {
    if (t[i] === q[qIdx]) {
      matches++;
      qIdx++;
    }
  }
  
  const score = (matches / q.length) * 40;
  return score > 20 ? score : 0;
};

export default function Home({ wishlist, onToggleWishlist }: HomeProps) {
  const navigate = useNavigate();
  const { products, sections } = useProducts();
  
  const confectioneryProducts = products.filter(p => p.category === 'Confectionery');

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showContributor, setShowContributor] = useState(false);

  // Search Logic
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    // 1. Exact/Substring/Fuzzy matches
    const matches = products.map(p => ({
      product: p,
      score: calculateRelevance(searchQuery, p.name)
    })).filter(r => r.score > 0);

    // Sort by score
    matches.sort((a, b) => b.score - a.score);

    // If we have matches, return top 5
    if (matches.length > 0) {
      return matches.slice(0, 5).map(m => m.product);
    }

    // 2. Fallback to default popular cakes if no matches found
    const defaults = products.filter(p => 
      ['blackforest', 'vanilla', 'choco-truffle', 'pineapple'].includes(p.id)
    );
    return defaults;
  }, [searchQuery, products]);

  // Determine if we are showing fallback results
  const isFallback = searchQuery.trim().length > 0 && 
                     searchResults.length > 0 && 
                     !products.some(p => calculateRelevance(searchQuery, p.name) > 0);

  return (
    <div className="animate-fade-in-up">
      {/* Hero Header */}
      <section className="px-6 pt-12 pb-6 bg-gradient-to-b from-pink-50 to-transparent text-center">
        <div className="inline-block px-4 py-1.5 bg-white rounded-full shadow-sm text-pink-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4 border border-pink-100">
          Premium Bakery
        </div>
        <h1 className="text-5xl font-black text-gray-900 mb-4 tracking-tight leading-none">Freshly Baked <br/><span className="text-pink-500">With Love</span></h1>
        <p className="text-gray-500 mb-8 max-w-xs mx-auto text-sm font-medium leading-relaxed">Artisan cakes and sweet treats handcrafted and delivered straight to your door.</p>
        
        {/* Category Shortcuts */}
        <div className="flex justify-center space-x-4 mb-8">
          <Link to="/category/Cake" className="flex-1 max-w-[140px] py-4 bg-white rounded-[1.5rem] shadow-sm font-black text-[11px] uppercase tracking-widest text-gray-800 border border-pink-100 hover:border-pink-300 active:scale-95 transition-all">
            Cakes
          </Link>
          <Link to="/category/Confectionery" className="flex-1 max-w-[140px] py-4 bg-white rounded-[1.5rem] shadow-sm font-black text-[11px] uppercase tracking-widest text-gray-800 border border-pink-100 hover:border-pink-300 active:scale-95 transition-all">
            Confectionery
          </Link>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md mx-auto z-30">
          <div className={`relative flex items-center bg-white rounded-2xl shadow-sm border transition-all duration-300 ${isSearchFocused ? 'border-pink-400 ring-4 ring-pink-50 shadow-lg' : 'border-pink-100'}`}>
            <i className="fas fa-search text-gray-400 ml-4 text-lg"></i>
            <input 
              type="text" 
              placeholder="Search cakes..." 
              className="w-full py-4 px-3 bg-transparent outline-none text-gray-700 font-medium placeholder:text-gray-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="mr-4 text-gray-300 hover:text-pink-500"
              >
                <i className="fas fa-times-circle"></i>
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchQuery && (isSearchFocused || searchResults.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-pink-50 overflow-hidden animate-in slide-in-from-top-2 duration-200 z-50">
              {isFallback && (
                 <div className="px-4 py-3 bg-pink-50/50 text-[10px] font-bold text-pink-500 uppercase tracking-widest border-b border-pink-100">
                   Not found. Try these popular cakes:
                 </div>
              )}
              {searchResults.map((product) => (
                <div 
                  key={product.id}
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="flex items-center p-3 hover:bg-pink-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors group"
                >
                  <img src={product.images[0]} alt={product.name} className="w-12 h-12 rounded-lg object-cover border border-pink-50" />
                  <div className="ml-3 text-left flex-grow">
                    <h4 className="font-bold text-gray-800 text-sm group-hover:text-pink-600 transition-colors font-serif">{product.name}</h4>
                    <span className="text-xs text-gray-400">{product.category}</span>
                  </div>
                  <div className="text-pink-500">
                     <i className="fas fa-chevron-right text-xs opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1"></i>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Sections - Dynamically Loaded from Context */}
      {sections.map((sectionName) => {
        const sectionProducts = products.filter(p => p.category === 'Cake' && p.sections.includes(sectionName));
        if (sectionProducts.length === 0) return null;

        return (
          <section key={sectionName} className="py-8">
            <div className="px-6 mb-6 flex justify-between items-end">
              <div>
                <span className="text-pink-500 font-black text-[10px] tracking-widest uppercase mb-1 block">Collection</span>
                <h2 className="text-3xl font-black text-gray-900 font-serif tracking-tight">{sectionName}</h2>
              </div>
              <Link to={`/category/Cake`} className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center text-pink-500 shadow-sm active:scale-90 transition-transform">
                <i className="fas fa-arrow-right text-xs"></i>
              </Link>
            </div>
            
            <div className="flex overflow-x-auto gap-5 px-6 pb-6 hide-scrollbar">
              {sectionProducts.map((product) => (
                <div key={product.id} className="min-w-[220px] w-[220px]">
                  <ProductCard 
                    product={product} 
                    isWishlisted={wishlist.includes(product.id)}
                    onToggleWishlist={onToggleWishlist}
                  />
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {/* Confectionery Section */}
      {confectioneryProducts.length > 0 && (
        <section className="py-10 bg-cream/30">
          <div className="px-6 mb-6 flex justify-between items-end">
            <div>
              <span className="text-pink-500 font-black text-[10px] tracking-widest uppercase mb-1 block">Quick Treats</span>
              <h2 className="text-3xl font-black text-gray-900 font-serif tracking-tight">Confectionery</h2>
            </div>
            <Link to={`/category/Confectionery`} className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-pink-500 shadow-sm active:scale-90 transition-transform border border-pink-50">
              <i className="fas fa-arrow-right text-xs"></i>
            </Link>
          </div>
          <div className="flex overflow-x-auto gap-5 px-6 pb-10 hide-scrollbar">
            {confectioneryProducts.map((product) => (
              <div key={product.id} className="min-w-[220px] w-[220px]">
                <ProductCard 
                  product={product} 
                  isWishlisted={wishlist.includes(product.id)}
                  onToggleWishlist={onToggleWishlist}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trust Badges */}
      <section className="px-6 py-12 grid grid-cols-2 gap-4">
        <div className="p-6 bg-white rounded-3xl border border-pink-50 text-center">
          <i className="fas fa-truck text-pink-300 text-2xl mb-3"></i>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-800">Quick Delivery</h4>
        </div>
        <div className="p-6 bg-white rounded-3xl border border-pink-50 text-center">
          <i className="fas fa-shield-heart text-pink-300 text-2xl mb-3"></i>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-800">Hygienic Prep</h4>
        </div>
      </section>

      {/* Brand Ethos */}
      <section className="px-6 pt-16 pb-10 text-center bg-white mt-8 rounded-t-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
        <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-pink-100">
          <i className="fas fa-birthday-cake text-pink-400 text-3xl"></i>
        </div>
        <h3 className="text-2xl font-black mb-3 tracking-tight font-serif text-gray-900">Baked to Perfection</h3>
        <p className="text-gray-400 max-w-xs mx-auto text-sm font-medium leading-relaxed mb-10">
          Every order is baked fresh daily using premium ingredients because you deserve nothing but the best.
        </p>

        {/* Footer with Vertical Stack */}
        <footer className="border-t border-gray-100 pt-10 pb-16 flex flex-col items-center space-y-4">
          {/* 1. STOREKEEPER */}
          <Link to="/admin" className="text-gray-300 hover:text-pink-500 text-[10px] font-bold uppercase tracking-widest transition-colors">
             STOREKEEPER
          </Link>

          {/* 2. Developer */}
          <button 
             onClick={() => setShowContributor(true)}
             className="text-gray-300 hover:text-pink-500 text-[10px] font-bold uppercase tracking-widest transition-colors"
          >
             Developer - Jagdish
          </button>
          
          {/* 3. Copyright */}
          <p className="text-gray-200 text-[10px] font-medium tracking-wide mt-2">© 2026 Cakes N Bells</p>
        </footer>
      </section>

      {/* Contributor Popup */}
      {showContributor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in-up" onClick={() => setShowContributor(false)}>
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-xs w-full text-center m-4" onClick={e => e.stopPropagation()}>
             <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
               <i className="fas fa-code text-pink-500 text-2xl"></i>
             </div>
             <h3 className="text-xl font-bold text-gray-800 font-serif mb-2">Project Contributor</h3>
             <p className="text-gray-600 font-bold text-lg mb-1">Jagdish</p>
             <p className="text-gray-400 text-sm mb-6">jagadish.omm@gmail.com</p>
             <button 
               onClick={() => setShowContributor(false)}
               className="px-6 py-2 bg-pink-500 text-white rounded-full font-bold shadow-lg shadow-pink-200"
             >
               Close
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
