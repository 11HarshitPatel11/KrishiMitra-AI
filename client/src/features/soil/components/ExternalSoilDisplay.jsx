import React from 'react';
import { useTranslation } from '../../../context/LanguageContext';

/**
 * Formats SoilGrids depth-array values for display.
 * Each entry: { depth, value, unit }
 * value may be null for ocean / unmapped pixels.
 */
const formatPropertyValue = (layer) => {
    if (!layer || layer.length === 0) return 'N/A';
    // Show the first 2 depth intervals (0-5cm and 5-15cm)
    return layer.slice(0, 2).map(l => {
        const val = l.value !== null && l.value !== undefined ? `${l.value} ${l.unit || ''}` : 'N/A';
        return `${val} (${l.depth})`;
    }).join(', ');
};

export const ExternalSoilDisplay = ({ externalData, onFetch, loading, error }) => {
    const { t } = useTranslation();
    const warning = externalData?._warning;

    return (
        <div className="mt-8 border border-blue-200 rounded-lg bg-blue-50 p-6 relative">
            <span className="absolute top-4 right-4 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-blue-200">
                Source: SoilGrids (ISRIC v2.0)
            </span>

            <h3 className="text-lg font-bold text-blue-800 mb-2">{t('soil.externalSoilInfo', 'External Soil Information')}</h3>
            <p className="text-sm text-blue-600 mb-4">
                {t('soil.externalSoilDesc', 'Supplementary soil parameters fetched via geographical coordinates from ISRIC SoilGrids. Values are converted from raw API units using the official conversion factors.')}
            </p>

            <button
                onClick={onFetch}
                disabled={loading}
                className={`mb-4 px-4 py-2 ${loading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded text-sm font-medium transition-colors`}
            >
                {loading ? t('soil.retrievingData', 'Retrieving Data...') : t('soil.syncSoilGrids', 'Sync from SoilGrids')}
            </button>

            {warning && (
                <div className="text-amber-900 text-xs sm:text-sm mb-4 p-3 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-2 shadow-xs">
                    <span className="text-base leading-none">ℹ️</span>
                    <div>
                        <span className="font-semibold block mb-0.5">{t('soil.serviceNotice', 'Service Notice:')}</span>
                        <span>{warning.includes('ISRIC') ? t('soil.calibratedBaselineNote', warning) : warning}</span>
                    </div>
                </div>
            )}

            {error && <div className="text-red-600 text-sm mb-4 p-2 bg-red-100 rounded">{error}</div>}

            {externalData && externalData.properties && (
                <div className="mt-4 border-t border-blue-200 pt-4">
                    <p className="text-xs text-gray-500 mb-4">
                        Retrieved: {new Date(externalData.retrievedAt).toLocaleString()}
                        &nbsp;|&nbsp;
                        Coords: {externalData.latitude?.toFixed(4)}, {externalData.longitude?.toFixed(4)}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-2 text-sm text-gray-800">
                        <div>
                            <span className="font-semibold block text-blue-900">{t('soil.phInWater', 'pH in Water:')}</span>
                            {formatPropertyValue(externalData.properties.phh2o)}
                        </div>
                        <div>
                            <span className="font-semibold block text-blue-900">{t('soil.totalNitrogen', 'Total Nitrogen:')}</span>
                            {formatPropertyValue(externalData.properties.nitrogen)}
                        </div>
                        <div>
                            <span className="font-semibold block text-blue-900">{t('soil.organicCarbon', 'Soil Organic Carbon (SOC):')}</span>
                            {formatPropertyValue(externalData.properties.soc)}
                        </div>
                        <div>
                            <span className="font-semibold block text-blue-900">{t('soil.sandContent', 'Sand Content:')}</span>
                            {formatPropertyValue(externalData.properties.sand)}
                        </div>
                        <div>
                            <span className="font-semibold block text-blue-900">{t('soil.siltContent', 'Silt Content:')}</span>
                            {formatPropertyValue(externalData.properties.silt)}
                        </div>
                        <div>
                            <span className="font-semibold block text-blue-900">{t('soil.clayContent', 'Clay Content:')}</span>
                            {formatPropertyValue(externalData.properties.clay)}
                        </div>
                        <div>
                            <span className="font-semibold block text-blue-900">{t('soil.bulkDensity', 'Bulk Density:')}</span>
                            {formatPropertyValue(externalData.properties.bdod)}
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4 italic">
                        {t('soil.soilGridsNote', 'Note: Phosphorus (P) and Potassium (K) are not provided by SoilGrids globally. These values must be entered manually in the soil record above. SoilGrids data is for informational reference only and is not used by the crop recommendation model.')}
                    </p>
                </div>
            )}
        </div>
    );
};
