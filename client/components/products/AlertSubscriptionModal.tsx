
import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';

interface AlertSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (alerts: { price: boolean; stock: boolean }) => void;
  productTitle: string;
  initialPriceAlert: boolean; // New prop
  initialStockAlert: boolean; // New prop
}

const AlertSubscriptionModal: React.FC<AlertSubscriptionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  productTitle,
  initialPriceAlert, // Destructure new prop
  initialStockAlert, // Destructure new prop
}) => {
  const [priceAlert, setPriceAlert] = useState(initialPriceAlert);
  const [stockAlert, setStockAlert] = useState(initialStockAlert);

  // Use useEffect to update internal state when modal opens or initial props change
  useEffect(() => {
    if (isOpen) {
      setPriceAlert(initialPriceAlert);
      setStockAlert(initialStockAlert);
    }
  }, [isOpen, initialPriceAlert, initialStockAlert]);

  const handleSave = () => {
    onSave({ price: priceAlert, stock: stockAlert });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Subscribe to alerts for ${productTitle}`}>
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="priceAlert"
            checked={priceAlert}
            onChange={(e) => setPriceAlert(e.target.checked)}
            className="h-4 w-4 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
          />
          <label htmlFor="priceAlert" className="ml-2 block text-sm text-gray-900">
            Price Alert
          </label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="stockAlert"
            checked={stockAlert}
            onChange={(e) => setStockAlert(e.target.checked)}
            className="h-4 w-4 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
          />
          <label htmlFor="stockAlert" className="ml-2 block text-sm text-gray-900">
            Stock Alert
          </label>
        </div>
      </div>
      <div className="flex justify-end space-x-2 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 text-sm font-medium text-white bg-brand-red rounded-md hover:bg-brand-red-hover cursor-pointer"
        >
          Save
        </button>
      </div>
    </Modal>
  );
};

export default AlertSubscriptionModal;
