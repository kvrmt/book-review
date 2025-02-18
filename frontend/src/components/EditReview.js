import React, { useEffect, useState } from 'react';    //UI
import axios from 'axios';  //HTTP kérésekhez - GET POST PUT DELETE
import { useNavigate, useParams } from 'react-router-dom'; //Amikor navigálni szeretnénk egy másik oldalra vagy útvonalra

const EditReview = () => {
    const [review, setReview] = useState({
        rating: '', //Az értékelés 1-5
        review: ''  //Szöveges vélemény
    });
    const [error, setError] = useState(null);
    const { reviewId } = useParams();
    const navigate = useNavigate();

    //Betöltéskor a korábbi adatokat vissza adjuk, ezt módosítja a feéhasználó
    useEffect(() => {
        const fetchReviewDetails = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/books/review/${reviewId}`);
                setReview(response.data.review);
            } catch (err) {
                setError('Hiba az értékelés adatainak betöltésekor.');
                console.error('Hiba:', err.response ? err.response.data : err);  // Debug: Kiírja a hibát részletesebben
            }
        };
    
        fetchReviewDetails();
    }, [reviewId]);

    //Mezők kiolvasása
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setReview((prevReview) => ({
            ...prevReview,
            [name]: value,
        }));
    };

    //Módosítás gomb akció
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/books/edit-review/${reviewId}`, review, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });
            alert('Az értékelés sikeresen módosítva!');
            navigate('/my-reviews');    //Vissza a felhasználó értékeléseihez
        } catch (err) {
            alert('Hiba történt az értékelés módosítása közben.');
            console.error(err);
        }
    };

    return (
        <div className="container mt-5">
            <h1 className="text-center mb-4">⭐ Értékelés módosítása ⭐</h1>
            {error && <p className="text-danger">{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="rating" className="form-label">Értékelés</label>
                    <input
                        type="number"
                        className="form-control"
                        id="rating"
                        name="rating"
                        value={review.rating}
                        onChange={handleInputChange}
                        min="1"
                        max="5"
                        required
                    />

                </div>
                <div className="mb-3">
                    <label htmlFor="review" className="form-label">Vélemény</label>
                    <input
                        type="text"
                        className="form-control"
                        id="review"
                        name="review"
                        value={review.review}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary">Módosítás mentése</button>
            </form>
        </div>
    );
};

export default EditReview;
