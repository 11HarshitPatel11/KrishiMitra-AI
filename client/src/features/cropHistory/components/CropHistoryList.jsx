import React, { useState, useEffect } from 'react';
import { getCropHistories, getCropHistoriesByFarm, deleteCropHistory } from '../services/cropHistory.service';
import { getAllFarms } from '../../farm/services/farm.service';
import { useTranslation } from '../../../context/LanguageContext';

export const CropHistoryList = ({ onEdit }) => {
    const { t } = useTranslation();
    const [histories, setHistories] = useState([]);
    const [farms, setFarms] = useState([]);
    const [selectedFarm, setSelectedFarm] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadData();
    }, [selectedFarm]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (farms.length === 0) {
                const farmsRes = await getAllFarms();
                if (farmsRes.success) {
                    setFarms(farmsRes.data);
                }
            }

            let histRes;
            if (selectedFarm === 'all') {
                histRes = await getCropHistories();
            } else {
                histRes = await getCropHistoriesByFarm(selectedFarm);
            }

            if (histRes.success) {
                setHistories(histRes.data);
            } else {
                setError(histRes.message || "Failed to load crop history.");
            }
        } catch (err) {
            setError(err.message || 'An error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('history.deleteConfirm', 'Are you sure you want to delete this historical record?'))) return;

        try {
            const res = await deleteCropHistory(id);
            if (res.success) {
                setHistories(prev => prev.filter(h => h._id !== id));
            } else {
                alert(res.message || "Failed to delete.");
            }
        } catch (err) {
            alert(err.message);
        }
    };

    const getFarmName = (farmId) => {
        const farm = farms.find(f => f._id === farmId);
        return farm ? (farm.farmName || farm.name || t('history.unnamedFarm', 'Unnamed Farm')) : t('history.unknownFarm', 'Unknown Farm');
    };

    const getSeasonBadge = (season) => {
        const s = (season || '').toLowerCase();
        if (s.includes('kharif')) {
            return 'bg-emerald-100/80 text-emerald-800 border-emerald-200';
        }
        if (s.includes('rabi')) {
            return 'bg-amber-100/80 text-amber-800 border-amber-200';
        }
        if (s.includes('zaid')) {
            return 'bg-sky-100/80 text-sky-800 border-sky-200';
        }
        return 'bg-slate-100 text-slate-700 border-slate-200';
    };

    return (
        <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-card border border-emerald-100/80 max-w-5xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-4 border-b border-slate-100 gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {t('common.filterByFarm', 'Filter by Farm:')}
                    </span>
                    <select
                        value={selectedFarm}
                        onChange={(e) => setSelectedFarm(e.target.value)}
                        className="px-3.5 py-1.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-800 shadow-sm"
                    >
                        <option value="all">{t('common.allFarms', 'All Farms ({count})', { count: farms.length })}</option>
                        {farms.map(f => (
                            <option key={f._id} value={f._id}>{f.farmName || f.name || t('history.unnamedFarm', 'Unnamed Farm')}</option>
                        ))}
                    </select>
                </div>

                <span className="text-xs font-semibold text-slate-400">
                    {t('common.showingRecords', 'Showing {count} historical {recordText}', {
                        count: histories.length,
                        recordText: histories.length === 1 ? t('common.record', 'record') : t('common.records', 'records')
                    })}
                </span>
            </div>

            {error && (
                <div role="alert" className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {loading ? (
                <div className="py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent" role="status">
                        <span className="sr-only">{t('common.loading', 'Loading history...')}</span>
                    </div>
                    <p className="text-slate-500 text-sm mt-3">{t('common.loading', 'Loading history...')}</p>
                </div>
            ) : histories.length === 0 ? (
                <div className="text-center py-12 bg-slate-50/70 border-2 border-dashed border-slate-200 rounded-2xl p-6">
                    <div className="text-4xl mb-2" aria-hidden="true">📜</div>
                    <h4 className="text-base font-bold text-slate-800 mb-1">{t('history.noHistoryFoundTitle', 'No Crop History Records Found')}</h4>
                    <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto">
                        {t('history.noHistoryFoundDesc', 'Add previous seasonal crops planted on your farm to enhance crop rotation intelligence.')}
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200/70">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/90 border-b border-slate-200">
                                <th className="p-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">{t('history.thFarm', 'Farm')}</th>
                                <th className="p-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">{t('history.cropCultivated', 'Crop Cultivated')}</th>
                                <th className="p-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">{t('history.thSeason', 'Season')}</th>
                                <th className="p-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">{t('history.year', 'Year')}</th>
                                <th className="p-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">{t('history.notesAndYield', 'Notes & Yield')}</th>
                                <th className="p-3.5 text-xs font-bold uppercase tracking-wider text-slate-600 text-center">{t('history.thActions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {histories.map(h => (
                                <tr key={h._id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="p-3.5 text-sm font-semibold text-slate-800">
                                        {getFarmName(h.farmId)}
                                    </td>
                                    <td className="p-3.5 text-sm">
                                        <span className="font-extrabold text-emerald-800 flex items-center gap-1.5">
                                            <span>🌱</span>
                                            <span>{h.crop}</span>
                                        </span>
                                    </td>
                                    <td className="p-3.5 text-sm">
                                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${getSeasonBadge(h.season)}`}>
                                            {h.season}
                                        </span>
                                    </td>
                                    <td className="p-3.5 text-sm font-bold text-slate-700">
                                        {h.year}
                                    </td>
                                    <td className="p-3.5 text-xs text-slate-500 max-w-xs truncate" title={h.notes}>
                                        {h.notes || '—'}
                                    </td>
                                    <td className="p-3.5 text-center">
                                        <div className="inline-flex items-center gap-1.5">
                                            <button
                                                onClick={() => onEdit(h)}
                                                className="px-2.5 py-1 rounded-lg text-xs font-bold border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                            >
                                                {t('common.edit', 'Edit')}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(h._id)}
                                                className="px-2.5 py-1 rounded-lg text-xs font-bold border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400"
                                            >
                                                {t('common.delete', 'Delete')}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
