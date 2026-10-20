# Mobile test matrix

Results of the Playwright suite (`npm run test:e2e`) on branch `phase-2/mobile`, run on
2026-10-20 after the Phase 2.1 / 2.2 fixes: **377 passed, 0 failed, 7 skipped** (the skips are
phone-only tests on the iPad, and the raw-touch test, which only runs on Chromium).

## What "pass" means

At each size the screen is checked for:

- **No sideways scrolling**: the page is not wider than the window, and no scrolling area
  inside the page (such as the main content) is wider than itself. Deliberate sideways
  scrollers (bet chips, auto cash out presets, wide admin tables) are allowed.
- **Nothing cut off**: no button, link or field pokes out of the window or out of the panel
  that clips it, and every control can be reached by scrolling.
- **Touch screens only**: text fields are at least 16px (so iOS doesn't zoom in) and every
  tap target is at least 44x44px.
- **Game screens**: the Bet / Cash Out button is fully on screen, without scrolling, and not
  covered by anything (the nav dock handle, the challenge bar, ...).

The checks run in a touch Chromium (Pixel 7 profile) resized to each width, with a typical
phone/tablet height; landscape swaps the two (e.g. 320 = 320x568 portrait, 568x320
landscape). The API and the SignalR game hub are stubbed with captured fixture data, so no
backend is needed.

## Width matrix

Each cell is **portrait landscape**: ✓ pass, ✗ fail.

| Screen | 320 | 360 | 375 | 390 | 414 | 430 | 768 | 820 | 1024 |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| landing (guest) | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| landing | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| login | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| register | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| register terms dialog | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| terms (agreement needed) | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| tutorial | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| tutorial last step | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| game (betting open) | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| game (first visit, how-to strip) | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| game (in flight) | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| daily challenges bar | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| out of credits wheel | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| hangar | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| spin wheel | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| missions & achievements | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| feedback form | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| round history | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| wallet | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| wallet + buy credits | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| leaderboard | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| lobby (in squadron) | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| lobby (not in one) | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| profile | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| admin invite | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| admin overview | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| admin game performance | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| admin player activity | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| admin lobby analytics | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| admin retention | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| admin player insights | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| admin revenue | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| admin rtp | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| admin feedback analytics | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| admin feedback submissions | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| admin ai insights | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| admin feedback keywords | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| admin ai advisor | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| admin players | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| admin live round | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| admin lobbies | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| admin audio | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| admin payments | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| admin skin usage | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| admin admin management | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| admin reports (legacy) | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| admin operations | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |
| admin volatility | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ | ✓ ✓ |

Sizes: 320x568, 360x740, 375x667, 390x844, 414x896, 430x932, 768x1024, 820x1180, 1024x1366
(landscape: the same sizes turned sideways).

## Device presets

The same screen checks (one row per screen, "fits the screen") plus the interaction tests, on
Playwright's device presets: iPhone SE, iPhone 13, iPhone 15 Pro Max and iPad Mini on WebKit
(Safari's engine), Pixel 7 and Galaxy S9+ on Chromium. n/a = not applicable to that device.

| Test | iphone-se | iphone-13 | iphone-15-pro-max | ipad-mini | pixel-7 | galaxy-s9plus |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| phones: hidden by default, the handle brings it back and it hides again | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| phones: tapping the game hides it; Escape hides it | ✓ | ✓ | ✓ | n/a | ✓ | ✓ |
| phones: a swipe up from the bottom edge reveals it | ✓ | ✓ | ✓ | n/a | ✓ | ✓ |
| phones: a real touch swipe (touch events) reveals it | n/a | n/a | n/a | n/a | ✓ | ✓ |
| phones: a tap on the bottom edge reveals it | ✓ | ✓ | ✓ | n/a | ✓ | ✓ |
| one menu button holds the header actions; keyboard and outside taps close it | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| below 1024px the admin menu is a drawer with every page in it | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| every player action button is on screen on a phone | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| landing (guest) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| landing | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| login | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| register | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| register terms dialog | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| terms (agreement needed) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| tutorial | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| tutorial last step | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| game (betting open) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| game (first visit, how-to strip) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| game (in flight) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| daily challenges bar | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| out of credits wheel | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| hangar | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| spin wheel | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| missions & achievements | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| feedback form | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| round history | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| wallet | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| wallet + buy credits | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| leaderboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| lobby (in squadron) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| lobby (not in one) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| profile | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| admin invite | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| admin overview | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| admin game performance | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| admin player activity | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| admin lobby analytics | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| admin retention | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| admin player insights | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| admin revenue | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| admin rtp | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| admin feedback analytics | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| admin feedback submissions | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| admin ai insights | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| admin feedback keywords | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| admin ai advisor | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| admin players | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| admin live round | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| admin lobbies | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| admin audio | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| admin payments | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| admin skin usage | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| admin admin management | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| admin reports (legacy) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| admin operations | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| admin volatility | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

## Notes

- **Before the fixes** the same suite found, among others: the header buttons pushing the
  wallet off a 320px screen; the nav dock wider than 320px; the game controls 27px wider than
  a 320px screen; the Terms page's agree button unreachable on most phones (the page could not
  scroll); the landing page's tutorial link off-screen in landscape; Missions badge names
  overflowing at 320px; admin page subtitles squeezed to one word per line on phones and at
  768px; admin tables and the volatility chart wider than the screen; login, register,
  lobby, bet and admin inputs under 16px (iOS zoom); hundreds of tap targets under 44px; and
  the Bet button hidden or covered on phones held sideways.
- Emulation is not a real iPhone: the notch, home bar, on-screen keyboard, audio rules and
  PayFast redirects need the manual run in `docs/IOS_REAL_DEVICE_CHECKLIST.md`.
- Screenshots of every screen on every device are attached to the HTML report
  (`npx playwright show-report` after a CI run); they are artifacts, not pixel-diff gates.
