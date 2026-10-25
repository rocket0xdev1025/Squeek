import { useEffect, useMemo, useState } from "react";
import { isAddress } from "./format";
import { Mark } from "./ui";
import Home from "./Home";
import { Mint, Squeeks, StatusPage, StatsPage } from "./pages";

const NAV = [
  { href: "/mint", label: "Mint" },
  { href: "/squeeks", label: "Your Squeeks" },
  { href: "/status", label: "Status" },
];

function readAddress() {
  try {
    const saved = localStorage.getItem("squeek-address") || "";
    return isAddress(saved) ? saved : "";
  } catch {
    return "";
  }
}

export default function App() {
  const [path, setPath] = useState(() => `${window.location.pathname}${window.location.search}`);
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || "light");
  const [address, setAddress] = useState(readAddress);
  const [picker, setPicker] = useState(false);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const onPop = () => setPath(`${window.location.pathname}${window.location.search}`);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("squeek-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!window.ethereum) return undefined;
    const onChange = (accounts) => {
      const next = accounts?.[0] || "";
      if (isAddress(next)) {
        setAddress(next);
        localStorage.setItem("squeek-address", next);
      } else {
        setAddress("");
        localStorage.removeItem("squeek-address");
      }
    };
    window.ethereum.on?.("accountsChanged", onChange);
    return () => window.ethereum.removeListener?.("accountsChanged", onChange);
  }, []);

  const go = (href) => {
    window.history.pushState({}, "", href);
    setPath(`${window.location.pathname}${window.location.search}`);
    window.scrollTo(0, 0);
  };

  const remember = (value) => {
    setAddress(value);
    if (value) localStorage.setItem("squeek-address", value);
    else localStorage.removeItem("squeek-address");
  };

  const connect = async () => {
    setNotice("");
    if (address) {
      remember("");
      return;
    }
    if (!window.ethereum) {
      setDraft("");
      setPicker(true);
      return;
    }
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }],
      }).catch(async (error) => {
        if (error?.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0xaa36a7",
              chainName: "Sepolia",
              nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
              rpcUrls: ["https://rpc.sepolia.org"],
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            }],
          });
        }
      });
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (isAddress(accounts?.[0])) remember(accounts[0]);
    } catch (error) {
      setNotice(error?.message || "Wallet connection was dismissed.");
    }
  };

  const page = useMemo(() => path.split("?")[0] || "/", [path]);

  let body = <Home go={go} />;
  if (page === "/mint") body = <Mint address={address} connect={connect} />;
  else if (page === "/squeeks") body = <Squeeks address={address} connect={connect} />;
  else if (page === "/status") body = <StatusPage />;
  else if (page === "/stats") body = <StatsPage search={path.includes("?") ? path.slice(path.indexOf("?")) : ""} />;

  return (
    <>
      <a className="skip" href="#main-content">Skip to content</a>
      <div className="chassis">
        <header className="topbar">
          <a className="brand" href="/" aria-label="Squeekchain home" onClick={(event) => { event.preventDefault(); go("/"); }}>
            <Mark />
          </a>
          <nav className="nav" aria-label="Primary navigation">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                aria-current={page === item.href ? "page" : undefined}
                onClick={(event) => { event.preventDefault(); go(item.href); }}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="top-actions">
            <button
              type="button"
              className="theme-switch"
              role="switch"
              aria-checked={theme === "light"}
              aria-label={`Theme ${theme}. Activate to change theme.`}
              onClick={() => setTheme((value) => (value === "light" ? "dark" : "light"))}
            >
              <i className={theme === "light" ? "sun" : "moon"} />
              <span>{theme}</span>
            </button>
            <button type="button" className="wallet-btn" onClick={connect}>
              <i />
              {address ? address.slice(0, 6) + "…" + address.slice(-4) : "Connect wallet"}
            </button>
          </div>
        </header>
        <main id="main-content">{body}</main>
        <footer className="site-foot">
          <span>Squeekchain public console</span>
          <span>Measurement · Oracle workflow · Ethereum settlement</span>
          <span>Published records only · never inferred</span>
        </footer>
      </div>
      {notice ? <div className="toast" role="status">{notice}</div> : null}
      {picker ? (
        <div className="modal-back" role="presentation" onClick={() => setPicker(false)}>
          <form
            className="modal"
            role="dialog"
            aria-labelledby="lookup-title"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              if (!isAddress(draft)) {
                setNotice("Enter a 0x address with 40 hex characters.");
                return;
              }
              remember(draft.trim());
              setPicker(false);
              go("/squeeks");
            }}
          >
            <h2 id="lookup-title">Read a public account</h2>
            <p>No injected wallet was found. Paste an address to load its published Squeeks. This console does not sign transactions.</p>
            <input
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="0x…"
              spellCheck="false"
              aria-label="Wallet address"
            />
            <div className="modal-actions">
              <button type="button" className="ghost" onClick={() => setPicker(false)}>Cancel</button>
              <button type="submit" className="gold">Look up</button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
