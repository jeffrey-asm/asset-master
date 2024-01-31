# finance-tracker
Full-stack web application intended to allows users to accurately track their finances with ease.

## Summary
This website application allows users to accurately track their finances, including their financial accounts, transactions, and monthly budgets.  With interactive graphs and charts powered by Chart JS, users can visualize yearly trends effortlessly. The tech stack for this application includes plain HTML/CSS and JavaScript for the front end and Express JS and SQL for the back end. This project is intended to be a learning experience for learning full-stack development. Explore the app, and share your feedback on features or improvements!

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
   SERVER='sever goes here'
   SESSION_SECRET='session secret goes here'

   XRapidAPIKey='XRapidAPIKey goes here'
   XRapidAPIHost='XRapidAPIHost goes here'

   NODE_ENV='production OR anything else'
   PORT='port goes here'
   ```
5. Use `npm run dev` for incrementing changes during production, and `npm start` to mimic production environment
6. Some example images of what a user layout would look like have been provided in the `samples` folder within the root of this project directory.

## Credits
- Database hosting services provided by [PlanetScale](https://planetscale.com/)
- Website hosting services provided by [name](url)

## Possible Hosting Services
- [Azure](https://azure.microsoft.com/en-us/)
- [Vercel](https://vercel.com/)
- [Railway](https://railway.app/)

> [!NOTE]
> The name of the mock website is `Asset Master`, but this is not a commercial site and only intended for educational purposes.