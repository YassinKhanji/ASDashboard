"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Incorrect email or password.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 sm:p-8 overflow-hidden bg-background">
      {/* Cinematic Plant Background */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Image 
          src="/cinematic_plant_bg.png"
          alt="Cinematic Plant Background"
          fill
          priority
          className="object-cover object-center"
          quality={100}
        />
        {/* Subtle dark overlay for better text contrast */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        
        {/* Ambient glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-cyan/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-lime/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
      </div>

      <div className="relative z-10 w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
        {/* Glassmorphic Login Card */}
        <div className="glass-card !p-8 sm:!p-10 shadow-2xl shadow-black/50 border border-white/20 bg-black/30 backdrop-blur-xl relative overflow-hidden">
          
          {/* Subtle inner reflection */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl overflow-hidden shadow-lg shadow-black/40 border border-white/10 ring-4 ring-white/5 relative bg-white/5">
              <Image 
                src="/logo.png" 
                alt="Avenir Souriant" 
                fill
                className="object-cover" 
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h1>
            <p className="text-sm text-white/70 font-medium">Avenir Souriant Management Platform</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2 ml-1" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-accent-cyan rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-accent-cyan/20 transition-all duration-300"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2 ml-1" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-accent-cyan rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-accent-cyan/20 transition-all duration-300"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/90 p-1 rounded-md transition-colors focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm font-medium animate-in fade-in flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full mt-2 relative group overflow-hidden bg-accent-cyan/20 hover:bg-accent-cyan/30 border border-accent-cyan/30 text-accent-cyan font-bold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(77,184,255,0.15)] hover:shadow-[0_0_30px_rgba(77,184,255,0.3)]"
              disabled={loading}
            >
              {/* Button shine effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
              
              {loading ? (
                <div className="w-5 h-5 border-2 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} className="drop-shadow-md" />
                  Sign In
                </>
              )}
            </button>
            
            {/* Quick Login Helper for Testing */}
            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <button 
                type="button"
                onClick={() => { setEmail('admin@test.com'); setPassword('password'); }}
                className="text-xs text-white/40 hover:text-white/80 transition-colors underline underline-offset-2"
              >
                Use demo account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
