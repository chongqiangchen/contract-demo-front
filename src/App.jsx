import React, {useEffect, useState} from "react";
import { ethers } from "ethers";
import contractABI from "./utils/WavePortal.json";
import './App.css';

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [name, setName] = useState('write u name');
  const contractAddress = "0xd574B28c05914Cd3735b0c3E10eBBDE5f9EF3a09";

  const checkIfWalletIsConnected = async () => {
    try {
      const {ethereum} = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
      }

    } catch(e) {
      console.log(e);
    }
  }

  const connectWallet = async () => {
    try {
      const {ethereum} = window;

      if (!ethereum) {
        alert("Get MetaMask");
        return;
      }

      const accounts = await ethereum.request({method: "eth_requestAccounts"});
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch(e) {
      console.log(e);
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  const getAllWaves = async () => {
    try {
      const {ethereum} = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const waves = await wavePortalContract.getAllWaves();
        console.log(waves);
        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });

        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch(e) {
      console.log(e);
    }
  }

  const wave = async () => {
    try {
      const {ethereum} = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        const waveTxn = await wavePortalContract.wave(name, {
          gasLimit: 300000
        });
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber())
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch(e) {
      console.log(e)
    }
  }

  useEffect(() => {
  let wavePortalContract;

  const onNewWave = (from, timestamp, message) => {
    console.log("NewWave", from, timestamp, message);
    setAllWaves(prevState => [
      ...prevState,
      {
        address: from,
        timestamp: new Date(timestamp * 1000),
        message: message,
      },
    ]);
  };

  if (window.ethereum) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
    wavePortalContract.on("NewWave", onNewWave);
  }

  return () => {
    if (wavePortalContract) {
      wavePortalContract.off("NewWave", onNewWave);
    }
  };
}, []);
  
  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
          👋 Hey there!
        </div>

        <div className="bio">
          I am farza and I worked on self-driving cars so that's pretty cool right? Connect your Ethereum wallet and wave at me!
        </div>

        <input value={name} onChange={e => {
          console.log(e.target.value)
          setName(e.target.value);
        }}></input>

        <button className="waveButton" onClick={wave}>
          Wave at Me
        </button>

        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        })}
      </div>
    </div>
  );
}
