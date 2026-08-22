# Yazin-link

Yazin-link is an image-link tool owned by **@pro_hg_i**. It creates a public direct image URL for every uploaded image, while the recent-links list remains stored locally in the visitor's browser.

## Copyright and use

> Copyright © 2026 @pro_hg_i. All rights reserved.

This repository is public so its development history can be viewed and GitHub Pages can host a frontend build. It is **not** an open-source license or a permission to reuse the product, brand, logo, assets, or code.

## Deployment architecture

The static interface is published on GitHub Pages at `https://y4zin.github.io/Yazin-link/`. GitHub Pages cannot itself sign image uploads. This project uses ImageKit for the public image URLs and a small signing API, with a complete Worker template and setup guide in [GITHUB_PAGES_IMAGEKIT_SETUP.md](./GITHUB_PAGES_IMAGEKIT_SETUP.md). The local recent-links view is available at `https://y4zin.github.io/Yazin-link/#/my-links`.
