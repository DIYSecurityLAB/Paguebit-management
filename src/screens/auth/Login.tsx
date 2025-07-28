import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUserContext } from "../../context/user.context";
import {   Mail, Lock, Eye, EyeOff, Sun, Moon } from "lucide-react";
import Button from "../../components/Button";
import logo from '../../assets/PagueBit_black.svg';
import logoDark from '../../assets/PagueBit_white.svg';
import { useTheme } from '../../hooks/useTheme';
import { auth } from "../../data/datasource/firebase.datasource";
import { signInWithEmailAndPassword } from "firebase/auth";
import { AuthRepository } from "../../data/repository/auth-repository";
import { AuthUser } from "../../domain/entities/auth.entity";
import { mapAuthUserToUser } from "../../utils/authusertouserMapping";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useUserContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { theme, setTheme } = useTheme();
  const [loginAttempts, setLoginAttempts] = useState(0);

  const MAX_ATTEMPTS = 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError("");

    // Sanitizar entradas
    const sanitizedEmail = email.trim();
    const sanitizedPassword = password.trim();

    if (loginAttempts >= MAX_ATTEMPTS) {
      setError("Muitas tentativas. Tente novamente mais tarde.");
      setIsLoading(false);
      return;
    }

    try {
      // Login com Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, sanitizedEmail, sanitizedPassword);
      const user = userCredential.user;

      // Salvar a senha temporariamente para caso o usuário precise verificar email em outro dispositivo
      localStorage.setItem('tempPasswordForSignIn', sanitizedPassword);

      // Obter token do Firebase
      const firebaseToken = await user.getIdToken();
      localStorage.setItem("FIREBASE_TOKEN", firebaseToken);
      localStorage.setItem("TOKEN_TIMESTAMP", Date.now().toString());

      // Login na API usando AuthRepository
      try {
        const authRepo = new AuthRepository();
        const response = await authRepo.login(sanitizedEmail, firebaseToken);

        // Salve os tokens do backend corretamente
        if (response.accessToken) localStorage.setItem("ACCESS_TOKEN", response.accessToken);
        if (response.refreshToken) localStorage.setItem("REFRESH_TOKEN", response.refreshToken);
        if (response.tokenExpiresAt) localStorage.setItem("TOKEN_EXPIRES_AT", response.tokenExpiresAt);

        // Salvar usuário no contexto (usando User)
        if (response.user) {
          const authUser = AuthUser.fromModel(response.user);
          setUser(mapAuthUserToUser(authUser));
        }

        toast.success("Login realizado com sucesso!");
        navigate("/", { state: location.state });
      } catch (apiErr) {
        // apiErr pode ser um erro Axios ou fetch, tipar como desconhecido e tratar
        const errorResponse = apiErr as { response?: { data?: { code?: string; message?: string }; status?: number } };
        console.error("Erro na API:", errorResponse?.response?.data);

        setError("Erro ao autenticar. Por favor, tente novamente.");
        localStorage.removeItem("FIREBASE_TOKEN");
      }
      setLoginAttempts(0); // resetar tentativas em caso de sucesso
    } catch (err: any) {
      setLoginAttempts((prev) => prev + 1);
      let errorMessage = "Credenciais inválidas. Tente novamente.";
      if (err?.code === "auth/user-not-found" || err?.code === "auth/wrong-password") {
        errorMessage = "Email ou senha incorretos";
      } else if (err?.code === "auth/too-many-requests") {
        errorMessage = "Muitas tentativas. Tente novamente mais tarde";
      }
      setError(errorMessage);
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
        <div className="mt-4 text-center text-xs text-muted-foreground">
          <span>
            Quer se distrair? <a href="/notfound" className="text-primary hover:underline">Jogue alguns jogos enquanto espera seu acesso de admin</a>
          </span>
        </div>
      </div>
    </div>
  );
}