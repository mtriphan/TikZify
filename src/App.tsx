/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Upload, FileCode, Copy, RefreshCw, Image as ImageIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateTikZFromImage } from './services/geminiService';

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<{data: string, type: string} | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [tikzCode, setTikzCode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  const processFile = (file: File | undefined | null) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setImage(reader.result as string);
        setImageFile({ data: base64String, type: file.type });
        setTikzCode('');
        setError(null);
      };
      reader.readAsDataURL(file);
    } else if (file) {
      setError('Vui lòng chọn một tệp hình ảnh hợp lệ.');
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        processFile(blob);
        break;
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  const handleConvert = async () => {
    if (!imageFile) return;

    setIsGenerating(true);
    setError(null);
    try {
      const code = await generateTikZFromImage(imageFile.data, imageFile.type);
      setTikzCode(code);
    } catch (err) {
      setError('Đã có lỗi xảy ra khi tạo mã TikZ. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (tikzCode) {
      navigator.clipboard.writeText(tikzCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <FileCode size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">TikZify</h1>
          </div>
          <div className="text-sm font-medium text-slate-500">
            Chuyển đổi hình vẽ thành mã TikZ
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8" onPaste={handlePaste}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Upload and Preview */}
          <section className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ImageIcon size={20} className="text-indigo-600" />
                Hình ảnh mẫu
              </h2>
              
              <div 
                onClick={triggerUpload}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className={`relative aspect-square rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden p-2
                  ${image ? 'border-transparent bg-slate-100' : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/30'}`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  className="hidden" 
                  accept="image/*"
                />
                
                {image ? (
                  <>
                    <img src={image} alt="Drawing preview" className="w-full h-full object-contain rounded-lg shadow-sm" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white font-medium flex items-center gap-2">
                        <RefreshCw size={20} /> Thay đổi hình ảnh
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-8">
                    <div className="mx-auto w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-110">
                      <Upload size={32} />
                    </div>
                    <p className="text-slate-600 font-medium whitespace-nowrap">Kéo thả, dán (Ctrl+V) hoặc nhấp để tải ảnh</p>
                    <p className="text-slate-400 text-sm mt-1">Hỗ trợ PNG, JPG, GIF</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  disabled={!image || isGenerating}
                  onClick={handleConvert}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      >
                        <RefreshCw size={20} />
                      </motion.div>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <FileCode size={20} />
                      Chuyển sang TikZ
                    </>
                  )}
                </button>
                {image && (
                  <button 
                    onClick={() => {setImage(null); setImageFile(null); setTikzCode('');}}
                    className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
                    title="Xóa ảnh"
                  >
                    <RefreshCw size={20} />
                  </button>
                )}
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-600 text-sm">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}
            </div>
            
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 text-indigo-900 text-sm leading-relaxed">
              <p className="font-semibold mb-1">Mẹo xử lý:</p>
              <ul className="list-disc list-inside space-y-1 opacity-90">
                <li>Sử dụng hình ảnh chụp trực diện, đủ sáng.</li>
                <li>Bản vẽ tay nên có nét vẽ rõ ràng, không quá rối.</li>
                <li>Hỗ trợ tốt các sơ đồ, đồ thị hình học và biểu đồ.</li>
              </ul>
            </div>
          </section>

          {/* Right Column: Code Result */}
          <section className="space-y-6">
            <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 flex flex-col h-full min-h-[600px] overflow-hidden">
              <div className="bg-slate-800/50 px-6 py-4 flex items-center justify-between border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="ml-2 text-slate-400 text-xs font-mono font-medium">tikz-code.tex</span>
                </div>
                <button
                  disabled={!tikzCode}
                  onClick={handleCopy}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${copied 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed'}`}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 size={14} /> Đã sao chép
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Sao chép
                    </>
                  )}
                </button>
              </div>
              
              <div className="flex-1 p-6 font-mono text-sm overflow-auto text-slate-300 leading-relaxed">
                <AnimatePresence mode="wait">
                  {tikzCode ? (
                    <motion.pre
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="whitespace-pre-wrap selection:bg-indigo-500/30"
                    >
                      {tikzCode}
                    </motion.pre>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60 italic">
                      {isGenerating ? (
                        <div className="flex flex-col items-center gap-4">
                          <motion.div
                            animate={{ 
                              scale: [1, 1.2, 1],
                              opacity: [0.5, 1, 0.5]
                            }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center"
                          >
                            <FileCode size={24} className="text-indigo-400" />
                          </motion.div>
                          <p>Đang giải mã hình ảnh...</p>
                        </div>
                      ) : (
                        <>
                          <FileCode size={48} className="mb-4 opacity-20" />
                          <p>Mã TikZ sẽ xuất hiện ở đây sau khi chuyển đổi.</p>
                        </>
                      )}
                    </div>
                  )}
                </AnimatePresence>
              </div>
              
              {tikzCode && (
                <div className="bg-slate-800/30 p-4 border-t border-slate-700 text-slate-500 text-xs">
                  <p>Lưu ý: Bạn cần môi trường LaTeX với gói <code>tikz</code> để biên dịch mã này.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto px-6 py-12 border-t border-slate-200 text-center text-slate-400 text-sm">
        <p>&copy; 2026 TikZify - AI Powered Drawing to LaTeX. Built with Gemini AI.</p>
      </footer>
    </div>
  );
}
