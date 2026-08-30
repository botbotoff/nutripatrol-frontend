# nutripatrol-frontend
The front-end (React) of our Nutri-Patrol moderation tool. It is deployed @ https://nutripatrol.openfoodfacts.org/

## Nutripatrol API

This repository works with the backend of Nutri-Patrol: [Nutri-Patrol API](https://github.com/openfoodfacts/nutripatrol)
Please check this one before running the frontend.


## Current sources of reports for Nutri-Patrol
- Automatic population by Robotoff, based on Cloud Vision flagging (NSFW flags)
- Manual user reports from the Classic web app, as well as our next generation frontend, Open Food Facts Explorer
- The mobile app is currently not wired to send reports. An open PR awaits your help (Flutter)

## 🎨 Design
- [![Figma](https://img.shields.io/badge/figma-%23F24E1E.svg?logo=figma&logoColor=white) Mockups & Benchmarks for Nutri-Patrol](https://www.figma.com/design/SRU9iQ5DIpKNa6izKEiqyo/NutriPatrol--quality-?node-id=48-36&p=f&t=Ly2rYxJgs4fcTane-0)
- Are you a designer ? [Join the design team](https://github.com/openfoodfacts/openfoodfacts-design)
## Features
- Image reporting
- List of reported images
## Roadmap
- [ ] Improving usability of the tickets dashboard (more tickets per page, filtering tickets based on keyword, seeing the username of the reporter, and the name of the uploader)
- [ ] Adding quick actions to solve issues easily
- [ ] Turn Nutri-Patrol, in complement with Hunger Games into a true Hub for Data Quality

## Get started 🎯

### Prerequisites

The backend must be running first, otherwise every page that lists tickets stays empty
and the browser console fills with failed requests. Follow the instructions in
[nutripatrol](https://github.com/openfoodfacts/nutripatrol) — including the
`make migrate-db` step and the `AUTH_SERVER_STATIC` variable, both of which are required
for a local API to answer anything.

By default `.env.local` points at `http://localhost:8000/api/v1`, which is where the
backend's nginx container listens.

### Install

1. You can clone this repository :

` git clone https://github.com/openfoodfacts/nutripatrol-frontend.git `

2. Open the project folder :

` cd nutripatrol-frontend `

3. Install dependencies :

` yarn install `

4. Start vite :

` yarn dev `

5. Congratulations 🎉 ! [You can open frontend](http://localhost:5173/)

> [!NOTE]
> This project uses yarn — `yarn.lock` is the committed lockfile and there is no
> `package-lock.json`. Installing with npm resolves a different dependency tree.

### Logging in locally

`.env.local` ships with `VITE_DEVELOPPEMENT_MODE = "development"`, which makes the app
treat you as a logged-in moderator so you can reach `/moderation` and
`/image-moderation`. This only bypasses the *frontend* gate — the API still authenticates
every request. To get past it, either:

- paste an Open Food Facts session cookie into the backend's
  `/api/v1/set_session_cookie` endpoint (form available at
  <http://localhost:8000/api/docs>), making sure `VITE_PO_URL` here and
  `AUTH_SERVER_STATIC` / `OFF_TLD` on the backend all point at the same environment
  (`.org` or `.net`, not a mix); or
- query the API directly with the Robotoff bearer token from the backend's `.env`, which
  skips authentication entirely.

## Useful routes

### Report forms

1. To report an image : 
```
http://localhost:5173/flag/image?barcode=[BARCODE]&source=[SOURCE]&flavor=[FLACOR]&image_id=[IMAGE_ID]
```

2. To report a product :
```
http://localhost:5173/flag/product?barcode=[BARCODE]&source=[SOURCE]&flavor=[FLAVOR]
```

> [!NOTE] 
> Warning, source have to be 'web', 'mobile', 'robotoff'
> flavor have to be 'off', 'obf', 'opff', 'opf', 'off_pro'

## Contributors

<a href="https://github.com/openfoodfacts/nutripatrol-frontend/graphs/contributors">
<img alt="List of contributors to this repository" src="https://contrib.rocks/image?repo=openfoodfacts/nutripatrol-frontend" />
</a>
