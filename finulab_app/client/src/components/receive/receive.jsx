import './receive.css';
import {ContentCopy} from '@mui/icons-material';

const PrettyJson = ({ json }) => {
    const formattedJson = JSON.stringify(json, null, 2);
    return (
        <pre style={{ 
            whiteSpace: 'pre-wrap', 
            wordBreak: 'break-all',
            overflowX: 'auto'
          }}>
            <code>{formattedJson}</code>
        </pre>
    );
};

export default function Receive() {
    const TxBuilder = {
        "chain": "0",
        "keyset": {
            "keys": [
                "1ed09938b9726b8809a151b96975969742fe0d008a1cbb58f599f49c59345bd1"
            ],
            "pred": "keys-all"
        },
        "account": "k:1ed09938b9726b8809a151b96975969742fe0d008a1cbb58f599f49c59345bd1"
    }

    return(
        <div className="receive-wrapper">
            <div className="receive-header">
                <span className="receive-headerText">Receive</span>
            </div>
            <div className="receive-secondaryHeader">Account Information</div>
            <div className="receive-body">
                <div className="receive-bodyHeader">
                    <span className="receive-bodyHeaderText">Tx Builder</span>
                </div>
                <div className="receiver-bodyInnerContainer">
                    <PrettyJson json={TxBuilder}/>
                </div>
                <button className="receive-bodyInnerCopyBtn">
                    <ContentCopy className="receive-bodyInnerCopyBtnIcon" /> Copy
                </button>
            </div>
        </div>
    )
}