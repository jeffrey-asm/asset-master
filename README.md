# asset-master
Full-stack web application intended to allow users to accurately track their finances with ease.

## Summary
This website application allows users to accurately track their finances, including their financial accounts, transactions, and monthly budgets.  With interactive graphs and charts powered by Chart JS, users can visualize yearly trends effortlessly. The tech stack for this application includes plain HTML/CSS and JavaScript for the front end and Express JS and MySQL for the back end. Caching was made possible through an external Redis instance. This project is intended to be a learning experience for learning full-stack development. Explore the app, and share your feedback on features or improvements!

## Development Setup
1. Clone the repository:
    ```bash
    git clone https://github.com/jeffrey-asm/asset-master
    cd asset-master
    ```
2. Update any dependencies (if any):
    ```bash
    npm update
    ```
3. Set up tables using starter code in `/database/startup.sql`
    ```bash
    npm run seed
    ```
4. Use `npm run dev` for incrementing changes during development, and `npm start` to mimic the production environment
5. Some example images of what a user layout would look like have been provided in the `samples` folder within the root of this project directory.

> Due to changes made by database provider, PlantScale, this application is currently no longer deployed or being maintained. This will be addressed in the near future.
