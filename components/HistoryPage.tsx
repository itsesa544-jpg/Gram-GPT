import React, { useState } from 'react';
import { ArrowLeftIcon, DownloadIcon, TrashIcon } from './IconComponents';

declare const html2canvas: any;
declare const jspdf: any;
declare const marked: any;

interface HistoryItem {
  prompt: string;
  response: {
    text: string;
    generatedImage?: string;
  };
  image?: string; // User-uploaded image
}

interface HistoryPageProps {
  history: HistoryItem[];
  onBack: () => void;
  onDeleteItem: (index: number) => void;
  onClearAll: () => void;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ history, onBack, onDeleteItem, onClearAll }) => {
  const [downloading, setDownloading] = useState<number | null>(null);

  const handleDownloadPDF = async (index: number) => {
    setDownloading(index);
    const element = document.getElementById(`history-item-${index}`);
    if (element) {
      try {
        const { jsPDF } = jspdf;
        const canvas = await html2canvas(element, {
             useCORS: true, // Important for external images
             allowTaint: true,
             scale: 2 // Improve quality
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`gram-gpt-history-${index + 1}.pdf`);
      } catch (error) {
          console.error("Failed to download PDF:", error);
          // You might want to show an error to the user here
      } finally {
        setDownloading(null);
      }
    }
  };

    const handleDownloadSingleImage = (dataUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    const mimeType = dataUrl.split(';')[0].split(':')[1];
    const extension = mimeType.split('/')[1] || 'png';
    link.download = `gram-gpt-history-image-${index}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="p-0 sm:p-2 md:p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 mr-2 sm:mr-4" aria-label="Go back">
            <ArrowLeftIcon />
            </button>
            <h2 className="text-2xl font-bold text-gray-800">আপনার কথোপকথনের ইতিহাস</h2>
        </div>
        {history.length > 0 && (
             <button
                onClick={onClearAll}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 disabled:opacity-50 self-end sm:self-auto"
                aria-label="Clear all history"
                >
                <TrashIcon />
                <span>সব মুছুন</span>
            </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">আপনার এখনো কোনো ইতিহাস নেই।</p>
        </div>
      ) : (
        <div className="space-y-6">
          {history.map((item, index) => (
            <div id={`history-item-${index}`} key={index} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-grow">
                      <h3 className="text-lg font-semibold text-green-700 mb-2">আপনার প্রশ্ন:</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">{item.prompt}</p>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-auto">
                    <button
                        onClick={() => handleDownloadPDF(index)}
                        className="flex items-center space-x-2 px-3 py-1.5 border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-50 disabled:opacity-50"
                        disabled={downloading === index}
                        aria-label="Download as PDF"
                        >
                            {downloading === index ? (
                                <span>ডাউনলোড হচ্ছে...</span>
                            ) : (
                                <>
                                    <DownloadIcon />
                                    <span>PDF</span>
                                </>
                            )}
                    </button>
                    <button
                        onClick={() => onDeleteItem(index)}
                        className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100"
                        aria-label="Delete item"
                        title="এই আইটেমটি মুছুন"
                        >
                        <TrashIcon />
                    </button>
                  </div>
              </div>

               {item.image && (
                <div className="mt-4">
                    <h4 className="text-md font-semibold text-gray-600 mb-2">আপনার দেওয়া ছবি:</h4>
                    <div className="relative inline-block">
                        <img src={item.image} alt="User uploaded context" className="rounded-lg max-w-xs w-full shadow" />
                         <button
                            onClick={() => handleDownloadSingleImage(item.image!, index)}
                            className="absolute top-2 right-2 bg-white text-gray-700 p-2 rounded-full hover:bg-gray-100 shadow"
                            aria-label="Download your uploaded image"
                            title="আপনার ছবিটি ডাউনলোড করুন"
                        >
                            <DownloadIcon />
                        </button>
                    </div>
                </div>
              )}

              <hr className="my-4 border-gray-200" />

              <div>
                <h3 className="text-lg font-semibold text-blue-700 mb-2">গ্রাম জিপিটি-র উত্তর:</h3>
                 {item.response.generatedImage && (
                    <div className="relative mb-4">
                        <img src={item.response.generatedImage} alt="Generated content" className="rounded-lg w-full max-w-md shadow-lg" />
                         <button
                            onClick={() => handleDownloadSingleImage(item.response.generatedImage!, index)}
                            className="absolute top-2 right-2 bg-white text-gray-700 p-2 rounded-full hover:bg-gray-100 shadow"
                            aria-label="Download image"
                            title="ছবিটি ডাউনলোড করুন"
                        >
                            <DownloadIcon />
                        </button>
                    </div>
                )}
                <div 
                    className="prose max-w-none whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: marked.parse(item.response.text) }}
                 />
              </div>
            </div>
          )).reverse()}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;