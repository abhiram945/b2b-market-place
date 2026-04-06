
import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../../redux/slices/userSlice';
import { Building } from '../../components/icons';
import { AppDispatch, RootState } from '../../redux/store';
import api from '../../api';
import { toLowerTrim, toLowerTrimOptional } from '../../utils/normalize';

type RegisterFormInputs = {
  fullName: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  website?: string;
  address: string;
  role: 'buyer' | 'vendor' | '';
  password: string;
  confirmPassword: string;
  tradeLicense: FileList;
  idDocument: FileList;
  vatRegistration: FileList;
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
  const [companyNames, setCompanyNames] = useState<string[]>([]);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormInputs>({
    defaultValues: {
      role: ''
    }
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await api.get('/auth/register-config');
        setCompanyNames(data.companyNames);
      } catch (err) {
        console.error('Failed to fetch registration config');
      }
    };
    fetchConfig();
  }, []);

  const password = watch('password');
  const role = watch('role');

  const onSubmit: SubmitHandler<RegisterFormInputs> = (data) => {
    if (data.role === '') return;

    const normalizedWebsite = toLowerTrimOptional(data.website);
    const formData = new FormData();
    formData.append('fullName', toLowerTrim(data.fullName));
    formData.append('email', toLowerTrim(data.email));
    formData.append('phoneNumber', toLowerTrim(data.phoneNumber));
    formData.append('companyName', toLowerTrim(data.companyName));
    formData.append('password', data.password);
    formData.append('role', toLowerTrim(data.role));
    
    if (normalizedWebsite) formData.append('website', normalizedWebsite);
    if (data.role === 'buyer') formData.append('address', toLowerTrim(data.address));

    if (data.tradeLicense?.[0]) formData.append('tradeLicense', data.tradeLicense[0]);
    if (data.idDocument?.[0]) formData.append('idDocument', data.idDocument[0]);
    if (data.vatRegistration?.[0]) formData.append('vatRegistration', data.vatRegistration[0]);

    dispatch(registerUser(formData)).then(action => {
      if (registerUser.fulfilled.match(action)) {
        setMessage({ type: 'success', text: 'Registration successful! Please log in.' });
        setTimeout(() => navigate('/login'), 1000);
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-white px-10 py-6 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center text-3xl font-black text-gray-900 tracking-tighter italic">
            <Building className="w-10 h-10 text-brand-red mr-2" />
            <span>Techtronics<span className="text-brand-red"> Ventures</span></span>
          </Link>
          <h2 className="mt-3 text-2xl font-black text-gray-900 uppercase tracking-tight">
            Create account
          </h2>
        </div>

        <form className="mt-8" onSubmit={handleSubmit(onSubmit)}>
          {message && (
            <div className={`${message.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'} border px-4 py-3 rounded-md mb-4 flex justify-between items-start`} role="alert">
              <div className="text-sm font-bold">{message.text}</div>
              <button type="button" onClick={() => setMessage(null)} className="ml-4 text-xs font-black uppercase tracking-widest">Close</button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            <InputWrapper label="Full Name" error={errors.fullName}>
              <input
                {...register('fullName', { required: 'Full name is required' })}
                placeholder="Full Name"
                className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-brand-red focus:ring-4 focus:ring-red-500/5 transition-all font-bold text-sm"
              />
            </InputWrapper>

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
                placeholder="Select or enter company"
                list="company-names"
                className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-brand-red focus:ring-4 focus:ring-red-500/5 transition-all font-bold text-sm"
              />
              <datalist id="company-names">
                {companyNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </InputWrapper>

            <InputWrapper label="Website Link" error={errors.website}>
              <input
                {...register('website')}
                placeholder="e.g. https://www.company.com"
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

            {(role === 'buyer' || role === 'vendor') && (
              <>
                <InputWrapper label="Trade License (PDF)" error={errors.tradeLicense}>
                  <input
                    {...register('tradeLicense', { required: 'Trade License is required' })}
                    type="file"
                    accept=".pdf"
                    className="w-full px-4 py-2 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-brand-red transition-all font-bold text-sm"
                  />
                </InputWrapper>
                <InputWrapper label="Owner ID Document (PDF)" error={errors.idDocument}>
                  <input
                    {...register('idDocument', { required: 'ID Document is required' })}
                    type="file"
                    accept=".pdf"
                    className="w-full px-4 py-2 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-brand-red transition-all font-bold text-sm"
                  />
                </InputWrapper>
                <InputWrapper label="VAT Registration (PDF)" error={errors.vatRegistration}>
                  <input
                    {...register('vatRegistration', { required: 'VAT Registration is required' })}
                    type="file"
                    accept=".pdf"
                    className="w-full px-4 py-2 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-brand-red transition-all font-bold text-sm"
                  />
                </InputWrapper>
                <div></div> {/* Spacer for grid */}
              </>
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
