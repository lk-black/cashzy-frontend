// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  return (
    <Router>
      <nav style={{ padding: "1rem", backgroundColor: "#eee" }}>
        <Link to="/login" style={{ marginRight: "1rem" }}>Login</Link>
        <Link to="/register">Register</Link>
      </nav>

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<div style={{ padding: "2rem" }}>Página não encontrada</div>} />
      </Routes>
    </Router>
  );
}

export default App;
