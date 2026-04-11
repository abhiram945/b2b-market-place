
import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler, SubmitErrorHandler } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { registerUser } from '../../redux/slices/userSlice';
import { AppDispatch, RootState } from '../../redux/store';
import api from '../../api';
import { toLowerTrim, toLowerTrimOptional } from '../../utils/normalize';
import { useAlert } from '../../contexts/AlertContext';
import { apiErrorsToAlertItems, formErrorsToAlertItems } from '../../utils/alertHelpers';
import logo from "../../assets/transparent-logo.png";

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

const InputWrapper = ({ label, children }: any) => (
  <div className="flex flex-col gap-1.5 min-h-[85px]">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
    {children}
  </div>
);

const Register: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.user);
  const [companyNames, setCompanyNames] = useState<string[]>([]);
  const { showAlert } = useAlert();

  const { register, handleSubmit, watch, reset } = useForm<RegisterFormInputs>({
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
    formData.append('address', toLowerTrim(data.address));

    if (data.tradeLicense?.[0]) formData.append('tradeLicense', data.tradeLicense[0]);
    if (data.idDocument?.[0]) formData.append('idDocument', data.idDocument[0]);
    if (data.vatRegistration?.[0]) formData.append('vatRegistration', data.vatRegistration[0]);

    dispatch(registerUser(formData)).then(action => {
      if (registerUser.fulfilled.match(action)) {
        showAlert({
          variant: 'success',
          title: 'registration successful',
          message: 'your account is pending approval.',
        });
        reset({
          fullName: '',
          email: '',
          phoneNumber: '',
          companyName: '',
          website: '',
          address: '',
          role: '',
          password: '',
          confirmPassword: '',
        });
      } else if (registerUser.rejected.match(action)) {
        showAlert({
          variant: 'error',
          title: 'registration failed',
          items: apiErrorsToAlertItems(action.payload),
          message: typeof action.payload === 'string' ? action.payload : undefined,
        });
      }
    });
  };

  const onInvalid: SubmitErrorHandler<RegisterFormInputs> = (formErrors) => {
    showAlert({
      variant: 'error',
      title: 'fix registration fields',
      items: formErrorsToAlertItems(formErrors),
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-white px-10 py-6 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center text-3xl font-black text-gray-900 tracking-tighter italic">
            <img src={logo} alt='' className='w-20'/>
            <span className="text-brand-red">Market<span className="text-black"> Mea</span></span>
          </Link>
          <h2 className="mt-3 text-2xl font-black text-gray-900 uppercase tracking-tight">
            Create account
          </h2>
        </div>

        <form className="mt-8" onSubmit={handleSubmit(onSubmit, onInvalid)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            <InputWrapper label="Full Name">
              <input
                {...register('fullName', { required: 'Full name is required' })}
                placeholder="Full Name"
                className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-brand-red focus:ring-4 focus:ring-red-500/5 transition-all font-bold text-sm"
              />
            </InputWrapper>

            <InputWrapper label="Email Address">
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

            <InputWrapper label="Phone Number">
              <input
                {...register('phoneNumber', { required: 'Phone number is required' })}
                placeholder="Phone Number (e.g. +1234567890)"
                type="tel"
                className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-brand-red focus:ring-4 focus:ring-red-500/5 transition-all font-bold text-sm"
              />
            </InputWrapper>

            <InputWrapper label="Company Name">
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

            <InputWrapper label="Website Link">
              <input
                {...register('website')}
                placeholder="e.g. https://www.company.com"
                className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-brand-red focus:ring-4 focus:ring-red-500/5 transition-all font-bold text-sm"
              />
            </InputWrapper>

            <InputWrapper label="Role">
              <select
                {...register('role', { required: 'Role is required' })}
                className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-brand-red focus:ring-4 focus:ring-red-500/5 transition-all font-bold text-sm bg-white"
              >
                <option value="" hidden>Select your role</option>
                <option value="buyer">Buyer</option>
                <option value="vendor">Vendor</option>
              </select>
            </InputWrapper>

            <div className="md:col-span-2">
              <InputWrapper label="Address">
                <textarea
                  {...register('address', { required: 'Address is required' })}
                  placeholder="Full Address"
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-brand-red focus:ring-4 focus:ring-red-500/5 transition-all font-bold text-sm resize-none"
                />
              </InputWrapper>
            </div>

            <InputWrapper label="Trade License (PDF)">
              <input
                {...register('tradeLicense', { required: 'Trade License is required' })}
                type="file"
                accept=".pdf"
                className="w-full px-4 py-2 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-brand-red transition-all font-bold text-sm"
              />
            </InputWrapper>
            <InputWrapper label="Owner ID Document (PDF)">
              <input
                {...register('idDocument', { required: 'ID Document is required' })}
                type="file"
                accept=".pdf"
                className="w-full px-4 py-2 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-brand-red transition-all font-bold text-sm"
              />
            </InputWrapper>
            <InputWrapper label="VAT Registration (PDF)">
              <input
                {...register('vatRegistration', { required: 'VAT Registration is required' })}
                type="file"
                accept=".pdf"
                className="w-full px-4 py-2 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-brand-red transition-all font-bold text-sm"
              />
            </InputWrapper>
            <div></div>

            <InputWrapper label="Password">
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

            <InputWrapper label="Confirm Password">
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
