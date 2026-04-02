import React, { useState } from 'react';
import { useProducts } from '../context/ProductContext';
import { Product, PaymentTier, Category } from '../types';
import { Link } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import { useWebSocket } from '../context/WebSocketContext';

// Simple ID generator if uuid isn't available in environment
const generateId = () => Math.random().toString(36).substr(2, 9);

export default function AdminPage() {
  const { products, sections, addProduct, updateProduct, deleteProduct, addSection, deleteSection, restoreData } = useProducts();
  const { sendNotification } = useWebSocket();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // State for new section input
  const [newSectionName, setNewSectionName] = useState('');

  // Notification State
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationBody, setNotificationBody] = useState('');

  // AI Loading States
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  
  // Temporary state for the generated image to be downloaded
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const emptyProduct: Product = {
    id: '',
    name: '',
    category: 'Cake',
    sections: [],
    description: '',
    prices: { '0.5kg': 0, '1kg': 0 },
    images: [''],
    paymentTier: 'standard'
  };

  const [formData, setFormData] = useState<Product>(emptyProduct);

  // --- AI GENERATION LOGIC ---
  
  const generateDescription = async () => {
    if (!formData.name) {
      alert("Please enter a product name first.");
      return;
    }
    
    setIsGeneratingDesc(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write a short, appetizing, 2-sentence description for a ${formData.category} named '${formData.name}'. Make it sound premium and delicious. Do not use markdown.`,
      });
      
      const text = response.text;
      if (text) {
        setFormData(prev => ({ ...prev, description: text.trim() }));
      }
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert("Failed to generate description. Check network or API Key.");
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const generateImage = async () => {
    if (!formData.name) {
      alert("Please enter a product name first.");
      return;
    }

    setIsGeneratingImg(true);
    setGeneratedImage(null); // Clear previous result
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      // gemini-2.5-flash-image (Nano Banana)
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              // Prompt optimized for E-commerce Cake Shop
              text: `Professional e-commerce product photography of a delicious ${formData.name} ${formData.category}. The item should be perfectly centered in the frame. Studio lighting, appetizing texture, clean soft pastel background, high resolution, 4k.`
            }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1", // Square generates best results for grid layouts
          }
        }
      });

      let rawImageUrl = '';
      const parts = response.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData) {
            rawImageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (rawImageUrl) {
        setGeneratedImage(rawImageUrl);
      } else {
        alert("No image was generated.");
      }

    } catch (error) {
      console.error("AI Image Generation Error:", error);
      alert("Failed to generate image.");
    } finally {
      setIsGeneratingImg(false);
    }
  };


  // --- AUTHENTICATION LOGIC (HASHING) ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const msgBuffer = new TextEncoder().encode(passwordInput);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      const CORRECT_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';

      if (hashHex === CORRECT_HASH) {
        setIsAuthenticated(true);
        setLoginError('');
      } else {
        setLoginError('Incorrect password');
      }
    } catch (err) {
      console.warn("Crypto API not available");
      if (passwordInput === 'admin123') {
        setIsAuthenticated(true);
        setLoginError('');
      } else {
        setLoginError('Incorrect password');
      }
    }
  };

  // --- IMAGE LOGIC ---
  const processImageLink = (url: string) => {
    const driveRegex = /\/d\/([^/]+)/;
    const match = url.match(driveRegex);
    const idRegex = /id=([^&]+)/;
    const matchId = url.match(idRegex);

    let fileId = '';
    if (match && match[1]) fileId = match[1];
    else if (matchId && matchId[1]) fileId = matchId[1];

    if (fileId) return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    return url;
  };

  const handleAddImageField = () => {
    setFormData(prev => ({ ...prev, images: [...prev.images, ''] }));
  };

  const handleImageChange = (index: number, val: string) => {
    const newImages = [...formData.images];
    newImages[index] = processImageLink(val);
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const handleRemoveImageField = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, images: newImages.length ? newImages : [''] }));
  };

  // --- SECTION MANAGEMENT LOGIC ---
  const handleAddSection = () => {
    if (newSectionName.trim()) {
      addSection(newSectionName.trim());
      setNewSectionName('');
    }
  };

  const handleDeleteSection = (sectionName: string) => {
    if (window.confirm(`Delete collection "${sectionName}"?`)) {
      deleteSection(sectionName);
    }
  };

  // --- NOTIFICATION LOGIC ---
  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notificationTitle.trim() || !notificationBody.trim()) return;
    
    sendNotification(notificationTitle, notificationBody);
    alert('Notification broadcasted to all active users!');
    setNotificationTitle('');
    setNotificationBody('');
  };

  // --- CRUD LOGIC ---
  const handleEdit = (product: Product) => {
    setFormData(product);
    setIsEditing(true);
    setShowForm(true);
    setGeneratedImage(null);
    window.scrollTo(0, 0);
  };

  const handleExportData = () => {
    const data = { products, sections };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cakes-n-bells-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        
        if (data.products && Array.isArray(data.products) && data.sections && Array.isArray(data.sections)) {
          if (window.confirm(`Warning: This will overwrite your current products. Are you sure you want to restore ${data.products.length} products?`)) {
            restoreData(data.products, data.sections);
            alert("Data restored successfully!");
          }
        } else {
          alert("Invalid backup file format.");
        }
      } catch (error) {
        console.error("Import error:", error);
        alert("Failed to read the backup file.");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProduct(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const processedImages = formData.images.filter(img => img.trim() !== '');

    const productToSave = {
      ...formData,
      images: processedImages.length > 0 ? processedImages : ['https://placehold.co/600x600?text=No+Image']
    };

    if (isEditing) {
      updateProduct(productToSave);
    } else {
      addProduct({ ...productToSave, id: generateId() });
    }

    setShowForm(false);
    setIsEditing(false);
    setFormData(emptyProduct);
    setGeneratedImage(null);
  };

  const toggleProductSection = (section: string) => {
    if (formData.sections.includes(section)) {
      setFormData({ ...formData, sections: formData.sections.filter(s => s !== section) });
    } else {
      setFormData({ ...formData, sections: [...formData.sections, section] });
    }
  };

  // --- RENDER LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 animate-pop-in">
        <div className="bg-white p-8 rounded-3xl shadow-2xl border border-pink-100 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-lock text-pink-500 text-2xl"></i>
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-2 font-serif">Admin Access</h2>
          <p className="text-gray-400 text-sm mb-6">Enter password to manage store</p>
          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              placeholder="Enter Password"
              className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-pink-500 focus:bg-white transition-all text-center mb-4"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              autoFocus
            />
            {loginError && <p className="text-red-500 text-xs font-bold mb-4">{loginError}</p>}
            <button type="submit" className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all">
              Unlock Dashboard
            </button>
          </form>
          <Link to="/" className="block mt-6 text-gray-400 text-xs hover:text-pink-500">
            <i className="fas fa-arrow-left mr-1"></i> Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  // --- RENDER DASHBOARD ---
  return (
    <div className="p-4 max-w-4xl mx-auto animate-fade-in-up pb-20">
      <div className="flex justify-between items-center mb-8 mt-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 font-serif">Store Admin</h1>
          <p className="text-gray-500 text-sm">Manage your products inventory</p>
        </div>
        <div className="flex space-x-2">
            <button 
                onClick={() => {
                  setFormData(emptyProduct);
                  setIsEditing(false);
                  setShowForm(!showForm);
                  setGeneratedImage(null);
                }} 
                className="bg-pink-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-pink-200 active:scale-95 transition-all"
            >
                {showForm ? 'Cancel' : '+ Add Product'}
            </button>
        </div>
      </div>

      {!showForm && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-50 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4 font-serif">Manage Collections</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {sections.map(section => (
              <div key={section} className="flex items-center bg-gray-50 border border-gray-200 rounded-full pl-3 pr-1 py-1">
                <span className="text-xs font-bold text-gray-600 mr-2">{section}</span>
                <button 
                  onClick={() => handleDeleteSection(section)}
                  className="w-5 h-5 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200"
                >
                  <i className="fas fa-times text-[10px]"></i>
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="New Collection Name"
              value={newSectionName}
              onChange={e => setNewSectionName(e.target.value)}
              className="flex-grow p-2 bg-gray-50 rounded-lg border border-gray-200 text-sm outline-none focus:border-pink-400"
            />
            <button 
              onClick={handleAddSection}
              disabled={!newSectionName.trim()}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold disabled:opacity-50"
            >
              Add Collection
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-pink-100 mb-10 animate-pop-in">
          <h2 className="text-xl font-bold text-gray-800 mb-6 font-serif">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Product Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Category</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value as Category})}
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                >
                  <option value="Cake">Cake</option>
                  <option value="Confectionery">Confectionery</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Description</label>
                <button 
                  type="button" 
                  onClick={generateDescription}
                  disabled={isGeneratingDesc || !formData.name}
                  className="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-bold hover:bg-indigo-100 transition-colors flex items-center disabled:opacity-50"
                >
                  {isGeneratingDesc ? (
                    <><i className="fas fa-spinner fa-spin mr-1"></i> Writing...</>
                  ) : (
                    <><i className="fas fa-wand-magic-sparkles mr-1"></i> Auto-Write</>
                  )}
                </button>
              </div>
              <textarea 
                required
                rows={3}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-pink-500 outline-none resize-none"
                placeholder={isGeneratingDesc ? "AI is generating description..." : "Enter product description..."}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {formData.category === 'Cake' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Price (0.5kg)</label>
                    <input 
                      type="number" 
                      value={formData.prices['0.5kg'] || ''}
                      onChange={e => setFormData({...formData, prices: {...formData.prices, '0.5kg': Number(e.target.value)}})}
                      className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                      placeholder="₹"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Price (1kg)</label>
                    <input 
                      type="number" 
                      value={formData.prices['1kg'] || ''}
                      onChange={e => setFormData({...formData, prices: {...formData.prices, '1kg': Number(e.target.value)}})}
                      className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                      placeholder="₹"
                    />
                  </div>
                </>
              ) : (
                 <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Price (Piece)</label>
                    <input 
                      type="number" 
                      value={formData.prices['piece'] || ''}
                      onChange={e => setFormData({...formData, prices: {...formData.prices, 'piece': Number(e.target.value)}})}
                      className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                      placeholder="₹"
                    />
                  </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Payment Tier</label>
                <select 
                  value={formData.paymentTier}
                  onChange={e => setFormData({...formData, paymentTier: e.target.value as PaymentTier})}
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                >
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="luxury">Luxury</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Sections (Collections)</label>
              <div className="flex flex-wrap gap-2">
                {sections.map(section => (
                  <button
                    type="button"
                    key={section}
                    onClick={() => toggleProductSection(section)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                      formData.sections.includes(section)
                        ? 'bg-pink-500 text-white border-pink-500'
                        : 'bg-white text-gray-500 border-gray-200'
                    }`}
                  >
                    {section}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Product Images</label>
                <button 
                    type="button" 
                    onClick={generateImage}
                    disabled={isGeneratingImg || !formData.name}
                    className="text-[10px] bg-purple-50 text-purple-600 px-3 py-1 rounded-full font-bold hover:bg-purple-100 transition-colors flex items-center disabled:opacity-50"
                  >
                    {isGeneratingImg ? (
                      <><i className="fas fa-spinner fa-spin mr-1"></i> Designing...</>
                    ) : (
                      <><i className="fas fa-image mr-1"></i> Generate AI Photo</>
                    )}
                </button>
              </div>

              {/* GENERATED IMAGE DOWNLOAD SECTION */}
              {generatedImage && (
                <div className="mt-2 mb-6 p-4 bg-green-50 rounded-xl border border-green-200 animate-pop-in">
                    <h4 className="font-bold text-green-800 mb-3 text-sm flex items-center">
                    <i className="fas fa-check-circle mr-2"></i> Design Generated!
                    </h4>
                    
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <img src={generatedImage} alt="AI Generated" className="w-24 h-24 object-cover rounded-lg shadow-md bg-white border border-green-100" />
                        
                        <div className="flex-1">
                            <p className="text-[10px] text-green-700 font-bold mb-2 uppercase tracking-wider">Instructions for Vercel/Production:</p>
                            <ol className="text-xs text-gray-700 space-y-2 list-decimal list-inside font-medium bg-white/50 p-3 rounded-lg border border-green-100">
                                <li>
                                    <a 
                                        href={generatedImage} 
                                        download={`${formData.name.replace(/\s+/g, '-').toLowerCase()}-cake.png`} 
                                        className="text-pink-600 underline font-black hover:text-pink-700"
                                    >
                                        Click here to Download Image
                                    </a>
                                </li>
                                <li>Upload to <strong>Google Drive</strong> (or any host).</li>
                                <li>Copy the link (Ensure "Anyone with link" is ON).</li>
                                <li>Paste the link in the <strong>Image URL</strong> box below.</li>
                            </ol>
                        </div>
                    </div>
                </div>
              )}

              <div className="bg-blue-50 p-3 rounded-lg mb-4 text-xs text-blue-800 border border-blue-100">
                <strong>Tip:</strong> You can paste a Google Drive share link directly.
              </div>
              
              {formData.images.map((img, idx) => (
                <div key={idx} className="mb-4">
                  <div className="flex gap-2 mb-2">
                    <input 
                      type="text" 
                      value={img}
                      onChange={e => handleImageChange(idx, e.target.value)}
                      className="flex-grow p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-pink-500 outline-none"
                      placeholder="Image URL (Paste Drive Link)"
                    />
                    <button 
                      type="button" 
                      onClick={() => handleRemoveImageField(idx)}
                      className="p-3 text-red-400 hover:text-red-600 font-bold"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                  {/* Image Preview */}
                  {img && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 relative group">
                      <img 
                        src={img} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => e.currentTarget.src = 'https://placehold.co/100x100?text=Error'}
                      />
                      {img.startsWith('data:image') && (
                         <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <span className="text-[10px] bg-black/50 text-white px-1 rounded">Base64</span>
                         </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <button 
                type="button" 
                onClick={handleAddImageField}
                className="text-pink-500 text-xs font-bold uppercase tracking-wider hover:text-pink-600"
              >
                + Add Another Image
              </button>
            </div>

            <button type="submit" className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold shadow-lg active:scale-[0.98] transition-all">
              {isEditing ? 'Save Changes' : 'Create Product'}
            </button>
          </form>
        </div>
      )}

      {/* BROADCAST NOTIFICATION SECTION */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-50 mt-8 mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4 font-serif flex items-center">
          <i className="fas fa-bell text-pink-500 mr-2"></i> Broadcast Notification
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Send a real-time push notification to all users currently viewing the app.
        </p>
        <form onSubmit={handleSendNotification} className="space-y-4">
          <div>
            <input 
              type="text" 
              placeholder="Notification Title"
              value={notificationTitle}
              onChange={e => setNotificationTitle(e.target.value)}
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm outline-none focus:border-pink-400"
              required
            />
          </div>
          <div>
            <textarea 
              placeholder="Notification Message"
              value={notificationBody}
              onChange={e => setNotificationBody(e.target.value)}
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm outline-none focus:border-pink-400 resize-none"
              rows={2}
              required
            />
          </div>
          <button 
            type="submit"
            className="px-6 py-3 bg-pink-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-pink-200 hover:bg-pink-600 active:scale-95 transition-all flex items-center"
          >
            <i className="fas fa-paper-plane mr-2"></i> Send to All Users
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {products.map(product => (
          <div key={product.id} className="bg-white p-4 rounded-xl border border-pink-50 flex items-center space-x-4 shadow-sm hover:shadow-md transition-shadow">
            <img 
                src={product.images[0]} 
                alt={product.name} 
                className="w-16 h-16 rounded-lg object-cover bg-gray-100" 
                referrerPolicy="no-referrer"
                onError={(e) => e.currentTarget.src = 'https://placehold.co/100x100?text=No+Img'}
            />
            <div className="flex-grow">
              <h3 className="font-bold text-gray-800">{product.name}</h3>
              <p className="text-xs text-gray-500">{product.category} • {product.paymentTier}</p>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => handleEdit(product)}
                className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100"
              >
                <i className="fas fa-edit text-xs"></i>
              </button>
              <button 
                onClick={() => handleDelete(product.id)}
                className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100"
              >
                <i className="fas fa-trash text-xs"></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* DATA BACKUP & RESTORE SECTION */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-50 mt-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4 font-serif">Data Backup & Restore</h3>
        <p className="text-xs text-gray-500 mb-4">
          take a backup everytime u modify products or add new product
        </p>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={handleExportData}
            className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-100 flex items-center transition-colors"
          >
            <i className="fas fa-download mr-2"></i> Export Backup
          </button>
          
          <label className="px-4 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-bold hover:bg-green-100 flex items-center cursor-pointer transition-colors">
            <i className="fas fa-upload mr-2"></i> Import Backup
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              onChange={handleImportData}
            />
          </label>
        </div>
      </div>
    </div>
  );
}