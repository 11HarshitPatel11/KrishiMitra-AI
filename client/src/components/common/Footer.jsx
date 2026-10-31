import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext';

export const Footer = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <footer className="w-full mt-16 border-t border-stone-200 bg-white text-stone-600 text-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand column */}
                    <div className="md:col-span-2 space-y-3">
                        <div className="flex items-center gap-2.5">
                            <img src="/logo.svg" alt="KrishiMitra AI Logo" className="w-8 h-8" />
                            <span className="font-extrabold text-xl text-stone-900 tracking-tight">
                                KrishiMitra <span className="text-green-700 font-black">AI</span>
                            </span>
                        </div>
                        <p className="text-stone-500 text-sm max-w-md leading-relaxed">
                            {t('common.footerTagline', 'Empowering Indian farmers with scientifically evaluated machine learning recommendations, agro-climatic soil intelligence, and instant crop leaf diagnostics.')}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-stone-400 pt-1">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span>{t('common.liveAdvisoryIntel', 'Live Advisory Intelligence • Transparent Decision Support')}</span>
                        </div>
                    </div>

                    {/* Solutions column */}
                    <div>
                        <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider mb-3">
                            {t('common.platformFeatures', 'Platform Features')}
                        </h4>
                        <ul className="space-y-2 text-xs">
                            <li>
                                <button onClick={() => navigate('/recommendation')} className="hover:text-green-700 transition-colors">
                                    {t('common.cropAdvisor', 'Crop Advisor')}
                                </button>
                            </li>
                            <li>
                                <button onClick={() => navigate('/soil')} className="hover:text-green-700 transition-colors">
                                    {t('common.soilInsights', 'Soil Insights & Grids')}
                                </button>
                            </li>
                            <li>
                                <button onClick={() => navigate('/disease')} className="hover:text-green-700 transition-colors">
                                    {t('common.plantHealth', 'Plant Health Detection')}
                                </button>
                            </li>
                            <li>
                                <button onClick={() => navigate('/market')} className="hover:text-green-700 transition-colors">
                                    {t('common.mandiMarket', 'Mandi Market Intelligence')}
                                </button>
                            </li>
                            <li>
                                <button onClick={() => navigate('/farms')} className="hover:text-green-700 transition-colors">
                                    {t('common.farmManagement', 'Farm Management')}
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Trust & Ethics */}
                    <div>
                        <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider mb-3">
                            {t('common.scientificAdvisoryTitle', 'Scientific Advisory')}
                        </h4>
                        <p className="text-xs text-stone-500 leading-relaxed">
                            {t('common.scientificAdvisoryText', 'KrishiMitra AI outputs represent verified machine learning inference. Always cross-reference critical agronomic interventions with local Krishi Vigyan Kendras (KVK).')}
                        </p>
                        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-2 text-xs text-stone-400">
                            <span>{t('common.designedForIndia', 'Designed for Indian Agriculture')}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 gap-3">
                    <p>&copy; {new Date().getFullYear()} KrishiMitra AI. {t('common.allRightsReserved', 'All rights reserved.')}</p>
                    <p className="text-stone-400">
                        {t('common.finalYearProject', 'Final Year Major Project • Intelligent Agricultural Decision Support')}
                    </p>
                </div>
            </div>
        </footer>
    );
};
