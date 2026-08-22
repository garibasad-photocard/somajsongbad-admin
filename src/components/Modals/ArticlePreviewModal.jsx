import { X, Printer } from 'lucide-react';

const ArticlePreviewModal = ({ isOpen, onClose, articleData }) => {
  if (!isOpen) return null;

  const {
    title = '',
    byline = '',
    content = '',
    coverImagePreview = '',
    printEdition = {}
  } = articleData || {};

  const colSpan      = printEdition.colSpan      || 4;
  const heightInches = printEdition.heightInches  || 10;

  // ── Headline settings ──
  const hlFont   = printEdition.headlineFont   || 'Georgia, serif';
  const hlSize   = printEdition.headlineSize   || 36;
  const hlWeight = printEdition.headlineWeight === 'black' ? 900
                 : printEdition.headlineWeight === 'bold'  ? 700 : 400;
  const hlLine   = printEdition.headlineLineH  || 1.15;
  const hlAlign  = printEdition.headlineAlign  || 'left';

  // ── Body settings ──
  const bdFont   = printEdition.bodyFont       || 'Arial, sans-serif';
  const bdSize   = printEdition.bodySize       || 12;
  const bdWeight = printEdition.bodyWeight === 'black' ? 900
                 : printEdition.bodyWeight === 'bold'  ? 700 : 400;
  const bdLine   = printEdition.bodyLineH  || 1.65;

  const template = printEdition.template || 'photo-top';
  
  // For side-by-side templates, we don't do multi-column for the text block (it would be too squeezed)
  const cols = (template === 'photo-left' || template === 'photo-right') ? 1 : 2;
  const showPhotoBlock = template !== 'text-only';
  const isSideTemplate = template === 'photo-left' || template === 'photo-right';

  const renderHTMLPhoto = () => {
    if (!showPhotoBlock) return '';
    if (coverImagePreview) return `<img class="photo-img" src="${coverImagePreview}" alt=""/>`;
    return `<div class="photo-img placeholder">ছবি এখানে বসবে</div>`;
  };

  const renderReactPhoto = () => {
    if (!showPhotoBlock) return null;
    const style = {
      width: isSideTemplate ? '50%' : '100%',
      flexShrink: 0,
      marginBottom: (isSideTemplate || template === 'photo-bottom') ? '0' : '18px',
      marginTop: template === 'photo-bottom' ? '18px' : '0'
    };
    if (coverImagePreview) {
      return <img src={coverImagePreview} alt="cover" style={{...style, objectFit: 'cover', filter: 'grayscale(1)', display: 'block'}}/>;
    }
    return (
      <div style={{...style, backgroundColor: '#e2e8f0', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontWeight: 'bold'}}>
        ছবি এখানে বসবে
      </div>
    );
  };

  const handlePrint = () => {
    const printWin = window.open('', '_blank', 'width=900,height=700');
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8"/>
        <title>${title || 'নিউজ প্রিভিউ'}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&family=Noto+Serif+Bengali:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          * { box-sizing: border-box; }
          body { background:#fff; margin:0; padding:0; color:#111; }
          .wrap { 
            max-width: 700px; 
            margin: 0 auto; 
            padding: 24px; 
            height: ${heightInches}in; 
            overflow: hidden; 
            display: flex; 
            flex-direction: column; 
          }
          h1 {
            font-size: ${hlSize}pt;
            font-weight: ${hlWeight};
            line-height: ${hlLine};
            font-family: ${hlFont};
            text-align: ${hlAlign};
            margin: 0 0 4px 0;
            flex-shrink: 0;
          }
          .byline {
            font-family: ${bdFont};
            font-size: ${Math.max(Math.round(bdSize * 0.5), 6)}pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: .07em;
            color: #555;
            margin-bottom: 6px;
            flex-shrink: 0;
          }
          img { display:block; filter:grayscale(1); object-fit:cover; }
          .body {
            font-size: ${bdSize}pt;
            font-weight: ${bdWeight};
            line-height: ${bdLine};
            font-family: ${bdFont};
            text-align: justify;
            column-count: ${cols};
            column-gap: 16px;
            flex: 1;
            overflow: hidden;
          }
          .body p { margin: 0 0 8pt; }
          .photo-wrap { 
            display: ${isSideTemplate ? 'flex' : 'block'}; 
            gap: 20px; 
            flex-direction: ${template === 'photo-right' ? 'row-reverse' : 'row'};
            flex: 1;
            overflow: hidden;
          }
          .photo-img { 
            width: ${isSideTemplate ? '50%' : '100%'}; 
            margin-bottom: ${isSideTemplate ? '0' : '14px'}; 
            margin-top: ${template === 'photo-bottom' ? '14px' : '0'}; 
            flex-shrink: 0; 
            height: 100%;
            max-height: ${isSideTemplate ? '100%' : '50%'}; 
          }
          .placeholder { background: #e2e8f0; display: flex; align-items: center; justify-content: center; color: #64748b; font-weight: bold; font-family: sans-serif; font-size: 14pt; min-height: 200px; }
        </style>
      </head>
      <body>
        <div class="wrap">
          ${template === 'photo-top' ? renderHTMLPhoto() : ''}
          
          <h1>${title || 'শিরোনাম নেই'}</h1>
          <div class="byline">${byline || 'নিজস্ব প্রতিবেদক'}</div>
          
          <div class="photo-wrap">
            ${isSideTemplate ? renderHTMLPhoto() : ''}
            <div class="body">${content || '<p>কোনো বডি নেই।</p>'}</div>
          </div>
          
          ${template === 'photo-bottom' ? renderHTMLPhoto() : ''}
        </div>
      </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 800);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.80)' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ width: '900px', maxWidth: '96vw', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 bg-gray-100 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-black text-gray-800 text-sm">📰 প্রিন্ট প্রিভিউ</span>
            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
              {colSpan} কলাম × {heightInches}"
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow transition-all"
            >
              <Printer size={13}/> PDF / প্রিন্ট
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-all">
              <X size={18}/>
            </button>
          </div>
        </div>

        {/* Newspaper canvas */}
        <div className="overflow-y-auto flex-1 bg-gray-300 p-8 flex justify-center items-start">
          <div
            className="bg-white shadow-lg flex flex-col"
            style={{
              width: '100%',
              maxWidth: `${Math.min(colSpan * 92, 820)}px`,
              height: `${heightInches * 96}px`, // Strict height scaling for screen (1 inch = 96px approx)
              padding: '32px 36px 40px',
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}
          >
            {/* Photo — top */}
            {template === 'photo-top' && renderReactPhoto()}

            {/* Headline */}
            <h1 style={{
              fontFamily:    hlFont,
              fontSize:      `${hlSize}pt`,
              fontWeight:    hlWeight,
              lineHeight:    hlLine,
              textAlign:     hlAlign,
              color:         '#0d0d0d',
              margin:        '0 0 4px 0',
              flexShrink:    0
            }}>
              {title || 'শিরোনাম এখানে থাকবে'}
            </h1>

            {/* Byline */}
            <p style={{
              fontFamily:    bdFont,
              fontSize:      `${Math.max(Math.round(bdSize * 0.5), 6)}pt`,
              fontWeight:    700,
              textTransform: 'uppercase',
              letterSpacing: '.07em',
              color:         '#555',
              margin:        '0 0 6px 0',
              flexShrink:    0
            }}>
              {byline || 'নিজস্ব প্রতিবেদক'}
            </p>

            <div style={{ 
              display: isSideTemplate ? 'flex' : 'block', 
              flexDirection: template === 'photo-right' ? 'row-reverse' : 'row', 
              gap: '24px',
              flex: 1,
              overflow: 'hidden'
            }}>
              {/* Photo — side */}
              {isSideTemplate && renderReactPhoto()}

              {/* Body */}
              <div
                style={{
                  fontFamily:  bdFont,
                  fontSize:    `${bdSize}pt`,
                  fontWeight:  bdWeight,
                  lineHeight:  bdLine,
                  color:       '#111',
                  textAlign:   'justify',
                  columnCount: cols,
                  columnGap:   '16px',
                  flex: 1,
                  overflow: 'hidden' // Cuts off text that doesn't fit in heightInches
                }}
                dangerouslySetInnerHTML={{ __html: content || '<p>কোনো বডি নেই।</p>' }}
              />
            </div>

            {/* Photo — bottom */}
            {template === 'photo-bottom' && renderReactPhoto()}
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticlePreviewModal;
