import React, { useEffect, useState } from 'react';
import { X } from '../../components/icons';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { fetchProducts, deleteProduct } from '../../redux/slices/productSlice';
import { PlusCircle, FileText } from '../../components/icons';
import AddProductModal from '../../components/products/AddProductModal';
import EditProductModal from '../../components/products/EditProductModal';
import BulkUploadModal from '../../components/products/BulkUploadModal';
import { Product } from '../../types';
import { useAuth } from '../../hooks/useAuth';

const AdminProductList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { products, loading, error, page, pages } = useSelector((state: RootState) => state.products);
  const { role } = useAuth();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false); // State for bulk upload modal
  const [currentPage, setCurrentPage] = useState(page);
  const [productsPerPage] = useState(10);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    if (message?.type === 'success') {
      const t = setTimeout(() => setMessage(null), 2002);
      return () => clearTimeout(t);
    }
  }, [message]);

  useEffect(() => {
    dispatch(fetchProducts({ page: currentPage, limit: productsPerPage }));
  }, [dispatch, currentPage, productsPerPage]);

  const handleAddProductClick = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleEditClick = (product: Product) => {
    setSelectedProductForEdit(product);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedProductForEdit(null);
  };

  const handleBulkUploadClick = () => {
    setIsBulkUploadModalOpen(true);
  };

  const handleCloseBulkUploadModal = () => {
    setIsBulkUploadModalOpen(false);
  };

  const handleDeleteClick = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await dispatch(deleteProduct(productId)).unwrap();
        setMessage({ type: 'success', text: 'Product deleted successfully!' });
        dispatch(fetchProducts({ page: currentPage, limit: productsPerPage }));
      } catch (err: any) {
        setMessage({ type: 'error', text: err || 'Failed to delete product.' });
      }
    }
  };

  const handleProductAddedOrUpdated = () => {
    dispatch(fetchProducts({ page: currentPage, limit: productsPerPage }));
  };

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="max-w-[90%] mx-auto py-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">PRODUCT <span className="text-brand-red">MANAGEMENT</span></h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest mt-1">Global Inventory Control</p>
        </div>
        <div className="flex items-center">
          <button
            onClick={handleBulkUploadClick}
            className="flex items-center px-6 py-3 bg-indigo-600 text-white font-bold rounded shadow-md hover:bg-indigo-700 transition-all uppercase tracking-widest mr-4"
          >
            <FileText className="w-5 h-5 mr-2" />
            Bulk Upload CSV
          </button>
          <button
            onClick={handleAddProductClick}
            className="flex items-center px-6 py-3 bg-brand-red text-white font-bold rounded shadow-md hover:bg-brand-red-hover transition-all uppercase tracking-widest"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Add New Product
          </button>
        </div>
      </div>
      {message && (
        <div className={`${message.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'} border px-4 py-3 rounded-md mb-4 flex justify-between items-start`} role="alert">
          <div className="text-sm font-bold">{message.text}</div>
          {message.type === 'error' ? (
            <button type="button" onClick={() => setMessage(null)} className="ml-4 text-xs font-black uppercase tracking-widest">
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      )}

      {loading && products.length === 0 ? (
        <div className="flex justify-center items-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white p-8 rounded-lg border border-gray-200 text-center shadow-sm">
          <p className="text-gray-500 font-bold uppercase tracking-widest">No products found in the inventory.</p>
        </div>
      ) : (
        <div className="relative overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
          {loading && (
            <div className="absolute inset-0 z-10 bg-white/65 backdrop-blur-[1px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-red"></div>
            </div>
          )}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Product Info</th>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-center font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900 capitalize">{product.title.length > 50 ? product.title.slice(0, 50) + "..." : product.title}</div>
                    <div className="text-[10px] text-gray-400 font-black uppercase tracking-tighter mt-0.5">{product.brand}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium tracking-tight capitalize">{product.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-gray-900 font-mono">${product.price.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-bold ${product.stockQty < 50 ? 'text-red-600' : 'text-gray-600'}`}>{product.stockQty} Units</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-center items-center gap-4">
                    <button onClick={() => handleEditClick(product)} className="text-zinc-900 hover:text-brand-red font-bold text-[10px] tracking-widest border border-zinc-200 px-3 py-1.5 rounded transition-all cursor-pointer">Edit</button>
                    <button onClick={() => handleDeleteClick(product._id)} className="text-red-600 hover:text-red-700 font-bold text-[10px] tracking-widest border border-red-100 px-3 py-1.5 rounded transition-all cursor-pointer">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="flex justify-center mt-10 space-x-2">
          {[...Array(pages)].map((_, index) => (
            <button
              key={index + 1}
              onClick={() => paginate(index + 1)}
              className={`w-10 h-10 rounded font-bold text-sm transition-all ${currentPage === index + 1 ? 'bg-zinc-900 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-red'
                }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}

      <AddProductModal isOpen={isAddModalOpen} onClose={handleCloseAddModal} onProductAdded={handleProductAddedOrUpdated} />
      {selectedProductForEdit && (
        <EditProductModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          product={selectedProductForEdit}
          role={role}
          onProductUpdated={handleProductAddedOrUpdated}
        />
      )}
      <BulkUploadModal
        isOpen={isBulkUploadModalOpen}
        onClose={handleCloseBulkUploadModal}
        onUploadSuccess={handleProductAddedOrUpdated}
      />
    </div>
  );
};

export default AdminProductList;
