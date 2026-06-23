import React, { useState, useEffect, useRef } from 'react';
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
    productsByPage, 
    loading, 
    error, 
    pageNum, 
    pages, 
    currentFilters,
    setPage, 
    updateFilters
  } = useProducts({ autoVendorFilter: false });

  // Combine products from all loaded pages
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);

  const observerTarget = useRef<HTMLDivElement>(null);

  // Sync combined products list
  useEffect(() => {
    const combined = Object.keys(productsByPage)
      .sort((a, b) => Number(a) - Number(b))
      .reduce((acc: Product[], key) => {
        const pageProducts = productsByPage[Number(key)] || [];
        // Filter out products that are already in acc to prevent duplicate keys
        const uniqueNewProducts = pageProducts.filter(
          newP => !acc.some(existingP => existingP._id === newP._id)
        );
        return [...acc, ...uniqueNewProducts];
      }, []);
    
    setAllProducts(combined);
    setHasMore(pageNum < pages);
  }, [productsByPage, pageNum, pages]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(pageNum + 1);
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loading, pageNum, setPage]);

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
    <div className="bg-gray-50 dark:bg-zinc-950 min-h-[calc(100vh-64px)] transition-colors duration-300">
      {/* Sticky Filter Section */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 z-20 sticky top-0 transition-colors">
        <ProductFilters 
          filters={currentFilters} 
          setFilters={updateFilters} 
          restoreFilters={updateFilters} 
        />
      </div>

      <div className="w-full">
        <div className="min-w-full inline-block align-middle">
          <table className="w-full border-collapse min-w-300">
          <thead className="sticky top-[72px] z-10 bg-zinc-900 dark:bg-zinc-900 shadow-xl border-b dark:border-zinc-800">
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
          <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
            {allProducts.length > 0 ? (
              allProducts.map((product) => (
              <ProductTableRow 
                key={product._id} 
                product={product} 
                onProductClick={handleProductClick} 
                onEditClick={handleEditClick}
              />
              ))
            ) : !loading && !error && (
                <tr>
                    <td colSpan={11} className="px-6 py-12 bg-gray-50 dark:bg-zinc-950">
                        <div className="w-full py-32 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                            <p className="text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-widest text-sm italic">NO COMPATIBLE STOCK DETECTED</p>
                            <p className="text-zinc-300 dark:text-zinc-600 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Check filters or contact support for manual sourcing</p>
                        </div>
                    </td>
                </tr>
            )}

            {loading && (
                [...Array(3)].map((_, i) => <ProductSkeleton key={`skeleton-${i}`} />)
            )}

            {error && (
                <tr>
                    <td colSpan={11} className="py-20 px-6 bg-gray-50 dark:bg-zinc-950">
                        <div className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-600 p-6 text-center max-w-2xl mx-auto">
                            <p className="text-red-600 dark:text-red-500 font-black uppercase tracking-widest italic">{error}</p>
                        </div>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Infinite Scroll Trigger & Status */}
      <div className="w-full py-12 bg-gray-50 dark:bg-zinc-950 flex flex-col items-center justify-center border-t border-zinc-100 dark:border-zinc-800 transition-colors">
        <div ref={observerTarget} className="h-10 w-full flex items-center justify-center">
          {loading && hasMore && (
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">Loading more assets...</span>
            </div>
          )}
        </div>

        {!hasMore && allProducts.length > 0 && (
          <div className="text-center py-4">
            <p className="text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-[0.2em] text-[10px] italic">No more products, visit after some time.</p>
            <div className="mt-2 w-12 h-1 bg-red-600/20 mx-auto rounded-full"></div>
          </div>
        )}
      </div>

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
