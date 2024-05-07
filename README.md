# asset-master

Full-stack web application intended to allow users to accurately track their finances with ease.

## Summary

This website application allows users to accurately track their finances, including their financial accounts, transactions, and monthly budgets.  With interactive graphs and charts powered by Chart JS, users can visualize yearly trends effortlessly. The tech stack for this application includes plain HTML/CSS and JavaScript for the front end and Express JS and MySQL for the back end. Caching was made possible through an internal Redis instance. This project is intended to be a learning experience for learning full-stack development. Explore the app, and share your feedback on features or improvements!

## Development

Please ensure Node and Docker are installed locally before attempting to run the following commands.

1. Install all dependencies:

    ```bash
    npm update
    ```

2. Initialize essential services found in `docker-compose.yaml`

   ```bash
   docker compose up
   ```

3. The site can be visited through [http://localhost:3000](http://localhost:3000/)
