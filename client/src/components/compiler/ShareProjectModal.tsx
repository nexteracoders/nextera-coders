import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Share2,
  Copy,
  Check,
  QrCode,
  MessageCircle,
  Linkedin,
  Twitter,
  Send,
  FileCode,
  FolderTree,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { WorkspaceFile, WorkspaceFolder } from '../../pages/public/NecCompilerPage';

export interface SharedProjectPayload {
  version: number;
  title?: string;
  activeFileId?: string;
  files: Array<{
    id: string;
    name: string;
    language: string;
    content: string;
    folderId?: string | null;
  }>;
  folders?: Array<{
    id: string;
    name: string;
  }>;
}

/**
 * UTF-8 Safe Base64 Compression for URLs
 */
export function encodeProjectPayload(payload: SharedProjectPayload): string {
  try {
    const jsonStr = JSON.stringify(payload);
    // UTF-8 safe base64 encoding
    const encoded = btoa(
      encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      )
    );
    return encoded;
  } catch (e) {
    console.error('Failed to encode project payload', e);
    return '';
  }
}

/**
 * UTF-8 Safe Base64 Decompression from URL
 */
export function decodeProjectPayload(encodedStr: string): SharedProjectPayload | null {
  try {
    const cleanStr = encodedStr.trim();
    const jsonStr = decodeURIComponent(
      Array.prototype.map
        .call(atob(cleanStr), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('Failed to decode project payload', e);
    return null;
  }
}

interface ShareProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: WorkspaceFile[];
  folders: WorkspaceFolder[];
  activeFileId: string;
}

export const ShareProjectModal: React.FC<ShareProjectModalProps> = ({
  isOpen,
  onClose,
  files,
  folders,
  activeFileId,
}) => {
  const { success } = useToast();
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>('');

  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  // Generate shareable URL and QR Code when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const payload: SharedProjectPayload = {
      version: 1,
      title: activeFile?.name || 'NextEra Project',
      activeFileId,
      files: files.map((f) => ({
        id: f.id,
        name: f.name,
        language: f.language,
        content: f.content,
        folderId: f.folderId,
      })),
      folders: (folders || []).map((f) => ({
        id: f.id,
        name: f.name,
      })),
    };

    const encoded = encodeProjectPayload(payload);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const fullUrl = `${origin}/compiler#project=${encoded}`;
    setShareUrl(fullUrl);

    // Generate QR Code data URL
    QRCode.toDataURL(fullUrl, {
      width: 250,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [isOpen, files, folders, activeFileId, activeFile]);

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    success('Project share link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Social Share Intent URLs
  const shareTitle = `Check out my code project "${activeFile?.name || 'Interactive Code'}" on NextEra Coders Compiler! ⚡`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + '\n' + shareUrl)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Project & Code"
      maxWidth="md"
    >
      <div className="space-y-6 text-slate-200">
        
        {/* Header Preview Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-950/70 via-indigo-950/60 to-slate-900 border border-brand-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Instant Project Sharing</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Zero Login Needed
                </span>
              </h4>
              <p className="text-xs text-slate-400">
                Anyone with this link can view, run, and fork all {files.length} files in their browser!
              </p>
            </div>
          </div>
        </div>

        {/* Project Metadata Snapshot */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2">
            <FileCode className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Active File</span>
              <span className="text-slate-200 font-bold truncate block">{activeFile?.name || 'main'}</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-brand-400" />
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Total Files</span>
              <span className="text-slate-200 font-bold block">{files.length} Files</span>
            </div>
          </div>
        </div>

        {/* Shareable Link Input Box */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>Project Link</span>
            <span className="text-[11px] text-slate-500 font-normal">Permanent URL</span>
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono select-all focus:outline-none focus:border-brand-500"
              />
            </div>
            <Button
              type="button"
              onClick={handleCopy}
              variant="primary"
              size="sm"
              leftIcon={copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              className="shrink-0 font-mono"
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
          </div>
        </div>

        {/* Quick Social Share Buttons */}
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
            Share Directly To
          </span>
          <div className="grid grid-cols-4 gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-[#0077B5]/10 hover:bg-[#0077B5]/20 border border-[#0077B5]/30 text-[#0077B5] flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Linkedin className="w-4 h-4" />
              <span>LinkedIn</span>
            </a>
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 border border-[#1DA1F2]/30 text-[#1DA1F2] flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Twitter className="w-4 h-4" />
              <span>Twitter/X</span>
            </a>
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-[#229ED9]/10 hover:bg-[#229ED9]/20 border border-[#229ED9]/30 text-[#229ED9] flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Telegram</span>
            </a>
          </div>
        </div>

        {/* QR Code Toggle for Mobile Testing */}
        <div className="pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setShowQr((prev) => !prev)}
            className="flex items-center justify-between w-full p-3 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>{showQr ? 'Hide QR Code' : 'Show QR Code for Phone Testing'}</span>
            </div>
            <span className="text-[10px] text-brand-400 uppercase font-bold">
              {showQr ? '▲ Hide' : '▼ View QR'}
            </span>
          </button>

          {showQr && qrCodeUrl && (
            <div className="mt-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2 animate-fade-in">
              <img
                src={qrCodeUrl}
                alt="Project QR Code"
                className="w-44 h-44 mx-auto rounded-xl shadow-lg border border-slate-700 bg-white p-2"
              />
              <p className="text-[11px] text-slate-400 font-mono">
                📱 Scan with your phone camera to instantly run this project on mobile!
              </p>
            </div>
          )}
        </div>

      </div>
    </Modal>
  );
};
