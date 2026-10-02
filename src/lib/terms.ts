/**
 * Sky Crash Terms of Service.
 *
 * DRAFT: placeholder wording written for the project, not reviewed by anyone legal.
 * Replace it with the final terms before release. Whenever the text changes, bump
 * TERMS_VERSION here AND TermsOfService.CurrentVersion in the backend
 * (SkyCrash.Domain/Common/TermsOfService.cs) so every player is asked to agree again.
 */
export const TERMS_VERSION = '2026-10-02'
export const TERMS_IS_DRAFT = true

export const TERMS_SECTIONS: { heading: string; body: string }[] = [
  {
    heading: '1. Who can play',
    body: 'You must be at least 18 years old to create a Sky Crash account. One account per person.',
  },
  {
    heading: '2. Credits',
    body: 'Bets are placed with Sky Crash credits. Credits can be bought, won, or earned for free from the credit wheel, daily challenges and feedback rewards. Your balance and every transaction are shown in your Wallet.',
  },
  {
    heading: '3. How rounds work',
    body: "Each round's crash point is decided by the server before the round starts, from a secret seed whose fingerprint (hash) is published in advance and revealed when the plane crashes. A bet that hasn't been cashed out when the plane crashes is lost. Auto Cash Out triggers when the multiplier reaches your target, as measured by the server.",
  },
  {
    heading: '4. Fair play',
    body: "Don't use bots, scripts, multiple accounts or exploits, and don't harass other players. Accounts that break these rules may be blocked.",
  },
  {
    heading: '5. Lobbies',
    body: 'In a private lobby, the other pilots in that lobby can see your username, plane, bets and cash-outs for the rounds you play while you are in it. Players outside your lobby cannot.',
  },
  {
    heading: '6. Feedback and data',
    body: 'We store your account details, game history and any feedback you send so we can run and improve Sky Crash. We never sell your data.',
  },
  {
    heading: '7. Play responsibly',
    body: 'Set yourself limits and take breaks. If the game stops being fun, step away.',
  },
  {
    heading: '8. Changes',
    body: 'If these terms change, you will be asked to agree to the new version before your next flight.',
  },
]
