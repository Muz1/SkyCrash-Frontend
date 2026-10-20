# iPhone real-device checklist (about 10 minutes)

The automated tests run Safari's engine (WebKit) on a computer, which can't show everything a
real iPhone does: the notch, the home bar, the on-screen keyboard, audio rules and payment
redirects. Please run through this on a real iPhone before the panel demo.

**You need:** an iPhone with Safari, the hosted Sky Crash link, a test player account, and
(for the payment step) an admin who has switched payments on with the PayFast sandbox.

Tick each box as you go. If something fails, write down the iPhone model, iOS version,
portrait or landscape, and what you saw (a screenshot helps a lot).

## 1. Start (1 min)

- [ ] Open the Sky Crash link in Safari. The landing page shows the logo, **Play Now** and
      **Join Lobby** without having to scroll (portrait).
- [ ] Nothing slides sideways when you drag left or right on any page in this checklist.
- [ ] Log in. Tapping the **Email** or **Password** box does **not** zoom the page in.

## 2. Bottom navigation bar on the game screen (2 min)

- [ ] Tap **Play Now**. The row of round buttons at the bottom (Home, Ranks, Hangar, Play,
      Missions, Flights, Pilot) is hidden; only a small pink tab with an up arrow sits at the
      bottom centre.
- [ ] Tap the pink tab. The bar slides up. The tab now shows a down arrow.
- [ ] Wait about 5 seconds without touching anything. The bar slides away again on its own.
- [ ] Put your finger on the very bottom of the screen (just above the home bar, away from the
      pink tab) and swipe up. The bar slides up.
- [ ] With the bar up, tap the sky (the countdown or the plane). The bar slides away.
- [ ] With the bar up, tap **Ranks**. The leaderboard opens (on other pages the bar is always
      shown).
- [ ] The swipe up from the bottom edge did **not** close Safari or switch apps. (If it did,
      start the swipe a little higher, inside the bottom strip of the game controls, and note it.)

## 3. Top menu (1 min)

- [ ] On the game screen the top bar shows the logo, your credits and one **menu** button
      (three lines) on the right; nothing is cut off at the right edge.
- [ ] Tap the menu button. A list opens with Mute music, Audio settings, How to play, Mute
      plane and game sounds, Lobby and Wallet. Each row is easy to tap.
- [ ] Tap outside the list. It closes.
- [ ] Open it again and tap **How to play**. The tutorial opens and its right-hand side is not
      cut off. Tap **Next** through all 8 cards, then **Let's fly**.

## 4. Notch, home bar and rotation (2 min)

- [ ] Portrait: the logo and menu button sit below the notch / Dynamic Island, not under it.
- [ ] Portrait: the **Bet** button is fully visible above the pink tab and the home bar,
      without scrolling.
- [ ] Turn the phone sideways (landscape). The bet controls move to the right of the plane.
      Nothing is hidden behind the notch on the left or right side.
- [ ] In landscape the **Bet** button is still fully visible; the pink tab still works.
- [ ] Turn back to portrait. The layout returns to normal (no gaps, nothing stuck off-screen).

## 5. Keyboard and typing (1 min)

- [ ] On the game screen, tap the bet amount box. The page does **not** zoom in, and the box
      stays visible above the keyboard while you type.
- [ ] Tap the auto cash out target box (next to the **OFF/ON** switch). Same: no zoom, still
      visible.
- [ ] Go to **Lobby**, tap **Lobby name** and **Invite code**. No zoom; the field is not
      hidden behind the keyboard.
- [ ] Tap **Done** on the keyboard. The page settles back without leaving a blank gap at the
      bottom.

## 6. Sound (1 min)

- [ ] Music does not start by itself before you touch the page (iPhones block that; expected).
- [ ] After your first tap anywhere, the music starts (unless it was muted before).
- [ ] Menu > **Mute music** stops it; tapping it again (**Play music**) brings it back.
- [ ] Place a bet and watch a round: take-off and cash-out/crash sounds play. Menu >
      **Mute plane and game sounds** silences them.
- [ ] With the phone's silent switch ON, note whether sound still plays (either is fine; just
      write down what happens).
- [ ] Lock the phone for a few seconds and unlock: music doesn't blast at full volume, and
      it keeps working after you tap once.

## 7. Buying credits with PayFast (2 min, needs payments switched on)

- [ ] Menu > **Wallet** (or the **Buy credits** link). Pick a credit pack and go to checkout.
- [ ] Safari moves to the PayFast sandbox page (a full page, not a blocked popup).
- [ ] Complete the sandbox payment. Safari comes back to Sky Crash's Wallet page with a
      "Payment received" or "Purchase complete" message, and you are still logged in.
- [ ] Start another checkout and press **Cancel** on PayFast. You come back to the Wallet with
      "Checkout was cancelled — no charge was made."

## 8. Google sign-in (when available)

Google sign-in is not in the app yet. When it is added:

- [ ] Tapping **Sign in with Google** opens Google's sign-in (popup or new tab) and is not
      silently blocked by Safari.
- [ ] After choosing an account you land back in Sky Crash, logged in.
- [ ] Repeat once with Safari's **Prevent Cross-Site Tracking** on (Settings > Safari).

## 9. Admin console on the phone (optional, 1 min, admin account)

- [ ] Log in as an admin. The top bar shows **Menu**, the logo, the theme and logout buttons.
- [ ] Tap **Menu**: a panel slides in from the left with every report, grouped, and the current
      page highlighted. Tap **Players**: the panel closes and Player Management opens.
- [ ] Each player is shown as a card with Promote/Block/Adjust buttons you can tap without
      zooming.
- [ ] Open a report with a wide table (e.g. Player Retention) and drag the table sideways:
      the first column stays in place.

## Report back

Send the team: iPhone model, iOS version, and the numbers of any boxes you could not tick,
with a screenshot or a short screen recording.
