import { useEffect, useState } from 'react';
import './App.css';
import abi from './contracts/OscarNFTAbi.json';
import { ethers } from 'ethers';

const contractAddress = "0x48ce9B54531e9E5A60a435Fb6a201B619b086502";

function App() {

  const [currentAccount, setCurrentAccount] = useState(null);
  const [totalMinted, setTotalMinted] = useState('0');
  const [oscars, setOscars] = useState([]);

  const checkWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have Metamask installed!");
      return;
    } else {
      console.log("Wallet exists! We're ready to go!")
    }

    const accounts = await ethereum.request({ method: 'eth_accounts' });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account: ", account);
      setCurrentAccount(account);
    } else {
      console.log("No authorized account found");
    }
  }

  const connectWalletHandler = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      alert("Please install Metamask!");
    }

    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      console.log("Found an account! Address: ", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (err) {
      console.log(err)
    }
  }

  const mintNftHandler = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const nftContract = new ethers.Contract(contractAddress, abi, signer);

        console.log("Initialize payment");
        let nftTxn = await nftContract.safeMint();

        console.log("Mining... please wait");
        await nftTxn.wait();

        console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);

      } else {
        console.log("Ethereum object does not exist");
      }

    } catch (err) {
      console.log(err);
    }
  }

  const connectWalletButton = () => {
    return (
      <button onClick={connectWalletHandler} className='cta-button connect-wallet-button'>
        Connect Wallet
      </button>
    )
  }

  const mintNftButton = () => {
    return (
      <button onClick={mintNftHandler} className='cta-button mint-nft-button'>
        Mint Oscar NFT
      </button>
    )
  }

  useEffect(() => {
    checkWalletIsConnected();
  }, [])

  useEffect(() => {
    (async () => {
      try {
        const { ethereum } = window;
  
        if (ethereum) {
          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.getSigner();
          const nftContract = new ethers.Contract(contractAddress, abi, signer);
          const balance = await nftContract.balanceOf(currentAccount)
          const uris = await Promise.all([...Array(+balance).keys()].map(id => nftContract.tokenURI(id)));
          const nfts = await Promise.all(uris.map(async uri => {
            const response = await fetch(uri)
            if (response.ok) {
              const data = await response.json();
              return data;
            }
            return null;
          }))
          setOscars(nfts)
          setTotalMinted(balance.toString())
  
        } else {
          setTotalMinted('0');
          setOscars([]);
          console.log("Ethereum object does not exist");
        }
  
      } catch (err) {
        setTotalMinted('0');
        setOscars([]);
        console.log(err);
      }
    })()
  }, [currentAccount])

  return (
    <div className='main-app'>
      <h1>Welcome to the Oscar Minter!</h1>
      <div>{totalMinted} / 8 Oscars already minted!</div>
      <br></br>
      <div>
        {currentAccount ? mintNftButton() : connectWalletButton()}
      </div>
      <br></br>
      <div className='nft-box'>
      {oscars.map((oscar, i) => {
        return (
          <div className='card' key={i}>
            <div className='img-box'>
              <img src={oscar.image} alt={'Oscar picture ' + i} className='pic' />
            </div>
            <div className='content-box'>
              <strong>{oscar.name}</strong>
              <p>{oscar.description}</p>
              <a href={`https://opensea.io/assets/matic/${contractAddress}/${i}`} target='_blank'>View on Opensea</a>
            </div>
          </div>
        )
      })}

      </div>
    </div>
  )
}

export default App;
