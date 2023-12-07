import { SetStateAction, useState } from "react";
import "./App.css";
import RPC from "./web3RPC"; // for using web3.js
import { ethers, utils } from "ethers";
import { useSmartWalletProvider } from "./SmartWalletContext";
import { ThreeDots } from "react-loader-spinner";
import logo from './kana-labs-logo.svg';
import { useSDK } from '@metamask/sdk-react';
import { PrimeSdk, Web3WalletProvider, MetaMaskWalletProvider } from "@etherspot/prime-sdk";

function App() {
  const [loader, setLoader] = useState<boolean>(false);
  const {
    web3auth, provider, login, logout, loggedIn, miraiInstance, miraiSDK

  } = useSmartWalletProvider();
  const [inputAddress, setInputAddress] = useState('');
  const { sdk, connected, connecting, provider: metaMaskProvider, chainId } = useSDK();

  const handleAddressChange = (event: { target: { value: SetStateAction<string>; }; }) => {
    setInputAddress(event.target.value);
  };
  const [inputAmount, setInputAmount] = useState('');
  const handleAmountChange = (event: { target: { value: SetStateAction<string>; }; }) => {
    setInputAmount(event.target.value);
  };
  const [inputERC20ReceptionAddress, setInputERC20ReceptionAddress] = useState('');
  const handleERC20ReceptionAddressChange = (event: { target: { value: SetStateAction<string>; }; }) => {
    setInputERC20ReceptionAddress(event.target.value);
  };
  const [inputERC20Amount, setInputERC20Amount] = useState('');
  const handleERC20AmountChange = (event: { target: { value: SetStateAction<string>; }; }) => {
    setInputERC20Amount(event.target.value);
  };
  const [inputERC20TokenAddress, setInputERC20TokenAddress] = useState('');
  const handleERC20TokenChange = (event: { target: { value: SetStateAction<string>; }; }) => {
    setInputERC20TokenAddress(event.target.value);
  };
  const [inputERC20ReceptionAddressFirstBatch, setInputERC20ReceptionAddressFirstBatch] = useState('');
  const handleERC20ReceptionAddressFirstBatchChange = (event: { target: { value: SetStateAction<string>; }; }) => {
    setInputERC20ReceptionAddressFirstBatch(event.target.value);
  };
  const [inputERC20AmountFirstBatch, setInputERC20AmountFirstBatch] = useState('');
  const handleERC20AmountFirstBatchChange = (event: { target: { value: SetStateAction<string>; }; }) => {
    setInputERC20AmountFirstBatch(event.target.value);
  };
  const [inputERC20TokenAddressFirstBatch, setInputERC20TokenAddressFirstBatch] = useState('');
  const handleERC20TokenFirstBatchChange = (event: { target: { value: SetStateAction<string>; }; }) => {
    setInputERC20TokenAddressFirstBatch(event.target.value);
  };
  const [inputERC20ReceptionAddressSecondBatch, setInputERC20ReceptionAddressSecondBatch] = useState('');
  const handleERC20ReceptionAddressSecondBatchChange = (event: { target: { value: SetStateAction<string>; }; }) => {
    setInputERC20ReceptionAddressSecondBatch(event.target.value);
  };
  const [inputERC20AmountSecondBatch, setInputERC20AmountSecondBatch] = useState('');
  const handleERC20AmountSecondBatchChange = (event: { target: { value: SetStateAction<string>; }; }) => {
    setInputERC20AmountSecondBatch(event.target.value);
  };
  const [inputERC20TokenAddressSecondBatch, setInputERC20TokenAddressSecondBatch] = useState('');
  const handleERC20TokenSecondBatchChange = (event: { target: { value: SetStateAction<string>; }; }) => {
    setInputERC20TokenAddressSecondBatch(event.target.value);
  };
  const authenticateUser = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    setLoader(true)
    const idToken = await web3auth.authenticateUser();
    uiConsole(idToken);
  };

  const getUserInfo = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    setLoader(true)
    const user = await web3auth.getUserInfo();
    uiConsole(user);
  };
  const getChainId = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    setLoader(true)
    const rpc = new RPC(provider);
    const chainId = await rpc.getChainId();
    uiConsole(chainId);
  };
  const getAccounts = async () => {
    if (!miraiInstance) {
      uiConsole("MiraiInstance not initialized yet");
      return;
    }
    setLoader(true)
    const address = await miraiInstance.getCounterFactualAddress()
    uiConsole(address);
  };

  const getBalance = async () => {
    if (!miraiInstance) {
      uiConsole("MiraiInstance not initialized yet");
      return;
    }
    setLoader(true)
    const balance = await miraiInstance.getNativeBalance();
    uiConsole(balance);
  };

  const sendNativeTransaction = async () => {
    if (!miraiInstance) {
      uiConsole("provider not initialized yet");
      return;
    }
    setLoader(true)
    await miraiInstance.clearUserOpsFromBatch()
    await miraiInstance.addUserOpsToBatch({ to: inputAddress, value: utils.parseEther(inputAmount) })
    const op = await miraiInstance.estimate()
    const uoHash = await miraiInstance.send(op)
    let userOpsReceipt = null;
    const timeout = Date.now() + 60000; // 1 minute timeout
    while (userOpsReceipt == null && Date.now() < timeout) {
      await sleep(2);
      userOpsReceipt = await miraiInstance.getUserOpReceipt(uoHash);
    }
    uiConsole(userOpsReceipt);
  };

  const sendERC20Transaction = async () => {
    if (!miraiInstance) {
      uiConsole("provider not initialized yet");
      return;
    }
    setLoader(true)
    //initialize erc20 sdk instance
    const erc20 = miraiSDK.erc20(inputERC20TokenAddress)
    // clear any previous transactions in batch
    await miraiInstance.clearUserOpsFromBatch()
    // add erc20 transfer function to the batch
    const decimals = await erc20.decimals();

    await erc20.transfer(inputERC20ReceptionAddress, ethers.utils.parseUnits(inputERC20Amount, decimals))
    // estimate transactions added to the batch and get the fee data for the UserOp
    const op = await miraiInstance.estimate()
    // sign the UserOp and sending to the bundler...
    const uoHash = await miraiInstance.send(op)
    let userOpsReceipt = null;
    const timeout = Date.now() + 60000; // 1 minute timeout
    while (userOpsReceipt == null && Date.now() < timeout) {
      await sleep(2);
      userOpsReceipt = await miraiInstance.getUserOpReceipt(uoHash);
    }
    uiConsole(userOpsReceipt);
  };
  const sendERC20BatchTransaction = async () => {
    if (!miraiInstance) {
      uiConsole("provider not initialized yet");
      return;
    }
    setLoader(true)
    const FirstERC20 = miraiSDK.erc20(inputERC20TokenAddressFirstBatch)
    const SecondERC20 = miraiSDK.erc20(inputERC20TokenAddressSecondBatch)
    await miraiInstance.clearUserOpsFromBatch()
    const FirstDecimals = await FirstERC20.decimals();
    const SecondDecimals = await SecondERC20.decimals();
    await FirstERC20.transfer(inputERC20ReceptionAddressFirstBatch, ethers.utils.parseUnits(inputERC20AmountFirstBatch, FirstDecimals))
    await SecondERC20.transfer(inputERC20ReceptionAddressSecondBatch, ethers.utils.parseUnits(inputERC20AmountSecondBatch, SecondDecimals))
    const op = await miraiInstance.estimate()
    const uoHash = await miraiInstance.send(op)
    let userOpsReceipt = null;
    const timeout = Date.now() + 60000; // 1 minute timeout
    while (userOpsReceipt == null && Date.now() < timeout) {
      await sleep(2);
      userOpsReceipt = await miraiInstance.getUserOpReceipt(uoHash);
    }
    uiConsole(userOpsReceipt);
  };


  const getPrivateKey = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const privateKey = await rpc.getPrivateKey();
    uiConsole(privateKey);
  };

  function uiConsole(...args: any[]): void {
    setLoader(false)
    const el = document.querySelector("#console>p");
    if (el) {
      el.innerHTML = JSON.stringify(args || {}, null, 2);
    }
  }

  const sleep = (ms: any) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleMetaMaskLogin = async () => {
    console.log("handleMetaMaskLogin")
    const accounts = await sdk?.connect();
    console.log("accounts: ", accounts)
    const mappedProvider = new Web3WalletProvider(provider);
    await mappedProvider.refresh();
    const primeSdk = new PrimeSdk(mappedProvider, { chainId: 80001, projectKey: '' });
    console.log("primeSdk: ", primeSdk)
  }

  const loggedInView = (
    <>
      <div className="flex-container">
        <div>
          <button onClick={getUserInfo} className="card">
            Get User Info
          </button>
        </div>
        <div>
          <button onClick={authenticateUser} className="card">
            Get ID Token
          </button>
        </div>
        <div>
          <button onClick={getChainId} className="card">
            Get Chain ID
          </button>
        </div>
        <div>
          <button onClick={getAccounts} className="card">
            Get Accounts
          </button>
        </div>
        <div>
          <button onClick={getBalance} className="card">
            Get Balance
          </button>
        </div>
        <div>
          <input
            className="input-field"
            type="text"
            placeholder="To Address"
            value={inputAddress}
            onChange={handleAddressChange}
          />
          <input
            className="input-field"
            type="text"
            placeholder="Amount"
            value={inputAmount}
            onChange={handleAmountChange}
          />
          <button onClick={sendNativeTransaction} className="card">
            Send Native Token
          </button>
        </div>
        <div>
          <input
            className="input-field"
            type="text"
            placeholder="ERC20 Address"
            value={inputERC20TokenAddress}
            onChange={handleERC20TokenChange}
          />
          <input
            className="input-field"
            type="text"
            placeholder="To Address"
            value={inputERC20ReceptionAddress}
            onChange={handleERC20ReceptionAddressChange}
          />
          <input
            className="input-field"
            type="text"
            placeholder="Amount"
            value={inputERC20Amount}
            onChange={handleERC20AmountChange}
          />
          <button onClick={sendERC20Transaction} className="card">
            Send ERC20 Token
          </button>
        </div>
        <div>
          <input
            className="input-field"
            type="text"
            placeholder="First ERC20 Address"
            value={inputERC20TokenAddressFirstBatch}
            onChange={handleERC20TokenFirstBatchChange}
          />
          <input
            className="input-field"
            type="text"
            placeholder="First To Address"
            value={inputERC20ReceptionAddressFirstBatch}
            onChange={handleERC20ReceptionAddressFirstBatchChange}
          />
          <input
            className="input-field"
            type="text"
            placeholder="First Amount"
            value={inputERC20AmountFirstBatch}
            onChange={handleERC20AmountFirstBatchChange}
          />
          <input
            className="input-field"
            type="text"
            placeholder="Second ERC20 Address"
            value={inputERC20TokenAddressSecondBatch}
            onChange={handleERC20TokenSecondBatchChange}
          />
          <input
            className="input-field"
            type="text"
            placeholder="Second To Address"
            value={inputERC20ReceptionAddressSecondBatch}
            onChange={handleERC20ReceptionAddressSecondBatchChange}
          />
          <input
            className="input-field"
            type="text"
            placeholder="Second Amount"
            value={inputERC20AmountSecondBatch}
            onChange={handleERC20AmountSecondBatchChange}
          />
          <button onClick={sendERC20BatchTransaction} className="card">
            Send Batch ERC20 Token
          </button>
        </div>
        <div>
          <button onClick={getPrivateKey} className="card">
            Get Private Key
          </button>
        </div>
        <div>
          <button onClick={logout} className="card">
            Log Out
          </button>
        </div>
      </div>
      <ThreeDots
        height="80"
        width="80"
        radius="9"
        color="#4fa94d"
        ariaLabel="three-dots-loading"
        wrapperStyle={{}}
        visible={loader}
      />
      <div id="console" style={{ whiteSpace: "pre-line" }}>
        <p style={{ whiteSpace: "pre-line" }}>Logged in Successfully!</p>
      </div>
    </>
  );

  const unloggedInView = (
    <>
      <button onClick={login} className="card">
        Social Login
      </button>
      <button onClick={() => handleMetaMaskLogin()} className="card">
        MetaMask Login
      </button>
    </>
  );

  return (
    <div className="container">
      <nav className="bg-[#0F0114] font-inter flex flex-row  items-center justify-between  sticky top-0 z-10 text-white h-[5rem] px-10 xl:px-20 lg:px-20 md:px-10 2xl:justify-start xl:justify-start lg:justify-start md:justify-between sm:justify-between">
        <a href="/" className="flex-[0.4] flex flex-row items-center">
          <img src={logo} alt="kana-labs-logo" />
        </a>
      </nav>
      <h1 className="title">
        <a target="_blank" href="https://www.npmjs.com/package/@kanalabs/mirai" rel="noreferrer">
          Mirai-SDK
        </a>{" "}
        & ReactJS Example
      </h1>

      <div className="grid">{loggedIn ? loggedInView : unloggedInView}</div>

      <footer className="footer">
        <a
          href="https://github.com/kanalabs/mira-sdk-examples"
          target="_blank"
          rel="noopener noreferrer"
        >
          Source code
        </a>
      </footer>
    </div>
  );
}

export default App;
