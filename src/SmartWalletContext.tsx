import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Web3AuthNoModal } from "@web3auth/no-modal"
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import {
  ADAPTER_EVENTS,
  CHAIN_NAMESPACES,
  CONNECTED_EVENT_DATA,
  SafeEventEmitterProvider,
  WALLET_ADAPTERS,
} from "@web3auth/base";

import { initializeSdkGateway, NetworkNames, SDKGateway } from "@kanalabs/mirai";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";

export enum ConnectType {
  METAMASK,
  WALLETCONNECT,
}

export type Provider = any;

interface ISmartWalletProviderContext {
  web3auth?: any;
  provider?: any;
  miraiInstance?: any;
  miraiSDK?: any;
  login(): void;
  logout(): void;
  loggedIn?:any
}

const SmartWalletProviderContext = createContext<ISmartWalletProviderContext>({
  web3auth: undefined,
  provider: undefined,
  miraiInstance: undefined,
  miraiSDK: undefined,
  login: () => { },
  logout: () => { },
  loggedIn: undefined,
  
});
const clientId =
  "BF9kV1RUBEYObO85oLRPtC2yg7qois7kiRm2oQZCZtzDUE8Afrff21bAbFGVM1x8IJWiYInrdJAE9zsmQBLE5NY"; // get from https://dashboard.web3auth.io
export const SmartWalletProvider = ({ children }: { children: ReactNode }) => {
  const [web3auth, setWeb3auth] = useState<Web3AuthNoModal | null>(null);
  const [provider, setProvider] = useState<SafeEventEmitterProvider | null>(null);
  const [miraiSDK, setMiraiSDK] = useState<SDKGateway | null>(null);
  const [miraiInstance, setMiraiInstance] = useState<any | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(false);


  useEffect(() => {
    const init = async () => {
      try {
        const chainConfig = {
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          chainId: "0x89",
          rpcTarget: "https://polygon-mainnet.nodereal.io/v1/5a91ee76b3fc4f31b38aa3130d0ae3c8",
          displayName: "Polygon Mainnet",
          blockExplorer: "https://polygonscan.com",
          ticker: "MATIC",
          tickerName: "Polygon",
        };
        const web3auth = new Web3AuthNoModal({
          clientId,
          chainConfig,
          web3AuthNetwork: "mainnet",
        });

        const privateKeyProvider = new EthereumPrivateKeyProvider({
          config: { chainConfig },
        });
        
        const openloginAdapter = new OpenloginAdapter({
          adapterSettings: {
            network: "mainnet",
            clientId: clientId,
          },
          loginSettings: {
            mfaLevel: "none",
          },
          privateKeyProvider,
        });
        web3auth.configureAdapter(openloginAdapter);
        web3auth.on(ADAPTER_EVENTS.CONNECTED, async () => {
          setLoggedIn(true);
          const sdk = await initializeSdkGateway(
            {
              privateKey: formatPrivateKey(await web3auth.provider?.request({
                method: 'private_key',
              })),
            },
            [NetworkNames.Polygon]
          )
          const instance = sdk.setCurrentInstance(NetworkNames.Polygon)
          setMiraiSDK(sdk)
          setMiraiInstance(instance)
        });
        setWeb3auth(web3auth);
        await web3auth.init();

        setProvider(web3auth.provider);
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, []);


  function formatPrivateKey(privateKey: any): string {
    if (privateKey.startsWith('0x')) {
      return privateKey;
    } else {
      return '0x' + privateKey;
    }
  }
  const login = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    const web3authProvider = await web3auth.connectTo(
      WALLET_ADAPTERS.OPENLOGIN,
      {
        loginProvider: "google",
      }
    );
    setProvider(web3authProvider);
    setLoggedIn(true);
  };
  
  const logout = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    await web3auth.logout();
    await miraiSDK?.destroy();
    setProvider(null);
    setLoggedIn(false);
  };
  function uiConsole(...args: any[]): void {
    const el = document.querySelector("#console>p");
    if (el) {
      el.innerHTML = JSON.stringify(args || {}, null, 2);
    }
  }
  const sleep = (ms: any) => new Promise((resolve) => setTimeout(resolve, ms));




  const contextValue = useMemo(
    () => ({
      web3auth,
      provider,
      miraiInstance,
      miraiSDK,
      login,
      logout,
      loggedIn
    }),
    [
      web3auth,
      provider,
      miraiInstance,
      miraiSDK,
      login,
      logout,
      loggedIn
    ]
  );

  return (
    <SmartWalletProviderContext.Provider value={contextValue}>
      {children}
    </SmartWalletProviderContext.Provider>
  );
};

export const useSmartWalletProvider = () => {
  return useContext(SmartWalletProviderContext);
};
