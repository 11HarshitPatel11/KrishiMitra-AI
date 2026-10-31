import React, { useState } from 'react';
import { useTranslation } from '../../../context/LanguageContext';
import { reverseGeocodeCoordinates } from '../services/farm.service';

/**
 * FarmLocationInput
 * ---------------------------------------------------------------------------
 * Accessible, farmer-friendly location & GPS coordinate component:
 * - One-click "Use My Current Location" using browser Geolocation API
 * - Explicit error handling (permission denied, timeout, unavailable, unsupported)
 * - Automatic coordinate formatting (6 decimals)
 * - Automatic reverse geocoding into readable village/district/state address
 * - Always-accessible manual coordinate and location fallback entry
 * - Zero-dependency OpenStreetMap parcel preview link
 * ---------------------------------------------------------------------------
 */
export const FarmLocationInput = ({
    latitude,
    longitude,
    location,
    onChange,
    errors = {},
    idPrefix = 'farm',
}) => {
    const { t } = useTranslation();
    const [isLocating, setIsLocating] = useState(false);
    const [geoStatus, setGeoStatus] = useState(null); // { type: 'loading' | 'success' | 'error' | 'info', message: string, accuracy?: number }

    const handleUseCurrentLocation = () => {
        if (!navigator || !navigator.geolocation) {
            setGeoStatus({
                type: 'error',
                message: t('farm.geoNotSupported', 'Geolocation is not supported by your browser. Please enter coordinates manually.'),
            });
            return;
        }

        setIsLocating(true);
        setGeoStatus({
            type: 'loading',
            message: t('farm.requestingGpsMsg', 'Detecting GPS coordinates from your device...'),
        });

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
        };

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = Number(position.coords.latitude.toFixed(6));
                const lng = Number(position.coords.longitude.toFixed(6));
                const accuracy = Math.round(position.coords.accuracy || 0);

                // Update coordinates in parent form
                onChange('latitude', lat);
                onChange('longitude', lng);

                let statusMsg = t('farm.locationCapturedMsg', 'Location detected ({lat}°, {lng}°) · Accuracy ±{acc}m', {
                    lat,
                    lng,
                    acc: accuracy,
                });

                setGeoStatus({
                    type: 'success',
                    message: `${statusMsg}. Resolving address...`,
                    accuracy,
                });

                // Auto-resolve readable address via configured reverse-geocoding provider
                try {
                    const geoRes = await reverseGeocodeCoordinates(lat, lng);
                    if (geoRes.success && geoRes.data) {
                        const resolvedAddress = geoRes.data.formatted ||
                            [geoRes.data.village, geoRes.data.district, geoRes.data.state].filter(Boolean).join(', ');

                        if (resolvedAddress) {
                            onChange('location', resolvedAddress);
                            setGeoStatus({
                                type: 'success',
                                message: t('farm.addressResolvedMsg', 'GPS captured and resolved to: {address}', { address: resolvedAddress }),
                                accuracy,
                            });
                            setIsLocating(false);
                            return;
                        }
                    }
                } catch {
                    // Reverse geocoding error handled silently; coordinates are preserved
                }

                setGeoStatus({
                    type: 'success',
                    message: statusMsg,
                    accuracy,
                });
                setIsLocating(false);
            },
            (error) => {
                setIsLocating(false);
                let message = t('farm.positionUnavailable', 'GPS location is currently unavailable. Please check your device location settings or enter coordinates manually.');

                switch (error.code) {
                    case 1: // PERMISSION_DENIED
                        message = t('farm.permissionDenied', 'Location access was denied. Please allow location permissions in your browser or enter coordinates manually.');
                        break;
                    case 2: // POSITION_UNAVAILABLE
                        message = t('farm.positionUnavailable', 'GPS location is currently unavailable. Please check your device location settings or enter coordinates manually.');
                        break;
                    case 3: // TIMEOUT
                        message = t('farm.timeoutMsg', 'Location request timed out. Please try again or enter coordinates manually.');
                        break;
                    default:
                        if (error.message) message = error.message;
                        break;
                }

                setGeoStatus({
                    type: 'error',
                    message,
                });
            },
            options
        );
    };

    const hasValidCoords =
        latitude !== '' &&
        latitude !== null &&
        latitude !== undefined &&
        !isNaN(Number(latitude)) &&
        Number(latitude) >= -90 &&
        Number(latitude) <= 90 &&
        longitude !== '' &&
        longitude !== null &&
        longitude !== undefined &&
        !isNaN(Number(longitude)) &&
        Number(longitude) >= -180 &&
        Number(longitude) <= 180;

    return (
        <div className="bg-[#FAF9F5] border border-stone-200/90 rounded-2xl p-4 sm:p-5 space-y-4">
            {/* Header & Quick Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h4 className="text-xs sm:text-sm font-bold text-stone-900 flex items-center gap-1.5">
                        <span>📍</span>
                        <span>{t('farm.locationSectionTitle', 'Farm Location & GPS Coordinates')}</span>
                        <span className="text-[11px] font-normal text-stone-500">({t('common.optional', 'Optional')})</span>
                    </h4>
                    <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
                        {t('farm.locationSectionDesc', 'Used to fetch local weather forecasts, SoilGrids data, and nearby mandi prices.')}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating}
                    id={`${idPrefix}-use-location-btn`}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-sm transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 shrink-0"
                >
                    {isLocating ? (
                        <>
                            <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            <span>{t('farm.detectingGps', 'Detecting GPS…')}</span>
                        </>
                    ) : (
                        <>
                            <span>🎯</span>
                            <span>{t('farm.useCurrentLocationBtn', 'Use My Current Location')}</span>
                        </>
                    )}
                </button>
            </div>

            {/* Status & Feedback Banner */}
            {geoStatus && (
                <div
                    role={geoStatus.type === 'error' ? 'alert' : 'status'}
                    className={`p-3 rounded-xl text-xs flex items-start justify-between gap-2 border transition-all ${
                        geoStatus.type === 'error'
                            ? 'bg-rose-50 border-rose-200 text-rose-800'
                            : geoStatus.type === 'success'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                >
                    <div className="flex items-start gap-2">
                        <span className="mt-0.5 font-bold">
                            {geoStatus.type === 'error' ? '⚠️' : geoStatus.type === 'success' ? '✅' : '📡'}
                        </span>
                        <p className="leading-relaxed">{geoStatus.message}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setGeoStatus(null)}
                        className="text-stone-400 hover:text-stone-700 font-bold px-1"
                        aria-label="Dismiss location message"
                    >
                        &times;
                    </button>
                </div>
            )}

            {/* Farm Location Text Field */}
            <div>
                <label
                    htmlFor={`${idPrefix}-location`}
                    className="block text-xs font-semibold text-stone-700 mb-1"
                >
                    {t('farm.farmLocationAddressLabel', 'Farm Location / Address')}
                </label>
                <input
                    type="text"
                    id={`${idPrefix}-location`}
                    name="location"
                    value={location || ''}
                    onChange={(e) => onChange('location', e.target.value)}
                    placeholder={t('farm.farmLocationAddressPlaceholder', 'e.g. Sanwer, Indore, Madhya Pradesh')}
                    maxLength={200}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm outline-none transition-all ${
                        errors.location ? 'border-red-500 bg-red-50' : 'border-stone-300 bg-white'
                    }`}
                />
                {errors.location ? (
                    <p className="mt-1 text-xs text-red-600">{errors.location}</p>
                ) : (
                    <p className="mt-1 text-[11px] text-stone-400">
                        {t('farm.farmLocationHelp', 'Village, tehsil, district, or state name for identifying your parcel.')}
                    </p>
                )}
            </div>

            {/* Latitude and Longitude Fields (Manual Fallback) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label
                        htmlFor={`${idPrefix}-latitude`}
                        className="block text-xs font-semibold text-stone-700 mb-1"
                    >
                        {t('farm.latitudeLabel', 'Latitude (-90 to 90)')}
                    </label>
                    <input
                        type="number"
                        id={`${idPrefix}-latitude`}
                        name="latitude"
                        step="0.000001"
                        min="-90"
                        max="90"
                        value={latitude ?? ''}
                        onChange={(e) => onChange('latitude', e.target.value)}
                        placeholder={t('farm.latitudePlaceholder', 'e.g. 22.719568')}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm outline-none transition-all ${
                            errors.latitude ? 'border-red-500 bg-red-50' : 'border-stone-300 bg-white'
                        }`}
                    />
                    {errors.latitude && <p className="mt-1 text-xs text-red-600">{errors.latitude}</p>}
                </div>

                <div>
                    <label
                        htmlFor={`${idPrefix}-longitude`}
                        className="block text-xs font-semibold text-stone-700 mb-1"
                    >
                        {t('farm.longitudeLabel', 'Longitude (-180 to 180)')}
                    </label>
                    <input
                        type="number"
                        id={`${idPrefix}-longitude`}
                        name="longitude"
                        step="0.000001"
                        min="-180"
                        max="180"
                        value={longitude ?? ''}
                        onChange={(e) => onChange('longitude', e.target.value)}
                        placeholder={t('farm.longitudePlaceholder', 'e.g. 75.857727')}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm outline-none transition-all ${
                            errors.longitude ? 'border-red-500 bg-red-50' : 'border-stone-300 bg-white'
                        }`}
                    />
                    {errors.longitude && <p className="mt-1 text-xs text-red-600">{errors.longitude}</p>}
                </div>
            </div>

            {/* Map Preview Link (Zero-dependency OSM link) */}
            {hasValidCoords && (
                <div className="pt-2 flex items-center justify-between text-xs text-stone-500 border-t border-stone-200/60">
                    <span className="flex items-center gap-1 text-[11px] text-stone-600">
                        <span>🗺️</span>
                        <span>{t('farm.parcelCoordinatesSet', 'Parcel coordinates set: {lat}°, {lng}°', { lat: Number(latitude).toFixed(4), lng: Number(longitude).toFixed(4) })}</span>
                    </span>
                    <a
                        href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        id={`${idPrefix}-osm-link`}
                        className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800 underline text-[11px]"
                        title="Open parcel location in OpenStreetMap in a new tab"
                    >
                        <span>{t('common.previewOnOsm', 'Preview on OpenStreetMap')}</span>
                        <span>↗</span>
                    </a>
                </div>
            )}
        </div>
    );
};
