import React, { useState } from 'react';    //UI
import axios from 'axios';  //HTTP kérésekhez - GET POST PUT DELETE

const Auth = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);

    //Regisztráció vagy bejelentkezés dinamika
    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = `http://localhost:5000/api/auth/${isLogin ? 'login' : 'register'}`;
        try {
            const res = await axios.post(url, { username, password });
            
            // Token és felhasználónév mentése
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('username', username);

            // Átirányítás a dashboardra
            window.location.href = '/dashboard';
        } catch (err) {
            console.error(err.response.data);
            alert('Hiba történt: ' + err.response.data.msg);
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-body">
                            <h2 className="card-title text-center">
                                {isLogin ? 'Bejelentkezés' : 'Regisztráció'}
                            </h2>
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label htmlFor="username" className="form-label">
                                        Felhasználónév
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="username"
                                        placeholder="Felhasználónév"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="password" className="form-label">
                                        Jelszó
                                    </label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        id="password"
                                        placeholder="Jelszó"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary w-100">
                                    {isLogin ? 'Bejelentkezés' : 'Regisztráció'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-link w-100 mt-2"
                                    onClick={() => setIsLogin(!isLogin)}
                                >
                                    {isLogin ? 'Nincs fiókod? Regisztrálj!' : 'Már van fiókod? Jelentkezz be!'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;