import React, { useState, useEffect } from 'react';
import { validateSoilForm } from '../utils/soilInformation.validation';
import { useTranslation } from '../../../context/LanguageContext';

const INITIAL_STATE = {
    soilType: '',
    pH: '',
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    moisture: '',
    notes: ''
};

export const SoilInformationForm = ({ farmId, initialData = null, onSubmit, onCancel }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState(INITIAL_STATE);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (initialData) {
            setFormData({
                soilType: initialData.soilType || '',
                pH: initialData.pH !== undefined ? String(initialData.pH) : '',
                nitrogen: initialData.nitrogen !== undefined ? String(initialData.nitrogen) : '',
                phosphorus: initialData.phosphorus !== undefined ? String(initialData.phosphorus) : '',
                potassium: initialData.potassium !== undefined ? String(initialData.potassium) : '',
                moisture: initialData.moisture !== undefined ? String(initialData.moisture) : '',
                notes: initialData.notes || ''
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // clear local validation error on change
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Pass everything required for validation
        const validationData = { ...formData, farmId };
        const validationErrors = validateSoilForm(validationData);

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        // Clean payload converting strings to numbers where available
        const payload = { farmId };

        if (formData.soilType.trim()) payload.soilType = formData.soilType.trim();
        if (formData.notes.trim()) payload.notes = formData.notes.trim();

        if (formData.pH !== '') payload.pH = Number(formData.pH);
        if (formData.nitrogen !== '') payload.nitrogen = Number(formData.nitrogen);
        if (formData.phosphorus !== '') payload.phosphorus = Number(formData.phosphorus);
        if (formData.potassium !== '') payload.potassium = Number(formData.potassium);
        if (formData.moisture !== '') payload.moisture = Number(formData.moisture);

        onSubmit(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 border rounded-lg shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{initialData ? t('soil.editSoilDataBtn', 'Edit Soil Information') : t('soil.addSoilInfo', 'Add Soil Information')}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('soil.soilType', 'Soil Type')} ({t('common.optional', 'Optional')})</label>
                    <input
                        type="text"
                        name="soilType"
                        value={formData.soilType}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="e.g. Loamy, Sandy"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('soil.phLevel', 'pH Level (0-14)')}</label>
                    <input
                        type="number"
                        step="0.1"
                        name="pH"
                        value={formData.pH}
                        onChange={handleChange}
                        className={`mt-1 block w-full border rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500 ${errors.pH ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.pH && <p className="text-red-500 text-xs mt-1">{errors.pH}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('farm.nitrogenLabel', 'Nitrogen (N)')}</label>
                    <input
                        type="number"
                        step="0.1"
                        name="nitrogen"
                        value={formData.nitrogen}
                        onChange={handleChange}
                        className={`mt-1 block w-full border rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500 ${errors.nitrogen ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.nitrogen && <p className="text-red-500 text-xs mt-1">{errors.nitrogen}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('farm.phosphorusLabel', 'Phosphorus (P)')}</label>
                    <input
                        type="number"
                        step="0.1"
                        name="phosphorus"
                        value={formData.phosphorus}
                        onChange={handleChange}
                        className={`mt-1 block w-full border rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500 ${errors.phosphorus ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.phosphorus && <p className="text-red-500 text-xs mt-1">{errors.phosphorus}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('farm.potassiumLabel', 'Potassium (K)')}</label>
                    <input
                        type="number"
                        step="0.1"
                        name="potassium"
                        value={formData.potassium}
                        onChange={handleChange}
                        className={`mt-1 block w-full border rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500 ${errors.potassium ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.potassium && <p className="text-red-500 text-xs mt-1">{errors.potassium}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('soil.moisture', 'Moisture Level (%)')}</label>
                    <input
                        type="number"
                        step="0.1"
                        name="moisture"
                        value={formData.moisture}
                        onChange={handleChange}
                        className={`mt-1 block w-full border rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500 ${errors.moisture ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.moisture && <p className="text-red-500 text-xs mt-1">{errors.moisture}</p>}
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">{t('soil.agronomicNotes', 'Notes')} ({t('common.optional', 'Optional')})</label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500"
                        rows="3"
                    ></textarea>
                </div>
            </div>

            <div className="mt-6 flex space-x-3">
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium">
                    {initialData ? t('common.saveChanges', 'Update Record') : t('common.save', 'Save Record')}
                </button>
                <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 font-medium">
                    {t('common.cancel', 'Cancel')}
                </button>
            </div>
        </form>
    );
};
