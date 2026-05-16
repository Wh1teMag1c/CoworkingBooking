import {useContext} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {AuthContext} from '../context/AuthContext';

const Navbar = () => {
    const {user, logout} = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
            <div className="container">
                <Link className="navbar-brand" to="/">🏢 CoworkingBooking</Link>
                <div className="collapse navbar-collapse">
                    <ul className="navbar-nav me-auto">
                        <li className="nav-item">
                            <Link className="nav-link" to="/">Переговорные</Link>
                        </li>
                    </ul>
                    <div className="d-flex">
                        {user ? (
                            <>
                                <span className="navbar-text me-3">
                                    Привет, {user.username}!
                                </span>
                                <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
                                    Выйти
                                </button>
                            </>
                        ) : (
                            <Link className="btn btn-primary btn-sm" to="/login">
                                Войти
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;