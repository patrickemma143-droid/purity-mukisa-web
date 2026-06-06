# How to push the cart fix to GitHub (then Hostinger auto-deploys)

This folder is the full Purity Mukisa website **with the cart fix already committed**.
You don't need to edit anything — just push.

---

## Step 1: Get a GitHub token (one-time key)

GitHub no longer accepts your normal password in the terminal. You need a token.

1. github.com -> click your profile photo (top-right) -> **Settings**
2. Bottom of the left menu -> **Developer settings**
3. **Personal access tokens** -> **Tokens (classic)** -> **Generate new token (classic)**
4. Name: purity-push  |  Expiration: 7 days  |  tick the **repo** box
5. Click **Generate token** and **copy it** (you won't see it again)

Delete the token after you're done.

---

## Step 2: Open a terminal in this folder

- **Windows:** open this folder, click the address bar, type `cmd`, press Enter
- **Mac:** open Terminal, type `cd ` (with a space), drag this folder onto the window, press Enter

---

## Step 3: Push

    git push origin main

When it asks:
- **Username:** patrickemma143-droid
- **Password:** paste your **token** (not your real password)

Hostinger will pick up the change automatically.

---

## If push is "rejected" (repo changed since)

    git pull --rebase origin main
    git push origin main

---

## After it's live

Hard-refresh the site so your own browser drops the old cached cart:
- Windows: Ctrl + Shift + R
- Mac: Cmd + Shift + R

Then test: add an item, click the cart icon -> the drawer should slide in with your item.

---

## What was fixed
- cart.js is now loaded as `cart.js?v=2.2` on every page, so browsers always get the fresh
  file instead of an old cached (broken) copy. THIS WAS THE MAIN BUG.
- Cart startup hardened so it works regardless of load timing.
- "Add to cart" retries if clicked before the script finishes loading.

When you change the cart again later, bump the version (?v=2.3, ?v=2.4 ...) so the cache
problem never comes back.
