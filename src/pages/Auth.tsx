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

          <form onSubmit={handleSignIn} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="signin-email" className="text-base">E-mail</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="usuario@mppi.mp.br"
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
                {/* Recuperação de senha desativada: solicite ao administrador do sistema */}
              </div>
            </form>
          
        </div>
      </div>

      {/* Right side - Blue background with logo */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#003d6b] items-center justify-center p-8">
        <div className="text-white">
          {/* Placeholder for Athenas logo - can be replaced with actual logo */}
          <div className="text-center">
            <img
              src="/logosistema.png"
              alt="SIP - Sistema de Impacto de Pessoal"
              className="object-contain w-full max-w-[420px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
