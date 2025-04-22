const datefns = require("date-fns");
const router = require("express").Router();

const stocksDesc = require("../models/stocks-descs");
const watchlistDesc = require("../models/watchlist-descs");
const stocksActivityDesc = require("../models/stocks-activity");
const recommendationsDesc = require("../models/recommendations-descs");
const countriesStatesDesc = require("../models/countries-states-descs");
const upcomingMarketHolidaysDesc = require("../models/upcoming-market-holidays");

router.put("/holidays", async (req, res) => 
    {
        try {
            const holidays = await upcomingMarketHolidaysDesc.findOne().sort({"timeStamp": "desc"});
            if(Object.keys(holidays).length > 0) {
                return res.status(200).json({"status": "success", "data": holidays["upcoming-market-holidays"]});
            } else {return res.status(500).json({"status": "error"});}
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/quick-descs", async (req, res) => 
    {
        try {
            const symbols = req.body.symbols;
            if(!Array.isArray(symbols)) {return res.status(200).json({"status": "error"});}
            if(symbols.length === 0) {return res.status(200).json({"status": "error"});}

            const data = await stocksDesc.find(
                {
                    symbol: {$in: symbols}
                }
            ).select(`_id symbol alphaVantageName polygonIoName description profileImage`).exec();

            const support = await stocksActivityDesc.find(
                {
                    symbol: {$in: symbols}
                }
            );

            return res.status(200).json({"status": "success", "data": data, "support": support});
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/description/:symbol", async (req, res) => 
    {
        try {
            const symbol = req.params.symbol;
            if(symbol.slice(0, 1) === "S") {
                await stocksDesc.findOne(
                    {
                        symbol: String(symbol).slice(3, symbol.length)
                    }
                ).then(
                    async (stockData) => {
                        if(!stockData) {return res.status(200).json({"status": "error"});}
                        if(stockData) {
                            if(stockData.marketStatus === "active" && stockData.finulabStatus === "active") {
                                let name = "";
                                if(stockData.alphaVantageName.length >= stockData.polygonIoName.length) {
                                    name = stockData.polygonIoName;
                                } else {
                                    name = stockData.alphaVantageName;
                                }
                                
                                let address = "", addressFlag = "";
                                if(stockData.address !== "") {
                                    const addressParsed = stockData.address.split(", ");
                                    const unitedStatesSynonyms = ["united states of america", "united states", "america", "us", "u.s.", "usa", "u.s.a."];
                                    if(unitedStatesSynonyms.includes(String(addressParsed[addressParsed.length - 1]).toLowerCase())) {
                                        await countriesStatesDesc.findOne(
                                            {
                                                stateCode: String(addressParsed[addressParsed.length - 2]).toLowerCase()
                                            }
                                        ).then(
                                            async (stateFlagData) => {
                                                if(stateFlagData) {
                                                    addressFlag = stateFlagData.flagUrl;
                                                    address = `${addressParsed[addressParsed.length - 3]}, ${addressParsed[addressParsed.length - 2]}`;
                                                }

                                                if(!stateFlagData) {
                                                    await countriesStatesDesc.findOne(
                                                        {
                                                            state: String(addressParsed[addressParsed.length - 2]).toLowerCase()
                                                        }
                                                    ).then(
                                                        async (secondaryStateFlagData) => {
                                                            if(secondaryStateFlagData) {
                                                                addressFlag = secondaryStateFlagData.flagUrl;
                                                                address = `${addressParsed[addressParsed.length - 3]}, ${addressParsed[addressParsed.length - 2]}`;
                                                            }

                                                            if(!secondaryStateFlagData) {
                                                                addressFlag = "https://finulab-dev-world.s3.amazonaws.com/us.png";;
                                                                address = `${addressParsed[addressParsed.length - 2]}, ${addressParsed[addressParsed.length - 1]}`;
                                                            }
                                                        }
                                                    );
                                                }
                                            }
                                        );
                                    } else {
                                        await countriesStatesDesc.findOne(
                                            {
                                                country: String(addressParsed[addressParsed.length - 1]).toLowerCase()
                                            }
                                        ).then(
                                            async (countryFlagData) => {
                                                if(countryFlagData) {
                                                    addressFlag = countryFlagData.flagUrl;
                                                    address = `${addressParsed[addressParsed.length - 2]}, ${String(countryFlagData.country[0]).toUpperCase()}`;
                                                }

                                                if(!countryFlagData) {
                                                    await countriesStatesDesc.findOne(
                                                        {
                                                            countryCode: String(addressParsed[addressParsed.length - 1]).toLowerCase()
                                                        }
                                                    ).then(
                                                        (countryCodeData) => {
                                                            if(countryCodeData) {
                                                                addressFlag = countryCodeData.flagUrl;
                                                                address = `${addressParsed[addressParsed.length - 2]}, ${String(countryCodeData.country[0]).toUpperCase()}`;
                                                            }
                                                        } 
                                                    )
                                                }
                                            }
                                        );
                                    }
                                }

                                let peerData = [];
                                if(stockData.peers.length > 0) {
                                    peerData = await stocksActivityDesc.find({"symbol": {$in: stockData.peers}});
                                }

                                return res.status(200).json(
                                    {
                                        "status": "success",
                                        "data": {
                                            "symbol": String(symbol),
                                            "name": name,
                                            "description": stockData.description,
                                            "assetType": stockData.assetType,
                                            "sharesOutstanding": stockData.sharesOutstanding,
                                            "marketCap": stockData.marketCap,
                                            "priceToEarnings": stockData.priceToEarnings,
                                            "dividendYield": stockData.dividendYield,
                                            "expenseRatio": stockData.expenseRatio,
                                            "suggustions": peerData,
                                            "profileImage": stockData.profileImage,
                                            "website": stockData.website,
                                            "address": address,
                                            "addressFlag": addressFlag,
                                            "marketStatus": stockData.marketStatus,
                                            "finulabStatus": stockData.finulabStatus,
                                            "sector": stockData.sector,
                                            "industry": stockData.industry,
                                            "recommendations": stockData.recommendations,
                                            "watchedBy": stockData.watchlistCount
                                        }
                                    }
                                );
                            } else {return res.status(200).json({"status": "error"});}
                        }
                    }
                );
            } else {
                return res.status(200).json({"status": "error"});
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/rankings", async (req, res) => 
    {
        try {
            let query;
            const sortBy = `${req.body.sortBy}`;
            if(sortBy === "marketCap") {
                query = {marketCap: -1};
            } else if(sortBy === "activity") {
                query = {volume: -1};
            } else if(sortBy === "winners") {
                query = {changePerc: -1};
            } else if(sortBy === "losers") {
                query = {changePerc: 1};
            } else {return res.status(200).json({"status": "error"});}

            const marketData = await stocksActivityDesc.find({}).sort(query).limit(50);
            
            if(marketData.length === 0) {
                setTimeout(async () => {
                    const marketDataV2 = await stocksActivityDesc.find({}).sort(query).limit(50);
                    return res.status(200).json({"status": "success", "data": marketDataV2});
                }, 1500);
            } else {return res.status(200).json({"status": "success", "data": marketData});}
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/watchlist", async (req, res) => 
    {
        try {
            if(Array.isArray(req.body.watching)) {
                const marketSymbols = ["DIA", "SPY", "QQQ", "VXX"];

                if(req.body.watching.length === 0) {
                    const marketData = await stocksActivityDesc.find(
                        {
                            symbol: {$in: marketSymbols}
                        }
                    );
                    const moreStocks = await stocksActivityDesc.find(
                        {
                            symbol: {$nin: marketSymbols}
                        }
                    ).sort({marketCap: -1}).limit(15);

                    return res.status(200).json({"status": "success", "market": marketData, "more": moreStocks});
                } else {
                    let userWatching = [];
                    for(let i = 0; i < req.body.watching.length; i++) {
                        if(!marketSymbols.includes(req.body.watching[i])) {
                            userWatching.push(req.body.watching[i]);
                        }
                    }

                    const marketData = await stocksActivityDesc.find(
                        {
                            symbol: {$in: marketSymbols}
                        }
                    );
                    const userStocks = await stocksActivityDesc.find(
                        {
                            symbol: {$in: userWatching}
                        }
                    );
                    const moreStocks = await stocksActivityDesc.find(
                        {
                            symbol: {$nin: marketSymbols.concat(userWatching)}
                        }
                    ).sort({marketCap: -1}).limit(15);

                    return res.status(200).json({"status": "success", "market": marketData, "watching": userStocks , "more": moreStocks});
                }
            } else {return res.status(200).json({"status": "error"});}
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/provided-recommendation", async (req, res) => 
    {
        try {
            const symbol = `${req.body.symbol}`;
            const username = `${req.body.username}`;

            const recommendation = await recommendationsDesc.find(
                {
                    username: username,
                    symbol: symbol
                }
            ).sort({timeStamp: -1}).limit(1);

            if(recommendation.length === 1) {
                return res.status(200).json({"status": "success", "recommendation": recommendation[0]["recommendation"]});
            } else {
                return res.status(200).json({"status": "success", "recommendation": ""});
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/modify-watchlist", async (req, res) => 
    {
        try {
            const action = `${req.body.action}`;
            const symbol = `${req.body.symbol}`;
            const uniqueId = `${req.body.uniqueId}`;
            const distinction = `${req.body.distinction}`;

            if(!(action === "add" || action === "removed")) {return res.status(200).json({"status": "error"});}
            if(!(distinction === "user" || distinction === "visitor")) {return res.status(200).json({"status": "error"});}

            const now = new Date();
            const nowUnix = datefns.getUnixTime(now);
            const priorResults = await watchlistDesc.find(
                {
                    username: uniqueId,
                    symbol: symbol
                }
            ).sort({timeStamp: -1}).limit(1);

            if(priorResults.length === 1) {
                let priorAction = priorResults[0]["action"];
                if(priorAction === action) {return res.status(200).json({"status": "error"});}

                const newWatchlistDesc = new watchlistDesc(
                    {
                        username: uniqueId,
                        distinction: distinction,
                        symbol: symbol,
                        action: action,
                        actionChangeIndicator: !(priorAction === action),
                        timeStamp: nowUnix
                    }
                );
                await newWatchlistDesc.save();
            } else {
                if(action === "removed") {return res.status(200).json({"status": "error"});}

                const newWatchlistDesc = new watchlistDesc(
                    {
                        username: uniqueId,
                        distinction: distinction,
                        symbol: symbol,
                        action: action,
                        actionChangeIndicator: false,
                        timeStamp: nowUnix
                    }
                );
                await newWatchlistDesc.save();
            }

            if(action === "add") {
                await stocksDesc.updateOne({symbol: symbol.slice(3, symbol.length)}, {$inc: {watchlistCount: 1}});
            } else if(action === "removed") {
                await stocksDesc.updateOne({symbol: symbol.slice(3, symbol.length)}, {$inc: {watchlistCount: -1}});
            }
            return res.status(200).json({"status": "success"});
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.post("/modify-recommendation", async (req, res) => 
    {
        try {
            const rec = `${req.body.rec}`;
            const symbol = `${req.body.symbol}`;
            const uniqueId = `${req.body.uniqueId}`;
            const distinction = `${req.body.distinction}`;

            if(!(rec === "buy" || rec === "hold" || rec === "sell")) {return res.status(200).json({"status": "error"});}
            if(!(distinction === "user" || distinction === "visitor")) {return res.status(200).json({"status": "error"});}

            const now = new Date();
            const nowUnix = datefns.getUnixTime(now);
            const priorResults = await recommendationsDesc.find(
                {
                    username: uniqueId,
                    symbol: symbol
                }
            ).sort({timeStamp: -1}).limit(1);
            
            let updateOneIncCmd = {};
            if(priorResults.length === 1) {
                let priorRec = priorResults[0]["recommendation"];
                if(priorRec === rec) {return res.status(200).json({"status": "error"});}

                const newRec = new recommendationsDesc(
                    {
                        username: uniqueId,
                        distinction: distinction,
                        symbol: symbol,
                        recommendation: rec,
                        recommendationChange: `${priorRec}-${rec}`,
                        recommendationChangeIndicator: !(priorRec === rec),
                        timeStamp: nowUnix
                    }
                );
                await newRec.save();

                if(rec === "buy") {
                    updateOneIncCmd["recommendations.0"] = 1;
                } else if(rec === "sell") {
                    updateOneIncCmd["recommendations.2"] = 1;
                } else if(rec === "hold") {
                    updateOneIncCmd["recommendations.1"] = 1;
                }

                if(priorRec === "buy") {
                    updateOneIncCmd["recommendations.0"] = -1;
                } else if(priorRec === "sell") {
                    updateOneIncCmd["recommendations.2"] = -1;
                } else if(priorRec === "hold") {
                    updateOneIncCmd["recommendations.1"] = -1;
                }
            } else {
                const newRec = new recommendationsDesc(
                    {
                        username: uniqueId,
                        distinction: distinction,
                        symbol: symbol,
                        recommendation: rec,
                        recommendationChange: ``,
                        recommendationChangeIndicator: false,
                        timeStamp: nowUnix
                    }
                );
                await newRec.save();

                if(rec === "buy") {
                    updateOneIncCmd["recommendations.0"] = 1;
                } else if(rec === "sell") {
                    updateOneIncCmd["recommendations.2"] = 1;
                } else if(rec === "hold") {
                    updateOneIncCmd["recommendations.1"] = 1;
                }
            }

            if(Object.keys(updateOneIncCmd).length > 0) {
                await stocksDesc.updateOne({symbol: symbol.slice(3, symbol.length)}, {$inc: {...updateOneIncCmd}});
                return res.status(200).json({"status": "success"});
            } else {return res.status(200).json({"status": "error"});}
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

module.exports = router;