import '../stockChart/index.css';

import datafeed from './datafeed';
import {widget} from '../../charting_library/charting_library.esm'
import React, { useEffect, useRef } from 'react';
import {getUnixTime} from 'date-fns';

function getLanguageFromURL() {
	const regex = new RegExp('[\\?&]lang=([^&#]*)');
	const results = regex.exec(window.location.search);
	return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

export const FinulabMarkets_OutcomeChart = (props) => {
	const now = new Date();
	const nowUnix = getUnixTime(now);

	const chartContainerRef = useRef();

	const defaultProps = {
		symbol: `${props.market_selection}`,
		interval: "120",//'5',
		//datafeedUrl: 'https://demo_feed.tradingview.com',
		datafeed: datafeed,
		libraryPath: '/charting_library/',
		//chartsStorageUrl: 'https://saveload.tradingview.com',
		chartsStorageApiVersion: '1.1',
		//clientId: 'tradingview.com',
		//userId: 'public_user_id',
		fullscreen: false,
		autosize: true,
		studiesOverrides: {},
	};

	useEffect(() => {
		if(props.market_selection !== undefined) {
			const widgetOptions = {
				symbol: defaultProps.symbol,
				// BEWARE: no trailing slash is expected in feed URL
				datafeed: defaultProps.datafeed, //new window.Datafeeds.UDFCompatibleDatafeed(defaultProps.datafeed),
				interval: defaultProps.interval,
				container: chartContainerRef.current,
				library_path: defaultProps.libraryPath,
	
				locale: getLanguageFromURL() || 'en',
				disabled_features: [
					'use_localstorage_for_settings', 
					//'header_compare', 
					//'header_fullscreen_button',
					//'header_settings',
					'header_quick_search',
					'save_chart_properties_to_local_storage',
					'header_saveload',
					'header_symbol_search',
					//'header_resolutions',
					'header_layouttoggle',
					//'left_toolbar',
					'create_volume_indicator_by_default'
				],
				enabled_features: ['study_templates'], //'show_symbol_logos'
                featureset: {
                    hide_price_scale_if_all_sources_hidden: false // If this setting exists, set it to false
                },
				charts_storage_url: defaultProps.chartsStorageUrl,
				charts_storage_api_version: defaultProps.chartsStorageApiVersion,
				client_id: defaultProps.clientId,
				user_id: defaultProps.userId,
				fullscreen: defaultProps.fullscreen,
				autosize: defaultProps.autosize,
				studies_overrides: defaultProps.studiesOverrides,
				transparency: 100,
				theme: "dark",
				//style: "10",
				overrides: {
					"style": 1,//10
					"paneProperties.background": "#020203", //#121212
					"paneProperties.backgroundType": "solid", 
					//"paneProperties.backgroundGradientStartColor": "#E6DADA",
					//"paneProperties.backgroundGradientEndColor": "#274046",
	
					"paneProperties.horzGridProperties.color": "#2c2c2c",
					"paneProperties.vertGridProperties.color": "#2c2c2c",
					
					"paneProperties.legendProperties.showStudyArguments":false,
					//"paneProperties.legendProperties.showSeriesTitle": false,
					//"paneProperties.legendProperties.showStudyValues":false,
					//"paneProperties.legendProperties.showSeriesOHLC": false,
					//"paneProperties.legendProperties.showBarChange":false
					//"mainSeriesProperties.style": 10,
					//"scalesProperties.fontSize": 20,
				},
				timeframe: "7D",//"1D", //{from: nowUnix - 86400, to: nowUnix}
				time_frames: [
					{  text: "1d", resolution: "5", description: "1 Day" },
					{  text: "1w", resolution: "30", description: "1 Week" },
					{  text: "1m", resolution: "1H", description: "1 Month" },
                    {  text: "1y", resolution: "1D", description: "1 Year" },
					//{ title: "All", text: "1y", resolution: "1D", description: "1 Year" }
				]
			};
	
			const tvWidget = new widget(widgetOptions);
	
			tvWidget.onChartReady(async () => {
				const initialPriceRange = tvWidget.activeChart().getPanes()[0].getMainSourcePriceScale().getVisiblePriceRange();
				const priceScale = tvWidget.activeChart().getPanes()[0].getRightPriceScales()[0];
				priceScale.setVisiblePriceRange({ "from": initialPriceRange.from * 0.80, "to": initialPriceRange.to * 1.25 });
	
				tvWidget.setCSSCustomProperty('--tv-color-platform-background', '#252525');
				tvWidget.setCSSCustomProperty('--tv-color-pane-background', '#020203');
				//tvWidget.setCSSCustomProperty('--tv-color-toolbar-button-background-hover', '#2c2c2c');
				//tvWidget.setCSSCustomProperty('--tv-color-popup-element-background-active', '#222222');
	
				tvWidget.chart().getSeries().setChartStyleProperties(1, {
					borderUpColor: '#2ecc71',
					borderDownColor: '#df5344'
				});
	
				//await tvWidget.activeChart().createStudy("overlay", true, false, {symbol: "IBM"}, {"style": 2, "lineStyle.color": "red"}, {"priceScale": "no-scale"});
				//await tvWidget.activeChart().createStudy("overlay", true, false, {symbol: "GOOG"}, {"style": 2, "lineStyle.color": "green"}, {"priceScale": "no-scale"});
				await tvWidget.activeChart().createStudy('Volume', false, false);
				const chartHeight = tvWidget.activeChart().getPanes()[0].getHeight();
				tvWidget.activeChart().getPanes()[1].setHeight(chartHeight * 0.15);
	
				/*
				tvWidget.headerReady().then(() => {
					const button = tvWidget.createButton();
					button.setAttribute('title', 'Click to show a notification popup');
					button.classList.add('apply-common-tooltip');
					button.addEventListener('click', () => tvWidget.showNoticeDialog({
						title: 'Notification',
						body: 'TradingView Charting Library API works correctly',
						callback: () => {
							console.log('Noticed!');
						},
					}));
	
					button.innerHTML = 'Check API';
					
				});
				*/
	
				//tvWidget.chart().setTimeFrame({val: {type: 'period-back', value: '12M'}, res: '1W'});
			});
	
			return () => {
				tvWidget.remove();
			};
		}
	});

	return (
		<div
			ref={chartContainerRef}
			className={'TVChartContainer'}
		/>
	);
}
