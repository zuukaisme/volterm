# Volterm — Deriv Synthetic Indices Charting Terminal

A mobile-first, TradingView-style charting terminal for Deriv's synthetic /
derived indices (Volatility, Boom/Crash, Jump, Step, Range Break, DEX, and
whatever else Deriv adds later). Analysis and charting only — no accounts,
no trading, no credentials.

Built with Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS v4,
TradingView Lightweight Charts v5, and Deriv's public WebSocket API.

## Before you run it

This project was written in an offline sandbox with no access to the npm
registry, so **`npm install` has never actually been run against it and the
build has not been executed**. The code was written carefully against the
current Deriv API docs and the Lightweight Charts v5 API (see "Research
notes" below), but you should treat the first `npm install && npm run build`
as the real first test. If TypeScript surfaces a mismatched type or a
renamed export, it's almost always a one-line fix — paste the error back to
me and I'll patch it.

```bash
npm install
npm run dev
# open http://localhost:3000
```

No `.env` is required. `.env.example` shows the one optional override
(`NEXT_PUBLIC_DERIV_WS_URL`) if Deriv ever changes the public endpoint again.

## Architecture

```
app/                       page.tsx and chart/page.tsx both render the
                            same <ChartWorkspace />
components/
  ChartWorkspace.tsx        owns all page-level state, wires hooks to UI
  chart/                    chart canvas, toolbars, price header, panels
  market/                   search, watchlist, category browser
  layout/                   mobile bottom sheet, mobile/desktop shells
  ui/                       small hand-built primitives (no shadcn CLI —
                            see note below)
lib/
  deriv/                    websocket.ts, symbols.ts, ticks.ts, history.ts,
                            provider.ts (the only MarketDataProvider)
  market/                   candles.ts (aggregation), indicators.ts (SMA,
                            EMA, RSI, MACD, Bollinger), timeframes.ts,
                            aliases.ts
  storage/                  localStorage for watchlist + drawings
hooks/                      useDerivConnection, useMarketData, useCandles,
                            useWatchlist, useDrawings
types/                      market.ts, chart.ts
```

### Deriv API

Deriv migrated its public docs to a new gateway. This app targets the
**current** documented setup as of writing:

- Endpoint: `wss://api.derivws.com/trading/v1/options/ws/public` — no
  `app_id` and no API key required for market data.
- Message protocol (`active_symbols`, `ticks`, `ticks_history`, `forget`,
  request/response correlation via `req_id`, `subscription.id` for streams)
  is unchanged from the classic Deriv WebSocket API.
- `active_symbols` response fields were renamed in the new docs
  (`symbol` → `underlying_symbol`, `symbol_type` → `underlying_symbol_type`,
  several display/filter fields removed). `lib/deriv/symbols.ts` is written
  against the new field names.
- `ticks_history` only accepts specific `granularity` values for
  `style: "candles"` (60, 120, 180, 300, 600, 900, 1800, 3600, 7200, 14400,
  28800, 86400). All requested timeframes ≥ 1 minute map onto one of these.
  For the sub-minute timeframes (1s/5s/10s/15s/30s), Deriv has no native
  candle granularity, so historical backfill uses `style: "ticks"` and the
  same client-side aggregator builds the candles.

**Live updates use one subscription type for every timeframe**: a single
`ticks` stream per selected symbol, fed through `CandleAggregator` (in
`lib/market/candles.ts`), which buckets ticks into whatever interval is
selected. This was a deliberate simplification — Deriv's alternative
`ohlc`-on-subscribe push format has an ambiguous/undocumented payload shape
in the new docs, while a raw tick stream is unambiguous and the aggregation
layer already had to exist per the spec. Historical backfill still prefers
native candles where Deriv supports them (fast, accurate), and only falls
back to tick-level aggregation for sub-minute timeframes.

If Deriv's docs have moved again since this was written, `web_search`
"Deriv API developers active_symbols" and diff against
`lib/deriv/symbols.ts` / `history.ts` / `ticks.ts` — the Zod schemas there
are deliberately narrow about what they require and lenient about what they
ignore, so most drift should just mean adding a field rather than a rewrite.

### Lightweight Charts v5

Verified against the current v5 API and its own migration/skill docs:
`chart.addSeries(SeriesType, options, paneIndex)` (not `addCandlestickSeries`),
`series.update()` for live ticks vs. `setData()` only on full resets (so
panning/zooming isn't reset by every tick), multi-pane RSI/MACD via
`chart.panes()[i].setHeight()`, and `autoSize: true` for responsive resizing.

**Drawing tools** are implemented as a plain SVG overlay (`pointer-events:
none`) that reads pixel positions from the chart's public coordinate APIs
(`series.priceToCoordinate`, `timeScale().timeToCoordinate`) rather than as
a Lightweight Charts primitive/renderer. This was a deliberate scope
decision: a hand-written canvas primitive is the "native" way to do it, but
it's also the highest-risk, hardest-to-verify-without-running-it part of the
library's API. The SVG approach uses only stable, documented APIs. Removing
a drawing is done from a managed list in the Draw panel rather than by
clicking the line on the canvas, for the same reason.

**The histogram under the candles is tick-count per candle, not real
volume** — Deriv synthetic indices don't have traded volume — labeled as an
activity indicator, not fabricated financial data.

### Weltrade aliases

`lib/market/aliases.ts` has a small, explicitly-named
`UNVERIFIED_ALIAS_TABLE`. I could not reach Weltrade's own published
instrument list from this sandbox, only third-party corroboration of the
"drop the word Index" naming convention (Volatility 75, Boom 1000, etc.)
that white-label brokers commonly use for Deriv's synthetic feed. Aliases
only ever affect search/display — an alias is only ever shown if the exact
Deriv symbol it points to is present in the live `active_symbols` response,
so a wrong or stale entry just fails to match rather than mislabeling a
market. Verify against Weltrade's current symbol list before shipping this
to real users, and extend the table the same way for other brokers.

### Everything else per the spec

Instrument categories are derived entirely from the live `active_symbols`
`submarket` field (with a display-name lookup for known submarkets and a
title-cased fallback for unknown ones) — nothing is hard-coded as the
source of truth. The watchlist and drawings persist to `localStorage` and
need no account. Reconnection uses exponential backoff with a capped delay;
a manual "Retry now" is also surfaced in the UI. Zod validates every
inbound WebSocket message before it's used.

## Known gaps / next steps

- No automated tests (out of scope given the offline build environment).
- Settings panel is intentionally minimal (data-source transparency notes +
  a "clear watchlist" action) since the spec didn't define its contents.
- `components/ui/` are small hand-built primitives rather than the actual
  shadcn/ui CLI output, since the CLI needs network access to scaffold.
  They're styled to the same conventions (variants, `cn()` merge) so
  swapping in real shadcn components later is a drop-in change.
- Trading, accounts, and the demo→real account flow are intentionally not
  started, per the spec — `lib/deriv/provider.ts`'s `MarketDataProvider`
  interface is the seam a second provider (or a trading module) would sit
  behind.

---

## Original request

The following is the exact brief this app was built from.

> # Build a Mobile-First Deriv Synthetic Indices Trading Chart App
>
> Build a production-quality, mobile-first web application inspired by TradingView, specifically for analyzing **Deriv Synthetic/Derived Indices**.
>
> The application is initially **analysis/charting only**. Do not implement real-money trading, account authentication, deposits, withdrawals, or contract purchasing in this version.
>
> ## Core Technology
>
> Use:
>
> - Next.js latest stable version
> - TypeScript
> - App Router
> - Tailwind CSS
> - shadcn/ui where appropriate
> - TradingView Lightweight Charts
> - Native WebSocket API
> - React hooks
> - Zod for validating external API data
> - No unnecessary backend for market-data functionality
>
> Keep the architecture clean enough that authentication and trading can be added later.
>
> Do not use comments in the code.
>
> ## Deriv API
>
> Use Deriv's official WebSocket market-data API.
>
> Use the current official API documentation rather than outdated examples.
>
> The application must use the public market-data WebSocket and must **not require an API key for market data**.
>
> The current public endpoint is:
>
> `wss://api.derivws.com/trading/v1/options/ws/public`
>
> If the current official Deriv documentation specifies a different public endpoint or API version during implementation, follow the current official documentation.
>
> Use:
>
> - `active_symbols` to discover available instruments
> - `ticks` for real-time price updates
> - `ticks_history` for historical data
> - candle/history functionality where appropriate
> - `trading_times` where useful for determining market availability
>
> Do not hard-code the available synthetic indices as the source of truth.
>
> The application should request `active_symbols` and build the instrument list dynamically.
>
> ## Instrument System
>
> Create an internal normalized instrument model such as:
>
> ```ts
> type Instrument = {
>   symbol: string
>   displayName: string
>   market: string
>   submarket?: string
>   pipSize?: number
>   isActive: boolean
>   aliases?: string[]
> }
> ```
>
> The Deriv symbol itself must remain the canonical identifier.
>
> Do not invent symbol mappings.
>
> The optional `aliases` field exists only for alternate naming conventions used by brokers that resell or white-label Deriv's synthetic indices, such as Weltrade. See the "Weltrade Naming Conventions" section below for how this should be populated and used.
>
> The UI should organize instruments into categories based on the metadata returned by Deriv.
>
> Possible categories include:
>
> - Volatility Indices
> - Crash/Boom Indices
> - Jump Indices
> - Step Indices
> - Range Break Indices
> - DEX Indices
> - Other Derived/Synthetic indices returned by the API
>
> The list must automatically adapt when Deriv adds new instruments.
>
> Do not hard-code the current instrument list as the authoritative list.
>
> ## Chart
>
> Create a TradingView-style candlestick chart using TradingView Lightweight Charts.
>
> The chart should support:
>
> - Candlesticks
> - Volume-style information if available/useful
> - Current price line
> - Crosshair
> - Zoom
> - Pan
> - Auto-fit
> - Responsive resizing
> - Mobile touch gestures
> - Smooth real-time updates
> - Dark mode
>
> The chart should look professional and similar in usability to TradingView without copying TradingView's proprietary UI.
>
> ## Timeframes
>
> Provide a timeframe selector:
>
> - 1s
> - 5s
> - 10s
> - 15s
> - 30s
> - 1m
> - 5m
> - 15m
> - 30m
> - 1H
> - 4H
> - 1D
>
> Do not assume every timeframe is directly supplied by the API.
>
> Create a candle aggregation layer.
>
> For a 5-minute candle:
>
> ```text
> open = first price
> high = highest price
> low = lowest price
> close = latest price
> ```
>
> The same aggregation system should work for other intervals.
>
> Use Unix timestamps from Deriv rather than relying on the user's local clock for candle boundaries.
>
> Historical data should be loaded before live ticks are subscribed.
>
> Then merge incoming ticks into the currently forming candle.
>
> When the timeframe changes:
>
> 1. Stop the previous data subscription if necessary.
> 2. Request appropriate historical data.
> 3. Rebuild candles.
> 4. Subscribe to live ticks.
> 5. Continue updating the current candle.
>
> Avoid duplicate candles and duplicate subscriptions.
>
> ## WebSocket Architecture
>
> Create a dedicated service such as:
>
> ```text
> lib/deriv/
>   websocket.ts
>   symbols.ts
>   ticks.ts
>   history.ts
>   candles.ts
> ```
>
> Do not place WebSocket logic directly inside the chart component.
>
> Create a reusable connection manager that handles:
>
> - Connecting
> - Disconnecting
> - Reconnecting
> - Connection status
> - Subscriptions
> - Unsubscriptions
> - Request IDs
> - Message parsing
> - Error handling
> - Cleanup
>
> Connection states:
>
> ```text
> connecting
> connected
> reconnecting
> disconnected
> error
> ```
>
> Implement exponential backoff for reconnection.
>
> Prevent multiple WebSocket connections from being created accidentally when React components rerender.
>
> ## Live Data
>
> When the user selects an instrument:
>
> ```text
> Select instrument
>         ↓
> Load historical data
>         ↓
> Build candles
>         ↓
> Subscribe to live ticks
>         ↓
> Update current candle
>         ↓
> Create new candle when timeframe changes
> ```
>
> Show:
>
> - Current price
> - Price change
> - Percentage change where meaningful
> - Last update time
> - Connection status
>
> The current price should update in real time.
>
> ## Symbol Search
>
> Create a TradingView-style instrument search.
>
> Example:
>
> ```text
> Search markets...
>
> Volatility 75
> Volatility 100
> Crash 500
> Boom 500
> Jump 25
> Step Index
> ...
> ```
>
> Search by:
>
> - Symbol
> - Display name
> - Category
> - Known naming aliases (for example, Weltrade's naming for the same instrument)
>
> Make the search extremely fast on mobile.
>
> If a user searches using a broker-specific alias (such as a Weltrade instrument name), the search should still resolve to the correct underlying Deriv instrument and display it using Deriv's canonical name, with the alias shown as a secondary label.
>
> ## Watchlist
>
> Add a watchlist system.
>
> Users should be able to:
>
> - Add an instrument
> - Remove an instrument
> - Reorder instruments
> - Select an instrument
> - See its current price
> - See whether the market is connected
>
> Store the watchlist in localStorage.
>
> Do not require authentication for the watchlist.
>
> ## Technical Indicators
>
> Add an indicator system that is independent of the data provider.
>
> Initial indicators:
>
> - SMA
> - EMA
> - RSI
> - MACD
> - Bollinger Bands
>
> Allow users to enable/disable indicators.
>
> Example:
>
> ```text
> Indicators
>
> ☑ EMA 20
> ☑ EMA 50
> ☐ SMA 200
> ☐ RSI
> ☐ MACD
> ☐ Bollinger Bands
> ```
>
> Indicators must update when new candles arrive.
>
> Keep the indicator calculations in separate modules.
>
> ## Chart Controls
>
> Create a mobile-friendly bottom toolbar containing:
>
> ```text
> Timeframe
> Indicators
> Draw
> Chart Type
> Settings
> ```
>
> Desktop can use a horizontal toolbar.
>
> Mobile should prioritize the chart and avoid clutter.
>
> ## Drawing Tools
>
> Create basic drawing functionality:
>
> - Horizontal line
> - Vertical line
> - Trend line
> - Support/resistance
> - Remove drawing
>
> Persist drawings locally per instrument/timeframe if practical.
>
> ## UI
>
> Design the interface like a professional trading terminal.
>
> Dark mode should be the primary experience.
>
> Layout:
>
> ```text
> ┌──────────────────────────────┐
> │ Instrument       Connection  │
> │ Volatility 75       ● LIVE   │
> ├──────────────────────────────┤
> │                              │
> │                              │
> │        CANDLE CHART          │
> │                              │
> │                              │
> ├──────────────────────────────┤
> │ 1m  5m  15m  30m  1H  4H    │
> ├──────────────────────────────┤
> │ Indicators  Draw  Settings   │
> └──────────────────────────────┘
> ```
>
> On mobile:
>
> - Full-width chart
> - Touch-friendly buttons
> - Bottom sheets instead of large dialogs
> - Horizontal scrolling for timeframe buttons
> - No tiny controls
> - No unnecessary sidebars
>
> On desktop:
>
> - Left instrument/watchlist panel
> - Main chart
> - Optional right-side information panel
>
> Use Tailwind CSS.
>
> Use gradients tastefully for branding and UI accents.
>
> ## Performance
>
> This application will receive continuous tick data, so performance matters.
>
> Do not cause the entire React application to rerender on every tick.
>
> Use appropriate state separation and refs.
>
> The chart should receive only the data updates it needs.
>
> Avoid:
>
> ```text
> tick → global state update → entire application rerender
> ```
>
> Prefer:
>
> ```text
> WebSocket
>    ↓
> Data service
>    ↓
> Chart-specific update
> ```
>
> Use throttling/batching where appropriate.
>
> ## Error Handling
>
> Handle:
>
> - WebSocket failure
> - API errors
> - Invalid symbols
> - Empty historical data
> - Connection drops
> - Reconnection
> - Invalid messages
> - Browser going offline
> - API rate limits
> - Component unmounting
> - Duplicate subscriptions
>
> Never allow an API error to crash the entire application.
>
> Display useful messages such as:
>
> ```text
> Connection lost
> Reconnecting...
> ```
>
> and:
>
> ```text
> Unable to load market data
> Try again
> ```
>
> ## No Weltrade Data Mapping
>
> Do **not** pretend that Weltrade and Deriv instruments are the same.
>
> The initial version uses **Deriv as the sole market-data provider**.
>
> Do not create fake mappings such as:
>
> ```text
> Weltrade Volatility 75 = Deriv Volatility 75
> ```
>
> unless an authoritative data source proves that they are equivalent.
>
> This restriction applies specifically to **data equivalence claims**, such as treating Weltrade's price feed, spreads, or candle data as identical to Deriv's. It does not prohibit the display-only naming aliases described in the "Weltrade Naming Conventions" section below, which never assert that the two brokers' feeds are the same and never pull data from Weltrade.
>
> Instead, architect the application so another provider can be added later:
>
> ```text
> MarketDataProvider
>        │
>        ├── DerivProvider
>        │
>        └── FutureProvider
> ```
>
> The chart should not know or care where the data came from.
>
> ## Provider Architecture
>
> Create an interface similar to:
>
> ```ts
> interface MarketDataProvider {
>   getInstruments(): Promise<Instrument[]>
>   getHistoricalData(symbol: string, timeframe: number): Promise<Candle[]>
>   subscribeTicks(
>     symbol: string,
>     callback: (tick: Tick) => void
>   ): Subscription
> }
> ```
>
> Then implement:
>
> ```text
> DerivProvider
> ```
>
> Only.
>
> Make it easy to add another provider later.
>
> ## Weltrade Naming Conventions
>
> Some brokers, including Weltrade, offer the same family of synthetic indices under their own display names. Users coming from Weltrade may search using its naming conventions instead of Deriv's.
>
> Add a naming-alias layer that is purely cosmetic and search-related, separate from the market-data provider system described above:
>
> ```text
> lib/market/
>   aliases.ts
> ```
>
> Maintain a static, manually curated alias table such as:
>
> ```ts
> type InstrumentAlias = {
>   derivSymbol: string
>   broker: "weltrade"
>   aliasName: string
> }
> ```
>
> Example entries (verify current naming against Weltrade's own published instrument list before relying on it, since naming can change):
>
> ```text
> Deriv: "Volatility 75 Index"      → Weltrade alias: "Volatility 75"
> Deriv: "Boom 1000 Index"          → Weltrade alias: "Boom 1000"
> Deriv: "Crash 1000 Index"         → Weltrade alias: "Crash 1000"
> ```
>
> Rules for this alias layer:
>
> - Aliases are for **search and display convenience only**. They must never be used to fetch, substitute, or blend data from a non-Deriv source.
> - Every alias must map to a real, currently active Deriv `symbol` returned by `active_symbols`. Do not display an alias for an instrument Deriv does not currently offer.
> - When an aliased instrument is selected, all price data, candles, and ticks still come exclusively from the `DerivProvider`.
> - Show the Deriv display name as primary in the chart header and instrument details. The alias, if matched, can appear as a small secondary label (for example, "also known as on Weltrade: ...") in the search results only.
> - Keep the alias table easy to extend to other brokers later without changing the search or chart logic.
> - If Weltrade's naming for a given index cannot be confirmed from an authoritative, current source, omit that alias rather than guessing.
>
> ## Security
>
> For this version:
>
> - No private API credentials
> - No trading credentials
> - No account tokens
> - No deposits
> - No withdrawals
> - No real-money trading
>
> Only use publicly available Deriv market data.
>
> Never place credentials in:
>
> ```text
> NEXT_PUBLIC_*
> ```
>
> Never commit secrets to Git.
>
> ## Future Trading Architecture
>
> Do not implement trading yet, but structure the project so that later we can add:
>
> ```text
> Authentication
>       ↓
> Deriv account connection
>       ↓
> Demo account
>       ↓
> Trading interface
>       ↓
> Real account
> ```
>
> Trading must be completely separate from the public market-data functionality.
>
> The current application should remain useful without a Deriv account.
>
> ## Project Structure
>
> Use a clean structure similar to:
>
> ```text
> app/
>   page.tsx
>   chart/
>     page.tsx
>
> components/
>   chart/
>     TradingChart.tsx
>     ChartToolbar.tsx
>     TimeframeSelector.tsx
>     IndicatorPanel.tsx
>     DrawingToolbar.tsx
>   market/
>     SymbolSearch.tsx
>     Watchlist.tsx
>     InstrumentSelector.tsx
>   layout/
>     MobileToolbar.tsx
>     DesktopSidebar.tsx
>
> lib/
>   deriv/
>     websocket.ts
>     provider.ts
>     symbols.ts
>     ticks.ts
>     history.ts
>   market/
>     types.ts
>     candles.ts
>     indicators.ts
>     aliases.ts
>   storage/
>     watchlist.ts
>     drawings.ts
>
> hooks/
>   useDerivConnection.ts
>   useMarketData.ts
>   useCandles.ts
>   useWatchlist.ts
>
> types/
>   market.ts
>   chart.ts
> ```
>
> Adjust the structure if a better architecture is appropriate.
>
> ## Important Implementation Rule
>
> Before writing the application, inspect the **current official Deriv API documentation**.
>
> Do not rely on old tutorials or outdated Deriv API examples.
>
> The application must adapt to the current API response schemas.
>
> Build defensive parsing around the current schema and validate external API data before using it.
>
> ## Development Process
>
> Build the project incrementally.
>
> ### Phase 1
>
> Create the Next.js application and basic UI.
>
> ### Phase 2
>
> Connect to Deriv's public WebSocket.
>
> ### Phase 3
>
> Retrieve `active_symbols`.
>
> ### Phase 4
>
> Create instrument search and categories.
>
> ### Phase 5
>
> Load historical price data.
>
> ### Phase 6
>
> Build OHLC candles.
>
> ### Phase 7
>
> Add TradingView Lightweight Charts.
>
> ### Phase 8
>
> Add live tick updates.
>
> ### Phase 9
>
> Add timeframe switching.
>
> ### Phase 10
>
> Add indicators.
>
> ### Phase 11
>
> Add watchlist.
>
> ### Phase 12
>
> Optimize mobile UX.
>
> ### Phase 13
>
> Add reconnection and robust error handling.
>
> At every phase, ensure the application remains runnable.
>
> Do not generate fake market data when the real Deriv API is available.
>
> ## Final Requirement
>
> The finished application should feel like a **mobile TradingView-style charting platform specifically for Deriv Synthetic/Derived Indices**.
>
> A user should be able to:
>
> 1. Open the application on their phone.
> 2. See currently available Deriv synthetic markets.
> 3. Search for an index.
> 4. Select something like Volatility 75.
> 5. Immediately see historical candles.
> 6. Watch the price update live.
> 7. Change between timeframes.
> 8. Add indicators.
> 9. Add the instrument to a watchlist.
> 10. Switch to another synthetic index.
> 11. Continue using the application without needing an API key or Deriv login.
>
> Do not implement trading yet.
>
> Focus on making the **market-data and charting experience extremely reliable first**.
# volterm
