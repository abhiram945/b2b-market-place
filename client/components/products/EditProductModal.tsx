
import React, { useEffect } from 'react';
import { useForm, SubmitHandler, UseFormRegister, FieldErrors } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Modal from '../common/Modal';
import { Product } from '../../types';
import api from '../../api';
import { toast } from 'react-toastify';
import { RootState } from '../../redux/store';
import { toLowerTrim } from '../../utils/normalize';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  role: 'admin' | 'vendor' | 'buyer' | '' | undefined;
  onProductUpdated: () => void;
}

type EditProductFormData = Partial<Omit<Product, '_id' | 'createdAt' | 'updatedAt' | 'user'>>;

const schema = yup.object().shape({
  title: yup.string().optional(),
  brand: yup.string().optional(),
  category: yup.string().optional(),
  location: yup.string().optional(),
  price: yup.number().positive('Value must be positive').optional(),
  stockQty: yup.number().integer().min(0).optional(),
  isStockEnabled: yup.boolean().optional(),
  minOrderQty: yup.number().integer().positive().optional(),
  maxOrderQty: yup.number().integer().positive().min(yup.ref('minOrderQty'), 'Max cannot be less than Min').optional(),
  eta: yup.number().integer().min(0).optional(),
});

interface InputFieldProps {
  label: string;
  name: keyof EditProductFormData;
  type?: string;
  step?: string;
  list?: string;
  register: UseFormRegister<EditProductFormData>;
  errors: FieldErrors<EditProductFormData>;
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

const EditProductModal: React.FC<EditProductModalProps> = ({ isOpen, onClose, product, role, onProductUpdated }) => {
  const { config } = useSelector((state: RootState) => state.products);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch } = useForm<EditProductFormData>({
    resolver: yupResolver(schema) as any,
  });

  const watchedPrice = watch('price');

  useEffect(() => {
    if (product) reset(product);
  }, [product, reset]);

  const onSubmit: SubmitHandler<EditProductFormData> = async (data) => {
    if (!product) return;
    
    // Vendor specific check
    if (role === 'vendor' && data.price && data.price > product.price) {
      toast.error('PRICE INCREASE NOT PERMITTED');
      return;
    }

    try {
      const payload = { ...data };
      if (payload.title) payload.title = toLowerTrim(payload.title);
      if (payload.brand) payload.brand = toLowerTrim(payload.brand);
      if (payload.category) payload.category = toLowerTrim(payload.category);
      if (payload.location) payload.location = toLowerTrim(payload.location);
      if (payload.condition) payload.condition = toLowerTrim(payload.condition);
      if (payload.eta !== undefined) payload.eta = Number(payload.eta);

      const url = role === 'admin' ? `/products/${product._id}` : `/products/${product._id}/vendor-update`;
      await api.put(url, payload);
      toast.success('SPECIFICATIONS UPDATED');
      onProductUpdated();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'RE-ENTRY FAILED');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Product">
      {product ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {role === 'admin' ? (
              <>
                <div className="md:col-span-2">
                    <InputField label="title" name="title" register={register} errors={errors} />
                </div>
                
                <div className="relative">
                  <InputField label="brand" name="brand" list="brand-list-edit" register={register} errors={errors} />
                  <datalist id="brand-list-edit">
                    {config.brands.map(b => <option key={b} value={b} />)}
                  </datalist>
                </div>

                <div className="relative">
                  <InputField label="category" name="category" list="category-list-edit" register={register} errors={errors} />
                  <datalist id="category-list-edit">
                    {config.categories.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>

                <div className="relative">
                  <InputField label="location" name="location" list="location-list-edit" register={register} errors={errors} />
                  <datalist id="location-list-edit">
                    {config.locations.map(l => <option key={l} value={l} />)}
                  </datalist>
                </div>

                <InputField label="price" name="price" type="number" step="0.01" register={register} errors={errors} />

                <div className="relative">
                  <InputField label="condition" name="condition" list="condition-list-edit" register={register} errors={errors} />
                  <datalist id="condition-list-edit">
                    {config.conditions.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>

                <InputField label="stockQty" name="stockQty" type="number" register={register} errors={errors} />
                <InputField label="minOrderQty" name="minOrderQty" type="number" register={register} errors={errors} />
                <InputField label="maxOrderQty" name="maxOrderQty" type="number" register={register} errors={errors} />
                <InputField label="eta" name="eta" type="number" register={register} errors={errors} />

                <div className="flex items-center space-x-4 pt-6 ml-1">
                    <input type="checkbox" {...register('isStockEnabled')} className="w-5 h-5 accent-brand-red rounded cursor-pointer" />
                    <label className="text-[11px] font-black text-gray-600 uppercase tracking-widest cursor-pointer">isStockEnabled</label>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col">
                  <InputField label="price" name="price" type="number" step="0.01" register={register} errors={errors} />
                  {watchedPrice && product && watchedPrice > product.price && (
                    <p className="text-[9px] font-black text-red-600 uppercase mt-1.5 ml-1 animate-pulse">
                      Vendors aren't allowed to increase price
                    </p>
                  )}
                </div>
                <InputField label="stockQty" name="stockQty" type="number" register={register} errors={errors} />
                <div className="flex items-center space-x-4 pt-6 ml-1">
                    <input type="checkbox" {...register('isStockEnabled')} className="w-5 h-5 accent-brand-red rounded cursor-pointer" />
                    <label className="text-[11px] font-black text-gray-600 uppercase tracking-widest cursor-pointer">isStockEnabled</label>
                </div>
              </>
            )}
          </div>

          <div className="pt-8 border-t border-gray-100 flex justify-end items-center gap-6">
            <button type="button" onClick={onClose} className="text-[11px] font-black uppercase tracking-[0.2em] px-10 py-4 text-gray-400 hover:text-gray-900 transition-colors cursor-pointer">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="bg-black hover:bg-brand-red text-white font-black text-[11px] uppercase tracking-[0.2em] px-10 py-4 rounded-none shadow-xl transition-all disabled:opacity-50 cursor-pointer">
              {isSubmitting ? 'UPDATING...' : 'Update'}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-red"></div></div>
      )}
    </Modal>
  );
};

export default EditProductModal;
