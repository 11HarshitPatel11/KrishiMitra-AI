import React, { useState, useEffect, useCallback } from 'react';
import { createFarm, getAllFarms, updateFarm, deleteFarm } from '../services/farm.service';
import { FarmLocationInput } from './FarmLocationInput';
import { useTranslation } from '../../../context/LanguageContext';

const NUMERIC_FIELDS = ['area', 'nitrogen', 'phosphorus', 'potassium', 'pH', 'latitude', 'longitude'];

const emptyForm = {
    farmName: '',
    area: '',
    areaUnit: 'acre',
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    pH: '',
    location: '',
    latitude: '',
    longitude: '',
};

const parseFormForApi = (formData) => {
    const parsed = { ...formData };
    for (const field of NUMERIC_FIELDS) {
        if (parsed[field] !== '' && parsed[field] !== null && parsed[field] !== undefined) {
            parsed[field] = Number(parsed[field]);
        } else if (field === 'latitude' || field === 'longitude') {
            delete parsed[field];
        }
    }
    if (parsed.location !== undefined) {
        parsed.location = typeof parsed.location === 'string' ? parsed.location.trim() : '';
    }
    return parsed;
};

const validateCreate = (data) => {
    const errors = {};
    if (!data.farmName || !data.farmName.trim()) errors.farmName = 'Farm name is required';
    if (data.area === '' || Number(data.area) <= 0) errors.area = 'Area must be a positive number';
    if (!data.areaUnit) errors.areaUnit = 'Area unit must be selected';
    if (data.nitrogen === '' || Number(data.nitrogen) < 0) errors.nitrogen = 'Nitrogen must be ≥ 0';
    if (data.phosphorus === '' || Number(data.phosphorus) < 0) errors.phosphorus = 'Phosphorus must be ≥ 0';
    if (data.potassium === '' || Number(data.potassium) < 0) errors.potassium = 'Potassium must be ≥ 0';
    if (data.pH === '' || Number(data.pH) < 0 || Number(data.pH) > 14) errors.pH = 'pH must be between 0 and 14';
    if (data.latitude !== '' && data.latitude !== null && data.latitude !== undefined && (Number(data.latitude) < -90 || Number(data.latitude) > 90)) {
        errors.latitude = 'Latitude must be between -90 and 90';
    }
    if (data.longitude !== '' && data.longitude !== null && data.longitude !== undefined && (Number(data.longitude) < -180 || Number(data.longitude) > 180)) {
        errors.longitude = 'Longitude must be between -180 and 180';
    }
    return errors;
};

const validateEdit = (data) => {
    const errors = {};
    if ('farmName' in data && (!data.farmName || !data.farmName.trim())) errors.farmName = 'Farm name must be non-empty';
    if ('area' in data && (data.area === '' || Number(data.area) <= 0)) errors.area = 'Area must be a positive number';
    if ('areaUnit' in data && data.areaUnit !== 'acre' && data.areaUnit !== 'hectare') errors.areaUnit = "Must be 'acre' or 'hectare'";
    if ('nitrogen' in data && (data.nitrogen === '' || Number(data.nitrogen) < 0)) errors.nitrogen = 'Nitrogen must be ≥ 0';
    if ('phosphorus' in data && (data.phosphorus === '' || Number(data.phosphorus) < 0)) errors.phosphorus = 'Phosphorus must be ≥ 0';
    if ('potassium' in data && (data.potassium === '' || Number(data.potassium) < 0)) errors.potassium = 'Potassium must be ≥ 0';
    if ('pH' in data && (data.pH === '' || Number(data.pH) < 0 || Number(data.pH) > 14)) errors.pH = 'pH must be between 0 and 14';
    if ('latitude' in data && data.latitude !== '' && data.latitude !== null && data.latitude !== undefined && (Number(data.latitude) < -90 || Number(data.latitude) > 90)) {
        errors.latitude = 'Latitude must be between -90 and 90';
    }
    if ('longitude' in data && data.longitude !== '' && data.longitude !== null && data.longitude !== undefined && (Number(data.longitude) < -180 || Number(data.longitude) > 180)) {
        errors.longitude = 'Longitude must be between -180 and 180';
    }
    return errors;
};

const Field = ({ label, name, type = 'text', value, onChange, error, placeholder, step, min, max }) => (
    <div>
        <label className="block text-xs font-semibold text-stone-700 mb-1">{label}</label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            step={step}
            min={min}
            max={max}
            placeholder={placeholder}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 text-sm outline-none transition-all ${
                error ? 'border-red-500 bg-red-50' : 'border-stone-300 bg-white'
            }`}
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
);

const FarmCard = ({ farm, onEdit, onDelete }) => {
    const { t } = useTranslation();
    return (
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🏡</span>
                        <h3 className="font-bold text-stone-900 text-base">{farm.farmName}</h3>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                        {farm.area} {farm.areaUnit === 'hectare' ? t('farm.hectare', 'Hectares') : t('farm.acre', 'Acres')}{farm.area !== 1 && farm.areaUnit === 'acre' ? 's' : ''} {farm.area !== 1 ? t('farm.parcels', 'parcels') : t('farm.parcel', 'parcel')}
                    </p>
                </div>
                <div className="flex gap-2 ml-2 shrink-0">
                    <button
                        onClick={() => onEdit(farm)}
                        id={`edit-farm-${farm._id}`}
                        className="px-3 py-1.5 text-xs font-bold bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
                    >
                        {t('common.edit', 'Edit')}
                    </button>
                    <button
                        onClick={() => onDelete(farm)}
                        id={`delete-farm-${farm._id}`}
                        className="px-3 py-1.5 text-xs font-bold bg-red-50 text-red-700 rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
                    >
                        {t('common.delete', 'Delete')}
                    </button>
                </div>
            </div>

            {/* Soil NPK Summary */}
            <div className="mt-4 grid grid-cols-4 gap-2">
                {[
                    { label: 'N', value: farm.nitrogen },
                    { label: 'P', value: farm.phosphorus },
                    { label: 'K', value: farm.potassium },
                    { label: 'pH', value: farm.pH },
                ].map(({ label, value }) => (
                    <div key={label} className="bg-[#FAFAF7] rounded-lg p-2 text-center border border-stone-200/60">
                        <p className="text-[11px] font-bold text-stone-400 uppercase">{label}</p>
                        <p className="text-sm font-extrabold text-stone-800">{value}</p>
                    </div>
                ))}
            </div>

            {/* Location & GPS Info */}
            {(farm.location || farm.latitude != null || farm.longitude != null) && (
                <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-stone-600">
                        <span className="text-stone-400">📍</span>
                        {farm.location && (
                            <span className="font-medium text-stone-700">{farm.location}</span>
                        )}
                        {farm.latitude != null && farm.longitude != null && (
                            <span className="text-stone-400 text-[11px]">
                                ({Number(farm.latitude).toFixed(4)}°, {Number(farm.longitude).toFixed(4)}°)
                            </span>
                        )}
                    </div>
                    {farm.latitude != null && farm.longitude != null && (
                        <a
                            href={`https://www.openstreetmap.org/?mlat=${farm.latitude}&mlon=${farm.longitude}#map=16/${farm.latitude}/${farm.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold underline inline-flex items-center gap-0.5"
                            title={t('common.previewOnOsm', 'Preview on OpenStreetMap')}
                        >
                            <span>{t('common.viewMap', 'View Map')}</span>
                            <span>↗</span>
                        </a>
                    )}
                </div>
            )}
        </div>
    );
};

const EditModal = ({ farm, onClose, onSaved }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        farmName: farm.farmName,
        area: farm.area,
        areaUnit: farm.areaUnit,
        nitrogen: farm.nitrogen,
        phosphorus: farm.phosphorus,
        potassium: farm.potassium,
        pH: farm.pH,
        location: farm.location ?? '',
        latitude: farm.latitude ?? '',
        longitude: farm.longitude ?? '',
    });
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        setServerError('');
    };

    const handleLocationChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        setServerError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validateEdit(formData);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setIsSubmitting(true);
        const payload = parseFormForApi(formData);
        const res = await updateFarm(farm._id, payload);

        if (res.success) {
            onSaved(res.data);
        } else {
            let msg = res.message || 'Failed to update farm.';
            if (res.errors?.length) {
                msg += ': ' + res.errors.map(e => e.message || e).join(', ');
            }
            setServerError(msg);
        }
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-stone-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
                    <h2 className="text-xl font-bold text-stone-900">{t('farm.editFarmTitle', 'Edit Farm')}</h2>
                    <button
                        onClick={onClose}
                        className="text-stone-400 hover:text-stone-700 text-2xl leading-none"
                        aria-label="Close"
                    >
                        &times;
                    </button>
                </div>

                {serverError && (
                    <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                        {serverError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    <Field label={t('farm.farmNameLabel', 'Farm Name')} name="farmName" value={formData.farmName} onChange={handleChange} error={errors.farmName} placeholder={t('farm.farmNamePlaceholder', 'e.g. Green Valley Farm')} />

                    <div className="flex gap-3">
                        <div className="flex-1">
                            <Field label={t('farm.areaLabel', 'Area')} name="area" type="number" step="0.01" min="0.01" value={formData.area} onChange={handleChange} error={errors.area} placeholder={t('farm.areaPlaceholder', 'e.g. 2.5')} />
                        </div>
                        <div className="w-1/3">
                            <label className="block text-xs font-semibold text-stone-700 mb-1">{t('farm.unitLabel', 'Unit')}</label>
                            <select
                                name="areaUnit"
                                value={formData.areaUnit}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm bg-white"
                            >
                                <option value="acre">{t('farm.acre', 'Acres')}</option>
                                <option value="hectare">{t('farm.hectare', 'Hectares')}</option>
                            </select>
                            {errors.areaUnit && <p className="mt-1 text-xs text-red-600">{errors.areaUnit}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label={t('farm.nitrogenLabel', 'Nitrogen (N)')} name="nitrogen" type="number" step="0.1" min="0" value={formData.nitrogen} onChange={handleChange} error={errors.nitrogen} />
                        <Field label={t('farm.phosphorusLabel', 'Phosphorus (P)')} name="phosphorus" type="number" step="0.1" min="0" value={formData.phosphorus} onChange={handleChange} error={errors.phosphorus} />
                        <Field label={t('farm.potassiumLabel', 'Potassium (K)')} name="potassium" type="number" step="0.1" min="0" value={formData.potassium} onChange={handleChange} error={errors.potassium} />
                        <Field label={t('farm.phLabel', 'Soil pH')} name="pH" type="number" step="0.1" min="0" max="14" value={formData.pH} onChange={handleChange} error={errors.pH} placeholder={t('farm.phPlaceholder', 'e.g. 6.5')} />
                    </div>

                    <FarmLocationInput
                        latitude={formData.latitude}
                        longitude={formData.longitude}
                        location={formData.location}
                        onChange={handleLocationChange}
                        errors={errors}
                        idPrefix="edit"
                    />

                    <div className="flex gap-3 pt-3 border-t border-stone-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 border border-stone-300 text-stone-700 rounded-xl hover:bg-stone-50 font-bold text-xs transition-colors"
                        >
                            {t('common.cancel', 'Cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            id={`save-edit-farm-${farm._id}`}
                            className="flex-1 py-2.5 bg-green-700 text-white rounded-xl hover:bg-green-800 font-bold text-xs disabled:opacity-50 transition-colors shadow-sm"
                        >
                            {isSubmitting ? t('farm.savingBtn', 'Saving…') : t('farm.saveChanges', 'Save Changes')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DeleteConfirmModal = ({ farm, onClose, onConfirm, isDeleting, deleteError }) => {
    const { t } = useTranslation();
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-stone-200">
                <h2 className="text-lg font-bold text-stone-900 mb-2">{t('farm.deleteFarmTitle', 'Delete Farm')}</h2>
                <p className="text-stone-600 text-xs sm:text-sm mb-4 leading-relaxed">
                    {t('farm.deleteConfirmText', 'Are you sure you want to delete {farmName}? This action cannot be undone.', { farmName: farm.farmName })}
                </p>
                {deleteError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                        {deleteError}
                    </div>
                )}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 border border-stone-300 text-stone-700 rounded-xl hover:bg-stone-50 font-bold text-xs"
                    >
                        {t('common.cancel', 'Cancel')}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        id={`confirm-delete-farm-${farm._id}`}
                        className="flex-1 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold text-xs disabled:opacity-50 transition-colors shadow-sm"
                    >
                        {isDeleting ? t('farm.deleting', 'Deleting…') : t('common.delete', 'Delete')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const CreateFarmForm = ({ onCreated }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [submitStatus, setSubmitStatus] = useState({ type: null, message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        setSubmitStatus({ type: null, message: '' });
    };

    const handleLocationChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        setSubmitStatus({ type: null, message: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validateCreate(formData);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setIsSubmitting(true);
        const payload = parseFormForApi(formData);
        const response = await createFarm(payload);

        if (response.success) {
            setSubmitStatus({ type: 'success', message: response.message || t('farm.createdSuccess', 'Farm created successfully!') });
            setFormData(emptyForm);
            setErrors({});
            onCreated(response.data);
        } else {
            let errorMsg = response.message || 'Failed to create farm.';
            if (response.errors?.length) {
                errorMsg += ': ' + response.errors.map(err => err.message || err).join(', ');
            }
            setSubmitStatus({ type: 'error', message: errorMsg });
        }
        setIsSubmitting(false);
    };

    return (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-stone-900 mb-1 flex items-center gap-2">
                <span>➕</span>
                <span>{t('farm.addNewTitle', 'Add New Farm')}</span>
            </h3>
            <p className="text-xs text-stone-500 mb-5">{t('farm.addNewSubhead', 'Register a parcel to reuse in recommendations and track rotation history.')}</p>

            {submitStatus.type === 'success' && (
                <div className="mb-4 p-3 text-green-800 bg-green-50 border border-green-200 rounded-xl text-xs font-semibold">{submitStatus.message}</div>
            )}
            {submitStatus.type === 'error' && (
                <div className="mb-4 p-3 text-red-800 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold">{submitStatus.message}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <Field label={t('farm.farmNameLabel', 'Farm Name')} name="farmName" value={formData.farmName} onChange={handleChange} error={errors.farmName} placeholder={t('farm.farmNamePlaceholder', 'e.g. Green Valley Farm')} />

                <div className="flex gap-3">
                    <div className="flex-1">
                        <Field label={t('farm.areaLabel', 'Area')} name="area" type="number" step="0.01" min="0.01" value={formData.area} onChange={handleChange} error={errors.area} placeholder={t('farm.areaPlaceholder', 'e.g. 2.5')} />
                    </div>
                    <div className="w-1/3">
                        <label className="block text-xs font-semibold text-stone-700 mb-1">{t('farm.unitLabel', 'Unit')}</label>
                        <select
                            name="areaUnit"
                            value={formData.areaUnit}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm bg-white"
                        >
                            <option value="acre">{t('farm.acre', 'Acres')}</option>
                            <option value="hectare">{t('farm.hectare', 'Hectares')}</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Field label={t('farm.nitrogenLabel', 'Nitrogen (N)')} name="nitrogen" type="number" step="0.1" min="0" value={formData.nitrogen} onChange={handleChange} error={errors.nitrogen} />
                    <Field label={t('farm.phosphorusLabel', 'Phosphorus (P)')} name="phosphorus" type="number" step="0.1" min="0" value={formData.phosphorus} onChange={handleChange} error={errors.phosphorus} />
                    <Field label={t('farm.potassiumLabel', 'Potassium (K)')} name="potassium" type="number" step="0.1" min="0" value={formData.potassium} onChange={handleChange} error={errors.potassium} />
                    <Field label={t('farm.phLabel', 'Soil pH')} name="pH" type="number" step="0.1" min="0" max="14" value={formData.pH} onChange={handleChange} error={errors.pH} placeholder={t('farm.phPlaceholder', 'e.g. 6.5')} />
                </div>

                <FarmLocationInput
                    latitude={formData.latitude}
                    longitude={formData.longitude}
                    location={formData.location}
                    onChange={handleLocationChange}
                    errors={errors}
                    idPrefix="create"
                />

                <button
                    type="submit"
                    disabled={isSubmitting}
                    id="create-farm-btn"
                    className="w-full bg-green-700 text-white py-3 px-4 rounded-xl hover:bg-green-800 transition-colors disabled:opacity-50 font-bold text-xs sm:text-sm shadow-sm"
                >
                    {isSubmitting ? t('farm.savingBtn', 'Saving…') : t('farm.saveBtn', 'Save Farm Information')}
                </button>
            </form>
        </div>
    );
};

export const FarmForm = () => {
    const { t } = useTranslation();
    const [farms, setFarms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [editTarget, setEditTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const loadFarms = useCallback(async () => {
        setLoading(true);
        setLoadError('');
        const res = await getAllFarms();
        if (res.success) {
            setFarms(res.data || []);
        } else {
            setLoadError(res.message || 'Failed to load farms.');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        loadFarms();
    }, [loadFarms]);

    const handleCreated = (newFarm) => {
        setFarms(prev => [newFarm, ...prev]);
    };

    const handleEditSaved = (updatedFarm) => {
        setFarms(prev => prev.map(f => f._id === updatedFarm._id ? updatedFarm : f));
        setEditTarget(null);
    };

    const handleDeleteRequest = (farm) => {
        setDeleteTarget(farm);
        setDeleteError('');
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        setDeleteError('');

        const res = await deleteFarm(deleteTarget._id);
        if (res.success) {
            setFarms(prev => prev.filter(f => f._id !== deleteTarget._id));
            setDeleteTarget(null);
        } else {
            setDeleteError(res.message || 'Failed to delete farm.');
        }
        setIsDeleting(false);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="border-b border-stone-200 pb-3">
                <h2 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
                    <span>🏡</span>
                    <span>{t('farm.title', 'Farm Management')}</span>
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                    {t('farm.subtitle', 'Register and manage your farm holdings with soil baselines and coordinates.')}
                </p>
            </div>

            <CreateFarmForm onCreated={handleCreated} />

            <div>
                <h3 className="text-lg font-bold text-stone-900 mb-3">{t('farm.registeredFarmsHeading', 'Your Registered Farms')}</h3>
                {loading ? (
                    <p className="text-stone-400 text-xs py-4 text-center">{t('farm.loadingFarms', 'Loading farms…')}</p>
                ) : loadError ? (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">{loadError}</div>
                ) : farms.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-stone-200 rounded-2xl bg-[#FAFAF7]">
                        <p className="text-stone-500 text-xs sm:text-sm">
                            {t('farm.noFarmsRegistered', 'No farms registered yet. Add your first farm parcel above.')}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {farms.map(farm => (
                            <FarmCard
                                key={farm._id}
                                farm={farm}
                                onEdit={setEditTarget}
                                onDelete={handleDeleteRequest}
                            />
                        ))}
                    </div>
                )}
            </div>

            {editTarget && (
                <EditModal
                    farm={editTarget}
                    onClose={() => setEditTarget(null)}
                    onSaved={handleEditSaved}
                />
            )}

            {deleteTarget && (
                <DeleteConfirmModal
                    farm={deleteTarget}
                    onClose={() => { setDeleteTarget(null); setDeleteError(''); }}
                    onConfirm={handleDeleteConfirm}
                    isDeleting={isDeleting}
                    deleteError={deleteError}
                />
            )}
        </div>
    );
};
