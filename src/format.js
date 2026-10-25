export function formatUnits(raw, decimals = 18, digits = 4) {
  if (raw == null || raw === "") return "—";
  const text = String(raw);
  const neg = text.startsWith("-");
  let value;
  try {
    value = BigInt(neg ? text.slice(1) : text);
  } catch {
    return "—";
  }
  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const frac = value % base;
  const wholeStr = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (digits <= 0 || frac === 0n) return `${neg ? "-" : ""}${wholeStr}`;
  const fracStr = frac.toString().padStart(decimals, "0").slice(0, digits).replace(/0+$/, "");
  return `${neg ? "-" : ""}${wholeStr}${fracStr ? `.${fracStr}` : ""}`;
}

export function formatInt(raw) {
  if (raw == null || raw === "") return "—";
  const n = Number(raw);
  if (!Number.isFinite(n)) return String(raw);
  return Math.round(n).toLocaleString("en-US");
}

export function shortAddr(addr) {
  if (!addr) return "—";
  const a = String(addr).toUpperCase();
  if (a.length < 12) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function ago(iso) {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "—";
  const s = Math.max(0, (Date.now() - then) / 1000);
  if (s < 60) return `${Math.floor(s)}S`;
  if (s < 3600) return `${Math.floor(s / 60)}M`;
  if (s < 86400) return `${Math.floor(s / 3600)}H`;
  return `${Math.floor(s / 86400)}D`;
}

export function percent(part, whole, digits = 2) {
  const p = Number(part);
  const w = Number(whole);
  if (!Number.isFinite(p) || !Number.isFinite(w) || w === 0) return null;
  return (p / w) * 100;
}

export function formatPercent(value, digits = 2) {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

export function formatDistance(mm) {
  const n = Number(mm);
  if (!Number.isFinite(n)) return { value: "—", unit: "" };
  const meters = n / 1000;
  if (Math.abs(meters) < 1000) return { value: meters.toLocaleString("en-US", { maximumFractionDigits: 0 }), unit: "M" };
  return { value: (n / 1e6).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), unit: "KM" };
}

export function bps(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n / 100;
}

export function describeEvent(event) {
  const p = event.payload || {};
  const tx = event.source?.transactionHash || null;
  const decimals = p.asset?.decimals ?? 18;
  switch (event.type) {
    case "system.mining_checkpointed":
      return {
        tone: "protocol",
        title: "SQKCHAIN",
        action: `FUNDED ROUNDS ${p.afterRound}–${p.throughRound}`,
        detail: `${formatInt(p.completedBlockCount)} BLOCKS · ${formatUnits(p.amountBaseUnits, decimals, 4)} SQK`,
        tx,
      };
    case "system.settlement_completed":
      return {
        tone: "protocol",
        title: "SQKCHAIN",
        action: `SETTLED ROUNDS ${p.previousSettledThroughRound}–${p.settledThroughRound}`,
        detail: `${formatInt(p.completedBlockCount)} BLOCKS · WORK ${formatInt(p.workAdded)}`,
        tx,
      };
    case "player.squeek_minted":
      return {
        tone: "player",
        title: shortAddr(p.owner),
        action: `DEPOSITED SQUEEK #${formatInt(p.tokenId)}`,
        detail: p.weight != null ? `BASE POWER ${formatInt(p.weight)}` : "WALLET · NEXT STAKE",
        tx,
      };
    case "player.squeeks_merged":
      return {
        tone: "player",
        title: shortAddr(p.owner),
        action: `MERGED SQUEEKS #${formatInt(p.survivorTokenId)} + #${formatInt(p.donorTokenId)}`,
        detail: `LEVEL ${p.level ?? "—"} · WALLET · NEXT MERGE`,
        tx,
      };
    case "player.rewards_claimed":
      return {
        tone: "player",
        title: shortAddr(p.owner),
        action: `CLAIMED ${formatUnits(p.amountBaseUnits, decimals, 2)} SQK`,
        detail: `${(p.tokenIds || []).length} SQUEEKS`,
        tx,
      };
    case "measurement.distance_milestone":
      return {
        tone: "hamster",
        title: "HAMSTER",
        action: `DISTANCE MILESTONE ${formatDistance(p.thresholdDistanceMm).value} ${formatDistance(p.thresholdDistanceMm).unit}`,
        detail: `LIFETIME ${formatDistance(p.observedLifetimeDistanceMm).value} ${formatDistance(p.observedLifetimeDistanceMm).unit}`,
        tx,
      };
    case "measurement.daily_distance_milestone":
      return {
        tone: "hamster",
        title: "HAMSTER",
        action: `DAY DISTANCE ${formatDistance(p.thresholdDistanceMm).value} ${formatDistance(p.thresholdDistanceMm).unit}`,
        detail: p.utcDate || "UNIVERSAL DAY",
        tx,
      };
    case "measurement.speed_milestone":
    case "measurement.speed_record":
      return {
        tone: "hamster",
        title: "HAMSTER",
        action: event.type.endsWith("record") ? "SPEED RECORD" : "SPEED MILESTONE",
        detail: `${((Number(p.observedSpeedMmPerSecond || p.recordMmPerSecond || 0) * 3.6) / 1000).toFixed(2)} KM/H`,
        tx,
      };
    case "measurement.distance_streak":
      return {
        tone: "hamster",
        title: "HAMSTER",
        action: `${p.days}-DAY DISTANCE STREAK`,
        detail: p.endingUtcDate || "UNIVERSAL DAYS",
        tx,
      };
    default: {
      const tone = event.type?.startsWith("player")
        ? "player"
        : event.type?.startsWith("measurement")
          ? "hamster"
          : "protocol";
      return {
        tone,
        title: tone === "player" ? shortAddr(p.owner) : tone === "hamster" ? "HAMSTER" : "SQKCHAIN",
        action: String(event.type || "EVENT").split(".").pop().replaceAll("_", " ").toUpperCase(),
        detail: "",
        tx,
      };
    }
  }
}

export function nextShowtime(hourUtc = 22) {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(hourUtc, 0, 0, 0);
  if (next.getTime() <= now.getTime()) next.setUTCDate(next.getUTCDate() + 1);
  const ms = next.getTime() - now.getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const local = next.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return { h, m, local, at: next };
}

export function universalDay(date = new Date()) {
  const d = new Date(date);
  if (d.getUTCHours() < 12) d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function isAddress(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(String(value || "").trim());
}
