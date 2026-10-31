import React, { useState, useEffect, useCallback } from 'react';
import { soilInformationService } from '../services/soilInformation.service';
import { externalSoilService } from '../services/externalSoil.service';
import { SoilInformationForm } from './SoilInformationForm';
import { ExternalSoilDisplay } from './ExternalSoilDisplay';
import { useTranslation } from '../../../context/LanguageContext';

export const SoilInformationPage = () => {
    const { t } = useTranslation();
    const [farms, setFarms] = useState([]);
    const [selectedFarmId, setSelectedFarmId] = useState('');

    const [soilRecord, setSoilRecord] = useState(null);
    const [externalSoilRecord, setExternalSoilRecord] = useState(null);

    const [loading, setLoading] = useState(false);
    const [externalLoading, setExternalLoading] = useState(false);

    const [error, setError] = useState(null);
    const [externalError, setExternalError] = useState(null);

    const [isEditing, setIsEditing] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const fetchedFarms = await soilInformationService.getUserFarms();
            setFarms(fetchedFarms);
            if (fetchedFarms.length > 0 && !selectedFarmId) {
                setSelectedFarmId(fetchedFarms[0]._id);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [selectedFarmId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const fetchSoilInfo = useCallback(async () => {
        if (!selectedFarmId) return;
        setLoading(true);
        setError(null);
        setSoilRecord(null);

        try {
            const records = await soilInformationService.getSoilByFarm(selectedFarmId);
            if (records && records.length > 0) {
                setSoilRecord(records[0]);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }

        // Cache fetch for external
        try {
            const cachedExternal = await externalSoilService.getCachedExternalSoil(selectedFarmId);
            setExternalSoilRecord(cachedExternal);
            setExternalError(null);
        } catch (err) {
            setExternalError(null); // Silent fail on cache misses
        }
    }, [selectedFarmId]);

    useEffect(() => {
        fetchSoilInfo();
    }, [fetchSoilInfo]);

    const handleCreateUpdate = async (payload) => {
        setLoading(true);
        setError(null);
        try {
            if (soilRecord) {
                await soilInformationService.updateSoilInfo(soilRecord._id, payload);
            } else {
                await soilInformationService.createSoilInfo(payload);
            }
            setIsEditing(false);
            await fetchSoilInfo();
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(t('soil.deleteConfirmText', 'Are you sure you want to delete this soil record?'))) return;

        setLoading(true);
        setError(null);
        try {
            await soilInformationService.deleteSoilInfo(soilRecord._id);
            setSoilRecord(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFetchExternal = async () => {
        if (!selectedFarmId) return;
        setExternalLoading(true);
        setExternalError(null);
        try {
            const data = await externalSoilService.fetchExternalSoil(selectedFarmId);
            setExternalSoilRecord(data);
        } catch (err) {
            setExternalError(err.message);
        } finally {
            setExternalLoading(false);
        }
    };

    const selectedFarm = farms.find(f => f._id === selectedFarmId);

    return (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-card border border-emerald-100/80 min-h-[500px] max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-xl shadow-inner" aria-hidden="true">
                        🧪
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
                            {t('soil.soilInsightsHealth', 'Soil Insights & Health')}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                            {t('soil.manageSoilDesc', 'Manage soil fertility metrics and ISRIC SoilGrids geographic estimates.')}
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div role="alert" className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeWidth="2" />
                        <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {/* Farm Selector */}
            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/70">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    {t('soil.selectFarmParcel', 'Select Farm Parcel')}
                </label>
                <div className="relative">
                    <select
                        value={selectedFarmId}
                        onChange={(e) => {
                            setSelectedFarmId(e.target.value);
                            setIsEditing(false);
                        }}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl bg-white transition-all text-slate-800 font-medium shadow-sm"
                    >
                        <option value="" disabled>{t('soil.selectAFarm', '-- Select a Farm --')}</option>
                        {farms.map(f => (
                            <option key={f._id} value={f._id}>{f.farmName || f.name || 'Unnamed Farm'}</option>
                        ))}
                    </select>
                </div>
                {selectedFarm && (
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-2">
                        <span>📍 {t('farm.farmLocationAddressLabel', 'Location')}: <strong>{selectedFarm.location?.district || selectedFarm.location?.state || t('soil.locationMapped', 'Coordinates mapped')}</strong></span>
                        <span>•</span>
                        <span>📐 {t('farm.areaLabel', 'Area')}: <strong>{selectedFarm.area} {selectedFarm.areaUnit || 'acres'}</strong></span>
                    </p>
                )}
            </div>

            {loading && (
                <div className="py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent" role="status">
                        <span className="sr-only">{t('soil.loadingSoilInfo', 'Loading soil records...')}</span>
                    </div>
                    <p className="text-slate-500 text-sm mt-3">{t('soil.loadingSoilInfo', 'Loading soil information...')}</p>
                </div>
            )}

            {!loading && selectedFarmId && !isEditing && (
                <>
                    {soilRecord ? (
                        <div className="border border-emerald-200/80 rounded-2xl bg-gradient-to-br from-emerald-50/40 via-white to-green-50/30 p-6 relative shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                                <h3 className="text-lg font-extrabold text-emerald-900 flex items-center gap-2">
                                    <span>🌱 {t('soil.currentSoilChemistry', 'Current Soil Chemistry')}</span>
                                </h3>
                                <span className="bg-amber-100/80 text-amber-900 text-xs font-bold px-3 py-1 rounded-full border border-amber-200">
                                    {t('soil.dataSource', 'Data Source:')} {soilRecord.source === 'manual' ? t('soil.farmerVerified', 'Farmer Verified') : soilRecord.source}
                                </span>
                            </div>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-sm">
                                <div className="p-3.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">{t('soil.soilType', 'Soil Type')}</span>
                                    <span className="text-base font-extrabold text-slate-800">{soilRecord.soilType || 'N/A'}</span>
                                </div>
                                <div className="p-3.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">{t('soil.phLevel', 'pH Level')}</span>
                                    <span className="text-base font-extrabold text-emerald-700">{soilRecord.pH !== undefined ? soilRecord.pH : 'N/A'}</span>
                                </div>
                                <div className="p-3.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">{t('farm.nitrogenLabel', 'Nitrogen (N)')}</span>
                                    <span className="text-base font-extrabold text-slate-800">{soilRecord.nitrogen !== undefined ? `${soilRecord.nitrogen} kg/ha` : 'N/A'}</span>
                                </div>
                                <div className="p-3.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">{t('farm.phosphorusLabel', 'Phosphorus (P)')}</span>
                                    <span className="text-base font-extrabold text-slate-800">{soilRecord.phosphorus !== undefined ? `${soilRecord.phosphorus} kg/ha` : 'N/A'}</span>
                                </div>
                                <div className="p-3.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">{t('farm.potassiumLabel', 'Potassium (K)')}</span>
                                    <span className="text-base font-extrabold text-slate-800">{soilRecord.potassium !== undefined ? `${soilRecord.potassium} kg/ha` : 'N/A'}</span>
                                </div>
                                <div className="p-3.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">{t('soil.moisture', 'Moisture')}</span>
                                    <span className="text-base font-extrabold text-sky-700">{soilRecord.moisture !== undefined ? `${soilRecord.moisture}%` : 'N/A'}</span>
                                </div>
                            </div>

                            {soilRecord.notes && (
                                <div className="mt-4 pt-4 border-t border-emerald-100">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">{t('soil.agronomicNotes', 'Agronomic Notes')}</span>
                                    <p className="text-slate-700 text-sm bg-white p-3 rounded-xl border border-slate-100">{soilRecord.notes}</p>
                                </div>
                            )}

                            <div className="mt-5 pt-4 border-t border-emerald-100 flex items-center gap-3">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-4 py-2 text-xs font-bold bg-white text-emerald-800 rounded-xl border border-emerald-300 hover:bg-emerald-50 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    ✏️ {t('soil.editRecord', 'Edit Record')}
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-4 py-2 text-xs font-bold bg-white text-rose-700 rounded-xl border border-rose-200 hover:bg-rose-50 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                                >
                                    🗑️ {t('soil.deleteRecord', 'Delete Record')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-slate-50/70 border-2 border-dashed border-slate-200 rounded-2xl p-6">
                            <div className="text-4xl mb-2" aria-hidden="true">🌱</div>
                            <h4 className="text-base font-bold text-slate-800 mb-1">{t('soil.noSoilRecordFound', 'No Soil Record Found')}</h4>
                            <p className="text-slate-500 mb-5 text-xs sm:text-sm max-w-md mx-auto">
                                {t('soil.noSoilRecordFoundDesc', "Enter your farm's laboratory soil test results or field metrics to receive customized crop recommendations.")}
                            </p>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-5 rounded-xl shadow-sm transition-all text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 inline-flex items-center gap-1.5"
                            >
                                <span>+</span>
                                <span>{t('soil.addSoilInfo', 'Add Soil Information')}</span>
                            </button>
                        </div>
                    )}
                </>
            )}

            {!loading && selectedFarmId && isEditing && (
                <SoilInformationForm
                    farmId={selectedFarmId}
                    initialData={soilRecord}
                    onSubmit={handleCreateUpdate}
                    onCancel={() => setIsEditing(false)}
                />
            )}

            {!loading && selectedFarmId && !isEditing && (
                <ExternalSoilDisplay
                    externalData={externalSoilRecord}
                    loading={externalLoading}
                    error={externalError}
                    onFetch={handleFetchExternal}
                />
            )}
        </div>
    );
};
