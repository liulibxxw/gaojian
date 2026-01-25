
import React from 'react';
import { XMarkIcon, ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

interface ExportModalProps {
  imageUrl: string | null;
  isExporting: boolean;
  onClose: () => void;
  onDownload: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ imageUrl, isExporting, onClose, onDownload }) => {
  // If not exporting and no image, don't render (though parent usually handles this)
  if (!imageUrl && !isExporting) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col animate-in fade-in duration-200">
       <div className="flex justify-between items-center p-4 text-white z-20 bg-gradient-to-b from-black/50 to-transparent shrink-0">
          <span className="font-bold text-lg drop-shadow-md">导出预览</span>
          <button 
            onClick={onClose} 
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors backdrop-blur-md"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
       </div>

       <div 
         className="flex-1 overflow-y-auto overflow-x-hidden flex items-start justify-center p-4 custom-scrollbar"
         onClick={onClose} // Click outside to close
       >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative"
          >
            {isExporting ? (
               <div className="flex flex-col items-center justify-center h-64 text-white/80 gap-4">
                  <ArrowPathIcon className="w-10 h-10 animate-spin opacity-80" />
                  <p className="font-bold tracking-widest text-sm">正在生成高清图片...</p>
               </div>
            ) : (
               imageUrl && (
                 <img 
                   src={imageUrl} 
                   alt="Export Preview" 
                   className="max-w-full md:max-w-md shadow-2xl rounded-lg w-full h-auto object-contain bg-white"
                   style={{ display: 'block' }} 
                 />
               )
            )}
          </div>
       </div>

       {!isExporting && (
         <div className="p-6 pb-10 bg-black/40 backdrop-blur-md border-t border-white/10 flex justify-center z-20 shrink-0">
            <button 
              onClick={onDownload}
              className="w-full max-w-sm bg-white text-black py-4 rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform active:scale-95"
            >
              <ArrowDownTrayIcon className="w-6 h-6" />
              保存到相册
            </button>
         </div>
       )}
    </div>
  );
};

export default ExportModal;
