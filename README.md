# Yazin-link

Yazin-link is a sharing tool owned by **@pro_hg_i**. It creates a public direct URL for every uploaded image and provides a separate files page that creates a public download URL for each uploaded file. The recent image-links list remains stored locally in the visitor's browser.

## Copyright and use

> Copyright © 2026 @pro_hg_i. All rights reserved.

This repository is public so its development history can be viewed and GitHub Pages can host a frontend build. It is **not** an open-source license or a permission to reuse the product, brand, logo, assets, or code.

## Deployment architecture

The static interface is published on GitHub Pages at `https://y4zin.github.io/Yazin-link/`. GitHub Pages cannot itself sign uploads. This project uses ImageKit for public image URLs and public file-download URLs, plus a small signing API, with a complete Worker template and setup guide in [GITHUB_PAGES_IMAGEKIT_SETUP.md](./GITHUB_PAGES_IMAGEKIT_SETUP.md). The image tool is available at `https://y4zin.github.io/Yazin-link/`, the file tool at `https://y4zin.github.io/Yazin-link/#/files`, and the local recent image-links view at `https://y4zin.github.io/Yazin-link/#/my-links`.

## File links

The **Files** section accepts a single non-empty file up to **25 MB**. It uploads each file to a dedicated `/yazin-link/files` folder and returns a public ImageKit URL with `ik-attachment=true`, so opening the shared URL downloads the exact same stored file for every visitor. The original file name is retained as the suggested download name.
