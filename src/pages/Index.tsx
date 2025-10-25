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
  const [htmlCode, setHtmlCode] = useState('<!DOCTYPE html>\n<html lang="ru">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>GameSite</title>\n</head>\n<body>\n  <h1>GAME OVER</h1>\n  <p>Press START to continue...</p>\n</body>\n</html>');
  const [cssCode, setCssCode] = useState('body {\n  font-family: "Press Start 2P", cursive;\n  margin: 0;\n  padding: 40px;\n  background: #000;\n  color: #0f0;\n  text-align: center;\n  min-height: 100vh;\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n}\n\nh1 {\n  font-size: 3em;\n  animation: blink 1s infinite;\n}\n\n@keyframes blink {\n  0%, 50% { opacity: 1; }\n  51%, 100% { opacity: 0; }\n}\n\np {\n  font-size: 1.2em;\n  margin-top: 20px;\n}');
  const [jsCode, setJsCode] = useState('console.log("GAME STARTED!");');
  const [activeTab, setActiveTab] = useState('code');
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
        title: "⚠️ MISSING DATA",
        description: "Enter name and description to deploy",
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
          title: "🚀 DEPLOYED!",
          description: "Site live on the net",
        });
      }
    } catch (error) {
      toast({
        title: "❌ ERROR",
        description: "Deploy failed",
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
        title: "✓ LOADED",
        description: project.name,
      });
    } catch (error) {
      toast({
        title: "❌ ERROR",
        description: "Failed to load project",
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
          title: "🗑️ DELETED",
        });
        setDeleteProjectId(null);
      }
    } catch (error) {
      toast({
        title: "❌ ERROR",
        description: "Delete failed",
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
          title: "✓ RENAMED",
        });
        setEditingProjectId(null);
      }
    } catch (error) {
      toast({
        title: "❌ ERROR",
        description: "Rename failed",
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
          title: "📁 FILE IMPORTED",
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
      title: "🗑️ FILE REMOVED",
      description: fileName,
    });
  };

  const applyFileToEditor = (file: FileItem) => {
    if (file.type === 'html') setHtmlCode(file.content);
    else if (file.type === 'css') setCssCode(file.content);
    else if (file.type === 'js') setJsCode(file.content);
    
    toast({
      title: "✓ APPLIED",
      description: `${file.name} loaded to editor`,
    });
  };

  useEffect(() => {
    generatePreview();
  }, [htmlCode, cssCode, jsCode]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black text-cyan-300">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        accept=".html,.css,.js,.png,.jpg,.jpeg,.gif,.svg"
        multiple
        className="hidden"
      />

      <header className="border-b-2 border-purple-500 bg-black/50 backdrop-blur-md sticky top-0 z-50 neon-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center animate-glitch">
                <Icon name="Code2" size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  PLUTSTUDIO
                </h1>
                <p className="text-xs text-cyan-400">[ GAME DEV MODE ]</p>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-2">
              <Button 
                onClick={generatePreview}
                variant="outline"
                className="bg-purple-900/50 border-purple-500 text-purple-300 hover:bg-purple-800 hover:text-white"
              >
                <Icon name="Eye" size={18} className="mr-2" />
                PREVIEW
              </Button>
              <Button 
                onClick={handlePublish}
                disabled={isPublishing}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/50"
              >
                <Icon name="Rocket" size={18} className="mr-2" />
                {isPublishing ? 'DEPLOYING...' : 'DEPLOY'}
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.open('https://t.me/plutstudio', '_blank')}
                className="bg-cyan-900/50 border-cyan-500 text-cyan-300 hover:bg-cyan-800"
              >
                <Icon name="Send" size={18} className="mr-2" />
                TG
              </Button>
            </div>

            <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden border-purple-500 text-purple-300">
                  <Icon name="Menu" size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-black border-purple-500">
                <SheetHeader>
                  <SheetTitle className="text-purple-400">MENU</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-3">
                  <Button onClick={generatePreview} variant="outline" className="w-full border-purple-500 text-purple-300">
                    <Icon name="Eye" size={18} className="mr-2" /> PREVIEW
                  </Button>
                  <Button onClick={handlePublish} disabled={isPublishing} className="w-full bg-purple-600 hover:bg-purple-700">
                    <Icon name="Rocket" size={18} className="mr-2" /> DEPLOY
                  </Button>
                  
                  <div className="pt-4 border-t border-purple-700">
                    <h3 className="text-sm font-semibold text-purple-400 mb-2">PROJECTS</h3>
                    {projects.map((project) => (
                      <div key={project.id} className="flex items-center gap-2 mb-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => loadProject(project.id)}
                          className="flex-1 justify-start text-cyan-300 hover:bg-purple-900"
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
          <Card className="bg-black/80 border-2 border-purple-500 neon-border">
            <div className="p-4 border-b border-purple-700">
              <h2 className="text-xl font-bold text-purple-400">[ PROJECT CONFIG ]</h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-cyan-400 mb-2">NAME:</label>
                <Input 
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name..."
                  className="bg-purple-900/30 border-purple-500 text-cyan-300 placeholder:text-purple-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-cyan-400 mb-2">DESCRIPTION:</label>
                <Input 
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Enter description..."
                  className="bg-purple-900/30 border-purple-500 text-cyan-300 placeholder:text-purple-400"
                />
              </div>
            </div>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-black/80 border-2 border-purple-500">
              <TabsTrigger value="code" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">CODE</TabsTrigger>
              <TabsTrigger value="files" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">FILES</TabsTrigger>
              <TabsTrigger value="preview" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">PREVIEW</TabsTrigger>
              <TabsTrigger value="publish" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">DEPLOY</TabsTrigger>
            </TabsList>

            <TabsContent value="code" className="space-y-4">
              <Card className="bg-black/80 border-2 border-purple-500">
                <Tabs defaultValue="html">
                  <TabsList className="w-full bg-purple-900/50 border-b border-purple-700">
                    <TabsTrigger value="html" className="data-[state=active]:bg-purple-600">HTML</TabsTrigger>
                    <TabsTrigger value="css" className="data-[state=active]:bg-purple-600">CSS</TabsTrigger>
                    <TabsTrigger value="js" className="data-[state=active]:bg-purple-600">JS</TabsTrigger>
                  </TabsList>
                  <TabsContent value="html" className="p-4">
                    <Textarea 
                      value={htmlCode}
                      onChange={(e) => setHtmlCode(e.target.value)}
                      className="font-mono min-h-[400px] bg-black/90 border-purple-500 text-green-400"
                      spellCheck={false}
                    />
                  </TabsContent>
                  <TabsContent value="css" className="p-4">
                    <Textarea 
                      value={cssCode}
                      onChange={(e) => setCssCode(e.target.value)}
                      className="font-mono min-h-[400px] bg-black/90 border-purple-500 text-blue-400"
                      spellCheck={false}
                    />
                  </TabsContent>
                  <TabsContent value="js" className="p-4">
                    <Textarea 
                      value={jsCode}
                      onChange={(e) => setJsCode(e.target.value)}
                      className="font-mono min-h-[400px] bg-black/90 border-purple-500 text-yellow-400"
                      spellCheck={false}
                    />
                  </TabsContent>
                </Tabs>
              </Card>
            </TabsContent>

            <TabsContent value="files">
              <Card className="bg-black/80 border-2 border-purple-500 p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-purple-400">[ FILE MANAGER ]</h3>
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Icon name="Upload" size={18} className="mr-2" />
                      IMPORT FILES
                    </Button>
                  </div>

                  {files.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-purple-700 rounded-lg">
                      <Icon name="FolderOpen" size={48} className="mx-auto mb-4 text-purple-500" />
                      <p className="text-purple-400">No files imported yet</p>
                      <p className="text-sm text-purple-600 mt-2">Click IMPORT FILES to add HTML, CSS, JS or images</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {files.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-purple-900/30 border border-purple-700 rounded-lg hover:bg-purple-900/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <Icon 
                              name={file.type === 'html' ? 'FileCode' : file.type === 'css' ? 'Palette' : file.type === 'js' ? 'Code' : 'Image'} 
                              size={20} 
                              className={file.type === 'html' ? 'text-orange-400' : file.type === 'css' ? 'text-blue-400' : file.type === 'js' ? 'text-yellow-400' : 'text-pink-400'}
                            />
                            <div>
                              <p className="text-cyan-300 font-mono text-sm">{file.name}</p>
                              <p className="text-purple-500 text-xs">{file.size}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {file.type !== 'image' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => applyFileToEditor(file)}
                                className="border-cyan-500 text-cyan-400 hover:bg-cyan-900"
                              >
                                <Icon name="Code" size={14} className="mr-1" />
                                APPLY
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => removeFile(file.name)}
                              className="border-red-500 text-red-400 hover:bg-red-900"
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

            <TabsContent value="preview">
              <Card className="bg-black/80 border-2 border-purple-500 p-4">
                <iframe
                  id="preview-frame"
                  className="w-full h-[600px] bg-white rounded-lg border-2 border-purple-700"
                  title="Preview"
                />
              </Card>
            </TabsContent>

            <TabsContent value="publish">
              <Card className="bg-black/80 border-2 border-purple-500 p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-purple-400">[ DEPLOYMENT ]</h3>
                  {generatedUrl ? (
                    <div className="space-y-3">
                      <div className="p-4 bg-green-900/30 border-2 border-green-500 rounded-lg">
                        <p className="text-sm text-green-400 mb-2">✓ DEPLOYED SUCCESSFULLY</p>
                        <a 
                          href={generatedUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 underline break-all"
                        >
                          {generatedUrl}
                        </a>
                      </div>
                      <Button 
                        onClick={() => {
                          navigator.clipboard.writeText(generatedUrl);
                          toast({ title: "📋 COPIED" });
                        }}
                        variant="outline"
                        className="w-full border-cyan-500 text-cyan-400 hover:bg-cyan-900"
                      >
                        <Icon name="Copy" size={18} className="mr-2" />
                        COPY URL
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed border-purple-700 rounded-lg">
                      <Icon name="Rocket" size={48} className="mx-auto mb-4 text-purple-500" />
                      <p className="text-purple-400">Click DEPLOY to publish your site</p>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <Card className="bg-black/80 border-2 border-purple-500 hidden lg:block">
            <div className="p-4 border-b border-purple-700">
              <h3 className="font-bold text-purple-400">[ MY PROJECTS ]</h3>
            </div>
            <div className="p-4 max-h-[600px] overflow-y-auto space-y-2">
              {projects.length === 0 ? (
                <p className="text-purple-600 text-sm text-center py-4">No projects yet</p>
              ) : (
                projects.map((project) => (
                  <div key={project.id} className="group relative">
                    {editingProjectId === project.id ? (
                      <div className="flex gap-2">
                        <Input 
                          value={editingProjectName}
                          onChange={(e) => setEditingProjectName(e.target.value)}
                          className="bg-purple-900/30 border-purple-500 text-cyan-300 text-sm"
                        />
                        <Button 
                          size="sm"
                          onClick={() => renameProject(project.id, editingProjectName)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Icon name="Check" size={14} />
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingProjectId(null)}
                          className="border-red-500 text-red-400"
                        >
                          <Icon name="X" size={14} />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-purple-900/30 border border-purple-700 rounded-lg hover:bg-purple-900/50 transition-colors">
                        <button
                          onClick={() => loadProject(project.id)}
                          className="flex-1 text-left text-cyan-300 hover:text-cyan-200 text-sm font-mono"
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
                            className="h-7 w-7 p-0 text-cyan-400 hover:bg-cyan-900"
                          >
                            <Icon name="Pencil" size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteProjectId(project.id)}
                            className="h-7 w-7 p-0 text-red-400 hover:bg-red-900"
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
        <AlertDialogContent className="bg-black border-2 border-red-500">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">[ DELETE PROJECT? ]</AlertDialogTitle>
            <AlertDialogDescription className="text-purple-400">
              This action cannot be undone. Project will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-purple-500 text-purple-400">CANCEL</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteProjectId && deleteProject(deleteProjectId)}
              className="bg-red-600 hover:bg-red-700"
            >
              DELETE
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
