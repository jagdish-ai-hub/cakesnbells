
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '../types';
import { PRODUCTS as DEFAULT_PRODUCTS, DEFAULT_SECTIONS } from '../constants';

interface ProductContextType {
  products: Product[];
  sections: string[];
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  addSection: (name: string) => void;
  deleteSection: (name: string) => void;
  restoreData: (products: Product[], sections: string[]) => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load Products
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('shop_products');
      return saved ? JSON.parse(saved) : DEFAULT_PRODUCTS;
    } catch (e) {
      return DEFAULT_PRODUCTS;
    }
  });

  // Load Sections
  const [sections, setSections] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('shop_sections');
      return saved ? JSON.parse(saved) : DEFAULT_SECTIONS;
    } catch (e) {
      return DEFAULT_SECTIONS;
    }
  });

  useEffect(() => {
    localStorage.setItem('shop_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('shop_sections', JSON.stringify(sections));
  }, [sections]);

  const addProduct = (product: Product) => {
    setProducts(prev => [...prev, product]);
  };

  const updateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const addSection = (name: string) => {
    if (!sections.includes(name)) {
      setSections(prev => [...prev, name]);
    }
  };

  const deleteSection = (name: string) => {
    setSections(prev => prev.filter(s => s !== name));
    // Optional: Also remove this section tag from all products? 
    // For now, we keep the tag on products but it won't show on home page if section is gone.
  };

  const restoreData = (newProducts: Product[], newSections: string[]) => {
    setProducts(newProducts);
    setSections(newSections);
  };

  return (
    <ProductContext.Provider value={{ 
      products, 
      sections,
      addProduct, 
      updateProduct, 
      deleteProduct,
      addSection,
      deleteSection,
      restoreData
    }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
