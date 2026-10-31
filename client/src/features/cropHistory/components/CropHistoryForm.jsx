import React, { useState, useEffect } from 'react';
import { createCropHistory, updateCropHistory } from '../services/cropHistory.service';
import { getAllFarms } from '../../farm/services/farm.service';
import { validateCropHistory } from '../utils/cropHistory.validation';
import { useTranslation } from '../../../context/LanguageContext';

export const CropHistoryForm = ({ editRecord, onSaved, onCancel }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        farmId: '',
        crop: '',
        season: 'Kharif',
        year: new Date().getFullYear(),
        notes: ''
    });

    const [farms, setFarms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState([]);

    useEffect(() => {
        loadFarms();
        if (editRecord) {
            setFormData({
                farmId: editRecord.farmId,
                crop: editRecord.crop,
                season: editRecord.season,
                year: editRecord.year,
                notes: editRecord.notes || ''
            });
        }
    }, [editRecord]);

    const loadFarms = async () => {
        const res = await getAllFarms();
        if (res.success) {
            setFarms(res.data);
            if (res.data.length > 0 && !editRecord) {
                setFormData(prev => ({ ...prev, farmId: res.data[0]._id }));
            }
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'year' ? Number(value) : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors([]);

        const validationErrors = validateCropHistory(formData);
        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        try {
            let res;
            if (editRecord) {
                res = await updateCropHistory(editRecord._id, formData);
            } else {
                res = await createCropHistory(formData);
            }

            if (res.success) {
                onSaved();
            } else {
                let msg = res.message || "Failed to save.";
                if (res.errors) {
                    msg = Array.isArray(res.errors) ? res.errors.map(err => err.message || err).join(', ') : msg;
                }
                setErrors([msg]);
            }
        } catch (err) {
            setErrors([err.message || 'Network error occurred.']);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-card border border-emerald-100/80 max-w-xl mx-auto w-full">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                <h2 className="text-xl font-extrabold text-slate-800">
                    {editRecord ? t('history.editCropRecord', 'Edit Crop History Record') : t('history.recordPastHarvest', 'Record Historical Harvest')}
                </h2>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-slate-500 hover:text-slate-800 font-bold text-xs uppercase tracking-wider px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        {t('common.cancel', 'Cancel')}
                    </button>
                )}
            </div>

            {errors.length > 0 && (
                <div role="alert" className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-semibold">
                    <ul className="list-disc pl-5 space-y-1">
                        {errors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        {t('soil.selectFarmParcel', 'Select Farm Parcel')} <span className="text-rose-500">*</span>
                    </label>
                    <select
                        name="farmId"
                        value={formData.farmId}
                        onChange={handleChange}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm outline-none transition-all bg-white"
                    >
                        {farms.length === 0 && <option value="">{t('history.noFarmsAvailable', 'No farms available (Please add a farm first)')}</option>}
                        {farms.map(f => (
                            <option key={f._id} value={f._id}>{f.farmName || f.name || t('history.unnamedFarm', 'Unnamed Farm')}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        {t('history.cropLabel', 'Crop Name')} <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="crop"
                        value={formData.crop}
                        onChange={handleChange}
                        required
                        placeholder={t('history.cropPlaceholder', 'e.g. Wheat, Rice, Cotton, Sugarcane')}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm outline-none transition-all placeholder-slate-400"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                            {t('history.seasonLabel', 'Season')} <span className="text-rose-500">*</span>
                        </label>
                        <select
                            name="season"
                            value={formData.season}
                            onChange={handleChange}
                            required
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm outline-none transition-all bg-white"
                        >
                            <option value="Kharif">{t('history.seasonKharif', 'Kharif (Monsoon)')}</option>
                            <option value="Rabi">{t('history.seasonRabi', 'Rabi (Winter)')}</option>
                            <option value="Zaid">{t('history.seasonZaid', 'Zaid (Summer)')}</option>
                            <option value="Other">{t('history.seasonOther', 'Other / Perennial')}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                            {t('history.harvestYear', 'Harvest Year')} <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="year"
                            value={formData.year}
                            onChange={handleChange}
                            required
                            min={1900}
                            max={new Date().getFullYear() + 5}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm outline-none transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        {t('history.fieldObservationsLabel', 'Field Observations & Yield Notes')} <span className="text-xs text-slate-400 font-normal lowercase">({t('common.optional', 'optional')})</span>
                    </label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={3}
                        placeholder={t('history.fieldObservationsPlaceholder', 'Any observations regarding yield, pests, or fertilizer used?')}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-sm outline-none resize-none transition-all placeholder-slate-400"
                    ></textarea>
                </div>

                <button
                    type="submit"
                    disabled={loading || farms.length === 0}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-4 rounded-xl shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                    {loading ? t('common.saving', 'Saving...') : t('history.saveCropHistoryBtn', 'Save Crop History Record')}
                </button>
            </form>
        </div>
    );
};
