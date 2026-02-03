import { useRef, useEffect, useState } from 'react';
import { 
    Bold, 
    Italic, 
    Underline, 
    Strikethrough,
    List,
    ListOrdered,
    EyeOff,
    Quote,
    Link as LinkIcon
} from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    height?: string;
}

export const RichTextEditor = ({ value, onChange, placeholder, height = '200px' }: RichTextEditorProps) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const selectionRangeRef = useRef<Range | null>(null);
    const [selectionFont, setSelectionFont] = useState<string>('—');
    const [selectionSize, setSelectionSize] = useState<string>('—');
    const [currentColor, setCurrentColor] = useState<string>('#000000');

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    useEffect(() => {
        const updateSelectionInfo = () => {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return;

            const anchorNode = selection.anchorNode;
            const root = editorRef.current;
            if (!anchorNode || !root) return;

            const elementNode = anchorNode.nodeType === Node.ELEMENT_NODE
                ? (anchorNode as HTMLElement)
                : (anchorNode.parentElement as HTMLElement | null);
            if (!elementNode || !root.contains(elementNode)) return;

            selectionRangeRef.current = selection.getRangeAt(0).cloneRange();

            const styles = window.getComputedStyle(elementNode);
            const fontFamily = styles.fontFamily || '—';
            const fontSize = styles.fontSize || '—';

            const resolveActualFont = (familyList: string, size: string) => {
                const families = familyList
                    .split(',')
                    .map((name) => name.trim().replace(/^["']|["']$/g, ''))
                    .filter(Boolean);

                if (typeof document !== 'undefined' && (document as any).fonts?.check) {
                    for (const family of families) {
                        if ((document as any).fonts.check(`${size} "${family}"`)) {
                            return family;
                        }
                    }
                }

                return families[0] || '—';
            };

            setSelectionFont(resolveActualFont(fontFamily, fontSize));
            setSelectionSize(fontSize);
        };

        document.addEventListener('selectionchange', updateSelectionInfo);
        editorRef.current?.addEventListener('keyup', updateSelectionInfo);
        editorRef.current?.addEventListener('mouseup', updateSelectionInfo);

        return () => {
            document.removeEventListener('selectionchange', updateSelectionInfo);
            editorRef.current?.removeEventListener('keyup', updateSelectionInfo);
            editorRef.current?.removeEventListener('mouseup', updateSelectionInfo);
        };
    }, []);

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const execCommand = (command: string, value?: string) => {
        // Для корректной работы цвета применяем inline-стили
        document.execCommand('styleWithCSS', false, 'true');
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };

    const restoreSelectionRange = () => {
        const selection = window.getSelection();
        if (!selection || !selectionRangeRef.current) return null;
        selection.removeAllRanges();
        selection.addRange(selectionRangeRef.current);
        return selection;
    };

    const applyTextColor = (color: string) => {
        setCurrentColor(color);
        const selection = restoreSelectionRange() || window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            execCommand('foreColor', color);
            return;
        }

        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.style.color = color;

        if (range.collapsed) {
            // Делает поведение как в Word: задаем цвет для дальнейшего ввода
            const zeroWidthSpace = document.createTextNode('\u200B');
            span.appendChild(zeroWidthSpace);
            range.insertNode(span);

            const newRange = document.createRange();
            newRange.setStart(zeroWidthSpace, 1);
            newRange.setEnd(zeroWidthSpace, 1);
            selection.removeAllRanges();
            selection.addRange(newRange);
            selectionRangeRef.current = newRange.cloneRange();
            editorRef.current?.focus();
            return;
        }

        try {
            range.surroundContents(span);
        } catch (error) {
            const contents = range.extractContents();
            span.appendChild(contents);
            range.insertNode(span);
        }

        selection.removeAllRanges();
        selection.addRange(range);
        selectionRangeRef.current = range.cloneRange();
        handleInput();
        editorRef.current?.focus();
    };

    const insertLink = () => {
        const url = prompt('Введите URL:');
        if (url) {
            execCommand('createLink', url);
        }
    };

    // Вставка маркированного списка
    const insertUnorderedList = () => {
        execCommand('insertUnorderedList');
    };

    // Вставка нумерованного списка
    const insertOrderedList = () => {
        execCommand('insertOrderedList');
    };

    // Вставка спойлера
    const insertSpoiler = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const text = range.toString();
            if (text) {
                const span = document.createElement('span');
                span.className = 'tg-spoiler';
                span.textContent = text;
                span.style.backgroundColor = '#000';
                span.style.color = '#000';
                span.style.cursor = 'pointer';
                span.title = 'Спойлер (наведите для просмотра)';
                range.deleteContents();
                range.insertNode(span);
                selection.removeAllRanges();
            } else {
                alert('Выделите текст для создания спойлера');
            }
        }
        editorRef.current?.focus();
    };

    // Вставка цитаты (blockquote)
    const insertBlockquote = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const blockquote = document.createElement('blockquote');
            blockquote.style.borderLeft = '4px solid #ccc';
            blockquote.style.paddingLeft = '1em';
            blockquote.style.marginLeft = '0';
            
            // Извлекаем содержимое выделения
            const contents = range.extractContents();
            blockquote.appendChild(contents);
            range.insertNode(blockquote);
            
            selection.removeAllRanges();
        }
        editorRef.current?.focus();
    };

    // Кнопки панели инструментов (специально для Telegram)
    const toolbarButtons = [
        { 
            icon: Bold, 
            action: () => execCommand('bold'), 
            title: 'Жирный (Ctrl+B)',
            telegram: '<b>текст</b> или <strong>текст</strong>'
        },
        { 
            icon: Italic, 
            action: () => execCommand('italic'), 
            title: 'Курсив (Ctrl+I)',
            telegram: '<i>текст</i> или <em>текст</em>'
        },
        { 
            icon: Underline, 
            action: () => execCommand('underline'), 
            title: 'Подчеркнутый (Ctrl+U)',
            telegram: '<u>текст</u>'
        },
        { 
            icon: Strikethrough, 
            action: () => execCommand('strikeThrough'), 
            title: 'Зачеркнутый',
            telegram: '<s>текст</s> или <del>текст</del>'
        },
        { 
            icon: List, 
            action: insertUnorderedList, 
            title: 'Маркированный список',
            telegram: '• Элемент 1\n• Элемент 2'
        },
        { 
            icon: ListOrdered, 
            action: insertOrderedList, 
            title: 'Нумерованный список',
            telegram: '1. Элемент 1\n2. Элемент 2'
        },
        { 
            icon: EyeOff, 
            action: insertSpoiler, 
            title: 'Спойлер (скрытый текст)',
            telegram: '<span class="tg-spoiler">текст</span>'
        },
        { 
            icon: Quote, 
            action: insertBlockquote, 
            title: 'Цитата',
            telegram: '<blockquote>текст</blockquote>'
        },
        { 
            icon: LinkIcon, 
            action: insertLink, 
            title: 'Вставить ссылку',
            telegram: '<a href="url">текст</a>'
        },
    ];

    return (
        <div className="border rounded-lg overflow-hidden">
            {/* Toolbar */}
            <div className="flex gap-1 p-2 bg-gray-50 border-b flex-wrap items-center">
                <div className="px-2 py-1 text-xs text-gray-600 bg-white border rounded">
                    {selectionFont} • {selectionSize}
                </div>
                <label className="flex items-center gap-2 px-2 py-1 text-xs text-gray-600 bg-white border rounded cursor-pointer">
                    Цвет
                    <input
                        type="color"
                        value={currentColor}
                        onMouseDown={() => {
                            const selection = window.getSelection();
                            if (selection && selection.rangeCount > 0) {
                                selectionRangeRef.current = selection.getRangeAt(0).cloneRange();
                            }
                        }}
                        onChange={(e) => applyTextColor(e.target.value)}
                        className="h-5 w-8 cursor-pointer border-0 bg-transparent p-0"
                        title="Цвет текста"
                    />
                </label>
                {toolbarButtons.map((button, index) => {
                    const Icon = button.icon;
                    return (
                        <button
                            key={index}
                            type="button"
                            onClick={button.action}
                            title={`${button.title}\nTelegram: ${button.telegram}`}
                            className="p-2 hover:bg-gray-200 rounded transition-colors group relative"
                        >
                            <Icon size={18} />
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                {button.title}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Info banner */}
            <div className="bg-blue-50 border-b border-blue-200 px-3 py-2 text-xs text-blue-800">
                💡 <strong>Telegram HTML:</strong> Поддерживает жирный, курсив, подчеркнутый, зачеркнутый, списки, спойлер, цитату, ссылки и цвет текста
            </div>

            {/* Editor */}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                className="p-3 outline-none prose max-w-none overflow-y-auto"
                style={{ minHeight: height }}
                data-placeholder={placeholder}
            />

            <style>{`
                [contenteditable][data-placeholder]:empty:before {
                    content: attr(data-placeholder);
                    color: #9ca3af;
                    pointer-events: none;
                }
                [contenteditable] {
                    cursor: text;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    line-height: 1.6;
                }
                [contenteditable]:focus {
                    outline: none;
                }
                
                /* Telegram поддерживаемые теги */
                [contenteditable] b, 
                [contenteditable] strong {
                    font-weight: bold;
                }
                [contenteditable] i, 
                [contenteditable] em {
                    font-style: italic;
                }
                [contenteditable] u, 
                [contenteditable] ins {
                    text-decoration: underline;
                }
                [contenteditable] s, 
                [contenteditable] strike, 
                [contenteditable] del {
                    text-decoration: line-through;
                }
                [contenteditable] code {
                    background-color: #f3f4f6;
                    padding: 2px 4px;
                    border-radius: 3px;
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 0.9em;
                    color: #e11d48;
                }
                [contenteditable] pre {
                    background-color: #1f2937;
                    color: #f9fafb;
                    padding: 12px;
                    border-radius: 6px;
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 0.9em;
                    overflow-x: auto;
                    margin: 0.5em 0;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }
                [contenteditable] .tg-spoiler {
                    background-color: #000;
                    color: #000;
                    cursor: pointer;
                    border-radius: 2px;
                    padding: 0 2px;
                    transition: all 0.2s;
                }
                [contenteditable] .tg-spoiler:hover {
                    background-color: transparent;
                    color: inherit;
                }
                [contenteditable] blockquote {
                    border-left: 4px solid #3b82f6;
                    padding-left: 1em;
                    margin-left: 0;
                    margin-right: 0;
                    color: #4b5563;
                    font-style: italic;
                }
                [contenteditable] a {
                    color: #2563eb;
                    text-decoration: underline;
                    cursor: pointer;
                }
                [contenteditable] a:hover {
                    color: #1d4ed8;
                }
                [contenteditable] ul {
                    list-style-type: disc;
                    margin-left: 1.5em;
                    padding-left: 0.5em;
                }
                [contenteditable] ol {
                    list-style-type: decimal;
                    margin-left: 1.5em;
                    padding-left: 0.5em;
                }
                [contenteditable] li {
                    margin: 0.25em 0;
                }
            `}</style>
        </div>
    );
};

