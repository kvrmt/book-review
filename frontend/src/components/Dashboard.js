import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
    const navigate = useNavigate();
    const [books, setBooks] = useState([]);

    const handleLogout = () => {
        // Token és felhasználónév törlése
        localStorage.removeItem('token');
        localStorage.removeItem('username');

        navigate('/');
        window.location.reload();
    };

    const username = localStorage.getItem('username');

    useEffect(() => {
        // Lekéri a könyveket az API-ból
        const fetchBooks = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/books');
                if (response.data && response.data.books) {
                    setBooks(response.data.books);
                } else {
                    console.log('Nincs könyv az adatbázisban.');
                }
            } catch (err) {
                console.error('Hiba a könyvek lekérésekor:', err);
                alert('Hiba történt a könyvek lekérésekor.');
            }
        };
        

        fetchBooks();
    }, []);  // Ez a useEffect csak egyszer fut le az oldal betöltésekor

    return (
        <div>
            <nav className="navbar navbar-expand-lg navbar-light bg-light">
                <div className="container-fluid">
                    <span className="navbar-brand">Üdvözöllek, {username}!</span>
                    <div className="d-flex ms-auto">
                        <button onClick={() => navigate('/add-book')} className="btn btn-primary me-2">
                            Könyv hozzáadása
                        </button>
                        <button onClick={handleLogout} className="btn btn-danger">
                            Kijelentkezés
                        </button>
                    </div>
                </div>
            </nav>

            <div className="container mt-5">
                <h1 className="text-center mb-4">📚 Könyvek listája</h1>
                {books.length > 0 ? (
                    <div className="row">
                        {books.map((book) => (
                            <div key={book._id} className="col-md-4 mb-4">
                                <div className="card shadow-sm h-100">
                                    <div className="card-body">
                                        <h5 className="card-title">{book.title}</h5>
                                        <h6 className="card-subtitle mb-2 text-muted">{book.author}</h6>
                                        <p className="card-text">
                                            <strong>Év:</strong> {book.year} <br />
                                            <strong>Műfaj:</strong> {book.genre}
                                        </p>
                                        <button className="btn btn-outline-primary w-100">Értékelem</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted">Nincsenek könyvek a listán.</p>
                )}
            </div>
        </div>
    );
};

export default Dashboard;