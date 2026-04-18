import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../redux/store';
import { deleteProduct } from '../../redux/slices/productSlice';
import { FileText, PlusCircle } from '../../components/icons';
import AddProductModal from '../../components/products/AddProductModal';
import EditProductModal from '../../components/products/EditProductModal';
import BulkUploadModal from '../../components/products/BulkUploadModal';
import { Product } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import SearchBar from '../../components/common/SearchBar';
import { useAlert } from '../../contexts/AlertContext';
import { useProducts } from '../../hooks/useProducts';
import AdminProductSkeleton from '../../components/products/AdminProductSkeleton';

const AdminProductList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { role } = useAuth();
  const { showAlert } = useAlert();

  const { 
    products, 
    loading, 
    pageNum, 
    pages, 
    setPage, 
    updateFilters, 
    refresh 
  } = useProducts({ autoVendorFilter: false });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const handleSearchSubmit = () => {
    updateFilters({ searchId: searchInput.trim() || undefined });
  };

  const handleClearSearch = () => {
    setSearchInput('');
    updateFilters({ searchId: undefined });
  };

  const handleDeleteClick = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await dispatch(deleteProduct(productId)).unwrap();
      showAlert({
        variant: 'success',
        title: 'product deleted',
        message: 'Product deleted successfully!',
      });
      refresh();
    } catch (err: any) {
      showAlert({
        variant: 'error',
        title: 'delete failed',
        message: err || 'Failed to delete product.',
      });
    }
  };

  return (
    <div className="max-w-[90%] mx-auto py-8">
      <div className="flex justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">PRODUCT <span className="text-brand-red">MANAGEMENT</span></h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest mt-1">Global Inventory Control</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsBulkUploadModalOpen(true)}
            className="flex items-center px-6 py-3 bg-indigo-600 text-white font-bold rounded shadow-md hover:bg-indigo-700 transition-all uppercase tracking-widest cursor-pointer"
          >
            <FileText className="w-5 h-5 mr-2" />
            Bulk Upload
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center px-6 py-3 bg-brand-red text-white font-bold rounded shadow-md hover:bg-brand-red-hover transition-all uppercase tracking-widest cursor-pointer"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Add New Product
          </button>
          <SearchBar
            value={searchInput}
            onChange={setSearchInput}
            onSubmit={handleSearchSubmit}
            onClear={handleClearSearch}
            placeholder="search product id"
            className="w-[360px]"
            showClear={Boolean(searchInput)}
          />
        </div>
      </div>

      {loading && products.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Product Info</th>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Brand</th>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-center font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[...Array(10)].map((_, i) => <AdminProductSkeleton key={i} />)}
            </tbody>
          </table>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white p-8 rounded-lg border border-gray-200 text-center shadow-sm">
          <p className="text-gray-500 font-bold uppercase tracking-widest">No products found in the inventory.</p>
        </div>
      ) : (
        <div className="relative overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Product Info</th>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Brand</th>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-center font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                 [...Array(products.length || 10)].map((_, i) => <AdminProductSkeleton key={i} />)
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900 capitalize">{product.title.length > 50 ? `${product.title.slice(0, 50)}...` : product.title}</div>
                      <div className="text-[10px] text-gray-400 font-mono mt-1">{product._id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-black uppercase tracking-tight">{product.brand}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium tracking-tight capitalize">{product.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-gray-900 font-mono">${product.price.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-bold ${product.stockQty < 50 ? 'text-red-600' : 'text-gray-600'}`}>{product.stockQty} Units</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-center items-center gap-4">
                      <button onClick={() => {
                        setSelectedProductForEdit(product);
                        setIsEditModalOpen(true);
                      }} className="text-zinc-900 hover:text-brand-red font-bold text-[10px] tracking-widest border border-zinc-200 px-3 py-1.5 rounded transition-all cursor-pointer">Edit</button>
                      <button onClick={() => handleDeleteClick(product._id)} className="text-red-600 hover:text-red-700 font-bold text-[10px] tracking-widest border border-red-100 px-3 py-1.5 rounded transition-all cursor-pointer">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="flex justify-center mt-10 space-x-2">
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
      )}

      <AddProductModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onProductAdded={refresh} />
      {selectedProductForEdit && (
        <EditProductModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedProductForEdit(null);
          }}
          product={selectedProductForEdit}
          role={role}
          onProductUpdated={refresh}
        />
      )}
      <BulkUploadModal
        isOpen={isBulkUploadModalOpen}
        onClose={() => setIsBulkUploadModalOpen(false)}
        onUploadSuccess={refresh}
      />
    </div>
  );
};

export default AdminProductList;
