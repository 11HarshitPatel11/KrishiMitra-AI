import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import { Footer } from '../components/common/Footer';

export const LandingPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const scrollToFeatures = () => {
        const el = document.getElementById('features');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFAF7] flex flex-col justify-between">
            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-stone-200 bg-gradient-to-b from-green-50/50 via-white to-[#FAFAF7]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                            
                            {/* Hero Copy */}
                            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 border border-green-200 text-green-900 text-xs font-bold tracking-wide uppercase">
                                    <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></span>
                                    {t('landing.badge', 'AI-Driven Farm Intelligence')}
                                </div>

                                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-stone-900 tracking-tight leading-[1.1]">
                                    {t('landing.heroHeadline1', 'Grow Smarter.')} <br />
                                    <span className="text-green-700">{t('landing.heroHeadline2', 'Farm Better.')}</span>
                                </h1>

                                <p className="text-lg sm:text-xl text-stone-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                                    {t('landing.heroSubhead', 'Make informed farming decisions with AI-powered crop recommendations, soil insights, and plant disease detection.')}
                                </p>

                                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/register')}
                                        className="w-full sm:w-auto px-7 py-3.5 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all text-base flex items-center justify-center gap-2"
                                    >
                                        <span>{t('common.getStarted', 'Get Started')}</span>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={scrollToFeatures}
                                        className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 font-bold rounded-xl shadow-sm hover:shadow transition-all text-base"
                                    >
                                        {t('landing.exploreFeatures', 'Explore Features')}
                                    </button>
                                </div>

                                {/* Key Highlights */}
                                <div className="pt-6 border-t border-stone-200/80 grid grid-cols-3 gap-4 text-center lg:text-left">
                                    <div>
                                        <p className="text-2xl font-black text-stone-900">22+</p>
                                        <p className="text-xs text-stone-500 font-medium mt-0.5">{t('landing.statCrops', 'Recommended Crops')}</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-stone-900">38</p>
                                        <p className="text-xs text-stone-500 font-medium mt-0.5">{t('landing.statDiseases', 'Plant Disease Classes')}</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-stone-900">100%</p>
                                        <p className="text-xs text-stone-500 font-medium mt-0.5">{t('landing.statModels', 'Objective ML Models')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Hero Visual */}
                            <div className="lg:col-span-5 relative flex justify-center">
                                <div className="w-full max-w-lg relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-white">
                                    <img
                                        src="/hero-landscape.svg"
                                        alt="Indian agricultural landscape with smart farming sensors"
                                        className="w-full h-auto object-cover"
                                    />
                                    <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-sm p-3 rounded-xl border border-stone-200 shadow-sm flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">
                                                🌾
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-stone-800">{t('landing.cardPrecisionTitle', 'Precision Soil & Weather')}</p>
                                                <p className="text-[11px] text-stone-500">{t('landing.cardPrecisionSubtitle', 'Live agro-climatic alignment')}</p>
                                            </div>
                                        </div>
                                        <span className="text-[11px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200">
                                            {t('common.active', 'Active')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-16 md:py-24 bg-white border-b border-stone-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
                            <span className="text-xs font-bold text-green-800 tracking-wider uppercase px-3 py-1 rounded-full bg-green-100 inline-block">
                                {t('landing.coreCapabilitiesBadge', 'Core Capabilities')}
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
                                {t('landing.featuresHeading', 'Built for Everyday Agricultural Decisions')}
                            </h2>
                            <p className="text-stone-600 text-base leading-relaxed">
                                {t('landing.featuresSubhead', 'Every feature is grounded in verified agricultural datasets and validated machine learning models.')}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Feature 1: Crop Advisor */}
                            <div className="bg-[#FAFAF7] rounded-2xl p-6 border border-stone-200 hover:border-green-300 hover:shadow-lg transition-all group flex flex-col justify-between">
                                <div className="space-y-4">
                                    <div className="w-16 h-16 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center p-2 group-hover:scale-105 transition-transform">
                                        <img src="/feature-crop.svg" alt="Crop Advisor" className="w-full h-full" />
                                    </div>
                                    <h3 className="text-xl font-bold text-stone-900 group-hover:text-green-800 transition-colors">
                                        {t('landing.cropAdvisorTitle', 'Crop Advisor')}
                                    </h3>
                                    <p className="text-stone-600 text-sm leading-relaxed">
                                        {t('landing.cropAdvisorDesc', 'Discover crops suited to your soil and environmental conditions.')}
                                    </p>
                                </div>
                                <div className="pt-6">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/recommendation')}
                                        className="text-sm font-bold text-green-700 hover:text-green-900 flex items-center gap-1.5 transition-colors"
                                    >
                                        <span>{t('landing.cropAdvisorBtn', 'Find Suitable Crops')}</span>
                                        <span aria-hidden="true">&rarr;</span>
                                    </button>
                                </div>
                            </div>

                            {/* Feature 2: Soil Insights */}
                            <div className="bg-[#FAFAF7] rounded-2xl p-6 border border-stone-200 hover:border-amber-300 hover:shadow-lg transition-all group flex flex-col justify-between">
                                <div className="space-y-4">
                                    <div className="w-16 h-16 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center p-2 group-hover:scale-105 transition-transform">
                                        <img src="/feature-soil.svg" alt="Soil Insights" className="w-full h-full" />
                                    </div>
                                    <h3 className="text-xl font-bold text-stone-900 group-hover:text-amber-800 transition-colors">
                                        {t('landing.soilInsightsTitle', 'Soil Insights')}
                                    </h3>
                                    <p className="text-stone-600 text-sm leading-relaxed">
                                        {t('landing.soilInsightsDesc', 'Enter soil parameters to support better crop decisions.')}
                                    </p>
                                </div>
                                <div className="pt-6">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/soil')}
                                        className="text-sm font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1.5 transition-colors"
                                    >
                                        <span>{t('landing.soilInsightsBtn', 'Analyze Soil Data')}</span>
                                        <span aria-hidden="true">&rarr;</span>
                                    </button>
                                </div>
                            </div>

                            {/* Feature 3: Plant Health */}
                            <div className="bg-[#FAFAF7] rounded-2xl p-6 border border-stone-200 hover:border-teal-300 hover:shadow-lg transition-all group flex flex-col justify-between">
                                <div className="space-y-4">
                                    <div className="w-16 h-16 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center p-2 group-hover:scale-105 transition-transform">
                                        <img src="/feature-disease.svg" alt="Plant Health" className="w-full h-full" />
                                    </div>
                                    <h3 className="text-xl font-bold text-stone-900 group-hover:text-teal-800 transition-colors">
                                        {t('landing.plantHealthTitle', 'Plant Health')}
                                    </h3>
                                    <p className="text-stone-600 text-sm leading-relaxed">
                                        {t('landing.plantHealthDesc', 'Upload a leaf image to check for possible plant diseases.')}
                                    </p>
                                </div>
                                <div className="pt-6">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/disease')}
                                        className="text-sm font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1.5 transition-colors"
                                    >
                                        <span>{t('landing.plantHealthBtn', 'Upload Leaf Photo')}</span>
                                        <span aria-hidden="true">&rarr;</span>
                                    </button>
                                </div>
                            </div>

                            {/* Feature 4: Market Prices */}
                            <div className="bg-[#FAFAF7] rounded-2xl p-6 border border-stone-200 hover:border-purple-300 hover:shadow-lg transition-all group flex flex-col justify-between">
                                <div className="space-y-4">
                                    <div className="w-16 h-16 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center p-2 group-hover:scale-105 transition-transform">
                                        <img src="/feature-market.svg" alt="Market Prices" className="w-full h-full" />
                                    </div>
                                    <h3 className="text-xl font-bold text-stone-900 group-hover:text-purple-800 transition-colors">
                                        {t('landing.marketPricesTitle', 'Market Prices')}
                                    </h3>
                                    <p className="text-stone-600 text-sm leading-relaxed">
                                        {t('landing.marketPricesDesc', 'Explore available agricultural market information.')}
                                    </p>
                                </div>
                                <div className="pt-6">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/market')}
                                        className="text-sm font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1.5 transition-colors"
                                    >
                                        <span>{t('landing.marketPricesBtn', 'View Market Prices')}</span>
                                        <span aria-hidden="true">&rarr;</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section className="py-16 md:py-24 bg-[#FAFAF7] border-b border-stone-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
                            <span className="text-xs font-bold text-stone-600 tracking-wider uppercase px-3 py-1 rounded-full bg-stone-200 inline-block">
                                {t('landing.workflowBadge', 'Simple Workflow')}
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
                                {t('landing.howItWorksHeading', 'How It Works')}
                            </h2>
                            <p className="text-stone-600 text-base">
                                {t('landing.howItWorksSubhead', 'Three straightforward steps to guide your farm planning.')}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                            {/* Step 1 */}
                            <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm relative">
                                <div className="w-12 h-12 rounded-xl bg-green-100 text-green-800 font-black text-xl flex items-center justify-center mb-6">
                                    1
                                </div>
                                <h3 className="text-xl font-bold text-stone-900 mb-2">
                                    {t('landing.step1Title', 'Enter Farm & Soil Details')}
                                </h3>
                                <p className="text-stone-600 text-sm leading-relaxed">
                                    {t('landing.step1Desc', 'Enter your farm and soil details, including nitrogen, phosphorus, potassium, and pH.')}
                                </p>
                            </div>

                            {/* Step 2 */}
                            <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm relative">
                                <div className="w-12 h-12 rounded-xl bg-green-100 text-green-800 font-black text-xl flex items-center justify-center mb-6">
                                    2
                                </div>
                                <h3 className="text-xl font-bold text-stone-900 mb-2">
                                    {t('landing.step2Title', 'Receive AI Recommendations')}
                                </h3>
                                <p className="text-stone-600 text-sm leading-relaxed">
                                    {t('landing.step2Desc', 'Get an AI-generated crop recommendation aligned with live weather and soil chemistry.')}
                                </p>
                            </div>

                            {/* Step 3 */}
                            <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm relative">
                                <div className="w-12 h-12 rounded-xl bg-green-100 text-green-800 font-black text-xl flex items-center justify-center mb-6">
                                    3
                                </div>
                                <h3 className="text-xl font-bold text-stone-900 mb-2">
                                    {t('landing.step3Title', 'Monitor Health & Markets')}
                                </h3>
                                <p className="text-stone-600 text-sm leading-relaxed">
                                    {t('landing.step3Desc', 'Check plant health and explore market information to plan your seasonal sales.')}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Closing CTA */}
                <section className="py-16 md:py-20 bg-gradient-to-r from-green-800 via-green-900 to-emerald-900 text-white text-center">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                            {t('landing.ctaHeading', 'Make Your Next Farming Decision with Confidence')}
                        </h2>
                        <p className="text-green-100 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                            {t('landing.ctaSubhead', 'Join Indian farmers using KrishiMitra AI to select optimal crops, evaluate soil health, and diagnose plant conditions early.')}
                        </p>
                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={() => navigate('/register')}
                                className="px-8 py-4 bg-white hover:bg-stone-100 text-green-900 font-extrabold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-base"
                            >
                                {t('landing.startExploring', 'Start Exploring')}
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};
