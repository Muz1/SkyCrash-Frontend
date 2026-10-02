// "About this report" text for every admin report, kept together so the wording stays
// consistent. Money is in credits, treated as 1 credit = R1.

export interface AboutContent {
  measures: string
  numbers: { term: string; definition: string }[]
  charts: string
  useFor: string
}

const PROFIT_RULE =
  'Credits are treated as real money (1 credit = R1). The house gains what players lose and loses what they win. Every free credit handed out (challenge, feedback and spin-wheel rewards, demo top-ups, admin adjustments) also counts as a cost. Purchases are neutral because the player paid for them.'

export const ABOUT: Record<string, AboutContent> = {
  overview: {
    measures: 'A one-page health check of Sky Crash for the selected dates: who is playing, how much is bet and paid out, and what the house keeps.',
    numbers: [
      { term: 'Total players', definition: 'Every registered player account (all time).' },
      { term: 'Active players', definition: 'Distinct players who opened the game or placed a bet in the date range.' },
      { term: 'Games played', definition: 'Resolved bets (won or lost); one player betting on one round counts as one game.' },
      { term: 'Active games', definition: 'Bets riding on the round that is in the air right now.' },
      { term: 'Profit', definition: `Net profit: total wagered − total payouts − free credits given. ${PROFIT_RULE}` },
      { term: 'Average multiplier', definition: 'The average crash multiplier of the rounds in the range.' },
      { term: 'Feedback responses', definition: 'Feedback forms submitted in the range.' },
    ],
    charts: 'The money chart shows each day\'s total wagered against total payouts on one shared axis; the gap between the lines is gross revenue. The players chart shows daily active players. Hover or focus any day for exact values, or press Table.',
    useFor: 'Start here each day. Spot quiet days, payout spikes or a drop in active players, then open the matching detailed report.',
  },
  revenue: {
    measures: 'How much money flows through the game and what the house keeps after free credits.',
    numbers: [
      { term: 'Total wagered', definition: 'Sum of stakes on resolved bets.' },
      { term: 'Total payouts', definition: 'Credits paid to players who cashed out before the crash (stake × cash-out multiplier).' },
      { term: 'Gross revenue', definition: 'Total wagered − total payouts.' },
      { term: 'Free credits given', definition: 'Challenge, feedback and wheel rewards, demo top-ups and net admin adjustments.' },
      { term: 'Net profit', definition: `Gross revenue − free credits given. ${PROFIT_RULE}` },
      { term: 'Profit margin', definition: 'Net profit as a percentage of total wagered.' },
      { term: 'Expected from house edge', definition: 'What the configured house edge predicts the house keeps (wagered × edge). Over many bets gross revenue moves towards this figure; over a few bets luck dominates.' },
    ],
    charts: 'Bets vs payouts compares the two money flows per day. Revenue & profit shows gross revenue and net profit per day; a day below zero means players won more than they lost (plus giveaways). Free credits shows where giveaways came from.',
    useFor: 'Check the game is profitable, judge whether giveaways are too generous, and confirm the house edge is behaving as configured.',
  },
  gamePerformance: {
    measures: 'How the crash rounds themselves behave: how long they last and where they crash.',
    numbers: [
      { term: 'Total rounds', definition: 'Rounds that crashed in the range.' },
      { term: 'Average round duration', definition: 'Seconds from take-off to crash.' },
      { term: 'Average / highest / lowest multiplier', definition: 'Statistics of the crash multipliers. Instant crashes happen at exactly 1.00x and are where the house edge comes from.' },
      { term: 'Rounds over a threshold', definition: 'How many rounds reached at least that multiplier. A player cashing out there would have won in that share of rounds.' },
    ],
    charts: 'The distribution groups rounds by crash multiplier. Most rounds crash low by design, and the long tail above 10x makes big wins possible. The daily chart shows rounds per day.',
    useFor: 'Confirm the crash engine looks healthy and fair, and explain to players how often high multipliers really happen.',
  },
  playerActivity: {
    measures: 'Who is playing, how many are new or returning, and how long sessions last.',
    numbers: [
      { term: 'Active players', definition: 'Distinct players who opened the game or placed a bet in the range.' },
      { term: 'New players', definition: 'Accounts created in the range.' },
      { term: 'Returning players', definition: 'Active players whose account was created before the range started.' },
      { term: 'Average games per player', definition: 'Games played ÷ players who bet at least once.' },
      { term: 'Sessions', definition: 'Time from a player\'s first open connection to their last one closing. Sessions cut short by a server restart are excluded from the length.' },
      { term: 'Peak concurrent', definition: 'The most players online at the same time, sampled every minute.' },
    ],
    charts: 'The daily chart shows active and new players on one axis (both are player counts). Session lengths groups completed sessions by duration.',
    useFor: 'Track growth, see whether new players come back, and measure the effect of features like challenges or lobbies.',
  },
  lobbies: {
    measures: 'Use of private lobbies: how many there are, how full they get and how often players join.',
    numbers: [
      { term: 'Active lobbies', definition: 'Lobbies open right now.' },
      { term: 'Average / largest lobby size', definition: 'Members per active lobby, host included.' },
      { term: 'Max players', definition: 'The capacity setting (Game Management → Lobbies).' },
      { term: 'Joins', definition: 'Times a player joined someone else\'s lobby in the range.' },
    ],
    charts: 'The daily chart shows lobby joins and lobbies created per day.',
    useFor: 'See whether social play is catching on and whether the lobby size limit needs changing.',
  },
  skins: {
    measures: 'Which planes and skies players have equipped in the hangar.',
    numbers: [
      { term: 'Players with a loadout', definition: 'Players who have equipped something in the hangar at least once.' },
      { term: 'Share', definition: 'Percentage of those players using each plane or sky.' },
    ],
    charts: 'Each bar is one plane or sky; longer means more players have it equipped right now.',
    useFor: 'Decide which cosmetics are popular and what kind of new skins or skies to make next.',
  },
  feedback: {
    measures: 'How many players give feedback, how happy they are, and what they ask for.',
    numbers: [
      { term: 'Response rate', definition: 'Players who gave feedback ÷ players who have cashed out enough times to be asked.' },
      { term: 'Average rating', definition: 'Mean of the 1–5 star rating.' },
      { term: 'Positive / neutral / negative', definition: 'Each submission is scored mostly from its star rating (70%) and partly from its wording (30%).' },
      { term: 'Most requested improvements', definition: 'Counted from the "What would you like us to add?" boxes and from matching words in players\' comments; each submission counts once per request.' },
    ],
    charts: 'Submissions over time shows daily responses. The ratings chart shows how many gave each star. Requested improvements are ranked by how many submissions ask for them.',
    useFor: 'Prioritise the roadmap from what players actually ask for, and watch satisfaction after each release.',
  },
  submissions: {
    measures: 'Every individual feedback form, so you can read exactly what players wrote.',
    numbers: [
      { term: 'Reward', definition: 'Whether the submission earned the feedback reward. Only submissions made when the reward was due are paid.' },
      { term: 'Game context', definition: 'Rounds played and cash-outs at the time of submitting, and rounds played since.' },
      { term: 'Sentiment', definition: 'Positive, neutral or negative, from the rating and wording.' },
    ],
    charts: 'No charts: use search and the filters to narrow the list.',
    useFor: 'Read the detail behind the analytics, follow up on bug reports, and find quotes for the team.',
  },
  advisor: {
    measures: 'A ranked list of changes worth making, based on the selected dates: money (RTP, free credits), players (new, returning, sessions), lobby use and written feedback.',
    numbers: [
      { term: 'Source', definition: 'Gemini AI when an API key is configured on the server (Gemini:ApiKey); otherwise simple built-in rules over the same numbers, labelled as such.' },
      { term: 'Impact', definition: 'How much the change is likely to matter: High, Medium or Low. High items are listed first.' },
      { term: 'What the advisor looked at', definition: 'The exact numbers the recommendations and chat answers are based on.' },
    ],
    charts: 'No charts: each recommendation says why (the numbers or quotes behind it) and what to do. The chat answers follow-up questions about the same numbers and needs a Gemini key.',
    useFor: 'Weekly planning: pick the top one or two recommendations, make the change, then check the same period next week.',
  },
  insights: {
    measures: 'A consolidated summary of all written feedback in the range, grouped into topics with a suggested action each.',
    numbers: [
      { term: 'Source', definition: 'Gemini AI when an API key is configured on the server (Gemini:ApiKey); otherwise the built-in keyword analyser, labelled as such.' },
      { term: 'Topics', definition: 'Gameplay, UI, Sound, Plane skins, Skies, Multiplayer, Lobbies, Performance, Bugs, Rewards, Suggestions.' },
      { term: 'Mentions', definition: 'How many submissions touch the topic.' },
    ],
    charts: 'The sentiment bar splits submissions into positive, neutral and negative. Each topic card shows its sentiment, a suggested action and real quotes.',
    useFor: 'Get the gist of hundreds of comments in a minute, then check the quotes in Feedback Submissions.',
  },
}
