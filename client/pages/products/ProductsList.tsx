
import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { RootState, AppDispatch } from '../../redux/store';
import { fetchProducts } from '../../redux/slices/productSlice';
import ProductTableRow from '../../components/products/ProductTableRow';
import ProductFilters from '../../components/products/ProductFilters';
import ProductDetailsModal from '../../components/products/ProductDetailsModal';
import EditProductModal from '../../components/products/EditProductModal';
import { Product } from '../../types';
import { useAuth } from '../../hooks/useAuth';

const ProductsList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { role } = useAuth();

  const { products, loading, error, pages, page: currentPage } = useSelector((state: RootState) => state.products);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);

  const filters = useMemo(() => ({
    search: searchParams.get('search') || '',
    brand: searchParams.get('brand') || '',
    category: searchParams.get('category') || '',
    location: searchParams.get('location') || '',
    sort: searchParams.get('sort') || '',
  }), [searchParams]);

  const handleSetFilters = (newFilters: any) => {
    const params: Record<string, string> = {};
    if (newFilters.search) params.search = newFilters.search;
    if (newFilters.brand) params.brand = newFilters.brand;
    if (newFilters.category) params.category = newFilters.category;
    if (newFilters.location) params.location = newFilters.location;
    if (newFilters.sort) params.sort = newFilters.sort;
    setSearchParams(params);
  };

  useEffect(() => {
    const queryParams = Object.fromEntries(searchParams.entries());
    dispatch(fetchProducts(queryParams));
  }, [dispatch, searchParams]);

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
    dispatch(fetchProducts(Object.fromEntries(searchParams.entries())));
  };

  const Th = ({ label, className = "" }: { label: string, className?: string }) => (
    <th className={`px-2 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 italic text-center ${className}`}>
        {label}
    </th>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-zinc-50">
      {/* Sticky Filter Section */}
      <div className="shrink-0 bg-white border-b border-zinc-200 z-20">
        <div className="w-full px-6 py-1.5 flex items-center justify-between">
            {pages > 1 && (
                <div className="flex gap-1 items-center ml-auto">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mr-2 italic underline decoration-red-600/50">Protocol Page:</span>
                    {[...Array(pages).keys()].map((p) => (
                        <button
                            key={p + 1}
                            onClick={() => {
                                const newParams = new URLSearchParams(searchParams);
                                newParams.set('page', (p + 1).toString());
                                setSearchParams(newParams);
                            }}
                            className={`w-5 h-5 flex items-center justify-center rounded-none font-black text-[9px] transition-all ${
                                currentPage === p + 1 
                                ? 'bg-red-600 text-white shadow-lg' 
                                : 'text-zinc-400 hover:text-zinc-900'
                            }`}
                        >
                            {p + 1}
                        </button>
                    ))}
                </div>
            )}
        </div>
        <ProductFilters filters={filters} setFilters={handleSetFilters} />
      </div>

      {/* Independently Scrollable Inventory List with Table */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full border-collapse min-w-[1200px]">
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
                <tr>
                    <td colSpan={10} className="py-40">
                        <div className="flex flex-col items-center justify-center gap-4">
                            <div className="w-10 h-10 border-4 border-zinc-100 border-t-red-600 rounded-full animate-spin"></div>
                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest animate-pulse italic">Connecting Inventory Vector...</span>
                        </div>
                    </td>
                </tr>
            ) : error ? (
                <tr>
                    <td colSpan={10} className="py-20 px-6">
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
                    <td colSpan={10} className="py-32 text-center">
                        <p className="text-zinc-400 font-black uppercase tracking-widest text-sm italic">NO COMPATIBLE STOCK DETECTED</p>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      <ProductDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} product={selectedProduct} />
      {isEditModalOpen && selectedProductForEdit && (
        <EditProductModal isOpen={isEditModalOpen} onClose={handleCloseEditModal} product={selectedProductForEdit} role={role} onProductUpdated={handleCloseEditModal} />
      )}
    </div>
  );
};

export default ProductsList;


