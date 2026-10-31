import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LanguageProvider, useTranslation } from './context/LanguageContext';
import LanguageSwitcher from './components/common/LanguageSwitcher';
import { FarmForm } from './features/farm/components/FarmForm';
import { RecommendationForm } from './features/recommendation/components/RecommendationForm';
import { LoginForm } from './features/auth/components/LoginForm';
import { RegisterForm } from './features/auth/components/RegisterForm';
import { CropHistoryPage } from './features/cropHistory/components/CropHistoryPage';
import { MarketPage } from './features/market/components/MarketPage';
import { DiseaseDetectionPage } from './features/disease/components/DiseaseDetectionPage';
import { SoilInformationPage } from './features/soil/components/SoilInformationPage';
import { ProfilePage } from './features/auth/components/ProfilePage';
import { DashboardPage } from './pages/DashboardPage';
import { LandingPage } from './pages/LandingPage';
import { Footer } from './components/common/Footer';
import { authService } from './services/auth.service';

export const NAV_ITEMS = [
    { id: 'dashboard',      path: '/dashboard',      label: 'Dashboard',          icon: '📊' },
    { id: 'recommendation', path: '/recommendation', label: 'AI Recommendation',  icon: '🌱' },
    { id: 'farm',           path: '/farms',          label: 'Farm Management',    icon: '🏡' },
    { id: 'history',        path: '/history',        label: 'Crop History',       icon: '📜' },
    { id: 'market',         path: '/market',         label: 'Market Price',       icon: '📈' },
    { id: 'soil',           path: '/soil',           label: 'Soil Info',          icon: '🧪' },
    { id: 'disease',        path: '/disease',        label: 'Disease Detection',  icon: '🔬' },
    { id: 'profile',        path: '/profile',        label: 'Farmer Profile',     icon: '👤' },
];

/**
 * Route protection wrapper — redirects unauthenticated visitors to /login
 */
export const ProtectedRoute = ({ isAuthenticated, children }) => {
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

/**
 * Friendly 404 Fallback component for unknown URL routes
 */
export const NotFoundPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    return (
        <div className="bg-white p-8 rounded-2xl shadow-card border border-emerald-100 max-w-md mx-auto text-center my-12">
            <div className="text-5xl mb-4" aria-hidden="true">🌾</div>
            <h2 className="text-2xl font-extrabold text-slate-800 mb-2">{t('common.pageNotFound', 'Page Not Found')}</h2>
            <p className="text-slate-500 mb-6 text-sm">
                {t('common.pageNotFoundDesc', 'The requested URL does not match any KrishiMitra AI application section.')}
            </p>
            <button
                type="button"
                onClick={() => navigate('/recommendation')}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-5 rounded-xl shadow-sm transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
            >
                {t('common.returnToRecommendation', 'Return to AI Recommendation')}
            </button>
        </div>
    );
};

/**
 * Core application layout and interactive navigation shell
 */
export const AppLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Sync auth state if token is cleared or expired
    useEffect(() => {
        const authed = authService.isAuthenticated();
        setIsAuthenticated(authed);
    }, [location.pathname]);

    // Close mobile menu on Escape key press
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isMobileMenuOpen) {
                setIsMobileMenuOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isMobileMenuOpen]);

    // Automatically close mobile menu if viewport resizes to desktop width
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsMobileMenuOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
        setIsMobileMenuOpen(false);
        navigate('/dashboard');
    };

    const handleRegisterSuccess = () => {
        setIsMobileMenuOpen(false);
        navigate('/login');
    };

    const handleLogout = () => {
        authService.logout();
        setIsAuthenticated(false);
        setIsMobileMenuOpen(false);
        navigate('/login');
    };

    const handleNavClick = (target) => {
        const matched = NAV_ITEMS.find((item) => item.id === target || item.path === target);
        const destination = matched ? matched.path : target;
        navigate(destination);
        setIsMobileMenuOpen(false);
    };

    // Determine active nav item from URL pathname
    const isItemActive = (item) => {
        if (item.id === 'dashboard') {
            return location.pathname === '/dashboard';
        }
        if (item.id === 'recommendation') {
            return location.pathname === '/recommendation';
        }
        if (item.id === 'farm') {
            return location.pathname === '/farms' || location.pathname === '/farm';
        }
        return location.pathname === item.path;
    };

    const currentNavItem = NAV_ITEMS.find(isItemActive) || NAV_ITEMS[0];
    const isPublicLanding = location.pathname === '/' && !isAuthenticated;

    return (
        <div className="min-h-screen bg-[#FAFAF7] flex flex-col items-center justify-between overflow-x-hidden text-slate-800 font-sans">
            <div className="w-full flex flex-col flex-1">
                {/* Global Brand Navigation Bar */}
                <header className="w-full bg-white/95 backdrop-blur-md border-b border-emerald-100/80 sticky top-0 z-40 shadow-xs">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
                        {/* Logo & Brand Identity */}
                        <div
                            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
                            className="flex items-center gap-3 cursor-pointer group select-none"
                            role="button"
                            tabIndex={0}
                            aria-label="KrishiMitra AI Home"
                            onKeyDown={(e) => { if (e.key === 'Enter') navigate(isAuthenticated ? '/dashboard' : '/'); }}
                        >
                            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-700 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                                <img src="/logo.svg" alt="" className="w-7 h-7" aria-hidden="true" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-lg sm:text-xl font-extrabold text-emerald-950 tracking-tight">
                                        KrishiMitra AI
                                    </h1>
                                    <span className="hidden sm:inline-block text-[10px] uppercase tracking-wider font-extrabold bg-emerald-100/80 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                                        {t('common.agriTech', 'AgriTech')}
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                                    {t('common.appTagline', 'Crop Recommendation System')}
                                </p>
                            </div>
                        </div>

                        {/* Top Navigation Right Controls: Language Selector + Auth Actions */}
                        <div className="flex items-center gap-2 sm:gap-2.5">
                            <LanguageSwitcher />

                            {isAuthenticated ? (
                                <div className="hidden md:inline-flex items-center gap-2.5">
                                    <button
                                        onClick={() => navigate('/profile')}
                                        id="desktop-profile-btn"
                                        aria-label="View user profile"
                                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                                            location.pathname === '/profile'
                                                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-inner'
                                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                        }`}
                                    >
                                        <span aria-hidden="true">👤</span>
                                        <span>{t('common.profile', 'Profile')}</span>
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        id="desktop-logout-btn"
                                        aria-label="Log out of application"
                                        className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 text-rose-700 rounded-xl border border-rose-200/80 hover:bg-rose-100/70 transition-all text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-400"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        <span>{t('common.logout', 'Logout')}</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="px-4 py-2 text-xs sm:text-sm font-bold text-emerald-800 hover:text-emerald-950 rounded-xl hover:bg-emerald-50 transition-colors"
                                    >
                                        {t('common.signIn', 'Sign In')}
                                    </button>
                                    <button
                                        onClick={() => navigate('/register')}
                                        className="px-4 py-2 text-xs sm:text-sm font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        {t('common.getStarted', 'Get Started')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Authenticated Workspace Shell */}
                {isAuthenticated && (
                    <div className="w-full bg-white border-b border-slate-200/60 shadow-2xs">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            {/* Desktop Navigation Tab Bar (md and up) */}
                            <nav
                                aria-label="Main Desktop Navigation"
                                className="hidden md:flex items-center space-x-1 lg:space-x-2 py-2 overflow-x-auto"
                            >
                                {NAV_ITEMS.map((item) => {
                                    const isActive = isItemActive(item);
                                    return (
                                        <button
                                            key={item.id}
                                            id={`nav-tab-${item.id}`}
                                            onClick={() => handleNavClick(item.path)}
                                            aria-current={isActive ? 'page' : undefined}
                                            className={`flex items-center gap-2 px-3 lg:px-3.5 py-2 font-bold text-xs lg:text-sm rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 whitespace-nowrap ${
                                                isActive
                                                    ? 'bg-emerald-700 text-white shadow-sm'
                                                    : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50/70'
                                            }`}
                                        >
                                            <span aria-hidden="true">{item.icon}</span>
                                            <span>{t('nav.' + item.id, item.label)}</span>
                                        </button>
                                    );
                                })}
                            </nav>

                            {/* Mobile Navigation Bar & Drawer Toggle (small screens < md) */}
                            <div className="md:hidden py-2.5">
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2 px-1 min-w-0">
                                        <span className="text-xl" aria-hidden="true">{currentNavItem?.icon || '🌾'}</span>
                                        <div className="min-w-0">
                                            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider leading-none">
                                                {t('common.activeSection', 'Active Section')}
                                            </span>
                                            <span className="text-xs font-bold text-emerald-900 truncate block mt-0.5">
                                                {t('nav.' + currentNavItem?.id, currentNavItem?.label || 'Select View')}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        id="mobile-menu-toggle"
                                        onClick={() => setIsMobileMenuOpen(prev => !prev)}
                                        aria-expanded={isMobileMenuOpen}
                                        aria-controls="mobile-nav-menu"
                                        aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 shrink-0 ${
                                            isMobileMenuOpen
                                                ? 'bg-emerald-700 text-white border-emerald-700'
                                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                        }`}
                                    >
                                        {isMobileMenuOpen ? (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                <span>{t('common.close', 'Close')}</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
                                                </svg>
                                                <span>{t('common.menu', 'Menu')}</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Collapsible Mobile Navigation Dropdown */}
                                {isMobileMenuOpen && (
                                    <nav
                                        id="mobile-nav-menu"
                                        aria-label="Mobile Navigation Menu"
                                        className="mt-2 bg-white border border-slate-200 rounded-xl shadow-lg p-2 space-y-1"
                                    >
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                                            {t('common.applicationMenu', 'Application Menu')}
                                        </p>
                                        {NAV_ITEMS.map((item) => {
                                            const isActive = isItemActive(item);
                                            return (
                                                <button
                                                    key={item.id}
                                                    id={`mobile-nav-${item.id}`}
                                                    onClick={() => handleNavClick(item.path)}
                                                    aria-current={isActive ? 'page' : undefined}
                                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-xs sm:text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px] ${
                                                        isActive
                                                            ? 'bg-emerald-50 text-emerald-950 font-bold border-l-4 border-emerald-600'
                                                            : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-800 border-l-4 border-transparent'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="text-lg" aria-hidden="true">{item.icon}</span>
                                                        <span>{t('nav.' + item.id, item.label)}</span>
                                                    </div>
                                                    {isActive && (
                                                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                                                            {t('common.active', 'Active')}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}

                                        {/* Mobile Logout Option */}
                                        <div className="pt-2 mt-2 border-t border-slate-100">
                                            <button
                                                onClick={handleLogout}
                                                id="mobile-logout-btn"
                                                aria-label="Log out of application"
                                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400 min-h-[44px]"
                                            >
                                                <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                                <span>{t('common.logout', 'Log Out')}</span>
                                            </button>
                                        </div>
                                    </nav>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <main className={`flex-1 w-full ${isPublicLanding ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'}`}>
                    <Routes>
                        {/* Public Auth Routes */}
                        <Route
                            path="/login"
                            element={
                                isAuthenticated ? (
                                    <Navigate to="/recommendation" replace />
                                ) : (
                                    <div className="py-8">
                                        <LoginForm
                                            onLoginSuccess={handleLoginSuccess}
                                            switchToRegister={() => navigate('/register')}
                                        />
                                    </div>
                                )
                            }
                        />
                        <Route
                            path="/register"
                            element={
                                isAuthenticated ? (
                                    <Navigate to="/recommendation" replace />
                                ) : (
                                    <div className="py-8">
                                        <RegisterForm
                                            onRegisterSuccess={handleRegisterSuccess}
                                            switchToLogin={() => navigate('/login')}
                                        />
                                    </div>
                                )
                            }
                        />

                        {/* Public Landing Page */}
                        <Route
                            path="/landing"
                            element={<LandingPage />}
                        />

                        {/* Protected Application Routes */}
                        {/* Root path '/' redirects to recommendation or displays landing page: path="/" to="/recommendation" */}
                        <Route
                            path="/"
                            element={
                                isAuthenticated ? (
                                    <Navigate to="/dashboard" replace />
                                ) : (
                                    <LandingPage />
                                )
                            }
                        />
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute isAuthenticated={isAuthenticated}>
                                    <DashboardPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/recommendation"
                            element={
                                <ProtectedRoute isAuthenticated={isAuthenticated}>
                                    <RecommendationForm />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/farms"
                            element={
                                <ProtectedRoute isAuthenticated={isAuthenticated}>
                                    <FarmForm />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/farm"
                            element={<Navigate to="/farms" replace />}
                        />
                        <Route
                            path="/history"
                            element={
                                <ProtectedRoute isAuthenticated={isAuthenticated}>
                                    <CropHistoryPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/market"
                            element={
                                <ProtectedRoute isAuthenticated={isAuthenticated}>
                                    <MarketPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/soil"
                            element={
                                <ProtectedRoute isAuthenticated={isAuthenticated}>
                                    <SoilInformationPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/disease"
                            element={
                                <ProtectedRoute isAuthenticated={isAuthenticated}>
                                    <DiseaseDetectionPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/profile"
                            element={
                                <ProtectedRoute isAuthenticated={isAuthenticated}>
                                    <ProfilePage />
                                </ProtectedRoute>
                            }
                        />

                        {/* Fallback 404 Route */}
                        <Route
                            path="*"
                            element={<NotFoundPage />}
                        />
                    </Routes>
                </main>
            </div>

            {/* Global Footer (Visible across all routes except landing page which embeds it) */}
            {!isPublicLanding && <Footer />}
        </div>
    );
};

const App = () => {
    return (
        <LanguageProvider>
            <BrowserRouter>
                <AppLayout />
            </BrowserRouter>
        </LanguageProvider>
    );
};

export default App;
