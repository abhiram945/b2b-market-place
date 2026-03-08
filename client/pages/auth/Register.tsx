
import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../../redux/slices/userSlice';
import { Building } from '../../components/icons';
import { AppDispatch, RootState } from '../../redux/store';
import { toast } from 'react-toastify';

type RegisterFormInputs = {
  fullName: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  address: string;
  role: 'buyer' | 'vendor' | '';
  password: string;
  confirmPassword: string;
};

const InputWrapper = ({ label, children, error }: any) => (
  <div className="flex flex-col gap-1.5 min-h-[85px]">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
    {children}
    {error && <p className="text-red-600 text-[9px] font-bold uppercase ml-1 animate-in fade-in slide-in-from-top-1">{error.message}</p>}
  </div>
);

const Register: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state: RootState) => state.user);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormInputs>({
    defaultValues: {
      role: ''
    }
  });

  const password = watch('password');
  const role = watch('role');

  const onSubmit: SubmitHandler<RegisterFormInputs> = (data) => {
    if (data.role === '') return;

    const { confirmPassword, ...registerData } = data;
    const payload = { ...registerData, role: data.role as 'buyer' | 'vendor', _id: '' };

    if (payload.role !== 'buyer') {
      delete payload.address;
    }

    dispatch(registerUser(payload)).then(action => {
      if (registerUser.fulfilled.match(action)) {
        toast.success('Registration successful! Please log in.');
        navigate('/login');
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-white px-10 py-6 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center text-3xl font-black text-gray-900 tracking-tighter italic">
            <Building className="w-10 h-10 text-brand-red mr-2" />
            <span>B2B<span className="text-brand-red">MARKET</span></span>
          </Link>
          <h2 className="mt-3 text-2xl font-black text-gray-900 uppercase tracking-tight">
            Create account
          </h2>
        </div>

        <form className="mt-8" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            <div className="md:col-span-2">
              <InputWrapper label="Full Name" error={errors.fullName}>
                <input
                  {...register('fullName', { required: 'Full name is required' })}
                  placeholder="Full Name"
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-brand-red focus:ring-4 focus:ring-red-500/5 transition-all font-bold text-sm"
                />
              </InputWrapper>
            </div>

            <InputWrapper label="Email Address" error={errors.email}>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
                    message: 'Invalid email address'
                  }
                })}
                placeholder="Email address"
                type="email"
                className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-brand-red focus:ring-4 focus:ring-red-500/5 transition-all font-bold text-sm"
              />
            </InputWrapper>

            <InputWrapper label="Phone Number" error={errors.phoneNumber}>
              <input
                {...register('phoneNumber', { required: 'Phone number is required' })}
                placeholder="Phone Number (e.g. +1234567890)"
                type="tel"
                className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-brand-red focus:ring-4 focus:ring-red-500/5 transition-all font-bold text-sm"
              />
            </InputWrapper>

            <InputWrapper label="Company Name" error={errors.companyName}>
              <input
                {...register('companyName', { required: 'Company name is required' })}
                placeholder="Company Name"
                className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-brand-red focus:ring-4 focus:ring-red-500/5 transition-all font-bold text-sm"
              />
            </InputWrapper>

            <InputWrapper label="Role" error={errors.role}>
              <select
                {...register('role', { required: 'Role is required' })}
                className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-brand-red focus:ring-4 focus:ring-red-500/5 transition-all font-bold text-sm bg-white"
              >
                <option value="" hidden>Select your role</option>
                <option value="buyer">Buyer</option>
                <option value="vendor">Vendor</option>
              </select>
            </InputWrapper>

            {role === 'buyer' && (
              <div className="md:col-span-2">
                <InputWrapper label="Address" error={errors.address}>
                  <textarea
                    {...register('address', { required: 'Address is required' })}
                    placeholder="Full Address"
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-brand-red focus:ring-4 focus:ring-red-500/5 transition-all font-bold text-sm resize-none"
                  />
                </InputWrapper>
              </div>
            )}

            <InputWrapper label="Password" error={errors.password}>
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Min 8 characters' }
                })}
                placeholder="Password"
                type="password"
                className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-brand-red focus:ring-4 focus:ring-red-500/5 transition-all font-bold text-sm"
              />
            </InputWrapper>

            <InputWrapper label="Confirm Password" error={errors.confirmPassword}>
              <input
                {...register('confirmPassword', {
                  required: 'Confirm password required',
                  validate: value => value === password || 'Passwords must match'
                })}
                placeholder="Confirm Password"
                type="password"
                className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-brand-red focus:ring-4 focus:ring-red-500/5 transition-all font-bold text-sm"
              />
            </InputWrapper>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-6">
              <p className="text-red-600 text-xs font-black uppercase tracking-widest text-center">{error}</p>
            </div>
          )}

          <div className="mt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black hover:bg-brand-red text-white font-black text-xs uppercase tracking-[0.2em] py-4 rounded-xl shadow-xl transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Processing...' : 'Create account'}
            </button>
          </div>
        </form>

        <div className="text-center pt-0">
          <p className="text-sm text-gray-500 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-red font-black hover:underline decoration-2 underline-offset-4">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
