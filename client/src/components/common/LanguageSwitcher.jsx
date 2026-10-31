/**
 * client/src/components/common/LanguageSwitcher.jsx
 * ---------------------------------------------------------------------------
 * Compact, accessible language selector component for KrishiMitra AI navbar.
 * Supports switching between English and Hindi (हिंदी) with immediate reactive
 * context update and localStorage persistence.
 * ---------------------------------------------------------------------------
 */

import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function LanguageSwitcher({ className = '' }) {
    const { language, setLanguage, t } = useLanguage();

    const handleChange = (e) => {
        setLanguage(e.target.value);
    };

    return (
        <div className={`relative inline-flex items-center ${className}`}>
            <label htmlFor="language-switcher" className="sr-only">
                {t('common.language', 'Language')}
            </label>
            <div className="relative inline-flex items-center">
                <span
                    className="absolute left-2.5 text-xs pointer-events-none text-slate-500"
                    aria-hidden="true"
                >
                    🌐
                </span>
                <select
                    id="language-switcher"
                    value={language}
                    onChange={handleChange}
                    aria-label="Select application language"
                    className="appearance-none bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm pl-7 pr-7 py-1.5 sm:py-2 rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer transition-colors"
                >
                    <option value="en">English</option>
                    <option value="hi">हिंदी</option>
                </select>
                <span
                    className="absolute right-2 pointer-events-none text-[10px] text-slate-400"
                    aria-hidden="true"
                >
                    ▼
                </span>
            </div>
        </div>
    );
}
