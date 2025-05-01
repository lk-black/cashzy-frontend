// src/pages/Register.jsx
import { useState } from "react";
import { register } from "../services/authService";
import { useNavigate } from "react-router-dom";

function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    cpf: "",
    phone: "",
    birth_date: "",
    balance: 0,
    total_income: 0,
    total_expense: 0
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await register(formData);
      setMessage("Cadastro realizado! Verifique seu email.");
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Erro ao cadastrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto" }}>
      <h2>Cadastro</h2>
      <form onSubmit={handleSubmit}>
        {["email", "password", "name", "cpf", "phone", "birth_date"].map((field) => (
          <div key={field}>
            <label>{field}</label>
            <input
              type={field === "password" ? "password" : "text"}
              name={field}
              value={formData[field]}
              onChange={handleChange}
              required
            />
          </div>
        ))}
        <button type="submit" disabled={loading}>
          {loading ? "Cadastrando..." : "Cadastrar"}
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default Register;
