import React, { useEffect } from 'react';
import { useForm, SubmitHandler, SubmitErrorHandler, UseFormRegister } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Modal from '../common/Modal';
import { Product } from '../../types';
import api from '../../api';
import { RootState } from '../../redux/store';
import { toLowerTrim } from '../../utils/normalize';
import { useAlert } from '../../contexts/AlertContext';
import { apiErrorsToAlertItems, formErrorsToAlertItems } from '../../utils/alertHelpers';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: () => void;
}

type AddProductFormData = Omit<Product, '_id' | 'isStockEnabled'> & { user: string };

const schema = yup.object().shape({
  user: yup.string().required('Vendor ID is required'),
  title: yup.string().required('Product title is required'),
  brand: yup.string().required('Brand is required'),
  category: yup.string().required('Category is required'),
  location: yup.string().required('Location is required'),
  price: yup.number().positive('Price must be positive').required('Price is required'),
  condition: yup.string().required('Condition is required'),
  minOrderQty: yup.number().integer().positive().optional(),
  maxOrderQty: yup.number().integer().positive().min(yup.ref('minOrderQty'), 'Max cannot be less than Min').optional(),
  stockQty: yup.number().integer().min(0).required('Stock qty is required'),
  eta: yup.number().integer().min(0).optional(),
});

interface InputFieldProps {
  label: string;
  name: keyof AddProductFormData;
  type?: string;
  step?: string;
  list?: string;
  register: UseFormRegister<AddProductFormData>;
}

const InputField: React.FC<InputFieldProps> = ({ label, name, type = "text", step, list, register }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-1">{label}</label>
    <input
      type={type}
      step={step}
      list={list}
      {...register(name)}
      className="w-full h-11 bg-white border-2 border-gray-100 rounded-lg px-4 text-sm font-bold text-gray-900 outline-none focus:border-brand-red focus:ring-4 focus:ring-red-500/5 transition-all"
    />
  </div>
);

const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onProductAdded }) => {
  const { config } = useSelector((state: RootState) => state.products);
  const { register, handleSubmit, formState: { isSubmitting }, reset, watch, setValue } = useForm<AddProductFormData>({
    resolver: yupResolver(schema) as any,
  });
  const { showAlert } = useAlert();
  const stockQty = watch('stockQty');
  const maxOrderQty = watch('maxOrderQty');

  useEffect(() => {
    if (typeof stockQty === 'number' && typeof maxOrderQty === 'number' && maxOrderQty > stockQty) {
      setValue('maxOrderQty', Number(stockQty) as never, { shouldValidate: true });
    }
  }, [stockQty, maxOrderQty, setValue]);

  const onSubmit: SubmitHandler<AddProductFormData> = async (data) => {
    try {
      // Apply defaults consistent with bulk upload: minOrderQty defaults to 1, maxOrderQty defaults to stockQty
      const computedMin = data.minOrderQty !== undefined && data.minOrderQty !== null && String(data.minOrderQty).trim() !== ''
        ? Number(data.minOrderQty)
        : 1;
      const computedStock = data.stockQty !== undefined && data.stockQty !== null && String(data.stockQty).trim() !== ''
        ? Number(data.stockQty)
        : 0;
      const computedMax = data.maxOrderQty !== undefined && data.maxOrderQty !== null && String(data.maxOrderQty).trim() !== ''
        ? Number(data.maxOrderQty)
        : computedStock;

      // Ensure max >= min
      const finalMin = computedMin;
      const stockCappedMax = computedMax > computedStock ? computedStock : computedMax;
      const finalMax = stockCappedMax < finalMin ? finalMin : stockCappedMax;

      const payload = {
        ...data,
        title: toLowerTrim(data.title),
        brand: toLowerTrim(data.brand),
        category: toLowerTrim(data.category),
        location: toLowerTrim(data.location),
        condition: toLowerTrim(data.condition),
        eta: data.eta !== undefined ? Number(data.eta) : undefined,
        minOrderQty: finalMin,
        maxOrderQty: finalMax,
        stockQty: computedStock,
      };
      await api.post('/products', payload);
      showAlert({
        variant: 'success',
        title: 'product added',
        message: 'inventory entry created successfully.',
      });
      reset();
      onProductAdded();
      onClose();
    } catch (err: any) {
      showAlert({
        variant: 'error',
        title: 'product add failed',
        items: apiErrorsToAlertItems(err),
        message: apiErrorsToAlertItems(err).length === 0 ? 'operation failed' : undefined,
      });
    }
  };

  const onInvalid: SubmitErrorHandler<AddProductFormData> = (formErrors) => {
    showAlert({
      variant: 'error',
      title: 'fix product fields',
      items: formErrorsToAlertItems(formErrors),
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add new product">
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8 py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="md:col-span-2">
            <InputField label="title" name="title" register={register} />
          </div>
          <InputField label="vendor" name="user" register={register} />
          
          <div className="relative">
            <InputField label="brand" name="brand" list="brand-list" register={register} />
            <datalist id="brand-list">
              {config.brands.map(b => <option key={b} value={b} />)}
            </datalist>
          </div>

          <div className="relative">
            <InputField label="category" name="category" list="category-list" register={register} />
            <datalist id="category-list">
              {config.categories.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>

          <div className="relative">
            <InputField label="location" name="location" list="location-list" register={register} />
            <datalist id="location-list">
              {config.locations.map(l => <option key={l} value={l} />)}
            </datalist>
          </div>

          <InputField label="price" name="price" type="number" step="0.01" register={register} />

          <div className="relative">
            <InputField label="condition" name="condition" list="condition-list" register={register} />
            <datalist id="condition-list">
              {config.conditions.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>

          <InputField label="Min Order Qty" name="minOrderQty" type="number" register={register} />
          <InputField label="max Order Qty" name="maxOrderQty" type="number" register={register} />
          <InputField label="stock Qty" name="stockQty" type="number" register={register} />
          <InputField label="eta" name="eta" type="number" register={register} />
        </div>

        <div className="pt-8 border-t border-gray-100 flex justify-end items-center gap-6">
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] px-10 py-4 font-black tracking-[0.2em] text-gray-400 hover:text-gray-900 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand-red text-white font-black text-[11px] tracking-[0.2em] px-10 py-4 rounded-none shadow-xl disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? 'Adding...' : 'Add Product'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddProductModal;
