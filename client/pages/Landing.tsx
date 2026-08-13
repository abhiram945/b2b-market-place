
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/common/Footer';
import { LogIn, UserPlus, Sun, Moon } from '../components/icons';
import { useTheme } from '../contexts/ThemeContext';
import logoDark from "../assets/navbar-logo-dark.png"
import logoLight from "../assets/navbar-logo-light.png"
import Verify from '../components/icons/Verify';
import Location from '../components/icons/Location';
import Parcel from '../components/icons/Parcel';
import Secure from '../components/icons/Secure';

import howMmWorks from "../assets/how-mm-works.png";

const Landing: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const [isHowMmWorksLoaded, setIsHowMmWorksLoaded] = useState(false);
    
    const features = [
        { name: 'Verified Suppliers', description: 'Only approved and trusted distributers' },
        { name: 'Multi-Country Trade', description: 'Trade across UAE, Africa and South Asia' },
        { name: 'Bulk Pricing', description: 'Request quotations for large volume orders' },
        { name: 'Secure Transactions', description: 'Encrypted payments and buyer protection' },
    ];

    return (
        <div className="bg-white dark:bg-zinc-950 font-sans selection:bg-red-600 selection:text-white">
            {/* Header */}
            <header className="absolute bg-[#FEFEFE] dark:bg-[#000000] inset-x-0 top-0 z-50 border-b border-gray-100 dark:border-zinc-800/50 backdrop-blur-md">
                <nav className="flex items-center justify-between px-4 py-1 lg:px-8 max-w-7xl mx-auto" aria-label="Global">
                    <div className="flex lg:flex-1">
                        <Link to="/" className="flex items-center text-2xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase">
                        <div className='w-64 h-16 overflow-hidden'>
                            <img src={logoLight} alt='Market Mea' className='w-full h-full object-cover logo-adaptive block dark:hidden'/>
                            <img src={logoDark} alt='Market Mea' className='w-full h-full object-cover logo-adaptive hidden dark:block'/>
                        </div>
                        </Link>
                    </div>
                    <div className="flex flex-1 justify-end items-center space-x-6">
                        {/* Theme Toggle */}
                        <button 
                            onClick={toggleTheme}
                            className="p-2 text-gray-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-500 transition-all cursor-pointer rounded-lg"
                            aria-label="Toggle theme"
                        >
                            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                        </button>

                        <Link to="/login" className="flex items-center text-xs font-black uppercase tracking-widest text-gray-900 dark:text-zinc-100 hover:text-red-600 dark:hover:text-red-500">
                            Log in <LogIn className="ml-2 w-4 h-4" />
                        </Link>
                        <Link to="/register" className="flex items-center rounded-none bg-red-600 px-5 py-2 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all active:scale-95">
                            Sign up <UserPlus className="ml-2 w-4 h-4" />
                        </Link>
                    </div>
                </nav>
            </header>

            <main className="isolate">
                {/* Hero section */}
                <div className="relative pt-14 overflow-hidden">
                    <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
                        <div className="relative left-[calc(50%-11rem)] aspect-1155/678 w-144.5 -translate-x-1/2 rotate-30 bg-linear-to-tr from-red-600 to-zinc-900 opacity-20 sm:left-[calc(50%-30rem)] sm:w-288.75" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }} />
                    </div>
                    
                    <div className="py-24 sm:py-32 lg:pb-40">
                        <div className="mx-auto max-w-7xl px-6 lg:px-8">
                            <div className="mx-auto max-w-3xl text-center">
                                <h1 className="text-5xl font-black tracking-tighter text-zinc-900 sm:text-7xl dark:text-white uppercase italic leading-none">
                                    GLOBAL TECHNOLOGY <br/> TRADE. <span className="text-red-600">SIMPLIFIED.</span>
                                </h1>
                                <p className="mt-8 text-lg font-medium leading-8 text-zinc-600 dark:text-zinc-400 uppercase tracking-tight">
                                    Connect with verified distributors, resellers,<br/>system integrators, and enterprise buyers across the world
                                </p>
                                <div className="mt-12 flex items-center justify-center gap-x-8">
                                    <Link to="/register" className="btn-red py-4 px-10 text-sm tracking-widest uppercase italic">
                                        Become a buyer
                                    </Link>
                                    <Link to="/register" className="btn-red py-4 px-10 text-sm tracking-widest uppercase italic">
                                        Become a seller
                                    </Link>
                                    <Link to="/products" className="text-sm font-black leading-6 text-zinc-900 dark:text-zinc-100 uppercase tracking-widest hover:text-red-600 flex items-center gap-2">
                                        Explore Products <span aria-hidden="true">→</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features section */}
                <div className="bg-zinc-50 py-8 dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl lg:text-center">
                            <h2 className="text-xs font-black leading-7 text-red-600 uppercase tracking-[0.3em] italic">System Core</h2>
                            <p className="mt-2 text-4xl font-black tracking-tighter text-zinc-900 sm:text-5xl dark:text-white uppercase italic">
                                Industrial-Grade <span className="text-red-600">Operations</span>
                            </p>
                        </div>
                        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
                            <dl className="grid max-w-xl grid-cols-1 gap-x-12 gap-y-16 lg:max-w-none lg:grid-cols-2">
                                {features.map((feature,idx) => (
                                    <div key={feature.name} className="relative pl-20 group">
                                        <dt className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white italic">
                                            <div className="absolute left-0 top-0 flex h-14 w-14 items-center justify-center bg-zinc-900 dark:bg-zinc-800 border border-zinc-800 group-hover:border-red-600 transition-colors rounded-full">
                                                {idx===0 && <Verify className='text-red-600 p-2'/>}
                                                {idx===1 && <Location className='text-red-600 p-2'/>}
                                                {idx===2 && <Parcel className='text-red-600 p-2'/>}
                                                {idx===3 && <Secure className='text-red-600 p-3'/>}
                                            </div>
                                            {feature.name}
                                        </dt>
                                        <dd className="mt-1 text-md leading-7 text-zinc-500 dark:text-zinc-400 font-medium tracking-tight">{feature.description}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    </div>
                </div>

                {/* How MarketMea works section */}
                <section className="relative isolate overflow-hidden bg-white px-6 py-16 lg:px-8 dark:bg-zinc-950">
                    <div className="relative overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                        {!isHowMmWorksLoaded && (
                            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800">
                                <div className="flex h-full min-h-[240px] items-center justify-center">
                                    <div className="space-y-4 w-full max-w-3xl px-6">
                                        <div className="h-6 w-1/3 rounded bg-white/60 dark:bg-zinc-600/60" />
                                        <div className="h-4 w-2/3 rounded bg-white/50 dark:bg-zinc-600/50" />
                                        <div className="h-4 w-1/2 rounded bg-white/50 dark:bg-zinc-600/50" />
                                    </div>
                                </div>
                            </div>
                        )}
                        <img
                            src={howMmWorks}
                            alt="how market mea works"
                            loading="lazy"
                            decoding="async"
                            onLoad={() => setIsHowMmWorksLoaded(true)}
                            className={`w-full rounded-2xl transition-opacity duration-300 ${isHowMmWorksLoaded ? 'opacity-100' : 'opacity-0'}`}
                        />
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default Landing;
