## backend (PORT:5000)
  **!!! SZÜKSÉGES EGY /backend/.env fájl, ami az alábbiak szerint konfigurálandó a saját adatbázishoz: !!!**
  
    PORT=5000
    MONGO_URI=mongodb+srv://username:password@cluster0.jhkr1.mongodb.net/book-review?retryWrites=true&w=majority&appName=Cluster0
    JWT_SECRET=supersecretkey
    
  ### Használt csomagok:
    npm install bcryptjs bootstrap cors dotenv express jsonwebtoken mongoose react-bootstrap swagger-jsdoc swagger-ui-express
  
### Könyvmodell és Útvonalak:
- **/models**
  - `Book.js`  Könyv modell
  - `Review.js`  Értékelés modell
  - `User.js`  Felhasználó modell

- **/routes**
  - `auth.js`  Bejelentkezés/Regisztráció kezelés
  - `bookRoutes.js`  Könyvek/Értékelések kezelése

- **/swagger**
  - `swagger.js`   ELÉRÉSE: http://localhost:5000/api-docs/


## frontend (PORT:3000)
  ### Használt csomagok:
    npm install axios bootstrap cra-template react-router-dom web-vitals

 ### Oldalak és komponensek:
- **/src/components**
  - `AddBook.js`  Könyv hozzáadása oldal
  - `AddReview.js`  Értékeléshozzáadása egy könyvhöz oldal
  - `Auth.js`  Bejelentkezés/Regisztrációs oldal
  - `Dashboard.js`  Bejelentkezett felhasználó felülete
  - `EditBook.js`  Egy saját könyv szerkesztése oldal
  - `EditReview.js`  Egy saját értékelés szerkesztése oldal
  - `MyBooks.js`  Saját könyvek olda
  - `MyReviews.js`  Saját értékelések oldal
  - `Reviews.js`  Egy könyv értékeléseinek megjelenítő oldala

- **/src/routes**
  - `AppRouter.js`  Navigálásért felelős
