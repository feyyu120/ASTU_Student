import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './login';
import AdminDashboard from './admin';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;