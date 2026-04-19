
import React, { useState } from 'react';
import { useProducts } from '../../hooks/useProducts';
import ProductTableRow from '../../components/products/ProductTableRow';
import ProductFilters from '../../components/products/ProductFilters';
import ProductDetailsModal from '../../components/products/ProductDetailsModal';
import EditProductModal from '../../components/products/EditProductModal';
import ProductSkeleton from '../../components/products/ProductSkeleton';
import { Product } from '../../types';
import { useAuth } from '../../hooks/useAuth';

const ProductsList: React.FC = () => {
  const { activeRole } = useAuth();
  const { 
    products, 
    loading, 
    error, 
    pageNum, 
    pages, 
    currentFilters,
    setPage, 
    updateFilters
  } = useProducts();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailsModalOpen(true);
  };

  const handleEditClick = (product: Product) => {
    setSelectedProductForEdit(product);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedProductForEdit(null);
  };

  const Th = ({ label, className = "" }: { label: string, className?: string }) => (
    <th className={`px-2 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 italic text-center ${className}`}>
        {label}
    </th>
  );

  return (
    <div className="bg-zinc-50 min-h-[calc(100vh-64px)]">
      {/* Sticky Filter Section */}
      <div className="bg-white border-b border-zinc-200 z-20">
        <ProductFilters 
          filters={currentFilters} 
          setFilters={updateFilters} 
          restoreFilters={updateFilters} 
        />
      </div>

      <div className="w-full">
        <div className="min-w-full inline-block align-middle">
          <table className="w-full border-collapse min-w-300">
          <thead className="sticky top-0 z-10 bg-zinc-900 shadow-xl">
            <tr>
              <th className="px-6 py-3 text-left">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-600 italic">Product</span>
              </th>
              <Th label="Brand" />
              <Th label="Category" />
              <Th label="Location" />
              <Th label="Condition" />
              <Th label="Price" />
              <Th label="MOQ"/>
              <Th label="MXQ"/>
              <Th label="Stock" />
              <Th label="ETA" className="hidden lg:table-cell" />
              <th className="px-6 py-3 text-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-600 italic">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-zinc-100">
            {loading ? (
                [...Array(10)].map((_, i) => <ProductSkeleton key={i} />)
            ) : error ? (
                <tr>
                    <td colSpan={11} className="py-20 px-6">
                        <div className="bg-red-50 border-l-4 border-red-600 p-6 text-center max-w-2xl mx-auto">
                            <p className="text-red-600 font-black uppercase tracking-widest italic">{error}</p>
                        </div>
                    </td>
                </tr>
            ) : products.length > 0 ? (
              products.map((product) => (
              <ProductTableRow 
                key={product._id} 
                product={product} 
                onProductClick={handleProductClick} 
                onEditClick={handleEditClick}
              />
              ))
            ) : (
                <tr>
                    <td colSpan={11} className="px-6 py-12">
                        <div className="w-full py-32 text-center bg-white border border-zinc-200 rounded-2xl shadow-sm">
                            <p className="text-zinc-400 font-black uppercase tracking-widest text-sm italic">NO COMPATIBLE STOCK DETECTED</p>
                            <p className="text-zinc-300 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Check filters or contact support for manual sourcing</p>
                        </div>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="flex justify-center py-6 bg-white border-t border-zinc-200">
          <div className="flex justify-center space-x-2">
            {[...Array(pages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => setPage(index + 1)}
                className={`w-10 h-10 rounded font-bold text-sm transition-all cursor-pointer ${pageNum === index + 1 ? 'bg-zinc-900 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-red'}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      <ProductDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} product={selectedProduct} />
      {isEditModalOpen && selectedProductForEdit && (
        <EditProductModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          product={selectedProductForEdit}
          activeRole={activeRole}
          onProductUpdated={() => undefined}
        />
      )}
    </div>
  );
};

export default ProductsList;
