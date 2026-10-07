import React, { useState, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Upload,
  ImageIcon,
  Sparkles,
  Check,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface ISlideDraft {
  caption: string;
  url: string;
  filename?: string;
}

interface InsertSliderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (markdownSnippet: string) => void;
}

export const InsertSliderModal: React.FC<InsertSliderModalProps> = ({
  isOpen,
  onClose,
  onInsert,
}) => {
  const [slides, setSlides] = useState<ISlideDraft[]>([
    { caption: 'Initial Architecture / Stage 1', url: '' },
    { caption: 'Optimized Flow / Stage 2', url: '' },
  ]);
  const [activeUploadIndex, setActiveUploadIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleTriggerUpload = (index: number) => {
    setActiveUploadIndex(index);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || activeUploadIndex === null) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('File size exceeds 8MB. Please select an image under 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setSlides((prev) =>
          prev.map((s, idx) =>
            idx === activeUploadIndex
              ? { ...s, url: dataUrl, filename: file.name }
              : s
          )
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddSlide = () => {
    setSlides((prev) => [
      ...prev,
      { caption: `Architecture Diagram ${prev.length + 1}`, url: '' },
    ]);
  };

  const handleRemoveSlide = (index: number) => {
    if (slides.length <= 2) {
      alert('A slider requires at least 2 images for comparison.');
      return;
    }
    setSlides((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateSlide = (index: number, field: 'caption' | 'url', val: string) => {
    setSlides((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, [field]: val } : s))
    );
  };

  const handleConfirmInsert = () => {
    const validSlides = slides.filter((s) => s.url.trim());
    if (validSlides.length < 2) {
      alert('Please upload or enter image URLs for at least 2 slides.');
      return;
    }

    // Format into standard :::slider markdown
    const lines = [':::slider'];
    validSlides.forEach((s, idx) => {
      const cap = s.caption.trim() || `Figure ${idx + 1}`;
      lines.push(`![${cap}](${s.url.trim()})`);
    });
    lines.push(':::');

    const snippet = `\n${lines.join('\n')}\n`;
    onInsert(snippet);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <div className="w-full max-w-2xl bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-dark-800 flex items-center justify-between bg-slate-50/60 dark:bg-dark-850/60">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <ImageIcon className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Insert Interactive 2-Image Slider
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload from device or paste image URLs. Students will slide smoothly between them.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-750 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Slides List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {slides.map((slide, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-slate-200 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-850/40 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  Slide {idx + 1}
                </span>

                {slides.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSlide(idx)}
                    className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Caption / Figure Title
                </label>
                <Input
                  value={slide.caption}
                  onChange={(e) => handleUpdateSlide(idx, 'caption', e.target.value)}
                  placeholder={`e.g. Stage ${idx + 1}: Client-Side Rendering Workflow`}
                  className="text-xs h-9"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Image Source (Device Upload or Web URL)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTriggerUpload(idx)}
                    className="px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload from Device</span>
                  </button>

                  <div className="relative flex-1">
                    <Input
                      value={slide.url.startsWith('data:image') ? `[Device Image: ${slide.filename || 'Uploaded'}]` : slide.url}
                      onChange={(e) => {
                        if (!slide.url.startsWith('data:image')) {
                          handleUpdateSlide(idx, 'url', e.target.value);
                        }
                      }}
                      readOnly={slide.url.startsWith('data:image')}
                      placeholder="Or paste public image URL (https://...)"
                      className="text-xs h-9 pr-8"
                    />
                    {slide.url && (
                      <button
                        type="button"
                        onClick={() => handleUpdateSlide(idx, 'url', '')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="Clear image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Live Preview Thumbnail */}
              {slide.url && (
                <div className="mt-2 p-2 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 flex items-center gap-3">
                  <img
                    src={slide.url}
                    alt={slide.caption}
                    className="w-16 h-12 object-cover rounded-lg border border-slate-200 dark:border-dark-700 shrink-0"
                  />
                  <div className="overflow-hidden">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {slide.caption || 'Slide Image'}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
                      <Check className="w-3 h-3" /> Image attached successfully
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddSlide}
            className="w-full py-2.5 rounded-xl border border-dashed border-purple-300 dark:border-purple-800 hover:border-purple-500 text-purple-700 dark:text-purple-300 bg-purple-50/40 dark:bg-purple-950/20 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Another Slide Image</span>
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-dark-800 bg-slate-50/60 dark:bg-dark-850/60 flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirmInsert}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-purple-500/20"
            type="button"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Insert Slider into Chapter</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
export default InsertSliderModal;
