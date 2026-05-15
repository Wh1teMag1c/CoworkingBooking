import {Route, Routes} from 'react-router-dom';

const Home = () => <div className="container mt-5"><h1>Добро пожаловать в Коворкинг</h1></div>;
const Login = () => <div className="container mt-5"><h1>Страница Входа</h1></div>;

function App() {
    return (
        <div>
            <Routes>
                <Route path="/" element={<Home/>}/>
                <Route path="/login" element={<Login/>}/>
            </Routes>
        </div>
    )
}

export default App;