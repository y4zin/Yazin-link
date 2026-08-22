# Yazin-link

Yazin-link is an image-link tool owned by **@pro_hg_i**. It creates a public direct image URL for every uploaded image, while the recent-links list remains stored locally in the visitor's browser.

## Copyright and use

> Copyright © 2026 @pro_hg_i. All rights reserved.

This repository is public so its development history can be viewed and GitHub Pages can host a frontend build. It is **not** an open-source license or a permission to reuse the product, brand, logo, assets, or code.

## Deployment architecture

GitHub Pages can host the static user interface at `https://y4zin.github.io/Yazin-link/`. It cannot itself accept image uploads, store files, or serve the public `/i/{id}` image route. A separate image API plus public object storage are required for the upload tool to remain functional in a GitHub Pages deployment.

The current full project includes the server implementation for upload and public image delivery. Before switching the frontend to GitHub Pages, configure an independent API endpoint and object storage, then supply that endpoint as a build-time environment value.
