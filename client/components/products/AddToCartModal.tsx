import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../redux/slices/cartSlice';
import { Product } from '../../types';
import Modal from '../common/Modal';
import { useAlert } from '../../contexts/AlertContext';

interface AddToCartModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

const AddToCartModal: React.FC<AddToCartModalProps> = ({ product, isOpen, onClose }) => {
  const dispatch = useDispatch();
  const [quantity, setQuantity] = useState(product.minOrderQty);
  const [error, setError] = useState('');
  const { showAlert } = useAlert();

  useEffect(() => {
    if (isOpen) {
        setQuantity(product.minOrderQty);
        setError('');
    }
  }, [isOpen, product]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valueStr = e.target.value;
    if (valueStr === '') {
        setQuantity(NaN);
        setError('');
        return;
    }
    const value = parseInt(valueStr, 10);
    setQuantity(value);
    
    if (isNaN(value)) {
        setError('Please enter a valid number.');
    } else if (value < product.minOrderQty) {
      setError(`Minimum order quantity is ${product.minOrderQty}`);
    } else if (value > product.maxOrderQty) {
      setError(`Maximum order quantity is ${product.maxOrderQty}`);
    } else {
      setError('');
    }
  };
  
  const handleAddToCart = () => {
    if (!error && !isNaN(quantity)) {
      dispatch(addToCart({ product, quantity }));
      showAlert({
        variant: 'success',
        title: 'added to cart',
        items: [{ field: product.title, message: `${quantity} unit(s) added to your cart.` }],
      });
      onClose();
      return;
    }

    showAlert({
      variant: 'error',
      title: 'cannot add to cart',
      items: [{ field: 'Quantity', message: error || 'please enter a valid quantity' }],
    });
  };

  if (!isOpen) return null;

  return (
    <Modal 
      isOpen={isOpen}
      onClose={onClose}
      title={`Add ${product.title} to Cart`}
    >
        <div className="space-y-4">
            <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                    Quantity
                </label>
                <input
                    type="number"
                    id="quantity"
                    value={isNaN(quantity) ? '' : quantity}
                    onChange={handleQuantityChange}
                    min={product.minOrderQty}
                    max={product.maxOrderQty}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Min: {product.minOrderQty}, Max: {product.maxOrderQty}
                </p>
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-200 space-x-2">
                <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300:bg-gray-500">
                    Cancel
                </button>
                <button
                    onClick={handleAddToCart}
                    disabled={!!error || isNaN(quantity)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400:bg-blue-800"
                >
                    Add to Cart
                </button>
            </div>
        </div>
    </Modal>
  );
};

export default AddToCartModal;
