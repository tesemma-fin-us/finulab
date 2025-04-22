import './createPost.css';
import '../post/index.css';

import Quill from 'quill';
import axios from 'axios';
import nlp from 'compromise';
import DOMPurify from 'dompurify';
import {getUnixTime} from 'date-fns';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {useNavigate} from 'react-router-dom';
import BeatLoader from 'react-spinners/BeatLoader';
import {useDispatch, useSelector} from 'react-redux';
import {useRef, useState, useEffect, useMemo} from 'react';
import {Tsunami, CameraAlt, VideoCameraBack, North, Close, ExpandMore, ConnectWithoutContactSharp} from '@mui/icons-material';

import generalOpx from '../../functions/generalFunctions';

import {selectUser} from '../../reduxStore/user';
import {updateStockPosts, selectStockPosts} from '../../reduxStore/stockPosts';
import {setStockPageSelection, selectStockPageSelection} from '../../reduxStore/stockPageSelection';
import {setPostCommunityOptns, selectPostCommunityOptns} from '../../reduxStore/postCommunityOptns';
import {setStockDashboardMarketsSelected, selectStockDashboardMarkets} from '../../reduxStore/stockDashboardMarkets';

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

export default function FinulabCreatePost(props) {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const Delta = Quill.import('delta');

    const user = useSelector(selectUser);
    const stockPosts = useSelector(selectStockPosts);
    const stockSelection = useSelector(selectStockPageSelection);
    const postCommunityOptns = useSelector(selectPostCommunityOptns);
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
                                    const theFormat = quill.getFormat(cursorPosition - 1, 1);
                                    if(Object.keys(theFormat).includes("bold") && Object.keys(theFormat).includes("color")) {
                                        if(theFormat["bold"] === true && theFormat["color"] === 'var(--primary-blue-11)') {
                                            quill.removeFormat(cursorPosition - 1, 1, 'bold', true);
                                            quill.removeFormat(cursorPosition - 1, 1, 'color', 'var(--primary-blue-11)');

                                            setUserQueryText("");
                                            setStockQueryText("");
                                            setCryptoQueryText("");
                                        }
                                    }
                                }
                            } else {
                                const theFormat = quill.getFormat(cursorPosition - 1, 1);
                                if(Object.keys(theFormat).includes("bold") && Object.keys(theFormat).includes("color")) {
                                    if(theFormat["bold"] === true && theFormat["color"] === 'var(--primary-blue-11)') {
                                        quill.removeFormat(cursorPosition - 1, 1, 'bold', true);
                                        quill.removeFormat(cursorPosition - 1, 1, 'color', 'var(--primary-blue-11)');

                                        setUserQueryText("");
                                        setStockQueryText("");
                                        setCryptoQueryText("");
                                    }
                                }
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
                                const theFormat = quill.getFormat(cursorPosition - 1, 1);
                                if(Object.keys(theFormat).includes("bold") && Object.keys(theFormat).includes("color")) {
                                    if(theFormat["bold"] === true && theFormat["color"] === 'var(--primary-blue-11)') {
                                        quill.removeFormat(cursorPosition - 1, 1, 'bold', true);
                                        quill.removeFormat(cursorPosition - 1, 1, 'color', 'var(--primary-blue-11)');

                                        setUserQueryText("");
                                        setStockQueryText("");
                                        setCryptoQueryText("");
                                    }
                                }
                            }
                        } else {
                            const theFormat = quill.getFormat(cursorPosition - 1, 1);
                            if(Object.keys(theFormat).includes("bold") && Object.keys(theFormat).includes("color")) {
                                if(theFormat["bold"] === true && theFormat["color"] === 'var(--primary-blue-11)') {
                                    quill.removeFormat(cursorPosition - 1, 1, 'bold', true);
                                    quill.removeFormat(cursorPosition - 1, 1, 'color', 'var(--primary-blue-11)');

                                    setUserQueryText("");
                                    setStockQueryText("");
                                    setCryptoQueryText("");
                                }
                            }
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
                                const theFormat = quill.getFormat(cursorPosition - 1, 1);
                                if(Object.keys(theFormat).includes("bold") && Object.keys(theFormat).includes("color")) {
                                    if(theFormat["bold"] === true && theFormat["color"] === 'var(--primary-blue-11)') {
                                        quill.removeFormat(cursorPosition - 1, 1, 'bold', true);
                                        quill.removeFormat(cursorPosition - 1, 1, 'color', 'var(--primary-blue-11)');

                                        setUserQueryText("");
                                        setStockQueryText("");
                                        setCryptoQueryText("");
                                    }
                                }
                            }
                        } else {
                            const theFormat = quill.getFormat(cursorPosition - 1, 1);
                            if(Object.keys(theFormat).includes("bold") && Object.keys(theFormat).includes("color")) {
                                if(theFormat["bold"] === true && theFormat["color"] === 'var(--primary-blue-11)') {
                                    quill.removeFormat(cursorPosition - 1, 1, 'bold', true);
                                    quill.removeFormat(cursorPosition - 1, 1, 'color', 'var(--primary-blue-11)');

                                    setUserQueryText("");
                                    setStockQueryText("");
                                    setCryptoQueryText("");
                                }
                            }
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
                            const theFormat = quill.getFormat(cursorPosition - 1, 1);
                            if(Object.keys(theFormat).includes("bold") && Object.keys(theFormat).includes("color")) {
                                if(theFormat["bold"] === true && theFormat["color"] === 'var(--primary-blue-11)') {
                                    quill.removeFormat(cursorPosition - 1, 1, 'bold', true);
                                    quill.removeFormat(cursorPosition - 1, 1, 'color', 'var(--primary-blue-11)');

                                    setUserQueryText("");
                                    setStockQueryText("");
                                    setCryptoQueryText("");
                                }
                            }
                        }
                    } else {
                        const theFormat = quill.getFormat(cursorPosition - 1, 1);
                        if(Object.keys(theFormat).includes("bold") && Object.keys(theFormat).includes("color")) {
                            if(theFormat["bold"] === true && theFormat["color"] === 'var(--primary-blue-11)') {
                                quill.removeFormat(cursorPosition - 1, 1, 'bold', true);
                                quill.removeFormat(cursorPosition - 1, 1, 'color', 'var(--primary-blue-11)');

                                setUserQueryText("");
                                setStockQueryText("");
                                setCryptoQueryText("");
                            }
                        }
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
        quill.root.setAttribute("data-placeholder", "  What are your thinking?");

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

    const toolbarOptions = [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'align': [] }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'color': [] }, { 'background': [] }]
    ];

    const modules = {
        toolbar: toolbarOptions,
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

    const levenshteinDistance = (str1, str2) => {
        const track = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

        for(let i = 0; i <= str1.length; i++) {
            track[0][i] = i;
        }

        for(let j = 0; j <= str2.length; j++) {
            track[j][0] = j;
        }

        for(let j = 1; j <= str2.length; j++) {
            for(let i = 1; i <= str1.length; i++) {
                if(str1[i - 1] === str2[j - 1]) {
                    track[j][i] = track[j - 1][i - 1];
                } else {
                    track[j][i] = Math.min(
                        track[j - 1][i - 1], // substitution
                        track[j][i - 1],     // insertion
                        track[j - 1][i]      // deletion
                    ) + 1;
                }
            }
        }
          
        return track[str2.length][str1.length];
    }

    const stringSimilarity = (str1, str2) => {
        const longer = Math.max(str1.length, str2.length);
        if(longer === 0) return 1; // if both strings are empty, they're identical

        const distance = levenshteinDistance(str1, str2);
        return ((longer - distance) / longer) * 100;
    }

    const extractSubjects = (text) => {
        let subjects = [];
        let doc = nlp(text);

        let entities = doc.match('#Person #Organization #Place #Demonym #Event #Product #TitleCase');
        entities.forEach((entity) => {
            if(!subjects.includes(entity.text().toLowerCase())) {
                subjects.push(entity.text().toLowerCase());
            }
        });

        let nouns = doc.nouns().not('(#Pronoun|#Determiner)').out('array');
        nouns.forEach((noun) => {
            if (!subjects.includes(noun.toLowerCase()) && !noun.toLowerCase().startsWith('a ') && !noun.toLowerCase().startsWith('an ') && !noun.toLowerCase().startsWith('the ')) {
                subjects.push(noun.toLowerCase());
            }
        });

        return subjects;
    }

    const [displayGroupId, setDisplayGroupId] = useState(false);
    const [groupId, setGroupId] = useState({"name": "", "image": ""});
    const [makePostErrorCode, setMakePostErrorCode] = useState(0);

    const [readOnlyState, setReadOnlyState] = useState(false);
    const [submissionError, setSubmissionError] = useState(false);
    const sumbitPost = async (input) => {
        setReadOnlyState(true);
        setUploadMediaFreezeOpt(true);

        let postSubjects = [], 
            taggedUsers = [], taggedAssets = [];
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

                taggedUsers.push(user_matches_unique[u].slice(1));
            }

            const s_rx = /S:-[a-zA-Z]+/g;
            const stock_matches = quillText.match(s_rx);
            const stock_matches_unique = [...new Set(stock_matches)];

            for(let s = 0; s < stock_matches_unique.length; s++) {
                const modIndex = locations(stock_matches_unique[s], quillText);
                for(let s_m = 0; s_m < modIndex.length; s_m++) {
                    modification_locations.push([modIndex[s_m], stock_matches_unique[s], "stock"]);
                }

                taggedAssets.push(stock_matches_unique[s]);
                postSubjects.push(`${stock_matches_unique[s].slice(3, stock_matches_unique[s].length)}`.toLowerCase());
            }

            const c_rx = /C:-[a-zA-Z]+/g;
            const crypto_matches = quillText.match(c_rx);
            const crypto_matches_unique = [...new Set(crypto_matches)];

            for(let c = 0; c < crypto_matches_unique.length; c++) {
                const modIndex = locations(crypto_matches_unique[c], quillText);
                for(let c_m = 0; c_m < modIndex.length; c_m++) {
                    modification_locations.push([modIndex[c_m], crypto_matches_unique[c], "crypto"]);
                }

                taggedAssets.push(crypto_matches_unique[c]);
                postSubjects.push(`${crypto_matches_unique[c].slice(3, crypto_matches_unique[c].length)}`.toLowerCase());
            }

            const h_rx = /#[a-zA-Z]+/g;
            const hashtag_matches = quillText.match(h_rx);
            const hashtag_matches_unique = [...new Set(hashtag_matches)];

            for(let h = 0; h < hashtag_matches_unique.length; h++) {
                const modIndex = locations(hashtag_matches_unique[h], quillText);
                for(let h_m = 0; h_m < modIndex.length; h_m++) {
                    modification_locations.push([modIndex[h_m], hashtag_matches_unique[h], "hash"]);
                }

                postSubjects.push(`${hashtag_matches_unique[h].slice(1, hashtag_matches_unique[h].length)}`.toLowerCase());
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

            const nlpPostSubjects = extractSubjects(quillText);
            if(postSubjects.length === 0) {
                postSubjects = nlpPostSubjects;
            } else {
                for(let nlp_p = 0; nlp_p < nlpPostSubjects.length; nlp_p++) {
                    if(postSubjects.includes(nlpPostSubjects[nlp_p])) continue;

                    const similaritiesIndex = postSubjects.map(sub => stringSimilarity(nlpPostSubjects[nlp_p], sub));
                    if(Math.max(similaritiesIndex) >= 90) continue;

                    postSubjects.push(nlpPostSubjects[nlp_p]);
                }
            }
        }

        const now = new Date();
        const nowUnix = getUnixTime(now);
        const sanitizedComment = DOMPurify.sanitize(quill.root.innerHTML);
        const photos = uploadMedia.filter(doc => doc[0].slice(0, 5) === "https" && doc[1] === "photo").map(pt_doc => pt_doc[0]);
        const videos = uploadMedia.filter(doc => doc[0].slice(0, 5) === "https" && doc[1] === "video").map(vd_doc => vd_doc[0]);
        
        await generalOpx.axiosInstance.post(`/content/posts/create-post`, 
            {
                "photos": photos,
                "videos": videos,
                "post": sanitizedComment,
                "groupId": groupId.name,
                "taggedUsers": taggedUsers,
                "taggedAssets": taggedAssets,
                "groupProfileImage": groupId.image,
                "postSubjects": postSubjects
            }
        ).then(
            (response) => {
                if(response.data["status"] === "success") {
                    navigate(`/post/${response.data["data"]}`);
                } else {
                    setMakePostErrorCode(1);

                    setTimeout(() => {
                        setMakePostErrorCode(0);
                    }, 2000);
                }
            }
        ).catch(
            () => {
                setMakePostErrorCode(1);

                setTimeout(() => {
                    setMakePostErrorCode(0);
                }, 2000);
            }
        );

        setReadOnlyState(false);
    }

    const findJoinedCommunities = async () => {
        const joinedCommunities = await generalOpx.axiosInstance.put(`/users/communities-joined`);
        if(joinedCommunities.data["status"] === "success") {
            dispatch(
                setPostCommunityOptns(
                    {
                        "data": joinedCommunities.data["data"],
                        "dataLoading": false
                    }
                )
            );
        }
    }
    useMemo(() => {
        if(user) {
            if(postCommunityOptns["dataLoading"]) {
                findJoinedCommunities();
            }
        }
    }, []);

    const displayGroupIdToggle = () => {displayGroupId ? setDisplayGroupId(false) : setDisplayGroupId(true);}
    const selectPostToGroupId = (name, image) => {
        setGroupId(
            {
                "name": name, "image": image
            }
        );
        setDisplayGroupId(false);
    }

    const cl_overlayRef = useRef();
    const cl_overlayContainerRef = useRef();
    useEffect(() => {
        if(cl_overlayRef.current && cl_overlayContainerRef.current && displayGroupId) {
            const handleClickOutside = (event) => {
                if(cl_overlayRef) {
                    if(!cl_overlayContainerRef.current?.contains(event?.target) && !cl_overlayRef.current?.contains(event?.target)) {
                        setDisplayGroupId(false);
                    }
                }
            }

            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            }
        }
    }, [displayGroupId]);

    return(
        <div
                className={props.f_viewPort === "small" ? "small-homePageContentBodyWrapper" : "large-homePageContentBodyWrapper"}
            >
            <div 
                    className={props.f_viewPort === "small" ? "small-homePageContentBody" : "large-homePageContentBody"}
                >
                <div className="large-homePageContentBodyMargin"/>
                <div className="finulab-createPostWrapper">
                    <button className={props.f_viewPort === "small" ? "finulab-createPostBtnSmall" : "finulab-createPostBtn"}
                            onClick={() => sumbitPost()}
                            disabled={readOnlyState || (getInnerText(comment).length <= 0 && uploadMedia.length === 0)}
                            style={(getInnerText(comment).length > 0 || uploadMedia.length > 0) ? {"backgroundColor": "var(--primary-bg-01)"} : {"backgroundColor": "var(--primary-bg-08)"}}
                        >
                        {readOnlyState ?
                            <BeatLoader
                                color='var(--primary-bg-10)'
                                size={7}
                            /> : `Post`
                        }
                    </button>
                    <div className="make-postHeader">
                        <img src={user.profilePicture} alt="" className="make-postHeaderImg" />
                        <div className="make-postHeaderDescContainer">
                            <span style={{"marginTop": "-3px"}}>{user.user}</span>
                            <button className="large-marketPageCategoryOptnBtn"
                                    ref={cl_overlayContainerRef}
                                    onClick={() => displayGroupIdToggle()}
                                    style={{
                                        "marginLeft": "8px", "color": "var(--primary-bg-01)", "backgroundColor": "var(--secondary-bg-03)", "border": "solid 1px var(--primary-bg-06)"
                                    }}
                                >
                                <div className="large-marketPageCategoryOptnBtnImgContainer"
                                        style={{"backgroundColor": "var(--secondary-bg-03)"}}
                                    >
                                    {groupId.name === "" ?
                                        <div className="post-headerProfileImageNone"
                                                style={{"background": "var(--secondary-bg-03)"}}
                                            >
                                            <img src="/assets/Favicon.png" alt="" className="large-homePageHeaderProfileImgNonUserMarkCopy" />
                                        </div> :
                                        <>
                                            {groupId.image === "" ?
                                                <div className="large-homepageMainNavigationSrchrsultNoPic"
                                                        style={generalOpx.profilePictureGradients[`${groupId.name}`.length % 5]}
                                                    >
                                                    <img src="/assets/Favicon.png" alt="" 
                                                        className="large-homepageMainNavigationSrcrsultNoPicFinulabLogo" 
                                                        style={{"width": "15px", "minWidth": "15px", "maxWidth": "15px", "height": "15px", "minHeight": "15px", "maxHeight": "15px", "filter": "brightness(0)"}}
                                                    />
                                                </div> : <img src={groupId.image} alt="" className="large-marketPageCategoryOptnBtnImg" />
                                            }
                                        </>
                                    }
                                </div>
                                <span className="large-marketPageCategoryOpntBtnDesc" style={{"alignItems": "center", "fontSize": "0.85rem", "marginRight": "10px"}}>
                                    {groupId.name === "" ?
                                        `Profile` : `${groupId.name}`
                                    }
                                </span>
                                <ExpandMore style={{"marginRight": "5px"}}/>
                            </button>
                        </div>
                        <div className="make-PostCommunitySelectionOptnsContainer"
                                style={{"display": displayGroupId ? "flex" : "none"}}
                                ref={cl_overlayRef}
                            >
                            {postCommunityOptns["data"].length > 0 ? 
                                <>
                                    <button className="make-PostCommunitySelectionBtn"
                                            onClick={() => selectPostToGroupId("", "")}
                                            style={groupId.name === "" ?
                                                {"color": "var(--primary-bg-10)", "backgroundColor": "var(--primary-bg-01)"} : {}
                                            }
                                        >
                                        <div className="make-PostCommunitySelectionBtnDescContainer">
                                            <img src="/assets/Favicon.png" alt="" className="make-PostCommunitySelectionBtnDescImg" />
                                            <div className="make-PostCommunitySelectionBtnDescTxt">
                                                <span className="make-PostCommunitySelectionBtnDescInnerTxt">
                                                    Profile
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                    {postCommunityOptns["data"].map((comm_optn, index) => (
                                            <button className="make-PostCommunitySelectionBtn"
                                                    key={`post-community-optn-${index}`}
                                                    onClick={() => selectPostToGroupId(comm_optn["communityName"], comm_optn["profilePicture"])}
                                                    style={{
                                                        "color": groupId.name === comm_optn["communityName"] ? "var(--primary-bg-10)" : "var(--primary-bg-01)",
                                                        "borderBottom": index === postCommunityOptns["data"].length - 1 ? "none" : "solid 1px var(--primary-bg-08)",
                                                        "backgroundColor": groupId.name === comm_optn["communityName"] ? "var(--primary-bg-01)" : "var(--secondary-bg-03)"
                                                    }}
                                                >
                                                <div className="make-PostCommunitySelectionBtnDescContainer">
                                                    {comm_optn["profilePicture"] === "" ? 
                                                        <div className="large-homepageMainNavigationSrchrsultNoPic"
                                                                style={generalOpx.profilePictureGradients[`${comm_optn["communityName"]}`.length % 5]}
                                                            >
                                                            <img src="/assets/Favicon.png" alt="" className="large-homepageMainNavigationSrcrsultNoPicFinulabLogo" style={{"filter": "brightness(0)"}}/>
                                                        </div> : <img src={comm_optn["profilePicture"]} alt="" className="make-PostCommunitySelectionBtnDescImg" />
                                                    }
                                                    <div className="make-PostCommunitySelectionBtnDescTxt">
                                                        <span className="make-PostCommunitySelectionBtnDescInnerTxt">
                                                            {comm_optn["communityName"]}
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        ))
                                    }
                                </> : 
                                <div className="make-PostCommunitySelectionOptnsNoneJoinedNote">
                                    <ConnectWithoutContactSharp className="make-PostCommunitySelectionOptnsNoneJoinedNoteIcon"/>
                                    <span>Join Communities</span>
                                    <span style={{"marginTop": "7.5px", "marginBottom": "7.5px"}}>to</span>
                                    <span>Expand Options</span>
                                </div>
                            }
                        </div>
                    </div>
                    <div className="make-postActualPostInputErrorDescContainer">
                        {makePostErrorCode === 1 ?
                            `An error occured, please try again later.` : null
                        }
                    </div>
                    <div className="make-postActualPostInputWrapper">
                        <div className="make-postInputSecondaryBox">
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
                        {uploadMedia.length === 0 && uploadMediaStatuses.length === 0 ?
                            null :
                            <div className="post-makeCommentMediaContainer" style={{"marginBottom": "16px"}}>
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
                            <div className="finulab-createPostMediaAddDesc">
                                Add Media:
                            </div>
                            <div className="finulab-createPostMediaAddOptnsBtnsContainer">
                                <input 
                                    id={`post-makeCommentInputOptionsPhotoInput-post-${props.location}`}
                                    type="file"
                                    accept="image/*"
                                    disabled={(uploadMediaFreezeOpt || uploadMedia.length >= 4)}
                                    onChange={photoUploadHandler}
                                    style={{"display": "none"}}
                                />
                                <label htmlFor={`post-makeCommentInputOptionsPhotoInput-post-${props.location}`} className="post-makeCommentInputOptnBtn" style={{"marginLeft": "0px"}}>
                                    <CameraAlt className="post-makeCommentInputOptnBtnIcon"/>
                                </label>
                                <input 
                                    id={`post-makeCommentInputOptionsVideoInput-post-${props.location}`}
                                    type="file"
                                    accept="video/mp4,video/x-m4v,video/*"
                                    disabled={(uploadMediaFreezeOpt || uploadMedia.length >= 4)}
                                    onChange={videoUploadHandler}
                                    style={{"display": "none"}}
                                />
                                <label htmlFor={`post-makeCommentInputOptionsVideoInput-post-${props.location}`} className="post-makeCommentInputOptnBtn" style={{"marginLeft": "15px"}}>
                                    <VideoCameraBack className="post-makeCommentInputOptnBtnIcon"/>
                                </label>
                            </div>
                        </div>
                    </div>
                    {submissionError ?
                        <div className="make-postMainNoticeContainer">
                            <div className="post-makeCommentAnErrorOccuredNotice">An error occured, please try again later.</div>
                        </div> :
                        <>
                            {tagOptionsList.length === 0 && userQueryText === "" && stockQueryText === "" && cryptoQueryText === "" ?
                                <div className="make-postMainNoticeContainer">
                                    <div className="make-postFinulabContentMotto">
                                        <img src={"/assets/Favicon.png"} alt="" className="make-postHeaderImg" />
                                        <div className="make-postFinulabContentMottoDesc">
                                            <span>&nbsp;&nbsp;Post&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Predict&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Profit</span> 
                                            {/*
                                            &nbsp;—&nbsp;
                                            <a className="make-postFinulabContentMottoDescLink" href="https://finulab.com/profile/tesemma.fin-us" target="_self">tesemma.fin-us</a> 
                                            */}
                                        </div>
                                    </div>
                                </div> :
                                <div className="make-postTaggingOptionsContainer">
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
                        </>
                    }
                </div>
            </div>
        </div>
    )
}