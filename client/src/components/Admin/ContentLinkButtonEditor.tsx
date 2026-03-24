import { MyInput } from './MyInput';
import { RedirectToPageSelector } from './RedirectToPageSelector';

export interface LinkButtonValue {
    linkButtonText?: string | null;
    linkButtonLink?: string | null;
    linkButtonType?: 'internal' | 'external';
}

interface ContentLinkButtonEditorProps {
    value: LinkButtonValue | null | undefined;
    onChange: (value: LinkButtonValue | null) => void;
}

function linkTypeFromUrl(link: string): 'internal' | 'external' {
    const t = (link || '').trim();
    if (t.startsWith('http://') || t.startsWith('https://')) {
        return 'external';
    }
    return 'internal';
}

/**
 * Текст кнопки + выбор страницы/контента/внешней ссылки через RedirectToPageSelector
 * (как в рассылках и модальных уведомлениях).
 */
export const ContentLinkButtonEditor = ({ value, onChange }: ContentLinkButtonEditorProps) => {
    const handleTextChange = (text: string) => {
        onChange({
            ...value,
            linkButtonText: text || null,
            linkButtonLink: value?.linkButtonLink ?? null,
            linkButtonType: value?.linkButtonLink
                ? linkTypeFromUrl(value.linkButtonLink)
                : value?.linkButtonType || 'internal',
        });
    };

    const handleLinkChange = (link: string) => {
        const linkButtonLink = link || null;
        onChange({
            ...value,
            linkButtonText: value?.linkButtonText ?? null,
            linkButtonLink,
            linkButtonType: linkTypeFromUrl(link),
        });
    };

    return (
        <div className="p-3 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Кнопка-ссылка</span>
            </div>

            <MyInput
                label="Текст кнопки"
                type="text"
                value={value?.linkButtonText || ''}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Текст кнопки"
            />

            <div>
                <label className="block text-sm font-medium mb-2">Куда ведёт кнопка</label>
                <RedirectToPageSelector
                    value={value?.linkButtonLink || ''}
                    onChange={handleLinkChange}
                />
            </div>
        </div>
    );
};
