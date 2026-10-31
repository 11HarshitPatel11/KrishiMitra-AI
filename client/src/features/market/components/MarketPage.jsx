import React, { useState, useEffect, useCallback } from 'react';
import { marketService } from '../services/market.service';
import { validateMarketFilters } from '../utils/market.validation';
import { useTranslation } from '../../../context/LanguageContext';

export const MarketPage = () => {
    const { t } = useTranslation();
    const [filters, setFilters] = useState({
        commodity: '',
        state: '',
        district: ''
    });

    const [marketData, setMarketData] = useState([]);
    const [marketMetadata, setMarketMetadata] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [emptyMessage, setEmptyMessage] = useState(null);

    const statesList = [
        "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
        "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
        "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
        "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
    ];

    const cropsList = [
        "Rice", "Maize", "Chickpea", "Kidneybeans", "Pigeonpeas", "Mothbeans",
        "Mungbean", "Blackgram", "Lentil", "Pomegranate", "Banana", "Mango",
        "Grapes", "Watermelon", "Muskmelon", "Apple", "Orange", "Papaya",
        "Coconut", "Cotton", "Jute", "Coffee"
    ];

    const fetchMarketData = useCallback(async (activeFilters = filters) => {
        setIsLoading(true);
        setError(null);
        setEmptyMessage(null);

        const { isValid, errors } = validateMarketFilters(activeFilters);
        if (!isValid) {
            setError({ message: Object.values(errors)[0] });
            setIsLoading(false);
            return;
        }

        try {
            const res = await marketService.getMarketInformation(activeFilters);

            if (res.data && res.data.records && Array.isArray(res.data.records) && res.data.records.length > 0) {
                setMarketData(res.data.records);
                setMarketMetadata(res.data.metadata || null);
                setEmptyMessage(null);
            } else {
                setMarketData([]);
                setMarketMetadata(res.data?.metadata || null);
                setEmptyMessage("No market records match your selected filters.");
            }
        } catch (err) {
            setMarketData([]);
            setMarketMetadata(null);
            setError({
                message: err.message || "Market prices are temporarily unavailable. Please try again later.",
                code: err.code,
                devNote: err.devNote
            });
        } finally {
            setIsLoading(false);
            setHasSearched(true);
        }
    }, [filters]);

    // Initial load on mount
    useEffect(() => {
        fetchMarketData({ commodity: '', state: '', district: '' });
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        fetchMarketData(filters);
    };

    const handleResetFilters = () => {
        const resetState = { commodity: '', state: '', district: '' };
        setFilters(resetState);
        fetchMarketData(resetState);
    };

    const handleRetry = () => {
        fetchMarketData(filters);
    };

    return (
        <div className="max-w-6xl mx-auto w-full space-y-6">
            {/* Header */}
            <div className="border-b border-emerald-100/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-xl shadow-inner" aria-hidden="true">
                        📈
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
                            {t('market.mandiMarketIntelligence', 'Mandi Market Intelligence')}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                            {t('market.subtitle', 'Official agricultural mandi wholesale prices and arrival trends across India.')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-card border border-emerald-100/80">
                <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                            {t('market.commodityFilterLabel', 'Commodity / Crop')}
                        </label>
                        <select
                            name="commodity"
                            value={filters.commodity}
                            onChange={handleChange}
                            className="w-full border border-slate-300 rounded-xl p-2.5 bg-white text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 shadow-sm"
                        >
                            <option value="">{t('market.allCommodities', '-- All Commodities --')}</option>
                            {cropsList.map(crop => (
                                <option key={crop} value={crop}>{crop}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                            {t('market.stateFilterLabel', 'State')}
                        </label>
                        <select
                            name="state"
                            value={filters.state}
                            onChange={handleChange}
                            className="w-full border border-slate-300 rounded-xl p-2.5 bg-white text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 shadow-sm"
                        >
                            <option value="">{t('market.allStates', '-- All States --')}</option>
                            {statesList.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                            {t('recommendation.districtLabel', 'District')} <span className="text-xs text-slate-400 lowercase">({t('common.optional', 'optional')})</span>
                        </label>
                        <input
                            type="text"
                            name="district"
                            value={filters.district}
                            onChange={handleChange}
                            placeholder={t('market.districtPlaceholder', 'e.g. Indore')}
                            className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 shadow-sm placeholder-slate-400"
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`flex-1 py-2.5 px-4 shadow-sm text-xs sm:text-sm font-bold rounded-xl text-white transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500
                                ${isLoading ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-700 hover:bg-emerald-800'}
                            `}
                        >
                            {isLoading ? t('market.searching', 'Searching...') : t('market.viewMarketPricesBtn', 'View Market Prices')}
                        </button>
                        {(filters.commodity || filters.state || filters.district) && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                disabled={isLoading}
                                className="px-3 py-2.5 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50 text-xs font-semibold"
                                title={t('common.resetFilters', 'Reset filters')}
                            >
                                {t('common.reset', 'Reset')}
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="bg-white p-12 rounded-2xl shadow-card border border-emerald-100/80 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent" role="status">
                        <span className="sr-only">{t('market.loadingPrices', 'Loading market prices...')}</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600 font-medium">{t('market.loadingPrices', 'Loading latest mandi market prices...')}</p>
                </div>
            )}

            {/* Data Source Unavailable State (Error with Retry) */}
            {!isLoading && error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-2xl shadow-sm space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 font-bold text-base mt-0.5">
                            !
                        </div>
                        <div className="space-y-1 flex-1">
                            <h3 className="font-bold text-sm text-rose-900">{t('market.dataUnavailableTitle', 'Market Data Unavailable')}</h3>
                            <p className="text-xs sm:text-sm text-rose-700 leading-relaxed">
                                {error.message || t('market.dataUnavailableTitle', 'Market prices are temporarily unavailable. Please try again later.')}
                            </p>
                            {error.devNote && (
                                <p className="text-xs text-rose-600 bg-rose-100/60 p-2.5 rounded-lg font-mono mt-2">
                                    {error.devNote}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="pt-2 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleRetry}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-rose-400"
                        >
                            {t('common.retry', 'Retry')}
                        </button>
                        {(filters.commodity || filters.state || filters.district) && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="px-4 py-2 border border-rose-300 text-rose-700 hover:bg-rose-100 font-bold text-xs sm:text-sm rounded-xl transition-all"
                            >
                                {t('common.resetFilters', 'Reset Filters')}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* No Matching Results State */}
            {!isLoading && !error && emptyMessage && (
                <div className="bg-amber-50/80 border border-amber-200 text-amber-900 p-8 rounded-2xl shadow-sm text-center space-y-3">
                    <div className="text-3xl" aria-hidden="true">🔍</div>
                    <h3 className="font-bold text-base text-amber-900">{t('market.noMatchingResults', 'No Matching Results')}</h3>
                    <p className="text-xs sm:text-sm text-amber-800 max-w-md mx-auto">
                        {t('market.noRecordsMatch', 'No market records match your selected filters.')}
                    </p>
                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all"
                        >
                            {t('common.resetFilters', 'Reset Filters')}
                        </button>
                    </div>
                </div>
            )}

            {/* Metadata Banner */}
            {!isLoading && !error && marketMetadata && marketData.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-slate-200/80 gap-3 text-xs shadow-xs">
                    <div className="text-slate-700 space-y-0.5">
                        <span className="font-bold block">{t('market.source', 'Source:')} {marketMetadata.source}</span>
                        <span className="text-slate-500 block">{t('market.marketDataDate', 'Market Data Date:')} {marketMetadata.latestDataDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-semibold">{t('market.freshness', 'Freshness:')}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase border
                            ${marketMetadata.freshness === 'fresh' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                                marketMetadata.freshness === 'recent' ? 'bg-sky-100 text-sky-800 border-sky-300' :
                                    marketMetadata.freshness === 'stale' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                                        'bg-slate-200 text-slate-800 border-slate-300'}`}
                        >
                            {t(`market.${marketMetadata.freshness}`, marketMetadata.freshness)}
                        </span>
                    </div>
                </div>
            )}

            {/* Stale Warning Notice */}
            {!isLoading && !error && marketMetadata?.freshness === 'stale' && marketData.length > 0 && (
                <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-xl text-xs text-amber-900 leading-relaxed flex items-start gap-2">
                    <span className="text-amber-600 font-bold shrink-0">⚠️</span>
                    <p>
                        <span className="font-bold">{t('common.notice', 'Notice')}:</span> {t('market.staleNotice', 'Market data may be outdated. Please verify the latest local mandi price before making a selling decision.')}
                    </p>
                </div>
            )}

            {/* Successful Response: Market Data Table */}
            {!isLoading && !error && marketData.length > 0 && (
                <div className="bg-white shadow-card overflow-hidden rounded-2xl border border-emerald-100/80 text-xs sm:text-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/80">
                                <tr>
                                    <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">{t('market.thCommodityMarket', 'Commodity / Market')}</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">{t('market.thCurrentPriceModal', 'Current Price (Modal)')}</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">{t('market.thPriceTrend', 'Price Trend')}</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">{t('market.thArrivalsActivity', 'Arrivals / Activity')}</th>
                                    <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">{t('market.thDemandSignalStar', 'Demand Signal*')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {marketData.map((record, index) => {
                                    const priceTrend = record.intelligence?.priceTrend;
                                    const arrivals = record.intelligence?.arrivals;
                                    const tradingActivity = record.intelligence?.tradingActivity;
                                    const demandSignal = record.intelligence?.demandSignal;

                                    return (
                                        <tr key={index} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="font-extrabold text-slate-800 capitalize text-sm">{record.commodity}</div>
                                                <div className="text-slate-700 text-xs mt-0.5 font-medium">{record.market}</div>
                                                <div className="text-[11px] text-slate-400">{record.district}, {record.state}</div>
                                                <div className="text-[10px] text-slate-400 mt-0.5">{t('market.dateLabel', 'Date')}: {record.date}</div>
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="font-extrabold text-emerald-800 text-base">
                                                    {record.modalPrice !== null && record.modalPrice !== undefined ? `₹${record.modalPrice}` : 'N/A'}{' '}
                                                    <span className="text-xs text-slate-500 font-normal">/ {record.unit || t('market.perQuintal', 'quintal')}</span>
                                                </div>
                                                <div className="text-[11px] text-slate-400 mt-0.5">
                                                    {t('market.minPrice', 'Min')}: {record.minPrice ? `₹${record.minPrice}` : '-'} | {t('market.maxPrice', 'Max')}: {record.maxPrice ? `₹${record.maxPrice}` : '-'}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div>
                                                    {priceTrend?.direction === 'rising' && <span className="text-emerald-700 font-bold flex items-center text-xs">{t('market.trendRising', '↑ Rising')}</span>}
                                                    {priceTrend?.direction === 'falling' && <span className="text-rose-600 font-bold flex items-center text-xs">{t('market.trendFalling', '↓ Falling')}</span>}
                                                    {priceTrend?.direction === 'stable' && <span className="text-slate-600 font-medium flex items-center text-xs">{t('market.trendStable', '→ Stable')}</span>}
                                                    {(!priceTrend || priceTrend.direction === 'unavailable') && <span className="text-slate-400 text-xs italic">{t('market.demandUnavailable', 'Unavailable')}</span>}
                                                </div>
                                                {priceTrend?.changePercent !== null && priceTrend?.changePercent !== undefined && (
                                                    <div className="text-[11px] text-slate-500 mt-0.5">
                                                        {priceTrend.changePercent > 0 ? '+' : ''}{priceTrend.changePercent}%
                                                        {priceTrend.note && <span className="text-slate-400 block text-[10px]">({priceTrend.note})</span>}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-600">
                                                <div>
                                                    <span className="font-semibold text-slate-700">{t('market.arrivalsPrefix', 'Arrivals:')} </span>
                                                    <span className="text-slate-800 font-medium">{arrivals?.current || arrivals?.status || t('market.activeToday', 'Active Today')}</span>
                                                </div>
                                                <div className="mt-0.5 text-[11px]">
                                                    <span className="font-semibold text-slate-700">{t('market.activityPrefix', 'Activity:')} </span>
                                                    <span className="capitalize font-medium text-slate-700">
                                                        {tradingActivity?.status && tradingActivity.status !== 'unavailable' ? tradingActivity.status : t('market.active', 'Active')}
                                                    </span>
                                                    {tradingActivity?.spread !== undefined && tradingActivity.spread > 0 ? (
                                                        <span className="text-slate-400 block text-[10px]">{t('market.rangeSpread', '₹{spread} range ({percent}%)', { spread: tradingActivity.spread, percent: tradingActivity.spreadPercent })}</span>
                                                    ) : (
                                                        <span className="text-slate-400 block text-[10px]">{t('market.singleRateAuction', 'Single rate auction')}</span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex flex-col">
                                                    {demandSignal?.signal === 'High' && <span className="inline-flex max-w-max items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">{t('market.demandHigh', 'High')}</span>}
                                                    {demandSignal?.signal === 'Moderate' && <span className="inline-flex max-w-max items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800">{t('market.demandModerate', 'Moderate')}</span>}
                                                    {demandSignal?.signal === 'Low' && <span className="inline-flex max-w-max items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">{t('market.demandLow', 'Low')}</span>}
                                                    {(!demandSignal || demandSignal.signal === 'Unavailable') && <span className="inline-flex max-w-max items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">{t('market.demandUnavailable', 'Unavailable')}</span>}

                                                    <p className="text-[11px] text-slate-500 mt-1 whitespace-normal max-w-xs">
                                                        {demandSignal?.reason || 'Market context is insufficient to determine demand.'}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!isLoading && (marketData.length > 0 || hasSearched) && (
                <div className="text-[11px] text-slate-400 text-center mt-6 space-y-1 max-w-2xl mx-auto">
                    <p>{t('market.disclaimerSignal', '* Market Demand Signal is a derived indicator based on available market signals (price trends, trading activity). It is not an official demand measurement.')}</p>
                    <p>{t('market.disclaimerPrices', 'Market prices are indicative and may vary by mandi, commodity quality, quantity, and trading conditions. Verify the latest local price before making a selling decision.')}</p>
                </div>
            )}
        </div>
    );
};
