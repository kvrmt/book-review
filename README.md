backend (PORT:5000)
  !!! SZÜKSÉGES EGY .env fájl, ami az alábbiak szerint konfigurálandó a saját adatbázishoz: !!!
  
    PORT=5000
    MONGO_URI=mongodb+srv://username:password@cluster0.jhkr1.mongodb.net/book-review?retryWrites=true&w=majority&appName=Cluster0
    JWT_SECRET=supersecretkey
    
  Használt csomagok:
    "bcryptjs": "^3.0.0",
    "bootstrap": "^5.3.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.10.0",
    "react-bootstrap": "^2.10.9",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.1"
  
  /models
    Book.js  //Könyv modell
    Review.js  //Értékelés modell
    User.js  //Felhasználó modell
    
  /routes
    auth.js  //Bejelentkezés/Regisztráció kezelés
    bookRoutes.js  //Könyvek/Értékelések kezelése

  /swagger
    swagger.js   //ELÉRÉSE: http://localhost:5000/api-docs/

frontend (PORT:3000)
  Használt csomagok:
    "axios": "^1.7.9",
    "bootstrap": "^5.3.3",
    "cra-template": "1.2.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.1.5",
    "react-scripts": "5.0.1",
    "web-vitals": "^4.2.4"

  /src/components
    AddBook.js  //Könyv hozzáadása oldal
    AddReview.js  //Értékeléshozzáadása egy könyvhöz oldal
    Auth.js  //Bejelentkezés/Regisztrációs oldal
    Dashboard.js  //Bejelentkezett felhasználó felülete
    EditBook.js  //Egy saját könyv szerkesztése oldal
    EditReview.js  //Egy saját értékelés szerkesztése oldal
    MyBooks.js  //Saját könyvek olda
    MyReviews.js  //Saját értékelések oldal
    Reviews.js  //Egy könyv értékeléseinek megjelenítő oldala

  /src/routes
    AppRouter.js  //Navigálásért felelős
