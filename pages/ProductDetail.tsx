
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';

interface ProductDetailProps {
  wishlist: string[];
  onToggleWishlist: (id: string) => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ wishlist, onToggleWishlist }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products } = useProducts();
  const product = products.find(p => p.id === id);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [selectedWeight, setSelectedWeight] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (product) {
      const defaultOption = product.prices['0.5kg'] ? '0.5kg' : 'piece';
      setSelectedWeight(defaultOption);
    }
  }, [product]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const index = Math.round(scrollLeft / clientWidth);
      if (index !== activeImage) {
        setActiveImage(index);
      }
    }
  };

  if (!product) {
    return (
      <div className="p-20 text-center animate-fade-in-up">
        <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-search text-pink-300 text-2xl"></i>
        </div>
        <p className="text-gray-500 font-medium">Sweet surprise not found!</p>
        <button onClick={() => navigate('/')} className="mt-4 text-pink-500 font-bold">Back to Shop</button>
      </div>
    );
  }

  const pricePerUnit = product.prices[selectedWeight as keyof typeof product.prices] || 0;
  const totalPrice = pricePerUnit * quantity;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out ${product.name} at Cakes N Bells!`,
          text: product.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const handleBuyNow = () => {
    navigate('/checkout', { 
      state: { 
        productId: product.id,
        name: product.name,
        weight: selectedWeight,
        quantity: quantity,
        totalPrice: totalPrice
      } 
    });
  };

  const weights = Object.keys(product.prices).filter(k => k !== 'piece');

  return (
    <div className="pb-24 animate-pop-in relative bg-white min-h-screen">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className="fixed top-4 left-4 z-20 w-10 h-10 bg-white/90 backdrop-blur rounded-full shadow-lg flex items-center justify-center text-gray-700 active:scale-90 transition-all border border-pink-50"
      >
        <i className="fas fa-chevron-left"></i>
      </button>

      {/* Swipeable Image Gallery */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth hide-scrollbar h-full"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {product.images.map((img, idx) => (
            <div key={idx} className="min-w-full h-full snap-center flex-shrink-0">
              <img 
                src={img} 
                alt={`${product.name} view ${idx + 1}`} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Fallback to generic placeholder
                  e.currentTarget.src = 'https://placehold.co/600x800/fce7f3/db2777?text=No+Image';
                }}
              />
            </div>
          ))}
        </div>
        
        {/* Indicators */}
        {product.images.length > 1 && (
          <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-2 z-10">
            {product.images.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${activeImage === i ? 'bg-pink-500 w-8' : 'bg-white/70 w-2'}`}
              />
            ))}
          </div>
        )}

        {/* Share Button */}
        <button 
          onClick={handleShare}
          className="absolute top-4 right-16 z-20 w-10 h-10 bg-white/90 backdrop-blur rounded-full shadow-lg flex items-center justify-center text-gray-700 active:scale-90 transition-all border border-pink-50"
          title="Share"
        >
          <i className="fas fa-share-nodes text-lg"></i>
        </button>

        {/* Wishlist Toggle */}
        <button 
          onClick={() => onToggleWishlist(product.id)}
          className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/90 backdrop-blur rounded-full shadow-lg flex items-center justify-center text-pink-500 active:scale-125 transition-all border border-pink-50"
        >
          <i className={`${wishlist.includes(product.id) ? 'fas' : 'far'} fa-heart text-xl`}></i>
        </button>
      </div>

      {/* Product Content */}
      <div className="px-6 py-8 max-w-2xl mx-auto">
        <div className="flex justify-between items-start mb-4">
          <div className="pr-4">
            <span className="text-pink-500 font-bold text-[10px] tracking-[0.2em] uppercase mb-1 block">{product.category}</span>
            <h1 className="text-3xl font-black text-gray-900 font-serif leading-none tracking-tight">{product.name}</h1>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-pink-600 tracking-tighter">₹{totalPrice}</div>
            <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Net Payable</div>
          </div>
        </div>

        <div className="h-0.5 w-12 bg-pink-100 mb-6 rounded-full"></div>

        <p className="text-gray-500 text-sm leading-relaxed mb-10 font-medium">
          {product.description}
        </p>

        <div className="space-y-10">
          {/* Weight Selection - Only if it's a weight-based product (Cake) */}
          {weights.length > 0 && (
            <div className="animate-fade-in-up delay-100">
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">Choose Weight</label>
              <div className="flex space-x-3">
                {weights.map((w) => (
                  <button
                    key={w}
                    onClick={() => setSelectedWeight(w)}
                    className={`flex-1 py-4 px-6 rounded-2xl border-2 transition-all font-bold text-sm ${
                      selectedWeight === w 
                        ? 'border-pink-500 bg-pink-50 text-pink-600 shadow-inner' 
                        : 'border-gray-100 text-gray-500 bg-white hover:border-pink-200'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="animate-fade-in-up delay-200">
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">How many?</label>
            <div className="flex items-center space-x-8 bg-pink-50/30 w-fit px-5 py-2.5 rounded-2xl border border-pink-100/50">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-pink-500 shadow-sm active:scale-75 transition-transform"
              >
                <i className="fas fa-minus text-xs"></i>
              </button>
              <span className="font-black text-xl text-gray-800 min-w-[30px] text-center">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-pink-500 shadow-sm active:scale-75 transition-transform"
              >
                <i className="fas fa-plus text-xs"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-pink-50 p-5 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
        <div className="max-w-xl mx-auto flex items-center space-x-6">
          <div className="flex-1">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total Price</div>
            <div className="text-2xl font-black text-gray-900 tracking-tight">₹{totalPrice}</div>
          </div>
          <button 
            onClick={handleBuyNow}
            className="flex-[2] cake-pink text-white py-4 px-8 rounded-2xl font-black shadow-xl shadow-pink-200 active:scale-[0.97] transition-all flex items-center justify-center space-x-3"
          >
            <span className="text-lg">Buy Now</span>
            <i className="fas fa-arrow-right text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
