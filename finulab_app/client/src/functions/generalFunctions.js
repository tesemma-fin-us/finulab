import axios from 'axios';
import {getYear, getMonth, getDate, getDay, getHours, getMinutes, getSeconds, add, format, fromUnixTime, getUnixTime} from 'date-fns';

const axiosRegionInstanceFunction = axios.create(
    {
        baseURL: process.env.REACT_APP_API,
        withCredentials: true
    }
);

const axiosInstanceFunction = axios.create(
    {
        baseURL: process.env.REACT_APP_API,
        withCredentials: true
    }
);

const estFindHours = (date) => {
    const est_date_string = date.toLocaleString('en', {timeZone: 'America/New_York'});
    const est_locale_hours = Number(est_date_string.split(", ")[1].split(":")[0]);
    const est_locale_period = est_date_string.split(", ")[1].split(" ")[1];
    
    if(est_locale_period === "AM") {
        if(est_locale_hours === 12) {
            return 0;
        } else {
            return est_locale_hours;
        }
    } else if(est_locale_period === "PM") {
        if(est_locale_hours === 12) {
            return est_locale_hours;
        } else {
            return est_locale_hours + 12;
        }
    }
}

const findTimeZoneOffset = () => {
    const clientDate = new Date();

    const estInterlude = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    const estDate = new Date(estInterlude);

    const timeDifferenceMs = clientDate - estDate;
    const timeDifferenceM = Math.floor(timeDifferenceMs / 60000);

    const offsetHours = Math.floor(timeDifferenceM / 60);
    const offsetMinutes = Math.floor(timeDifferenceM % 60);

    return {
        "hours": offsetHours,
        "minutes": offsetMinutes
    }
}

const determineMarketHolidays = async () => {
    let marketHolidays = [], marketHolidaysPeriods = [];
    const marketHolidaysCall = await axiosInstanceFunction.put(`/stock-market-data/holidays`);

    let date, dateString, dateInterlude, openTime, closeTime;
    for(let i = 0; i < marketHolidaysCall.data.length; i++) {
        dateString = marketHolidaysCall.data[i]["date"].split("-");
        dateInterlude = new Date(dateString[0], dateString[1] - 1, dateString[2]);
        
        date = getUnixTime(dateInterlude) * 1000;

        if(marketHolidaysCall.data[i]["status"] === "closed") {
            if(!marketHolidays.includes(date)) {
                marketHolidays.push(date);
                marketHolidaysPeriods.push({"status": "closed", "period": []});
            }
        } else if(marketHolidaysCall.data[i]["status"] === "early-close") {
            if(!marketHolidays.includes(date)) {
                openTime = new Date(marketHolidaysCall.data[i]["open"]);
                closeTime = new Date(marketHolidaysCall.data[i]["close"]);


                marketHolidays.push(date);
                marketHolidaysPeriods.push(
                    {"status": "closed", "period": [getUnixTime(openTime) * 1000, getUnixTime(closeTime) * 1000]}
                );                
            }
        }
    }

    return {"market-holidays": marketHolidays, "market-holidays-periods": marketHolidaysPeriods};
}

const determineLastActiveMarketDays = async () => {
    const today = new Date();
    const timeZoneOffset = findTimeZoneOffset();

    const generalMarketHolidaysObject = await determineMarketHolidays();
    const marketHolidays = generalMarketHolidaysObject["market-holidays"];
    const marketHolidaysPeriod = generalMarketHolidaysObject["market-holidays-periods"];
    
    let todayUpdatedCritical = add(today, {hours: -timeZoneOffset.hours, minutes: -timeZoneOffset.minutes});
    const todayUnixInterlude = new Date(getYear(todayUpdatedCritical), getMonth(todayUpdatedCritical), getDate(todayUpdatedCritical));

    let todayUnixIndex = 0, todayStatus;
    let todayUnix = getUnixTime(todayUnixInterlude) * 1000;
    
    if(marketHolidays.includes(todayUnix)) {
        todayUnixIndex = marketHolidays.indexOf(todayUnix);
        todayStatus = marketHolidaysPeriod[todayUnixIndex]["status"];
    } else if(!marketHolidays.includes(todayUnix)) {
        if(getDay(todayUnixInterlude) === 0 || getDay(todayUnixInterlude) === 6) {
            todayStatus = "closed"
        } else {
            todayStatus = "open"
        }
    }

    let dayOneBool = false, dayOne = todayUpdatedCritical, dayOneUnixIndex, dayOneStatus, dayOneUnixInterlude, dayOneUnix;
    do {
        dayOne = add(dayOne, {days: -1});
        dayOneUnixInterlude = new Date(getYear(dayOne), getMonth(dayOne), getDate(add(dayOne, {hours: -timeZoneOffset.hours, minutes: -timeZoneOffset.minutes})));

        dayOneUnix = getUnixTime(dayOneUnixInterlude) * 1000;
        if(marketHolidays.includes(dayOneUnix)) {
            dayOneUnixIndex = marketHolidays.indexOf(dayOneUnix);
            dayOneStatus = marketHolidaysPeriod[dayOneUnixIndex]["status"];
            if(dayOneStatus === "early-close") {
                dayOneBool = true;
            }
        } else if(!marketHolidays.includes(dayOneUnix)) {
            if(getDay(dayOne) !== 0 && getDay(dayOne) !== 6) {
                dayOneStatus = "open";
                dayOneBool = true;
            }
        }
    } while(!dayOneBool)
    
    let dayTwoBool = false, dayTwo = dayOne, dayTwoUnixIndex, dayTwoStatus, dayTwoUnixInterlude, dayTwoUnix;
    do {
        dayTwo = add(dayTwo, {days: -1});
        dayTwoUnixInterlude = new Date(getYear(dayTwo), getMonth(dayTwo), getDate(add(dayTwo, {hours: -timeZoneOffset.hours, minutes: -timeZoneOffset.minutes})));

        dayTwoUnix = getUnixTime(dayTwoUnixInterlude) * 1000;
        if(marketHolidays.includes(dayTwoUnix)) {
            dayTwoUnixIndex = marketHolidays.indexOf(dayTwoUnix);
            dayTwoStatus = marketHolidaysPeriod[dayTwoUnixIndex]["status"];
            if(dayTwoStatus === "early-close") {
                dayTwoBool = true;
            }
        } else if(!marketHolidays.includes(dayTwoUnix)) {
            if(getDay(dayTwo) !== 0 && getDay(dayTwo) !== 6) {
                dayTwoStatus = "open";
                dayTwoBool = true;
            }
        }
    } while(!dayTwoBool)
    
    return {"current-date": [todayStatus, getDay(todayUnixInterlude), format(todayUnixInterlude, "yyyy-MM-dd"), todayUnixInterlude],
        "previous-date-one": [dayOneStatus, getDay(dayOne), format(dayOne, "yyyy-MM-dd"), dayOne],
        "previous-date-two": [dayTwoStatus, getDay(dayTwo), format(dayTwo, "yyyy-MM-dd"), dayTwo]
    };
}

const activeMarketDaysFunction = async () => {
    const today = new Date();
    const criticalHours = estFindHours(today);
    const applicableDates = await determineLastActiveMarketDays();

    let previousDate, startDate, endDate;
    if(applicableDates["current-date"][0] === "open" || applicableDates["current-date"][0] === "early-close") {
        if(criticalHours < 7) {
            previousDate = applicableDates["previous-date-two"][2];
            startDate = applicableDates["previous-date-one"][2];
            endDate = applicableDates["current-date"][2];
        } else {
            previousDate = applicableDates["previous-date-one"][2];
            startDate = applicableDates["current-date"][2];
            endDate = startDate;
        }
    } else if(applicableDates["current-date"][0] === "closed") {
        previousDate = applicableDates["previous-date-two"][2];
        startDate = applicableDates["previous-date-one"][2];
        endDate = startDate;
    }

    return {
        "previousDate": previousDate,
        "startDate": startDate,
        "endDate": endDate
    }
}

const formatLargeFiguresFunction = (num, digits) => {
    const lookup = [
        { value: 1, symbol: "" },
        { value: 1e3, symbol: "k" },
        { value: 1e6, symbol: "M" },
        { value: 1e9, symbol: "B" },
        { value: 1e12, symbol: "T" },
        { value: 1e15, symbol: "P" },
        { value: 1e18, symbol: "E" }
    ];
    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    let item = lookup.slice().reverse().find(function(item) {
        return num >= item.value;
    });
    return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
}

const formatFiguresFunction = new Intl.NumberFormat(
    'en-US',
    {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }
);

const formatFiguresCryptoFunction = new Intl.NumberFormat(
    'en-US',
    {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4
    }
);

const formatPercentageFunction = new Intl.NumberFormat(
    'en-US',
    {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }
);

const profilePictureGradientOptions = [
    {"background": "#780206", "background": "-webkit-linear-gradient(to top, #061161, #780206)", "background": "linear-gradient(to top, #061161, #780206)"},
    {"background": "#009FFF", "background": "-webkit-linear-gradient(to bottom, #ec2F4B, #009FFF)", "background": "linear-gradient(to bottom, #ec2F4B, #009FFF)"},
    {"background": "#108dc7", "background": "-webkit-linear-gradient(to bottom, #ef8e38, #108dc7)", "background": "linear-gradient(to bottom, #ef8e38, #108dc7)"},
    {"background": "#40E0D0", "background": "-webkit-linear-gradient(to bottom, #FF0080, #FF8C00, #40E0D0)", "background": "linear-gradient(to bottom, #FF0080, #FF8C00, #40E0D0)"},
    {"background": "#3494E6", "background": "-webkit-linear-gradient(to bottom, #EC6EAD, #3494E6)", "background": "linear-gradient(to bottom, #EC6EAD, #3494E6)"}
]

const marketConfigSupport_inError = {
    "alpha": 0.1,
    "beta": 0.005,
    "fee": {
        "50": 5,
        "250": 3.5,
        "1000": 2.5,
        "5000": 1.5,
        "5000+": 0.75
    },
    "creatorStake": 0.5
}

const generalOpx = {
    axiosInstance: axiosInstanceFunction,
    axiosRegionInstance: axiosRegionInstanceFunction,

    activeMarketDays: activeMarketDaysFunction,

    formatFigures: formatFiguresFunction,
    formatPercentage: formatPercentageFunction,
    formatLargeFigures: formatLargeFiguresFunction,
    formatFiguresCrypto: formatFiguresCryptoFunction,

    profilePictureGradients: profilePictureGradientOptions,

    marketConfigSupport: marketConfigSupport_inError
}

export default generalOpx;