# Trading Ledger Expansion

Expand the existing Deriv Synthetic Indices charting platform with a complete local-first trading ledger and journal.

The ledger must work without a user account or backend. Persist structured data locally using IndexedDB, preferably through Dexie. Use localStorage only for small UI preferences.

The feature must be mobile-first, responsive, and integrated with the existing charting platform.

## Goals

Allow users to:

- Record winning trades
- Record losing trades
- Record breakeven trades
- Record planned trades
- Record canceled or invalidated setups
- Record strategies used
- Add detailed trade notes
- Attach chart screenshots
- Track risk and reward
- Track performance statistics
- Review trading history
- Filter and search trades
- Edit and delete records
- Export and import ledger data

Do not implement real-money trading as part of this expansion.

## 1. Trade Record

Create a normalized trade record.

```ts
type TradeStatus =
  | "planned"
  | "open"
  | "win"
  | "loss"
  | "breakeven"
  | "cancelled"

type TradeDirection = "long" | "short"

type Trade = {
  id: string
  symbol: string
  displayName: string
  direction: TradeDirection
  status: TradeStatus
  timeframe: string
  entryPrice?: number
  exitPrice?: number
  stopLoss?: number
  takeProfit?: number
  positionSize?: number
  riskAmount?: number
  profitLoss?: number
  riskReward?: number
  strategyId?: string
  strategyName?: string
  setup?: string
  entryReason?: string
  exitReason?: string
  notes?: string
  screenshot?: string
  openedAt?: number
  closedAt?: number
  createdAt: number
  updatedAt: number
  tags?: string[]
}
```

Adapt the model to the existing application architecture rather than blindly copying it.

## 2. Trade Entry Form

Create a mobile-friendly trade entry form with:

- Instrument
- Direction
- Status
- Timeframe
- Entry price
- Exit price
- Stop loss
- Take profit
- Position size
- Risk amount
- Strategy
- Setup
- Entry reason
- Exit reason
- Notes
- Tags
- Screenshot

Make the form comfortable on small phone screens.

## 3. Quick Record From Chart

Add a `Record Trade` button directly to the chart.

When clicked, automatically prefill:

- Current instrument
- Current timeframe
- Current price
- Current timestamp

The user should only need to enter the remaining information.

## 4. Win / Loss Recording

Make trade outcomes easy to record:

- WIN
- LOSS
- BREAKEVEN

Allow the result to be changed later.

Calculate performance automatically when sufficient values are available.

Do not assume a specific currency unless the user has configured one.

## 5. Automatic Calculations

Calculate where possible:

- Profit/loss
- Risk amount
- Reward amount
- Risk/reward ratio
- Percentage return
- Win rate
- Average win
- Average loss
- Profit factor
- Total wins
- Total losses
- Breakeven count
- Largest win
- Largest loss
- Current winning streak
- Current losing streak
- Maximum drawdown where enough data exists

Do not overwrite manually entered values without clearly distinguishing calculated and manual values.

## 6. Strategy Library

Create a strategy system.

```ts
type Strategy = {
  id: string
  name: string
  description?: string
  entryRules?: string[]
  confirmationRules?: string[]
  exitRules?: string[]
  preferredTimeframes?: string[]
  preferredSymbols?: string[]
  notes?: string
  createdAt: number
  updatedAt: number
}
```

Allow users to create, edit, duplicate, archive, and delete strategies.

## 7. Strategy Performance

Connect trades to strategies and show statistics per strategy:

- Trades
- Wins
- Losses
- Win rate
- Net P&L
- Average R

Allow comparison of strategies and filtering by strategy.

Do not rank strategies using incomplete data without making that clear.

## 8. Notes and Journal

Every trade should support detailed notes.

Provide separate fields for:

### Setup
What was visible before entering?

### Entry Reason
Why was the trade taken?

### Exit Reason
Why was the trade closed?

### General Notes
Anything else the trader wants to record.

Use plain text unless safe Markdown support is already available.

## 9. Tags

Allow custom tags such as:

- breakout
- pullback
- trend
- reversal
- fomo
- revenge
- goodsetup
- mistake

Users can filter trades by tags.

## 10. Trading Psychology

Add optional fields:

- Emotion before trade
- Confidence from 1–5
- Discipline from 1–5
- Was this a planned trade?
- Did I follow my strategy?

Possible emotions:

- Calm
- Confident
- Nervous
- Fearful
- FOMO
- Greedy
- Angry
- Frustrated
- Revenge
- Uncertain

Do not make these fields mandatory.

## 11. Screenshot Attachments

Allow users to attach screenshots to trades.

Screenshots may be:

- Before-entry setup
- After-exit result
- Chart analysis

Store images appropriately in IndexedDB rather than repeatedly writing large base64 values into localStorage.

Support:

- Preview
- Replace
- Delete

## 12. Trade History

Create a dedicated ledger page.

Support:

- All
- Wins
- Losses
- Breakeven

Show compact mobile-friendly trade cards and a table view on desktop.

## 13. Trade Detail

Clicking a trade should open a detailed view showing:

- Instrument
- Result
- Direction
- Timeframe
- Entry
- Exit
- Stop loss
- Take profit
- Risk/reward
- Strategy
- Notes
- Screenshot
- Timestamps

Provide:

- Edit
- Duplicate
- Delete

## 14. Dashboard Statistics

Create a ledger dashboard showing:

- Net P&L
- Win rate
- Total trades
- Profit factor
- Average win
- Average loss
- Equity curve
- Wins vs losses
- P&L by day
- P&L by instrument
- P&L by strategy
- Win rate by timeframe

Keep all charts responsive on mobile.

## 15. Filters

Allow filtering by:

- Date
- Instrument
- Direction
- Result
- Strategy
- Timeframe
- Tags
- Planned/unplanned
- Followed strategy
- Emotion

Allow filters to be combined.

## 16. Search

Search trades by:

- Instrument
- Strategy
- Notes
- Tags
- Setup
- Entry reason
- Exit reason

Keep searching fast even with thousands of locally stored trades.

## 17. Calendar View

Add a trading calendar showing daily P&L and activity.

Clicking a day should show its trades.

## 18. Daily Journal

Allow daily trading journal entries.

```ts
type DailyJournal = {
  id: string
  date: string
  marketOverview?: string
  plan?: string
  goals?: string
  lessons?: string
  mistakes?: string
  mood?: string
  createdAt: number
  updatedAt: number
}
```

## 19. Risk Management

Add a risk calculator using:

- Account balance
- Risk percentage
- Entry
- Stop loss
- Take profit

Calculate:

- Risk amount
- Potential reward
- Risk/reward

For synthetic indices, do not assume forex pip or lot conventions. Use the relevant instrument specifications when calculating contract-specific values.

## 20. Data Storage

Use IndexedDB through Dexie or an equivalent reliable abstraction.

Suggested tables:

```text
trades
strategies
dailyJournals
watchlists
drawings
settings
```

Use schema versioning so future database changes can be migrated safely.

Do not scatter database calls throughout React components.

Create a storage/data-access layer:

```text
lib/storage/
  db.ts
  trades.ts
  strategies.ts
  journals.ts
  settings.ts
```

Components should call repository/service functions.

## 21. Export

Allow users to export the entire ledger.

Provide:

- JSON backup containing trades, strategies, journals, tags, and appropriate settings
- CSV export of trades

## 22. Import

Allow users to restore a JSON backup.

Flow:

```text
Import Backup
      ↓
Validate file
      ↓
Preview records
      ↓
Confirm import
      ↓
Merge or replace
```

Provide:

- Merge with existing data
- Replace existing data

Require confirmation before replacing data.

Validate imported data with Zod.

## 23. Backup Reminder

Show:

```text
Last backup:
Never

[Export Backup]
```

Because this is local-first, make it clear that browser storage is not a guaranteed backup.

## 24. Mobile UX

Design the ledger for phones first.

Use:

- Bottom sheets
- Full-screen trade forms when appropriate
- Large touch targets
- Sticky save buttons
- Swipe-friendly trade cards
- Compact statistics
- Responsive charts
- Bottom navigation

Suggested navigation:

```text
Home
Charts
Ledger
Strategies
Settings
```

## 25. Desktop UX

On larger screens:

```text
Sidebar
   │
   ├── Dashboard
   ├── Charts
   ├── Ledger
   ├── Strategies
   ├── Journal
   └── Settings
```

Use a table on desktop and cards on mobile.

## 26. Data Integrity

Do not silently lose user data.

Implement:

- Unique IDs
- Created/updated timestamps
- Schema validation
- Database migrations
- Safe deletion
- Confirmation before destructive actions
- Error states
- Empty states
- Import validation
- Export verification

## 27. Performance

The ledger should remain fast with thousands of trades.

Avoid loading every screenshot into memory when displaying the ledger.

Use pagination or virtualization for large histories.

Only load screenshot data when needed.

Do not cause the entire application to rerender whenever a trade is added or edited.

## 28. Integration With Existing Chart

Integrate the ledger with the existing chart.

From the chart:

```text
[ Record Trade ]
```

Automatically populate:

- Current symbol
- Current price
- Current timeframe
- Current timestamp

When viewing a historical trade:

```text
[ View On Chart ]
```

Open the associated instrument and timeframe.

If entry/exit timestamps are available, position the chart around the trade time when historical data permits.

## 29. Trade Markers

Display journaled trades on the chart.

Show:

- Entry marker
- Exit marker
- Stop-loss marker when applicable
- Take-profit marker when applicable

Clicking a marker should open trade details.

Allow:

```text
Show trade markers
```

to be toggled.

## 30. No Fake Trading Results

Never invent trades, P&L, prices, or results.

If a value is unavailable, display `—` or clearly indicate that it was manually entered.

## 31. Future-Proof Architecture

Keep the ledger independent from the Deriv market-data provider.

Future architecture should allow:

```text
Market Data
    │
    ├── Deriv
    └── Future Providers

Trading Ledger
    │
    ├── Manual Trades
    ├── Paper Trades
    └── Future Broker Trades
```

Do not couple the ledger directly to Deriv trading APIs.

## 32. Future Features

Do not implement these yet, but keep the architecture compatible with:

- Paper trading
- Real Deriv account integration
- Cloud synchronization
- User accounts
- Multi-device sync
- Advanced backtesting
- AI trade analysis
- Automated strategy statistics
- Risk limits
- Trading session tracking

## 33. Acceptance Criteria

The expansion is complete when a user can:

1. Open the Ledger.
2. Create a trade manually.
3. Record a win.
4. Record a loss.
5. Record a breakeven.
6. Select a strategy.
7. Create a new strategy.
8. Add notes.
9. Add tags.
10. Record psychology information.
11. Attach a screenshot.
12. Edit a trade.
13. Delete a trade.
14. Search trades.
15. Filter trades.
16. View strategy performance.
17. View overall performance.
18. View a calendar of trading activity.
19. Create daily journal entries.
20. Export their data.
21. Import a backup.
22. Close and reopen the application and still have their records.
23. Use the entire ledger comfortably on a phone.
24. Record a trade directly from the chart.

## Final Implementation Rule

Do not rewrite the existing charting platform unnecessarily.

Inspect the current codebase first.

Reuse existing:

- Instrument models
- Deriv WebSocket connection
- Chart components
- Theme system
- UI components
- Utility functions
- State management

Add the ledger as a modular feature.

Before making architectural changes, identify what already exists and extend it instead of creating duplicate implementations.

The result should feel like a natural expansion of the existing trading platform rather than a separate application.
