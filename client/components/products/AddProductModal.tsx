import React from 'react';
import { useForm, SubmitHandler, UseFormRegister, FieldErrors } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Modal from '../common/Modal';
import { Product } from '../../types';
import api from '../../api';
import { toast } from 'react-toastify';
import { RootState } from '../../redux/store';

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
  minOrderQty: yup.number().integer().positive().required('Min order qty is required'),
  maxOrderQty: yup.number().integer().positive().min(yup.ref('minOrderQty'), 'Max cannot be less than Min').required('Max order qty is required'),
  stockQty: yup.number().integer().min(0).required('Stock qty is required'),
  eta: yup.string().optional(),
});

interface InputFieldProps {
  label: string;
  name: keyof AddProductFormData;
  type?: string;
  step?: string;
  list?: string;
  register: UseFormRegister<AddProductFormData>;
  errors: FieldErrors<AddProductFormData>;
}

const InputField: React.FC<InputFieldProps> = ({ label, name, type = "text", step, list, register, errors }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-1">{label}</label>
    <input
      type={type}
      step={step}
      list={list}
      {...register(name)}
      className="w-full h-11 bg-white border-2 border-gray-100 rounded-lg px-4 text-sm font-bold text-gray-900 outline-none focus:border-brand-red focus:ring-4 focus:ring-red-500/5 transition-all"
    />
    {errors[name] && <p className="text-[9px] font-bold text-red-600 uppercase mt-0.5 ml-1">{errors[name]?.message as string}</p>}
  </div>
);

const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onProductAdded }) => {
  const { config } = useSelector((state: RootState) => state.products);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<AddProductFormData>({
    resolver: yupResolver(schema) as any,
  });

  const onSubmit: SubmitHandler<AddProductFormData> = async (data) => {
    try {
      const payload = {
        ...data,
        title: data.title.toLowerCase(),
        brand: data.brand.toLowerCase(),
        category: data.category.toLowerCase(),
        location: data.location.toLowerCase(),
        condition: data.condition.toLowerCase(),
        eta: data.eta ? data.eta.toLowerCase() : undefined,
      };
      await api.post('/products', payload);
      toast.success('Inventory Entry Created');
      reset();
      onProductAdded();
      onClose();
    } catch (err: any) {
      toast.error('Operation Failed');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add new product">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="md:col-span-2">
            <InputField label="title" name="title" register={register} errors={errors} />
          </div>
          <InputField label="vendor" name="user" register={register} errors={errors} />
          
          <div className="relative">
            <InputField label="brand" name="brand" list="brand-list" register={register} errors={errors} />
            <datalist id="brand-list">
              {config.brands.map(b => <option key={b} value={b} />)}
            </datalist>
          </div>

          <div className="relative">
            <InputField label="category" name="category" list="category-list" register={register} errors={errors} />
            <datalist id="category-list">
              {config.categories.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>

          <div className="relative">
            <InputField label="location" name="location" list="location-list" register={register} errors={errors} />
            <datalist id="location-list">
              {config.locations.map(l => <option key={l} value={l} />)}
            </datalist>
          </div>

          <InputField label="price" name="price" type="number" step="0.01" register={register} errors={errors} />

          <div className="relative">
            <InputField label="condition" name="condition" list="condition-list" register={register} errors={errors} />
            <datalist id="condition-list">
              {config.conditions.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>

          <InputField label="Min Order Qty" name="minOrderQty" type="number" register={register} errors={errors} />
          <InputField label="max Order Qty" name="maxOrderQty" type="number" register={register} errors={errors} />
          <InputField label="stock Qty" name="stockQty" type="number" register={register} errors={errors} />
          <InputField label="eta" name="eta" register={register} errors={errors} />
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
