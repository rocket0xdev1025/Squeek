import { useEffect, useMemo, useState } from "react";
import { apiGet, useQuery } from "./api";
import {
  ago,
  bps,
  describeEvent,
  formatDistance,
  formatInt,
  formatPercent,
  formatUnits,
  nextShowtime,
  percent,
  universalDay,
} from "./format";
import {
  Cube,
  Egg,
  Help,
  Hen,
  Lettering,
  OracleHamster,
  Panel,
  RangeTabs,
  SleepingHamster,
  SupplyEgg,
  useNow,
} from "./ui";

const RANGES = ["now", "24h", "7d", "30d"];

function mintAmount(page, range) {
  if (!page || page.status === "unavailable") return null;
  if (range === "now") return page.mining?.nextRound?.amountBaseUnits ?? "0";
  return page.mining?.rangeMintedBaseUnits ?? null;
}

export default function Home({ go }) {
  const now = useNow(15000);
  const status = useQuery("/v1/status", { refresh: 15000 });
  const core = useQuery("/v1/core", { refresh: 30000 });
  const mining = useQuery("/v1/mining/state", { refresh: 30000 });
  const [category, setCategory] = useState("all");
  const [intro, setIntro] = useState(() => localStorage.getItem("squeek-intro") !== "hidden");
  const [blockRange, setBlockRange] = useState("24h");
  const [mintRange, setMintRange] = useState("now");
  const [settlements, setSettlements] = useState({});
  const [stats, setStats] = useState(null);
  const [dream, setDream] = useState(0);
  const [henNote, setHenNote] = useState("");
  const events = useQuery(`/v1/events?category=${category === "hamster" ? "measurement" : category}&limit=40`, { refresh: 20000 });

  useEffect(() => {
    let stop = false;
    async function load() {
      const pages = await Promise.all(RANGES.map(async (range) => {
        try {
          return [range, await apiGet(`/v1/settlements?range=${range}`)];
        } catch {
          return [range, null];
        }
      }));
      if (!stop) setSettlements(Object.fromEntries(pages));
    }
    load();
    const id = window.setInterval(load, 60000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    let stop = false;
    apiGet("/v1/measurement/stats?range=30d")
      .then((data) => { if (!stop) setStats(data); })
      .catch(() => { if (!stop) setStats(null); });
    return () => { stop = true; };
  }, []);

  const feed = events.data?.events || [];
  const anchor = status.data?.builder?.anchor;
  const units = Number(core.data?.configuration?.blockUnitsPerBlock || 1_000_000_000);
  const progress = anchor ? (Number(anchor.blockProgress) / units) * 100 : null;
  const show = nextShowtime(22);
  const measurement = status.data?.measurement;
  const running = measurement && measurement.coreStatus && measurement.coreStatus !== "IDLE" && Number(measurement.rpmMilli) > 0;
  const collection = mining.data?.collection;
  const squeekCount = collection ? Number(collection.publicMinted) + Number(collection.reserveMinted) : null;
  const dreams = [
    stats?.lifetime?.observedDistanceMm
      ? { kicker: "LAST NIGHT HE RAN...", value: `${(Number(stats.lifetime.observedDistanceMm) / 1e6).toFixed(2)}KM` }
      : null,
    squeekCount
      ? { kicker: "HIS FAN CLUB", value: squeekCount.toLocaleString("en-US"), unit: "SQUEEKS" }
      : null,
    { kicker: "LIVE SQUEEKS!", value: formatInt(mining.data?.livePositionCount), unit: "STAKED" },
  ].filter(Boolean);
  const dreamLine = dreams[dream % Math.max(dreams.length, 1)] || { kicker: "OFF AIR", value: "—" };

  useEffect(() => {
    const id = window.setInterval(() => setDream((value) => value + 1), 7000);
    return () => window.clearInterval(id);
  }, []);

  const selectedSettlements = settlements[blockRange];
  const cards = selectedSettlements?.recentSettlements || [];
  const supply = mining.data?.issuance;
  const mintedPct = percent(supply?.tokenSupplyBaseUnits, supply?.supplyCapBaseUnits);
  const todayKey = universalDay(new Date(now));
  const days = stats?.activity?.days || [];
  const todayRow = days.find((day) => day.date === todayKey);
  const last7 = useMemo(() => {
    const sorted = [...days].sort((a, b) => a.date < b.date ? 1 : -1).slice(0, 7);
    return sorted.reduce((sum, day) => sum + Number(day.distanceMm || 0), 0);
  }, [days]);
  const window30 = Number(stats?.activity?.summary?.observedDistanceMm || 0);
  const lifetime = Number(stats?.lifetime?.observedDistanceMm || 0);
  const liveToday = Number(measurement?.distanceMm || 0);
  const checkpoints = (settlements["24h"]?.mining?.recentCheckpoints || []).slice(0, 7);
  const queue = status.data?.settlementQueue;
  const oracle = status.data?.oracle;

  const hideIntro = () => {
    setIntro(false);
    localStorage.setItem("squeek-intro", "hidden");
  };

  return (
    <div className="home">
      {intro ? (
        <section className="hero panel" aria-label="Join the hamster-powered internet economy">
          <button type="button" className="hide-intro" onClick={hideIntro}>Hide intro ×</button>
          <Lettering />
          <div className="hero-copy">
            <h1>Join the hamster-powered internet economy</h1>
            <p>Deposit a Squeek into Staking to schedule account power and earn $SQK after Mining activation.</p>
            <p>TBA</p>
            <div className="hero-actions">
              <a className="gold" href="/mint" onClick={(event) => { event.preventDefault(); go("/mint"); }}>Get test NFTs</a>
              <a className="text-link" href="#live" onClick={(event) => { event.preventDefault(); document.getElementById("live")?.scrollIntoView({ behavior: "smooth" }); }}>
                Learn more →
              </a>
            </div>
            <p className="fine">Test network only · 0 ETH plus gas · fixed test artwork seed</p>
          </div>
        </section>
      ) : (
        <button type="button" className="show-intro" onClick={() => { setIntro(true); localStorage.removeItem("squeek-intro"); }}>
          Show intro
        </button>
      )}

      <section className="live-grid" id="live" aria-label="Squeekchain live process">
        <div className={`stream ${running ? "on-air" : "off-air"}`}>
          <div className="stream-top">
            <div>
              <b>{running ? "ON AIR" : "OFF AIR"}</b>
              <h2>{running ? "SQUEEKTOSHI IS RUNNING" : "SQUEEKTOSHI IS SLEEPING"}</h2>
              <strong>{running ? `${(Number(measurement.rpmMilli) / 1000).toFixed(1)} RPM` : `${show.h}H ${String(show.m).padStart(2, "0")}M`}</strong>
              <em>LIVE BY 22:00 UTC</em>
              <span>{show.local} YOUR TIME</span>
            </div>
            <div className="dream">
              <p>{dreamLine.kicker}</p>
              <strong>{dreamLine.value}</strong>
              {dreamLine.unit ? <small>{dreamLine.unit}</small> : null}
            </div>
          </div>
          <SleepingHamster />
          <i className="moon" aria-hidden="true" />
        </div>

        <Panel className="activity" label="Activity">
          <header>
            <h2>Activity</h2>
            <span className="collapse" aria-hidden="true">–</span>
          </header>
          <div className="tabs" role="tablist">
            {[
              ["all", "All"],
              ["protocol", "Protocol"],
              ["players", "Players"],
              ["hamster", "Hamster"],
            ].map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={category === id} className={category === id ? "on" : ""} onClick={() => setCategory(id)}>
                {label}
              </button>
            ))}
          </div>
          <div className="feed" aria-live="polite">
            {events.loading && !feed.length ? <p className="empty">Loading activity<br />Reading confirmation-safe published events.</p> : null}
            {events.error && !feed.length ? <p className="empty">Activity unavailable</p> : null}
            {!events.loading && !feed.length && !events.error ? <p className="empty">No published events in this feed.</p> : null}
            <ol>
              {feed.map((event) => {
                const item = describeEvent(event);
                const body = (
                  <>
                    <i className={item.tone} />
                    <span>
                      <b>{item.title} · {item.action}</b>
                      {item.detail ? <small>{item.detail}</small> : null}
                    </span>
                    <time>{ago(event.occurredAt).toLowerCase()}</time>
                  </>
                );
                return (
                  <li key={event.id}>
                    {item.tx ? (
                      <a href={`https://sepolia.etherscan.io/tx/${item.tx}`} target="_blank" rel="noreferrer">{body}</a>
                    ) : (
                      <div>{body}</div>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </Panel>
      </section>

      <section className="trio">
        <Panel label="Block maker">
          <header className="card-head">
            <h2><i className="led ok" /> Block maker</h2>
            <Help label="About the Block Maker">Block height and in-block progress come from the published builder anchor. Nothing is inferred when that anchor is missing.</Help>
          </header>
          {anchor ? (
            <div className="maker">
              <div>
                <span>Block</span>
                <b>{formatInt(anchor.blockHeight)}</b>
                <span>Complete</span>
                <strong>{progress == null ? "—" : `${Math.round(progress)}%`}</strong>
              </div>
              <Cube percent={progress || 0} />
            </div>
          ) : (
            <p className="empty">Round assembly unavailable<br />No local block or progress value is inferred.</p>
          )}
        </Panel>
        <Panel label="Oracle">
          <header className="card-head">
            <h2><i className={`led ${oracle?.state === "accepted" ? "ok" : "wait"}`} /> Oracle</h2>
            <Help label="About the Oracle">Oracle state is the latest published validation. A missing record stays blank.</Help>
          </header>
          <div className="oracle">
            <OracleHamster />
            <p>{oracle ? `${oracle.state || "unknown"}${oracle.reason ? ` · ${oracle.reason}` : ""}` : "Oracle loading"}</p>
          </div>
        </Panel>
        <Panel label="Settlement queue">
          <header className="card-head">
            <h2><i className={`led ${queue?.status === "available" ? "ok" : "bad"}`} /> Settlement queue</h2>
            <Help label="About the Settlement Queue">Rewards follow the launch schedule and account power at round checkpoints, not per settlement batch.</Help>
          </header>
          <div className="queue-grid" aria-hidden="true">
            {Array.from({ length: 96 }, (_, index) => <i key={index} className={index === 37 && Number(queue?.buffered?.roundCount) > 0 ? "hot" : ""} />)}
          </div>
          <p className="queue-label">{queue?.state === "empty" ? "Waiting for blocks" : queue ? `${queue.state || queue.status}` : "Queue unavailable"}</p>
        </Panel>
      </section>

      <section className="panel settle-wrap" aria-label="Settled blocks">
        <header className="card-head spread">
          <h2>Settled blocks</h2>
          <RangeTabs value={blockRange} onChange={setBlockRange} label="Settled block range" />
          <Help label="About the Settled Blocks">Each card is a confirmed settlement: the Squeek block range and the SQK minted in that transaction.</Help>
        </header>
        <div className="settle-row">
          {cards.length ? cards.map((card) => (
            <a key={`${card.transactionHash}-${card.logIndex}`} className="settle-card" href={`https://sepolia.etherscan.io/tx/${card.transactionHash}`} target="_blank" rel="noreferrer">
              <span>Blocks {formatInt(card.firstCompletedBlock)}–{formatInt(card.lastCompletedBlock)}</span>
              <time>{ago(card.blockTimestamp)} ago</time>
              <b>{formatUnits(card.sqkMintedBaseUnits, 18, 4)} SQK minted</b>
              <small>{card.transactionHash.slice(0, 10)}…{card.transactionHash.slice(-4)} ↗</small>
            </a>
          )) : <p className="empty">Loading {blockRange.toUpperCase()} settlement history.</p>}
        </div>
      </section>

      <section className="split">
        <Panel label="SQK mint">
          <header className="card-head">
            <h2><i className="led ok" /> SQK mint</h2>
            <RangeTabs value={mintRange} onChange={setMintRange} label="SQK mint range" />
            <Help label="About the SQK Mint">Now is the open round. 24H, 7D and 30D are published mint totals for those windows.</Help>
          </header>
          <div className="mint-figures">
            {RANGES.map((range) => (
              <button key={range} type="button" className={mintRange === range ? "on" : ""} onClick={() => setMintRange(range)}>
                <span>{range.toUpperCase()}</span>
                <b>{formatUnits(mintAmount(settlements[range], range), 18, 0)} SQK</b>
              </button>
            ))}
          </div>
          <div className="hen-row">
            <button
              type="button"
              className="hen-btn"
              aria-label="Poke the hen: a stat about the latest rounds"
              onClick={() => {
                const latest = checkpoints[0];
                setHenNote(latest
                  ? `Rounds ${latest.afterRound}–${latest.throughRound} minted ${formatUnits(latest.amountBaseUnits, 18, 2)} SQK.`
                  : "No recent checkpoint is published.");
              }}
            >
              <Hen />
            </button>
            {checkpoints.map((item) => (
              <span key={`${item.transactionHash}-${item.throughRound}`} className="round-egg">
                <Egg value={formatInt(item.completedBlockCount)} />
                <small>Round</small>
                <b>{formatInt(item.throughRound)}</b>
                <time>{new Date(item.blockTimestamp).toISOString().slice(11, 16)} UTC</time>
              </span>
            ))}
          </div>
          {henNote ? <p className="hen-note">{henNote}</p> : null}
        </Panel>
        <Panel label="SQK supply">
          <header className="card-head">
            <h2>SQK supply</h2>
            <Help label="About the SQK Supply">Circulating is the published token supply. Total is the lifetime cap.</Help>
          </header>
          <div className="supply">
            <div>
              <span>Circulating</span>
              <b className="gold-num">{formatUnits(supply?.tokenSupplyBaseUnits, 18, 0)} SQK</b>
              <span>Total</span>
              <strong>{formatUnits(supply?.supplyCapBaseUnits, 18, 0)} SQK</strong>
            </div>
            <SupplyEgg percent={mintedPct || 0} />
            <em>{formatPercent(mintedPct)}</em>
          </div>
        </Panel>
      </section>

      <section className="panel dist" aria-label="Dist / range">
        <header className="dist-head">
          <div>
            <h2>Dist / range</h2>
            <p>Wheel distance sampler · four universal Squeek day windows</p>
          </div>
          <div className="dist-meta">
            <i className="led ok" />
            <span>Universal-day input · updated {ago(measurement?.observedAt).toLowerCase()} ago</span>
            <a href="/stats?range=30d" onClick={(event) => { event.preventDefault(); go("/stats?range=30d"); }}>Full stats</a>
          </div>
        </header>
        <div className="heat-label">
          <span>30D activity</span>
          <span>Each step = one elapsed universal Squeek day</span>
        </div>
        <div className="heat" aria-hidden="true">
          {(days.length ? [...days].sort((a, b) => (a.date < b.date ? -1 : 1)) : Array.from({ length: 30 }, () => null)).map((day, index) => {
            const coverage = day?.coverage?.coverageBps;
            const work = Number(day?.observedWorkUnits || day?.distanceMm || 0);
            const cls = !day ? "none" : day.date === todayKey ? "current" : coverage != null && Number(coverage) < 10000 ? "partial" : work > 0 ? "move" : "still";
            return <i key={day?.date || index} className={cls} title={day ? `${day.date}` : ""} />;
          })}
        </div>
        <ul className="legend">
          <li><i className="move" /> Movement</li>
          <li><i className="still" /> No movement</li>
          <li><i className="partial" /> Partial data</li>
          <li><i className="none" /> Unavailable</li>
          <li><i className="current" /> Current</li>
        </ul>
        <div className="windows">
          <Window kicker="CH 01" title="Today" note="Universal day" distance={liveToday} caption="Live input" foot="Universal-day odometer · signed" coverage={null} live />
          <Window kicker="CH 07" title="Last 7 days" note="7-day window" distance={last7} caption={`${formatPercent(bps(avgCoverage(days.slice(-7))), 1)} coverage`} foot="Measurement · observed" />
          <Window kicker="CH 30" title="Last 30 days" note="30-day window" distance={window30} caption={`${formatPercent(bps(stats?.activity?.coverage?.coverageBps), 1)} capture`} foot="Coverage · observed" />
          <Window kicker="CH ∞" title="All time" note="Lifetime total" distance={lifetime} caption={`${formatPercent(bps(stats?.lifetime?.coverageBps), 1)} capture`} foot={stats?.lifetime?.firstObservedAt ? `Since ${new Date(stats.lifetime.firstObservedAt).toLocaleString("en-US", { month: "short", year: "numeric" })} · complete` : "Lifetime · observed"} />
        </div>
      </section>
    </div>
  );
}

function avgCoverage(rows) {
  const vals = rows.map((row) => Number(row.coverage?.coverageBps)).filter((n) => Number.isFinite(n));
  if (!vals.length) return null;
  return vals.reduce((sum, n) => sum + n, 0) / vals.length;
}

function Window({ kicker, title, note, distance, caption, foot }) {
  const formatted = formatDistance(distance);
  return (
    <article>
      <header>
        <span>{kicker}</span>
        <small>{note}</small>
      </header>
      <h3>{title}</h3>
      <p className="distance"><b>{formatted.value}</b> <span>{formatted.unit}</span></p>
      <div className="meter"><i style={{ width: `${Number(distance) > 0 ? Math.min(100, 18 + Math.log10(Number(distance)) * 12) : 6}%` }} /></div>
      <small>{caption}</small>
      <em>{foot}</em>
    </article>
  );
}
