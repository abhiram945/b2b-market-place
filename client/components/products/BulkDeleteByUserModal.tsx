import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../redux/store';
import Modal from '../common/Modal';
import { Product } from '../../types';
import { useAlert } from '../../contexts/AlertContext';
import { bulkDeleteProductsByUser, previewProductsByUser } from '../../redux/slices/productSlice';

interface BulkDeleteByUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleteSuccess: () => void;
}

const BulkDeleteByUserModal: React.FC<BulkDeleteByUserModalProps> = ({
  isOpen,
  onClose,
  onDeleteSuccess,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { showAlert } = useAlert();

  const [userIdInput, setUserIdInput] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [previewedProducts, setPreviewedProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [error, setError] = useState('');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const resetState = () => {
    setUserIdInput('');
    setCurrentUserId('');
    setPreviewedProducts([]);
    setTotalProducts(0);
    setError('');
    setIsPreviewing(false);
    setIsDeleting(false);
  };

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  const handleClose = () => {
    if (isDeleting || isPreviewing) return;
    resetState();
    onClose();
  };

  const handlePreview = async () => {
    const normalizedUserId = userIdInput.trim();

    if (!normalizedUserId) {
      setError('Please enter a user id.');
      return;
    }

    setIsPreviewing(true);
    setError('');

    try {
      const result = await dispatch(previewProductsByUser(normalizedUserId)).unwrap();
      const nextProducts = result.products || [];
      const nextTotal = Number(result.total || nextProducts.length || 0);

      setCurrentUserId(normalizedUserId);
      setPreviewedProducts(nextProducts);
      setTotalProducts(nextTotal);

      if (nextProducts.length === 0) {
        setError('No products were found for this user id.');
        return;
      }
    } catch (err: any) {
      const message = typeof err === 'string'
        ? err
        : err?.message || 'Unable to preview products for this user id.';

      setCurrentUserId('');
      setPreviewedProducts([]);
      setTotalProducts(0);
      setError(message);
      showAlert({
        variant: 'error',
        title: 'preview failed',
        message,
      });
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUserId) {
      setError('Please preview the user before continuing.');
      return;
    }

    if (previewedProducts.length === 0) {
      setError('There are no products to delete for this user.');
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      const result = await dispatch(bulkDeleteProductsByUser(currentUserId)).unwrap();
      const deletedCount = Number(result.deletedCount || previewedProducts.length || 0);

      showAlert({
        variant: 'success',
        title: 'bulk deletion complete',
        message: `Deleted ${deletedCount} product(s) for user ${currentUserId}.`,
      });

      setUserIdInput('');
      setCurrentUserId('');
      setPreviewedProducts([]);
      setTotalProducts(0);
      onDeleteSuccess();
      onClose();
    } catch (err: any) {
      const message = typeof err === 'string'
        ? err
        : err?.message || 'Failed to delete products for this user.';

      setError(message);
      showAlert({
        variant: 'error',
        title: 'bulk deletion failed',
        message,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isReadyForDeletion = Boolean(currentUserId && previewedProducts.length > 0 && !isDeleting && !isPreviewing);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Delete by User ID"
      closeButtonClassName="text-gray-400 hover:text-brand-red"
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="bulk-delete-user-id" className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
            User ID
          </label>
          <div className="flex gap-3">
            <input
              id="bulk-delete-user-id"
              value={userIdInput}
              onChange={(event) => setUserIdInput(event.target.value)}
              placeholder="Enter user ID"
              disabled={isPreviewing || isDeleting}
              className="flex-1 border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 dark:text-zinc-200 focus:border-brand-red focus:outline-none disabled:bg-gray-100 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={handlePreview}
              disabled={isPreviewing || isDeleting || !userIdInput.trim()}
              className="px-5 py-3 bg-zinc-900 dark:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-brand-red transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {isPreviewing ? 'Previewing...' : 'Preview'}
            </button>
          </div>
        </div>

        {(error) && <div className={`rounded-xl border px-4 py-3 text-sm border-red-200 bg-red-50 text-red-700`}>
            {error}
          </div>}

        {previewedProducts.length > 0 && (
          <div className="space-y-3 max-h-72 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                Matching Products ({previewedProducts.length})
              </h3>
              <span className="text-xs font-bold text-gray-500">{totalProducts} total</span>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-zinc-700">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-zinc-900 text-white sticky top-0">
                  <tr>
                    <th className="px-3 py-2 font-black uppercase tracking-widest">Title</th>
                    <th className="px-3 py-2 font-black uppercase tracking-widest">Brand</th>
                    <th className="px-3 py-2 font-black uppercase tracking-widest">Category</th>
                    <th className="px-3 py-2 font-black uppercase tracking-widest">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-zinc-700 dark:bg-zinc-950">
                  {previewedProducts.map((product) => (
                    <tr key={product._id}>
                      <td className="px-3 py-2 font-medium text-gray-700 dark:text-zinc-200">{product.title}</td>
                      <td className="px-3 py-2 text-gray-600 dark:text-zinc-300">{product.brand}</td>
                      <td className="px-3 py-2 text-gray-600 dark:text-zinc-300">{product.category}</td>
                      <td className="px-3 py-2 text-gray-600 dark:text-zinc-300">{product.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting || isPreviewing}
            className="px-5 py-3 border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-200 text-[10px] font-black uppercase tracking-widest rounded-xl hover:border-brand-red hover:text-brand-red transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!isReadyForDeletion}
            className="px-5 py-3 bg-brand-red text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Proceed with bulk deletion'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BulkDeleteByUserModal;
