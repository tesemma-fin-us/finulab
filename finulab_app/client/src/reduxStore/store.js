import {thunk} from 'redux-thunk';
import storage from 'redux-persist/lib/storage';
import {persistStore, persistReducer} from 'redux-persist';
import {configureStore, combineReducers, getDefaultMiddleware} from '@reduxjs/toolkit';

import pageInformationReducer from './pageInformation';

import userReducer from './user';
import commentsReducer from './comments';
import interestsReducer from './interests';
import watchlistReducer from './watchlist';
import walletDescReducer from './walletDesc';
import accessTokenReducer from './accessToken';
import marketHoldingsReducer from './marketHoldings';
import newsEngagementReducer from './newsEngagement';
import postEngagementReducer from './postEngagement';
import moderatorStatusReducer from './moderatorStatus';
import recommendationsReducer from './recommendations';
import commentsEngagementReducer from './commentsEngagement';
import predictionEngagementReducer from './predictionEngagement';

import appViewReducer from './appView';
import ipvFourReducer from './ipvFour';
import notificationsReducer from './notifications';
import userQuickDescReducer from './userQuickDesc';
import finuxTxBeingSentReducer from './finuxTxBeingSent';
import lastVisitedReducer from './lastVisited';
import homeFinancialScrollReducer from './homeFinancialScroll';

import walletRefreshCounterReducer from './walletRefreshCounter';

import viewMediaReducer from './viewMedia';
import signUpSupportReducer from './signUpSupport';
import postCommunityOptnsReducer from './postCommunityOptns';

import profileDataReducer from './profileData';
import networkDescReducer from './networkDesc';
import marketConfigReducer from './marketConfig';
import marketDataReducer from './marketData';
import marketFineDetailsReducer from './marketFineDetails';
import walletDataReducer from './walletData';
import walletSupportDataReducer from './walletSupportData';
import homePageDataReducer from './homePageData';
import homePageMarketsReducer from './homePageMarkets';
import homePageWatchlistReducer from './homePageWatchlist';
import homePageCommunitiesReducer from './homePageCommunities';

import stockNewsReducer from './stockNews';
import stockQuoteReducer from './stockQuote';
import stockPostsReducer from './stockPosts';
import stockPageDataReducer from './stockPageData';
import stockActiveDaysReducer from './stockActiveDays';
import stockPredictionsReducer from './stockPredictions';
import stockPriceHistoryReducer from './stockPriceHistory';
import stockPageSelectionReducer from './stockPageSelection';

import stockDashboardDataReducer from './stockDashboardData';
import stockDashboardNewsReducer from './stockDashboardNews';
import stockDashboardMarketsReducer from './stockDashboardMarkets';

import predictionPlotDataReducer from './predictionPlotData';

const rootReducer = combineReducers(
    {
        pageInformation: pageInformationReducer,

        ipvFour: ipvFourReducer,
        accessToken: accessTokenReducer,
        marketHoldings: marketHoldingsReducer,

        comments: commentsReducer,
        newsEngagement: newsEngagementReducer,
        postEngagement: postEngagementReducer,
        commentsEngagement: commentsEngagementReducer,
        predictionEngagement: predictionEngagementReducer,

        user: userReducer,
        interests: interestsReducer,
        watchlist: watchlistReducer,
        walletDesc: walletDescReducer,
        recommendations: recommendationsReducer,
        moderatorStatus: moderatorStatusReducer,

        appView: appViewReducer,
        notifications: notificationsReducer,
        userQuickDesc: userQuickDescReducer,
        finuxTxBeingSent: finuxTxBeingSentReducer,
        lastVisited: lastVisitedReducer,
        homeFinancialScroll: homeFinancialScrollReducer,

        walletRefreshCounter: walletRefreshCounterReducer,

        viewMedia: viewMediaReducer,
        signUpSupport: signUpSupportReducer,
        postCommunityOptns: postCommunityOptnsReducer,

        profileData: profileDataReducer,
        networkDesc: networkDescReducer,
        marketConfig: marketConfigReducer,
        marketData: marketDataReducer,
        marketFineDetails: marketFineDetailsReducer,
        walletData: walletDataReducer,
        walletSupportData: walletSupportDataReducer,
        homePageData: homePageDataReducer,
        homePageMarkets: homePageMarketsReducer,
        homePageWatchlist: homePageWatchlistReducer,
        homePageCommunities: homePageCommunitiesReducer,

        stockNews: stockNewsReducer,
        stockQuote: stockQuoteReducer,
        stockPosts: stockPostsReducer,
        stockPageData: stockPageDataReducer,
        stockActiveDays: stockActiveDaysReducer,
        stockPredictions: stockPredictionsReducer,
        stockPriceHistory: stockPriceHistoryReducer,
        stockPageSelection: stockPageSelectionReducer,
        

        stockDashboardData: stockDashboardDataReducer,
        stockDashboardNews: stockDashboardNewsReducer,
        stockDashboardMarkets: stockDashboardMarketsReducer,

        predictionPlotData: predictionPlotDataReducer
    }
);

const persistConfig = {
    key: 'main-root',
    blacklist: [
        'pageInformation',
        
        'accessToken',
        'homeFinancialScroll',

        'notifications',
        'finuxTxBeingSent',

        'comments',
        'postEngagement',
        'newsEngagement',
        'predictionEngagement',

        'walletRefreshCounter',

        'viewMedia',
        'signUpSupport',
        'postCommunityOptns',

        'profileData',
        'networkDesc',
        'marketData',
        'marketFineDetails',
        'walletData',
        'walletSupportData',
        'homePageData',
        'homePageMarkets',
        'homePageWatchlist',
        'homePageCommunities',

        'stockNews',
        'stockQuote',
        'stockPosts',
        'stockPageData',
        'stockPredictions',
        'stockPriceHistory',
        'stockPageSelection',

        'stockDashboardData',
        'stockDashboardNews',
        'stockDashboardMarkets',

        'predictionPlotData'
    ],
    storage
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore(
    {
        reducer: persistedReducer,
        middleware: (getDefaultMiddleware) => {
            return getDefaultMiddleware(
                {
                    serializableCheck: {
                        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
                    }
                }
            ).concat(thunk)
        }
    }
);

const persistor = persistStore(store);

export {persistor};
export default store;