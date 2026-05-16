import {Route, Routes} from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';

function App() {
    return (
        <div className="bg-light min-vh-100">
            <Navbar/>
            <Routes>
                <Route path="/" element={<HomePage/>}/>
                <Route path="/login" element={<LoginPage/>}/>
            </Routes>
        </div>
    )
}

export default App;