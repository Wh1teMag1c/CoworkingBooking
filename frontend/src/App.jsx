import {Navigate, Route, Routes} from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AboutPage from './pages/AboutPage';
import MyBookingsPage from './pages/MyBookingsPage';
import {useContext} from 'react';
import {AuthContext} from './context/AuthContext';

const ProtectedRoute = ({children}) => {
    const {user} = useContext(AuthContext);
    if (!user) {
        return <Navigate to="/login" replace/>;
    }
    return children;
};

function App() {
    const {loading} = useContext(AuthContext);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
                <div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}} role="status">
                    <span className="visually-hidden">Загрузка...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100 d-flex flex-column">
            <Navbar/>
            <main className="flex-grow-1">
                <Routes>
                    <Route path="/" element={<HomePage/>}/>
                    <Route path="/login" element={<LoginPage/>}/>
                    <Route path="/register" element={<RegisterPage/>}/>
                    <Route path="/about" element={<AboutPage/>}/>
                    <Route path="/bookings" element={<ProtectedRoute><MyBookingsPage/></ProtectedRoute>}/>
                </Routes>
            </main>
            <Footer/>
        </div>
    )
}

export default App;