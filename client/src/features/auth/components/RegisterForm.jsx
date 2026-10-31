import React, { useState } from 'react';
import { useTranslation } from '../../../context/LanguageContext';
import { authService } from '../../../services/auth.service';

export const RegisterForm = ({ onRegisterSuccess, switchToLogin }) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [location, setLocation] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const payload = {
                name: name.trim(),
                email: email.trim(),
                password,
            };
            if (mobileNumber.trim()) {
                payload.mobileNumber = mobileNumber.trim();
            }
            if (location.trim()) {
                payload.location = location.trim();
            }

            await authService.register(payload);
            onRegisterSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-7 sm:p-9 rounded-2xl shadow-card border border-emerald-100/80 max-w-md mx-auto">
            {/* Header with Icon */}
            <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-green-100 border border-emerald-200/60 mb-3 shadow-inner">
                    <img src="/logo.svg" alt="" className="w-8 h-8" aria-hidden="true" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">{t('auth.regTitle', 'Farmer Registration')}</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    {t('auth.regSubhead', 'Create your KrishiMitra AI account to get tailored crop insights.')}
                </p>
            </div>

            {error && (
                <div role="alert" className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-start gap-2.5 text-sm">
                    <svg className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" strokeWidth="2" />
                        <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="12" cy="16" r="1" fill="currentColor" />
                    </svg>
                    <p className="font-semibold text-sm">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        {t('auth.fullNameLabel', 'Full Name')} <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-800 placeholder-slate-400 text-sm shadow-sm"
                        placeholder={t('auth.fullNamePlaceholder', 'Enter your full name')}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        {t('auth.emailLabel', 'Email Address')} <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-800 placeholder-slate-400 text-sm shadow-sm"
                        placeholder={t('auth.emailPlaceholder', 'Enter your email')}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        {t('auth.passwordLabel', 'Password')} <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-800 placeholder-slate-400 text-sm shadow-sm"
                        placeholder={t('auth.choosePasswordPlaceholder', 'Choose a strong password')}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        {t('auth.mobileNumberLabel', 'Mobile Number')} <span className="text-xs text-slate-400 font-normal lowercase">({t('common.optional', 'optional')})</span>
                    </label>
                    <input
                        type="tel"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-800 placeholder-slate-400 text-sm shadow-sm"
                        placeholder={t('auth.mobileNumberPlaceholder', 'e.g. +91 9876543210')} /* placeholder="e.g. +91 9876543210" */
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        {t('auth.farmLocationLabel', 'Farming Location / District')} <span className="text-xs text-slate-400 font-normal lowercase">({t('common.optional', 'optional')})</span>
                    </label>
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-800 placeholder-slate-400 text-sm shadow-sm"
                        placeholder={t('auth.farmLocationPlaceholder', 'e.g. Pune, Maharashtra')} /* placeholder="e.g. Pune, Maharashtra" */
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 text-sm flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                            </svg>
                            <span>{t('auth.registering', 'Registering...')}</span>
                        </>
                    ) : (
                        t('auth.registerBtn', 'Register')
                    )}
                </button>
                <div className="text-center pt-2 text-sm text-slate-600 border-t border-slate-100">
                    {t('auth.hasAccount', 'Already have an account?')}{' '}
                    <button
                        type="button"
                        onClick={switchToLogin}
                        className="text-emerald-700 font-bold hover:text-emerald-800 hover:underline focus:outline-none focus:underline"
                    >
                        {t('auth.loginHere', 'Login here')}
                    </button>
                </div>
            </form>
        </div>
    );
};
