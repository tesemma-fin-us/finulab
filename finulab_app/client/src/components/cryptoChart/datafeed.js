import {parseISO} from 'date-fns';
import generalOpx from "../../functions/generalFunctions"; 

const configurationData = {
    // Represents the resolutions for bars supported by your datafeed
    supported_resolutions: ['5', '15', '1H', '1D'],
    // The `exchanges` arguments are used for the `searchSymbols` method if a user selects the exchange
    exchanges: [
        { value: '', name: '', desc: ''}
    ],
    // The `symbols_types` arguments are used for the `searchSymbols` method if a user selects this symbol type
    symbols_types: [
        { name: 'crypto', value: 'crypto'}
    ]
};

export default {
    onReady: (callback) => {
        //console.log('[onReady]: Method call');
        setTimeout(() => callback(configurationData));
    },
    searchSymbols: async (userInput, exchange, symbolType, onResultReadyCallback) => {
        //console.log('[searchSymbols]: Method call');
        try {
            const querySymbol = await generalOpx.axiosInstance.put(`/cryptoDataFeed/search?q=${userInput}`);
            if(querySymbol.data["status"] === "success") {
                const symbols = querySymbol.data["data"];
                const newSymbols = symbols.map(symbol => 
                    {
                        return {
                            "symbol": symbol.symbol,
                            "name": symbol.name,
                            "description": symbol.description,
                            "profileImage": symbol.profileImage,
                            "exchange": ""
                        };
                    }
                );
                onResultReadyCallback(newSymbols);
            } else {
                onResultReadyCallback([]);
            }
        } catch(error) {
            onResultReadyCallback([]);
        }
    },
    resolveSymbol: async (symbolName, onSymbolResolvedCallback, onResolveErrorCallback, extension) => {
        //console.log('[resolveSymbol]: Method call', symbolName);
        try {
            const querySymbol = await generalOpx.axiosInstance.put(`/cryptoDataFeed/search?q=${symbolName}`);
            if(querySymbol.data["status"] === "success") {
                let symbolInfo = {};
                for(let i = 0; i < querySymbol.data["data"].length; i++) {
                    if(querySymbol.data["data"][i]["symbol"] === symbolName) {
                        symbolInfo["ticker"] = querySymbol.data["data"][i]["symbol"];
                        symbolInfo["name"] = querySymbol.data["data"][i]["symbol"];
                        symbolInfo["description"] = querySymbol.data["data"][i]["name"];
                        symbolInfo["type"] = 'crypto';
                        symbolInfo["session"] = '24x7';
                        symbolInfo["timezone"] = 'America/New_York';
                        symbolInfo["exchange"] = "";
                        symbolInfo["minmov"] = 1;
                        symbolInfo["pricescale"] = 100;
                        symbolInfo["has_intraday"] = true;
                        symbolInfo["visible_plots_set"] = 'ohlc';
                        symbolInfo["has_weekly_and_monthly"] = true;
                        symbolInfo["supported_resolutions"] = configurationData.supported_resolutions;
                        symbolInfo["volume_precision"] = 2;
                        symbolInfo["data_status"] = 'streaming';
                    }
                }

                if(Object.keys(symbolInfo).length === 0) { 
                    //console.log('[resolveSymbol]: Cannot resolve symbol', symbolName);
                    onResolveErrorCallback('Cannot resolve symbol');
                    return;
                } else {
                    //console.log('[resolveSymbol]: Symbol resolved', symbolName);
                    onSymbolResolvedCallback(symbolInfo);
                }
            } else {
                //console.log('[resolveSymbol]: Cannot resolve symbol', symbolName);
                onResolveErrorCallback('Cannot resolve symbol');
                return;
            }
        } catch(error) {
            //console.log('[resolveSymbol]: Cannot resolve symbol', symbolName);
            onResolveErrorCallback('Cannot resolve symbol');
            return;
        }
    },
    getBars: async (symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) => {
        //console.log('[getBars]: Method call', symbolInfo);
        try {
            const urlParameters = {
                "from": periodParams.from,
                "to": periodParams.to,
                "symbol": symbolInfo.ticker,
                "resolution": resolution,
                "countBack": periodParams.countBack
            }

            const priceHistory = await generalOpx.axiosInstance.put(`/crypto-market-data/price-history`, urlParameters);
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
                                    "time": priceHistory.data["data"][i]["t"],
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
            //console.log('[getBars]: Get error', error);
            onErrorCallback(error);
        }
    },
    subscribeBars: (symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) => {
        //console.log('[subscribeBars]: Method call with subscriberUID:', subscriberUID);
    },
    unsubscribeBars: (subscriberUID) => {
        //console.log('[unsubscribeBars]: Method call with subscriberUID:', subscriberUID);
    },
};