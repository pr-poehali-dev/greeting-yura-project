import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [htmlCode, setHtmlCode] = useState('<!DOCTYPE html>\n<html>\n<head>\n  <title>Мой сайт</title>\n</head>\n<body>\n  <h1>Привет, мир!</h1>\n</body>\n</html>');
  const [cssCode, setCssCode] = useState('body {\n  font-family: Arial, sans-serif;\n  margin: 0;\n  padding: 20px;\n  background: #f0f0f0;\n}\n\nh1 {\n  color: #333;\n}');
  const [jsCode, setJsCode] = useState('console.log("Сайт загружен!");');
  const [activeTab, setActiveTab] = useState('html');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const { toast } = useToast();

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

  const handlePublish = () => {
    if (!projectName.trim() || !projectDescription.trim()) {
      toast({
        title: "Заполните поля",
        description: "Название и описание обязательны для публикации",
        variant: "destructive",
      });
      return;
    }

    const uniqueId = Math.random().toString(36).substring(2, 9);
    const url = `https://${projectName.toLowerCase().replace(/\s+/g, '-')}-${uniqueId}.plutstudio.site`;
    setGeneratedUrl(url);
    
    toast({
      title: "Сайт опубликован! 🚀",
      description: `Ваш сайт доступен по ссылке`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-blue-600 bg-clip-text text-transparent">
              WEBSITE BUILDER
            </h1>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={generatePreview}
                className="hover:bg-gray-50"
              >
                <Icon name="Eye" size={18} className="mr-2" />
                Превью
              </Button>
              <Button 
                onClick={handlePublish}
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
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card className="p-6 shadow-lg border-2 hover:shadow-xl transition-shadow">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Icon name="FileText" size={24} />
                Информация о проекте
              </h2>
              <div className="space-y-4">
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

            <Card className="p-6 shadow-lg border-2 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Icon name="Code" size={24} />
                  Редактор кода
                </h2>
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="html" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white">
                    HTML
                  </TabsTrigger>
                  <TabsTrigger value="css" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                    CSS
                  </TabsTrigger>
                  <TabsTrigger value="js" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white">
                    JavaScript
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="html">
                  <Textarea
                    value={htmlCode}
                    onChange={(e) => setHtmlCode(e.target.value)}
                    className="font-mono text-sm h-80 resize-none border-2 focus:border-red-500 bg-gray-50"
                    placeholder="Введите HTML код..."
                  />
                </TabsContent>

                <TabsContent value="css">
                  <Textarea
                    value={cssCode}
                    onChange={(e) => setCssCode(e.target.value)}
                    className="font-mono text-sm h-80 resize-none border-2 focus:border-purple-500 bg-gray-50"
                    placeholder="Введите CSS код..."
                  />
                </TabsContent>

                <TabsContent value="js">
                  <Textarea
                    value={jsCode}
                    onChange={(e) => setJsCode(e.target.value)}
                    className="font-mono text-sm h-80 resize-none border-2 focus:border-blue-500 bg-gray-50"
                    placeholder="Введите JavaScript код..."
                  />
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 shadow-lg border-2 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Icon name="Monitor" size={24} />
                  Превью
                </h2>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={generatePreview}
                >
                  <Icon name="RefreshCw" size={16} className="mr-2" />
                  Обновить
                </Button>
              </div>
              <div className="bg-gray-100 rounded-lg overflow-hidden border-2">
                <iframe
                  id="preview-frame"
                  className="w-full h-96 bg-white"
                  title="Preview"
                />
              </div>
            </Card>

            {generatedUrl && (
              <Card className="p-6 shadow-lg border-2 bg-gradient-to-r from-red-50 to-blue-50 animate-fade-in">
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Icon name="Link" size={24} className="text-blue-600" />
                  Ваш сайт опубликован! 🎉
                </h2>
                <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
                  <p className="text-sm text-gray-600 mb-2">Ссылка на ваш сайт:</p>
                  <a 
                    href={generatedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 font-medium break-all underline"
                  >
                    {generatedUrl}
                  </a>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-16 py-8 border-t bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-block">
            <div className="text-5xl font-bold bg-gradient-to-r from-red-500 via-purple-500 to-blue-600 bg-clip-text text-transparent"
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
