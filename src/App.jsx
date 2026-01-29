import './App.css'
import { BrowserRouter, Routes, Route } from "react-router";
import UserPage from './pages/UserPage';
import { useAuth0 } from '@auth0/auth0-react';
import HomePage from './pages/HomePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />}></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App
