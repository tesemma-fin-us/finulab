import axios from 'axios';
import {jwtDecode as jwt_decode} from 'jwt-decode';
import {getUnixTime} from 'date-fns';
import {useState, useEffect, useMemo} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';

import AppLayout from './layout/app-layout';
import generalOpx from './functions/generalFunctions';

import {setBalance} from './reduxStore/walletDesc';
import {setPending} from './reduxStore/walletData';
import {login, selectUser} from './reduxStore/user';
import {setIpvFour, selectIpvFour} from './reduxStore/ipvFour';
import {setModeratorStatus} from './reduxStore/moderatorStatus';
import {updateAccessState, selectAccessState} from './reduxStore/accessToken';
import {setMarketHoldings, selectMarketHoldings} from './reduxStore/marketHoldings';

const App = () => {
	const dispatch = useDispatch();

	const user = useSelector(selectUser);
	const ipvFour = useSelector(selectIpvFour);
	const accessToken = useSelector(selectAccessState);
	const u_marketHoldings = useSelector(selectMarketHoldings);

	const [loading, setLoading] = useState(false);
	const [viewMode, setViewMode] = useState(true);
	const [accessTokenList, setAccessTokenList] = useState([]);
	useMemo(() => {
		const setSession = async () => {
			if(ipvFour["dataLoading"]) {
				try {
					const ipv4 = await axios.get("https://api.ipify.org?format=json");
					const httpOnlySession = await generalOpx.axiosRegionInstance.post("/auth/region",
						{"ipv4": ipv4.data["ip"], "city": null, "state": null, "country": null}
					);
	
					if(Object.keys(httpOnlySession.data).includes("accessToken")) {
						dispatch(
							updateAccessState(
								httpOnlySession.data["accessToken"]
							)
						);
						setAccessTokenList([httpOnlySession.data["accessToken"]]);
						
						dispatch(
							setIpvFour(
								{
									"data": {
										"ipv4": ipv4.data["ip"], 
										"city": null, 
										"state": null, 
										"country": null
									},
									"dataLoading": false
								}
							)
						);

						setLoading(true);
					} else {
						setLoading(false);
					}
				} catch(error) {
					try {
						const ipv4 = await axios.get("https://geolocation-db.com/json/");
						const httpOnlySession = await generalOpx.axiosRegionInstance.post("/auth/region",
							{"ipv4": ipv4.data["IPv4"], "city": ipv4.data["city"], "state": ipv4.data["state"], "country": ipv4.data["country_code"]}
						);
	
						if(Object.keys(httpOnlySession.data).includes("accessToken")) {
							dispatch(
								updateAccessState(
									httpOnlySession.data["accessToken"]
								)
							);
							setAccessTokenList([httpOnlySession.data["accessToken"]]);

							dispatch(
								setIpvFour(
									{
										"data": {
											"ipv4": ipv4.data["IPv4"], 
											"city": ipv4.data["city"],
											"state": ipv4.data["state"],
											"country": ipv4.data["country_code"]
										},
										"dataLoading": false
									}
								)
							);

							setLoading(true);
						} else {
							setLoading(false);
						}
					} catch(error) {
						const ipv4 = await axios.get("https://ip-api.com/json/");
						const httpOnlySession = await generalOpx.axiosRegionInstance.post("/auth/region",
							{"ipv4": ipv4.data["query"], "city": ipv4.data["city"], "state": ipv4.data["regionName"], "country": ipv4.data["countryCode"]}
						);
						
						if(Object.keys(httpOnlySession.data).includes("accessToken")) {
							dispatch(
								updateAccessState(
									httpOnlySession.data["accessToken"]
								)
							);
							setAccessTokenList([httpOnlySession.data["accessToken"]]);

							dispatch(
								setIpvFour(
									{
										"data": {
											"ipv4": ipv4.data["query"], 
											"city": ipv4.data["city"],
											"state": ipv4.data["regionName"],
											"country": ipv4.data["countryCode"]
										},
										"dataLoading": false
									}
								)
							);

							setLoading(true);
						} else {
							setLoading(false);
						}
					}
				}
			} else {
				const httpOnlySession = await generalOpx.axiosRegionInstance.post("/auth/region",
					{"ipv4": ipvFour["data"]["ipv4"], "city": ipvFour["data"]["city"], "state": ipvFour["data"]["state"], "country": ipvFour["data"]["country"]}
				);

				if(Object.keys(httpOnlySession.data).includes("accessToken")) {
					dispatch(
						updateAccessState(
							httpOnlySession.data["accessToken"]
						)
					);
					setAccessTokenList([httpOnlySession.data["accessToken"]]);

					setLoading(true);
				} else {
					setLoading(false);
				}
			}
		}
		const completeSession = async () => {if(!loading) {await setSession();}}

		completeSession();
	}, []);

	const [loadingComplete, setLoadingComplete] = useState(false);
	const [loadingCompleteMeasure, setLoadingCompleteMeasure] = useState(0);
	useEffect(() => {
		const updateSetupAccessToken = async () => {
			setAccessTokenList([accessToken]);
		}
		const modifyAccessTokenList = async () => {
			await updateSetupAccessToken();
		}

		if(loadingComplete) {
			modifyAccessTokenList();
			if(accessToken !== accessTokenList[0]) {
				setLoadingCompleteMeasure(loadingCompleteMeasure + 1);
			}
		}

		const refreshToken = async () => {
			const res = await generalOpx.axiosRegionInstance.post("/auth/region-update");
			setAccessTokenList([res.data["accessToken"]]);
			dispatch(
				updateAccessState(
					res.data["accessToken"]
				)
			);
			return res.data;
		}

		const axiosInstanceInterceptor = generalOpx.axiosInstance.interceptors.request.use(
			async (config) => {
				if(accessToken !== "" && accessToken === accessTokenList[accessTokenList.length - 1]) {
					if(accessToken.slice(accessToken.length - 5, accessToken.length) === "..use") {
						const today = new Date();
						const todayUnix = getUnixTime(today);
						const decodedToken = await jwt_decode(accessToken.split("..use")[0]);

						if(todayUnix > decodedToken.exp) {
							const data = await refreshToken();
							config.headers["authorization"] = "Bearer " + data["accessToken"];
						} else if(todayUnix <= decodedToken.exp) {
							config.headers["authorization"] = "Bearer " + accessToken.split("..use")[0];
						}
					} else {
						const today = new Date();
						const todayUnix = getUnixTime(today);
						const decodedToken = await jwt_decode(accessToken);

						if(todayUnix > decodedToken.exp) {
							const data = await refreshToken();
							config.headers["authorization"] = "Bearer " + data["accessToken"];
						} else if(todayUnix <= decodedToken.exp) {
							config.headers["authorization"] = "Bearer " + accessToken;
						}
					}
				}
				return config;
			}, (error) => {return Promise.reject(error);}
		);

		if(loadingComplete === false) {setLoadingComplete(true);}
		return () => {generalOpx.axiosInstance.interceptors.request.eject(axiosInstanceInterceptor);}
	}, [accessToken, loadingCompleteMeasure]);

	const [sessionInitialized, setSessionInitialized] = useState(false);
	useEffect(() => {
		const setUpMarketHoldings = async () => {
			let set_u_marketHoldings = [];
			const holdings = await generalOpx.axiosInstance.put(`/market/live-holdings`, {});
			
			if(holdings.data["status"] === "success") {
				set_u_marketHoldings = [
					...holdings.data["data"]
				];

				dispatch(
					setMarketHoldings(set_u_marketHoldings)
				);
			}
		}

		const setUpModeratorStatus = async () => {
			const mod_stat = await generalOpx.axiosInstance.put(`/users/pull-mod-stat`);

			if(mod_stat.data["status"] === "success") {
				dispatch(
					setModeratorStatus(
						mod_stat.data["data"]
					)
				);

				if(mod_stat.data["verificationData"] === undefined || mod_stat.data["verificationData"] === null) {
					dispatch(
						login(
							{
								user: user.user,
								profilePicture: user.profilePicture,
								profileWallpaper: user.profileWallpaper,
								finuxEarned: user.finuxEarned,
								walletAddress: user.walletAddress,
								monetized: false,
								verified: false,
								verificationData: {},
								createdAt: user.createdAt
							}
						)
					);
				} else if(Object.keys(mod_stat.data["verificationData"]).length === 0) {
					dispatch(
						login(
							{
								user: user.user,
								profilePicture: user.profilePicture,
								profileWallpaper: user.profileWallpaper,
								finuxEarned: user.finuxEarned,
								walletAddress: user.walletAddress,
								monetized: false,
								verified: false,
								verificationData: {},
								createdAt: user.createdAt
							}
						)
					);
				} else {
					dispatch(
						login(
							{
								user: user.user,
								profilePicture: user.profilePicture,
								profileWallpaper: user.profileWallpaper,
								finuxEarned: user.finuxEarned,
								walletAddress: user.walletAddress,
								monetized: mod_stat.data["verificationData"]["status"] === "active",
								verified: mod_stat.data["verificationData"]["status"] === "active",
								verificationData: mod_stat.data["verificationData"],
								createdAt: user.createdAt
							}
						)
					);
				}
			}
		}

		const setUpWalletDesc = async () => {
			const balanceDesc = await generalOpx.axiosInstance.put(`/wallet/chain-balance`, {"accountId": user.walletAddress});
			if(balanceDesc.data["status"] === "success") {
				let bal_data = [];
				const balanceDescKeys = Object.keys(balanceDesc.data["data"]);
				if(balanceDescKeys.length > 0) {
					for(let i = 0; i < balanceDescKeys.length; i++) {
						if(balanceDescKeys[i]=== "initialized") continue;
						if(balanceDescKeys[i]=== "lastTxTimestamp") continue;

						const bal = Number(balanceDesc.data["data"][balanceDescKeys[i]]);
						if(isNaN(bal)) continue;

						bal_data.push([balanceDescKeys[i], bal]);
					}
				}

				dispatch(
					setBalance(
						{
							"data": bal_data,
							"dataLoading": false
						} 
					)
				);

				dispatch(
					setPending(
						{
							"data": balanceDesc.data["pendingBalance"],
							"dataLoading": false
						}
					)
				);
			}
		}
		
		if(!sessionInitialized) {
			if(accessToken !== "" && accessToken === accessTokenList[accessTokenList.length - 1]) {
				if(user) {
					setSessionInitialized(true);

					setUpWalletDesc();
					setUpMarketHoldings();
					setUpModeratorStatus();
				}
			}
		}
	}, [accessToken, user, loadingCompleteMeasure]);
	
	return(
		<>
			{loading && loadingComplete ?
				<>
					{viewMode ?
						<>
							<meta name="theme-color" content="rgba(0, 0, 0, 1)"/>
							<link rel="manifest" href="/assets/manifest.json" />
							<link rel="stylesheet" href="/assets/index.css" />
						</> : 
						<>
							<meta name="theme-color" content="#ffffff"/>
							<link rel="manifest" href="/assets/manifest-jedi.json" />
							<link rel="stylesheet" href="/assets/index-jedi.css" />
						</>
					}
					<Router>
						<Routes>
							<Route path='*' element={<Navigate to="/"/>} />

							<Route path='/' element={<AppLayout page={"home"} displayView={""}/>} />
							<Route path='/following' element={<AppLayout page={"home"} displayView={"following"}/>} />
							<Route path='/post/:postId' element={<AppLayout page={"home"} displayView={"Post"}/>} />
							<Route path='/news/:newsId' element={<AppLayout page={"home"} displayView={"News"}/>} />
							
							<Route path='/login' element={user ? <Navigate to="/"/> : <AppLayout page={"login"} displayView={""}/>} />
							<Route path='/logout' element={user ? <AppLayout page={"logout"} displayView={""}/> : <Navigate to="/"/>} />

							<Route path='/main-login' element={user ? <Navigate to="/"/> : <AppLayout page={"main-login"} displayView={""}/>} />

							<Route path='/forgot-login' element={user ? <Navigate to="/"/> : <AppLayout page={"main-login"} displayView={"forgot-login"}/>} />

							<Route path='/create-account' element={user ? <Navigate to="/"/> : <AppLayout page={"main-login"} displayView={"create-account"}/>} />
							<Route path='/confirm-account' element={user ? <Navigate to="/"/> : <AppLayout page={"main-login"} displayView={"confirm-account"}/>} />
							<Route path='/finalize-account' element={user ? <Navigate to="/"/> : <AppLayout page={"main-login"} displayView={"finalize-account"}/>} />
							
							<Route path='/get-verified' element={user ? <AppLayout page={"get-verified"} displayView={""}/> : <Navigate to="/"/>} />

							<Route path='/send' element={user ? <AppLayout page={"send"} displayView={""}/> : <Navigate to="/"/>} />
							<Route path='/receive' element={user ? <AppLayout page={"receive"} displayView={""}/> : <Navigate to="/"/>} />
							<Route path='/create-post' element={user ? <AppLayout page={"create-post"} displayView={""}/> : <AppLayout page={"login"} displayView={""}/>} />
							<Route path='/create-community' element={user ? <AppLayout page={"create-community"} displayView={""}/> : <AppLayout page={"login"} displayView={""}/>} />
							<Route path='/create-prediction' element={user ? <AppLayout page={"create-prediction"} displayView={""}/> : <AppLayout page={"login"} displayView={""}/>} />
							
							<Route path='/profile/:userId' element={<AppLayout page={"profile"} displayView={""}/>} />
							<Route path='/profile/:userId/markets' element={<AppLayout page={"profile"} displayView={"markets"}/>} />
							<Route path='/profile/:userId/engaged' element={<AppLayout page={"profile"} displayView={"engaged"}/>} />
							<Route path='/profile/:userId/watchlist' element={<AppLayout page={"profile"} displayView={"watchlist"}/>} />
							<Route path='/profile/:userId/notifications' element={<AppLayout page={"profile"} displayView={"notifications"}/>} />

							<Route path='/profile/:userId/rules' element={<AppLayout page={"profile"} displayView={"rules"}/>} />
							<Route path='/profile/:userId/moderators' element={<AppLayout page={"profile"} displayView={"moderators"}/>} />

							<Route path='/profile/:userId/communities' element={<AppLayout page={"profile"} displayView={"communities"}/>} />
							<Route path='/profile/:userId/following' element={<AppLayout page={"profile"} displayView={"following"}/>} />
							<Route path='/profile/:userId/followers' element={<AppLayout page={"profile"} displayView={"followers"}/>} />

							<Route path='/wallet' element={user ? <AppLayout page={"wallet"} displayView={""}/> : <Navigate to="/"/>} />
							<Route path='/wallet/closed' element={user ? <AppLayout page={"wallet"} displayView={"closed"}/> : <Navigate to="/"/>} />
							<Route path='/wallet/history' element={user ? <AppLayout page={"wallet"} displayView={"history"}/> : <Navigate to="/"/>} />
							<Route path='/wallet/txs' element={user ? <AppLayout page={"wallet"} displayView={"txs"}/> : <Navigate to="/"/>} />
							<Route path='/wallet/chains' element={user ? <AppLayout page={"wallet"} displayView={"chains"}/> : <Navigate to="/"/>} />
							
							<Route path='/market' element={<AppLayout page={"market"} displayView={""}/>} />
							<Route path='/market/:marketType' element={<AppLayout page={"market"} displayView={"specificMarket"}/>} />
							<Route path='/market/prediction/:predictionId' element={<AppLayout page={"market"} displayView={"prediction"}/>} />
							<Route path='/market/outcome/:marketId/:selection' element={<AppLayout page={"market"} displayView={"specificOutcome"}/>} />
							
							<Route path='/stocks' element={<AppLayout page={"stocks"} displayView={""}/>} />
							{/*<Route path='/stocks/news/:newsId' element={<AppLayout page={"stocks"} displayView={""}/>} />*/}
							<Route path='/stocks/prediction/:predictionId' element={<AppLayout page={"stocks"} displayView={""}/>} />

							<Route path='/stocks/:stockTicker' element={<AppLayout page={"stocks"} displayView={""}/>} />
							{/*<Route path='/stocks/:stockTicker/news/:newsId' element={<AppLayout page={"stocks"} displayView={""}/>} />*/}
							<Route path='/stocks/:stockTicker/markets' element={<AppLayout page={"stocks"} displayView={"markets"}/>} />
							<Route path='/stocks/:stockTicker/markets/:predictionId' element={<AppLayout page={"stocks"} displayView={""}/>} />
							<Route path='/stocks/:stockTicker/posts' element={<AppLayout page={"stocks"} displayView={"posts"}/>} />
							<Route path='/stocks/:stockTicker/posts/:postId' element={<AppLayout page={"stocks"} displayView={""}/>} />

							<Route path='/cryptos' element={<AppLayout page={"cryptos"} displayView={""}/>} />
							<Route path='/cryptos/:stockTicker' element={<AppLayout page={"cryptos"} displayView={""}/>} />
						</Routes>
					</Router>
				</> : null
			}
		</>
	);
}

export default App;
