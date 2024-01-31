# asset-master
Full-stack web application intended to allows users to accurately track their finances with ease.

## Summary
This website application allows users to accurately track their finances, including their financial accounts, transactions, and monthly budgets.  With interactive graphs and charts powered by Chart JS, users can visualize yearly trends effortlessly. The tech stack for this application includes plain HTML/CSS and JavaScript for the front end and Express JS and SQL for the back end. Caching was made possible through an external Redis instance. This project is intended to be a learning experience for learning full-stack development. Explore the app, and share your feedback on features or improvements!

## Development Setup
1. Clone the repository:
    ```bash
    git clone https://github.com/jeffreyC4/finance-tracker project
    cd project
    ```
2. Update any dependencies (if any):
    ```bash
    npm update
    ```
3. Set up tables using starter code in `/database/startup.sql`
4. Environmental variables should be in the root `/.env` as follows:
   ```.env
   SERVER='SQL sever URL goes here'
   REDIS_URL='Redis URL goes here'
   SESSION_SECRET='Session secret key goes here for express-session'

   XRapidAPIKey='XRapidAPIKey goes here for Stock API'
   XRapidAPIHost='XRapidAPIHost goes here for Stock API'

   NODE_ENV='production OR anything else'
   PORT='Port goes here (80 for HTTPS)'
   ```
5. Use `npm run dev` for incrementing changes during production, and `npm start` to mimic production environment
6. Some example images of what a user layout would look like have been provided in the `samples` folder within the root of this project directory.

## Providers
- Database hosting services provided by [PlanetScale](https://planetscale.com/)
- Website and Redis services provided by [Render](https://render.com/)

> [!NOTE]
> Loading the website may be slow on first arrival. This is due to the fact that the server provided by Vercel must reload after some time has passed with no activity. Please revisit the site after some time to let it properly load up.
