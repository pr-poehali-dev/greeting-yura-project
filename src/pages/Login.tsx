import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const AUTH_API = 'YOUR_AUTH_BACKEND_URL';

const Login = () => {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regNickname, setRegNickname] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(AUTH_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: loginEmail,
          password: loginPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        toast({
          title: "Успешный вход!",
          description: `Добро пожаловать, ${data.user.nickname}!`,
        });

        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      } else {
        toast({
          title: "Ошибка входа",
          description: data.error || 'Неверные данные',
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: 'Не удалось подключиться к серверу',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (regPassword.length < 6) {
      toast({
        title: "Ошибка",
        description: 'Пароль должен быть минимум 6 символов',
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(AUTH_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          email: regEmail,
          nickname: regNickname,
          password: regPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        toast({
          title: "Регистрация успешна!",
          description: `Получено 500 энергии! Добро пожаловать, ${data.user.nickname}!`,
        });

        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      } else {
        toast({
          title: "Ошибка регистрации",
          description: data.error || 'Не удалось зарегистрироваться',
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: 'Не удалось подключиться к серверу',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-blue-600 bg-clip-text text-transparent mb-2">
            PlutStudio
          </h1>
          <p className="text-gray-600">Создавайте сайты легко</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Вход</TabsTrigger>
            <TabsTrigger value="register">Регистрация</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Пароль</label>
              <Input
                type="password"
                placeholder="••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-red-500 to-blue-600 text-white"
            >
              {isLoading ? 'Загрузка...' : 'Войти'}
            </Button>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Никнейм</label>
              <Input
                placeholder="CoolUser"
                value={regNickname}
                onChange={(e) => setRegNickname(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Пароль</label>
              <Input
                type="password"
                placeholder="••••••"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
              />
            </div>
            <div className="bg-green-50 border border-green-200 rounded p-3 text-sm">
              <Icon name="Zap" size={16} className="inline mr-2 text-green-600" />
              <span className="text-green-700">При регистрации вы получите 500 энергии!</span>
            </div>
            <Button
              onClick={handleRegister}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white"
            >
              {isLoading ? 'Загрузка...' : 'Зарегистрироваться'}
            </Button>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Login;
