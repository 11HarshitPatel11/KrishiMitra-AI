import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import { authService } from '../services/auth.service';
import { getAllFarms } from '../features/farm/services/farm.service';

export const DashboardPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [user, setUser] = useState(authService.getUser());
    const [farms, setFarms] = useState([]);
    const [loadingFarms, setLoadingFarms] = useState(true);

    useEffect(() => {
        // Fetch fresh profile & farms
        const loadDashboardData = async () => {
            try {
                const profileRes = await authService.getProfile();
                if (profileRes.data?.user) {
                    setUser(profileRes.data.user);
                }
            } catch {
                // Falls back to cached local user
            }

            try {
                const farmsRes = await getAllFarms();
                if (farmsRes.success && farmsRes.data) {
                    setFarms(farmsRes.data);
                }
            } catch {
                // Graceful fallback
            } finally {
                setLoadingFarms(false);
            }
        };

        loadDashboardData();
    }, []);

    const farmerName = user?.name || 'Farmer';
    const totalArea = farms.reduce((acc, f) => acc + (Number(f.area) || 0), 0);

    return (
        <div className="space-y-8 max-w-5xl mx-auto w-full">
            {/* Farmer Welcome Banner */}
            <div className="bg-gradient-to-r from-green-800 via-green-700 to-emerald-800 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
                <div className="relative z-10 space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-green-100 text-xs font-semibold backdrop-blur-sm">
                        <span>🌱</span>
                        <span>{t('dashboard.badge', 'Agricultural Dashboard')}</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
                        {t('dashboard.welcome', 'Namaste, {name}!', { name: farmerName })}
                    </h1>
                    <p className="text-green-100 text-sm sm:text-base max-w-2xl leading-relaxed">
                        {t('dashboard.subhead', 'Welcome to your KrishiMitra AI operations center. Run AI crop recommendations, diagnose plant leaf diseases, and track Mandi market rates.')}
                    </p>

                    {user?.location && (
                        <p className="text-xs text-green-200 font-medium pt-1 flex items-center gap-1.5">
                            <span>📍 {t('dashboard.registeredLocation', 'Registered Location:')}</span>
                            <span className="font-bold text-white">{user.location}</span>
                        </p>
                    )}
                </div>

                {/* Subtle graphic accent */}
                <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none select-none">
                    <img src="/logo.svg" alt="" className="w-56 h-56" />
                </div>
            </div>

            {/* Quick Action Grid */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-stone-900">
                        {t('dashboard.actionsHeading', 'Primary Agricultural Actions')}
                    </h2>
                    <span className="text-xs text-stone-500 font-medium">{t('dashboard.actionsSubhead', 'Select a tool to get started')}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Action 1: Crop Advisor */}
                    <div
                        onClick={() => navigate('/recommendation')}
                        className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm hover:shadow-md hover:border-green-300 transition-all cursor-pointer group flex flex-col justify-between"
                    >
                        <div className="space-y-3">
                            <div className="w-12 h-12 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center p-1.5 group-hover:scale-105 transition-transform">
                                <img src="/feature-crop.svg" alt="" className="w-full h-full" />
                            </div>
                            <h3 className="font-bold text-stone-900 group-hover:text-green-800 transition-colors text-base">
                                {t('common.cropAdvisor', 'Crop Advisor')}
                            </h3>
                            <p className="text-xs text-stone-600 leading-relaxed">
                                {t('dashboard.cropAdvisorDesc', 'Enter soil nutrients & get optimal crop recommendations evaluated by machine learning.')}
                            </p>
                        </div>
                        <div className="pt-4 mt-2 border-t border-stone-100">
                            <span className="text-xs font-bold text-green-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                {t('dashboard.findSuitableCropsBtn', 'Find Suitable Crops →')}
                            </span>
                        </div>
                    </div>

                    {/* Action 2: Plant Health */}
                    <div
                        onClick={() => navigate('/disease')}
                        className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm hover:shadow-md hover:border-teal-300 transition-all cursor-pointer group flex flex-col justify-between"
                    >
                        <div className="space-y-3">
                            <div className="w-12 h-12 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center p-1.5 group-hover:scale-105 transition-transform">
                                <img src="/feature-disease.svg" alt="" className="w-full h-full" />
                            </div>
                            <h3 className="font-bold text-stone-900 group-hover:text-teal-800 transition-colors text-base">
                                {t('landing.plantHealthTitle', 'Plant Health')}
                            </h3>
                            <p className="text-xs text-stone-600 leading-relaxed">
                                {t('dashboard.plantHealthDesc', 'Upload leaf photographs to detect 38 plant diseases with uncertainty safeguards.')}
                            </p>
                        </div>
                        <div className="pt-4 mt-2 border-t border-stone-100">
                            <span className="text-xs font-bold text-teal-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                {t('dashboard.uploadLeafPhotoBtn', 'Upload Leaf Photo →')}
                            </span>
                        </div>
                    </div>

                    {/* Action 3: My Farms */}
                    <div
                        onClick={() => navigate('/farms')}
                        className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group flex flex-col justify-between"
                    >
                        <div className="space-y-3">
                            <div className="w-12 h-12 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center p-1.5 group-hover:scale-105 transition-transform">
                                <span className="text-2xl" aria-hidden="true">🏡</span>
                            </div>
                            <h3 className="font-bold text-stone-900 group-hover:text-amber-800 transition-colors text-base">
                                {t('dashboard.myFarmsTitle', 'My Farms')}
                            </h3>
                            <p className="text-xs text-stone-600 leading-relaxed">
                                {t('dashboard.myFarmsDesc', 'Register farm parcels, manage coordinates, and maintain automated soil history.')}
                            </p>
                        </div>
                        <div className="pt-4 mt-2 border-t border-stone-100">
                            <span className="text-xs font-bold text-amber-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                {t('dashboard.manageFarmsBtn', 'Manage Farms →')}
                            </span>
                        </div>
                    </div>

                    {/* Action 4: Market Prices */}
                    <div
                        onClick={() => navigate('/market')}
                        className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group flex flex-col justify-between"
                    >
                        <div className="space-y-3">
                            <div className="w-12 h-12 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center p-1.5 group-hover:scale-105 transition-transform">
                                <img src="/feature-market.svg" alt="" className="w-full h-full" />
                            </div>
                            <h3 className="font-bold text-stone-900 group-hover:text-purple-800 transition-colors text-base">
                                {t('common.mandiMarket', 'Market Prices')}
                            </h3>
                            <p className="text-xs text-stone-600 leading-relaxed">
                                {t('dashboard.marketPricesDesc', 'Explore live Mandi prices across Indian states and commodities to plan harvesting.')}
                            </p>
                        </div>
                        <div className="pt-4 mt-2 border-t border-stone-100">
                            <span className="text-xs font-bold text-purple-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                {t('dashboard.viewMandiPricesBtn', 'View Mandi Prices →')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Farm Overview / Real Application Data */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-3">
                    <div>
                        <h2 className="text-lg font-bold text-stone-900">{t('dashboard.farmsOverviewHeading', 'Registered Farms Overview')}</h2>
                        <p className="text-xs text-stone-500 mt-0.5">
                            {farms.length > 0
                                ? t('dashboard.managingCount', 'Managing {count} registered farm parcel{s} ({area} total acres/hectares)', {
                                      count: farms.length,
                                      s: farms.length > 1 ? 's' : '',
                                      area: totalArea.toFixed(1)
                                  })
                                : t('dashboard.noFarmsConfigured', 'No farm parcels configured yet')}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/farms')}
                        className="self-start sm:self-auto px-4 py-2 bg-green-700 hover:bg-green-800 text-white font-bold rounded-lg text-xs shadow-sm transition-colors flex items-center gap-1.5"
                    >
                        <span>{t('dashboard.addNewFarm', '+ Add New Farm')}</span>
                    </button>
                </div>

                {loadingFarms ? (
                    <div className="py-8 text-center text-sm text-stone-400">{t('dashboard.loadingFarms', 'Loading your farm records...')}</div>
                ) : farms.length === 0 ? (
                    <div className="py-10 text-center space-y-3">
                        <div className="w-14 h-14 rounded-full bg-stone-100 mx-auto flex items-center justify-center text-2xl text-stone-400">
                            🌾
                        </div>
                        <h3 className="text-base font-bold text-stone-700">{t('dashboard.noFarmsTitle', 'No Farms Added Yet')}</h3>
                        <p className="text-xs text-stone-500 max-w-sm mx-auto">
                            {t('dashboard.noFarmsDesc', 'Add your farm parcels with soil baseline and geographic coordinates to unlock automated weather lookups and historical crop rotation benefits.')}
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate('/farms')}
                            className="mt-2 px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-lg text-xs transition-colors"
                        >
                            {t('dashboard.createFirstFarm', 'Create Your First Farm')}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                        {farms.slice(0, 6).map((farm) => (
                            <div key={farm._id} className="p-4 rounded-xl bg-[#FAFAF7] border border-stone-200 hover:border-green-300 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="font-bold text-stone-900 text-sm">{farm.farmName}</h4>
                                        <p className="text-xs text-stone-500 mt-0.5">{farm.area} {farm.areaUnit === 'hectare' ? t('farm.hectare', 'Hectares') : t('farm.acre', 'Acres')}</p>
                                    </div>
                                    <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800 font-semibold">
                                        pH {farm.pH}
                                    </span>
                                </div>
                                <div className="mt-3 pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-500">
                                    <span>N: {farm.nitrogen} | P: {farm.phosphorus} | K: {farm.potassium}</span>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/farms')}
                                        className="text-green-700 font-bold hover:underline"
                                    >
                                        {t('common.edit', 'Edit')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Additional Platform Tools */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🧪</span>
                            <h3 className="font-bold text-stone-900 text-sm">{t('dashboard.soilCardTitle', 'Soil Information & Grids')}</h3>
                        </div>
                        <p className="text-xs text-stone-500">
                            {t('dashboard.soilCardDesc', 'Log lab-certified soil records and query global SoilGrids 250m satellite layers.')}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/soil')}
                        className="px-4 py-2 border border-stone-300 hover:bg-stone-50 text-stone-700 font-bold text-xs rounded-lg transition-colors whitespace-nowrap ml-4"
                    >
                        {t('dashboard.analyzeSoilBtn', 'Analyze Soil')}
                    </button>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">📜</span>
                            <h3 className="font-bold text-stone-900 text-sm">{t('dashboard.historyCardTitle', 'Crop History & Rotation')}</h3>
                        </div>
                        <p className="text-xs text-stone-500">
                            {t('dashboard.historyCardDesc', 'Maintain past planting seasons to calculate agronomic rotation penalties.')}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/history')}
                        className="px-4 py-2 border border-stone-300 hover:bg-stone-50 text-stone-700 font-bold text-xs rounded-lg transition-colors whitespace-nowrap ml-4"
                    >
                        {t('dashboard.viewHistoryBtn', 'View History')}
                    </button>
                </div>
            </div>
        </div>
    );
};
