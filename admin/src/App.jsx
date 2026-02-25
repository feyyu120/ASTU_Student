// App.jsx or main router
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminLogin from './login';
import AdminRegister from "./register"
import AdminDashboard from './admin';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/register" element={<AdminRegister />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}