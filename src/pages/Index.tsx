import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import FallingLeaves from '@/components/FallingLeaves';

const PROJECTS_API = 'https://functions.poehali.dev/fbacc2fb-c355-412d-9250-11bc9088ce40';
const VIEW_URL = 'https://functions.poehali.dev/da111202-0c0a-40bc-a2af-421384b780eb';

interface Project {
  id: string;
  name: string;
  description: string;
  html_code?: string;
  css_code?: string;
  js_code?: string;
  created_at?: string;
}

const Index = () => {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [htmlCode, setHtmlCode] = useState('<!DOCTYPE html>\n<html lang="ru">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Мой сайт</title>\n</head>\n<body>\n  <h1>Добро пожаловать!</h1>\n  <p>Это мой первый сайт на PlutStudio</p>\n</body>\n</html>');
  const [cssCode, setCssCode] = useState('body {\n  font-family: Arial, sans-serif;\n  margin: 0;\n  padding: 40px;\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  color: white;\n  text-align: center;\n  min-height: 100vh;\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n}\n\nh1 {\n  font-size: 3em;\n  margin: 0;\n}\n\np {\n  font-size: 1.2em;\n  opacity: 0.9;\n}');
  const [jsCode, setJsCode] = useState('console.log("Сайт загружен!");');
  const [activeTab, setActiveTab] = useState('html');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await fetch(PROJECTS_API);
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const generatePreview = () => {
    const iframe = document.getElementById('preview-frame') as HTMLIFrameElement;
    if (iframe) {
      const previewDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (previewDoc) {
        const fullCode = htmlCode.replace('</head>', `<style>${cssCode}</style></head>`).replace('</body>', `<script>${jsCode}<\/script></body>`);
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
          js_code: jsCode
        })
      });

      if (response.ok) {
        const url = `${VIEW_URL}?id=${uniqueId}`;
        setGeneratedUrl(url);
        await loadProjects();
        
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

  const loadProject = async (projectId: string) => {
    try {
      const response = await fetch(`${PROJECTS_API}?id=${projectId}`);
      const project = await response.json();
      setProjectName(project.name);
      setProjectDescription(project.description);
      setHtmlCode(project.html_code);
      setCssCode(project.css_code);
      setJsCode(project.js_code);
      setGeneratedUrl(`${VIEW_URL}?id=${projectId}`);
      setShowMobileMenu(false);
      
      toast({
        title: "Проект загружен",
        description: project.name,
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить проект",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50">
      <FallingLeaves />
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-red-500 to-blue-600 bg-clip-text text-transparent">
              WEBSITE BUILDER
            </h1>
            
            <div className="hidden lg:flex gap-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="hover:bg-gray-50">
                    <Icon name="FolderOpen" size={18} className="mr-2" />
                    Мои проекты
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Мои проекты</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-3">
                    {projects.length === 0 ? (
                      <p className="text-gray-500 text-sm">Нет сохранённых проектов</p>
                    ) : (
                      projects.map((project) => (
                        <Card
                          key={project.id}
                          className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => loadProject(project.id)}
                        >
                          <h3 className="font-semibold">{project.name}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                        </Card>
                      ))
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              <Button variant="outline" onClick={generatePreview} className="hover:bg-gray-50">
                <Icon name="Eye" size={18} className="mr-2" />
                Превью
              </Button>
              <Button 
                onClick={handlePublish}
                disabled={isPublishing}
                className="bg-gradient-to-r from-red-500 to-blue-600 hover:from-red-600 hover:to-blue-700 text-white shadow-lg"
              >
                <Icon name="Rocket" size={18} className="mr-2" />
                Публикация
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.open('https://t.me/plutstudio', '_blank')}
                className="hover:bg-blue-50"
              >
                <Icon name="Send" size={18} className="mr-2" />
                Telegram
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
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      setShowMobileMenu(false);
                      setTimeout(generatePreview, 100);
                    }}
                  >
                    <Icon name="Eye" size={18} className="mr-2" />
                    Превью
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowMobileMenu(false);
                      setTimeout(handlePublish, 100);
                    }}
                    disabled={isPublishing}
                    className="w-full bg-gradient-to-r from-red-500 to-blue-600 text-white"
                  >
                    <Icon name="Rocket" size={18} className="mr-2" />
                    Публикация
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open('https://t.me/plutstudio', '_blank')}
                  >
                    <Icon name="Send" size={18} className="mr-2" />
                    Telegram
                  </Button>
                  
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-3">Мои проекты</h3>
                    {projects.length === 0 ? (
                      <p className="text-gray-500 text-sm">Нет сохранённых проектов</p>
                    ) : (
                      <div className="space-y-2">
                        {projects.map((project) => (
                          <Card
                            key={project.id}
                            className="p-3 cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => loadProject(project.id)}
                          >
                            <h4 className="font-semibold text-sm">{project.name}</h4>
                            <p className="text-xs text-gray-600 line-clamp-2">{project.description}</p>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-4 sm:space-y-6">
            <Card className="p-4 sm:p-6 shadow-lg border-2">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                <Icon name="FileText" size={20} />
                Информация о проекте
              </h2>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Название сайта *</label>
                  <Input
                    placeholder="Мой крутой сайт"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="border-2 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Описание сайта *</label>
                  <Textarea
                    placeholder="Расскажите о вашем сайте..."
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    rows={3}
                    className="border-2 focus:border-blue-500 resize-none"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 shadow-lg border-2">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                  <Icon name="Code" size={20} />
                  Редактор кода
                </h2>
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="html" className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white">
                    HTML
                  </TabsTrigger>
                  <TabsTrigger value="css" className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                    CSS
                  </TabsTrigger>
                  <TabsTrigger value="js" className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white">
                    JS
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="html">
                  <Textarea
                    value={htmlCode}
                    onChange={(e) => setHtmlCode(e.target.value)}
                    className="font-mono text-xs sm:text-sm h-60 sm:h-80 resize-none border-2 focus:border-red-500 bg-gray-50"
                    placeholder="Введите HTML код..."
                  />
                </TabsContent>

                <TabsContent value="css">
                  <Textarea
                    value={cssCode}
                    onChange={(e) => setCssCode(e.target.value)}
                    className="font-mono text-xs sm:text-sm h-60 sm:h-80 resize-none border-2 focus:border-purple-500 bg-gray-50"
                    placeholder="Введите CSS код..."
                  />
                </TabsContent>

                <TabsContent value="js">
                  <Textarea
                    value={jsCode}
                    onChange={(e) => setJsCode(e.target.value)}
                    className="font-mono text-xs sm:text-sm h-60 sm:h-80 resize-none border-2 focus:border-blue-500 bg-gray-50"
                    placeholder="Введите JavaScript код..."
                  />
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <Card className="p-4 sm:p-6 shadow-lg border-2">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                  <Icon name="Monitor" size={20} />
                  Превью
                </h2>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={generatePreview}
                >
                  <Icon name="RefreshCw" size={16} />
                </Button>
              </div>
              <div className="bg-gray-100 rounded-lg overflow-hidden border-2">
                <iframe
                  id="preview-frame"
                  className="w-full h-60 sm:h-96 bg-white"
                  title="Preview"
                />
              </div>
            </Card>

            {generatedUrl && (
              <Card className="p-4 sm:p-6 shadow-lg border-2 bg-gradient-to-r from-red-50 to-blue-50 animate-fade-in">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 flex items-center gap-2">
                  <Icon name="Link" size={20} className="text-blue-600" />
                  Сайт опубликован! 🎉
                </h2>
                <div className="bg-white rounded-lg p-3 sm:p-4 border-2 border-blue-200">
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">Ссылка на ваш сайт:</p>
                  <a 
                    href={generatedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 font-medium break-all underline text-xs sm:text-sm"
                  >
                    {generatedUrl}
                  </a>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-3"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedUrl);
                      toast({ title: "Ссылка скопирована!" });
                    }}
                  >
                    <Icon name="Copy" size={16} className="mr-2" />
                    Скопировать ссылку
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-8 sm:mt-16 py-6 sm:py-8 border-t bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-3 sm:px-4 text-center">
          <div className="inline-block">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-red-500 via-purple-500 to-blue-600 bg-clip-text text-transparent"
                 style={{ 
                   fontFamily: 'Montserrat, sans-serif',
                   textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                   transform: 'rotate(-2deg)',
                   filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'
                 }}>
              PlutStudio
            </div>
            <div className="h-1 bg-gradient-to-r from-red-500 to-blue-600 rounded-full mt-2"></div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;