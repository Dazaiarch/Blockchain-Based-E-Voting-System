import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

function WalletConnect({ onConnect }) {
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    checkConnection();
    
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const checkConnection = async () => {
    if (!window.ethereum) return;
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        onConnect(accounts[0], signer);
      }
    } catch (err) {
      console.error("Connection check error:", err);
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      setAccount(null);
    } else if (accounts[0] !== account) {
      setAccount(accounts[0]);
      window.location.reload();
    }
  };

  const connect = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask to use this voting system");
      return;
    }
    
    setIsConnecting(true);
    
    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      setAccount(accounts[0]);
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      onConnect(accounts[0], signer);
    } catch (err) {
      console.error("Connection error:", err);
      alert("Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const formatAddress = (addr) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!window.ethereum) {
    return (
      <button className="wallet-btn" disabled>
        <span>MetaMask Required</span>
      </button>
    );
  }

  return (
    <button 
      className={`wallet-btn ${account ? 'connected' : ''}`}
      onClick={connect}
      disabled={isConnecting}
    >
      {isConnecting ? (
        <span>Connecting...</span>
      ) : account ? (
        <>
          <span style={{color: 'var(--success)'}}>●</span>
          <span className="wallet-address">{formatAddress(account)}</span>
        </>
      ) : (
        <>
          <span>🔗</span>
          <span>Connect Wallet</span>
        </>
      )}
    </button>
  );
}

export default WalletConnect;
