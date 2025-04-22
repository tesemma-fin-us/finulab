import {createSlice} from '@reduxjs/toolkit';

export const walletDataSlice = createSlice(
    {
        name: "walletData",
        initialState: {
            walletData: {
                "position": {
                    "fixed": false,
                    "scrollTop": 0
                },
                "pending": {
                    "data": 0,
                    "dataLoading": true
                },
                "transactions": {
                    "next": "",
                    "data": [],
                    "dataLoading": true
                },
                "activity": {
                    "data": [],
                    "period": {},
                    "dataLoading": true
                },
                "balancePlot": {
                    "labels": [],
                    "invested": [],
                    "available": [],
                    "summation": [],
                    "dataLoading": true
                },
                "balancePlotIndex": 0,
                "portfolioPlots": {
                    "data": [],
                    "dataLoading": true
                }
            }
        },
        reducers: {
            setPosition: (state, action) => {
                state.walletData = {
                    ...state.walletData, 
                    "position": {...action.payload}
                }
            },
            setPending: (state, action) => {
                state.walletData = {
                    ...state.walletData,
                    "pending": {...action.payload}
                }
            },
            setTransactions: (state, action) => {
                state.walletData = {
                    ...state.walletData,
                    "transactions": {...action.payload}
                }
            },
            updateTransactions: (state, action) => {
                const {next, data} = action.payload
                state.walletData = {
                    ...state.walletData,
                    "transactions": {
                        "next": next,
                        "data": [...state.walletData.transactions.data, ...data],
                        "dataLoading": false
                    }
                }
            },
            setActivity: (state, action) => {
                state.walletData = {
                    ...state.walletData,
                    "activity": {...action.payload}
                }
            },
            setBalancePlot: (state, action) => {
                state.walletData = {
                    ...state.walletData,
                    "balancePlot": {...action.payload}
                }
            },
            updateBalancePlot: (state, action) => {
                const {index, labels, invested, available, summation} = action.payload;

                state.walletData = {
                    ...state.walletData,
                    "balancePlot": {
                        ...state.walletData.balancePlot,
                        "labels": [
                            ...state.walletData.balancePlot.labels.slice(0, index),
                            labels,
                            ...state.walletData.balancePlot.labels.slice(index + 1)
                        ],
                        "invested": [
                            ...state.walletData.balancePlot.invested.slice(0, index),
                            invested,
                            ...state.walletData.balancePlot.invested.slice(index + 1)
                        ],
                        "available": [
                            ...state.walletData.balancePlot.available.slice(0, index),
                            available,
                            ...state.walletData.balancePlot.available.slice(index + 1)
                        ],
                        "summation": [
                            ...state.walletData.balancePlot.summation.slice(0, index),
                            summation,
                            ...state.walletData.balancePlot.summation.slice(index + 1)
                        ]
                    }
                }
            },
            setBalancePlotIndex: (state, action) => {
                state.walletData = {
                    ...state.walletData,
                    "balancePlotIndex": action.payload
                }
            },
            setPortfolioPlots: (state, action) => {
                state.walletData = {
                    ...state.walletData,
                    "portfolioPlots": {...action.payload}
                }
            }
        }
    }
);

export const {
    setPosition,
    setPending,
    setTransactions,
    updateTransactions,
    setActivity,
    setBalancePlot,
    updateBalancePlot,
    setBalancePlotIndex,
    setPortfolioPlots,
    updatePortfolioPlots
} = walletDataSlice.actions;
export const selectWalletData = (state) => state.walletData.walletData;
export default walletDataSlice.reducer;