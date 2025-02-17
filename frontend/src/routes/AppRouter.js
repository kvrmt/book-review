import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Auth from '../components/Auth';
import Dashboard from '../components/Dashboard';
import AddBookPage from '../components/AddBookPage';
import MyBooks from '../components/MyBooks';
import EditBook from '../components/EditBook';
import ReviewBook from '../components/ReviewBook';

const AppRouter = () => {
    const isAuthenticated = !!localStorage.getItem('token'); // Ellenőrizzük, hogy van-e token

    return (
        <Router>
            <Routes>
                <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Auth />} />
                <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />} />
                <Route path="/add-book" element={isAuthenticated ? <AddBookPage /> : <Navigate to="/" />} />
                <Route path="/my-books" element={isAuthenticated ? <MyBooks /> : <Navigate to="/" />} />
                <Route path="/edit/:bookId" element={isAuthenticated ? <EditBook /> : <Navigate to="/" />} />
                <Route path="/review/:bookId" element={isAuthenticated ? <ReviewBook /> : <Navigate to="/" />} />
            </Routes>
        </Router>
    );
}

export default AppRouter;