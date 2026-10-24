# Veyra Digital — website

Portfolio website for **Veyra Digital**, the independent web design and development studio of Hishor Jeyaraj.

Plain HTML, CSS and JavaScript. There's no build step, no framework and no dependencies, so any static host will serve it as-is (GitHub Pages, Netlify, Cloudflare Pages, Vercel, or ordinary shared hosting).

## Structure

```
index.html                      Homepage: hero, work, services, studio, process, feedback, contact
work/crown-blade/index.html     Crown & Blade case study
404.html                        "Page not found" page
content/testimonials.js         Approved client testimonials (empty, so the section stays hidden)
assets/css/main.css             Design system and all styles
assets/js/main.js               Navigation, menu, reveals, form, testimonials, scroll moments
assets/js/sculpture.js          WebGL liquid-metal V sculpture (single shader, no libraries)
assets/img/                     Sculpture fallbacks, share image, icons
assets/work/crown-blade/        Crown & Blade screenshots (WebP)
assets/fonts/                   Geist, Geist Mono and Instrument Serif (self-hosted, SIL OFL)
favicon.svg, site.webmanifest, robots.txt
```

## Preview locally

The site works when you open `index.html` directly. To test it as it'll behave online, serve the folder:

```bash
python3 -m http.server 8000     # then open http://localhost:8000
```

## Updating content

### Contact details
The email address and Instagram link appear as plain text in the HTML. To change them, search and replace across these files:

- `hishor0526l@gmail.com` in `index.html`, `work/crown-blade/index.html` and `assets/js/main.js` (`CONTACT_EMAIL`, which the enquiry form uses)
- `https://www.instagram.com/hishor_06/` and `@hishor_06` in both HTML files

### Projects
Each project has:

1. **An exhibit on the homepage**, inside `<section id="work">` in `index.html`. Copy the `<article class="exhibit">` block for a new project, then change the screenshots, title, the "Concept project" chip (use something like "Client project" only for real paid work), the facts grid and the five notes.
2. **A case study page.** Copy `work/crown-blade/` to `work/<project-name>/` and edit the text and images.
3. **Screenshots** in `assets/work/<project-name>/`. Desktop shots are 1600 × 1000 (1440 px viewport at 2×, resized). Phone shots are 780 × 1688 (390 px viewport at 2×). Use WebP at about 80 % quality, and write a descriptive `alt` for every image.

Only claim results that you can show. Don't add revenue, conversion or customer figures unless the client has given you real numbers and agreed to publish them.

### Genuine client feedback
The "Client feedback" section is hidden until approved testimonials exist.

1. Open `content/testimonials.js`.
2. Add an entry for each testimonial a real client has approved:
   ```js
   window.VEYRA_TESTIMONIALS = [
     {
       quote: "The client's approved words, exactly as approved.",
       name: "First Last",
       business: "Business Name",
       role: "Owner",                         // optional
       image: "assets/img/clients/name.webp", // optional, only with permission
       imageAlt: "Portrait of First Last",    // optional
       approved: true                         // required
     }
   ];
   ```
3. The section appears automatically. Entries without `approved: true`, a quote, a name and a business are ignored.

To check the layout before adding anything, open the homepage with `?preview=testimonials` at the end of the address. This shows a clearly marked placeholder card that visitors never see.

### Enquiry form
No form backend is configured, so the form creates an email instead. The **Create email enquiry** button checks the fields, then opens a pre-filled email in the visitor's email app. The page says clearly that nothing is sent until the visitor presses Send there. It never shows a "message sent" confirmation, and it offers a **Copy enquiry text** fallback.

To use a form service later (for example Formspree or Netlify Forms), point the form's `action` at the service, then replace the `submit` handler in `assets/js/main.js` with a `fetch` POST. Only show a success message after the service confirms it received the enquiry.

## After deploying

Social previews need full URLs. Once the site has a public address, update the `<head>` of each page:

- change `og:image` to the full URL, for example `https://your-domain/assets/img/og-image.jpg`
- add `<meta property="og:url" content="https://your-domain/">` and `<link rel="canonical" href="https://your-domain/">`

`404.html` uses root-relative paths (`/assets/...`) because the host can serve it at any address. If the site lives in a sub-folder, such as a GitHub Pages project site at `username.github.io/repo/`, add that folder to those paths.

## The sculpture

`assets/js/sculpture.js` raymarches two chrome "blades" that form the split-V symbol. The hero version slowly melts and re-forms and leans toward the pointer. The contact version starts molten and resolves into the crisp symbol as you scroll.

To protect performance and accessibility, it only runs on desktop-class devices. The static renders in `assets/img/` (`sculpture-hero.webp`, `sculpture-symbol.webp`) are used instead on:

- phones and small tablets
- visitors who prefer reduced motion
- devices with low memory or few CPU cores, or with Save-Data turned on
- browsers without WebGL, or if the GPU context is lost

The animation pauses when it's off-screen or the tab is hidden, and lowers its resolution if frames get slow. For testing, add `?sculpture=force` or `?sculpture=off` to the address.

## Credits
Fonts: Geist and Geist Mono (Vercel) and Instrument Serif (Instrument), all under the SIL Open Font License. The licence files are in `assets/fonts/`.
