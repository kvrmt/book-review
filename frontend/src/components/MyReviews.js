import React, { useEffect, useState } from 'react';    //UI
import axios from 'axios';  //HTTP kérésekhez - GET POST PUT DELETE
import { useNavigate } from 'react-router-dom'; //Amikor navigálni szeretnénk egy másik oldalra vagy útvonalra

const MyReviews = () => {
    const [myReviews, setMyReviews] = useState([]);
    const navigate = useNavigate();
    const username = localStorage.getItem('username'); //Felhasználónév lekérése a megjelenítéshez/üdvözléshez
    const token = localStorage.getItem('token'); // Token lekérése

    //Betöltéskor lekérjük a felhasználóhoz tartozó értékeléseket, hogy megjelenítsük
    useEffect(() => {
        const fetchMyReviews = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/books/my-reviews', {
                    headers: {
                        Authorization: `Bearer ${token}`,  // Az aktuális token küldése
                    },
                });

                if (response.data && response.data.reviews) {
                    setMyReviews(response.data.reviews);
                } else {
                    console.log('Nincsenek saját értékelések.');
                }
            } catch (err) {
                console.error('Hiba a saját értékelések lekérésekor:', err);
                alert('Hiba történt a saját értékelések lekérésekor.');
            }
        };

        fetchMyReviews();
    }, []);

    //Törlés gombra töröljük az értékelést az ID-ja alapján
    const handleDelete = async (reviewId) => {
        if (!window.confirm('Biztosan törölni szeretnéd ezt az értékelést?')) return;

        try {
            await axios.delete(`http://localhost:5000/api/books/delete-review/${reviewId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });            

            setMyReviews(myReviews.filter((review) => review._id !== reviewId));
            alert('Értékelés sikeresen törölve!');
        } catch (err) {
            console.error('Hiba at értékelés törlésekor:', err);
            alert(err.response?.data?.message || 'Hiba történt at értékelés törlésekor.');
        }
    };

    return (
        <div className="container mt-5">
            <h1 className="text-center mb-4">⭐ {username} értékelései⭐</h1>
            <button onClick={() => navigate('/dashboard')} className="btn btn-secondary mb-3">
                Vissza a főoldalra
            </button>
            {myReviews.length > 0 ? (
                <div className="row">
                    {myReviews.map((review) => (
                        <div key={review._id} className="col-md-4 mb-4">
                            <div className="card shadow-sm h-100">
                                <div className="card-body">
                                    <h5 className="card-title">Könyv: {review.bookTitle}</h5>
                                    <h5 className="card-subtitle mb-2 text-muted">Értékelés: 
                                        {/* Csillagok inline módon */}
                                        {[...Array(5)].map((_, index) => (
                                        <span key={index} className={index < review.rating ? 'text-warning' : 'text-muted'}>
                                        ★
                                        </span>
                                        ))}
                                    </h5>
                                    <p className="card-text">
                                        <strong>Vélemény: {review.review}</strong> {} <br />
                                    </p>
                                    <button className="btn btn-danger me-2" onClick={() => handleDelete(review._id)}>
                                        Töröl
                                    </button>
                                    <button className="btn btn-primary" onClick={() => navigate(`/edit-review/${review._id}`)}>
                                        Módosít
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-muted">Nincsenek értékelésid.</p>
            )}
        </div>
    );
};

export default MyReviews;