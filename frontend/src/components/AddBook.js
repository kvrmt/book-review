import React, { useState } from 'react';    //UI
import axios from 'axios';  //HTTP kérésekhez - GET POST PUT DELETE
import { useNavigate } from 'react-router-dom'; //Amikor navigálni szeretnénk egy másik oldalra vagy útvonalra

const AddBookPage = () => {
    const [book, setBook] = useState({
        title: '',
        author: '',
        year: '',
        genre: '',
    });
    const navigate = useNavigate();

    //Mezőkből érték kiolvasás
    const handleChange = (e) => {
        const { name, value } = e.target;
        setBook({ ...book, [name]: value });
    };
    //Rögzítés gombnyomásra
    const handleSubmit = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem('token');    //Felhasználó token lekérés

        const addedBy = localStorage.getItem('id');//Kifogja hozzáadni? Tokenből lekérdez
        const newBook = {
            ...book,
            addedBy,  // A hozzáadó felhasználó beállítása
        };

        try {
            // POST kérés a könyv hozzáadásához
            const response = await axios.post('http://localhost:5000/api/books/add', newBook, {
                headers: {
                    Authorization: `Bearer ${token}`, // Token hozzáadása a kérésekkel
                }
            });
            alert(response.data.message);  // Üzenet a válaszból
            navigate('/dashboard');  // Visszairányít a dashboard oldalra
        } catch (err) {
            console.error('Hiba a könyv hozzáadásakor:', err);
            alert('Hiba történt a könyv hozzáadásakor.');
        }
    };

    return (
        <div className="container mt-5">
            <h2>📚 Új könyv hozzáadása 📚</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Cím</label>
                    <input
                        type="text"
                        className="form-control"
                        name="title"
                        value={book.title}
                        onChange={handleChange}
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Szerző</label>
                    <input
                        type="text"
                        className="form-control"
                        name="author"
                        value={book.author}
                        onChange={handleChange}
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Kiadás Éve</label>
                    <input
                        type="number"
                        className="form-control"
                        name="year"
                        value={book.year}
                        onChange={handleChange}
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Műfaj</label>
                    <input
                        type="text"
                        className="form-control"
                        name="genre"
                        value={book.genre}
                        onChange={handleChange}
                    />
                </div>
                <button type="submit" className="btn btn-primary">
                    Könyv hozzáadása
                </button>
            </form>
        </div>
    );
};

export default AddBookPage;
