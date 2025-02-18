import React, { useEffect, useState } from 'react';    //UI
import { useParams, useNavigate } from 'react-router-dom';  //HTTP kérésekhez - GET POST PUT DELETE
import axios from 'axios'; //Amikor navigálni szeretnénk egy másik oldalra vagy útvonalra

const Reviews = () => {
    const { bookId } = useParams();
    const navigate = useNavigate();
    const [reviews, setReviews] = useState([]);
    const [bookTitle, setBookTitle] = useState('');
    const [error, setError] = useState(null);

    //Betöltéskor lekérjük az adott könyv értékeléseit, hogy megjelenítsük
    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`http://localhost:5000/api/books/reviews/${bookId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.data && response.data.reviews) {
                    setReviews(response.data.reviews);
                    setBookTitle(response.data.bookTitle);
                } else {
                    setError('Nem találhatók értékelések.');
                }
            } catch (err) {
                setError('Hiba történt az értékelések lekérésekor.');
                console.error(err);
            }
        };

        fetchReviews();
    }, [bookId]);

    return (
        <div className="container mt-5">
            <h1 className="text-center mb-4">⭐ {bookTitle} - Értékelések ⭐</h1>
            {error && <p className="text-danger text-center">{error}</p>}
            {reviews.length > 0 ? (
                <ul className="list-group">
                    {reviews.map((review) => (
                        <li key={review._id} className="list-group-item">
                            {/* Csillagok inline módon */}
                            {[...Array(5)].map((_, index) => (
                                <span key={index} className={index < review.rating ? 'text-warning' : 'text-muted'}>
                                    ★
                                </span>
                            ))}
                            <p>{review.review}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-muted">Még nincs értékelés ehhez a könyvhöz.</p>
            )}
            <button className="btn btn-secondary mt-3" onClick={() => navigate(-1)}>Vissza</button>
        </div>
    );
};

export default Reviews;
