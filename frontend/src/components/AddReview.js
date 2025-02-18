import React, { useEffect, useState } from 'react';    //UI
import axios from 'axios';  //HTTP kérésekhez - GET POST PUT DELETE
import { useNavigate, useParams } from 'react-router-dom';  //Amikor navigálni szeretnénk egy másik oldalra vagy útvonalra

const ReviewBook = () => {
    const [book, setBook] = useState({
        title: '',
        rating: '',  // Az új értékelés mező
        review: '',  // Az új vélemény mező
    });
    const [error, setError] = useState(null);
    const { bookId } = useParams();
    const navigate = useNavigate();

    //Betöltéskor lekérjük a könyvet amihez az értékelés lesz (Csak a címét használjuk a formon)
    useEffect(() => {
        const fetchBookDetails = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/books/${bookId}`);
                setBook({
                    ...book,
                    title: response.data.book.title,  // Csak a cím
                });
            } catch (err) {
                setError('Hiba a könyv adatainak betöltésekor.');
                console.error('Hiba:', err.response ? err.response.data : err);
            }
        };

        fetchBookDetails();
    }, [bookId]);

    //Mezőkből érték kiolvasás
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setBook((prevBook) => ({
            ...prevBook,
            [name]: value,
        }));
    };

    //Rögzítés gombnyomásra
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (book.rating < 1 || book.rating > 5) {//Ellenőrzés, hogy helyes érték-e
            alert('Az értékelésnek 1 és 5 között kell lennie!');
            return;
        }
        try {
            const token = localStorage.getItem('token');    //Token lekérése
            // Az új értékelés hozzáadása
            await axios.post(`http://localhost:5000/api/books/add-review/${bookId}`, {
                rating: book.rating,  // Az értékelés
                review: book.review,  // A vélemény
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });
            alert('Könyv értékelése sikeresen hozzáadva!');
            navigate('/');  //Vissza a főoldalra
        } catch (err) {
            alert('Hiba történt az értékelés hozzáadása közben.');
            console.error(err);
        }
    };

    return (
        <div className="container mt-5">
            <h1 className="text-center mb-4">⭐ Könyv értékelése ⭐</h1>
            {error && <p className="text-danger">{error}</p>}
            <div className="card p-4">
                <h2 className="text-center mb-4">{book.title}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="rating" className="form-label">Értékelés (1-5)</label>
                        <input
                            type="number"
                            className="form-control"
                            id="rating"
                            name="rating"
                            value={book.rating}
                            onChange={handleInputChange}
                            min="1"
                            max="5"
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="review" className="form-label">Vélemény</label>
                        <textarea
                            className="form-control"
                            id="review"
                            name="review"
                            value={book.review}
                            onChange={handleInputChange}
                            rows="4"
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-100">Értékelés hozzáadása</button>
                </form>
            </div>
        </div>
    );
};

export default ReviewBook;
