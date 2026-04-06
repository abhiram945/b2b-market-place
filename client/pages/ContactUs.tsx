
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building } from '../components/icons';

const ContactUs: React.FC = () => {
    const navigate = useNavigate();

    const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ type: 'success', text: 'Thank you for your message! We will get back to you soon.' });
        setTimeout(() => navigate('/'), 1000);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <Link to="/" className="mx-auto h-12 w-auto flex items-center justify-center text-3xl font-bold text-gray-900">
                        <Building className="w-10 h-10 text-blue-600" />
                        <span className="ml-2">Marketplace</span>
                    </Link>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Contact Us
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Have a question? We'd love to hear from you.
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {message && (
                        <div className={`${message.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'} border px-4 py-3 rounded-md mb-4 flex justify-between items-start`} role="alert">
                            <div className="text-sm font-bold">{message.text}</div>
                            <button type="button" onClick={() => setMessage(null)} className="ml-4 text-xs font-black uppercase tracking-widest">Close</button>
                        </div>
                    )}
                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label htmlFor="name" className="sr-only">Full Name</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Full Name"
                            />
                        </div>
                        <div>
                            <label htmlFor="email-address" className="sr-only">Email address</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Email address"
                            />
                        </div>
                        <div>
                            <label htmlFor="message" className="sr-only">Message</label>
                            <textarea
                                id="message"
                                name="message"
                                rows={4}
                                required
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Your message..."
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Send Message
                        </button>
                    </div>
                </form>
                 <div className="text-center">
                    <p className="mt-2 text-sm text-gray-600">
                        <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                            Back to Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ContactUs;
