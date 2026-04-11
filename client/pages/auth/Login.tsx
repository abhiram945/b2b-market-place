import React, { useEffect } from 'react';
import { useForm, SubmitHandler, SubmitErrorHandler } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { loginUser } from '../../redux/slices/userSlice';
import { RootState, AppDispatch } from '../../redux/store';
import { toLowerTrim } from '../../utils/normalize';
import { useAlert } from '../../contexts/AlertContext';
import { apiErrorsToAlertItems, formErrorsToAlertItems } from '../../utils/alertHelpers';
import logo from "../../assets/transparent-logo.png";

type LoginFormInputs = {
  email: string;
  password: string;
};

const Login: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, isAuthenticated, user } = useSelector((state: RootState) => state.user);
  const { showAlert } = useAlert();
  
  const from = location.state?.from?.pathname || '/dashboard';

  const { register, handleSubmit } = useForm<LoginFormInputs>();

  useEffect(() => {
    if (isAuthenticated && user && user.role) {
      if (user.role === 'admin') {
        navigate('/admin-dashboard', { replace: true });
      } else if (user.role === 'buyer') {
        navigate('/buyer-dashboard', { replace: true });
      } else if (user.role === 'vendor') {
        navigate('/vendor-dashboard', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, navigate, from, user]);

  const onSubmit: SubmitHandler<LoginFormInputs> = (data) => {
    dispatch(loginUser({
      email: toLowerTrim(data.email),
      password: data.password,
    })).unwrap().catch((submitError) => {
      showAlert({
        variant: 'error',
        title: 'login failed',
        items: apiErrorsToAlertItems(submitError),
        message: apiErrorsToAlertItems(submitError).length === 0 ? 'invalid email or password' : undefined,
      });
    });
  };

  const onInvalid: SubmitErrorHandler<LoginFormInputs> = (formErrors) => {
    showAlert({
      variant: 'error',
      title: 'fix login fields',
      items: formErrorsToAlertItems(formErrors),
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        <div>
          <Link to="/" className="mx-auto h-12 w-auto flex items-center justify-center text-3xl font-black text-gray-900 tracking-tighter italic">
            <img src={logo} alt='' className='w-20'/>
            <span className="text-brand-red">Market<span className="text-black"> Mea</span></span>
          </Link>
          <h2 className="mt-8 text-center text-3xl font-black text-gray-900 uppercase tracking-tight">
            SIGN IN
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500 font-medium">
            AUTHORIZED PERSONNEL ONLY
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit, onInvalid)}>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
                    message: 'Invalid email address'
                  }
                })}
                id="email-address"
                type="email"
                className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-100 placeholder-gray-300 text-gray-900 rounded-xl focus:outline-none focus:border-brand-red focus:ring-4 focus:ring-red-500/5 transition-all sm:text-sm font-bold"
                placeholder="user@gmail.com"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
              <input
                {...register('password', {
                  required: 'Password is required'
                })}
                id="password"
                type="password"
                className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-100 placeholder-gray-300 text-gray-900 rounded-xl focus:outline-none focus:border-brand-red focus:ring-4 focus:ring-red-500/5 transition-all sm:text-sm font-bold"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-xs font-black tracking-[0.2em] rounded-xl text-white bg-black hover:bg-brand-red focus:outline-none transition-all disabled:opacity-50 shadow-xl active:scale-95 cursor-pointer"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-100 text-center space-y-4">
            <p className="text-xs text-gray-500 font-bold tracking-wider">
                New here?{' '}
                <Link to="/register" className="text-brand-red hover:underline decoration-2 underline-offset-4">
                  Create account
                </Link>
            </p>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
                Support: <a href="mailto:support@b2bmarket.com" className="hover:text-gray-900">support@b2bmarket.com</a>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
