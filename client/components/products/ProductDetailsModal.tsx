
import React from 'react';
import { X as XIcon, CheckCircle } from '../icons';
import { Product } from '../../types';

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ isOpen, onClose, product }) => {
  if (!isOpen || !product) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm"
      aria-labelledby="product-modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative bg-white border-2 border-zinc-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Strip */}
        <div className="bg-zinc-100 px-6 py-4 flex justify-between items-center border-b border-zinc-200">
            <h3 id="product-modal-title" className="text-xl font-black text-zinc-900 uppercase italic tracking-tighter">
                Product <span className="text-red-600">Manifest</span>
            </h3>
            <button
                onClick={onClose}
                className="text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                aria-label="Close modal"
            >
                <XIcon className="w-6 h-6" />
            </button>
        </div>

        <div className="p-8">
            <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-6">
                    <div>
                        <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] mb-1 italic">Product title</p>
                        <h2 className="text-3xl font-black text-zinc-900 uppercase italic leading-none tracking-tighter">
                            {product.title}
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-y border-zinc-100 py-6">
                        <div>
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Market Valuation</p>
                            <p className="text-2xl font-black text-zinc-900 italic tracking-tighter">
                                ${product.price.toFixed(2)}
                            </p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Manufacturer</p>
                            <p className="text-lg font-black text-red-600 uppercase italic tracking-tighter">
                                {product.brand}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-red-600"></div>
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Category:</span>
                            <span className="text-xs font-black text-zinc-900 uppercase tracking-widest italic">{product.category}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-zinc-300"></div>
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Deployment:</span>
                            <span className="text-xs font-black text-zinc-900 uppercase tracking-widest italic">{product.location}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-zinc-300"></div>
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Condition:</span>
                            <span className="text-xs font-black text-zinc-900 uppercase tracking-widest italic">{product.condition}</span>
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-64 bg-zinc-50 p-6 border-l-0 md:border-l border-zinc-100 space-y-6">
                    <div>
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-3">Inventory Status</p>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-black text-zinc-900 italic tracking-tighter leading-none">{product.stockQty}</span>
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Units</span>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-zinc-200">
                        <div>
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Thresholds</p>
                            <p className="text-xs font-bold text-zinc-600 uppercase tracking-tighter">
                                MIN: <span className="text-zinc-900 font-black">{product.minOrderQty}</span> / MAX: <span className="text-zinc-900 font-black">{product.maxOrderQty}</span>
                            </p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">ETA</p>
                            <p className="text-xs font-black text-red-600 uppercase italic tracking-widest">
                                {product.eta || 'IMMEDIATE'}
                            </p>
                        </div>
                    </div>

                    <div className="pt-4">
                        <div className="flex items-center gap-2 bg-zinc-900 px-3 py-2">
                             <CheckCircle className="w-4 h-4 text-red-600" />
                             <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Verified</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsModal;


