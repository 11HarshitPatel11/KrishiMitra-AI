import { MarketService } from '../services/market.service.js';

export const getMarketInfo = async (req, res, next) => {
    try {
        const { commodity, state, district, limit } = req.query;

        const data = await MarketService.getMarketPrices({
            commodity,
            state,
            district,
            limit: limit ? Number(limit) : 10
        });

        return res.status(200).json({
            success: true,
            message: data.records.length > 0 ? "Market information retrieved successfully" : "No market records match your selected filters",
            data: data
        });

    } catch (error) {
        if (error.code === 'CONFIG_MISSING' || error.message.includes('Market API Key is missing') || error.message.includes('Market API is not configured')) {
            console.error(`[MarketController] Missing configuration: MARKET_API_KEY is not configured in server/.env`);
            return res.status(503).json({
                success: false,
                code: 'CONFIG_MISSING',
                message: "Market prices are temporarily unavailable. Please try again later.",
                devNote: process.env.NODE_ENV !== 'production' ? "MARKET_API_KEY is missing or unconfigured in server/.env." : undefined
            });
        }
        if (error.code === 'SERVICE_UNAVAILABLE' || error.message.includes('Market Service Unavailable') || error.message.includes('Data.gov.in') || error.name === 'AbortError') {
            console.error(`[MarketController] External service unavailable: ${error.message}`);
            return res.status(503).json({
                success: false,
                code: 'SERVICE_UNAVAILABLE',
                message: "Market prices are temporarily unavailable. Please try again later."
            });
        }
        next(error);
    }
};
