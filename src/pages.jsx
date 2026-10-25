import { useEffect, useState } from "react";
import { apiGet, useQuery } from "./api";
import {
  ago,
  bps,
  formatDistance,
  formatInt,
  formatPercent,
  formatUnits,
  isAddress,
  shortAddr,
} from "./format";
import { Help, Panel } from "./ui";

export function Mint({ address, connect }) {
  const mining = useQuery("/v1/mining/state", { refresh: 30000 });
  const collection = mining.data?.collection;
  const phase = collection?.phase || "unavailable";

  return (
    <div className="page mint-page">
      <p className="eyebrow">Squeeks / test network only</p>
      <header className="page-title">
        <h1>Get test NFTs</h1>
        <p>Claim existing Squeeks for testing the current staking and rewards system. This is not the production Genesis sale.</p>
      </header>
      <div className="stat-pills">
        <span><small>NFT cost</small><b>0 ETH</b></span>
        <span><small>Network fee</small><b>Gas only</b></span>
      </div>
      <div className="split">
        <Panel label="Test distribution">
          <header className="card-head">
            <h2>Test distribution</h2>
            <em className="pill">{phase === "closed" ? "Closed" : phase}</em>
          </header>
          <dl className="facts">
            <div><dt>Available</dt><dd>{collection ? formatInt(Math.max(0, Number(collection.publicAllocation) - Number(collection.publicMinted))) : "—"}</dd></div>
            <div><dt>Claimed globally</dt><dd>{collection ? formatInt(Number(collection.publicMinted) + Number(collection.reserveMinted)) : "—"}</dd></div>
            <div><dt>Public allocation</dt><dd>{formatInt(collection?.publicAllocation)}</dd></div>
            <div><dt>Lifetime cap shown</dt><dd>{formatInt(collection?.publicAllocation)}</dd></div>
          </dl>
          <p className="fine">Test artwork uses a fixed test seed, not a VRF reveal. NFTs already exist; a claim transfers them to the connected wallet.</p>
          <p className="fine">Wallet-held NFTs earn no account power by ownership. After claiming, open your account to deposit into Staking.</p>
        </Panel>
        <Panel label="Claim test NFTs">
          <header className="card-head"><h2>Claim test NFTs</h2></header>
          <p className="fine">Connected wallet / no ETH payment</p>
          {address ? (
            <>
              <p className="wallet-line">{shortAddr(address)} on Sepolia</p>
              <button type="button" className="gold" disabled>Read only</button>
              <p className="fine">This local console reads the public API. It does not simulate or submit a claim. Sign claims on sepolia.squeekchain.com.</p>
            </>
          ) : (
            <>
              <p className="wallet-line">Wallet required</p>
              <p className="fine">Connect on Sepolia to identify the account. Allowance checks stay on the official console.</p>
              <button type="button" className="gold" onClick={connect}>Connect wallet</button>
            </>
          )}
        </Panel>
      </div>
      <Panel label="Your test NFT transactions">
        <header className="card-head">
          <h2>Your test NFT transactions</h2>
          <Help label="About test NFT transactions">Receipt-proven transfers, not predicted token IDs. Published NFTs appear in your account.</Help>
        </header>
        <p className="empty">No unconfirmed test claims. Published NFTs appear in your account.</p>
      </Panel>
    </div>
  );
}

export function Squeeks({ address, connect }) {
  const [tab, setTab] = useState("portfolio");
  const [page, setPage] = useState(null);
  const [activity, setActivity] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [extra, setExtra] = useState([]);

  useEffect(() => {
    if (!isAddress(address)) {
      setPage(null);
      setActivity(null);
      setExtra([]);
      setCursor(null);
      return undefined;
    }
    let stop = false;
    setLoading(true);
    setError("");
    const owner = address.toLowerCase();
    Promise.all([
      apiGet(`/v1/owners/${owner}/squeeks?limit=24`),
      apiGet(`/v1/owners/${owner}/activity?limit=20`),
    ]).then(([squeeks, history]) => {
      if (stop) return;
      setPage(squeeks);
      setCursor(squeeks.nextCursor || null);
      setExtra([]);
      setActivity(history);
    }).catch((err) => {
      if (!stop) setError(err.body?.reason || err.message || "Account unavailable");
    }).finally(() => { if (!stop) setLoading(false); });
    return () => { stop = true; };
  }, [address]);

  const positions = [...(page?.positions || []), ...extra];

  return (
    <div className="page">
      <header className="page-title row-title">
        <div>
          <p className="eyebrow">{address ? shortAddr(address) : "—"}</p>
          <h1>Your Squeeks</h1>
        </div>
        <div className="tabs" role="tablist">
          {["portfolio", "rewards", "activity"].map((id) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
              {id}
            </button>
          ))}
        </div>
      </header>

      {!address ? (
        <Panel>
          <h2>Account unavailable</h2>
          <p>Connect a wallet to view its account ledger and NFT custody.</p>
          <p className="fine">No cached account is displayed. Confirmed indexed projection · no browser reward ledger.</p>
          <button type="button" className="gold" onClick={connect}>Connect wallet</button>
        </Panel>
      ) : null}

      {address && loading ? <p className="empty">Loading the published account…</p> : null}
      {error ? <p className="empty">{error}</p> : null}

      {address && page?.status === "available" && tab === "portfolio" ? (
        <>
          <div className="summary-row">
            <Stat label="Squeeks" value={formatInt(page.summary?.positionCount)} />
            <Stat label="Active power" value={formatInt(page.summary?.activeWeight)} />
            <Stat label="Claimable" value={`${formatUnits(page.summary?.claimableBaseUnits, 18, 2)} SQK`} />
            <Stat label="Earned" value={`${formatUnits(page.summary?.earnedBaseUnits, 18, 2)} SQK`} />
          </div>
          <div className="squeek-grid">
            {positions.map((position) => (
              <article key={position.tokenId} className="squeek-card panel">
                <Identicon id={position.tokenId} />
                <header>
                  <b>#{formatInt(position.tokenId)}</b>
                  <span>Lv {position.level}</span>
                </header>
                <dl>
                  <div><dt>Power</dt><dd>{formatInt(position.activeWeight)}</dd></div>
                  <div><dt>Claimable</dt><dd>{formatUnits(position.claimableBaseUnits, 18, 2)}</dd></div>
                  <div><dt>Merge</dt><dd>{position.mergeState}</dd></div>
                </dl>
              </article>
            ))}
          </div>
          {cursor ? (
            <button
              type="button"
              className="ghost more"
              onClick={async () => {
                const next = await apiGet(`/v1/owners/${address.toLowerCase()}/squeeks?limit=24&cursor=${encodeURIComponent(cursor)}`);
                setExtra((current) => [...current, ...(next.positions || [])]);
                setCursor(next.nextCursor || null);
              }}
            >
              Load more
            </button>
          ) : null}
        </>
      ) : null}

      {address && page?.status === "available" && tab === "rewards" ? (
        <Panel label="Rewards">
          <div className="summary-row">
            <Stat label="Claimable now" value={`${formatUnits(page.summary?.claimableBaseUnits, 18, 4)} SQK`} />
            <Stat label="Earned, 7 days" value={`${formatUnits(page.summary?.earnedSevenDayBaseUnits, 18, 2)} SQK`} />
            <Stat label="Earned, this owner" value={`${formatUnits(page.summary?.earnedBaseUnits, 18, 2)} SQK`} />
          </div>
          <div className="bars">
            {(page.earnings || []).map((row) => {
              const max = Math.max(...page.earnings.map((item) => Number(item.earnedBaseUnits)), 1);
              return (
                <div key={row.date}>
                  <i style={{ height: `${Math.max(4, (Number(row.earnedBaseUnits) / max) * 100)}%` }} />
                  <span>{row.date.slice(5)}</span>
                  <b>{formatUnits(row.earnedBaseUnits, 18, 0)}</b>
                </div>
              );
            })}
          </div>
          <p className="fine">Claimable SQK is the published figure at the safe block, about 12 confirmations behind the chain head.</p>
        </Panel>
      ) : null}

      {address && tab === "activity" ? (
        <Panel label="Account activity">
          <ol className="history">
            {(activity?.activity || []).map((item) => (
              <li key={item.id}>
                <b>{item.kind}</b>
                <span>{(item.tokenIds || []).map((id) => `#${formatInt(id)}`).join(" + ") || "—"}</span>
                <small>{item.amountBaseUnits ? `${formatUnits(item.amountBaseUnits, 18, 2)} SQK` : item.level ? `Level ${item.level}` : ""}</small>
                <a href={`https://sepolia.etherscan.io/tx/${item.source?.transactionHash}`} target="_blank" rel="noreferrer">{ago(item.source?.blockTimestamp).toLowerCase()}</a>
              </li>
            ))}
          </ol>
          {!activity?.activity?.length && !loading ? <p className="empty">No published account history.</p> : null}
        </Panel>
      ) : null}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function Identicon({ id }) {
  const n = Number(id) || 1;
  const cells = Array.from({ length: 25 }, (_, index) => ((n * (index + 3) * 17) % 7) > 2);
  return (
    <span className="ident" aria-hidden="true">
      {cells.map((on, index) => <i key={index} className={on ? "on" : ""} />)}
    </span>
  );
}

export function StatusPage() {
  const status = useQuery("/v1/status", { refresh: 10000 });
  const mining = useQuery("/v1/mining/state", { refresh: 30000 });
  const data = status.data;
  const measurement = data?.measurement;
  const speed = measurement ? (Number(measurement.speedMmPerSecond) * 3.6) / 1000 : null;

  return (
    <div className="page">
      <header className="page-title">
        <p className="eyebrow">Sepolia pipeline</p>
        <h1>Status</h1>
        <p>Live measurement, the block builder, Oracle validation and the settlement queue. Polled from the public status record.</p>
      </header>
      {status.error && !data ? <p className="empty">Status unavailable. {status.error.message}</p> : null}
      <div className="summary-row">
        <Stat label="Freshness" value={measurement?.freshness || "—"} />
        <Stat label="Wheel" value={measurement?.coreStatus || "—"} />
        <Stat label="Speed" value={speed == null ? "—" : `${speed.toFixed(2)} km/h`} />
        <Stat label="RPM" value={measurement ? (Number(measurement.rpmMilli) / 1000).toFixed(2) : "—"} />
      </div>
      <div className="trio">
        <Panel label="Measurement">
          <h2>Measurement</h2>
          <dl className="facts">
            <div><dt>Observed</dt><dd>{measurement?.observedAt ? new Date(measurement.observedAt).toLocaleString() : "—"}</dd></div>
            <div><dt>Provenance</dt><dd>{measurement?.provenance || "—"}</dd></div>
            <div><dt>Work units</dt><dd>{formatInt(measurement?.cumulativeWorkUnits)}</dd></div>
            <div><dt>Distance</dt><dd>{formatDistance(measurement?.distanceMm).value} {formatDistance(measurement?.distanceMm).unit}</dd></div>
          </dl>
        </Panel>
        <Panel label="Builder">
          <h2>Block maker</h2>
          <dl className="facts">
            <div><dt>Status</dt><dd>{data?.builder?.status || "—"}</dd></div>
            <div><dt>Block</dt><dd>{formatInt(data?.builder?.anchor?.blockHeight)}</dd></div>
            <div><dt>Settled round</dt><dd>{formatInt(data?.builder?.anchor?.settledThroughRound)}</dd></div>
            <div><dt>Queue</dt><dd>{data?.settlementQueue?.state || data?.settlementQueue?.status || "—"}</dd></div>
          </dl>
        </Panel>
        <Panel label="Oracle">
          <h2>Oracle</h2>
          <dl className="facts">
            <div><dt>State</dt><dd>{data?.oracle?.state || "—"}</dd></div>
            <div><dt>Reason</dt><dd>{data?.oracle?.reason || "—"}</dd></div>
            <div><dt>Accepted</dt><dd>{data?.oracle?.latestAcceptedAt ? ago(data.oracle.latestAcceptedAt).toLowerCase() + " ago" : "—"}</dd></div>
            <div><dt>Signer</dt><dd>{data?.signer?.kind || "—"}</dd></div>
          </dl>
        </Panel>
      </div>
      <Panel label="Indexed chain">
        <h2>Indexed chain</h2>
        <dl className="facts facts-wide">
          <div><dt>Chain</dt><dd>{mining.data?.chain?.target || "sepolia"} · {mining.data?.chain?.chainId || "11155111"}</dd></div>
          <div><dt>Safe block</dt><dd>{formatInt(mining.data?.chain?.safeThroughBlock)}</dd></div>
          <div><dt>SQK minted</dt><dd>{formatUnits(mining.data?.issuance?.tokenSupplyBaseUnits, 18, 2)}</dd></div>
          <div><dt>Collection</dt><dd>{mining.data?.collection?.phase || "—"} · {formatInt(mining.data?.collection?.publicMinted)} / {formatInt(mining.data?.collection?.publicAllocation)}</dd></div>
          <div><dt>Core</dt><dd className="mono">{mining.data?.identities?.core || "—"}</dd></div>
          <div><dt>Mining</dt><dd className="mono">{mining.data?.identities?.mining || "—"}</dd></div>
        </dl>
      </Panel>
      {data?.modules?.length ? (
        <Panel label="Modules">
          <h2>Modules</h2>
          <ul className="modules">
            {data.modules.map((mod) => (
              <li key={mod.instanceId}>
                <b>{mod.instanceId}</b>
                <span>{mod.moduleType}</span>
                <em>{mod.state}</em>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}

export function StatsPage({ search }) {
  const initial = new URLSearchParams(search).get("range") === "7d" ? "7d" : "30d";
  const [range, setRange] = useState(initial);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stop = false;
    setLoading(true);
    setError("");
    apiGet(`/v1/measurement/stats?range=${range}`)
      .then((body) => { if (!stop) setData(body); })
      .catch((err) => { if (!stop) setError(err.body?.error || err.message || "Stats unavailable"); })
      .finally(() => { if (!stop) setLoading(false); });
    return () => { stop = true; };
  }, [range]);

  const summary = data?.activity?.summary;
  const days = [...(data?.activity?.days || [])].sort((a, b) => (a.date < b.date ? -1 : 1));
  const maxWork = Math.max(...days.map((day) => Number(day.observedWorkUnits || 0)), 1);

  return (
    <div className="page">
      <header className="page-title row-title">
        <div>
          <p className="eyebrow">Measurement statistics</p>
          <h1>Full stats</h1>
          <p>Accepted rounds and confirmed settlements. Days run from 12:00 UTC to 12:00 UTC.</p>
        </div>
        <div className="range-tabs" role="group" aria-label="Stats range">
          {["7d", "30d"].map((item) => (
            <button key={item} type="button" className={range === item ? "on" : ""} aria-pressed={range === item} onClick={() => setRange(item)}>
              {item.toUpperCase()}
            </button>
          ))}
        </div>
      </header>
      {loading ? <p className="empty">Loading {range} statistics…</p> : null}
      {error ? <p className="empty">{error}</p> : null}
      {data ? (
        <>
          <div className="summary-row">
            <Stat label="Distance" value={`${formatDistance(summary?.observedDistanceMm).value} ${formatDistance(summary?.observedDistanceMm).unit}`} />
            <Stat label="Work units" value={formatInt(summary?.observedWorkUnits)} />
            <Stat label="Active days" value={formatInt(summary?.activeDayCount)} />
            <Stat label="Coverage" value={formatPercent(bps(data.activity?.coverage?.coverageBps), 1)} />
          </div>
          <Panel label="Daily distance">
            <h2>Daily work</h2>
            <div className="day-chart">
              {days.map((day) => (
                <div key={day.date} title={`${day.date}: ${formatDistance(day.distanceMm).value} ${formatDistance(day.distanceMm).unit}`}>
                  <i style={{ height: `${Math.max(4, (Number(day.observedWorkUnits || 0) / maxWork) * 100)}%` }} />
                  <span>{day.date.slice(8)}</span>
                </div>
              ))}
            </div>
          </Panel>
          <div className="split">
            <Panel label="Records">
              <h2>Records</h2>
              <dl className="facts">
                {Object.entries(data.records || {}).map(([key, record]) => (
                  <div key={key}>
                    <dt>{key.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`)}</dt>
                    <dd>{record?.value != null ? formatInt(record.value) : "—"}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
            <Panel label="Rounds">
              <h2>Rounds</h2>
              <dl className="facts">
                <div><dt>Observed</dt><dd>{formatInt(data.rounds?.observedCount)}</dd></div>
                <div><dt>Active</dt><dd>{formatInt(data.rounds?.activeCount)}</dd></div>
                <div><dt>Zero work</dt><dd>{formatInt(data.rounds?.zeroWorkCount)}</dd></div>
                <div><dt>Missing</dt><dd>{formatInt(data.rounds?.missingCount)}</dd></div>
                <div><dt>Active rate</dt><dd>{formatPercent(bps(data.rounds?.activeRateBps), 1)}</dd></div>
                <div><dt>Lifetime distance</dt><dd>{formatDistance(data.lifetime?.observedDistanceMm).value} {formatDistance(data.lifetime?.observedDistanceMm).unit}</dd></div>
              </dl>
            </Panel>
          </div>
        </>
      ) : null}
    </div>
  );
}
