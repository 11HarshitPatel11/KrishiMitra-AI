import React, { useState } from 'react';
import { diseaseService } from '../services/disease.service';
import { useTranslation } from '../../../context/LanguageContext';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const DiseaseDetectionPage = () => {
    const { t } = useTranslation();
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        resetState();

        if (!file) return;

        if (!ALLOWED_TYPES.includes(file.type)) {
            setError(`Unsupported file type. Allowed types: JPEG, PNG, WebP`);
            e.target.value = '';
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            setError(`File size exceeds 5MB limit (Current: ${(file.size / 1024 / 1024).toFixed(2)} MB)`);
            e.target.value = '';
            return;
        }

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleRemoveImage = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setSelectedFile(null);
        setPreviewUrl(null);
        const input = document.getElementById('disease-image-upload');
        if (input) input.value = '';
    };

    const resetState = () => {
        setError(null);
        setResult(null);
    };

    const handleTryAnother = () => {
        resetState();
        handleRemoveImage();
    };

    const handleDetect = async () => {
        if (!selectedFile) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await diseaseService.predictDisease(selectedFile);
            setResult(data.data);
        } catch (err) {
            if (err.status === 401) {
                setError(err.message);
            } else {
                setError(err.message || 'An unexpected error occurred during prediction.');
            }
        } finally {
            setLoading(false);
        }
    };

    const formatClassName = (className) => {
        if (!className) return '';
        const parts = className.split('___');
        if (parts.length === 2) {
            return `${parts[0].replace(/_/g, ' ')} — ${parts[1].replace(/_/g, ' ')}`;
        }
        return className.replace(/_/g, ' ');
    };

    const renderConfidentResult = () => {
        const { prediction, top3, information, informationStatus } = result;
        const confidencePct = (Number(prediction.confidence) * 100).toFixed(1);

        return (
            <div className="mt-8 space-y-6">
                {/* Primary Prediction Card */}
                <div className="bg-gradient-to-br from-green-50 via-white to-emerald-50/50 border border-green-300 rounded-2xl p-6 sm:p-7 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-green-900 bg-green-100 px-3 py-1 rounded-full self-start">
                            {t('disease.modelPrediction', 'Model Prediction')}
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-stone-500 font-semibold">{t('disease.confidenceLabel', 'Model Confidence')}:</span>
                            <span className="text-sm font-extrabold text-green-800 bg-white px-2.5 py-1 rounded-lg border border-green-200 shadow-sm">
                                {confidencePct}%
                            </span>
                        </div>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 capitalize tracking-tight mb-3">
                        {formatClassName(prediction.className)}
                    </h2>

                    <div className="text-xs text-amber-900 bg-amber-50/80 border border-amber-200 p-3.5 rounded-xl leading-relaxed">
                        <span className="font-bold">{t('disease.agriculturalAdvisory', 'Agricultural Advisory:')}</span> {t('disease.agriculturalAdvisoryText', 'Visual model outputs represent pattern probabilities and are not confirmed laboratory diagnoses. Consult a certified local agricultural extension specialist before applying chemical or cultural interventions.')}
                    </div>

                    {informationStatus === 'unavailable' && (
                        <div className="bg-stone-50 border-l-4 border-stone-400 p-4 mt-4 rounded-r-lg">
                            <p className="text-xs text-stone-700 font-bold">{t('disease.infoUnavailable', 'Detailed verified agronomic information for this classification is currently unavailable.')}</p>
                            <p className="text-xs text-stone-500 mt-1">{t('disease.infoUnavailableSub', 'If this is a healthy crop or rare condition, disease management records are intentionally withheld to prevent unverified treatments.')}</p>
                        </div>
                    )}
                </div>

                {/* Verified Agronomic Knowledge Profile */}
                {information && (
                    <div className="bg-white border border-stone-200 shadow-sm rounded-2xl overflow-hidden">
                        <div className="p-6 sm:p-7 space-y-5">
                            <div className="border-b border-stone-100 pb-3">
                                <h3 className="text-lg font-bold text-stone-900">
                                    {t('disease.verifiedDiseaseInfo', 'Verified Disease Information')}
                                </h3>
                                <p className="text-xs text-stone-500 mt-0.5">{t('disease.verifiedDiseaseInfoDesc', 'Agronomic profiles compiled from official state university extension sources.')}</p>
                            </div>

                            {information.symptoms && information.symptoms.length > 0 && (
                                <div>
                                    <h4 className="font-bold text-sm text-stone-800 flex items-center gap-1.5">
                                        <span>🔍</span>
                                        <span>{t('disease.symptomsHeading', 'Symptoms')}</span>
                                    </h4>
                                    <ul className="list-disc pl-5 mt-2 space-y-1 text-xs text-stone-600 leading-relaxed">
                                        {information.symptoms.map((symptom, i) => (
                                            <li key={i}>{symptom}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {information.causes && information.causes.length > 0 && (
                                <div className="pt-3 border-t border-stone-100">
                                    <h4 className="font-bold text-sm text-stone-800 flex items-center gap-1.5">
                                        <span>🧬</span>
                                        <span>{t('disease.causesHeading', 'Causes / Pathogen')}</span>
                                    </h4>
                                    <ul className="list-disc pl-5 mt-2 space-y-1 text-xs text-stone-600 leading-relaxed">
                                        {information.causes.map((cause, i) => (
                                            <li key={i}>{cause}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {information.prevention && information.prevention.length > 0 && (
                                <div className="pt-3 border-t border-stone-100">
                                    <h4 className="font-bold text-sm text-stone-800 flex items-center gap-1.5">
                                        <span>🛡️</span>
                                        <span>{t('disease.preventionHeading', 'Prevention Practices')}</span>
                                    </h4>
                                    <ul className="list-disc pl-5 mt-2 space-y-1 text-xs text-stone-600 leading-relaxed">
                                        {information.prevention.map((prev, i) => (
                                            <li key={i}>{prev}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {information.management && information.management.length > 0 && (
                                <div className="pt-3 border-t border-stone-100">
                                    <h4 className="font-bold text-sm text-stone-800 flex items-center gap-1.5">
                                        <span>🌾</span>
                                        <span>{t('disease.managementHeading', 'General Management')}</span>
                                    </h4>
                                    <ul className="list-disc pl-5 mt-2 space-y-1 text-xs text-stone-600 leading-relaxed">
                                        {information.management.map((mgmt, i) => (
                                            <li key={i}>{mgmt}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {information.limitations && (
                                <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                                    <h5 className="font-bold text-[11px] text-amber-900 uppercase tracking-wider">
                                        {t('disease.diagnosticLimitations', 'Diagnostic Limitations')}
                                    </h5>
                                    <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                                        {information.limitations}
                                    </p>
                                </div>
                            )}

                            {information.sourceName && (
                                <div className="mt-4 pt-3 border-t border-stone-100 text-xs text-stone-500 flex items-center justify-between">
                                    <span>{t('disease.sourceAuthority', 'Source Authority:')}</span>
                                    {information.sourceUrl ? (
                                        <a
                                            href={information.sourceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-green-700 underline font-bold hover:text-green-900"
                                        >
                                            {information.sourceName} &nearr;
                                        </a>
                                    ) : (
                                        <span className="font-bold text-stone-800">{information.sourceName}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Candidate Alternatives */}
                {top3 && top3.length > 0 && (
                    <div className="bg-[#FAFAF7] border border-stone-200 rounded-2xl p-5">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500 mb-3">
                            {t('disease.otherPredictions', 'Other Model Predictions')}
                        </h4>
                        <div className="space-y-2">
                            {top3.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-stone-200 text-xs">
                                    <span className="font-medium text-stone-800">{formatClassName(item.className)}</span>
                                    <span className="font-bold text-stone-500">{(Number(item.confidence) * 100).toFixed(1)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderUncertainResult = () => {
        const { top3 } = result;
        return (
            <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-6 sm:p-7 space-y-4">
                <div className="flex items-center gap-2 text-amber-900">
                    <span className="text-2xl">⚠️</span>
                    <h2 className="text-xl sm:text-2xl font-bold">{t('disease.predictionUncertain', 'Prediction is uncertain')}</h2>
                </div>
                <p className="text-amber-900 text-sm leading-relaxed">
                    {t('disease.predictionUncertainHelp', 'Please upload a clearer leaf image with better lighting and the leaf clearly visible.')}
                </p>

                {top3 && top3.length > 0 && (
                    <div className="mt-4 border-t border-amber-200 pt-4">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-amber-900 mb-2.5">
                            {t('disease.tentativeOutput', 'Tentative model output:')}
                        </h4>
                        <div className="space-y-1.5">
                            {top3.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-white/70 p-2 rounded-lg text-xs text-amber-900 border border-amber-200">
                                    <span>{formatClassName(item.className)}</span>
                                    <span className="font-bold">{(Number(item.confidence) * 100).toFixed(1)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-white shadow-sm rounded-2xl border border-stone-200 p-6 sm:p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6 pb-5 border-b border-stone-100">
                <h2 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
                    <span>🔬</span>
                    <span>{t('disease.cropDiseaseDetection', 'Crop Disease Detection')}</span>
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                    {t('disease.diseaseSubtitle', 'Upload a leaf photograph to analyze symptoms across 38 supported disease classifications.')}
                </p>
            </div>

            {/* Upload Area */}
            {!result && (
                <div className="space-y-6">
                    {/* Modern Dropzone Card */}
                    <div className="border-2 border-dashed border-stone-300 hover:border-green-500 rounded-2xl p-6 sm:p-8 text-center bg-[#FAFAF7] transition-colors relative">
                        <input
                            id="disease-image-upload"
                            type="file"
                            accept="image/jpeg, image/png, image/webp"
                            onChange={handleFileChange}
                            disabled={loading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <div className="space-y-3 pointer-events-none">
                            <div className="w-16 h-16 mx-auto rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-3xl">
                                📸
                            </div>
                            <div>
                                <p className="text-base font-bold text-stone-800">
                                    {t('disease.uploadClearLeaf', 'Upload a clear crop leaf image')}
                                </p>
                                <p className="text-xs text-stone-500 mt-1">
                                    {t('disease.clickOrDragFormats', 'Click or drag and drop image here (JPEG, PNG, WebP up to 5 MB)')}
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] text-stone-500 font-medium">
                                <span className="bg-white px-2 py-0.5 rounded border border-stone-200">{t('disease.goodLighting', 'Good lighting')}</span>
                                <span className="bg-white px-2 py-0.5 rounded border border-stone-200">{t('disease.leafInFocus', 'Leaf clearly in focus')}</span>
                                <span className="bg-white px-2 py-0.5 rounded border border-stone-200">{t('disease.avoidBlur', 'Avoid extreme blur')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Preview Area */}
                    {selectedFile && previewUrl && (
                        <div className="border border-stone-200 rounded-xl p-4 bg-[#FAFAF7] flex flex-col sm:flex-row items-center sm:items-start gap-4">
                            <div className="w-28 h-28 shrink-0 bg-stone-200 rounded-lg overflow-hidden border border-stone-300 shadow-sm">
                                <img src={previewUrl} alt="Leaf Preview" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 text-center sm:text-left space-y-1">
                                <p className="font-bold text-stone-800 text-sm truncate max-w-md" title={selectedFile.name}>
                                    {selectedFile.name}
                                </p>
                                <p className="text-xs text-stone-500">
                                    {t('disease.fileSizeLabel', 'File size: {size} KB', { size: (selectedFile.size / 1024).toFixed(1) })}
                                </p>
                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        disabled={loading}
                                        className="text-xs text-red-600 hover:text-red-800 font-bold transition-colors disabled:opacity-50"
                                    >
                                        &times; {t('disease.removeReplaceImage', 'Remove / Replace Image')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs sm:text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {/* Detect Button */}
                    <button
                        type="button"
                        onClick={handleDetect}
                        disabled={!selectedFile || loading}
                        className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                            !selectedFile || loading
                                ? 'bg-green-300 text-white cursor-not-allowed'
                                : 'bg-green-700 hover:bg-green-800 text-white hover:shadow-lg focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
                        }`}
                    >
                        {loading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                <span>{t('disease.analyzingLeafDots', 'Analyzing leaf image...')}</span>
                            </>
                        ) : (
                            <span>{t('disease.detectDiseaseBtn', 'Detect Disease →')}</span>
                        )}
                    </button>
                </div>
            )}

            {/* Results Area */}
            {result && (
                <div className="pt-2">
                    {result.prediction?.status === 'confident'
                        ? renderConfidentResult()
                        : renderUncertainResult()}

                    <div className="mt-8 flex justify-center">
                        <button
                            type="button"
                            onClick={handleTryAnother}
                            className="bg-white py-2.5 px-6 border border-stone-300 rounded-xl shadow-sm text-xs sm:text-sm font-bold text-stone-700 hover:bg-stone-50 transition-colors"
                        >
                            &larr; {t('disease.tryAnotherImageBtn', 'Try Another Image')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
