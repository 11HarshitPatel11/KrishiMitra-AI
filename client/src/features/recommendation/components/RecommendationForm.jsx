import React, { useState, useEffect } from 'react';
import { validateRecommendationInput } from '../utils/recommendation.validation';
import { recommendationService } from '../services/recommendation.service';
import { RecommendationResult } from './RecommendationResult';
import { weatherService } from '../../weather/services/weather.service';
import { getAllFarms } from '../../farm/services/farm.service';
import { INDIAN_STATES, STATE_COORDINATES } from '../../../constants/indianStates';
import { useTranslation } from '../../../context/LanguageContext';

export const RecommendationForm = () => {
    const { t } = useTranslation();
    const initialState = {
        farmId: '',
        nitrogen: '',
        phosphorus: '',
        potassium: '',
        pH: '',
        rainfall: '',
        latitude: '',
        longitude: '',
        state: '',
        district: ''
    };

    const [formData, setFormData] = useState(initialState);
    const [fetchedWeather, setFetchedWeather] = useState(null); // { temperature, humidity }
    const [weatherError, setWeatherError] = useState(null);
    const [isLocating, setIsLocating] = useState(false);
    const [isManualWeather, setIsManualWeather] = useState(false);
    const [manualTemp, setManualTemp] = useState('');
    const [manualHumidity, setManualHumidity] = useState('');
    const [errors, setErrors] = useState({});
    const [globalError, setGlobalError] = useState(null);
    const [isWeatherLoading, setIsWeatherLoading] = useState(false);
    const [isRecommendationLoading, setIsRecommendationLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [farms, setFarms] = useState([]);

    useEffect(() => {
        const fetchFarms = async () => {
            try {
                const res = await getAllFarms();
                if (res.success && res.data) {
                    setFarms(res.data);
                }
            } catch (err) {
                // Silently fails, assumes they can type manually
            }
        };
        fetchFarms();
    }, []);

    const handleFarmSelect = (e) => {
        const selectedId = e.target.value;
        const farm = farms.find(f => f._id === selectedId);

        if (farm) {
            setFormData(prev => ({
                ...prev,
                farmId: farm._id,
                nitrogen: farm.nitrogen,
                phosphorus: farm.phosphorus,
                potassium: farm.potassium,
                pH: farm.pH,
                latitude: farm.latitude || prev.latitude,
                longitude: farm.longitude || prev.longitude
            }));
            setGlobalError("Farm properties loaded. Please fetch weather using the farm's location.");
            setFetchedWeather(null);
            setWeatherError(null);
        } else {
            setFormData(prev => ({ ...prev, farmId: '' }));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let updated = { [name]: value };

        // When farmer selects a State, if coordinates are empty, auto-fill representative state coordinates
        if (name === 'state' && value && STATE_COORDINATES[value]) {
            const coords = STATE_COORDINATES[value];
            if (!formData.latitude || !formData.longitude) {
                updated.latitude = coords.latitude.toString();
                updated.longitude = coords.longitude.toString();
            }
            setWeatherError(null);
        }

        setFormData(prev => ({
            ...prev,
            ...updated
        }));

        // Clear specific validation error on change
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
        if (updated.latitude && errors.latitude) {
            setErrors(prev => ({ ...prev, latitude: null }));
        }
        if (updated.longitude && errors.longitude) {
            setErrors(prev => ({ ...prev, longitude: null }));
        }

        setGlobalError(null);

        // If coordinate changes, we must fetch weather again. 
        if (name === 'latitude' || name === 'longitude') {
            setFetchedWeather(null);
            setWeatherError(null);
        }
    };

    const executeFetchWeather = async (lat, lon) => {
        setIsWeatherLoading(true);
        setWeatherError(null);
        setGlobalError(null);
        try {
            const data = await weatherService.getCurrentWeather(lat, lon);
            setFetchedWeather(data);
        } catch (error) {
            setWeatherError(error.message || 'Unable to fetch weather data. Please check coordinates and try again.');
        } finally {
            setIsWeatherLoading(false);
        }
    };

    const detectLocation = () => {
        if (!navigator.geolocation) {
            setWeatherError('Geolocation is not supported by your browser. Please select a State or enter coordinates manually.');
            return;
        }
        setIsLocating(true);
        setWeatherError(null);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude.toFixed(4);
                const lon = position.coords.longitude.toFixed(4);
                setFormData(prev => ({
                    ...prev,
                    latitude: lat,
                    longitude: lon
                }));
                setErrors(prev => ({ ...prev, latitude: null, longitude: null }));
                setIsLocating(false);
                await executeFetchWeather(lat, lon);
            },
            (err) => {
                setIsLocating(false);
                setWeatherError('Location access was denied or timed out. Please select your State from the dropdown or enter coordinates manually.');
            },
            { timeout: 8000, enableHighAccuracy: true }
        );
    };

    const fetchWeather = async () => {
        setGlobalError(null);
        setWeatherError(null);
        setErrors(prev => ({ ...prev, latitude: null, longitude: null }));

        let lat = formData.latitude ? Number(formData.latitude) : null;
        let lon = formData.longitude ? Number(formData.longitude) : null;

        // If coordinates are missing but a State is selected, auto-fill with state coordinates
        if ((!lat || !lon) && formData.state && STATE_COORDINATES[formData.state]) {
            lat = STATE_COORDINATES[formData.state].latitude;
            lon = STATE_COORDINATES[formData.state].longitude;
            setFormData(prev => ({
                ...prev,
                latitude: lat.toString(),
                longitude: lon.toString()
            }));
        }

        // If coordinates are still missing or invalid:
        if (!lat || !lon || isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            // Try browser geolocation first!
            if (navigator.geolocation) {
                detectLocation();
                return;
            }
            setWeatherError('Coordinates required: Please enter Latitude & Longitude above, select a State, or click "Use My Location".');
            return;
        }

        await executeFetchWeather(lat, lon);
    };

    const handleApplyManualWeather = () => {
        const t = parseFloat(manualTemp);
        const h = parseFloat(manualHumidity);
        if (isNaN(t) || t < -20 || t > 60) {
            setWeatherError('Please enter a realistic temperature between -20°C and 60°C.');
            return;
        }
        if (isNaN(h) || h < 0 || h > 100) {
            setWeatherError('Please enter humidity percentage between 0% and 100%.');
            return;
        }
        setFetchedWeather({
            temperature: t,
            humidity: h,
            rainfall: null
        });
        setWeatherError(null);
        setIsManualWeather(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!fetchedWeather) {
            setGlobalError('Please fetch weather data before generating a recommendation.');
            return;
        }

        setGlobalError(null);

        // Combine inputs for validation, explicitly preserving the farmer-entered rainfall
        const payloadToValidate = {
            ...formData,
            ...fetchedWeather,
            rainfall: formData.rainfall
        };

        const { isValid, errors: validationErrors } = validateRecommendationInput(payloadToValidate);

        if (!isValid) {
            setErrors(validationErrors);
            return;
        }

        const parsedFeatures = {
            nitrogen: Number(formData.nitrogen),
            phosphorus: Number(formData.phosphorus),
            potassium: Number(formData.potassium),
            pH: Number(formData.pH),
            temperature: Number(fetchedWeather.temperature),
            humidity: Number(fetchedWeather.humidity),
            rainfall: Number(formData.rainfall),
            farmId: formData.farmId ? formData.farmId : undefined,
            state: formData.state ? formData.state.trim() : undefined,
            district: formData.district ? formData.district.trim() : undefined
        };

        setIsRecommendationLoading(true);

        try {
            const data = await recommendationService.predictCrop(parsedFeatures);
            setResult(data);
        } catch (error) {
            setGlobalError(error.message);
        } finally {
            setIsRecommendationLoading(false);
        }
    };

    const handleReset = () => {
        setFormData(initialState);
        setFetchedWeather(null);
        setWeatherError(null);
        setIsManualWeather(false);
        setManualTemp('');
        setManualHumidity('');
        setResult(null);
        setErrors({});
        setGlobalError(null);
    };

    if (result) {
        return <RecommendationResult result={result} onReset={handleReset} />;
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 sm:p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6 pb-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h2 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
                        <span>🌱</span>
                        <span>{t('recommendation.cropAdvisorHeading', 'Crop Advisor')}</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                        {t('recommendation.cropAdvisorSubhead', 'Discover crops suited to your soil and environmental conditions.')}
                    </p>
                </div>
                {farms.length > 0 && (
                    <span className="text-xs bg-green-50 text-green-800 font-semibold px-2.5 py-1 rounded-full border border-green-200 self-start sm:self-auto">
                        {t('recommendation.farmsAvailable', '{count} Farm{s} available', { count: farms.length, s: farms.length > 1 ? 's' : '' })}
                    </span>
                )}
            </div>

            {globalError && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 mb-6 rounded-xl text-sm flex items-start gap-2.5">
                    <span className="text-amber-600 font-bold" aria-hidden="true">⚠️</span>
                    <p className="leading-relaxed">{globalError}</p>
                </div>
            )}

            <div className="space-y-6">
                {/* 1. Optional Farm Auto-complete */}
                {farms.length > 0 && (
                    <div className="bg-[#FAFAF7] p-4 rounded-xl border border-stone-200">
                        <label className="block text-xs font-bold uppercase tracking-wider text-green-900 mb-1.5">
                            {t('recommendation.autocompleteFarm', 'Autocomplete from Registered Farm')}
                        </label>
                        <select
                            name="farmSelector"
                            value={formData.farmId || ''}
                            onChange={handleFarmSelect}
                            className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                        >
                            <option value="">{t('recommendation.chooseFarmOptional', '-- Choose a Farm (Optional) --')}</option>
                            {farms.map(f => (
                                <option key={f._id} value={f._id}>{f.farmName}</option>
                            ))}
                        </select>
                        <p className="text-[11px] text-stone-500 mt-1.5">
                            {t('recommendation.autocompleteFarmDesc', 'Selecting a farm auto-populates soil values and applies historical crop rotation penalties.')}
                        </p>
                    </div>
                )}

                {/* 2. Soil Nutrients & Chemistry (NPK + pH) */}
                <div>
                    <div className="mb-3">
                        <h3 className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
                            <span>🧪</span>
                            <span>{t('recommendation.soilNutrientsHeading', 'Soil Nutrients & Chemistry')}</span>
                        </h3>
                        <p className="text-xs text-stone-500">{t('recommendation.soilNutrientsSubhead', 'Provide lab-tested or estimated soil fertility parameters.')}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Nitrogen */}
                        <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                                {t('farm.nitrogenLabel', 'Nitrogen (N)')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="nitrogen"
                                value={formData.nitrogen}
                                onChange={handleChange}
                                placeholder={t('recommendation.nitrogenRatio', 'Ratio (e.g. 90)')}
                                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all ${errors.nitrogen ? 'border-red-500 bg-red-50' : 'border-stone-300'}`}
                            />
                            {errors.nitrogen && <p className="mt-1 text-xs text-red-500">{errors.nitrogen}</p>}
                        </div>

                        {/* Phosphorus */}
                        <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                                {t('farm.phosphorusLabel', 'Phosphorus (P)')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="phosphorus"
                                value={formData.phosphorus}
                                onChange={handleChange}
                                placeholder={t('recommendation.phosphorusRatio', 'Ratio (e.g. 42)')}
                                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all ${errors.phosphorus ? 'border-red-500 bg-red-50' : 'border-stone-300'}`}
                            />
                            {errors.phosphorus && <p className="mt-1 text-xs text-red-500">{errors.phosphorus}</p>}
                        </div>

                        {/* Potassium */}
                        <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                                {t('farm.potassiumLabel', 'Potassium (K)')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="potassium"
                                value={formData.potassium}
                                onChange={handleChange}
                                placeholder={t('recommendation.potassiumRatio', 'Ratio (e.g. 43)')}
                                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all ${errors.potassium ? 'border-red-500 bg-red-50' : 'border-stone-300'}`}
                            />
                            {errors.potassium && <p className="mt-1 text-xs text-red-500">{errors.potassium}</p>}
                        </div>

                        {/* Soil pH */}
                        <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                                {t('farm.phLabel', 'Soil pH (0–14)')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                name="pH"
                                value={formData.pH}
                                onChange={handleChange}
                                placeholder={t('farm.phPlaceholder', 'e.g. 6.5')}
                                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all ${errors.pH ? 'border-red-500 bg-red-50' : 'border-stone-300'}`}
                            />
                            {errors.pH && <p className="mt-1 text-xs text-red-500">{errors.pH}</p>}
                        </div>
                    </div>
                </div>

                {/* 3. Location & Coordinates (For weather & Mandi intelligence) */}
                <div className="pt-2 border-t border-stone-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                        <div>
                            <h3 className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
                                <span>📍</span>
                                <span>{t('recommendation.farmCoordsMarketRegion', 'Farm Coordinates & Market Region')}</span>
                            </h3>
                            <p className="text-xs text-stone-500">{t('recommendation.farmCoordsMarketRegionDesc', 'Used for live weather retrieval and Mandi market pricing alignment.')}</p>
                        </div>
                        <button
                            type="button"
                            onClick={detectLocation}
                            disabled={isLocating}
                            className="self-start sm:self-auto px-3 py-1.5 text-xs font-semibold rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 shadow-sm transition-all flex items-center gap-1.5"
                            title="Auto-detect current GPS coordinates"
                        >
                            {isLocating ? (
                                <>
                                    <span className="w-3 h-3 border-2 border-stone-500 border-t-transparent rounded-full animate-spin"></span>
                                    <span>{t('recommendation.detectingGpsDots', 'Detecting GPS...')}</span>
                                </>
                            ) : (
                                <>
                                    <span>📍</span>
                                    <span>{t('recommendation.useMyLocationGps', 'Use My Location (GPS)')}</span>
                                </>
                            )}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Latitude */}
                        <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                                {t('farm.latitudeLabel', 'Latitude (-90 to 90)')}
                            </label>
                            <input
                                type="number"
                                step="0.0001"
                                name="latitude"
                                value={formData.latitude}
                                onChange={handleChange}
                                placeholder={t('farm.latitudePlaceholder', 'e.g. 22.7196')}
                                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.latitude ? 'border-red-500 bg-red-50' : 'border-stone-300'}`}
                            />
                            {errors.latitude && <p className="mt-1 text-xs text-red-500">{errors.latitude}</p>}
                        </div>

                        {/* Longitude */}
                        <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                                {t('farm.longitudeLabel', 'Longitude (-180 to 180)')}
                            </label>
                            <input
                                type="number"
                                step="0.0001"
                                name="longitude"
                                value={formData.longitude}
                                onChange={handleChange}
                                placeholder={t('farm.longitudePlaceholder', 'e.g. 75.8577')}
                                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.longitude ? 'border-red-500 bg-red-50' : 'border-stone-300'}`}
                            />
                            {errors.longitude && <p className="mt-1 text-xs text-red-500">{errors.longitude}</p>}
                        </div>

                        {/* State Fallback */}
                        <div>
                            <label htmlFor="state" className="block text-xs font-semibold text-stone-700 mb-1">
                                {t('recommendation.stateLabel', 'State')} <span className="text-stone-400 font-normal">({t('common.optional', 'Optional')})</span>
                            </label>
                            <select
                                id="state"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 text-sm border rounded-lg bg-white focus:ring-2 focus:ring-green-500 outline-none ${errors.state ? 'border-red-500' : 'border-stone-300'}`}
                            >
                                <option value="">{t('recommendation.selectState', '-- Select State --')}</option>
                                {INDIAN_STATES.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                            {errors.state && <p className="mt-1 text-xs text-red-500">{errors.state}</p>}
                        </div>

                        {/* District Fallback */}
                        <div>
                            <label htmlFor="district" className="block text-xs font-semibold text-stone-700 mb-1">
                                {t('recommendation.districtLabel', 'District')} <span className="text-stone-400 font-normal">({t('common.optional', 'Optional')})</span>
                            </label>
                            <input
                                id="district"
                                type="text"
                                name="district"
                                value={formData.district}
                                onChange={handleChange}
                                placeholder="e.g. Indore"
                                className={`w-full px-3 py-2 text-sm border rounded-lg bg-white focus:ring-2 focus:ring-green-500 outline-none ${errors.district ? 'border-red-500' : 'border-stone-300'}`}
                            />
                            {errors.district && <p className="mt-1 text-xs text-red-500">{errors.district}</p>}
                        </div>
                    </div>
                </div>

                {/* 4. Rainfall Input & Compact Expandable Transparency Guidance */}
                <div className="md:col-span-2 bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-2">
                        <label htmlFor="rainfall" className="block text-sm font-semibold text-stone-900">
                            {t('recommendation.rainfallLabel', 'Rainfall (mm)')} <span className="text-red-500" aria-hidden="true">*</span>
                        </label>
                        <span className="text-xs text-emerald-800 font-medium mt-0.5 sm:mt-0">
                            {t('recommendation.manualEntryRequired', 'Manual Entry Required')} &bull; {t('recommendation.rainfallUnit', 'Millimetres (mm)')}
                        </span>
                    </div>

                    <div className="max-w-xs">
                        <input
                            id="rainfall"
                            type="number"
                            step="0.01"
                            name="rainfall"
                            value={formData.rainfall}
                            onChange={handleChange}
                            placeholder={t('recommendation.rainfallPlaceholder', 'e.g. 100')} /* placeholder="e.g. 100" */
                            aria-describedby="rainfall-helper rainfall-guidance"
                            aria-invalid={errors.rainfall ? "true" : "false"}
                            className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white outline-none ${errors.rainfall ? 'border-red-500 bg-red-50' : 'border-stone-300'}`}
                        />
                    </div>

                    <p id="rainfall-helper" className="mt-1.5 text-xs text-stone-600">
                        {t('recommendation.rainfallHelper', 'Enter the expected rainfall in millimetres (mm) for your crop planning period.')}
                    </p>
                    {errors.rainfall && (
                        <p id="rainfall-error" role="alert" className="mt-1 text-xs text-red-600 font-medium">
                            {errors.rainfall}
                        </p>
                    )}

                    {/* Compact Expandable Guidance Disclosure */}
                    <details
                        id="rainfall-guidance"
                        className="mt-3 bg-white border border-emerald-200 rounded-lg p-3 text-xs text-stone-700 shadow-sm cursor-pointer group"
                        role="region"
                        aria-label="Rainfall Input Guidance"
                    >
                        <summary className="font-semibold text-emerald-900 text-xs flex items-center justify-between select-none">
                            <span className="flex items-center gap-1.5">
                                <span aria-hidden="true">ℹ️</span>
                                <span>{t('recommendation.understandingRainfall', 'Understanding the Rainfall Input')}</span>
                                <span className="text-[11px] font-normal text-stone-500">({t('recommendation.aboutRainfall', 'About rainfall')})</span>
                            </span>
                            <span className="text-emerald-700 text-xs font-bold group-open:rotate-180 transition-transform">
                                &#9660;
                            </span>
                        </summary>
                        <div className="mt-2.5 pt-2.5 border-t border-emerald-100 space-y-1.5 text-stone-600 leading-relaxed cursor-default">
                            <ul className="list-disc list-inside space-y-1">
                                <li>
                                    <strong className="text-stone-800">{t('recommendation.modelRequirement', 'Model Requirement:')}</strong> {t('recommendation.modelRequirementDesc', 'Rainfall is one of seven environmental inputs evaluated by the crop recommendation model to assess crop viability.')}
                                </li>
                                <li>
                                    <strong className="text-stone-800">{t('recommendation.undocumentedPeriod', 'Undocumented Accumulation Period:')}</strong> {t('recommendation.undocumentedPeriodDesc', 'The public benchmark dataset used to train the model does not document the specific temporal accumulation period (such as annual total, seasonal average, or monthly sum) for the rainfall feature.')}
                                </li>
                                <li>
                                    <strong className="text-stone-800">{t('recommendation.whyWeatherNotSubstituted', 'Why Weather API Is Not Auto-Substituted:')}</strong> {t('recommendation.whyWeatherNotSubstitutedDesc', 'Current precipitation from the weather service measures instantaneous rainfall occurring right now (typically 0 mm), representing a completely different measurement that cannot be safely substituted automatically.')}
                                </li>
                                <li>
                                    <strong className="text-stone-800">{t('recommendation.farmerAction', 'Farmer Action:')}</strong> {t('recommendation.farmerActionDesc', 'Enter a rainfall value only when you have a reasonable local basis (such as local agricultural extension bulletins, seasonal rainfall normals, or historical farm records).')}
                                </li>
                            </ul>
                        </div>
                    </details>
                </div>

                {/* 5. Live Weather Retrieval & Preview */}
                <div className="bg-[#FAFAF7] p-4 sm:p-5 rounded-xl border border-stone-200">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                                <span>🌤️</span>
                                <span>{t('recommendation.weatherInfoHeading', 'Weather Information')}</span>
                            </h3>
                            <p className="text-xs text-stone-500 mt-0.5">
                                {t('recommendation.weatherInfoSubhead', 'Temperature and humidity are automatically retrieved for prediction. Rainfall is managed separately above.')}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                type="button"
                                onClick={detectLocation}
                                disabled={isLocating || isWeatherLoading}
                                className="px-3 py-2 text-xs font-semibold rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 shadow-sm transition-all flex items-center gap-1.5"
                                title="Detect GPS coordinates using your browser"
                            >
                                {isLocating ? (
                                    <>
                                        <span className="w-3 h-3 border-2 border-stone-500 border-t-transparent rounded-full animate-spin"></span>
                                        <span>{t('recommendation.detectingGpsDots', 'Detecting GPS...')}</span>
                                    </>
                                ) : (
                                    <>
                                        <span>📍</span>
                                        <span>{t('recommendation.useMyLocationGps', 'Use My Location')}</span>
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={fetchWeather}
                                disabled={isWeatherLoading}
                                className={`px-4 py-2.5 text-xs font-bold rounded-lg text-white shadow-sm transition-all whitespace-nowrap
                                    ${isWeatherLoading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
                                `}
                            >
                                {isWeatherLoading ? t('recommendation.fetchingWeatherDots', 'Fetching weather...') : fetchedWeather ? t('recommendation.refreshWeatherBtn', 'Refresh Weather') : t('recommendation.getWeatherBtn', 'Get Weather')}
                            </button>
                        </div>
                    </div>

                    {/* Inline Weather Error & Instant Recovery Actions */}
                    {weatherError && (
                        <div className="mt-3.5 p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-2">
                            <div className="flex items-start gap-2">
                                <span className="text-amber-600 font-bold text-sm">⚠️</span>
                                <p className="leading-relaxed">{weatherError}</p>
                            </div>
                            <div className="flex items-center gap-2 pt-1 flex-wrap">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const defaultCoords = { lat: '22.9734', lon: '78.6569', state: 'Madhya Pradesh' };
                                        setFormData(prev => ({
                                             ...prev,
                                            latitude: defaultCoords.lat,
                                            longitude: defaultCoords.lon,
                                            state: prev.state || defaultCoords.state
                                        }));
                                        executeFetchWeather(defaultCoords.lat, defaultCoords.lon);
                                    }}
                                    className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded text-[11px] font-semibold transition-all"
                                >
                                    Use Central India (Auto-Fill & Fetch)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsManualWeather(prev => !prev)}
                                    className="px-3 py-1 bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 rounded text-[11px] font-semibold transition-all"
                                >
                                    {isManualWeather ? 'Cancel Manual Input' : 'Enter Manually'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Manual Weather Entry Drawer */}
                    {isManualWeather && (
                        <div className="mt-3.5 p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg">
                            <p className="text-xs font-bold text-blue-900 mb-2">{t('recommendation.manualWeatherHeading', 'Manual Weather Input')}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">{t('recommendation.temperatureLabel', 'Temperature (°C)')}</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="e.g. 27.5"
                                        value={manualTemp}
                                        onChange={(e) => setManualTemp(e.target.value)}
                                        className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">{t('recommendation.humidityLabel', 'Humidity (%)')}</label>
                                    <input
                                        type="number"
                                        step="1"
                                        placeholder="e.g. 65"
                                        value={manualHumidity}
                                        onChange={(e) => setManualHumidity(e.target.value)}
                                        className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded bg-white"
                                    />
                                </div>
                            </div>
                            <div className="mt-2.5 flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleApplyManualWeather}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold"
                                >
                                    {t('recommendation.applyWeatherValuesBtn', 'Apply Weather Values')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsManualWeather(false)}
                                    className="px-2.5 py-1.5 text-xs text-stone-600 hover:text-stone-800"
                                >
                                    {t('common.cancel', 'Cancel')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Live Weather Preview Result */}
                    {fetchedWeather && (
                        <div className="mt-4 pt-3 border-t border-stone-200">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-stone-600 mb-2.5 gap-1">
                                <span className="font-semibold text-emerald-800 flex items-center gap-1">
                                    <span>✓</span> {t('recommendation.weatherSuccessRetrieved', 'Weather data successfully retrieved and applied')}
                                </span>
                                <span className="text-[11px] text-stone-500 font-mono">
                                    📍 {formData.latitude ? `${formData.latitude}°N, ${formData.longitude}°E` : 'Manual Input'}
                                    {formData.state ? ` (${formData.state})` : ''}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-center">
                                <div className="bg-white p-3 rounded-lg border border-stone-200 shadow-sm">
                                    <p className="text-[11px] text-stone-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                                        <span>🌡️</span> {t('recommendation.temperatureLabel', 'Temperature')}
                                    </p>
                                    <p className="text-xl font-extrabold text-stone-800 mt-0.5">{fetchedWeather.temperature} °C</p>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-stone-200 shadow-sm">
                                    <p className="text-[11px] text-stone-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                                        <span>💧</span> {t('recommendation.humidityLabel', 'Humidity')}
                                    </p>
                                    <p className="text-xl font-extrabold text-stone-800 mt-0.5">{fetchedWeather.humidity} %</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 6. Form Submission */}
                <div className="pt-2">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isRecommendationLoading || !fetchedWeather}
                        className={`w-full py-3.5 px-6 flex justify-center items-center gap-2 text-white font-bold text-sm rounded-xl shadow-md transition-all
                            ${(isRecommendationLoading || !fetchedWeather)
                                ? 'bg-green-300 cursor-not-allowed'
                                : 'bg-green-700 hover:bg-green-800 hover:shadow-lg focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
                            }`
                        }
                    >
                        {isRecommendationLoading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                <span>{t('recommendation.generatingRecommendationDots', 'Generating recommendation...')}</span>
                            </>
                        ) : (
                            <span>{t('recommendation.findSuitableCropsBtn', 'Find Suitable Crops →')}</span>
                        )}
                    </button>
                    {!fetchedWeather && (
                        <p className="text-center text-[11px] text-stone-400 mt-2">
                            {t('recommendation.pleaseClickGetWeather', '* Please click "Get Weather" above before generating recommendations.')}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
