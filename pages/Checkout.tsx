
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CustomerDetails, OrderItem } from '../types';

interface CheckoutProps {
  setLastOrder: (order: { item: OrderItem; customer: CustomerDetails }) => void;
}

const Checkout: React.FC<CheckoutProps> = ({ setLastOrder }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const item = location.state as OrderItem;

  const [form, setForm] = useState<CustomerDetails>({
    fullName: '',
    mobile: '',
    address: '',
    pincode: '',
    paymentMethod: 'COD'
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CustomerDetails, string>>>({});
  const [showSavePrompt, setShowSavePrompt] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('savedCustomerDetails');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setForm(prev => ({
          ...prev,
          fullName: parsed.fullName || '',
          mobile: parsed.mobile || '',
          address: parsed.address || '',
          pincode: parsed.pincode || ''
        }));
      } catch (e) {
        console.error('Failed to parse saved address', e);
      }
    }
  }, []);

  if (!item) {
    return (
      <div className="p-10 text-center">
        <p className="mb-4">No item selected.</p>
        <button onClick={() => navigate('/')} className="cake-pink text-white px-6 py-2 rounded-lg">Go Home</button>
      </div>
    );
  }

  const validate = () => {
    const newErrors: any = {};
    if (!form.fullName) newErrors.fullName = 'Full Name is required';
    if (!form.mobile) newErrors.mobile = 'Mobile number is required';
    else if (!/^\d{10}$/.test(form.mobile)) newErrors.mobile = 'Enter a valid 10-digit number';
    if (!form.address) newErrors.address = 'Full Address is required';
    if (!form.pincode) newErrors.pincode = 'Pincode is required';
    else if (!/^\d{6}$/.test(form.pincode)) newErrors.pincode = 'Enter a valid 6-digit pincode';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceed = () => {
    if (validate()) {
      const saved = localStorage.getItem('savedCustomerDetails');
      let shouldPrompt = true;
      
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (
            parsed.fullName === form.fullName &&
            parsed.mobile === form.mobile &&
            parsed.address === form.address &&
            parsed.pincode === form.pincode
          ) {
            shouldPrompt = false;
          }
        } catch (e) {}
      }

      if (shouldPrompt) {
        setShowSavePrompt(true);
      } else {
        executeProceed();
      }
    }
  };

  const executeProceed = (saveAddress: boolean = false) => {
    if (saveAddress) {
      const detailsToSave = {
        fullName: form.fullName,
        mobile: form.mobile,
        address: form.address,
        pincode: form.pincode
      };
      localStorage.setItem('savedCustomerDetails', JSON.stringify(detailsToSave));
    }
    setShowSavePrompt(false);
    setLastOrder({ item, customer: form });
    navigate('/payment');
  };

  return (
    <div className="p-4 max-w-lg mx-auto animate-in slide-in-from-right-10 duration-500">
      <header className="mb-8 mt-4">
        <h1 className="text-3xl font-bold text-gray-800 font-serif">Checkout</h1>
        <p className="text-gray-500 mt-2">Almost there! We just need some details to deliver your treats.</p>
      </header>

      {/* Order Summary Card */}
      <div className="bg-pink-50/50 p-4 rounded-2xl border border-pink-100 mb-8 flex items-center space-x-4">
        <div className="w-16 h-16 rounded-xl bg-pink-100 flex items-center justify-center text-pink-500 text-2xl">
          <i className="fas fa-shopping-basket"></i>
        </div>
        <div className="flex-grow">
          <h3 className="font-bold text-gray-800">{item.name}</h3>
          <p className="text-xs text-gray-500">{item.weight} x {item.quantity}</p>
        </div>
        <div className="text-lg font-bold text-pink-600">₹{item.totalPrice}</div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
          <input 
            type="text" 
            placeholder="e.g. Rahul Sharma"
            className={`w-full p-4 bg-white text-gray-900 rounded-xl border-2 transition-all focus:border-pink-500 outline-none ${errors.fullName ? 'border-red-300' : 'border-gray-100'}`}
            value={form.fullName}
            onChange={(e) => setForm({...form, fullName: e.target.value})}
          />
          {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Mobile Number</label>
          <input 
            type="tel" 
            placeholder="10 digit number"
            className={`w-full p-4 bg-white text-gray-900 rounded-xl border-2 transition-all focus:border-pink-500 outline-none ${errors.mobile ? 'border-red-300' : 'border-gray-100'}`}
            value={form.mobile}
            onChange={(e) => setForm({...form, mobile: e.target.value})}
          />
          {errors.mobile && <p className="text-xs text-red-500 mt-1">{errors.mobile}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Full Delivery Address</label>
          <textarea 
            rows={3}
            placeholder="House no, Street, Landmark"
            className={`w-full p-4 bg-white text-gray-900 rounded-xl border-2 transition-all focus:border-pink-500 outline-none resize-none ${errors.address ? 'border-red-300' : 'border-gray-100'}`}
            value={form.address}
            onChange={(e) => setForm({...form, address: e.target.value})}
          />
          {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Pincode</label>
          <input 
            type="text" 
            maxLength={6}
            placeholder="6-digit pincode"
            className={`w-full p-4 bg-white text-gray-900 rounded-xl border-2 transition-all focus:border-pink-500 outline-none ${errors.pincode ? 'border-red-300' : 'border-gray-100'}`}
            value={form.pincode}
            onChange={(e) => setForm({...form, pincode: e.target.value.replace(/\D/g, '')})}
          />
          {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3">Payment Method</label>
          <div className="space-y-3">
            {[
              { id: 'COD', label: 'Cash on Delivery', icon: 'fa-money-bill-wave' },
              { id: 'UPI', label: 'Pay via UPI', icon: 'fa-qrcode' }
            ].map(method => (
              <label 
                key={method.id}
                className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  form.paymentMethod === method.id ? 'border-pink-500 bg-pink-50 shadow-sm' : 'border-gray-100'
                }`}
              >
                <input 
                  type="radio" 
                  name="payment" 
                  className="hidden" 
                  checked={form.paymentMethod === method.id}
                  onChange={() => setForm({...form, paymentMethod: method.id as 'COD' | 'UPI'})}
                />
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 ${form.paymentMethod === method.id ? 'border-pink-500' : 'border-gray-300'}`}>
                  {form.paymentMethod === method.id && <div className="w-3 h-3 bg-pink-500 rounded-full"></div>}
                </div>
                <i className={`fas ${method.icon} text-gray-400 mr-3`}></i>
                <span className={`font-semibold ${form.paymentMethod === method.id ? 'text-pink-600' : 'text-gray-600'}`}>
                  {method.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <button 
          onClick={handleProceed}
          className="w-full cake-pink text-white py-5 rounded-2xl font-bold shadow-lg shadow-pink-200 active:scale-[0.98] transition-all mt-8"
        >
          Proceed to Order
        </button>
      </div>

      {/* Save Address Prompt Modal */}
      {showSavePrompt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-pink-50 text-pink-500 rounded-full flex items-center justify-center mb-6 mx-auto text-2xl">
              <i className="fas fa-map-marker-alt"></i>
            </div>
            <h3 className="text-2xl font-bold text-center text-gray-800 mb-2 font-serif">Save Details?</h3>
            <p className="text-center text-gray-500 text-sm mb-8">
              Would you like to save this delivery address and contact info for faster checkout next time?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => executeProceed(false)}
                className="flex-1 py-3.5 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors active:scale-95"
              >
                No, Thanks
              </button>
              <button
                onClick={() => executeProceed(true)}
                className="flex-1 py-3.5 rounded-xl font-bold text-white cake-pink hover:bg-pink-500 transition-colors shadow-lg shadow-pink-200 active:scale-95"
              >
                Yes, Save It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
