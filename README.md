# Syed Nabeel Ahmed — Professional Portfolio

A modern, responsive, and fully editable portfolio website built for **Syed Nabeel Ahmed**.

![Portfolio Preview](assets/images/syed-nabeel-ahmed.jpg)

---

## ✨ Features

- **Editorial Design System**: Styled with warm sage tones (`#1e3b2b`, `#b3c7a6`, `#f8faf7`), bespoke arched geometry with double contour outlines, and typography (`DM Serif Display` + `Plus Jakarta Sans`).
- **Dynamic Content & Central Config**: All site data, projects, skills, and links are managed from [`portfolio-data.js`](portfolio-data.js).
- **Live In-Browser Visual Editor**: Floating on-page editor allowing you to click-to-edit text, upload/swap photos, save in browser storage, and export updated configuration files with 1 click.
- **Interactive Case Studies**: Detailed modal popups for recent engineering & product case studies.
- **Connected Social Profiles**: LinkedIn, GitHub, Instagram, and Email.
- **Zero Dependencies**: Lightweight, fast Vanilla HTML5, CSS3, and JavaScript.

---

## 🚀 Getting Started

### 1. View Locally
Simply double-click `index.html` in your file explorer, or serve it with Python:
```bash
python -m http.server 3000
```
Then open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Live On-Page Editing
1. Open the website in your browser.
2. Click the floating **"✏️ Edit Mode"** button in the bottom-left corner.
3. Click any text to type, or hover over any image and click **"📷 Change Photo"**.
4. Click **"💾 Save Changes"** or **"⬇️ Export Config"**.

### 3. Deploy to GitHub Pages
1. Push this repository to GitHub:
   ```bash
   git remote add origin https://github.com/nabeelsyed11/Portfolio.git
   git branch -M main
   git push -u origin main
   ```
2. Go to **Repository Settings** > **Pages**.
3. Under **Branch**, select `main` and root `/`, then click **Save**.
4. Your website will be live at `https://nabeelsyed11.github.io/Portfolio/`!

---

## 📂 Project Structure

```
├── index.html              # Main HTML structure with editor bindings
├── styles.css              # Custom CSS tokens, layouts & editor styles
├── script.js               # Dynamic renderer, modal views & interactions
├── editor.js               # Visual editor engine & image manager
├── portfolio-data.js       # Central data configuration
├── README.md               # Project documentation
├── .gitignore              # Git ignore rules
└── assets/
    └── images/             # High-resolution photography assets
        ├── syed-nabeel-ahmed.jpg
        ├── about-working.jpg
        ├── skills-desk.jpg
        ├── project-analytics.jpg
        ├── project-mobile.jpg
        └── project-ecommerce.jpg
```

---

## 📬 Contact

- **Name**: Syed Nabeel Ahmed
- **LinkedIn**: [syednabeelahmed1](https://www.linkedin.com/in/syednabeelahmed1)
- **GitHub**: [nabeelsyed11](https://github.com/nabeelsyed11)
- **Instagram**: [@nabeelsyed_](https://www.instagram.com/nabeelsyed_/)
- **Email**: [nabeelahmedna7860@gmail.com](mailto:nabeelahmedna7860@gmail.com)
