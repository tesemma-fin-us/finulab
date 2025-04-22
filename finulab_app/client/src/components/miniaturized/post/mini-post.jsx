import './mini-post.css';
import '../../post/index.css';

export default function MiniPost() {
    const profileImage = "https://finulab-dev-profile-images.s3.us-east-1.amazonaws.com/1707258973-W%28LDgC%24%28C9W7goZ-KX%28bV%29zD%24R%217cQHTWtY%26%21TzQ%28I27%40UTj-1X5SJyhpJSAkm4%29Ws8eG9BaPdMWtAPCvCQr6X%2BUP%29UZK%2Btesemma.fin-usk9x2zsT%24umgCT%215Xlqt%5EJbYDFtA%21vyqcKuvcc7Ma%24u9rtsd7Taa%2BmUNPX%2Aa1j79iL%5ECR%24edmJRcZhHDWT5b%25N%24%2BCdCxm%29nQjm%23Hj0zx%26yB.jpeg";
    
    const oneImg = "https://finulab-dev-posts.s3.us-east-1.amazonaws.com/1729983171-%2187%29esd8%2BoM%2AGMM8%2AECMD8%24jWoip%23QA7%29z%2Adc2Nfd%247whZmWE%28t%24f8Rfo5%23RQ%26ztUpGm%28Y%21rve%24unPvCsYfPriK%5EttXl%40krhythmicReturns1729983171mJpmLll%26sxEvpLDNcOVW7-sJK%28%5E%2B%23cKvaB%5EH%24R1LJg-Ar%269%26%21s%215WEV%5Ej%21irnc8%25KmI6LV%2BIn3rlA%217%2Ba%24pn1QV%23ljUHRa%40s%256%296%24ZK%25Un.jpeg";
    const twoImg = "https://finulab-dev-posts.s3.us-east-1.amazonaws.com/1731337541-9Kl%2AKGU8Vl-%21eeD-SJI%2Bej%24DVk6BKOQki%2AMYjIH%5Ejx8qbJhkVjoc47%40%29YHfYvvuTKbY1PJDexS%5EaFSz%21S-OvACzm%23SFB%5Extesemma.fin-us1731337541p5ZHdi%2BvaTsMtMnD1mrg%29x7QD%2BsZ-JJwCtGbZKu-11n%2A%28y61Csu8%28tHcwQ%2BPEuaG-%21T0Pz%407qKun%2AgSC7f%28%21G%29hvAaB%5EU%2ACvnt%24F5xIxWa.jpeg";
    const threeImg = "https://finulab-dev-posts.s3.us-east-1.amazonaws.com/1727258650-NcFKw%24isc%2AMRwFiK4S%2ARHmlp%23JGjLNd%2Bkcd1ESZVQdWon4Eb2mela5K%24bPTuZAlO0MCGbOpyrUscr%2AXPkMS-hOXJOArt%5E-tesemma.fin-us1727258650%21%219WB158%2538l%5El%25%23R%2BPEPUTR-8mf%24RI%5EVKb6pWimGdp%29%40%21wZV-%23L%28kI0ShdYTa7PG8Xwzr4bzYDlKJI%212g%23Rlx5TZsfwaEF-SBVOO%26WUPH.jpeg";
    const fourImg = "https://finulab-dev-posts.s3.us-east-1.amazonaws.com/1728052658-%402a9Ns%250y%5ESxQ3%2B%29qWIthGZyjclwfiVZyrpw%291O9zb%25Cee46lXkv%40zuF2onNenL8a2R%24RPZJFcXf2RvT9dFdAmYNn54F%28FstellarInvestor1728052658%5EiqN%5EvzsI%26ncEnfQoch3zHP%23Zc25l%2Bv%23%29jNudq6v80KvSvZ7p%24sl6%40cKnTPr%28llqy%5Exvn%24XTgaU9ifLwhH%26E%28f7oL%25u%24Q%23G2SqxNSNdc38.jpeg";
    
    return(
        <div className="miniPost-Wrapper">
            <div className="post-miniturizedHeaderContainer">
                <img src={profileImage} alt="" className="post-headerProfileImage" />
                <div className="post-headerName">
                    tesemma.fin-us
                    <span className="post-headerTimeAgo">&nbsp;&nbsp;•&nbsp;&nbsp;13hr ago</span>
                </div>
            </div>
            <div className="post-miniturizedTitleContainer">Most Held Stocks by Hedge Funds</div>
            <div className="post-miniaturizedBodyTextDesc">
                Thank you Finulab, we appreciate you all!
            </div>
            <div className="post-miniaturizedMediaContainer">
                {/*
                <button className="post-miniaturizedMediaOneImgBtn">
                    <img src={fourImg} alt="" className="post-miniaturizedMediaOneImg" />
                </button>
                */}
                <button className="post-miniaturizedMediaOneImgBtn">
                    <img src={fourImg} alt="" className="post-miniaturizedMediaOneImg" />
                </button>
                {/*
                <button className="post-mediaOneofTwoBtn">
                    <img src={fourImg} alt="" className="post-miniaturizedMediaOneofTwoImg" />
                </button>
                <button className="post-mediaTwoofTwoBtn">
                    <img src={twoImg} alt="" className="post-miniaturizedMediaTwoofTwoImg" />
                </button>
                */}
                {/*
                <button className="post-mediaOneofTwoBtn">
                    <img src={fourImg} alt="" className="post-miniaturizedMediaOneofTwoImg" />
                </button>
                <div className="post-mediaThreeInnerContainer">
                    <button className="post-mediaTwoofThreeBtn">
                        <img src={threeImg} alt="" className="post-mediaTwoofThreeImg" />
                    </button>
                    <button className="post-mediaThreeofThreeBtn">
                        <img src={twoImg} alt="" className="post-mediaThreeofThreeImg" />
                    </button>
                </div>
                */}
                {/*
                <div className="post-mediaThreeInnerContainer">
                    <button className="post-mediaOneofFourBtn">
                        <img src={oneImg} alt="" className="post-miniaturizedMediaOneofFourImg" />
                    </button>
                    <button className="post-mediaTwoofFourBtn">
                        <img src={fourImg} alt="" className="post-mediaTwoofFourImg" />
                    </button>
                </div>
                <div className="post-mediaThreeInnerContainer">
                    <button className="post-mediaTwoofThreeBtn">
                        <img src={threeImg} alt="" className="post-miniaturizedMediaTwoofThreeImg" />
                    </button>
                    <button className="post-mediaThreeofThreeBtn">
                        <img src={twoImg} alt="" className="post-mediaThreeofThreeImg" />
                    </button>
                </div>
                */}
            </div>
        </div>
    )
}