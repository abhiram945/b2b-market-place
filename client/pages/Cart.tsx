
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../redux/store';
import { removeFromCart, updateQuantity, clearCart, syncCart } from '../redux/slices/cartSlice';
import { Trash2 as TrashIcon, ShoppingCart } from '../components/icons';
import { CartItem } from '../types';
import { createOrder } from '../redux/slices/orderSlice';
import { useAlert } from '../contexts/AlertContext';

const Cart: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { items: cartItems, syncing: isCartSyncing } = useSelector((state: RootState) => state.cart);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [draftQuantities, setDraftQuantities] = useState<Record<string, string>>({});
  const [quantityErrors, setQuantityErrors] = useState<Record<string, string>>({});
  const { showAlert } = useAlert();

  useEffect(() => {
    const nextDrafts: Record<string, string> = {};
    cartItems.forEach((item) => {
      nextDrafts[item._id] = String(item.quantity);
    });
    setDraftQuantities(nextDrafts);
  }, [cartItems]);

  const handleRemove = async (id: string) => {
    try {
      await dispatch(removeFromCart(id)).unwrap();
    } catch (err: any) {
      showAlert({
        variant: 'error',
        title: 'cart update failed',
        message: err || 'failed to remove item',
      });
    }
  };

  const handleCheckout = async () => {
    const itemsToOrder = cartItems.filter(item => item.quantity > 0);
    if (itemsToOrder.length === 0) {
      showAlert({
        variant: 'error',
        title: 'cart check failed',
        message: 'your cart is empty or all items have a quantity of zero.',
      });
      return;
    }

    setIsPlacingOrder(true);
    try {
      await dispatch(syncCart(itemsToOrder)).unwrap();
      await dispatch(createOrder({
        items: itemsToOrder.map(item => ({
          productId: item._id,
          quantity: item.quantity,
        })),
      })).unwrap();

      showAlert({
        variant: 'success',
        title: 'order placed',
        message: 'Order was placed successfully. An invoice will be emailed to you',
      });
      dispatch(clearCart());
      navigate('/orders');
    } catch (err: any) {
      showAlert({
        variant: 'error',
        title: 'order failed',
        message: err || 'failed to place order',
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const getDraftQuantityInput = (item: CartItem) => {
    const draft = draftQuantities[item._id];
    return draft !== undefined ? draft : String(item.quantity);
  };

  const getDisplayedQuantity = (item: CartItem) => {
    const draft = getDraftQuantityInput(item);
    const parsed = parseInt(draft, 10);
    return Number.isNaN(parsed) ? item.quantity : parsed;
  };

  const handleQuantityChange = (item: CartItem, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setDraftQuantities((prev) => ({ ...prev, [item._id]: '' }));
      setQuantityErrors((prev) => ({ ...prev, [item._id]: '' }));
      return;
    }

    const numValue = parseInt(value, 10);
    setDraftQuantities((prev) => ({ ...prev, [item._id]: value }));

    if (numValue < item.minOrderQty) {
      setQuantityErrors((prev) => ({ ...prev, [item._id]: `Min order is ${item.minOrderQty}` }));
    } else if (numValue > item.maxOrderQty) {
      setQuantityErrors((prev) => ({ ...prev, [item._id]: `Max order is ${item.maxOrderQty}` }));
    } else {
      setQuantityErrors((prev) => ({ ...prev, [item._id]: '' }));
    }
  };

  const commitQuantity = async (item: CartItem) => {
    const draft = getDraftQuantityInput(item);
    const parsed = parseInt(draft, 10);
    const quantity = Number.isNaN(parsed) ? NaN : parsed;
    const fallbackValue = isNaN(quantity) || quantity < item.minOrderQty ? item.minOrderQty : quantity;

    if (isNaN(quantity) || quantity < item.minOrderQty) {
      setDraftQuantities((prev) => ({ ...prev, [item._id]: String(fallbackValue) }));
      setQuantityErrors((prev) => ({ ...prev, [item._id]: '' }));
    }

    if (fallbackValue !== item.quantity) {
      try {
        await dispatch(updateQuantity({ id: item._id, quantity: fallbackValue })).unwrap();
      } catch (err: any) {
        showAlert({
          variant: 'error',
          title: 'cart update failed',
          message: err || 'failed to update quantity',
        });
      }
    }
  };

  const handleQuantityBlur = async (item: CartItem) => {
    await commitQuantity(item);
  };

  const handleQuantityKeyDown = async (item: CartItem, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await commitQuantity(item);
    }
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * getDisplayedQuantity(item), 0);

  return (
    <div className="max-w-[90%] mx-auto py-8">
      <div className="flex items-center gap-4 mb-8">
        <ShoppingCart className="w-10 h-10 text-brand-red" />
        <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight italic">
          My <span className="text-brand-red">Cart</span>
        </h1>
      </div>

      <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12">
        {isCartSyncing && (
          <div className="col-span-12 mb-4">
            <div className="bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg">
              Syncing cart changes...
            </div>
          </div>
        )}
        <section className={cartItems.length>0 ? "col-span-8":"col-span-12"}>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {cartItems.length > 0 ? (
              <ul role="list" className="divide-y divide-gray-100">
                {cartItems.map(item => (
                  <li key={item._id} className="flex py-8 px-6 hover:bg-gray-50/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-black text-brand-red uppercase tracking-widest">{item.brand}</span>
                          <h4 className="text-lg font-bold text-gray-900 uppercase tracking-tight truncate">
                            <Link to={`/products/${item._id}`} className="hover:text-brand-red transition-colors">
                              {item.title}
                            </Link>
                          </h4>
                          <p className="mt-1 text-xs font-bold text-gray-400 uppercase tracking-wider">{item.category}</p>
                        </div>
                        <div className="ml-4 shrink-0">
                          <button
                            onClick={() => handleRemove(item._id)}
                            type="button"
                            disabled={isCartSyncing}
                            className="p-3 text-gray-400 bg-red-500 rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Remove Entity"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-6 flex items-end justify-between">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-1">Unit Value</span>
                          <p className="text-2xl font-black text-gray-900 tracking-tighter">${item.price.toFixed(2)}</p>
                        </div>
                        <div className="flex flex-col items-center">
                          <label htmlFor={`quantity-${item._id}`} className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Vol.</label>
                          <input
                            id={`quantity-${item._id}`}
                            type="number"
                            value={getDraftQuantityInput(item)}
                            onChange={(e) => handleQuantityChange(item, e)}
                            onBlur={() => handleQuantityBlur(item)}
                            onKeyDown={(e) => handleQuantityKeyDown(item, e)}
                            min={item.minOrderQty}
                            max={item.maxOrderQty}
                            className="w-16 h-10 border-2 border-gray-100 rounded-lg text-center text-sm font-black text-gray-900 outline-none focus:border-brand-red focus:ring-4 focus:ring-red-500/5 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            disabled={isCartSyncing}
                          />
                          {quantityErrors[item._id] && <p className="text-red-600 text-[8px] font-bold mt-1 uppercase whitespace-nowrap">{quantityErrors[item._id]}</p>}
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-1">Line Subtotal</span>
                          <p className="text-2xl font-black text-brand-red tracking-tighter">${(item.price * getDisplayedQuantity(item)).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-24 px-6">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShoppingCart className="w-10 h-10 text-gray-300" />
                </div>
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight italic">Your cart is empty</h2>
                <p className="mt-2 text-sm text-gray-500 font-medium uppercase tracking-widest">No products were added into the cart.</p>
                <div className="mt-10">
                  <Link to="/products" className="btn-red px-10 py-4 rounded-none text-xs font-black uppercase italic tracking-widest shadow-2xl">
                    Browse Products
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Order summary */}
        {cartItems.length > 0 && (
          <section className="mt-12 lg:col-span-4 lg:mt-0">
            <div className="bg-black rounded-2xl p-8 shadow-xl border border-zinc-900 text-white">
              <h2 className="text-xl font-black uppercase tracking-tight italic mb-8 border-b border-zinc-800 pb-4">
                Transaction <span className="text-brand-red">Summary</span>
              </h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Gross Value</span>
                  <span className="text-lg font-bold font-mono tracking-tighter">${subtotal.toFixed(2)}</span>
                </div>
                <div className="pt-6 border-t border-zinc-800 flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-[0.3em]">Net Investment</span>
                  <span className="text-4xl font-black text-brand-red tracking-tighter italic">${subtotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-10 space-y-4">
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={isPlacingOrder || isCartSyncing}
                  className="w-full bg-brand-red hover:bg-brand-red-hover cursor-pointer text-white font-black text-md tracking-[0.2em] py-5 rounded-none transition-all disabled:opacity-50 "
                >
                  {isPlacingOrder ? 'Placing your order...' : isCartSyncing ? 'Syncing cart...' : 'Place Order'}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Cart;
