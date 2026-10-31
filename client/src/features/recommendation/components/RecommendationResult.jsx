import React from 'react';
import { useTranslation } from '../../../context/LanguageContext';

export const RecommendationResult = ({ result, onReset }) => {
    const { t } = useTranslation();
    if (!result || !result.recommendations || result.recommendations.length === 0) return null;

    const { recommendations, historyUsed, rotationNote } = result;

    const getMedalBadge = (rank) => {
        switch (rank) {
            case 1:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-sm">
                        <span>🥇</span>
                        <span>{t('recommendation.topMatch', 'Top Match')}</span>
                    </span>
                );
            case 2:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
                        <span>🥈</span>
                        <span>{t('recommendation.rank2', 'Rank 2')}</span>
                    </span>
                );
            case 3:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <span>🥉</span>
                        <span>{t('recommendation.rank3', 'Rank 3')}</span>
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-600">
                        {t('recommendation.rankN', 'Rank {rank}', { rank })}
                    </span>
                );
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 sm:p-8 max-w-4xl mx-auto flex flex-col items-center">
            {/* Header */}
            <div className="w-full text-center pb-6 border-b border-stone-100 mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-green-800 bg-green-100 px-3 py-1 rounded-full">
                    {t('recommendation.decisionSupportBadge', 'AI Decision Support')}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-2 tracking-tight">
                    {t('recommendation.recommendedCropsTitle', 'Recommended Crops for Your Soil')}
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-lg mx-auto">
                    {t('recommendation.recommendedCropsDesc', 'Ranked by multi-factor machine learning evaluation combining soil nutrients, weather, and crop rotation.')}
                </p>
            </div>

            {/* Context Banners */}
            <div className="w-full max-w-2xl space-y-3 mb-6">
                {historyUsed && rotationNote && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-900 text-xs sm:text-sm p-4 rounded-xl shadow-sm">
                        <p className="font-bold mb-1 flex items-center gap-1.5 text-blue-950">
                            <span aria-hidden="true">🔄</span>
                            <span>{t('recommendation.cropHistoryConsidered', 'Crop History Considered')}</span>
                        </p>
                        <p className="text-blue-800 leading-relaxed">{rotationNote}</p>
                    </div>
                )}

                {result.marketNote && (
                    <div className="bg-purple-50 border border-purple-200 text-purple-900 text-xs sm:text-sm p-4 rounded-xl shadow-sm">
                        <p className="font-bold mb-1 flex items-center gap-1.5 text-purple-950">
                            <span aria-hidden="true">📊</span>
                            <span>{t('recommendation.marketContext', 'Market Context')}</span>
                        </p>
                        <p className="text-purple-800 leading-relaxed">{result.marketNote}</p>
                        {result.locationSource && result.locationSource !== 'none' && (
                            <p className="mt-1.5 text-xs text-purple-700 font-semibold">
                                {t('recommendation.locationSource', 'Location source: {source}', {
                                    source: `${result.locationSource === 'auto' ? 'Auto-resolved from farm coordinates' : 'Manual state/district selection'}${result.marketLocationLevel ? ` (${result.marketLocationLevel} level)` : ''}`
                                })}
                            </p>
                        )}
                    </div>
                )}

                {/* Advisory Limitation Notice regarding rainfall & training data */}
                <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs p-4 rounded-xl shadow-sm" role="note" aria-label="Recommendation Limitations">
                    <p className="font-bold mb-1 flex items-center gap-1.5 text-amber-950">
                        <span aria-hidden="true">⚠️</span>
                        <span>{t('recommendation.advisoryLimitationNotice', 'Advisory Limitation Notice')}</span>
                    </p>
                    <p className="leading-relaxed text-amber-800">
                        {t('recommendation.advisoryLimitationText', "Recommendations are generated by a machine learning model trained on benchmark agricultural distributions with an undocumented rainfall accumulation period. Because manually entered rainfall values may not perfectly correspond with the model's training baseline, recommendations should be treated as advisory decision-support rather than scientific certainty. Please verify crop choices with local agricultural extension specialists.")}
                    </p>
                </div>
            </div>

            {/* Recommendations List */}
            <div className="w-full max-w-2xl space-y-4 mb-6">
                {recommendations.map((rec) => {
                    const showRotation = rec.rotationFactor && rec.rotationFactor !== 1;
                    const finalScoreVal = rec.finalScore !== undefined ? rec.finalScore : rec.score;
                    const mlScoreVal = rec.mlProbability !== undefined ? rec.mlProbability : rec.score;

                    const formattedFinalScore = (finalScoreVal * 100).toFixed(1);
                    const formattedMLScore = (mlScoreVal * 100).toFixed(1) + '%';
                    const isTop = rec.rank === 1;

                    return (
                        <div
                            key={rec.rank}
                            className={`p-5 rounded-2xl border transition-all ${
                                isTop
                                    ? 'bg-gradient-to-br from-green-50/80 via-white to-emerald-50/50 border-green-300 shadow-md ring-1 ring-green-400/30'
                                    : 'bg-white border-stone-200 shadow-sm hover:shadow'
                            }`}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-xl shrink-0">
                                        🌱
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-black text-stone-900 capitalize tracking-tight">
                                                {rec.crop}
                                            </h3>
                                            {getMedalBadge(rec.rank)}
                                        </div>
                                        <p className="text-xs text-stone-500 mt-0.5">
                                            {t('recommendation.environmentalSuitability', 'Environmental Suitability:')} <span className="font-semibold text-stone-800">{formattedMLScore}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="text-left sm:text-right bg-stone-50 sm:bg-transparent p-2.5 sm:p-0 rounded-lg">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">{t('recommendation.recommendationScore', 'Recommendation Score')}</p>
                                    <p className="text-xl font-black text-green-800">{formattedFinalScore}</p>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="mt-4 pt-3 border-t border-stone-100 grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <span className="block text-stone-400 text-[11px]">{t('recommendation.environmentalSuitability', 'Environmental Suitability:')}</span>
                                    <span className="font-bold text-stone-700">{formattedMLScore}</span>
                                </div>

                                {historyUsed && (
                                    <div>
                                        <span className="block text-stone-400 text-[11px]">{t('recommendation.cropRotation', 'Crop Rotation:')}</span>
                                        {showRotation ? (
                                            <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                                                {t('recommendation.rotationPenaltyApplied', 'Rotation Penalty Applied')}
                                            </span>
                                        ) : (
                                            <span className="text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-200 inline-block">
                                                {t('recommendation.standardRotation', 'Standard Rotation')}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Market Context snippet */}
                            {rec.marketPrice && (
                                <div className="mt-3 pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1.5">
                                    <div className="flex items-center gap-1 text-stone-500">
                                        <span>{t('recommendation.latestMandiBenchmark', 'Latest Mandi Benchmark:')}</span>
                                        <span className="font-bold text-stone-900 font-mono text-sm">
                                            ₹{rec.marketPrice} / {rec.marketPriceUnit}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-[11px]">
                                        <span className="text-stone-400">{rec.marketDataDate}</span>
                                        {rec.marketFactor > 1.0 ? (
                                            <span className="text-green-700 font-bold bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                                                {t('recommendation.favorableMarketContext', 'Favorable Market Context')} (+{(rec.marketFactor - 1).toFixed(2)})
                                            </span>
                                        ) : rec.marketFactor < 1.0 ? (
                                            <span className="text-red-700 font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                                                {t('recommendation.weakerMarketContext', 'Weaker Market Context')} (-{(1 - rec.marketFactor).toFixed(2)})
                                            </span>
                                        ) : (
                                            <span className="text-stone-500 font-medium">{t('recommendation.neutralMarketContext', 'Neutral Market Context')}</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Note & Reset button */}
            <p className="text-xs text-stone-400 text-center mb-6 max-w-md">
                {t('recommendation.modelScoreFootnote', '* Note: Model scores dynamically stack contextual environments. Market price is only one factor. Actual returns depend on yield, production cost, crop quality, local demand, and selling conditions.')}
            </p>

            <button
                type="button"
                onClick={onReset}
                className="px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-sm rounded-xl transition-all shadow-sm"
            >
                &larr; {t('recommendation.startNewPrediction', 'Start New Prediction')}
            </button>
        </div>
    );
};
