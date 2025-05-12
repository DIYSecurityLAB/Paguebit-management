import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";
import { useAuth } from "../../contexts/AuthContext";
import { Loader2, Mail, Lock, Eye, EyeOff, Sun, Moon } from "lucide-react";
import Button from "../../components/Button";
import apiClient from "../../datasource/api-client";
import logo from '../../assets/PagueBit_black.svg';
import logoDark from '../../assets/PagueBit_white.svg';
import { useTheme } from '../../hooks/useTheme';

export default function Login() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Obter o token do Firebase
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error("Usuário não autenticado no Firebase");
      const token = await firebaseUser.getIdToken();

      // Chamar o backend para validar e obter o usuário do sistema
      const response = await apiClient.post<{ user: any }>(
        "/auth/login",
        { token }
      );
      const userData = response.user || response;

      // Verificar se é admin
      if (userData.role !== "admin") {
        setError("Acesso restrito: apenas administradores podem acessar.");
        await auth.signOut();
        return;
      }

      // Se for admin, navega normalmente
      navigate("/");
    } catch (err: any) {
      setError("Erro ao fazer login. Verifique suas credenciais.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-muted">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-8">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <img
              src={theme === 'dark' ? logoDark : logo}
              alt="Pague Bit Logo"
              className="h-14 w-auto"
              style={{ display: 'inline-block' }}
            />
          </div>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="absolute right-6 top-6 p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Alternar tema"
            type="button"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-yellow-400" />
            ) : (
              <Moon className="h-5 w-5 text-slate-600" />
            )}
          </button>
          <h1 className="text-3xl font-bold text-foreground mb-2">Bem-vindo de volta</h1>
          <p className="text-muted-foreground">Acesse sua conta para continuar</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded text-red-700 text-sm mb-2">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-border bg-background text-foreground focus:ring-primary focus:border-primary transition"
                placeholder="seu@email.com"
                disabled={isLoading}
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-lg border-2 border-border bg-background text-foreground focus:ring-primary focus:border-primary transition"
                placeholder="Sua senha"
                disabled={isLoading}
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition"
                onClick={() => setShowPassword((v) => !v)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div />
            {/* <a href="/forgot-password" className="text-sm text-primary hover:underline">Esqueci minha senha</a> */}
          </div>
          <Button
            type="submit"
            className="w-full py-3 text-lg font-semibold"
            isLoading={isLoading}
          >
            Entrar
          </Button>
        </form>
        <div className="mt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} PagueBit. Todos os direitos reservados.
        </div>
        {/* NOVO: Link para jogos */}
        <div className="mt-4 text-center text-xs text-muted-foreground">
          <span>
            Quer se distrair? <a href="/notfound" className="text-primary hover:underline">Jogue alguns jogos enquanto espera seu acesso de admin</a>
          </span>
        </div>
      </div>
    </div>
  );
}