import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Product } from '../../types';
import { addToCart } from '../../redux/slices/cartSlice';
import { toggleSubscription } from '../../redux/slices/notificationSlice';
import { RootState, AppDispatch } from '../../redux/store';
import { ShoppingCart, Edit, Bell } from '../icons';
import { useAuth } from '../../hooks/useAuth';
import AlertSubscriptionModal from './AlertSubscriptionModal';

interface ProductCardProps {
  product: Product;
  onProductClick: (product: Product) => void;
  onEditClick: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onProductClick, onEditClick }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { role, isAuthenticated } = useAuth();
  const { items: cartItems } = useSelector((state: RootState) => state.cart);
  const { subscriptions } = useSelector((state: RootState) => state.notifications);

  const [quantity, setQuantity] = useState(product.minOrderQty);
  const [error, setError] = useState('');
  const [isAlertModalOpen, setAlertModalOpen] = useState(false);

  const isInCart = cartItems.some(item => item._id === product._id);

  const initialPriceAlert = subscriptions.some(sub => sub.productId === product._id && sub.type === 'price');
  const initialStockAlert = subscriptions.some(sub => sub.productId === product._id && sub.type === 'stock');

  useEffect(() => {
    if (isInCart) {
      const cartItem = cartItems.find(item => item._id === product._id);
      if(cartItem) setQuantity(cartItem.quantity);
    } else {
      setQuantity(product.minOrderQty);
    }
  }, [isInCart, cartItems, product]);
  
  const handleSaveSubscription = (alerts: { price: boolean; stock: boolean }) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (alerts.price !== initialPriceAlert) dispatch(toggleSubscription({ productId: product._id, type: 'price', productTitle: product.title }));
    if (alerts.stock !== initialStockAlert) dispatch(toggleSubscription({ productId: product._id, type: 'stock', productTitle: product.title }));
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valueStr = e.target.value;
    if (valueStr === '') { setQuantity(NaN); setError(''); return; }
    const value = parseInt(valueStr, 10);
    setQuantity(value);
    if (isNaN(value)) setError('Invalid');
    else if (value < product.minOrderQty) setError(`Min ${product.minOrderQty}`);
    else if (value > product.maxOrderQty) setError(`Max ${product.maxOrderQty}`);
    else setError('');
  };

  const MetaColumn = ({ val, width, colorClass = "text-gray-900" }: { val: any, width: string, colorClass?: string }) => (
    <div className={`${width} flex items-center justify-center shrink-0 text-center`}>
        <span className={`text-[11px] font-bold uppercase truncate px-1 ${colorClass}`}>{val || '-'}</span>
    </div>
  );

  return (
    <>
      <div className="bg-white border-b border-gray-100 hover:bg-gray-50 flex items-center h-14 w-full transition-colors group relative overflow-hidden">
        
        {/* 1. Scrollable Title - Flex-1 means it grows to fill space, but min-w-0 allows it to shrink below its content size */}
        <div 
          className="flex-1 min-w-0 h-full flex items-center cursor-pointer px-4 relative z-0"
          onClick={() => onProductClick(product)}
        >
          <div className="title-scrollbar overflow-x-auto whitespace-nowrap scroll-smooth">
            <span className="text-sm font-bold text-gray-900 uppercase tracking-tight group-hover:text-brand-red transition-colors pr-10">
                {product.title}
            </span>
          </div>
        </div>

        {/* 2. Static Metadata Section - Locked to the right with a subtle shadow separator */}
        <div className="flex items-center h-full bg-white group-hover:bg-gray-50 shrink-0 relative z-10 shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)] pl-2">
          <MetaColumn val={product.brand} width="w-24" colorClass="text-brand-red font-black" />
          <MetaColumn val={product.category} width="w-28" colorClass="text-gray-500" />
          <MetaColumn val={product.location} width="w-24" colorClass="text-gray-500" />
          <MetaColumn val={product.condition} width="w-20" colorClass="text-gray-400" />
          
          <div className="w-28 flex items-center justify-center shrink-0 border-l border-gray-50 h-8">
            <span className="text-sm font-black text-gray-900 tracking-tighter">${product.price.toFixed(2)}</span>
          </div>

          <div className="w-24 flex items-center justify-center shrink-0 border-l border-gray-50 h-8">
            <span className="text-[10px] font-bold text-gray-500">{product.minOrderQty}-{product.maxOrderQty}</span>
          </div>

          <div className="w-20 flex items-center justify-center shrink-0 border-l border-gray-50 h-8">
            <span className={`text-[11px] font-black ${product.stockQty < product.minOrderQty * 2 ? 'text-red-600' : 'text-gray-900'}`}>
              {product.stockQty}
            </span>
          </div>

          <div className="w-20 flex items-center justify-center shrink-0 border-l border-gray-50 h-8 lg:flex">
            <span className="text-[10px] font-bold text-gray-400 uppercase">{product.eta || '-'}</span>
          </div>

          {/* 3. Actions Strip - Fixed Width to prevent jumping */}
          <div className="flex items-center gap-3 px-6 shrink-0 border-l-2 border-gray-100 h-10 ml-2">
            {(role === 'buyer' || !isAuthenticated) && (
              <>
                <button
                  onClick={() => setAlertModalOpen(true)}
                  className={`p-1.5 transition-colors ${initialPriceAlert || initialStockAlert ? 'text-brand-red' : 'text-gray-300 hover:text-red-600'}`}
                >
                  <Bell className="w-5 h-5 fill-current" />
                </button>

                <div className="relative">
                  <input
                    type="number"
                    value={isNaN(quantity) ? '' : quantity}
                    onChange={handleQuantityChange}
                    className="w-12 h-8 border border-gray-200 bg-white text-center text-[11px] font-black text-gray-900 rounded-lg outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition-all"
                    disabled={isInCart}
                  />
                </div>

                <button
                  onClick={() => !isInCart && dispatch(addToCart({ product, quantity }))}
                  disabled={isInCart || !!error || isNaN(quantity)}
                  className={`h-9 px-6 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-md min-w-[120px] justify-center flex items-center gap-2 ${
                    isInCart 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                      : 'bg-black text-white hover:bg-brand-red'
                  }`}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  {isInCart ? 'IN CART' : 'ORDER'}
                </button>
              </>
            )}
            
            {role === 'vendor' && (
              <button 
                onClick={() => onEditClick(product)} 
                className="h-9 px-6 bg-black hover:bg-brand-red text-white rounded-lg font-black text-[10px] uppercase tracking-widest transition-colors min-w-[100px]"
              >
                EDIT STOCK
              </button>
            )}
          </div>
        </div>
      </div>

      <AlertSubscriptionModal
        isOpen={isAlertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        onSave={handleSaveSubscription}
        productTitle={product.title}
        initialPriceAlert={initialPriceAlert}
        initialStockAlert={initialStockAlert}
      />
    </>
  );
};

export default ProductCard;
