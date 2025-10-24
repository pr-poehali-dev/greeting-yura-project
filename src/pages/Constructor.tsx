import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Block {
  id: string;
  type: 'text' | 'link' | 'image' | 'button';
  content: string;
  href?: string;
  imageUrl?: string;
}

interface SortableBlockProps {
  block: Block;
  onEdit: (id: string, content: string, href?: string, imageUrl?: string) => void;
  onDelete: (id: string) => void;
}

const SortableBlock = ({ block, onEdit, onDelete }: SortableBlockProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(block.content);
  const [editHref, setEditHref] = useState(block.href || '');
  const [editImageUrl, setEditImageUrl] = useState(block.imageUrl || '');

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    onEdit(block.id, editContent, editHref, editImageUrl);
    setIsEditing(false);
  };

  const renderBlock = () => {
    switch (block.type) {
      case 'text':
        return <p className="text-gray-800">{block.content}</p>;
      case 'link':
        return (
          <a href={block.href} className="text-blue-600 underline hover:text-blue-800">
            {block.content}
          </a>
        );
      case 'image':
        return (
          <div className="flex flex-col gap-2">
            {block.imageUrl && <img src={block.imageUrl} alt={block.content} className="max-w-full h-auto rounded" />}
            <span className="text-sm text-gray-600">{block.content}</span>
          </div>
        );
      case 'button':
        return (
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            {block.content}
          </button>
        );
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-3">
      <Card className="p-4 bg-white hover:shadow-md transition-shadow">
        <div className="flex items-start gap-3">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing mt-1 text-gray-400 hover:text-gray-600"
          >
            <Icon name="GripVertical" size={20} />
          </button>

          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Текст"
                />
                {block.type === 'link' && (
                  <Input
                    value={editHref}
                    onChange={(e) => setEditHref(e.target.value)}
                    placeholder="https://example.com"
                  />
                )}
                {block.type === 'image' && (
                  <Input
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    placeholder="URL изображения"
                  />
                )}
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave}>
                    Сохранить
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase">
                    {block.type === 'text' && 'Текст'}
                    {block.type === 'link' && 'Ссылка'}
                    {block.type === 'image' && 'Изображение'}
                    {block.type === 'button' && 'Кнопка'}
                  </span>
                </div>
                {renderBlock()}
              </div>
            )}
          </div>

          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Icon name="Pencil" size={16} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(block.id)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Icon name="Trash2" size={16} />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

const Constructor = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [pageTitle, setPageTitle] = useState('Мой сайт');
  const [favicon, setFavicon] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const titleRegex = /<title>(.*?)<\/title>/i;
    const match = generateHTML().match(titleRegex);
    if (match && match[1]) {
      // Title preview handled automatically
    }
  }, [pageTitle]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addBlock = (type: Block['type']) => {
    const newBlock: Block = {
      id: `block-${Date.now()}-${Math.random()}`,
      type,
      content: type === 'text' ? 'Новый текст' : type === 'link' ? 'Новая ссылка' : type === 'image' ? 'Описание изображения' : 'Кнопка',
      href: type === 'link' ? 'https://example.com' : undefined,
      imageUrl: type === 'image' ? 'https://via.placeholder.com/400x200' : undefined,
    };
    setBlocks([...blocks, newBlock]);
    toast({
      title: "Блок добавлен",
      description: `Добавлен блок: ${type}`,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const editBlock = (id: string, content: string, href?: string, imageUrl?: string) => {
    setBlocks(blocks.map((block) => 
      block.id === id ? { ...block, content, href, imageUrl } : block
    ));
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter((block) => block.id !== id));
    toast({
      title: "Блок удален",
    });
  };

  const generateHTML = () => {
    const bodyContent = blocks
      .map((block) => {
        switch (block.type) {
          case 'text':
            return `  <p>${block.content}</p>`;
          case 'link':
            return `  <a href="${block.href}">${block.content}</a>`;
          case 'image':
            return `  <img src="${block.imageUrl}" alt="${block.content}">`;
          case 'button':
            return `  <button>${block.content}</button>`;
          default:
            return '';
        }
      })
      .join('\n');

    return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  ${favicon ? `<link rel="icon" href="${favicon}">` : ''}
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-height: 100vh;
    }
    p { margin: 10px 0; }
    a { color: #60a5fa; text-decoration: underline; }
    img { max-width: 100%; height: auto; margin: 10px 0; border-radius: 8px; }
    button { 
      padding: 10px 20px; 
      background: #3b82f6; 
      color: white; 
      border: none; 
      border-radius: 6px; 
      cursor: pointer;
      margin: 10px 0;
    }
    button:hover { background: #2563eb; }
  </style>
</head>
<body>
${bodyContent}
</body>
</html>`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Конструктор сайта
          </h1>
          <div className="space-y-3">
            <div className="flex gap-4">
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/'}
              >
                <Icon name="ArrowLeft" size={16} className="mr-2" />
                Назад к редактору
              </Button>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Заголовок сайта"
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  className="max-w-md"
                />
                {pageTitle && (
                  <p className="text-xs text-gray-500 mt-1">
                    <Icon name="Eye" size={12} className="inline mr-1" />
                    Предпросмотр заголовка: <span className="font-medium">{pageTitle}</span>
                  </p>
                )}
              </div>
              <Input
                placeholder="URL иконки (favicon)"
                value={favicon}
                onChange={(e) => setFavicon(e.target.value)}
                className="max-w-md"
              />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <Card className="p-4 mb-4">
              <h2 className="font-semibold mb-3">Добавить блок</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Button onClick={() => addBlock('text')} variant="outline" className="flex flex-col h-auto py-3">
                  <Icon name="Type" size={24} className="mb-1" />
                  <span className="text-xs">Текст</span>
                </Button>
                <Button onClick={() => addBlock('link')} variant="outline" className="flex flex-col h-auto py-3">
                  <Icon name="Link" size={24} className="mb-1" />
                  <span className="text-xs">Ссылка</span>
                </Button>
                <Button onClick={() => addBlock('image')} variant="outline" className="flex flex-col h-auto py-3">
                  <Icon name="Image" size={24} className="mb-1" />
                  <span className="text-xs">Изображение</span>
                </Button>
                <Button onClick={() => addBlock('button')} variant="outline" className="flex flex-col h-auto py-3">
                  <Icon name="RectangleHorizontal" size={24} className="mb-1" />
                  <span className="text-xs">Кнопка</span>
                </Button>
              </div>
            </Card>

            <div className="space-y-3">
              <h2 className="font-semibold text-lg">Блоки (перетащите для изменения порядка)</h2>
              {blocks.length === 0 ? (
                <Card className="p-8 text-center text-gray-500">
                  <Icon name="LayoutGrid" size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>Добавьте блоки для создания сайта</p>
                </Card>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                    {blocks.map((block) => (
                      <SortableBlock
                        key={block.id}
                        block={block}
                        onEdit={editBlock}
                        onDelete={deleteBlock}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>

          <div className="lg:sticky lg:top-4 h-fit">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">Предпросмотр</h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const html = generateHTML();
                    const blob = new Blob([html], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'index.html';
                    a.click();
                    toast({ title: "HTML скачан!" });
                  }}
                >
                  <Icon name="Download" size={16} className="mr-1" />
                  Скачать HTML
                </Button>
              </div>
              <div className="border rounded-lg overflow-hidden bg-white" style={{ height: '600px' }}>
                <iframe
                  srcDoc={generateHTML()}
                  className="w-full h-full"
                  title="Предпросмотр"
                  sandbox="allow-scripts"
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Constructor;