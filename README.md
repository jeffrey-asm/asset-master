# finance-tracker
Full-stack web application intended to allow users to track finances.


## Getting Started
1. Clone the repository:
    ```bash
    git clone https://github.com/jeffreyC4/finance-tracker
    cd your-project
    ```
2. Update any dependencies (if any):
    ```bash
    npm update
    ```
3. Set up tables using starter code in /database/startup.sql and credentials in the root .env file
4. Run local development environment
   ```bash
    npm start
    ```
5. Any changes made will automatically reset the development server. To remove this feature, replace start script below to `node ./bin/www`
   ```json
      "scripts": {
         "start": "nodemon ./bin/www"
      }
   ```
6. Some example images of what a user layout would look like have been provided in the `samples` folder within the root of this project directory.

## Credits
Many thanks to database hosting services provided by [PlanetScale](https://planetscale.com/)

## Possible Hosting Services
- [Azure](https://azure.microsoft.com/en-us/)
- [Vercel] (https://vercel.com/)
- [Railway](https://railway.app/)

> [!NOTE]
> The name of the mock website is `Asset Master`, but this is not a commercial site and only intended for educational purposes.