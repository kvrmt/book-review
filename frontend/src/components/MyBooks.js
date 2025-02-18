import React, { useEffect, useState } from 'react';    //UI
import axios from 'axios';  //HTTP kérésekhez - GET POST PUT DELETE
import { useNavigate } from 'react-router-dom'; //Amikor navigálni szeretnénk egy másik oldalra vagy útvonalra

const MyBooks = () => {
    const [myBooks, setMyBooks] = useState([]);
    const navigate = useNavigate();
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('token'); // Token lekérése

    //Betöltéskor lekérjük a felhasználóhoz tartozó könyveket
    useEffect(() => {
        const fetchMyBooks = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/books/my-books', {
                    headers: {
                        Authorization: `Bearer ${token}`,  // Az aktuális token küldése
                    },
                });

                if (response.data && response.data.books) {
                    setMyBooks(response.data.books);
                } else {
                    console.log('Nincsenek saját könyvek.');
                }
            } catch (err) {
                console.error('Hiba a saját könyvek lekérésekor:', err);
                alert('Hiba történt a saját könyvek lekérésekor.');
            }
        };

        fetchMyBooks();
    }, []);
    
    //Törlés gomb megnyomásakor az adott könyv ID-je alapján törlésre kerül az adatbázisból
    const handleDelete = async (bookId) => {
        if (!window.confirm('Biztosan törölni szeretnéd ezt a könyvet?')) return;

        try {
            await axios.delete(`http://localhost:5000/api/books/delete/${bookId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });            

            setMyBooks(myBooks.filter((book) => book._id !== bookId));
            alert('Könyv sikeresen törölve!');
        } catch (err) {
            console.error('Hiba a könyv törlésekor:', err);
            alert(err.response?.data?.message || 'Hiba történt a könyv törlésekor.');
        }
    };

    return (
        <div className="container mt-5">
            <h1 className="text-center mb-4">📚 {username} könyvei 📚</h1>
            <button onClick={() => navigate('/dashboard')} className="btn btn-secondary mb-3">
                Vissza a főoldalra
            </button>
            {myBooks.length > 0 ? (
                <div className="row">
                    {myBooks.map((book) => (
                        <div key={book._id} className="col-md-4 mb-4">
                            <div className="card shadow-sm h-100">
                                <div className="card-body">
                                    <h5 className="card-title">{book.title}</h5>
                                    <h6 className="card-subtitle mb-2 text-muted">{book.author}</h6>
                                    <p className="card-text">
                                        <strong>Év:</strong> {book.year} <br />
                                        <strong>Műfaj:</strong> {book.genre}
                                    </p>
                                    <button className="btn btn-danger me-2" onClick={() => handleDelete(book._id)}>
                                        Töröl
                                    </button>
                                    <button className="btn btn-primary" onClick={() => navigate(`/edit/${book._id}`)}>
                                        Módosít
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-muted">Nincsenek saját könyvek.</p>
            )}
        </div>
    );
};

export default MyBooks;
