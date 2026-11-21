import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from "react-icons/fi";
import api from "../api";

function Register() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: ""
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const payload = {
                name: form.name.trim(),
                email: form.email.trim().toLowerCase(),
                password: form.password
            };

            const response = await api.post("/auth/register", payload);

            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));

            navigate("/dashboard", { replace: true });
        } catch (error) {
            console.error("Registration error:", error);
            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else if (error.code === "ERR_NETWORK") {
                setError(
                    import.meta.env.DEV
                        ? "Cannot connect to backend server. Please verify backend is running on port 5000."
                        : "Cannot connect to server. Please verify your backend server is running and CORS/API URL is configured correctly."
                );
            } else {
                setError("Registration failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 px-4 py-12">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-[#E9DFF5]">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <FiUser className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-[#241B35]">Create Account</h1>
                    <p className="mt-2 text-sm text-[#81758F]">Register to manage your tasks efficiently.</p>
                </div>

                {error && (
                    <div className="mb-6 rounded-xl bg-danger-50 border border-danger-100 p-4 text-sm text-danger-600">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-[#241B35] mb-2">Full Name</label>
                        <div className="relative">
                            <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400" />
                            <input
                                name="name"
                                type="text"
                                placeholder="John Doe"
                                value={form.name}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 pl-10 rounded-lg border border-[#E9DFF5] bg-white text-[#241B35] focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all duration-200"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#241B35] mb-2">Email Address</label>
                        <div className="relative">
                            <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400" />
                            <input
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 pl-10 rounded-lg border border-[#E9DFF5] bg-white text-[#241B35] focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all duration-200"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-[#241B35]">Password</label>
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-xs text-violet-600 hover:text-violet-700 transition-colors"
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                        <div className="relative">
                            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400" />
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Minimum 6 characters"
                                value={form.password}
                                onChange={handleChange}
                                minLength={6}
                                required
                                className="w-full px-4 py-3 pl-10 rounded-lg border border-[#E9DFF5] bg-white text-[#241B35] focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all duration-200"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow-sm transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>Creating Account...</span>
                            </>
                        ) : (
                            <>
                                Create Account
                                <FiArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-[#81758F]">
                    Already have an account?{" "}
                    <Link to="/login" className="font-semibold text-violet-600 hover:text-violet-500 hover:underline transition-colors">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default Register;
