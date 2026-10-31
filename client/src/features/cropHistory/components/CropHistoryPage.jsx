import React, { useState } from 'react';
import { CropHistoryList } from './CropHistoryList';
import { CropHistoryForm } from './CropHistoryForm';
import { useTranslation } from '../../../context/LanguageContext';

export const CropHistoryPage = () => {
    const { t } = useTranslation();
    const [view, setView] = useState('list');
    const [editRecord, setEditRecord] = useState(null);

    const handleEdit = (record) => {
        setEditRecord(record);
        setView('form');
    };

    const handleAddNew = () => {
        setEditRecord(null);
        setView('form');
    };

    const handleSaved = () => {
        setView('list');
        setEditRecord(null);
    };

    const handleCancel = () => {
        setView('list');
        setEditRecord(null);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {view === 'list' && (
                <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-200/80 gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-xl shadow-inner" aria-hidden="true">
                                📜
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
                                    {t('history.title', 'Crop History & Rotations')}
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                    {t('history.subtitle', 'Track historical harvests and past planting seasons across your farms.')}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleAddNew}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm hover:shadow transition-all text-xs sm:text-sm flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 self-start sm:self-auto"
                        >
                            <span>+</span>
                            <span>{t('history.addCropRecord', 'Add Crop Record')}</span>
                        </button>
                    </div>
                    <CropHistoryList onEdit={handleEdit} />
                </div>
            )}

            {view === 'form' && (
                <CropHistoryForm
                    editRecord={editRecord}
                    onSaved={handleSaved}
                    onCancel={handleCancel}
                />
            )}
        </div>
    );
};
