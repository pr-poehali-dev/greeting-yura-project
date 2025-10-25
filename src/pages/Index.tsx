import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const PROJECTS_API = 'https://functions.poehali.dev/fbacc2fb-c355-412d-9250-11bc9088ce40';
const VIEW_URL = 'https://functions.poehali.dev/da111202-0c0a-40bc-a2af-421384b780eb';
const AI_GENERATE_API = 'https://functions.poehali.dev/37e6b8f9-0e89-4353-9b4e-e7adcd3b450a';

interface Project {
  id: string;
  name: string;
  description: string;
  html_code?: string;
  css_code?: string;
  js_code?: string;
  created_at?: string;
  user_id?: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  password: string;
}

interface FileItem {
  name: string;
  type: 'html' | 'css' | 'js' | 'image';
  content: string;
  size: string;
}

const Index = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthMode, setIsAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [htmlCode, setHtmlCode] = useState('<!DOCTYPE html>\n<html lang="ru">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Мой сайт</title>\n</head>\n<body>\n  <h1>Добро пожаловать!</h1>\n  <p>Это мой первый сайт на PlutEdit</p>\n</body>\n</html>');
  const [cssCode, setCssCode] = useState('body {\n  font-family: Arial, sans-serif;\n  margin: 0;\n  padding: 40px;\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  color: white;\n  text-align: center;\n  min-height: 100vh;\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n}\n\nh1 {\n  font-size: 3em;\n  margin: 0;\n}\n\np {\n  font-size: 1.2em;\n  opacity: 0.9;\n}');
  const [jsCode, setJsCode] = useState('console.log("Сайт загружен!");');
  const [activeTab, setActiveTab] = useState('html');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [aiDescription, setAiDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadProjects();
    }
  }, [currentUser]);

  const handleLogin = () => {
    if (!authEmail || !authPassword) {
      toast({
        title: "Ошибка",
        description: "Заполните все поля",
        variant: "destructive",
      });
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find((u: User) => u.email === authEmail && u.password === authPassword);

    if (user) {
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      toast({
        title: "Добро пожаловать!",
        description: `Рады видеть вас, ${user.username}`,
      });
      setAuthEmail('');
      setAuthPassword('');
    } else {
      toast({
        title: "Ошибка",
        description: "Неверный email или пароль",
        variant: "destructive",
      });
    }
  };

  const handleRegister = () => {
    if (!authEmail || !authPassword || !authUsername) {
      toast({
        title: "Ошибка",
        description: "Заполните все поля",
        variant: "destructive",
      });
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.find((u: User) => u.email === authEmail)) {
      toast({
        title: "Ошибка",
        description: "Пользователь с таким email уже существует",
        variant: "destructive",
      });
      return;
    }

    const newUser: User = {
      id: Math.random().toString(36).substring(2, 11),
      username: authUsername,
      email: authEmail,
      password: authPassword,
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    setCurrentUser(newUser);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    
    toast({
      title: "Регистрация успешна!",
      description: `Добро пожаловать, ${newUser.username}`,
    });
    
    setAuthEmail('');
    setAuthPassword('');
    setAuthUsername('');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setProjects([]);
    toast({
      title: "Выход выполнен",
      description: "До скорой встречи!",
    });
  };

  const loadProjects = () => {
    if (!currentUser) return;
    
    const localProjects = JSON.parse(localStorage.getItem('projects') || '[]');
    const userProjects = localProjects.filter((p: Project) => p.user_id === currentUser.id);
    setProjects(userProjects);
  };

  const saveProjectToLocalStorage = (project: Project) => {
    const localProjects = JSON.parse(localStorage.getItem('projects') || '[]');
    const existingIndex = localProjects.findIndex((p: Project) => p.id === project.id);
    
    if (existingIndex >= 0) {
      localProjects[existingIndex] = project;
    } else {
      localProjects.push(project);
    }
    
    localStorage.setItem('projects', JSON.stringify(localProjects));
  };

  const generateSiteFromDescription = async () => {
    if (!aiDescription.trim()) {
      toast({
        title: "Ошибка",
        description: "Опишите, какой сайт вы хотите создать",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch(AI_GENERATE_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: aiDescription
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка генерации');
      }

      const data = await response.json();
      
      setHtmlCode(data.html);
      setCssCode(data.css);
      setJsCode(data.js);
      setProjectName(aiDescription.slice(0, 50));
      setProjectDescription(aiDescription);

      toast({
        title: "Сайт создан! 🎉",
        description: "AI сгенерировал уникальный код специально для вас",
      });

      setAiDescription('');
    } catch (error: any) {
      toast({
        title: "Ошибка генерации",
        description: error.message || "Не удалось создать сайт. Проверьте API ключ в настройках.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSiteFromDescriptionOld = async () => {
    if (!aiDescription.trim()) {
      toast({
        title: "Ошибка",
        description: "Опишите, какой сайт вы хотите создать",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const templates: { [key: string]: { html: string; css: string; js: string } } = {
        landing: {
          html: `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${aiDescription.slice(0, 50)}</title>
</head>
<body>
  <header>
    <nav>
      <div class="logo">Логотип</div>
      <ul>
        <li><a href="#home">Главная</a></li>
        <li><a href="#about">О нас</a></li>
        <li><a href="#services">Услуги</a></li>
        <li><a href="#contact">Контакты</a></li>
      </ul>
    </nav>
  </header>

  <section id="home" class="hero">
    <div class="hero-content">
      <h1>Добро пожаловать!</h1>
      <p>${aiDescription}</p>
      <button class="cta-button">Начать</button>
    </div>
  </section>

  <section id="about">
    <h2>О нас</h2>
    <p>Мы предоставляем лучшие решения для вашего бизнеса</p>
  </section>

  <section id="services">
    <h2>Наши услуги</h2>
    <div class="services-grid">
      <div class="service-card">
        <h3>Услуга 1</h3>
        <p>Описание услуги</p>
      </div>
      <div class="service-card">
        <h3>Услуга 2</h3>
        <p>Описание услуги</p>
      </div>
      <div class="service-card">
        <h3>Услуга 3</h3>
        <p>Описание услуги</p>
      </div>
    </div>
  </section>

  <section id="contact">
    <h2>Свяжитесь с нами</h2>
    <form id="contactForm">
      <input type="text" placeholder="Ваше имя" required>
      <input type="email" placeholder="Email" required>
      <textarea placeholder="Сообщение" required></textarea>
      <button type="submit">Отправить</button>
    </form>
  </section>

  <footer>
    <p>&copy; 2024 Все права защищены</p>
  </footer>
</body>
</html>`,
          css: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
}

header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem 2rem;
  position: fixed;
  width: 100%;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
}

nav ul {
  display: flex;
  list-style: none;
  gap: 2rem;
}

nav a {
  color: white;
  text-decoration: none;
  transition: opacity 0.3s;
}

nav a:hover {
  opacity: 0.8;
}

.hero {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  padding: 2rem;
}

.hero-content h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  animation: fadeInUp 1s;
}

.hero-content p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  animation: fadeInUp 1s 0.2s both;
}

.cta-button {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  background: white;
  color: #667eea;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: transform 0.3s;
  animation: fadeInUp 1s 0.4s both;
}

.cta-button:hover {
  transform: scale(1.05);
}

section {
  padding: 4rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

section h2 {
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 2rem;
  color: #667eea;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.service-card {
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 10px;
  text-align: center;
  transition: transform 0.3s, box-shadow 0.3s;
}

.service-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.service-card h3 {
  color: #667eea;
  margin-bottom: 1rem;
}

form {
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

form input,
form textarea {
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 5px;
  font-size: 1rem;
  font-family: inherit;
}

form input:focus,
form textarea:focus {
  outline: none;
  border-color: #667eea;
}

form textarea {
  min-height: 150px;
  resize: vertical;
}

form button {
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: opacity 0.3s;
}

form button:hover {
  opacity: 0.9;
}

footer {
  background: #333;
  color: white;
  text-align: center;
  padding: 2rem;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  nav ul {
    gap: 1rem;
  }
  
  .hero-content h1 {
    font-size: 2rem;
  }
  
  section h2 {
    font-size: 2rem;
  }
}`,
          js: `document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('contactForm');
  
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      alert('Спасибо за ваше сообщение! Мы свяжемся с вами в ближайшее время.');
      form.reset();
    });
  }

  const links = document.querySelectorAll('nav a');
  links.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'opacity 0.6s, transform 0.6s';
    observer.observe(section);
  });

  console.log('Сайт загружен и готов к работе!');
});`
        },
        portfolio: {
          html: `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Портфолио</title>
</head>
<body>
  <div class="container">
    <header class="hero">
      <h1>Мое Портфолио</h1>
      <p class="subtitle">${aiDescription}</p>
    </header>

    <section class="about">
      <h2>Обо мне</h2>
      <p>Профессиональный специалист с опытом работы над различными проектами.</p>
    </section>

    <section class="projects">
      <h2>Проекты</h2>
      <div class="project-grid">
        <div class="project-card">
          <div class="project-image">🎨</div>
          <h3>Проект 1</h3>
          <p>Описание проекта</p>
        </div>
        <div class="project-card">
          <div class="project-image">💻</div>
          <h3>Проект 2</h3>
          <p>Описание проекта</p>
        </div>
        <div class="project-card">
          <div class="project-image">📱</div>
          <h3>Проект 3</h3>
          <p>Описание проекта</p>
        </div>
      </div>
    </section>

    <section class="skills">
      <h2>Навыки</h2>
      <div class="skills-list">
        <span class="skill">HTML/CSS</span>
        <span class="skill">JavaScript</span>
        <span class="skill">React</span>
        <span class="skill">Design</span>
      </div>
    </section>

    <footer>
      <p>Свяжитесь со мной: email@example.com</p>
    </footer>
  </div>
</body>
</html>`,
          css: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Arial', sans-serif;
  background: #f5f5f5;
  color: #333;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

.hero {
  text-align: center;
  padding: 4rem 2rem;
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  color: white;
  border-radius: 10px;
  margin-bottom: 3rem;
}

.hero h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
}

section {
  background: white;
  padding: 2rem;
  margin-bottom: 2rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

h2 {
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: #2c3e50;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.project-card {
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;
  transition: transform 0.3s;
}

.project-card:hover {
  transform: translateY(-5px);
}

.project-image {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.skill {
  padding: 0.5rem 1rem;
  background: #3498db;
  color: white;
  border-radius: 20px;
  font-size: 0.9rem;
}

footer {
  text-align: center;
  padding: 2rem;
  background: #2c3e50;
  color: white;
  border-radius: 10px;
  margin-top: 2rem;
}`,
          js: `console.log('Портфолио загружено!');

document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('click', function() {
    alert('Подробнее о проекте: ' + this.querySelector('h3').textContent);
  });
});`
        }
      };

      let selectedTemplate = templates.landing;
      const desc = aiDescription.toLowerCase();
      
      if (desc.includes('портфолио') || desc.includes('резюме') || desc.includes('cv')) {
        selectedTemplate = templates.portfolio;
      }

      setHtmlCode(selectedTemplate.html);
      setCssCode(selectedTemplate.css);
      setJsCode(selectedTemplate.js);
      setProjectName(aiDescription.slice(0, 50));
      setProjectDescription(aiDescription);

      toast({
        title: "Сайт создан!",
        description: "Код сгенерирован на основе вашего описания",
      });

      setAiDescription('');
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать сайт",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePreview = () => {
    const iframe = document.getElementById('preview-frame') as HTMLIFrameElement;
    if (iframe) {
      const previewDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (previewDoc) {
        let fullCode = htmlCode;
        
        fullCode = fullCode.replace('</head>', `<style>${cssCode}</style></head>`);
        fullCode = fullCode.replace('</body>', `<script>${jsCode}<\/script></body>`);
        
        const titleMatch = htmlCode.match(/<title>(.*?)<\/title>/i);
        if (!titleMatch && projectName) {
          fullCode = fullCode.replace('</head>', `<title>${projectName}</title></head>`);
        }
        
        previewDoc.open();
        previewDoc.write(fullCode);
        previewDoc.close();
      }
    }
  };

  const handlePublish = async () => {
    if (!projectName.trim() || !projectDescription.trim()) {
      toast({
        title: "Заполните поля",
        description: "Название и описание обязательны для публикации",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);
    const uniqueId = Math.random().toString(36).substring(2, 9);
    
    try {
      const response = await fetch(PROJECTS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: uniqueId,
          name: projectName,
          description: projectDescription,
          html_code: htmlCode,
          css_code: cssCode,
          js_code: jsCode,
          user_id: currentUser?.id
        })
      });

      if (response.ok) {
        const url = `${VIEW_URL}?id=${uniqueId}`;
        setGeneratedUrl(url);
        
        const newProject: Project = {
          id: uniqueId,
          name: projectName,
          description: projectDescription,
          html_code: htmlCode,
          css_code: cssCode,
          js_code: jsCode,
          user_id: currentUser?.id,
          created_at: new Date().toISOString()
        };
        
        saveProjectToLocalStorage(newProject);
        loadProjects();
        
        toast({
          title: "Сайт опубликован! 🚀",
          description: "Ваш сайт доступен по ссылке",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось опубликовать сайт",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const loadProject = (projectId: string) => {
    const localProjects = JSON.parse(localStorage.getItem('projects') || '[]');
    const project = localProjects.find((p: Project) => p.id === projectId);
    
    if (project) {
      setProjectName(project.name);
      setProjectDescription(project.description);
      setHtmlCode(project.html_code || '');
      setCssCode(project.css_code || '');
      setJsCode(project.js_code || '');
      setGeneratedUrl(`${VIEW_URL}?id=${projectId}`);
      setShowMobileMenu(false);
      
      toast({
        title: "Проект загружен",
        description: project.name,
      });
    } else {
      toast({
        title: "Ошибка",
        description: "Проект не найден",
        variant: "destructive",
      });
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const localProjects = JSON.parse(localStorage.getItem('projects') || '[]');
      const filteredProjects = localProjects.filter((p: Project) => p.id !== projectId);
      localStorage.setItem('projects', JSON.stringify(filteredProjects));
      
      const response = await fetch(PROJECTS_API, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: projectId })
      });

      loadProjects();
      toast({
        title: "Проект удален",
      });
      setDeleteProjectId(null);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить проект",
        variant: "destructive",
      });
    }
  };

  const renameProject = async (projectId: string, newName: string) => {
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      const response = await fetch(PROJECTS_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: projectId,
          name: newName,
          description: project.description,
          html_code: project.html_code,
          css_code: project.css_code,
          js_code: project.js_code
        })
      });

      if (response.ok) {
        await loadProjects();
        toast({
          title: "Проект переименован",
        });
        setEditingProjectId(null);
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось переименовать проект",
        variant: "destructive",
      });
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    Array.from(selectedFiles).forEach((file) => {
      const reader = new FileReader();
      const fileType = file.name.endsWith('.html') ? 'html' 
        : file.name.endsWith('.css') ? 'css'
        : file.name.endsWith('.js') ? 'js'
        : 'image';

      reader.onload = (e) => {
        const content = e.target?.result as string;
        const size = (file.size / 1024).toFixed(2) + ' KB';

        const newFile: FileItem = {
          name: file.name,
          type: fileType,
          content: content,
          size: size
        };

        setFiles(prev => [...prev, newFile]);

        if (fileType === 'html') setHtmlCode(content);
        else if (fileType === 'css') setCssCode(content);
        else if (fileType === 'js') setJsCode(content);

        toast({
          title: "Файл загружен",
          description: `${file.name} (${size})`,
        });
      };

      if (fileType === 'image') {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(f => f.name !== fileName));
    toast({
      title: "Файл удален",
      description: fileName,
    });
  };

  const applyFileToEditor = (file: FileItem) => {
    if (file.type === 'html') setHtmlCode(file.content);
    else if (file.type === 'css') setCssCode(file.content);
    else if (file.type === 'js') setJsCode(file.content);
    
    toast({
      title: "Файл применен",
      description: `${file.name} загружен в редактор`,
    });
  };

  useEffect(() => {
    generatePreview();
  }, [htmlCode, cssCode, jsCode]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg mx-auto mb-4">
              <div className="text-white font-bold text-2xl">P/E</div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent mb-2">
              PlutEdit
            </h1>
            <p className="text-gray-600">Конструктор сайтов</p>
          </div>

          <Tabs value={isAuthMode} onValueChange={(v) => setIsAuthMode(v as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="register">Регистрация</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Email</label>
                <Input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Пароль</label>
                <Input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <Button
                onClick={handleLogin}
                className="w-full bg-gradient-to-r from-red-500 to-blue-500 hover:from-red-600 hover:to-blue-600"
              >
                <Icon name="LogIn" size={18} className="mr-2" />
                Войти
              </Button>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Имя пользователя</label>
                <Input
                  type="text"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  placeholder="Ваше имя"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Email</label>
                <Input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Пароль</label>
                <Input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <Button
                onClick={handleRegister}
                className="w-full bg-gradient-to-r from-red-500 to-blue-500 hover:from-red-600 hover:to-blue-600"
              >
                <Icon name="UserPlus" size={18} className="mr-2" />
                Зарегистрироваться
              </Button>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        accept=".html,.css,.js,.png,.jpg,.jpeg,.gif,.svg"
        multiple
        className="hidden"
      />

      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <div className="text-white font-bold text-lg">P/E</div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">
                  PlutEdit
                </h1>
                <p className="text-xs text-gray-500">Конструктор сайтов</p>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-2">
              <div className="flex items-center gap-2 mr-4 px-3 py-1 bg-white rounded-lg border">
                <Icon name="User" size={16} className="text-gray-600" />
                <span className="text-sm font-medium">{currentUser.username}</span>
              </div>
              <Button 
                onClick={generatePreview}
                variant="outline"
                className="hover:bg-gray-50"
              >
                <Icon name="Eye" size={18} className="mr-2" />
                Предпросмотр
              </Button>
              <Button 
                onClick={handlePublish}
                disabled={isPublishing}
                className="bg-gradient-to-r from-red-500 to-blue-500 hover:from-red-600 hover:to-blue-600 text-white"
              >
                <Icon name="Rocket" size={18} className="mr-2" />
                {isPublishing ? 'Публикация...' : 'Опубликовать'}
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.open('https://t.me/plutstudio', '_blank')}
                className="hover:bg-blue-50"
              >
                <Icon name="Send" size={18} className="mr-2" />
                Telegram
              </Button>
              <Button 
                variant="outline"
                onClick={handleLogout}
                className="hover:bg-red-50"
              >
                <Icon name="LogOut" size={18} className="mr-2" />
                Выход
              </Button>
            </div>

            <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <Icon name="Menu" size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Меню</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-3">
                  <Button onClick={generatePreview} variant="outline" className="w-full">
                    <Icon name="Eye" size={18} className="mr-2" /> Предпросмотр
                  </Button>
                  <Button onClick={handlePublish} disabled={isPublishing} className="w-full">
                    <Icon name="Rocket" size={18} className="mr-2" /> Опубликовать
                  </Button>
                  
                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-semibold mb-2">Мои проекты</h3>
                    {projects.map((project) => (
                      <div key={project.id} className="flex items-center gap-2 mb-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => loadProject(project.id)}
                          className="flex-1 justify-start"
                        >
                          {project.name}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold">🤖 Создать сайт по описанию</h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Опишите, какой сайт вы хотите создать</label>
                <Textarea 
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  placeholder="Например: Лендинг для кафе с меню и контактами, или Портфолио фотографа..."
                  className="min-h-[100px]"
                />
              </div>
              <Button 
                onClick={generateSiteFromDescription}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Icon name="Sparkles" size={18} className="mr-2" />
                {isGenerating ? 'Генерация...' : 'Создать сайт'}
              </Button>
            </div>
          </Card>

          <Card>
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold">Настройки проекта</h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Название проекта</label>
                <Input 
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Введите название..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Описание</label>
                <Input 
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Введите описание..."
                />
              </div>
            </div>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="html">HTML</TabsTrigger>
              <TabsTrigger value="css">CSS</TabsTrigger>
              <TabsTrigger value="js">JavaScript</TabsTrigger>
              <TabsTrigger value="files">Файлы</TabsTrigger>
            </TabsList>

            <TabsContent value="html">
              <Card className="p-4">
                <Textarea 
                  value={htmlCode}
                  onChange={(e) => setHtmlCode(e.target.value)}
                  className="font-mono min-h-[400px]"
                  spellCheck={false}
                />
              </Card>
            </TabsContent>

            <TabsContent value="css">
              <Card className="p-4">
                <Textarea 
                  value={cssCode}
                  onChange={(e) => setCssCode(e.target.value)}
                  className="font-mono min-h-[400px]"
                  spellCheck={false}
                />
              </Card>
            </TabsContent>

            <TabsContent value="js">
              <Card className="p-4">
                <Textarea 
                  value={jsCode}
                  onChange={(e) => setJsCode(e.target.value)}
                  className="font-mono min-h-[400px]"
                  spellCheck={false}
                />
              </Card>
            </TabsContent>

            <TabsContent value="files">
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">Файловый менеджер</h3>
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Icon name="Upload" size={18} className="mr-2" />
                      Импорт файлов
                    </Button>
                  </div>

                  {files.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                      <Icon name="FolderOpen" size={48} className="mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600">Файлы не импортированы</p>
                      <p className="text-sm text-gray-500 mt-2">Нажмите "Импорт файлов" для добавления HTML, CSS, JS или изображений</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {files.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <Icon 
                              name={file.type === 'html' ? 'FileCode' : file.type === 'css' ? 'Palette' : file.type === 'js' ? 'Code' : 'Image'} 
                              size={20} 
                              className="text-gray-600"
                            />
                            <div>
                              <p className="font-mono text-sm">{file.name}</p>
                              <p className="text-gray-500 text-xs">{file.size}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {file.type !== 'image' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => applyFileToEditor(file)}
                              >
                                <Icon name="Code" size={14} className="mr-1" />
                                Применить
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => removeFile(file.name)}
                            >
                              <Icon name="Trash2" size={14} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

          </Tabs>

          <Card className="p-4">
            <iframe
              id="preview-frame"
              className="w-full h-[600px] bg-white rounded-lg border"
              title="Preview"
            />
          </Card>

          {generatedUrl && (
            <Card className="p-6">
              <div className="space-y-3">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 mb-2 font-semibold">✓ Сайт опубликован</p>
                  <a 
                    href={generatedUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline break-all text-sm"
                  >
                    {generatedUrl}
                  </a>
                </div>
                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(generatedUrl);
                    toast({ title: "Ссылка скопирована" });
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <Icon name="Copy" size={18} className="mr-2" />
                  Скопировать ссылку
                </Button>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="hidden lg:block">
            <div className="p-4 border-b">
              <h3 className="font-bold">Мои проекты</h3>
            </div>
            <div className="p-4 max-h-[600px] overflow-y-auto space-y-2">
              {projects.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">Проектов пока нет</p>
              ) : (
                projects.map((project) => (
                  <div key={project.id} className="group relative">
                    {editingProjectId === project.id ? (
                      <div className="flex gap-2">
                        <Input 
                          value={editingProjectName}
                          onChange={(e) => setEditingProjectName(e.target.value)}
                          className="text-sm"
                        />
                        <Button 
                          size="sm"
                          onClick={() => renameProject(project.id, editingProjectName)}
                        >
                          <Icon name="Check" size={14} />
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingProjectId(null)}
                        >
                          <Icon name="X" size={14} />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                        <button
                          onClick={() => loadProject(project.id)}
                          className="flex-1 text-left text-sm"
                        >
                          {project.name}
                        </button>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingProjectId(project.id);
                              setEditingProjectName(project.name);
                            }}
                            className="h-7 w-7 p-0"
                          >
                            <Icon name="Pencil" size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteProjectId(project.id)}
                            className="h-7 w-7 p-0"
                          >
                            <Icon name="Trash2" size={14} />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      <AlertDialog open={deleteProjectId !== null} onOpenChange={(open) => !open && setDeleteProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить проект?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Проект будет удален навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteProjectId && deleteProject(deleteProjectId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;