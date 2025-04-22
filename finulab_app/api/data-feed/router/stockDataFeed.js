const axios = require("axios");
const dotenv = require("dotenv");
const datefns = require("date-fns");
const router = require("express").Router();

const stocksIndexDesc = require("../models/stocks-index");

dotenv.config();

const parseResolution = (input) => {
    const match = input.match(/^(\d+)([a-zA-Z])?$/);
    if(match) {
        const numberPart = match[1]; // The number part (digits)
        const letterPart = match[2] || ''; // The letter part (if exists)
        return { numberPart, letterPart };
    } else {
        return null; // In case the input doesn't match the expected pattern
    }
}

router.put("/search/", async (req, res) => 
    {
        try {
            const q = `${req.query.q}`;
            
            const primaryResult = await stocksIndexDesc.find(
                {
                    symbol: q
                }
            );

            if(primaryResult.length === 0) {
                const queryResults = await stocksIndexDesc.aggregate(
                    [
                        {
                            $search: {
                                index: "stocks-search-index",
                                text: {
                                    query: q,
                                    path: {
                                        wildcard: "*"
                                    }
                                }
                          }
                        }, 
                        {
                            $project: {
                                _id: 0,
                                symbol: 1,
                                alphaVantageName: 1,
                                polygonIoName: 1,
                                description: 1,
                                exchange: 1,
                                profileImage: 1
                            }
                        }, {$limit: 10}
                    ]
                );
    
                return res.status(200).json({"status": "success", "data": queryResults});
            } else {
                return res.status(200).json({"status": "success", "data": primaryResult});
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);

router.put("/price-history", async (req, res) => 
    {
        try {
            const to = req.body.to;
            const from = req.body.from;
            const symbol = req.body.symbol;
            const countBack = req.body.countBack;
            const apiKey = process.env.polygon_io_api_key;
            const resolution = parseResolution(req.body.resolution);

            if(from > to) {return res.status(500).json({"status": "error"});}

            let timeSpan = "", multiplier = "";
            if(resolution === null || resolution === undefined) {
                return res.status(500).json({"status": "error"});
            } else if(Object.keys(resolution).length === 0) {
                return res.status(500).json({"status": "error"});
            } else {
                if(resolution.letterPart === '') {
                    timeSpan = "minute";
                } else if(resolution.letterPart === 'S') {
                    timeSpan = "second";
                } else if(resolution.letterPart === 'D') {
                    timeSpan = "day";
                } else if(resolution.letterPart === 'W') {
                    timeSpan = "week";
                } else if(resolution.letterPart === 'M') {
                    timeSpan = "month";
                } else if(resolution.letterPart === 'Y') {
                    timeSpan = "year";
                } else {
                    return res.status(500).json({"status": "error"});
                }
                multiplier = resolution.numberPart;

                //const to_date = datefns.format(datefns.fromUnixTime(to), "yyyy-MM-dd");
                //const from_date = datefns.format(datefns.fromUnixTime(from), "yyyy-MM-dd");
                const to_date = to * 1000;
                const from_date = from * 1000;
                const uri = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/${multiplier}/${timeSpan}/${from_date}/${to_date}?adjusted=true&sort=asc&limit=50000&apikey=${apiKey}`;

                const priceHistory = await axios.get(uri);
                let adjustedPriceHistory = {...priceHistory.data};
                if(adjustedPriceHistory["status"] === "OK") {
                    if(adjustedPriceHistory["count"] > 0) {
                        if(adjustedPriceHistory["results"].length < countBack) {
                            adjustedPriceHistory["count"] = countBack;
                            adjustedPriceHistory["resultsCount"] = countBack;
                            adjustedPriceHistory["results"] = Array(countBack - adjustedPriceHistory["results"].length).fill().map((_, index) => {
                                const n = index + 1;
                                const firstElement = adjustedPriceHistory["results"][0];
                                const secondElement = adjustedPriceHistory["results"][1];
                        
                                return {
                                    "c": firstElement["c"],
                                    "h": firstElement["c"],
                                    "l": firstElement["c"],
                                    "n": 0,
                                    "o": firstElement["c"],
                                    "t": firstElement["t"], /*- (n * (secondElement["t"] - firstElement["t"])),*/
                                    "v": 0,
                                    "vw": 0
                                };
                            }).concat(
                                [
                                    ...adjustedPriceHistory["results"],
                                ]
                            );  
                            return res.status(200).json({"status": "success", "data": adjustedPriceHistory});                      
                        } else {
                            return res.status(200).json({"status": "success", "data": priceHistory.data});
                        }
                    } else {
                        return res.status(200).json({"status": "success", "data": priceHistory.data});
                    }
                } else {
                    return res.status(200).json({"status": "success", "data": priceHistory.data});
                }
            }
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);


router.put("/quote", async (req, res) => 
    {
        try {
            const symbol = req.body.symbol;
            const selectedDate = req.body.selectedDate;
            const previousDate = req.body.previousDate;
            const selectedToDate = req.body.selectedToDate;
            const apiKey = process.env.polygon_io_api_key;
            
            const annual_from_date_parsed = datefns.parseISO(selectedDate);
            const annual_from_date_unformatted = datefns.subYears(annual_from_date_parsed, 1);
            const annual_from_date = datefns.format(annual_from_date_unformatted, "yyyy-MM-dd");

            const selected_uri = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/10/minute/${selectedDate}/${selectedToDate}?adjusted=true&sort=asc&limit=50000&apikey=${apiKey}`;
            const previous_uri = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${previousDate}/${previousDate}?adjusted=true&sort=asc&limit=50000&apikey=${apiKey}`;
            const annual_uri = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/year/${annual_from_date}/${selectedDate}?adjusted=true&sort=asc&limit=50000&apikey=${apiKey}`;

            const annual_data = await axios.get(annual_uri);
            const selected_data = await axios.get(selected_uri);
            const previous_data = await axios.get(previous_uri);

            let data = {};
            if(annual_data.data["resultsCount"] > 0) {
                let yrLow = 0, yrHigh = 0, averageVolume = 0;
                for(let i = 0; i < annual_data.data["resultsCount"]; i++) {
                    if(i === 0) {
                        yrLow = annual_data.data["results"][i]["l"];
                        yrHigh = annual_data.data["results"][i]["h"];
                    } else {
                        if(yrLow > annual_data.data["results"][i]["l"]) {
                            yrLow = annual_data.data["results"][i]["l"];
                        }

                        if(yrHigh < annual_data.data["results"][i]["h"]) {
                            yrHigh = annual_data.data["results"][i]["h"];
                        }
                    }

                    averageVolume = annual_data.data["results"][i]["v"];
                }

                data = {
                    ...data, "yrLow": yrLow, "yrHigh": yrHigh, "averageVolume": averageVolume / 365
                };
            }

            if(selected_data.data["resultsCount"] > 0) {
                volume = 0
                for(let i = 0; i < selected_data.data["results"].length; i++) {
                    volume = volume + selected_data.data["results"][i]["v"];
                }

                data = {
                    ...data, 
                    "close": selected_data.data["results"][selected_data.data["resultsCount"] - 1]["c"],
                    "open": selected_data.data["results"][selected_data.data["resultsCount"] - 1]["o"], "low": selected_data.data["results"][selected_data.data["resultsCount"] - 1]["l"],
                    "high": selected_data.data["results"][selected_data.data["resultsCount"] - 1]["h"], "volume": volume
                };
            } else {
                if(previous_data.data["resultsCount"] > 0) {
                    data = {
                        ...data, 
                        "close": previous_data.data["results"][previous_data.data["resultsCount"] - 1]["c"],
                        "open": previous_data.data["results"][previous_data.data["resultsCount"] - 1]["o"], "low": previous_data.data["results"][previous_data.data["resultsCount"] - 1]["l"],
                        "high": previous_data.data["results"][previous_data.data["resultsCount"] - 1]["h"], "volume": previous_data.data["results"][previous_data.data["resultsCount"] - 1]["v"]
                    };
                }
            }

            if(previous_data.data["resultsCount"] > 0) {
                data = {
                    ...data, "previousClose": previous_data.data["results"][previous_data.data["resultsCount"] - 1]["c"]
                };
            }

            return res.status(200).json({"status": "success", "data": data});
        } catch(error) {
            return res.status(500).json({"status": "error"});
        }
    }
);
/*
router.put("/:symbol/:range/:rangeType/:startDate/:endDate", auth.verify, async(req, res) =>
    {
        const symbol = req.params.symbol.slice(3, req.params.symbol.length);
        const range = req.params.range;
        const rangeType = req.params.rangeType;
        const startDate = req.params.startDate;
        const endDate = req.params.endDate;

        const polygon = process.env.polygon_io;
        const reqURL = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/${range}/${rangeType}/${startDate}/${endDate}?adjusted=true&sort=asc&limit=50000&apikey=${polygon}`;
        
        try {
            const polygonPriceData = await axios.get(reqURL);
            return res.status(200).json(polygonPriceData.data);
        } catch(error) {
            return res.status(500).json({"status": "failed"});
        }
    }
);
*/

module.exports = router;