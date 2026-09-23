# Vansh Parikh — Portfolio Site

A plain HTML/CSS/JS portfolio. No build tools, no npm — open `index.html`
in a browser and you're looking at the whole site.

## Files

- `index.html` — content and structure of every section
- `style.css` — all colors, fonts, spacing, layout
- `script.js` — the mobile menu toggle + auto-updating footer year
- `assets/vansh-photo.png` — your headshot
- `assets/resume.pdf` — compiled from `resume.tex` (edit the .tex and
  recompile with `pdflatex resume.tex` if you want to update it, or just
  swap in a new PDF with the same filename)

## Editing content

Everything you'd want to change lives in `index.html` as plain text —
project descriptions, experience bullets, skills, links. Open it in any
text editor (VS Code is a solid pick since you probably have Xcode/VS Code
already) and search for the words you want to change.

Colors live in `style.css` at the very top, under `:root`. Your accent
color is set once as `--accent: #093624;` — change that one line and
every button, headline highlight, and border that uses it updates
everywhere.

## Adding project screenshots / videos

Put files in `assets/projects/`. In `index.html`, each project has a
`<div class="media">` box. Replace the placeholder div inside it with:

- screenshot: `<img src="assets/projects/zoink.png" alt="Zoink">`
- video: `<video src="assets/projects/zoink.mp4" muted loop playsinline preload="metadata"></video>`

Videos auto-play only while on screen (handled in `script.js`). Keep
them small: the Whiskr clips were shrunk from ~26 MB to ~3 MB with:

```
ffmpeg -i input.mp4 -an -vf "scale=440:-2,fps=30" -c:v libx264 -crf 30 -movflags +faststart output.mp4
```

## Rounded vs. square corners

Everything is square. To round every corner on the site at once, change
`--radius: 0;` at the top of `style.css` to something like `14px`.

## Deploying to GitHub Pages (free hosting)

1. Go to https://github.com/new and create a new repository. Name it
   whatever you want — a common convention is `portfolio` or
   `VanshParikh1.github.io` (that second option, using your exact
   username, gives you the shortest possible URL — more on that below).
2. On your computer, open a terminal in this folder and run:
   ```
   git init
   git add .
   git commit -m "Initial portfolio site"
   git branch -M main
   git remote add origin https://github.com/VanshParikh1/YOUR-REPO-NAME.git
   git push -u origin main
   ```
3. On GitHub, go to your repo's **Settings → Pages**.
4. Under "Build and deployment", set **Source** to "Deploy from a branch",
   pick the `main` branch and `/ (root)` folder, then save.
5. Wait a minute or two, refresh that Pages settings page, and it'll show
   you a live URL.

If you named the repo exactly `VanshParikh1.github.io`, your site is
live at `https://vanshparikh1.github.io` with no extra path. Any other
repo name gives you `https://vanshparikh1.github.io/YOUR-REPO-NAME/`.

## Making changes later

Every time you edit a file and want the live site updated:
```
git add .
git commit -m "describe what you changed"
git push
```
GitHub Pages picks up the new push automatically within a minute or so.
