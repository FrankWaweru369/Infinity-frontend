import { useState } from "react";
import { useRouter } from "next/router";
import config from '../src/config';

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
  const updatedForm = { ...form, [e.target.name]: e.target.value };
  setForm(updatedForm);


  if (updatedForm.password && updatedForm.confirmPassword) {
    setPasswordsMatch(updatedForm.password === updatedForm.confirmPassword);
  } else {
    setPasswordsMatch(true);
  }
};

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");
  setSuccess("");

  try {
    const res = await fetch(`${config.apiUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    
    setSuccess("Registration successful! Redirecting to your dashboard...");
    setTimeout(() => {
      router.push("/dashboard");
    }, 2000);

  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
}; 

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md w-96 space-y-4"
      >
        <h1 className="text-xl font-bold text-center">Register</h1>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-500 text-sm text-center">{success}</p>}
        <input
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          className="w-full border rounded p-2"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full border rounded p-2"
          required
        />
        <div className="relative w-full">
  <input
    type={showPassword ? "text" : "password"}
    name="password"
    placeholder="Password"
    value={form.password}
    onChange={handleChange}
    className="w-full border rounded p-2 pr-12"
    required
  />

  <span
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-sm text-gray-600 select-none"
  >
    {showPassword ? "Hide" : "Show"}
  </span>
</div>

<div className="relative w-full">
  <input
    type={showConfirmPassword ? "text" : "password"}
    name="confirmPassword"
    placeholder="Confirm Password"
    value={form.confirmPassword}
    onChange={handleChange}
    className={`w-full border rounded p-2 pr-12 ${
      passwordsMatch ? "border-gray-300" : "border-red-500"
    }`}
    required
  />

  <span
    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-sm text-gray-600 select-none"
  >
    {showConfirmPassword ? "Hide" : "Show"}
  </span>

  
  {!passwordsMatch && form.confirmPassword.length > 0 && (
    <p className="text-red-500 text-xs mt-1">
      Passwords do not match
    </p>
  )}
</div>	 
	  
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
        >
          {loading ? "Registering..." : "Register"}
        </button>
	  <p className="text-center text-sm text-gray-600">
  Already have an account?{" "}
  <span
    onClick={() => router.push("/login")}
    className="text-purple-600 cursor-pointer font-semibold hover:underline"
  >
    Login
  </span>
</p>
      </form>
    </div>
  );
}
