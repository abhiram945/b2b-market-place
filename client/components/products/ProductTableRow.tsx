import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Product } from '../../types';
import { addToCart } from '../../redux/slices/cartSlice';
import { toggleSubscription } from '../../redux/slices/notificationSlice';
import { RootState, AppDispatch } from '../../redux/store';
import { ShoppingCart, Bell } from '../icons';
import { useAuth } from '../../hooks/useAuth';
import AlertSubscriptionModal from './AlertSubscriptionModal';

interface ProductTableRowProps {
  product: Product;
  onProductClick: (product: Product) => void;
  onEditClick: (product: Product) => void;
}

const ProductTableRow: React.FC<ProductTableRowProps> = ({ product, onProductClick, onEditClick }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { role, isAuthenticated } = useAuth();
  const { items: cartItems } = useSelector((state: RootState) => state.cart);
  const { subscriptions } = useSelector((state: RootState) => state.notifications);

  const [quantity, setQuantity] = useState(product.minOrderQty);
  const [error, setError] = useState('');
  const [isAlertModalOpen, setAlertModalOpen] = useState(false);

  const isInCart = cartItems.some(item => item._id === product._id);

  const initialPriceAlert = subscriptions.some(sub => sub.product === product._id && sub.type === 'price');
  const initialStockAlert = subscriptions.some(sub => sub.product === product._id && sub.type === 'stock');

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

  return (
    <>
      <tr className="bg-white border-b border-zinc-100 hover:bg-zinc-50 transition-colors group">
        <td 
          className="px-6 py-4 cursor-pointer"
          onClick={() => onProductClick(product)}
        >
          <div className="w-full max-w-[500px] overflow-x-auto whitespace-nowrap title-scrollbar">
            <span className="text-sm font-bold text-zinc-900 uppercase tracking-tight group-hover:text-red-600 transition-colors">
                {product.title}
            </span>
          </div>
        </td>
        <td className="px-2 py-4 text-center">
            <span className="text-[11px] font-black text-red-600 uppercase italic tracking-tighter">{product.brand}</span>
        </td>
        <td className="px-2 py-4 text-center">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">{product.category}</span>
        </td>
        <td className="px-2 py-4 text-center">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">{product.location}</span>
        </td>
        <td className="px-2 py-4 text-center">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">{product.condition}</span>
        </td>
        <td className="px-2 py-4 text-center">
            <span className="text-sm font-black text-zinc-900 tracking-tighter">${product.price.toFixed(2)}</span>
        </td>
        <td className="px-2 py-4 text-center">
            <span className="text-[10px] font-bold text-zinc-500 tracking-tighter">{product.minOrderQty}</span>
        </td>
        <td className="px-2 py-4 text-center">
            <span className="text-[10px] font-bold text-zinc-500 tracking-tighter">{product.maxOrderQty}</span>
        </td>
        <td className="px-2 py-4 text-center">
            <span className={`text-[11px] font-black ${product.stockQty < product.minOrderQty * 2 ? 'text-red-600' : 'text-zinc-900'}`}>
              {product.stockQty}
            </span>
        </td>
        <td className="px-2 py-4 text-center hidden lg:table-cell">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{product.eta || '-'}</span>
        </td>
        <td className="px-6 py-4 text-center">
            <div className="flex items-center justify-center gap-3">
                {(role === 'buyer' || !isAuthenticated) && (
                <>
                    <button
                    onClick={() => setAlertModalOpen(true)}
                    className={`p-1.5 transition-colors ${initialPriceAlert || initialStockAlert ? 'text-red-600' : 'text-zinc-300 hover:text-red-600'}`}
                    >
                    <Bell className="w-5 h-5 fill-current" />
                    </button>

                    <div className="relative">
                    <input
                        type="number"
                        value={isNaN(quantity) ? '' : quantity}
                        onChange={handleQuantityChange}
                        className="w-12 h-8 border border-zinc-200 bg-white text-center text-[11px] font-black text-zinc-900 rounded-none outline-none focus:border-red-600 focus:ring-0 transition-all"
                        disabled={isInCart}
                    />
                    </div>

                    <button
                    onClick={() => !isInCart && dispatch(addToCart({ product, quantity }))}
                    disabled={isInCart || !!error || isNaN(quantity)}
                    className={`h-9 px-6 rounded-none font-black text-[10px] tracking-widest transition-all active:scale-95 shadow-lg min-w-[120px] justify-center flex items-center gap-2 cursor-pointer ${
                        isInCart 
                        ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200' 
                        : 'bg-zinc-900 text-white hover:bg-red-600'
                    }`}
                    >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    {isInCart ? 'In cart' : 'Add to cart'}
                    </button>
                </>
                )}
                
                {role === 'vendor' && (
                <button 
                    onClick={() => onEditClick(product)} 
                    className="h-9 px-6 bg-zinc-900 hover:bg-red-600 text-white rounded-none font-black text-[10px] uppercase tracking-widest transition-colors min-w-[100px]"
                >
                    EDIT STOCK
                </button>
                )}
            </div>
        </td>
      </tr>

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

export default ProductTableRow;
