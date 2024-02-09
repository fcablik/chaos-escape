# Chaos Escape

#### Author: [Filip Čablík](https://github.com/fcablik/)<br/>current version: 8.3.2
#### Description: Database of existing super/sports/hyper/luxury cars and dealers' listings of them.
#### Running Dev Server: [chaos-escape.fly.dev](https://chaos-escape.fly.dev/)
#### #Stack:
![Remix](https://img.shields.io/badge/remix-%23000.svg?style=for-the-badge&logo=remix&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white) 
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Radix UI](https://img.shields.io/badge/radix%20ui-161618.svg?style=for-the-badge&logo=radix-ui&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![ESLint](https://img.shields.io/badge/ESLint-4B3263?style=for-the-badge&logo=eslint&logoColor=white)
![NodeJS](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white) 
![NPM](https://img.shields.io/badge/NPM-%23CB3837.svg?style=for-the-badge&logo=npm&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![GitHub](https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/github%20actions-%232671E5.svg?style=for-the-badge&logo=githubactions&logoColor=white)
    <br/>+ Zod  | + Fly.io  | + Resend  | + react email  | + Playwright  | + Prettier

#### Initial localhost Base User Login After Seeding
  1. ```npm run setup```
  2. ```npm run dev```
  - username: woch
  - password: wochlife
<br/>

## Upcoming ToDos.. (currently in progress)
  - transform:
      - rooms -> brands
      - add models -> under brands
      - adding dealers
      - removing rooms additional routes

  - finish remaining dashboard routes' and components' UX/UI
  - implement translations with remix-i18 (load its locales from translations in database (translations are managable from admin by admin users))
  - re-implementing base users and onboarding possibility
    - add option for admin users to assign 'admin' permissions to other users from "/admin"
    - re-implement users' operations tests
  - implementing global-overview calendar planner - all rooms on X axis, Dates on Y axis (also called room occupancy matrix" or a "room availability matrix.")
  - implementing small calendars UX/UI, currently not very responsive
  - country specific cookie consents with its admin section management
    - content will possibly come directly from a translation for simple localization
  - fix transition of admin's sidebar child menus ( figure out a better way to handle z-index changes w/o the interaface-lags )

## Upcoming Fixes..
  - fix admin sidebar's "others" child box positioning on >lg devices
  - fix dark mode labels and fields text colors globally

## Upcoming Updates
  - update remix.run (to the latest stable, currently 2.3.1)
<br />

### About The ChaosEscape Stack
  ChaosEscape Stack is a solid and lightweight FullStack Development Environment (with the Epic-Stack as a base foundation) built to be able to create high performance Web Applications such as Chaos Escape.

### Base Stack & Decisions
  To get a break from 'analysis paralysis' right from the start, I had decided to start with the already throughout tested Remix starting stack - The Epic Stack, developed by Kent C Dodds & the community. The Epic Stack is an opinionated project starter, open-source - under the MIT license. I'd used it as a starter stack to get solid selection of technologies and tools, and of-course, to ship faster. Even further on into advanced development phases, The Epic Stack is a great project reference to look up to and make better decisions in implementations. -me/fcablik
<br/><br/>

<!-- ! REMOVE: "// Temporary DEVelopment Phase" permission request if not in dev phase -->
### Deploying to Fly.io
  - [see in Docs](https://github.com/fcablik/chaos-escape/blob/main/docs/deployment.md)

### Used Fonts
  - main-use/using: Nunito Sans, Nunito Sans Fallback (Google Font)

### Used Components
  - ##### radix ui
    - "@radix-ui/react-checkbox": "^1.0.4",
    - "@radix-ui/react-dropdown-menu": "^2.0.5",
    - "@radix-ui/react-label": "^2.0.2",
    - "@radix-ui/react-slot": "^1.0.2",
    - "@radix-ui/react-toast": "^1.1.4",
    - "@radix-ui/react-tooltip": "^1.0.6",

  - ##### sonner (https://sonner.emilkowal.ski/)
    - toast
<br/>

### Tips In Development
  - work with db (updating) --> schema.prisma: adding new models (table) -> we need to issue a migration (npx prisma migrate dev (lose data-continue-   yes)+enter migration name)   ((WARNING) : old session is holding the old seed, so we need to clear the cookies/sessions in the browser (untill  fixed in epicstack itself))
  - migrating local db data to production app - "/prisma/seedin-data-to-production.pdf"
  - ! creating modules logic: Create whole modules with whole sections & each section's component/text will be displayed conditionally - inputed/ filled in ->display, otherwise don't

  - seeding production database - https://github.com/epicweb-dev/epic-stack/blob/main/docs/deployment.md#seeding-production
<br/>

## Useful Project's Commands
  - #### mac rubbish files in project removal !
    - "find ./ -name ".DS_Store" -print -delete"
      list of problems caused by these files
      - "Error: Cannot add empty string to PrefixLookupTrie"

  - #### prisma migrating db to new schema
    - "npx prisma migrate dev"

  - #### prisma db live preview
    - "npx prisma studio" (localhost:5555)

  - #### connecting to deployed fly's app's db
    1. "fly proxy 5556:5555 --app [APP_NAME]"
    2. "fly ssh console -C "npx prisma studio" --app [APP_NAME]"
      ("fly ssh console -C "npm run prisma:studio" --app [APP_NAME]")

  - #### deployment errors!
    - prisma Error: P3009 (migrate found failed migrations in the target database, new migrations will not be applied. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve)
        - this error appears most commonly when pushing new columns to a table that already has data in it
        - to prevent => add default values / or have 0 data in the changed tables (models)
<br/>

## Services Docs
- #### fly.io
  1. register to fly.io
  2. input credit-card (for verification, this app's stack fits within the free tier) (fly.io is demanding only payments over $5/month, which will be very hard to get over with only 1VM image & server running)
  3. authorize project's signup
  3. setup project for deployment

- #### resend.com
  1. register web/app owner to: https://resend.com
  2. validate mail/domain DNS of the contact form emails receiver: https://resend.com/domains (needs to be configured in domain's DNS settings)
  3. optional: invite members to the resend.com app: https://resend.com/settings/team 
  4. enjoy your 3,000/month free emails (100 emails / day)
    - upgrade option: 5,000 - 50,000 emails/month: $20/month
<br/>

## seeding production DB (from Kent)
------------------------- Manual Seeding Acc. To Kent in Epic-Stack -------------------------
Hey there, Kent here! This is how you can reliably seed your database with some data. You edit the migration.sql file and that will handle it for you. I determined this by running a minimal seed via `MINIMAL_SEED=true npx prisma db seed` and then creating a sql dump via `sqlite3 prisma/data.db .dump > seed.sql`. Then I grabbed the relevant bits for the initial seed and put them here.
<br/><br/>

## custom notes for better development
  1. expressions
    - "&&" vs "? : null" -> && is not the best practice to use for other than boolean values, we can also convert e.g. "contacts.length" into "!!values.length", which negates twice and gets boolean value to evaluate the same as "values.length > 0 ?" would, but be careful, it's better not to use it with absolute non-boolean values and rather use "values.length ? "xyz" : null"

  2. prefetching routes on Links
```
    <>
      <Link /> {/* defaults to "none" */}
      <Link prefetch="none" />
      <Link prefetch="intent" />
      <Link prefetch="render" />
      <Link prefetch="viewport" />
    </>
```

  3. preventScrollReset
    - If you are using ```<ScrollRestoration>```, this lets you prevent the scroll position from being reset to the top of the window when the link is clicked.
    ```<Link to="?tab=one" preventScrollReset />```

  4. reloadDocument
    - Will use document navigation instead of client side routing when the link is clicked, the browser will handle the transition normally (as if it were an ```<a href>```).
    ```<Link to="/logout" reloadDocument />```
