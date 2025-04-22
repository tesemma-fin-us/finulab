import {parseISO} from 'date-fns';

import generalOpx from "../../functions/generalFunctions"; 
import store from '../../reduxStore/store';
import {selectStockActiveDays} from '../../reduxStore/stockActiveDays';

const stockActiveDays = selectStockActiveDays(store.getState());

const configurationData = {
    // Represents the resolutions for bars supported by your datafeed
    supported_resolutions: ['1', '5', '30', '60', '90', '120', '1D', '3D', '5D', '1W', '1M'],
    // The `exchanges` arguments are used for the `searchSymbols` method if a user selects the exchange
    exchanges: [
        { value: '', name: '', desc: ''},
        { value: 'NYSE', name: 'NYSE', desc: 'New York Stock Exchange'},
        { value: 'NYSE ARCA', name: 'NYSE ARCA', desc: 'NYSE Archipelago Exchange'},
        { value: 'BATS', name: 'BATS', desc: 'BATS Global Markets'},
        { value: 'NASDAQ', name: 'NASDAQ', desc: 'National Association of Securities Dealers Automated Quotations'},
        { value: 'NYSE MKT', name: 'NYSE MKT', desc: 'NYSE American'},
    ],
    // The `symbols_types` arguments are used for the `searchSymbols` method if a user selects this symbol type
    symbols_types: [
        { name: 'stock', value: 'stock'}
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
            const querySymbol = await generalOpx.axiosInstance.put(`/stockDataFeed/search?q=${userInput}`);
            if(querySymbol.data["status"] === "success") {
                const symbols = querySymbol.data["data"];
                const newSymbols = symbols.filter(symbol => 
                    {
                        const isExchangeValid = exchange === '' || symbol.exchange === exchange;
                        const fullName = `${symbol.exchange}:${symbol.symbol}`;
                        /*
                        const isFullSymbolContainsInput = fullName
                            .toLowerCase()
                            .indexOf(userInput.toLowerCase()) !== -1;
                        */
                        return isExchangeValid //&& isFullSymbolContainsInput;
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
            const querySymbol = await generalOpx.axiosInstance.put(`/stockDataFeed/search?q=${symbolName}`);
            if(querySymbol.data["status"] === "success") {
                let symbolInfo = {};
                for(let i = 0; i < querySymbol.data["data"].length; i++) {
                    if(querySymbol.data["data"][i]["symbol"] === symbolName) {
                        symbolInfo["ticker"] = querySymbol.data["data"][i]["symbol"];
                        symbolInfo["name"] = querySymbol.data["data"][i]["symbol"];
                        querySymbol.data["data"][i]["alphaVantageName"].length >= querySymbol.data["data"][i]["polygonIoName"].length ? 
                            symbolInfo["description"] = querySymbol.data["data"][i]["polygonIoName"] : symbolInfo["description"] = querySymbol.data["data"][i]["alphaVantageName"];
                        symbolInfo["type"] = 'stock';
                        symbolInfo["session"] = '0400-0930,0930-1600,1600-2000';
                        symbolInfo["timezone"] = 'America/New_York';
                        symbolInfo["exchange"] = querySymbol.data["data"][i]["exchange"];
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
            let toTime = 0, fromTime = 0;
            /*
            if(stockActiveDays["timeStamp"] === 0) {
                toTime = periodParams.to;
                fromTime = periodParams.from;
            } else {
                let endDateAdjusted = parseISO(stockActiveDays["data"]["endDate"]), endDateUnix = Math.floor(endDateAdjusted.getTime() / 1000) + (86400 - 1);
            
                if(periodParams.to > endDateUnix) {
                    toTime = endDateUnix;
                    fromTime = endDateUnix - (periodParams.to - periodParams.from);
                } else {
                    toTime = periodParams.to;
                    fromTime = periodParams.from;
                }
            }
            */

            const urlParameters = {
                "from": periodParams.from,
                "to": periodParams.to,
                "symbol": symbolInfo.ticker,
                "resolution": resolution,
                "countBack": periodParams.countBack
            }

            const priceHistory = await generalOpx.axiosInstance.put(`/stockDataFeed/price-history`, urlParameters);
            if(priceHistory.data["status"] === "success") {
                if(priceHistory.data["data"]["resultsCount"] > 0) {
                    let bars = [];
                    for(let i = 0; i < priceHistory.data["data"]["results"].length; i++) {
                        if(
                            isNaN(priceHistory.data["data"]["results"][i]["t"]) ||
                            isNaN(priceHistory.data["data"]["results"][i]["l"]) || 
                            isNaN(priceHistory.data["data"]["results"][i]["h"]) ||
                            isNaN(priceHistory.data["data"]["results"][i]["o"]) ||
                            isNaN(priceHistory.data["data"]["results"][i]["c"]) ||
                            isNaN(priceHistory.data["data"]["results"][i]["v"])
                        ) {continue;} else {
                            bars.push(
                                {
                                    "time": priceHistory.data["data"]["results"][i]["t"],
                                    "low": priceHistory.data["data"]["results"][i]["l"],
                                    "high": priceHistory.data["data"]["results"][i]["h"],
                                    "open": priceHistory.data["data"]["results"][i]["o"],
                                    "close": priceHistory.data["data"]["results"][i]["c"],
                                    "volume": priceHistory.data["data"]["results"][i]["v"],
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