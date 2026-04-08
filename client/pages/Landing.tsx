
import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/common/Footer';
import { CheckCircle, LogIn, UserPlus } from '../components/icons';
import logo from "../assets/pdf-logo.png"

const Landing: React.FC = () => {
    
    const features = [
        { name: 'Global Reach', description: 'Connect with verified buyers and sellers from around the world.' },
        { name: 'Secure Transactions', description: 'End-to-end encrypted payments and robust escrow services.' },
        { name: 'Streamlined Logistics', description: 'Integrated shipping and logistics solutions for seamless delivery.' },
        { name: 'Powerful Analytics', description: 'Gain insights into your sales, purchases, and market trends.' },
    ];

    return (
        <div className="bg-white dark:bg-zinc-950 font-sans selection:bg-red-600 selection:text-white">
            {/* Header */}
            <header className="absolute inset-x-0 top-0 z-50 border-b border-gray-100/10 backdrop-blur-sm">
                <nav className="flex items-center justify-between p-4 lg:px-8 max-w-7xl mx-auto" aria-label="Global">
                    <div className="flex lg:flex-1">
                        <Link to="/" className="flex items-center text-2xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase">
                            <img src={logo} alt='techtronics ventures' className='w-12 h-12 mr-2'/>
                             <span className="text-red-600 mr-1">Techtronics</span> Ventures
                        </Link>
                    </div>
                    <div className="flex flex-1 justify-end space-x-6">
                        <Link to="/login" className="flex items-center text-xs font-black uppercase tracking-widest text-gray-900 hover:text-red-600 dark:text-gray-200 dark:hover:text-red-500 transition-colors">
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
                                    The Future of <span className="text-red-600">B2B</span> <br/>Commerce
                                </h1>
                                <p className="mt-8 text-lg font-medium leading-8 text-zinc-600 dark:text-zinc-400 uppercase tracking-tight">
                                    Empowering global enterprises through decentralized distribution. <br className="hidden md:inline"/> Secure, high-velocity trade for the modern industrial age.
                                </p>
                                <div className="mt-12 flex items-center justify-center gap-x-8">
                                    <Link to="/register" className="btn-red py-4 px-10 text-sm tracking-widest uppercase italic">
                                        Get started
                                    </Link>
                                    <Link to="/products" className="text-sm font-black leading-6 text-zinc-900 dark:text-zinc-100 uppercase tracking-widest hover:text-red-600 transition-colors flex items-center gap-2">
                                        Explore Products <span aria-hidden="true">→</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features section */}
                <div className="bg-zinc-50 py-24 sm:py-32 dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl lg:text-center">
                            <h2 className="text-xs font-black leading-7 text-red-600 uppercase tracking-[0.3em] italic">System Core</h2>
                            <p className="mt-2 text-4xl font-black tracking-tighter text-zinc-900 sm:text-5xl dark:text-white uppercase italic">
                                Industrial-Grade <span className="text-red-600">Operations</span>
                            </p>
                        </div>
                        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
                            <dl className="grid max-w-xl grid-cols-1 gap-x-12 gap-y-16 lg:max-w-none lg:grid-cols-2">
                                {features.map((feature) => (
                                    <div key={feature.name} className="relative pl-20 group">
                                        <dt className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white italic">
                                            <div className="absolute left-0 top-0 flex h-14 w-14 items-center justify-center bg-zinc-900 dark:bg-zinc-800 border border-zinc-800 group-hover:border-red-600 transition-colors">
                                                <CheckCircle className="h-6 w-6 text-red-600" />
                                            </div>
                                            {feature.name}
                                        </dt>
                                        <dd className="mt-2 text-sm leading-7 text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-tight">{feature.description}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    </div>
                </div>

                {/* Testimonials section */}
                <section className="relative isolate overflow-hidden bg-white px-6 py-24 sm:py-32 lg:px-8 dark:bg-zinc-950">
                     <div className="mx-auto max-w-2xl lg:max-w-4xl border-l-4 border-red-600 pl-8 lg:pl-16">
                        <figure>
                            <blockquote className="text-xl font-black leading-8 text-zinc-900 sm:text-2xl sm:leading-9 dark:text-white uppercase italic tracking-tighter">
                                <p>“This platform has revolutionized how we source materials. The efficiency and transparency are unmatched. It has saved us countless hours and significantly reduced our procurement costs.”</p>
                            </blockquote>
                            <figcaption className="mt-10 flex items-center gap-x-6">
                                <img className="h-14 w-14 rounded-none border-2 border-red-600 grayscale" src="https://i.pravatar.cc/100?u=jane" alt="" />
                                <div className="text-base">
                                    <div className="font-black text-zinc-900 dark:text-white uppercase tracking-widest italic">Jane Doe</div>
                                    <div className="text-xs font-black text-red-600 uppercase tracking-widest mt-1">CEO // Innovate Inc.</div>
                                </div>
                            </figcaption>
                        </figure>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default Landing;

