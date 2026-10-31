/**
 * client/src/context/LanguageContext.jsx
 * ---------------------------------------------------------------------------
 * Provides centralized internationalization (English & Hindi) for KrishiMitra AI.
 *
 * Capabilities:
 * - Reactive language state ('en' | 'hi') with zero full-page reload
 * - LocalStorage persistence ('krishimitra_lang')
 * - Default 'en' for first-time / unconfigured users
 * - Nested translation key traversal (e.g. 'common.appName')
 * - Named token interpolation (e.g. {name}, {count})
 * - Graceful fallback: Current Lang -> English -> Fallback string -> Key
 * ---------------------------------------------------------------------------
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import en from '../locales/en.js';
import hi from '../locales/hi.js';

export const STORAGE_KEY = 'krishimitra_lang';
export const DEFAULT_LANGUAGE = 'en';

export const SUPPORTED_LANGUAGES = [
    { code: 'en', label: 'English', nativeLabel: 'English' },
    { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
];

const dictionaries = { en, hi };

const LanguageContext = createContext(null);

function resolvePath(obj, pathStr) {
    if (!obj || !pathStr) return undefined;
    const parts = pathStr.split('.');
    let curr = obj;
    for (const part of parts) {
        if (curr == null || typeof curr !== 'object') return undefined;
        curr = curr[part];
    }
    return curr;
}

export function LanguageProvider({ children }) {
    const [language, setLanguageState] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved && (saved === 'en' || saved === 'hi')) {
                return saved;
            }
        } catch {
            // localStorage unavailable (e.g. sandboxed iframe or private browsing)
        }
        return DEFAULT_LANGUAGE;
    });

    const setLanguage = useCallback((newLang) => {
        if (newLang !== 'en' && newLang !== 'hi') return;
        setLanguageState(newLang);
        try {
            localStorage.setItem(STORAGE_KEY, newLang);
        } catch {
            // ignore
        }
    }, []);

    useEffect(() => {
        try {
            document.documentElement.lang = language;
        } catch {
            // ignore in non-browser environments
        }
    }, [language]);

    /**
     * Flexible translation helper:
     * - t('key')
     * - t('key', { name: 'Harshit' })
     * - t('key', 'Default text')
     * - t('key', 'Default with {count}', { count: 3 })
     */
    const t = useCallback((key, fallbackOrParams, params) => {
        let fallback = null;
        let interpolations = null;

        if (typeof fallbackOrParams === 'object' && fallbackOrParams !== null) {
            interpolations = fallbackOrParams;
        } else if (typeof fallbackOrParams === 'string') {
            fallback = fallbackOrParams;
            if (typeof params === 'object' && params !== null) {
                interpolations = params;
            }
        } else if (typeof params === 'object' && params !== null) {
            interpolations = params;
        }

        const currentDict = dictionaries[language] || dictionaries.en;
        let template = resolvePath(currentDict, key);

        // Fallback to English dictionary if key is missing in active locale
        if (template === undefined && language !== 'en') {
            template = resolvePath(dictionaries.en, key);
        }

        // Fallback to explicitly passed fallback string or key
        if (template === undefined) {
            template = fallback !== null ? fallback : key;
        }

        if (typeof template !== 'string') {
            return template;
        }

        if (interpolations) {
            return template.replace(/\{(\w+)\}/g, (match, token) => {
                return token in interpolations ? String(interpolations[token]) : match;
            });
        }

        return template;
    }, [language]);

    const value = useMemo(() => ({
        language,
        setLanguage,
        t,
        languages: SUPPORTED_LANGUAGES,
        isHindi: language === 'hi',
    }), [language, setLanguage, t]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (!ctx) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return ctx;
}

export function useTranslation() {
    return useLanguage();
}

export default LanguageContext;
