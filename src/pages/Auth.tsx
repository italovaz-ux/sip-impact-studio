import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);


  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no login",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
      setShowForgotPassword(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar email",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-center mb-8">
            <img
              src="/Logo.jpeg"
              alt="MPPI Logo"
              className="h-24 object-contain"
            />
          </div>

          {showForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="text-base">E-mail</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="analista@mp.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-12" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar link de recuperação"
                )}
              </Button>
              <Button
                type="button"
                variant="link"
                className="w-full"
                onClick={() => setShowForgotPassword(false)}
              >
                Voltar ao login
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignIn} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="signin-email" className="text-base">Usuário</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="italovaz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-[#e8f0f7] border-0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password" className="text-base">Senha</Label>
                <Input
                  id="signin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-[#e8f0f7] border-0"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-[#003d6b] hover:bg-[#002d4f]" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Acessar minha conta"
                )}
              </Button>
              <div className="text-center space-y-2 text-sm">
                <p>
                  Esqueceu sua senha?{" "}
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-[#003d6b] hover:underline font-medium"
                  >
                    Recupere aqui
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Right side - Blue background with logo */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#003d6b] items-center justify-center p-8">
        <div className="text-white">
          {/* Placeholder for Athenas logo - can be replaced with actual logo */}
          <div className="text-center">
            <div className="text-6xl font-bold mb-4">ATHENAS</div>
            <div className="text-xl">SOLUÇÕES INTEGRADAS</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
