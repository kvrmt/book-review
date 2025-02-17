import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const EditBook = () => {
    const [book, setBook] = useState({
        title: '',
        author: '',
        year: '',
        genre: ''
    });
    const [error, setError] = useState(null);
    const { bookId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBookDetails = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/books/${bookId}`);
                setBook(response.data.book);
            } catch (err) {
                setError('Hiba a könyv adatainak betöltésekor.');
                console.error('Hiba:', err.response ? err.response.data : err);  // Debug: Kiírja a hibát részletesebben
            }
        };
    
        fetchBookDetails();
    }, [bookId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setBook((prevBook) => ({
            ...prevBook,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/books/edit/${bookId}`, book, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });
            alert('A könyv sikeresen módosítva!');
            navigate('/my-books');
        } catch (err) {
            alert('Hiba történt a könyv módosítása közben.');
            console.error(err);
        }
    };

    return (
        <div className="container mt-5">
            <h1 className="text-center mb-4">Könyv módosítása</h1>
            {error && <p className="text-danger">{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="title" className="form-label">Cím</label>
                    <input
                        type="text"
                        className="form-control"
                        id="title"
                        name="title"
                        value={book.title}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="author" className="form-label">Szerző</label>
                    <input
                        type="text"
                        className="form-control"
                        id="author"
                        name="author"
                        value={book.author}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="year" className="form-label">Év</label>
                    <input
                        type="number"
                        className="form-control"
                        id="year"
                        name="year"
                        value={book.year}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="genre" className="form-label">Műfaj</label>
                    <input
                        type="text"
                        className="form-control"
                        id="genre"
                        name="genre"
                        value={book.genre}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary">Módosítás mentése</button>
            </form>
        </div>
    );
};

export default EditBook;