import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../../context/LanguageContext';
import { authService } from '../../../services/auth.service';

export const ProfilePage = () => {
    const { t } = useTranslation();
    const [profile, setProfile] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        mobileNumber: '',
        location: '',
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [saveError, setSaveError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [validationErrors, setValidationErrors] = useState({});

    const fetchProfile = useCallback(async () => {
        setIsLoading(true);
        setLoadError('');
        try {
            const res = await authService.getProfile();
            if (res.data?.user) {
                const u = res.data.user;
                setProfile(u);
                setFormData({
                    name: u.name || '',
                    mobileNumber: u.mobileNumber || '',
                    location: u.location || '',
                });
            } else {
                setLoadError('Unable to load user profile details.');
            }
        } catch (err) {
            setLoadError(err.message || 'Failed to load profile.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (validationErrors[name]) {
            setValidationErrors((prev) => ({ ...prev, [name]: '' }));
        }
        setSaveError('');
        setSuccessMessage('');
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.name || !formData.name.trim()) {
            errors.name = t('auth.nameRequired', 'Full name is required');
        }
        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        setIsSaving(true);
        setSaveError('');
        setSuccessMessage('');

        const payload = {
            name: formData.name.trim(),
            mobileNumber: formData.mobileNumber.trim() ? formData.mobileNumber.trim() : null,
            location: formData.location.trim() ? formData.location.trim() : null,
        };

        try {
            const res = await authService.updateProfile(payload);
            if (res.data?.user) {
                const updated = res.data.user;
                setProfile(updated);
                setFormData({
                    name: updated.name || '',
                    mobileNumber: updated.mobileNumber || '',
                    location: updated.location || '',
                });
                setSuccessMessage(t('auth.profileUpdatedSuccess', 'Profile updated successfully!'));
                setIsEditing(false);
            }
        } catch (err) {
            setSaveError(err.message || 'Failed to update profile.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (profile) {
            setFormData({
                name: profile.name || '',
                mobileNumber: profile.mobileNumber || '',
                location: profile.location || '',
            });
        }
        setValidationErrors({});
        setSaveError('');
        setIsEditing(false);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return dateString;
        }
    };

    const farmerInitial = (profile?.name || 'F').charAt(0).toUpperCase();

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-card border border-emerald-100/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-700 text-white flex items-center justify-center font-extrabold text-2xl shadow-md border-2 border-white">
                        {farmerInitial}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
                                {profile?.name || t('auth.profileTitle', 'Farmer Profile')}
                            </h2>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                {t('common.active', 'Active')}
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                            {t('auth.profileSubhead', 'Manage your personal contact details and regional farming location.')}
                        </p>
                    </div>
                </div>

                {!isLoading && !isEditing && profile && (
                    <button
                        type="button"
                        id="edit-profile-btn"
                        onClick={() => {
                            setIsEditing(true);
                            setSuccessMessage('');
                            setSaveError('');
                        }}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 flex items-center gap-1.5"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>{t('auth.editProfile', 'Edit Profile')}</span>
                    </button>
                )}
            </div>

            {/* Success Message Banner */}
            {successMessage && (
                <div
                    id="profile-success-banner"
                    role="alert"
                    className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between text-sm shadow-sm"
                >
                    <div className="flex items-center gap-2.5">
                        <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000-16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold">{successMessage}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setSuccessMessage('')}
                        className="text-emerald-700 hover:text-emerald-900 text-base font-bold ml-4 leading-none"
                        aria-label="Dismiss success message"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="bg-white p-12 rounded-2xl shadow-card border border-emerald-100/80 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent" role="status">
                        <span className="sr-only">{t('common.loading', 'Loading…')}</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-500">{t('auth.loadingProfileInfo', 'Loading your profile information…')}</p>
                </div>
            )}

            {/* Load Error State */}
            {!isLoading && loadError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-2xl text-center space-y-3">
                    <p className="font-semibold text-sm">{loadError}</p>
                    <button
                        type="button"
                        onClick={fetchProfile}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
                    >
                        {t('auth.retryLoadingProfile', 'Retry Loading Profile')}
                    </button>
                </div>
            )}

            {/* Read-Only Profile View */}
            {!isLoading && !loadError && profile && !isEditing && (
                <div className="bg-white rounded-2xl shadow-card border border-emerald-100/80 overflow-hidden divide-y divide-slate-100">
                    <div className="p-6 sm:p-7 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                {t('auth.fullNameLabel', 'Full Name')}
                            </span>
                            <p className="text-base font-bold text-slate-800">{profile.name || t('auth.notProvided', 'Not provided')}</p>
                        </div>
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                {t('auth.registeredEmail', 'Registered Email')}
                            </span>
                            <p className="text-base font-bold text-slate-800">{profile.email}</p>
                        </div>
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                {t('auth.mobileNumberLabel', 'Mobile Number')}
                            </span>
                            <p className="text-base font-bold text-slate-800">{profile.mobileNumber || t('auth.notSpecified', 'Not specified')}</p>
                        </div>
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                {t('auth.farmingDistrictRegion', 'Farming District / Region')}
                            </span>
                            <p className="text-base font-bold text-slate-800">{profile.location || t('auth.notSpecified', 'Not specified')}</p>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 gap-2">
                        <span>{t('auth.memberSince', 'Member since {date}', { date: formatDate(profile.createdAt) })}</span>
                        <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                            {t('auth.credentialsVerified', 'Credentials verified')}
                        </span>
                    </div>
                </div>
            )}

            {/* Editable Profile Form */}
            {!isLoading && isEditing && (
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-card border border-emerald-100/80">
                    <h3 className="text-lg font-extrabold text-slate-800 mb-5">{t('auth.editProfileTitle', 'Edit Profile Information')}</h3>

                    {saveError && (
                        <div id="profile-save-error" role="alert" className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-semibold">
                            {saveError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                {t('auth.fullNameLabel', 'Full Name')} <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all outline-none ${
                                    validationErrors.name
                                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-400'
                                        : 'border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                                }`}
                                placeholder="e.g. Ramesh Kumar"
                            />
                            {validationErrors.name && (
                                <p className="text-rose-600 text-xs font-semibold mt-1">{validationErrors.name}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                {t('auth.registeredEmail', 'Registered Email')} <span className="text-xs text-slate-400 lowercase">({t('common.required', 'read-only')})</span>
                            </label>
                            <input
                                type="email"
                                disabled
                                value={profile?.email || ''}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-sm cursor-not-allowed"
                            />
                            <p className="text-slate-400 text-xs mt-1">{t('auth.emailReadOnly', 'Email address cannot be changed once registered.')}</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                {t('auth.mobileNumberLabel', 'Mobile Number')} <span className="text-xs text-slate-400 lowercase">({t('common.optional', 'optional')})</span>
                            </label>
                            <input
                                type="tel"
                                name="mobileNumber"
                                value={formData.mobileNumber}
                                onChange={handleInputChange}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm outline-none transition-all"
                                placeholder={t('auth.mobileNumberPlaceholder', 'e.g. +91 9876543210')}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                {t('auth.farmingDistrictRegion', 'Farming District / Region')} <span className="text-xs text-slate-400 lowercase">({t('common.optional', 'optional')})</span>
                            </label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm outline-none transition-all"
                                placeholder={t('auth.farmLocationPlaceholder', 'e.g. Pune, Maharashtra')}
                            />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={isSaving}
                                className="px-4 py-2.5 border border-slate-300 text-slate-700 text-xs sm:text-sm font-bold rounded-xl hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
                            >
                                {t('common.cancel', 'Cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                        </svg>
                                        <span>{t('auth.savingChanges', 'Saving Changes...')}</span>
                                    </>
                                ) : (
                                    t('auth.saveProfile', 'Save Profile')
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
