import React, { useEffect, useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../redux/store';
import Modal from '../common/Modal'; 
import * as Papa from 'papaparse'; // Import papaparse
import { Product } from '../../types';
import { bulkUploadProducts } from '../../redux/slices/productSlice';
import * as yup from 'yup';
import { toLowerTrim } from '../../utils/normalize';
import { CheckCircle } from '../icons';
import { useAlert } from '../../contexts/AlertContext';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

interface ParsedProduct extends Omit<Product, '_id'> {
    _id?: string; // Product ID, optional as it's new
    user: string; // Vendor ID
}

interface ProductValidationError {
    row: number;
    field: string;
    message: string;
}

// Define Yup schema for product validation (frontend)
// This should match the product schema requirements, including the 'user' field for the vendor.
const productSchema = yup.object().shape({
    user: yup.string().required('Vendor ID is required'),
    title: yup.string().required('Title is required'),
    brand: yup.string().required('Brand is required'),
    category: yup.string().required('Category is required'),
    location: yup.string().required('Location is required'),
    price: yup.number().required('Price is required').positive('Price must be positive'),
    minOrderQty: yup.number().required('Min Order Quantity is required').integer('Must be an integer').min(1, 'Must be at least 1'),
    maxOrderQty: yup.number().required('Max Order Quantity is required').integer('Must be an integer').min(yup.ref('minOrderQty'), 'Max Order Qty must be >= Min Order Qty'),
    stockQty: yup.number().required('Stock Quantity is required').integer('Must be an integer').min(0, 'Cannot be negative'),
    condition: yup.string().required('Condition is required'),
    isStockEnabled: yup.boolean().default(true),
    eta: yup.number().integer().min(0).optional(),
});


const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ isOpen, onClose, onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedProduct[]>([]);
  const [validationErrors, setValidationErrors] = useState<ProductValidationError[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { showAlert } = useAlert();

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setParsedData([]);
      setValidationErrors([]);
      setIsParsing(false);
      setIsUploading(false);
      setUploadComplete(false);
    }
  }, [isOpen]);

  const handleModalClose = () => {
    if (isUploading) return;
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setParsedData([]);
      setValidationErrors([]);
    }
  };

  const getCurrentFile = () => fileInputRef.current?.files?.[0] || file;

  const parseCsv = () => {
    const selectedFile = getCurrentFile();

    if (!selectedFile) {
      showAlert({
        variant: 'error',
        title: 'missing file',
        message: 'Please select a CSV file first.',
      });
      return;
    }

    setIsParsing(true);
    setFile(selectedFile);
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true, // Attempt to convert values to appropriate types
      complete: (results:any) => {
        const products: ParsedProduct[] = [];
        const errors: ProductValidationError[] = [];

        results.data.forEach((row: any, index:number) => {
          const rowNumber = index + 1; // CSV rows are 1-indexed
          const stockQty = parseInt(row.stockQty, 10);
          const minOrderQty = row.minOrderQty === undefined || row.minOrderQty === null || String(row.minOrderQty).trim() === ''
            ? 1
            : parseInt(row.minOrderQty, 10);
          const maxOrderQty = row.maxOrderQty === undefined || row.maxOrderQty === null || String(row.maxOrderQty).trim() === ''
            ? stockQty
            : parseInt(row.maxOrderQty, 10);

          // Convert string numbers to actual numbers where needed for validation
          const processedRow = {
            ...row,
            title: toLowerTrim(row.title),
            brand: toLowerTrim(row.brand),
            category: toLowerTrim(row.category),
            location: toLowerTrim(row.location),
            condition: toLowerTrim(row.condition),
            eta: row.eta !== undefined && row.eta !== null && String(row.eta).trim() !== ''
              ? parseInt(String(row.eta), 10)
              : undefined,
            price: parseFloat(row.price),
            minOrderQty,
            maxOrderQty,
            stockQty,
            isStockEnabled: row.isStockEnabled !== undefined ? (String(row.isStockEnabled).toLowerCase() === 'true' || row.isStockEnabled === true) : true,
          };

          try {
            // Validate against Yup schema
            productSchema.validateSync(processedRow, { abortEarly: false, stripUnknown: true });
            products.push(processedRow as ParsedProduct);
          } catch (validationError: any) {
            validationError.inner.forEach((err: yup.ValidationError) => {
              errors.push({
                row: rowNumber,
                field: err.path || 'unknown',
                message: err.message,
              });
            });
          }
        });
        setParsedData(products);
        setValidationErrors(errors);
        setIsParsing(false);
        if (errors.length > 0) {
            showAlert({
              variant: 'error',
              title: 'validation failed',
              message: `Found ${errors.length} validation errors in the CSV.`,
            });
        } else if (products.length > 0) {
            showAlert({
              variant: 'success',
              title: 'parsed csv',
              message: `Successfully parsed and validated ${products.length} products.`,
            });
        }
      },
      error: (err: any) => {
        setIsParsing(false);
        setParsedData([]);
        setValidationErrors([]);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        showAlert({
          variant: 'error',
          title: 'parse error',
          message: `Error parsing CSV: ${err?.message || String(err)}`,
        });
      }
    });
  };

  const handleBulkUpload = () => {
    if (parsedData.length === 0 || validationErrors.length > 0) {
      showAlert({
        variant: 'error',
        title: 'upload blocked',
        message: 'Cannot upload: no valid products or validation errors present.',
      });
      return;
    }
    
    setIsUploading(true);
    setUploadComplete(false);
    // Dispatch the bulk upload thunk
    dispatch(bulkUploadProducts(parsedData as any))
        .unwrap()
        .then((response) => {
          showAlert({
            variant: 'success',
            title: 'upload complete',
            message: response.message || 'Products uploaded successfully!',
          });
          setIsUploading(false);
          setUploadComplete(true);
          onUploadSuccess();
        })
        .catch((err: any) => {
            console.error('[BULK UPLOAD] Server error:', err);
            setIsUploading(false);
            const errorMessage = typeof err === 'string' ? err : (err.message || 'Failed to bulk upload products');
            showAlert({
              variant: 'error',
              title: 'upload failed',
              message: errorMessage,
            });
        });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Bulk Product Upload"
      closeButtonClassName="text-gray-400 hover:text-brand-red"
    >
      <div className="p-2 relative">
        {isUploading && (
          <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red mb-4"></div>
            <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest animate-pulse">Syncing Products to Global Inventory...</p>
          </div>
        )}
        <div className="flex items-end gap-3 mb-4">
          <div className="flex-1">
            <label htmlFor="csvFile" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5">Select CSV File</label>
            <input
              ref={fileInputRef}
              type="file"
              id="csvFile"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full text-xs font-bold text-gray-500 border-2 border-gray-100 rounded-xl px-3 py-2
                         file:mr-4 file:py-1 file:px-3
                         file:rounded file:border-0
                         file:text-[10px] file:font-black file:uppercase file:tracking-widest
                         file:bg-zinc-100 file:text-zinc-600
                         hover:file:bg-zinc-200 transition-all cursor-pointer"
            />
          </div>
          <button
            onClick={parseCsv}
            disabled={!file || isParsing || uploadComplete}
            className="h-[42px] px-6 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-brand-red transition-all disabled:opacity-50 cursor-pointer"
          >
            {isParsing ? 'Parsing...' : 'Parse CSV'}
          </button>
        </div>

        {parsedData.length > 0 && (
          <div className="mt-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Parsed Products ({parsedData.length})</h3>
            <div className="h-64 overflow-auto border border-gray-100 rounded-xl shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-[9px] font-black text-gray-500 uppercase tracking-widest">Row</th>
                    <th className="px-4 py-3 text-left text-[9px] font-black text-gray-500 uppercase tracking-widest">Title</th>
                    <th className="px-4 py-3 text-left text-[9px] font-black text-gray-500 uppercase tracking-widest">Brand</th>
                    <th className="px-4 py-3 text-left text-[9px] font-black text-gray-500 uppercase tracking-widest">Category</th>
                    <th className="px-4 py-3 text-left text-[9px] font-black text-gray-500 uppercase tracking-widest">Location</th>
                    <th className="px-4 py-3 text-left text-[9px] font-black text-gray-500 uppercase tracking-widest">Price</th>
                    <th className="px-4 py-3 text-left text-[9px] font-black text-gray-500 uppercase tracking-widest">Stock</th>
                    <th className="px-4 py-3 text-left text-[9px] font-black text-gray-500 uppercase tracking-widest">Min/Max</th>
                    <th className="px-4 py-3 text-left text-[9px] font-black text-gray-500 uppercase tracking-widest">ETA</th>
                    <th className="px-4 py-3 text-left text-[9px] font-black text-gray-500 uppercase tracking-widest">Condition</th>
                    <th className="px-4 py-3 text-left text-[9px] font-black text-gray-500 uppercase tracking-widest">Vendor ID</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {parsedData.map((product, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-[10px] font-bold text-gray-400">{index + 1}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-[10px] font-bold text-gray-900 truncate max-w-[150px]" title={product.title}>{product.title}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-[10px] font-bold text-gray-600 uppercase">{product.brand}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-[10px] font-bold text-gray-600 capitalize">{product.category}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-[10px] font-bold text-gray-600 uppercase">{product.location}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-[10px] font-black text-brand-red">${product.price}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-[10px] font-bold text-gray-900">{product.stockQty}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-[10px] font-bold text-gray-500">{product.minOrderQty}/{product.maxOrderQty}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-[10px] font-bold text-gray-500">{product.eta ?? '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-[10px] font-bold text-gray-600">{product.condition}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-[9px] font-mono text-gray-400">{product.user}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {validationErrors.length > 0 && (
          <div className="mt-4 text-red-600 bg-red-50 p-4 rounded-xl border border-red-100">
            <h3 className="text-[10px] font-black uppercase tracking-widest mb-2">Validation Errors ({validationErrors.length})</h3>
            <ul className="space-y-1">
              {validationErrors.slice(0, 50).map((err, index) => (
                <li key={index} className="text-[10px] font-bold uppercase tracking-tight">
                  <span className="text-red-400 mr-2">Row {err.row}:</span> 
                  {err.field} - {err.message}
                </li>
              ))}
              {validationErrors.length > 50 && (
                <li className="text-[10px] font-black text-red-400 uppercase italic">... and {validationErrors.length - 50} more errors</li>
              )}
            </ul>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            className={`flex-1 text-white font-black text-xs uppercase tracking-[0.2em] py-4 rounded-xl shadow-xl transition-all ${uploadComplete ? 'bg-green-600 hover:bg-green-700' : 'bg-brand-red'} disabled:opacity-50 cursor-pointer`}
            onClick={uploadComplete ? undefined : handleBulkUpload}
            disabled={isUploading || uploadComplete || (!uploadComplete && (parsedData.length === 0 || validationErrors.length > 0))}
          >
            {isUploading ? 'Processing Upload...' : uploadComplete ? 'Done Bulk Uploading' : 'Finalize Bulk Upload'}
          </button>
          <button
            type="button"
            className="px-8 border-2 border-gray-100 text-gray-400 font-black text-xs uppercase tracking-[0.2em] py-4 rounded-xl transition-all hover:bg-gray-50 cursor-pointer"
            onClick={handleModalClose}
            disabled={isUploading}
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BulkUploadModal;
