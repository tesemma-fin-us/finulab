import '../post/index.css';

import Quill from 'quill';
import axios from 'axios';
import DOMPurify from 'dompurify';
import {getUnixTime} from 'date-fns';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {useRef, useState, useEffect} from 'react';
import FadeLoader from 'react-spinners/FadeLoader';
import {useDispatch, useSelector} from 'react-redux';
import {Tsunami, CameraAlt, VideoCameraBack, North, Close} from '@mui/icons-material';

import generalOpx from '../../functions/generalFunctions';

import {selectUser} from '../../reduxStore/user';
import {updateStockNews, selectStockNews} from '../../reduxStore/stockNews';
import {updateStockPosts, selectStockPosts} from '../../reduxStore/stockPosts';
import {setComments, updateComments, selectComments} from '../../reduxStore/comments';
import {updateStockPredictions, selectStockPredictions} from '../../reduxStore/stockPredictions';
import {setStockPageSelection, selectStockPageSelection} from '../../reduxStore/stockPageSelection';
import {updateStockDashboardNews, selectStockDashboardNews} from '../../reduxStore/stockDashboardNews';
import {updateStockDashboardMarkets, setStockDashboardMarketsSelected, selectStockDashboardMarkets} from '../../reduxStore/stockDashboardMarkets';

const override = {
    display: "flex",
    marginTop: "24px",
    marginLeft: "17px"
};

const chunkArray = (arr, size) => {
    let chunkedArray = [];
    for(let i = 0; i < arr.length; i += size) {
        chunkedArray.push(arr.slice(i, i + size));
    }

    return chunkedArray
}

export default function FinulabComment(props) {
    const dispatch = useDispatch();
    const Delta = Quill.import('delta');

    const user = useSelector(selectUser);
    const comments = useSelector(selectComments);
    const stockPosts = useSelector(selectStockPosts);
    const stockNews = useSelector(selectStockNews);
    const dashboardNews = useSelector(selectStockDashboardNews);
    const stockSelection = useSelector(selectStockPageSelection);
    const stockPredictions = useSelector(selectStockPredictions);
    const dashboardPredictions = useSelector(selectStockDashboardMarkets);

    const locations = (substring,string) => {
        let a=[],i=-1;
        while((i=string.indexOf(substring,i+1)) >= 0) a.push(i);
        return a;
    }

    const quillRef = useRef(null);
    const [comment, setComment] = useState("");
    const [userQueryText, setUserQueryText] = useState("");
    const [stockQueryText, setStockQueryText] = useState("");
    const [cryptoQueryText, setCryptoQueryText] = useState("");
    const [tagOptionsList, setTagOptionsList] = useState([]);
    useEffect(() => {
        const quill = quillRef.current?.getEditor();
        if(!quill) return;

        const handleTextChange = (delta, oldDelta, source) => {
            if(source !== 'user') return;
      
            const cursorPosition = quill.getSelection()?.index;
            if(cursorPosition === undefined || cursorPosition === null) return;
      
            const textBeforeCursor = quill.getText(0, cursorPosition);
            const atSymbolIndex = textBeforeCursor.lastIndexOf('@');
            if(atSymbolIndex !== -1) {
                const match = /@[a-zA-Z0-9_.-]+$/.exec(textBeforeCursor); // /@([a-zA-Z0-9_.-]*)$/
                
                if(match) {
                    const startIndex = match.index;
                    quill.formatText(startIndex, match[0].length, 'bold', true);
                    quill.formatText(startIndex, match[0].length, 'color', 'var(--primary-blue-11)');
                    
                    setStockQueryText("");
                    setCryptoQueryText("");
                    setUserQueryText(`${match[0].slice(1, match[0].length)}`);
                } else {
                    const stockSymbolIndex = textBeforeCursor.lastIndexOf('S:-');
                    if(stockSymbolIndex !== -1) {
                        const stockMatch = /S:-[a-zA-Z]+$/.exec(textBeforeCursor);

                        if(stockMatch) {
                            const startIndex = stockMatch.index;
                            quill.formatText(startIndex, stockMatch[0].length, 'bold', true);
                            quill.formatText(startIndex, stockMatch[0].length, 'color', 'var(--primary-blue-11)');
                            
                            setUserQueryText("");
                            setCryptoQueryText("");
                            setStockQueryText(`${stockMatch[0].slice(3, stockMatch[0].length)}`);
                        } else {
                            const cryptoSymbolIndex = textBeforeCursor.lastIndexOf('C:-');
                            if(cryptoSymbolIndex !== -1) {
                                const cryptoMatch = /C:-[a-zA-Z]+$/.exec(textBeforeCursor);

                                if(cryptoMatch) {
                                    const startIndex = cryptoMatch.index;
                                    quill.formatText(startIndex, cryptoMatch[0].length, 'bold', true);
                                    quill.formatText(startIndex, cryptoMatch[0].length, 'color', 'var(--primary-blue-11)');

                                    setUserQueryText("");
                                    setStockQueryText("");
                                    setCryptoQueryText(`${cryptoMatch[0].slice(3, cryptoMatch[0].length)}`);
                                } else {
                                    quill.removeFormat(cursorPosition - 1, 1, 'bold', true);
                                    quill.removeFormat(cursorPosition - 1, 1, 'color', 'var(--primary-blue-11)');

                                    setUserQueryText("");
                                    setStockQueryText("");
                                    setCryptoQueryText("");
                                }
                            } else {
                                quill.removeFormat(cursorPosition - 1, 1, 'bold', true);
                                quill.removeFormat(cursorPosition - 1, 1, 'color', 'var(--primary-blue-11)');

                                setUserQueryText("");
                                setStockQueryText("");
                                setCryptoQueryText("");
                            }
                        }
                    } else {
                        const cryptoSymbolIndex = textBeforeCursor.lastIndexOf('C:-');
                        if(cryptoSymbolIndex !== -1) {
                            const cryptoMatch = /C:-[a-zA-Z]+$/.exec(textBeforeCursor);

                            if(cryptoMatch) {
                                const startIndex = cryptoMatch.index;
                                quill.formatText(startIndex, cryptoMatch[0].length, 'bold', true);
                                quill.formatText(startIndex, cryptoMatch[0].length, 'color', 'var(--primary-blue-11)');

                                setUserQueryText("");
                                setStockQueryText("");
                                setCryptoQueryText(`${cryptoMatch[0].slice(3, cryptoMatch[0].length)}`);
                            } else {
                                quill.removeFormat(cursorPosition - 1, 1, 'bold', true);
                                quill.removeFormat(cursorPosition - 1, 1, 'color', 'var(--primary-blue-11)');

                                setUserQueryText("");
                                setStockQueryText("");
                                setCryptoQueryText("");
                            }
                        } else {
                            quill.removeFormat(cursorPosition - 1, 1, 'bold', true);
                            quill.removeFormat(cursorPosition - 1, 1, 'color', 'var(--primary-blue-11)');

                            setUserQueryText("");
                            setStockQueryText("");
                            setCryptoQueryText("");
                        }
                    }
                }
            } else {
                const stockSymbolIndex = textBeforeCursor.lastIndexOf('S:-');
                if(stockSymbolIndex !== -1) {
                    const stockMatch = /S:-[a-zA-Z]+$/.exec(textBeforeCursor);

                    if(stockMatch) {
                        const startIndex = stockMatch.index;
                        quill.formatText(startIndex, stockMatch[0].length, 'bold', true);
                        quill.formatText(startIndex, stockMatch[0].length, 'color', 'var(--primary-blue-11)');
                        
                        setUserQueryText("");
                        setCryptoQueryText("");
                        setStockQueryText(`${stockMatch[0].slice(3, stockMatch[0].length)}`);
                    } else {
                        const cryptoSymbolIndex = textBeforeCursor.lastIndexOf('C:-');
                        if(cryptoSymbolIndex !== -1) {
                            const cryptoMatch = /C:-[a-zA-Z]+$/.exec(textBeforeCursor);

                            if(cryptoMatch) {
                                const startIndex = cryptoMatch.index;
                                quill.formatText(startIndex, cryptoMatch[0].length, 'bold', true);
                                quill.formatText(startIndex, cryptoMatch[0].length, 'color', 'var(--primary-blue-11)');

                                setUserQueryText("");
                                setStockQueryText("");
                                setCryptoQueryText(`${cryptoMatch[0].slice(3, cryptoMatch[0].length)}`);
                            } else {
                                quill.removeFormat(cursorPosition - 1, 1, 'bold', true);
                                quill.removeFormat(cursorPosition - 1, 1, 'color', 'var(--primary-blue-11)');

                                setUserQueryText("");
                                setStockQueryText("");
                                setCryptoQueryText("");
                            }
                        } else {
                            quill.removeFormat(cursorPosition - 1, 1, 'bold', true);
                            quill.removeFormat(cursorPosition - 1, 1, 'color', 'var(--primary-blue-11)');

                            setUserQueryText("");
                            setStockQueryText("");
                            setCryptoQueryText("");
                        }
                    }
                } else {
                    const cryptoSymbolIndex = textBeforeCursor.lastIndexOf('C:-');
                    if(cryptoSymbolIndex !== -1) {
                        const cryptoMatch = /C:-[a-zA-Z]+$/.exec(textBeforeCursor);

                        if(cryptoMatch) {
                            const startIndex = cryptoMatch.index;
                            quill.formatText(startIndex, cryptoMatch[0].length, 'bold', true);
                            quill.formatText(startIndex, cryptoMatch[0].length, 'color', 'var(--primary-blue-11)');

                            setUserQueryText("");
                            setStockQueryText("");
                            setCryptoQueryText(`${cryptoMatch[0].slice(3, cryptoMatch[0].length)}`);
                        } else {
                            quill.removeFormat(cursorPosition - 1, 1, 'bold', true);
                            quill.removeFormat(cursorPosition - 1, 1, 'color', 'var(--primary-blue-11)');

                            setUserQueryText("");
                            setStockQueryText("");
                            setCryptoQueryText("");
                        }
                    } else {
                        quill.removeFormat(cursorPosition - 1, 1, 'bold', true);
                        quill.removeFormat(cursorPosition - 1, 1, 'color', 'var(--primary-blue-11)');

                        setUserQueryText("");
                        setStockQueryText("");
                        setCryptoQueryText("");
                    }
                }
            }

            const hyperLinkMatch = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/.exec(textBeforeCursor);
            if(hyperLinkMatch) {
                const startIndex = hyperLinkMatch.index;
                quill.formatText(startIndex, hyperLinkMatch[0].length, 'bold', true);
                quill.formatText(startIndex, hyperLinkMatch[0].length, 'color', 'var(--primary-blue-11)');
            } else {
                const hashTagMatch = /#[a-zA-Z]+$/.exec(textBeforeCursor);
                if(hashTagMatch) {
                    const startIndex = hashTagMatch.index;
                    quill.formatText(startIndex, hashTagMatch[0].length, 'bold', true);
                    quill.formatText(startIndex, hashTagMatch[0].length, 'color', 'var(--primary-blue-11)');
                }
            }
        };

        const handleSelectionChange = (range, oldRange, source) => {
            if(source !== 'user') return;
            if(range === undefined || range === null) return;
            if(oldRange === undefined || oldRange === null) return;

            if(range.index !== oldRange.index || range.length !== oldRange.length) {
                setUserQueryText("");
                setStockQueryText("");

                setTagOptionsList([]);
            }
        }

        quill.clipboard.addMatcher(Node.TEXT_NODE, (node, delta) => {
            let ops = [];
            
            let pastedContent = "", 
                modification_locations = [];
            for(let i = 0; i < delta.ops.length; i++) {
                pastedContent = pastedContent + delta.ops[i].insert;
            }

            const l_rx = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
            const all_link_matches = pastedContent.match(l_rx);
            const link_matches = [...new Set(all_link_matches)];

            for(let l = 0; l < link_matches.length; l++) {
                const modIndex = locations(link_matches[l], pastedContent);
                for(let l_m = 0; l_m < modIndex.length; l_m++) {
                    modification_locations.push([modIndex[l_m], link_matches[l]]);
                }
            }


            const u_rx = /@[a-zA-Z0-9_.-]+/g;
            const all_user_matches = pastedContent.match(u_rx);
            const user_matches = [...new Set(all_user_matches)];

            for(let u = 0; u < user_matches.length; u++) {
                const modIndex = locations(user_matches[u], pastedContent);
                for(let u_m = 0; u_m < modIndex.length; u_m++) {
                    modification_locations.push([modIndex[u_m], user_matches[u]]);
                }
            }

            const s_rx = /S:-[a-zA-Z]+/g;
            const all_stock_matches = pastedContent.match(s_rx);
            const stock_matches = [...new Set(all_stock_matches)];

            for(let s = 0; s < stock_matches.length; s++) {
                const modIndex = locations(stock_matches[s], pastedContent);
                for(let s_m = 0; s_m < modIndex.length; s_m++) {
                    modification_locations.push([modIndex[s_m], stock_matches[s]]);
                }
            }

            const c_rx = /C:-[a-zA-Z]+/g;
            const all_crypto_matches = pastedContent.match(c_rx);
            const crypto_matches = [...new Set(all_crypto_matches)];

            for(let c = 0; c < crypto_matches.length; c++) {
                const modIndex = locations(crypto_matches[c], pastedContent);
                for(let c_m = 0; c_m < modIndex.length; c_m++) {
                    modification_locations.push([modIndex[c_m], crypto_matches[c]]);
                }
            }

            const h_rx = /#[a-zA-Z]+/g;
            const all_hashtag_matches = pastedContent.match(h_rx);
            const hashtag_matches = [...new Set(all_hashtag_matches)];

            for(let h = 0; h < hashtag_matches.length; h++) {
                const modIndex = locations(hashtag_matches[h], pastedContent);
                for(let h_m = 0; h_m < modIndex.length; h_m++) {
                    modification_locations.push([modIndex[h_m], hashtag_matches[h]]);
                }
            }

            if(modification_locations.length === 0) {
                return delta;
            } else {
                let j = 0;
                let k = 0;
                modification_locations = modification_locations.sort((a, b) => a[0] - b[0]);
                do {
                    if(k === modification_locations[j][0]) {
                        ops.push(
                            { 
                                insert: modification_locations[j][1], 
                                attributes: { 
                                    bold: true, 
                                    color: 'var(--primary-blue-11)'
                                }
                            }
                        );

                        k = k + modification_locations[j][1].length;
                        j++;
                    } else {
                        ops.push(
                            { 
                                insert: pastedContent.slice(k, modification_locations[j][0])
                            }
                        );

                        k = modification_locations[j][0];
                    }
                } while(j < modification_locations.length)

                if(k < pastedContent.length) {
                    ops.push(
                        { 
                            insert: pastedContent.slice(k, pastedContent.length)
                        }
                    );
                } 

                return new Delta(ops);
            }
        });
        quill.root.setAttribute("spellcheck", "false");

        quill.on('text-change', handleTextChange);
        quill.on('selection-change', handleSelectionChange);
        
        return () => {
            quill.off('text-change', handleTextChange);
            quill.off('selection-change', handleSelectionChange);
        };
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        const queryUsers = async () => {
            try {
                const query = await generalOpx.axiosInstance.put(`/users/search?q=${userQueryText}`, {}, {signal: controller.signal});
                if(query.data["status"] === "success") {
                    setTagOptionsList(query.data["data"]);
                }

            } catch(err) {}
        }

        if(userQueryText !== "") {
            queryUsers();
        } else {
            setTagOptionsList([]);
        }

        return () => {
            controller.abort();
        };
    }, [userQueryText]);
    useEffect(() => {
        const controller = new AbortController();

        const queryStocks = async () => {
            try {
                const query = await generalOpx.axiosInstance.put(`/stockDataFeed/search?q=${stockQueryText}`, {}, {signal: controller.signal});
                if(query.data["status"] === "success") {
                    setTagOptionsList(query.data["data"]);
                }

            } catch(err) {}
        }

        if(stockQueryText !== "") {
            queryStocks();
        } else {
            setTagOptionsList([]);
        }

        return () => {
            controller.abort();
        };
    }, [stockQueryText]);
    useEffect(() => {
        const controller = new AbortController();

        const queryCryptos = async () => {
            try {
                const query = await generalOpx.axiosInstance.put(`/cryptoDataFeed/search?q=${cryptoQueryText}`, {}, {signal: controller.signal});
                if(query.data["status"] === "success") {
                    setTagOptionsList(query.data["data"]);
                }

            } catch(err) {}
        }

        if(cryptoQueryText !== "") {
            queryCryptos();
        } else {
            setTagOptionsList([]);
        }

        return () => {
            controller.abort();
        };
    }, [cryptoQueryText]);

    const modules = {
        toolbar: false,
        history: {
            delay: 500,
            maxStack: 100,
            userOnly: true
        }
    };

    const formats = [
        "header", "font", "size", "bold", "italic",
        "underline", "align", "strike", "script", "blockquote",
        "background", "list", "bullet", "indent", "link", "image","video", "color", "code-block", "blueText", 'tagBold'
    ];

    const selectTaggedUser = (selection) => {
        const quill = quillRef.current?.getEditor();
        const cursorPosition = quill.getSelection()?.index;
        if(cursorPosition === undefined || cursorPosition === null) return;
      
        const textBeforeCursor = quill.getText(0, cursorPosition);
        const atSymbolIndex = textBeforeCursor.lastIndexOf('@');
        if(atSymbolIndex !== -1) {
            const match = /@([a-zA-Z0-9_.-]*)$/.exec(textBeforeCursor);
            
            if(match) {
                if(`${match[0].slice(1, match[0].length)}` === userQueryText) {
                    quill.deleteText(atSymbolIndex, match[0].length);
                    quill.insertText(atSymbolIndex, `@${selection}`);

                    quill.formatText(atSymbolIndex, `@${selection}`.length, 'bold', true);
                    quill.formatText(atSymbolIndex, `@${selection}`.length, 'color', 'var(--primary-blue-11)');

                    setUserQueryText("");
                    setTagOptionsList([]);
                }
            }
        }
    }
    const selectTaggedStock = (selection) => {
        const quill = quillRef.current?.getEditor();
        const cursorPosition = quill.getSelection()?.index;
        if(cursorPosition === undefined || cursorPosition === null) return;

        const textBeforeCursor = quill.getText(0, cursorPosition);
        const atSymbolIndex = textBeforeCursor.lastIndexOf('S:-');
        if(atSymbolIndex !== -1) {
            const match = /S:-[a-zA-Z]+$/.exec(textBeforeCursor);
            
            if(match) {
                if(`${match[0].slice(3, match[0].length)}` === stockQueryText) {
                    quill.deleteText(atSymbolIndex, match[0].length);
                    quill.insertText(atSymbolIndex, `S:-${selection}`);

                    quill.formatText(atSymbolIndex, `S:-${selection}`.length, 'bold', true);
                    quill.formatText(atSymbolIndex, `S:-${selection}`.length, 'color', 'var(--primary-blue-11)');

                    setUserQueryText("");
                    setTagOptionsList([]);
                }
            }
        }
    }
    const selectTaggedCrypto = (selection) => {
        const quill = quillRef.current?.getEditor();
        const cursorPosition = quill.getSelection()?.index;
        if(cursorPosition === undefined || cursorPosition === null) return;
      
        const textBeforeCursor = quill.getText(0, cursorPosition);
        const atSymbolIndex = textBeforeCursor.lastIndexOf('C:-');
        if(atSymbolIndex !== -1) {
            const match = /C:-[a-zA-Z]+$/.exec(textBeforeCursor);
            
            if(match) {
                if(`${match[0].slice(3, match[0].length)}` === cryptoQueryText) {
                    quill.deleteText(atSymbolIndex, match[0].length);
                    quill.insertText(atSymbolIndex, `C:-${selection}`);

                    quill.formatText(atSymbolIndex, `C:-${selection}`.length, 'bold', true);
                    quill.formatText(atSymbolIndex, `C:-${selection}`.length, 'color', 'var(--primary-blue-11)');

                    setUserQueryText("");
                    setTagOptionsList([]);
                }
            }
        }
    }

    const [uploadMedia, setUploadMedia] = useState([]);
    const [uploadMediaStatuses, setUploadMediaStatuses] = useState([]);
    const [uploadMediaFreezeOpt, setUploadMediaFreezeOpt] = useState(false);
    const photoUploadHandler = async (e) => {
        const mediaCount = uploadMedia.length;

        if(mediaCount < 4) {
            if(e.target.files[0] !== undefined) {
                setUploadMediaFreezeOpt(true);

                let promises = [];
                const availableCount = 4 - mediaCount;
                const fileCount = e.target.files.length;
                let uploadMediaFunction = [...uploadMedia], uploadMediaStatusesFunction = [...uploadMediaStatuses];

                let promisesLen = 0;
                fileCount <= availableCount ? promisesLen = fileCount : promisesLen = availableCount;
                for(let i = 0; i < promisesLen; i++) {
                    uploadMediaStatusesFunction[mediaCount + i] = "loading";
                    setUploadMediaStatuses(uploadMediaStatusesFunction);

                    if(e.target.files[i].size === 0) {
                        uploadMediaFunction[mediaCount + i] = ["an error has occured, please try again later", "photo"];
                    } else if(e.target.files[i].size / (1024 * 1024) > 5) {
                        uploadMediaFunction[mediaCount + i] = ["error - photo must be under 5MB", "photo"];
                    } else {
                        promises.push(
                            await generalOpx.axiosInstance.put(`/content/posts/upload`, {"type": "image"}).then(
                                async (response) => {
                                    if(response.data["status"] === "success") {
                                        await axios.put(response.data["data"], e.target.files[i], {headers: {"Content-Type": "image/jpeg"}});
                                        uploadMediaFunction[mediaCount + i] = [String(response.data["data"].split('?')[0]), "photo"];
                                    } else {
                                        uploadMediaFunction[mediaCount + i] = ["an error has occured, please try again later", "photo"];
                                    }
                                }
                            ).catch(
                                () => {
                                    uploadMediaFunction[mediaCount + i] = ["an error has occured, please try again later", "photo"];
                                }
                            )
                        )
                    }
                }

                if(promises.length > 0) {
                    await Promise.all(promises).then(
                        () => {
                            setUploadMedia(uploadMediaFunction);
                            setUploadMediaFreezeOpt(false);
                        }
                    )
                } else {
                    setUploadMedia(uploadMediaFunction);
                    setUploadMediaFreezeOpt(false);
                }
            }
        }
    }
    const uploadMediaRemoveHandler = (i) => {
        let uploadMediaFunction = [...uploadMedia], uploadMediaStatusesFunction = [...uploadMediaStatuses];
        uploadMediaFunction.splice(i, 1);
        uploadMediaStatusesFunction.splice(i, 1);

        setUploadMedia(uploadMediaFunction);
        setUploadMediaStatuses(uploadMediaStatusesFunction);
    }
    const videoUploadHandler = async (e) => {
        const mediaCount = uploadMedia.length;

        if(mediaCount < 4) {
            if(e.target.files[0] !== undefined) {
                setUploadMediaFreezeOpt(true);

                let promises = [];
                const availableCount = 4 - mediaCount;
                const fileCount = e.target.files.length;
                let uploadMediaFunction = [...uploadMedia], uploadMediaStatusesFunction = [...uploadMediaStatuses];

                let promisesLen = 0;
                fileCount <= availableCount ? promisesLen = fileCount : promisesLen = availableCount;
                for(let i = 0; i < promisesLen; i++) {
                    uploadMediaStatusesFunction[mediaCount + i] = "loading";
                    setUploadMediaStatuses(uploadMediaStatusesFunction);

                    if(e.target.files[i].size === 0) {
                        uploadMediaFunction[mediaCount + i] = ["an error has occured, please try again later", "video"];
                    } else if(e.target.files[i].size / (1024 * 1024) > 7) {
                        uploadMediaFunction[mediaCount + i] = ["error - video must be under 5MB", "video"];
                    } else {
                        promises.push(
                            await generalOpx.axiosInstance.put(`/content/posts/upload`, {"type": "video"}).then(
                                async (response) => {
                                    if(response.data["status"] === "success") {
                                        await axios.put(response.data["data"], e.target.files[i], {headers: {"Content-Type": "video/mp4"}});
                                        uploadMediaFunction[mediaCount + i] = [String(response.data["data"].split('?')[0]), "video"];
                                    } else {
                                        uploadMediaFunction[mediaCount + i] = ["an error has occured, please try again later", "video"];
                                    }
                                }
                            ).catch(
                                () => {
                                    uploadMediaFunction[mediaCount + i] = ["an error has occured, please try again later", "video"];
                                }
                            )
                        )
                    }
                }

                if(promises.length > 0) {
                    await Promise.all(promises).then(
                        () => {
                            setUploadMedia(uploadMediaFunction);
                            setUploadMediaFreezeOpt(false);
                        }
                    )
                } else {
                    setUploadMedia(uploadMediaFunction);
                    setUploadMediaFreezeOpt(false);
                }
            }
        }
    }

    const getInnerText = () => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(comment, 'text/html');

        return doc.body.textContent || "";
    }

    const commentDisplayToggle = (index) => {
        let commentsFunction = [...comments["data"]];
        comments["data"][index]["commentDisplay"] ? commentsFunction[index] = {
            ...comments["data"][index],
            "commentDisplay": false
        } :  commentsFunction[index] = {
            ...comments["data"][index],
            "commentDisplay": true
        };

        dispatch(
            updateComments(
                {
                    "data": commentsFunction,
                    "viewCount": comments["viewCount"],
                    "commentExpandLoading": comments["commentExpandLoading"]
                }
            )
        );
    }

    const [readOnlyState, setReadOnlyState] = useState(false);
    const [submissionError, setSubmissionError] = useState(false);
    const submitComment = async (input) => {
        setReadOnlyState(true);
        setUploadMediaFreezeOpt(true);

        const quill = quillRef.current?.getEditor();
        if(quill.getLength() >= 4) {
            let modification_locations = [];
            const quillText = quill.getText(0, quill.getLength());
            
            const l_rx = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
            const link_matches = quillText.match(l_rx);
            const link_matches_unique = [...new Set(link_matches)];

            for(let l = 0; l < link_matches_unique.length; l++) {
                const modIndex = locations(link_matches_unique[l], quillText);
                for(let l_m = 0; l_m < modIndex.length; l_m++) {
                    modification_locations.push([modIndex[l_m], link_matches_unique[l], "link"]);
                }
            }

            const u_rx = /@[a-zA-Z0-9_.-]+/g;
            const user_matches = quillText.match(u_rx);
            const user_matches_unique = [...new Set(user_matches)];

            for(let u = 0; u < user_matches_unique.length; u++) {
                const modIndex = locations(user_matches_unique[u], quillText);
                for(let u_m = 0; u_m < modIndex.length; u_m++) {
                    modification_locations.push([modIndex[u_m], user_matches_unique[u], "user"]);
                }
            }

            const s_rx = /S:-[a-zA-Z]+/g;
            const stock_matches = quillText.match(s_rx);
            const stock_matches_unique = [...new Set(stock_matches)];

            for(let s = 0; s < stock_matches_unique.length; s++) {
                const modIndex = locations(stock_matches_unique[s], quillText);
                for(let s_m = 0; s_m < modIndex.length; s_m++) {
                    modification_locations.push([modIndex[s_m], stock_matches_unique[s], "stock"]);
                }
            }

            const c_rx = /C:-[a-zA-Z]+/g;
            const crypto_matches = quillText.match(c_rx);
            const crypto_matches_unique = [...new Set(crypto_matches)];

            for(let c = 0; c < crypto_matches_unique.length; c++) {
                const modIndex = locations(crypto_matches_unique[c], quillText);
                for(let c_m = 0; c_m < modIndex.length; c_m++) {
                    modification_locations.push([modIndex[c_m], crypto_matches_unique[c], "crypto"]);
                }
            }

            const h_rx = /#[a-zA-Z]+/g;
            const hashtag_matches = quillText.match(h_rx);
            const hashtag_matches_unique = [...new Set(hashtag_matches)];

            for(let h = 0; h < hashtag_matches_unique.length; h++) {
                const modIndex = locations(hashtag_matches_unique[h], quillText);
                for(let h_m = 0; h_m < modIndex.length; h_m++) {
                    modification_locations.push([modIndex[h_m], hashtag_matches_unique[h], "hash"]);
                }
            }
            
            if(modification_locations.length > 0) {
                let j = 0;
                let k = 0;
                modification_locations = modification_locations.sort((a, b) => a[0] - b[0]);
                
                do {
                    if(k === modification_locations[j][0]) {
                        if(modification_locations[j][2] === "link") {
                            quill.formatText(k, modification_locations[j][1].length, 'link', `${modification_locations[j][1]}`);
                        } else if(modification_locations[j][2] === "user") {
                            quill.formatText(k, modification_locations[j][1].length, 'link', `https://finulab.com/profile/${modification_locations[j][1].slice(1, modification_locations[j][1].length)}`);
                        } else if(modification_locations[j][2] === "stock") {
                            quill.formatText(k, modification_locations[j][1].length, 'link', `https://finulab.com/stocks/${modification_locations[j][1]}`);
                        } else if(modification_locations[j][2] === "crypto") {
                            quill.formatText(k, modification_locations[j][1].length, 'link', `https://finulab.com/cryptos/${modification_locations[j][1]}`);
                        }

                        k = k + modification_locations[j][1].length;
                        j++;
                    } else {
                        k = modification_locations[j][0];
                    }
                } while(j < modification_locations.length)
            }
        }

        const now = new Date();
        const nowUnix = getUnixTime(now);
        const sanitizedComment = DOMPurify.sanitize(quill.root.innerHTML);
        const photos = uploadMedia.filter(doc => doc[0].slice(0, 5) === "https" && doc[1] === "photo");
        const videos = uploadMedia.filter(doc => doc[0].slice(0, 5) === "https" && doc[1] === "video");

        if(props.commFor === "post") {
            await postCommentFunct(photos, videos, sanitizedComment, nowUnix);
        } else if(props.commFor === "prediction") {
            await predictionCommentFunct(photos, videos, sanitizedComment, nowUnix);
        } else if(props.commFor === "news") {
            await newsCommentFunct(photos, videos, sanitizedComment, nowUnix);
        }
        
        /* tag notification w/types (comment, post (*in future article)) */

        setReadOnlyState(false);
    }

    const postCommentFunct = async (photos, videos, sanitizedComment, nowUnix) => {
        if(props.type === "main") {
            await generalOpx.axiosInstance.post(`/content/posts/create-main-comment`, 
                {
                    "photos": photos,
                    "videos": videos,
                    "postId": props.desc.postId,
                    "groupId": props.desc.groupId,
                    "comment": sanitizedComment
                }
            ).then(
                (response) => {
                    if(response.data["status"] === "success") {
                        let commentData = {
                            "type": "comment", 
                            "l0": false, "l1": false, "l2": false, "l3": false,
                            "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false,
                            "value": {
                                _id: response.data["data"],
                                username: user.user,
                                profileImage: user.profilePicture,
                                groupId: props.desc.groupId,
                                postId: props.desc.postId,
                                index: 0,
                                limit: 0,
                                comment: sanitizedComment,
                                photos: photos,
                                videos: videos,
                                language: "",
                                translation: "",
                                likes: 0,
                                dislikes: 0,
                                views: 0,
                                comments: 0,
                                reposts: 0,
                                shares: 0,
                                confidenceScore: 0,
                                userRewards: 0,
                                communityRewards: 0,
                                status: "active",
                                flair: [],
                                timeStamp: nowUnix
                            }
                        };
                        let commentsFunction = [
                            commentData,
                            ...comments["data"]
                        ];

                        dispatch(
                            setComments(
                                {
                                    "_id": comments["_id"],
                                    "type": "post",
                                    "data": commentsFunction,
                                    "viewCount": comments["viewCount"] + 1,
                                    "dataCount": comments["dataCount"] + 1,
                                    "dataLoading": comments["dataLoading"],
                                    "commentExpandLoading": comments["commentExpandLoading"]
                                }
                            )
                        );

                        setComment("");
                        setUploadMedia([]);
                        setUploadMediaStatuses([]);
                        setUploadMediaFreezeOpt(false);
                    } else {
                        setSubmissionError(true);
                        setTimeout(() => 
                            {
                                setSubmissionError(false);
                            }, 2000
                        );
                    }
                }
            ).catch(
                () => {
                    setSubmissionError(true);
                    setTimeout(() => 
                        {
                            setSubmissionError(false);
                        }, 2000
                    );
                }
            );
        } else if(props.type === "secondary") {
            await generalOpx.axiosInstance.post(`/content/posts/create-secondary-comment`, 
                {
                    "index": props.desc.commentIndex,
                    "photos": photos,
                    "videos": videos,
                    "postId": props.desc.postId,
                    "groupId": props.desc.groupId,
                    "comment": sanitizedComment,
                    "commentId": props.desc.commentId,
                    "mainCommentId": props.desc.mainCommentId
                }
            ).then(
                (response) => {
                    if(response.data["status"] === "success") {
                        let commentLinePrior = {}, commentLineCurrent = {};
                        if(props.desc.commentIndex === 1) {
                            commentLinePrior = {"l0": true, "l1": false, "l2": false, "l3": false};

                            if(comments["data"][props.desc.index + 1] === undefined || comments["data"][props.desc.index + 1] === null) {
                                commentLineCurrent = {"l0": false, "l1": false, "l2": false, "l3": false};
                            } else {
                                if(
                                    comments["data"][props.desc.index + 1]["type"] === "expand"
                                    && comments["data"][props.desc.index + 1]["index"] >= props.desc.commentIndex
                                ) {
                                    commentLineCurrent = {"l0": true, "l1": false, "l2": false, "l3": false};
                                } else if(
                                    comments["data"][props.desc.index + 1]["type"] === "comment"
                                    && comments["data"][props.desc.index + 1]["value"]["index"] >= props.desc.commentIndex
                                ) {
                                    commentLineCurrent = {"l0": true, "l1": false, "l2": false, "l3": false};
                                } else {
                                    commentLineCurrent = {"l0": false, "l1": false, "l2": false, "l3": false};
                                }
                            }
                        } else if(props.desc.commentIndex === 2) {
                            commentLinePrior = {
                                "l0": comments["data"][props.desc.index]["l0"], 
                                "l1": true, "l2": false, "l3": false
                            };

                            if(comments["data"][props.desc.index + 1] === undefined || comments["data"][props.desc.index + 1] === null) {
                                commentLineCurrent = {
                                    "l0": comments["data"][props.desc.index]["l0"], 
                                    "l1": false, "l2": false, "l3": false
                                };
                            } else {
                                if(
                                    comments["data"][props.desc.index + 1]["type"] === "expand"
                                    && comments["data"][props.desc.index + 1]["index"] >= props.desc.commentIndex
                                ) {
                                    commentLineCurrent = {
                                        "l0": comments["data"][props.desc.index]["l0"],
                                        "l1": true, "l2": false, "l3": false
                                    };
                                } else if(
                                    comments["data"][props.desc.index + 1]["type"] === "comment"
                                    && comments["data"][props.desc.index + 1]["value"]["index"] >= props.desc.commentIndex
                                ) {
                                    commentLineCurrent = {
                                        "l0": comments["data"][props.desc.index]["l0"], 
                                        "l1": true, "l2": false, "l3": false
                                    };
                                } else {
                                    commentLineCurrent = {
                                        "l0": comments["data"][props.desc.index]["l0"], 
                                        "l1": false, "l2": false, "l3": false
                                    };
                                }
                            }
                        } else if(props.desc.commentIndex === 3) {
                            commentLinePrior = {
                                "l0": comments["data"][props.desc.index]["l0"], 
                                "l1": comments["data"][props.desc.index]["l1"], 
                                "l2": true, "l3": false
                            };

                            if(comments["data"][props.desc.index + 1] === undefined || comments["data"][props.desc.index + 1] === null) {
                                commentLineCurrent = {
                                    "l0": comments["data"][props.desc.index]["l0"], 
                                    "l1": comments["data"][props.desc.index]["l1"], 
                                    "l2": false, "l3": false
                                };
                            } else {
                                if(
                                    comments["data"][props.desc.index + 1]["type"] === "expand"
                                    && comments["data"][props.desc.index + 1]["index"] >= props.desc.commentIndex
                                ) {
                                    commentLineCurrent = {
                                        "l0": comments["data"][props.desc.index]["l0"],
                                        "l1": comments["data"][props.desc.index]["l1"], 
                                        "l2": true, "l3": false
                                    };
                                } else if(
                                    comments["data"][props.desc.index + 1]["type"] === "comment"
                                    && comments["data"][props.desc.index + 1]["value"]["index"] >= props.desc.commentIndex
                                ) {
                                    commentLineCurrent = {
                                        "l0": comments["data"][props.desc.index]["l0"], 
                                        "l1": comments["data"][props.desc.index]["l1"], 
                                        "l2": true, "l3": false
                                    };
                                } else {
                                    commentLineCurrent = {
                                        "l0": comments["data"][props.desc.index]["l0"], 
                                        "l1": comments["data"][props.desc.index]["l1"], 
                                        "l2": false, "l3": false
                                    };
                                }
                            }
                        }

                        let commentData = {
                            "type": "comment", 
                            ...commentLineCurrent,
                            "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false,
                            "value": {
                                _id: response.data["data"],
                                username: user.user,
                                profileImage: user.profilePicture,
                                groupId: props.desc.groupId,
                                postId: props.desc.postId,
                                index: props.desc.commentIndex,
                                comment: sanitizedComment,
                                photos: photos,
                                videos: videos,
                                mainCommentId: props.desc.mainCommentId,
                                commentId: props.desc.commentId,
                                language: "",
                                translation: "",
                                likes: 0,
                                dislikes: 0,
                                views: 0,
                                comments: 0,
                                reposts: 0,
                                shares: 0,
                                confidenceScore: 0,
                                userRewards: 0,
                                communityRewards: 0,
                                status: "active",
                                flair: [],
                                timeStamp: nowUnix
                            }
                        };
                        let commentsFunction = [
                            ...comments["data"].slice(0, props.desc.index),
                            {...comments["data"][props.desc.index], ...commentLinePrior, "commentDisplay": false},
                            commentData,
                            ...comments["data"].slice(props.desc.index + 1, comments["data"].length)
                        ];

                        dispatch(
                            updateComments(
                                {
                                    "data": commentsFunction,
                                    "viewCount": comments["viewCount"],
                                    "commentExpandLoading": comments["commentExpandLoading"]
                                }
                            )
                        );

                        setComment("");
                        setUploadMedia([]);
                        setUploadMediaStatuses([]);
                        setUploadMediaFreezeOpt(false);
                    } else {
                        setSubmissionError(true);
                        setTimeout(() => 
                            {
                                setSubmissionError(false);
                            }, 2000
                        );
                    }
                }
            ).catch(
                () => {
                    setSubmissionError(true);
                    setTimeout(() => 
                        {
                            setSubmissionError(false);
                        }, 2000
                    );
                }
            );
        }

        if(props.location === "stockPage" || props.location === "stockPage-selection") {
            let posts = [...stockPosts["posts"]["data"]];
            if(posts.length > 0) {
                if(posts.some(pst => pst._id === props.desc.postId)) {
                    let postCopy = {...posts.filter(pst => pst._id === props.desc.postId)[0]};
                    postCopy["comments"] = postCopy["comments"] + 1;

                    const copyIndex = posts.findIndex(pst => pst._id === props.desc.postId);
                    posts[copyIndex] = postCopy;
                    dispatch(
                        updateStockPosts(
                            {
                                "data": posts,
                                "dataCount": stockPosts["posts"]["dataCount"],
                                "dataLoading": stockPosts["posts"]["dataLoading"]
                            }
                        )
                    );
                }
            }

            if(stockSelection["selection"]["type"] === "Post") {
                if(stockSelection["selection"]["selectedDesc"]["desc"]["_id"] === props.desc.postId) {
                    let selectionCopy = {...stockSelection["selection"]["selectedDesc"]["desc"]};
                    selectionCopy["comments"] = selectionCopy["comments"] + 1;

                    dispatch(
                        setStockPageSelection(
                            {
                                "type": "Post",
                                "selectedDesc": {
                                    "desc": selectionCopy
                                }
                            }
                        )
                    );
                }
            }
        }
    }

    const predictionCommentFunct = async (photos, videos, sanitizedComment, nowUnix) => {
        if(props.type === "main") {
            await generalOpx.axiosInstance.post(`/market/create-main-comment`, 
                {
                    "photos": photos,
                    "videos": videos,
                    "predictionId": props.desc.predictionId,
                    "predType": props.desc.predType,
                    "groupId": props.desc.groupId,
                    "comment": sanitizedComment
                }
            ).then(
                (response) => {
                    if(response.data["status"] === "success") {
                        let commentData = {
                            "type": "comment", 
                            "l0": false, "l1": false, "l2": false, "l3": false,
                            "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false,
                            "value": {
                                _id: response.data["data"],
                                username: user.user,
                                profileImage: user.profilePicture,
                                groupId: props.desc.groupId,
                                predictionId: props.desc.predictionId,
                                predictionType: props.desc.predType,
                                index: 0,
                                limit: 0,
                                comment: sanitizedComment,
                                photos: photos,
                                videos: videos,
                                language: "",
                                translation: "",
                                likes: 0,
                                dislikes: 0,
                                views: 0,
                                comments: 0,
                                reposts: 0,
                                shares: 0,
                                confidenceScore: 0,
                                userRewards: 0,
                                communityRewards: 0,
                                status: "active",
                                flair: [],
                                timeStamp: nowUnix
                            }
                        };
                        let commentsFunction = [
                            commentData,
                            ...comments["data"]
                        ];

                        dispatch(
                            setComments(
                                {
                                    "_id": comments["_id"],
                                    "type": "prediction",
                                    "data": commentsFunction,
                                    "viewCount": comments["viewCount"] + 1,
                                    "dataCount": comments["dataCount"] + 1,
                                    "dataLoading": comments["dataLoading"],
                                    "commentExpandLoading": comments["commentExpandLoading"]
                                }
                            )
                        );

                        setComment("");
                        setUploadMedia([]);
                        setUploadMediaStatuses([]);
                        setUploadMediaFreezeOpt(false);
                    } else {
                        setSubmissionError(true);
                        setTimeout(() => 
                            {
                                setSubmissionError(false);
                            }, 2000
                        );
                    }
                }
            ).catch(
                () => {
                    setSubmissionError(true);
                    setTimeout(() => 
                        {
                            setSubmissionError(false);
                        }, 2000
                    );
                }
            );
        } else if(props.type === "secondary") {
            await generalOpx.axiosInstance.post(`/market/create-secondary-comment`, 
                {
                    "index": props.desc.commentIndex,
                    "photos": photos,
                    "videos": videos,
                    "predictionId": props.desc.predictionId,
                    "predType": props.desc.predType,
                    "groupId": props.desc.groupId,
                    "comment": sanitizedComment,
                    "commentId": props.desc.commentId,
                    "mainCommentId": props.desc.mainCommentId
                }
            ).then(
                (response) => {
                    if(response.data["status"] === "success") {
                        let commentLinePrior = {}, commentLineCurrent = {};
                        if(props.desc.commentIndex === 1) {
                            commentLinePrior = {"l0": true, "l1": false, "l2": false, "l3": false};

                            if(comments["data"][props.desc.index + 1] === undefined || comments["data"][props.desc.index + 1] === null) {
                                commentLineCurrent = {"l0": false, "l1": false, "l2": false, "l3": false};
                            } else {
                                if(
                                    comments["data"][props.desc.index + 1]["type"] === "expand"
                                    && comments["data"][props.desc.index + 1]["index"] >= props.desc.commentIndex
                                ) {
                                    commentLineCurrent = {"l0": true, "l1": false, "l2": false, "l3": false};
                                } else if(
                                    comments["data"][props.desc.index + 1]["type"] === "comment"
                                    && comments["data"][props.desc.index + 1]["value"]["index"] >= props.desc.commentIndex
                                ) {
                                    commentLineCurrent = {"l0": true, "l1": false, "l2": false, "l3": false};
                                } else {
                                    commentLineCurrent = {"l0": false, "l1": false, "l2": false, "l3": false};
                                }
                            }
                        } else if(props.desc.commentIndex === 2) {
                            commentLinePrior = {
                                "l0": comments["data"][props.desc.index]["l0"], 
                                "l1": true, "l2": false, "l3": false
                            };

                            if(comments["data"][props.desc.index + 1] === undefined || comments["data"][props.desc.index + 1] === null) {
                                commentLineCurrent = {
                                    "l0": comments["data"][props.desc.index]["l0"], 
                                    "l1": false, "l2": false, "l3": false
                                };
                            } else {
                                if(
                                    comments["data"][props.desc.index + 1]["type"] === "expand"
                                    && comments["data"][props.desc.index + 1]["index"] >= props.desc.commentIndex
                                ) {
                                    commentLineCurrent = {
                                        "l0": comments["data"][props.desc.index]["l0"],
                                        "l1": true, "l2": false, "l3": false
                                    };
                                } else if(
                                    comments["data"][props.desc.index + 1]["type"] === "comment"
                                    && comments["data"][props.desc.index + 1]["value"]["index"] >= props.desc.commentIndex
                                ) {
                                    commentLineCurrent = {
                                        "l0": comments["data"][props.desc.index]["l0"], 
                                        "l1": true, "l2": false, "l3": false
                                    };
                                } else {
                                    commentLineCurrent = {
                                        "l0": comments["data"][props.desc.index]["l0"], 
                                        "l1": false, "l2": false, "l3": false
                                    };
                                }
                            }
                        } else if(props.desc.commentIndex === 3) {
                            commentLinePrior = {
                                "l0": comments["data"][props.desc.index]["l0"], 
                                "l1": comments["data"][props.desc.index]["l1"], 
                                "l2": true, "l3": false
                            };

                            if(comments["data"][props.desc.index + 1] === undefined || comments["data"][props.desc.index + 1] === null) {
                                commentLineCurrent = {
                                    "l0": comments["data"][props.desc.index]["l0"], 
                                    "l1": comments["data"][props.desc.index]["l1"], 
                                    "l2": false, "l3": false
                                };
                            } else {
                                if(
                                    comments["data"][props.desc.index + 1]["type"] === "expand"
                                    && comments["data"][props.desc.index + 1]["index"] >= props.desc.commentIndex
                                ) {
                                    commentLineCurrent = {
                                        "l0": comments["data"][props.desc.index]["l0"],
                                        "l1": comments["data"][props.desc.index]["l1"], 
                                        "l2": true, "l3": false
                                    };
                                } else if(
                                    comments["data"][props.desc.index + 1]["type"] === "comment"
                                    && comments["data"][props.desc.index + 1]["value"]["index"] >= props.desc.commentIndex
                                ) {
                                    commentLineCurrent = {
                                        "l0": comments["data"][props.desc.index]["l0"], 
                                        "l1": comments["data"][props.desc.index]["l1"], 
                                        "l2": true, "l3": false
                                    };
                                } else {
                                    commentLineCurrent = {
                                        "l0": comments["data"][props.desc.index]["l0"], 
                                        "l1": comments["data"][props.desc.index]["l1"], 
                                        "l2": false, "l3": false
                                    };
                                }
                            }
                        }

                        let commentData = {
                            "type": "comment", 
                            ...commentLineCurrent,
                            "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false,
                            "value": {
                                _id: response.data["data"],
                                username: user.user,
                                profileImage: user.profilePicture,
                                groupId: props.desc.groupId,
                                predictionId: props.desc.predictionId,
                                predictionType: props.desc.predType,
                                index: props.desc.commentIndex,
                                comment: sanitizedComment,
                                photos: photos,
                                videos: videos,
                                mainCommentId: props.desc.mainCommentId,
                                commentId: props.desc.commentId,
                                language: "",
                                translation: "",
                                likes: 0,
                                dislikes: 0,
                                views: 0,
                                comments: 0,
                                reposts: 0,
                                shares: 0,
                                confidenceScore: 0,
                                userRewards: 0,
                                communityRewards: 0,
                                status: "active",
                                flair: [],
                                timeStamp: nowUnix
                            }
                        };
                        let commentsFunction = [
                            ...comments["data"].slice(0, props.desc.index),
                            {...comments["data"][props.desc.index], ...commentLinePrior, "commentDisplay": false},
                            commentData,
                            ...comments["data"].slice(props.desc.index + 1, comments["data"].length)
                        ];

                        dispatch(
                            updateComments(
                                {
                                    "data": commentsFunction,
                                    "viewCount": comments["viewCount"],
                                    "commentExpandLoading": comments["commentExpandLoading"]
                                }
                            )
                        );

                        setComment("");
                        setUploadMedia([]);
                        setUploadMediaStatuses([]);
                        setUploadMediaFreezeOpt(false);
                    } else {
                        setSubmissionError(true);
                        setTimeout(() => 
                            {
                                setSubmissionError(false);
                            }, 2000
                        );
                    }
                }
            ).catch(
                () => {
                    setSubmissionError(true);
                    setTimeout(() => 
                        {
                            setSubmissionError(false);
                        }, 2000
                    );
                }
            );
        }

        if(props.location === "stockPage" || props.location === "dashboard") {
            let predictionsStockPage = [...stockPredictions["markets"]["predictions"]],
                predictionsDashboard = [...dashboardPredictions["markets"]["predictions"]];
            
            if(predictionsStockPage.length > 0) {
                if(predictionsStockPage.some(pred => pred._id === props.desc.predictionId)) {
                    let predictionCopy = {...predictionsStockPage.filter(pred => pred._id === props.desc.predictionId)[0]};
                    predictionCopy["comments"] = predictionCopy["comments"] + 1;

                    const copyIndex = predictionsStockPage.findIndex(pred => pred._id === props.desc.predictionId);
                    predictionsStockPage[copyIndex] = predictionCopy;

                    dispatch(
                        updateStockPredictions(
                            {
                                "predictions": predictionsStockPage,
                                "data": stockPredictions["markets"]["data"],
                                "liveCount": stockPredictions["markets"]["liveCount"],
                                "dataLoading": stockPredictions["markets"]["dataLoading"]
                            }
                        )
                    );
                }
            }

            if(predictionsDashboard.length > 0) {
                if(predictionsDashboard.some(pred => pred._id === props.desc.predictionId)) {
                    let predictionCopy = {...predictionsDashboard.filter(pred => pred._id === props.desc.predictionId)[0]};
                    predictionCopy["comments"] = predictionCopy["comments"] + 1;

                    const copyIndex = predictionsDashboard.findIndex(pred => pred._id === props.desc.predictionId);
                    predictionsDashboard[copyIndex] = predictionCopy;

                    dispatch(
                        updateStockDashboardMarkets(
                            {
                                "predictions": predictionsDashboard,
                                "data": dashboardPredictions["markets"]["data"],
                                "liveCount": dashboardPredictions["markets"]["liveCount"],
                                "dataLoading": dashboardPredictions["markets"]["dataLoading"]
                            }
                        )
                    );
                }
            }

            if(stockSelection["selection"]["type"] === "Prediction") {
                if(stockSelection["selection"]["selectedDesc"]["prediction"]["_id"] === props.desc.predictionId) {
                    let stockSelectionCopy = {...stockSelection["selection"]["selectedDesc"]["prediction"]};
                    stockSelectionCopy["comments"] = stockSelectionCopy["comments"] + 1;

                    dispatch(
                        setStockPageSelection(
                            {
                                "type": "Prediction",
                                "selectedDesc": {
                                    "prediction": stockSelectionCopy,
                                    "markets": stockSelection["selection"]["selectedDesc"]["markets"]
                                }
                            }
                        )
                    );
                }
            }

            if(dashboardPredictions["selected"]["type"] === "Prediction") {
                if(dashboardPredictions["selected"]["selectedDesc"]["prediction"]["_id"] === props.desc.predictionId) {
                    let dashboardSelectionCopy = {...dashboardPredictions["selected"]["selectedDesc"]["prediction"]};
                    dashboardSelectionCopy["comments"] = dashboardSelectionCopy["comments"] + 1;

                    dispatch(
                        setStockDashboardMarketsSelected(
                            {
                                "type": "Prediction",
                                "scrollTop": dashboardPredictions["selected"]["scrollTop"],
                                "selectedDesc": {
                                    "prediction": dashboardSelectionCopy,
                                    "markets": dashboardPredictions["selected"]["selectedDesc"]["markets"]
                                }
                            }
                        )
                    );
                }
            }
        }
    }

    const newsCommentFunct = async (photos, videos, sanitizedComment, nowUnix) => {
        if(props.type === "main") {
            await generalOpx.axiosInstance.post(`/content/news/create-main-comment`, 
                {
                    "photos": photos,
                    "videos": videos,
                    "newsId": props.desc.newsId,
                    "comment": sanitizedComment
                }
            ).then(
                (response) => {
                    if(response.data["status"] === "success") {
                        let commentData = {
                            "type": "comment", 
                            "l0": false, "l1": false, "l2": false, "l3": false,
                            "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false,
                            "value": {
                                _id: response.data["data"],
                                username: user.user,
                                profileImage: user.profilePicture,
                                newsId: props.desc.newsId,
                                index: 0,
                                limit: 0,
                                comment: sanitizedComment,
                                photos: photos,
                                videos: videos,
                                language: "",
                                translation: "",
                                likes: 0,
                                dislikes: 0,
                                views: 0,
                                comments: 0,
                                reposts: 0,
                                shares: 0,
                                confidenceScore: 0,
                                userRewards: 0,
                                status: "active",
                                flair: [],
                                timeStamp: nowUnix
                            }
                        };
                        let commentsFunction = [
                            commentData,
                            ...comments["data"]
                        ];

                        dispatch(
                            setComments(
                                {
                                    "_id": comments["_id"],
                                    "type": "news",
                                    "data": commentsFunction,
                                    "viewCount": comments["viewCount"] + 1,
                                    "dataCount": comments["dataCount"] + 1,
                                    "dataLoading": comments["dataLoading"],
                                    "commentExpandLoading": comments["commentExpandLoading"]
                                }
                            )
                        );

                        setComment("");
                        setUploadMedia([]);
                        setUploadMediaStatuses([]);
                        setUploadMediaFreezeOpt(false);
                    } else {
                        setSubmissionError(true);
                        setTimeout(() => 
                            {
                                setSubmissionError(false);
                            }, 2000
                        );
                    }
                }
            ).catch(
                () => {
                    setSubmissionError(true);
                    setTimeout(() => 
                        {
                            setSubmissionError(false);
                        }, 2000
                    );
                }
            );
        } else if(props.type === "secondary") {
            await generalOpx.axiosInstance.post(`/content/news/create-secondary-comment`, 
                {
                    "index": props.desc.commentIndex,
                    "photos": photos,
                    "videos": videos,
                    "newsId": props.desc.newsId,
                    "comment": sanitizedComment,
                    "commentId": props.desc.commentId,
                    "mainCommentId": props.desc.mainCommentId
                }
            ).then(
                (response) => {
                    if(response.data["status"] === "success") {
                        let commentLinePrior = {}, commentLineCurrent = {};
                        if(props.desc.commentIndex === 1) {
                            commentLinePrior = {"l0": true, "l1": false, "l2": false, "l3": false};

                            if(comments["data"][props.desc.index + 1] === undefined || comments["data"][props.desc.index + 1] === null) {
                                commentLineCurrent = {"l0": false, "l1": false, "l2": false, "l3": false};
                            } else {
                                if(
                                    comments["data"][props.desc.index + 1]["type"] === "expand"
                                    && comments["data"][props.desc.index + 1]["index"] >= props.desc.commentIndex
                                ) {
                                    commentLineCurrent = {"l0": true, "l1": false, "l2": false, "l3": false};
                                } else if(
                                    comments["data"][props.desc.index + 1]["type"] === "comment"
                                    && comments["data"][props.desc.index + 1]["value"]["index"] >= props.desc.commentIndex
                                ) {
                                    commentLineCurrent = {"l0": true, "l1": false, "l2": false, "l3": false};
                                } else {
                                    commentLineCurrent = {"l0": false, "l1": false, "l2": false, "l3": false};
                                }
                            }
                        } else if(props.desc.commentIndex === 2) {
                            commentLinePrior = {
                                "l0": comments["data"][props.desc.index]["l0"], 
                                "l1": true, "l2": false, "l3": false
                            };

                            if(comments["data"][props.desc.index + 1] === undefined || comments["data"][props.desc.index + 1] === null) {
                                commentLineCurrent = {
                                    "l0": comments["data"][props.desc.index]["l0"], 
                                    "l1": false, "l2": false, "l3": false
                                };
                            } else {
                                if(
                                    comments["data"][props.desc.index + 1]["type"] === "expand"
                                    && comments["data"][props.desc.index + 1]["index"] >= props.desc.commentIndex
                                ) {
                                    commentLineCurrent = {
                                        "l0": comments["data"][props.desc.index]["l0"],
                                        "l1": true, "l2": false, "l3": false
                                    };
                                } else if(
                                    comments["data"][props.desc.index + 1]["type"] === "comment"
                                    && comments["data"][props.desc.index + 1]["value"]["index"] >= props.desc.commentIndex
                                ) {
                                    commentLineCurrent = {
                                        "l0": comments["data"][props.desc.index]["l0"], 
                                        "l1": true, "l2": false, "l3": false
                                    };
                                } else {
                                    commentLineCurrent = {
                                        "l0": comments["data"][props.desc.index]["l0"], 
                                        "l1": false, "l2": false, "l3": false
                                    };
                                }
                            }
                        } else if(props.desc.commentIndex === 3) {
                            commentLinePrior = {
                                "l0": comments["data"][props.desc.index]["l0"], 
                                "l1": comments["data"][props.desc.index]["l1"], 
                                "l2": true, "l3": false
                            };

                            if(comments["data"][props.desc.index + 1] === undefined || comments["data"][props.desc.index + 1] === null) {
                                commentLineCurrent = {
                                    "l0": comments["data"][props.desc.index]["l0"], 
                                    "l1": comments["data"][props.desc.index]["l1"], 
                                    "l2": false, "l3": false
                                };
                            } else {
                                if(
                                    comments["data"][props.desc.index + 1]["type"] === "expand"
                                    && comments["data"][props.desc.index + 1]["index"] >= props.desc.commentIndex
                                ) {
                                    commentLineCurrent = {
                                        "l0": comments["data"][props.desc.index]["l0"],
                                        "l1": comments["data"][props.desc.index]["l1"], 
                                        "l2": true, "l3": false
                                    };
                                } else if(
                                    comments["data"][props.desc.index + 1]["type"] === "comment"
                                    && comments["data"][props.desc.index + 1]["value"]["index"] >= props.desc.commentIndex
                                ) {
                                    commentLineCurrent = {
                                        "l0": comments["data"][props.desc.index]["l0"], 
                                        "l1": comments["data"][props.desc.index]["l1"], 
                                        "l2": true, "l3": false
                                    };
                                } else {
                                    commentLineCurrent = {
                                        "l0": comments["data"][props.desc.index]["l0"], 
                                        "l1": comments["data"][props.desc.index]["l1"], 
                                        "l2": false, "l3": false
                                    };
                                }
                            }
                        }

                        let commentData = {
                            "type": "comment", 
                            ...commentLineCurrent,
                            "display": true, "commentDisplay": false, "deleteDisplay": false, "deleteStatus": 0, "commentTruncated": false,
                            "value": {
                                _id: response.data["data"],
                                username: user.user,
                                profileImage: user.profilePicture,
                                newsId: props.desc.newsId,
                                index: props.desc.commentIndex,
                                comment: sanitizedComment,
                                photos: photos,
                                videos: videos,
                                language: "",
                                translation: "",
                                mainCommentId: props.desc.mainCommentId,
                                commentId: props.desc.commentId,
                                likes: 0,
                                dislikes: 0,
                                views: 0,
                                comments: 0,
                                reposts: 0,
                                shares: 0,
                                confidenceScore: 0,
                                userRewards: 0,
                                status: "active",
                                flair: [],
                                timeStamp: nowUnix
                            }
                        };
                        let commentsFunction = [
                            ...comments["data"].slice(0, props.desc.index),
                            {...comments["data"][props.desc.index], ...commentLinePrior, "commentDisplay": false},
                            commentData,
                            ...comments["data"].slice(props.desc.index + 1, comments["data"].length)
                        ];

                        dispatch(
                            updateComments(
                                {
                                    "data": commentsFunction,
                                    "viewCount": comments["viewCount"],
                                    "commentExpandLoading": comments["commentExpandLoading"]
                                }
                            )
                        );

                        setComment("");
                        setUploadMedia([]);
                        setUploadMediaStatuses([]);
                        setUploadMediaFreezeOpt(false);
                    } else {
                        setSubmissionError(true);
                        setTimeout(() => 
                            {
                                setSubmissionError(false);
                            }, 2000
                        );
                    }
                }
            ).catch(
                () => {
                    setSubmissionError(true);
                    setTimeout(() => 
                        {
                            setSubmissionError(false);
                        }, 2000
                    );
                }
            );
        }

        if(props.location === "stock_dashboardPage" || props.location === "stockPage") {
            let newsStockPage = [...stockNews["news"]["data"].flatMap(arr => arr.map(obj => obj))], 
                newsDashboard = [...dashboardNews["news"]["data"].flatMap(arr => arr.map(obj => obj))];

            if(newsStockPage.length > 0) {
                if(newsStockPage.some(nws => `${props.desc.newsId.slice(0, 1)}:-${nws._id}` === props.desc.newsId)) {
                    let newsCopy = {...newsStockPage.filter(nws => `${props.desc.newsId.slice(0, 1)}:-${nws._id}` === props.desc.newsId)[0]};
                    newsCopy["comments"] = newsCopy["comments"] + 1;

                    const copyIndex = newsStockPage.findIndex(nws => `${props.desc.newsId.slice(0, 1)}:-${nws._id}` === props.desc.newsId);
                    newsStockPage[copyIndex] = newsCopy;

                    dispatch(
                        updateStockNews(
                            {
                                "data": chunkArray(newsStockPage, 4), "dataLoading": stockNews["news"]["dataLoading"]
                            }
                        )
                    );
                }
            }

            if(newsDashboard.length > 0) {
                if(newsDashboard.some(nws => `${props.desc.newsId.slice(0, 1)}:-${nws._id}` === props.desc.newsId)) {
                    let newsCopy = {...newsDashboard.filter(nws => `${props.desc.newsId.slice(0, 1)}:-${nws._id}` === props.desc.newsId)[0]};
                    newsCopy["comments"] = newsCopy["comments"] + 1;

                    const copyIndex = newsDashboard.findIndex(nws => `${props.desc.newsId.slice(0, 1)}:-${nws._id}` === props.desc.newsId);
                    newsDashboard[copyIndex] = newsCopy;

                    dispatch(
                        updateStockDashboardNews(
                            {
                                "data": chunkArray(newsDashboard, 4), "dataLoading": dashboardNews["news"]["dataLoading"]
                            }
                        )
                    );
                }
            }

            if(stockSelection["selection"]["type"] === "News") {
                if(`${props.desc.newsId.slice(0, 1)}:-${stockSelection["selection"]["selectedDesc"]["desc"]["_id"]}` === props.desc.newsId) {
                    let selectionCopy = {...stockSelection["selection"]["selectedDesc"]["desc"]};
                    selectionCopy["comments"] = selectionCopy["comments"] + 1;

                    dispatch(
                        setStockPageSelection(
                            {
                                "type": "News",
                                "selectedDesc": {
                                    "desc": selectionCopy
                                }
                            }
                        )
                    );
                }
            }

            if(dashboardPredictions["selected"]["type"] === "News") {
                if(`${props.desc.newsId.slice(0, 1)}:-${dashboardPredictions["selected"]["selectedDesc"]["desc"]["_id"]}` === props.desc.newsId) {
                    let selectionCopy = {...dashboardPredictions["selected"]["selectedDesc"]["desc"]};
                    selectionCopy["comments"] = selectionCopy["comments"] + 1;

                    dispatch(
                        setStockDashboardMarketsSelected(
                            {
                                "type": "News",
                                "scrollTop": dashboardPredictions["selected"]["scrollTop"],
                                "selectedDesc": {
                                    "desc": selectionCopy
                                }
                            }
                        )
                    );
                }
            }
        }
    }

    return(
        <div className="post-actualCommentInputOverallWrapper">
            <div className="post-actualCommentInputWrapper">
                <div className="post-makeCommentInputSecondaryBox">
                    <ReactQuill 
                        theme="snow"
                        ref={quillRef}
                        value={comment}
                        onChange={setComment}
                        placeholder='what are your thoughts?'
                        modules={modules}
                        formats={formats}
                        readOnly={readOnlyState}
                        className='post-makeCommentQuillBox'
                    />
                </div>
                {tagOptionsList.length === 0 ?
                    null :
                    <div className="post-makeCommentTaggingOptionsContainer">
                        {userQueryText !== ""  ?
                            <>
                                {tagOptionsList.map((desc, index) => (
                                        <button className="post-tagUserContainerBtn"
                                                key={`comment-tag-${index}`}
                                                onClick={() => selectTaggedUser(desc.username)}
                                            >
                                            {desc.profilePicture === "" ? 
                                                <div className="post-headerProfileImageNone"
                                                        style={generalOpx.profilePictureGradients[index % 5]}
                                                    >
                                                    <img src="/assets/Favicon.png" alt="" className="large-homePageHeaderProfileImgNonUser" />
                                                    <Tsunami className="post-headerProfileImageNoneIcon"/>
                                                </div> : 
                                                <img src={desc.profilePicture} alt="" className="post-headerProfileImage" />
                                            }
                                            <span className="post-tagUserContainerBtnDesc">{desc.username}</span>
                                        </button>
                                    ))
                                }
                            </> :
                            <>
                                {stockQueryText !== "" ?
                                    <>
                                        {tagOptionsList.map((desc, index) => (
                                                <button className="post-tagUserContainerBtn"
                                                        key={`comment-tag-${index}`}
                                                        onClick={() => selectTaggedStock(desc.symbol)}
                                                    >
                                                    <img src={desc.profileImage} alt="" className="post-headerProfileImage" />
                                                    <span className="post-tagUserContainerBtnDesc">{`S:-${desc.symbol}`}</span>
                                                </button>
                                            ))
                                        }
                                    </> :
                                    <>
                                        {cryptoQueryText !== "" ?
                                            <>
                                                {tagOptionsList.map((desc, index) => (
                                                        <button className="post-tagUserContainerBtn"
                                                                key={`comment-tag-${index}`}
                                                                onClick={() => selectTaggedCrypto(desc.symbol)}
                                                            >
                                                            <img src={desc.profileImage} alt="" className="post-headerProfileImage" />
                                                            <span className="post-tagUserContainerBtnDesc">{`C:-${desc.symbol}`}</span>
                                                        </button>
                                                    ))
                                                }
                                            </> : null
                                        }
                                    </>
                                }
                            </>
                        }
                    </div>
                }
                {uploadMedia.length === 0 && uploadMediaStatuses.length === 0 ?
                    null :
                    <div className="post-makeCommentMediaContainer">
                        <div className="post-makeCommentInputUloadedMediaHeader">Uploads:</div>
                        <div className="post-makeCommentInputUploadedMediaContainer">
                            {[...Array(4)].map((e, i) => {
                                    if(uploadMediaStatuses[i] === "loading" && (uploadMedia[i] === undefined || uploadMedia[i] === null)) {
                                        return <div className="post-makeCommentInputUploadedMedia"
                                                key={`comment-uploaded-media-${i}`}
                                            >
                                            <div className="finulab-chartLoading">
                                                <div className="finulab-chartLoadingSpinner"/>
                                                <img src="/assets/Finulab_Icon.png" alt="" className="finulab-chartLoadingImg" />
                                            </div>
                                        </div>
                                    } else if(!(uploadMedia[i] === undefined || uploadMedia[i] === null)) {
                                        if(uploadMedia[i][1] === "photo") {
                                            if(uploadMedia[i][0] === "an error has occured, please try again later") {
                                                return <div className="post-makeCommentInputUploadedMedia"
                                                        key={`comment-uploaded-media-${i}`}
                                                    >
                                                    <div className="post-makeCommentInputUploadedMediaErrorNotice">
                                                        Error: please try again later.
                                                        <button className="post-makeCommentUploadedMediaDeleteBtn" onClick={() => uploadMediaRemoveHandler(i)}>
                                                            <Close className="post-makeCommentUploadedMediaDeleteBtnIcon"/>
                                                        </button>
                                                    </div>
                                                </div>
                                            } else if(uploadMedia[i][0] === "error - photo must be under 5MB") {
                                                return <div className="post-makeCommentInputUploadedMedia"
                                                        key={`comment-uploaded-media-${i}`}
                                                    >
                                                    <div className="post-makeCommentInputUploadedMediaErrorNotice">
                                                        Error: photo must be less than 5MB.
                                                        <button className="post-makeCommentUploadedMediaDeleteBtn" onClick={() => uploadMediaRemoveHandler(i)}>
                                                            <Close className="post-makeCommentUploadedMediaDeleteBtnIcon"/>
                                                        </button>
                                                    </div>
                                                </div>
                                            } else {
                                                return <div className="post-makeCommentInputUploadedMedia"
                                                        key={`comment-uploaded-media-${i}`}
                                                    >
                                                    <img src={uploadMedia[i][0]} alt="" className="post-makeCommentInputUploadedMediaImg" />
                                                    <button className="post-makeCommentUploadedMediaDeleteBtn" onClick={() => uploadMediaRemoveHandler(i)}>
                                                        <Close className="post-makeCommentUploadedMediaDeleteBtnIcon"/>
                                                    </button>
                                                </div>
                                            }
                                        } else {
                                            if(uploadMedia[i][0] === "an error has occured, please try again later") {
                                                return <div className="post-makeCommentInputUploadedMedia"
                                                        key={`comment-uploaded-media-${i}`}
                                                    >
                                                    <div className="post-makeCommentInputUploadedMediaErrorNotice">
                                                        Error: please try again later.
                                                        <button className="post-makeCommentUploadedMediaDeleteBtn" onClick={() => uploadMediaRemoveHandler(i)}>
                                                            <Close className="post-makeCommentUploadedMediaDeleteBtnIcon"/>
                                                        </button>
                                                    </div>
                                                </div>
                                            } else if(uploadMedia[i][0] === "error - video must be under 5MB") {
                                                return <div className="post-makeCommentInputUploadedMedia"
                                                        key={`comment-uploaded-media-${i}`}
                                                    >
                                                    <div className="post-makeCommentInputUploadedMediaErrorNotice">
                                                        Error: video must be less than 5MB.
                                                        <button className="post-makeCommentUploadedMediaDeleteBtn" onClick={() => uploadMediaRemoveHandler(i)}>
                                                            <Close className="post-makeCommentUploadedMediaDeleteBtnIcon"/>
                                                        </button>
                                                    </div>
                                                </div>
                                            } else {
                                                return <div className="post-makeCommentInputUploadedMedia"
                                                        key={`comment-uploaded-media-${i}`}
                                                    >
                                                    <video className="post-makeCommentInputUploadedMediaImg" muted controls playsInline>
                                                        <source src={`${uploadMedia[i][0]}#t=0.5`} type="video/mp4"/>
                                                    </video>
                                                    <button className="post-makeCommentUploadedMediaDeleteBtn" onClick={() => uploadMediaRemoveHandler(i)}>
                                                        <Close className="post-makeCommentUploadedMediaDeleteBtnIcon"/>
                                                    </button>
                                                </div>
                                            }
                                        }
                                    }
                                })
                            }
                        </div>
                        <div className="post-makeCommentInputUloadMediaUnderline"
                                style={uploadMedia.length > 4 ? {"color": "var(--primary-red-09)"} : {}}
                            >
                            Media Limit: {uploadMedia.length}&nbsp;/ 4
                        </div>
                    </div>
                }
                <div className="post-makeCommentInputOptionsContainer">
                    <input 
                        id={`post-makeCommentInputOptionsPhotoInput-${props.type}-${props.type === "secondary" ? props.desc.index : "00"}`}
                        type="file"
                        accept="image/*"
                        disabled={(uploadMediaFreezeOpt || uploadMedia.length >= 4)}
                        onChange={photoUploadHandler}
                        style={{"display": "none"}}
                    />
                    <label htmlFor={`post-makeCommentInputOptionsPhotoInput-${props.type}-${props.type === "secondary" ? props.desc.index : "00"}`} className="post-makeCommentInputOptnBtn" style={{"marginLeft": "5px"}}>
                        <CameraAlt className="post-makeCommentInputOptnBtnIcon"/>
                    </label>
                    <input 
                        id={`post-makeCommentInputOptionsVideoInput-${props.type}-${props.type === "secondary" ? props.desc.index : "00"}`}
                        type="file"
                        accept="video/mp4,video/x-m4v,video/*"
                        disabled={(uploadMediaFreezeOpt || uploadMedia.length >= 4)}
                        onChange={videoUploadHandler}
                        style={{"display": "none"}}
                    />
                    <label htmlFor={`post-makeCommentInputOptionsVideoInput-${props.type}-${props.type === "secondary" ? props.desc.index : "00"}`} className="post-makeCommentInputOptnBtn" style={{"marginLeft": "15px"}}>
                        <VideoCameraBack className="post-makeCommentInputOptnBtnIcon"/>
                    </label>
                    <div className="post-makeCommentInputOptionsInnerCont">
                        {props.type === "secondary" ?
                            <button className="post-makeCommentSendOptnBtn"
                                    onClick={() => commentDisplayToggle(props.desc.index)}
                                    style={{"marginRight": "15px", "backgroundColor": "var(--primary-red-09)"}}
                                >
                                <Close className="post-makeCommentInputSendnBtnIcon"/>
                            </button> : null
                        }
                        <button className="post-makeCommentSendOptnBtn"
                                onClick={() => submitComment()}
                                disabled={readOnlyState || (getInnerText(comment).length <= 0 && uploadMedia.length === 0)}
                                style={(getInnerText(comment).length > 0 || uploadMedia.length > 0) ? {"backgroundColor": "var(--primary-blue-11)"} : {}}
                            >
                            {readOnlyState ?
                                <FadeLoader
                                    color={"#FAFAFA"}
                                    loading={true}
                                    height={7}
                                    margin={-12}
                                    cssOverride={override}
                                    width={2}
                                    radius={"4px"}
                                /> :
                                <North className="post-makeCommentInputSendnBtnIcon"/>
                            }
                        </button>
                    </div>
                </div>
            </div>
            {submissionError ?
                <div className="post-makeCommentNoticePrimaryContainer">
                    <div className="post-makeCommentAnErrorOccuredNotice">An error occured, please try again later.</div>
                </div> : null
            }
        </div>
    )
}