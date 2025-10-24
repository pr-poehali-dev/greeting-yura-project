import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const ADMIN_API = 'YOUR_ADMIN_BACKEND_URL';

interface User {
  id: number;
  email: string;
  nickname: string;
  energy: number;
  is_admin: boolean;
  total_projects: number;
  total_publishes: number;
  created_at: string;
}

interface Stats {
  total_users: number;
  total_projects: number;
  total_published: number;
  total_energy_distributed: number;
}

const Admin = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [targetEmail, setTargetEmail] = useState('');
  const [energyAmount, setEnergyAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const token = localStorage.getItem('auth_token');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!currentUser.is_admin) {
      toast({
        title: "Доступ запрещен",
        description: "Только для администраторов",
        variant: "destructive",
      });
      setTimeout(() => window.location.href = '/', 1000);
      return;
    }

    loadStats();
    loadUsers();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch(`${ADMIN_API}?action=stats`, {
        headers: { 'X-Auth-Token': token || '' }
      });
      const data = await response.json();
      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch(`${ADMIN_API}?action=users`, {
        headers: { 'X-Auth-Token': token || '' }
      });
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleGiveEnergy = async () => {
    if (!targetEmail || !energyAmount || parseInt(energyAmount) <= 0) {
      toast({
        title: "Ошибка",
        description: "Заполните все поля корректно",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(ADMIN_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token || ''
        },
        body: JSON.stringify({
          action: 'give_energy',
          target_email: targetEmail,
          amount: parseInt(energyAmount),
          reason: reason || 'Admin award'
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Энергия начислена!",
          description: `${data.target_user} получил ${data.amount} энергии. Новый баланс: ${data.new_energy}`,
        });
        setTargetEmail('');
        setEnergyAmount('');
        setReason('');
        loadUsers();
        loadStats();
      } else {
        toast({
          title: "Ошибка",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: 'Не удалось начислить энергию',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Админ-панель
          </h1>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            <Icon name="ArrowLeft" size={16} className="mr-2" />
            Назад
          </Button>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Пользователей</p>
                  <p className="text-3xl font-bold text-blue-700">{stats.total_users}</p>
                </div>
                <Icon name="Users" size={40} className="text-blue-400" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Проектов</p>
                  <p className="text-3xl font-bold text-green-700">{stats.total_projects}</p>
                </div>
                <Icon name="FolderOpen" size={40} className="text-green-400" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Опубликовано</p>
                  <p className="text-3xl font-bold text-purple-700">{stats.total_published}</p>
                </div>
                <Icon name="Rocket" size={40} className="text-purple-400" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Энергия</p>
                  <p className="text-3xl font-bold text-yellow-700">{stats.total_energy_distributed}</p>
                </div>
                <Icon name="Zap" size={40} className="text-yellow-400" />
              </div>
            </Card>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Icon name="Zap" size={24} className="text-yellow-500" />
              Начислить энергию
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Email или никнейм пользователя</label>
                <Input
                  placeholder="user@example.com или nickname"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Количество энергии</label>
                <Input
                  type="number"
                  placeholder="500"
                  value={energyAmount}
                  onChange={(e) => setEnergyAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Причина (опционально)</label>
                <Input
                  placeholder="За активность"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <Button
                onClick={handleGiveEnergy}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white"
              >
                <Icon name="Zap" size={16} className="mr-2" />
                Начислить энергию
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Icon name="Users" size={24} />
              Пользователи ({users.length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {users.map((user) => (
                <Card key={user.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{user.nickname}</p>
                        {user.is_admin && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <div className="flex gap-3 mt-1 text-xs text-gray-500">
                        <span>⚡ {user.energy}</span>
                        <span>📁 {user.total_projects}</span>
                        <span>🚀 {user.total_publishes}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;
