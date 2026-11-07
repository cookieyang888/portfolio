# David (Tianyu) Yang — Portfolio

This repository contains my personal portfolio website, created for DSC 106. It introduces my background, highlights selected data science projects, presents my resume, and provides a contact form.

## Live Website

Visit the portfolio at [cookieyang888.github.io/portfolio](https://cookieyang888.github.io/portfolio/).

## Pages

- **Home:** A brief introduction and profile photo
- **Projects:** Selected work with repository and live-demo links
- **Contact:** An email contact form
- **Resume:** Education, research experience, internship experience, skills, and interests

## Built With

- Semantic HTML5
- Responsive CSS
- GitHub Pages

## Project Structure

```text
portfolio/
├── index.html
├── style.css
├── images/
│   └── profile-photo.png
├── projects/
│   └── index.html
├── contact/
│   └── index.html
└── resume/
    └── index.html
```

## Run Locally

Clone the repository and open `index.html` in a browser:

```bash
git clone https://github.com/cookieyang888/portfolio.git
cd portfolio
open index.html
```

## Author

David (Tianyu) Yang — [GitHub](https://github.com/cookieyang888)

## Lab 6: Meta analysis

The Meta page visualizes line attribution from Git history with D3. Install dependencies with `npm ci`, then run `npm run analyze` after committing source changes to refresh `meta/loc.csv`. The analyzer uses four spaces per indentation level to match the existing portfolio. Commit the generated CSV; keep `node_modules/` ignored. Uncommitted edits appear as a synthetic zero commit, and untracked files cannot be attributed, so generate the final CSV from committed source.

The chart shows only commits represented in current lines, not every historical commit or full diff size. Dates and times use the viewer's local timezone. Hover or focus dots for details, click or press Enter to open GitHub, drag to brush, and use Clear selection or Escape to reset.
