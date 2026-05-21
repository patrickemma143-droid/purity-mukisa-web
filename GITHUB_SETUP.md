# Connect the Purity Mukisa site to GitHub

This is a one-time setup. Do it once, then you have a simple daily workflow
to push every change you make.

---

## Why this can't be done from Cowork

Cowork runs in a sandboxed Linux environment. When it tried to run `git init`
on your `E:\Patrick\purity` folder, the Windows filesystem blocked some of the
low-level file operations git needs (locking, atomic renames). That's normal
and safe — it just means git needs to run on **your Windows machine**, where
it has full permissions over the folder. That's also where you'll be running
git going forward, so this is the right place anyway.

The `.gitignore` is already written for you.

---

## Step 1 — Install Git for Windows (skip if already installed)

1. Open https://git-scm.com/download/win in your browser.
2. Download the 64-bit installer and run it.
3. Accept the defaults. The one screen worth checking — **"Choose a credential
   helper"** — should already say **"Git Credential Manager"**. Leave it.
4. After install, open **Git Bash** (search "Git Bash" in the Start menu).
   This is the terminal you'll use for all the git commands below.

Quick check it worked — in Git Bash, run:

```bash
git --version
```

You should see something like `git version 2.45.0`.

---

## Step 2 — Delete the broken `.git` folder

When Cowork tried to init, it left behind a half-created `.git` folder.
Delete it before doing anything else:

1. Open **File Explorer** and go to `E:\Patrick\purity`.
2. Top menu: **View → Show → Hidden items** (so `.git` becomes visible).
3. Right-click the `.git` folder → **Delete**.

(If Windows says it can't delete because something is using it, close any
editor that has the folder open, then try again.)

---

## Step 3 — Initialize the repo and make your first commit

In Git Bash:

```bash
cd "/e/Patrick/purity"

git init -b main
git config user.name  "Hudson Timothy Tumusiime"
git config user.email "hudson.tim.uk@gmail.com"

git add .
git commit -m "Initial commit — Purity Mukisa website"
```

That snapshot now lives in your local repo. Nothing is on GitHub yet.

---

## Step 4 — Create the repo on GitHub

1. Go to https://github.com/new while signed in.
2. **Repository name:** `purity-mukisa-site` (or whatever you prefer).
3. **Description (optional):** "Purity Mukisa — gospel artist & ministry site".
4. **Private** is the right choice while you're still building it. You can
   flip it to Public any time later.
5. **Do NOT tick** "Add a README", "Add .gitignore", or "Choose a license" —
   you already have files locally; if GitHub adds files, it'll cause a
   conflict on your first push.
6. Click **Create repository**.

GitHub will show you a page with commands. You only need the two under
**"…or push an existing repository from the command line"**.

---

## Step 5 — Connect local to GitHub and push

Back in Git Bash (still inside the purity folder):

```bash
git remote add origin https://github.com/YOUR-USERNAME/purity-mukisa-site.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your actual GitHub username, and the repo name if
you used a different one.

On the first push, a browser window will pop up asking you to sign in to
GitHub. Sign in once and the Credential Manager will remember you. Future
pushes will be silent.

Refresh the GitHub page in your browser — all your files are now on GitHub.

---

## Step 6 — Your daily workflow going forward

Every time you (or Cowork) makes changes to files in `E:\Patrick\purity`,
this is the three-command rhythm to get them onto GitHub:

```bash
cd "/e/Patrick/purity"

git add .
git commit -m "Short description of what changed"
git push
```

Examples of good commit messages:

- `"Add new gallery photos from Kampala concert"`
- `"Update home page hero copy"`
- `"Wire Niwewe audio to player"`
- `"Fix mobile menu on iPhone"`

That's it. Three commands. The bigger the project gets, the more grateful
you'll be that every change has a snapshot.

---

## If you ever break something

```bash
git log --oneline -10        # see the last 10 commits
git diff                     # see what's changed since your last commit
git restore .                # throw away unsaved changes and go back
```

If a commit is bad and you want to undo the last one (but keep the file
changes so you can re-edit):

```bash
git reset --soft HEAD~1
```

---

## Working on a second computer

When you set up a new machine (laptop, etc.):

```bash
cd ~/wherever-you-want-it
git clone https://github.com/YOUR-USERNAME/purity-mukisa-site.git
```

From then on, the same daily workflow works — just remember to `git pull`
at the start of each session so you grab anything you pushed from the
other machine.

---

## Common snags & fixes

**"Permission denied" or "Authentication failed"**
Run `git config --global credential.helper manager-core` and try again.
Git Credential Manager will pop up a browser sign-in.

**"Updates were rejected because the remote contains work that you do not have locally"**
You pushed from another machine. Run `git pull --rebase` then `git push`.

**File over 100 MB rejected**
GitHub blocks single files over 100 MB. The current site is fine (largest
file is the 10 MB studio shoot photo). If you ever add a big video, either
host it elsewhere (YouTube, Vimeo) and link to it, or set up Git LFS.

---

*Drafted for Hudson by Charis Creations Ltd × Cowork — May 2026*
