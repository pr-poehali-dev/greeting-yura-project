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

interface Project {
  id: string;
  name: string;
  description: string;
  html_code?: string;
  css_code?: string;
  js_code?: string;
  created_at?: string;
}

interface FileItem {
  name: string;
  type: 'html' | 'css' | 'js' | 'image';
  content: string;
  size: string;
}

const Index = () => {
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
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const deleteProject = async (projectId: string) => {
    try {
      const response = await fetch(PROJECTS_API, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: projectId })
      });

      if (response.ok) {
        await loadProjects();
        toast({
          title: "Проект удален",
        });
        setDeleteProjectId(null);
      }
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