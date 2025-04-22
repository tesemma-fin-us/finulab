import {parseISO} from 'date-fns';
import generalOpx from "../../functions/generalFunctions"; 

const configurationData = {
    // Represents the resolutions for bars supported by your datafeed
    supported_resolutions: ['1', '5', '30', '60', '90', '120', '1D'],
    // The `exchanges` arguments are used for the `searchSymbols` method if a user selects the exchange
    exchanges: [
        { value: '', name: '', desc: ''},
        { value: 'FINULAB', name: 'Finulab', desc: 'Finulab Prediction Market'}
    ],
    // The `symbols_types` arguments are used for the `searchSymbols` method if a user selects this symbol type
    symbols_types: [
        { name: 'prediction', value: 'prediction'}
    ]
};

export default {
    onReady: (callback) => {
        setTimeout(() => callback(configurationData));
    },
    searchSymbols: async (userInput, exchange, symbolType, onResultReadyCallback) => {
        try {
            const querySymbol = await generalOpx.axiosInstance.put(`/market/search-markets?q=${userInput}`);
            if(querySymbol.data["status"] === "success") {
                const symbols = querySymbol.data["data"];
                onResultReadyCallback(symbols);
            } else {
                onResultReadyCallback([]);
            }
        } catch(error) {
            onResultReadyCallback([]);
        }
    },
    resolveSymbol: async (symbolName, onSymbolResolvedCallback, onResolveErrorCallback, extension) => {
        try {
            const querySymbol = await generalOpx.axiosInstance.put(`/market/resolve-market-selection`, {"market_selection": symbolName});
            if(querySymbol.data["status"] === "success") {
                let symbolInfo = {};
                symbolInfo["ticker"] = querySymbol.data["data"]["symbol"];
                symbolInfo["name"] = querySymbol.data["data"]["name"];
                symbolInfo["description"] = querySymbol.data["data"]["name"];
                symbolInfo["logo_urls"] = querySymbol.data["data"]["logo_urls"];
                symbolInfo["type"] = 'prediction';
                symbolInfo["session"] = '24x7';
                symbolInfo["timezone"] = 'America/New_York';
                symbolInfo["exchange"] = querySymbol.data["data"]["exchange"];
                symbolInfo["minmov"] = 1;
                symbolInfo["pricescale"] = 100;
                symbolInfo["has_intraday"] = true;
                symbolInfo["visible_plots_set"] = 'ohlc';
                symbolInfo["has_weekly_and_monthly"] = true;
                symbolInfo["supported_resolutions"] = configurationData.supported_resolutions;
                symbolInfo["volume_precision"] = 2;
                symbolInfo["data_status"] = 'streaming';

                if(Object.keys(symbolInfo).length === 0) {
                    onResolveErrorCallback('Cannot resolve symbol');
                    return;
                } else {
                    onSymbolResolvedCallback(symbolInfo);
                }
            } else {
                onResolveErrorCallback('Cannot resolve symbol');
                return;
            }
        } catch(error) {
            onResolveErrorCallback('Cannot resolve symbol');
            return;
        }
    },
    getBars: async (symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) => {
        try {
            const selection_type_arr = symbolInfo.description.split("-");
            const urlParameters = {
                "from": periodParams.from,
                "to": periodParams.to,
                "resolution": resolution,
                "marketId": symbolInfo.ticker,
                "countBack": periodParams.countBack,
                "selection": selection_type_arr[selection_type_arr.length - 1] === "YES" ? "priceYes": "priceNo"
            }

            const priceHistory = await generalOpx.axiosInstance.put(`/market/price-history`, urlParameters);
            if(priceHistory.data["status"] === "success") {
                if(priceHistory.data["data"].length > 0) {
                    let bars = [];
                    for(let i = 0; i < priceHistory.data["data"].length; i++) {
                        if(
                            isNaN(priceHistory.data["data"][i]["t"]) ||
                            isNaN(priceHistory.data["data"][i]["l"]) || 
                            isNaN(priceHistory.data["data"][i]["h"]) ||
                            isNaN(priceHistory.data["data"][i]["o"]) ||
                            isNaN(priceHistory.data["data"][i]["c"]) ||
                            isNaN(priceHistory.data["data"][i]["v"])
                        ) {continue;} else {
                            bars.push(
                                {
                                    "time": priceHistory.data["data"][i]["t"] * 1000,
                                    "low": priceHistory.data["data"][i]["l"],
                                    "high": priceHistory.data["data"][i]["h"],
                                    "open": priceHistory.data["data"][i]["o"],
                                    "close": priceHistory.data["data"][i]["c"],
                                    "volume": priceHistory.data["data"][i]["v"],
                                }
                            );
                        }
                    }
                    
                    //console.log(`[getBars]: returned ${bars.length} bar(s)`);
                    onHistoryCallback(bars, { noData: false });
                } else {
                    onHistoryCallback([], { noData: true });
                    return;
                }
            } else {
                onHistoryCallback([], { noData: true });
                return;
            }
        } catch(error) {
            onErrorCallback(error);
        }
    },
    subscribeBars: (symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) => {},
    unsubscribeBars: (subscriberUID) => {}
};