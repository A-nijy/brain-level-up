import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { Item } from '@/types';

// StorageAccessFramework 및 EncodingType 명시적 확인
const SAF = (FileSystem as any).StorageAccessFramework;
const EncType = (FileSystem as any).EncodingType;

export interface ExportOptions {
  mode: 'both' | 'word_only' | 'meaning_only';
  order: 'sequential' | 'random';
  title: string;
  action?: 'share' | 'download';
}

export const PdfService = {
  async generateAndShare(items: Item[], options: ExportOptions, showAlert?: (params: any) => void) {
    let processedItems = [...items];

    // 1. 순서 정렬
    if (options.order === 'random') {
      processedItems.sort(() => Math.random() - 0.5);
    } else {
      processedItems.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }

    // 2. HTML 생성
    const html = this.getHtmlTemplate(processedItems, options);

    try {
      if (Platform.OS === 'web') {
        // 웹에서는 expo-print 대신 더 확실한 iframe 방식 사용
        console.log('Web printing starting...');
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
        if (iframeDoc) {
          iframeDoc.open();
          iframeDoc.write(html);
          iframeDoc.close();

          // 폰트 크기 조정 스크립트 실행 대기
          setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => {
              document.body.removeChild(iframe);
            }, 1000);
          }, 500);
        }
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        console.log('PDF generated at:', uri);

        if (options.action === 'download' && Platform.OS === 'android') {
          try {
            console.log('[PdfService] Android Download triggered');
            if (!SAF) {
              console.error('[PdfService] SAF Object missing');
              await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
              return;
            }

            // [추가] 광고 직후라면 시스템 창 충돌을 피하기 위해 약간 더 대기
            await new Promise(resolve => setTimeout(resolve, 500));

            console.log('[PdfService] Requesting directory permissions...');
            const permissions = await SAF.requestDirectoryPermissionsAsync();

            if (permissions.granted) {
              console.log('[PdfService] Permission granted for:', permissions.directoryUri);
              const base64 = await FileSystem.readAsStringAsync(uri, { encoding: EncType?.Base64 || 'base64' });
              const fileName = `${options.title.replace(/[\\/:*?"<>|]/g, '_')}_${new Date().getTime()}.pdf`;

              console.log('[PdfService] Creating file:', fileName);
              const fileUri = await SAF.createFileAsync(permissions.directoryUri, fileName, 'application/pdf');
              await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: EncType?.Base64 || 'base64' });

              console.log('[PdfService] File save success:', fileUri);
              if (showAlert) {
                showAlert({
                  title: '저장 완료',
                  message: '선택하신 폴더에 PDF 파일이 저장되었습니다.'
                });
              }
            } else {
              console.warn('[PdfService] Permission denied or cancelled');
              // 사용자가 취소했을 때만 공유창을 띄워줌 (보험용)
              await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            }
          } catch (safError: any) {
            console.error('[PdfService] Critical SAF Error:', safError);
            // 에러 시 최종 수단으로 공유 시트 소환
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
          }
        } else {
          // iOS 또는 '공유하기' 선택 시
          await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        }
      }
    } catch (error) {
      console.error('PDF Generation Error:', error);
      throw error;
    }
  },

  getHtmlTemplate(items: Item[], options: ExportOptions) {
    const rowsPerPage = 50;
    const itemsPerColumn = 25;
    const pages = [];

    for (let i = 0; i < items.length; i += rowsPerPage) {
      pages.push(items.slice(i, i + rowsPerPage));
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          @page {
            margin: 0;
            size: A4;
          }
          body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            color: #333;
            background-color: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .page {
            page-break-after: always;
            width: 210mm;
            height: 297mm;
            padding: 15mm;
            position: relative;
            box-sizing: border-box;
            background-color: white;
          }
          .header {
            position: absolute;
            top: 18mm; /* Moved down for vertical symmetry */
            left: 15mm;
            font-size: 14px;
            font-weight: bold;
            border-bottom: 2px solid #000;
            padding-bottom: 3px;
            width: 60mm;
          }
          .columns-container {
            display: flex;
            justify-content: space-between;
            height: 255mm; 
            margin-top: 20mm; /* Moved down for vertical symmetry */
          }
          .column {
            width: 48.5%;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          td {
            border: 1px solid #000;
            height: 9.1mm; 
            padding: 0 5px;
            vertical-align: middle;
            text-align: center;
            overflow: hidden;
            word-break: break-all;
          }
          .num-col {
            width: 10mm;
            background-color: #f0f0f0 !important;
            font-size: 11px;
            font-weight: bold;
          }
          .content-col {
            font-size: 14px;
            background-color: white !important;
          }
          .content-text {
            display: block;
            max-height: 8.5mm;
            line-height: 1.1;
          }
        </style>
      </head>
      <body>
        ${pages.map((pageItems, pageIdx) => {
      const leftCol = pageItems.slice(0, itemsPerColumn);
      const rightCol = pageItems.slice(itemsPerColumn, itemsPerColumn * 2);

      return `
            <div class="page">
              <div class="header">DATE . .</div>
              <div class="columns-container">
                <div class="column">
                  <table>
                    ${this.renderRows(leftCol, pageIdx * rowsPerPage + 1, options)}
                  </table>
                </div>
                <div class="column">
                  <table>
                    ${this.renderRows(rightCol, pageIdx * rowsPerPage + itemsPerColumn + 1, options)}
                  </table>
                </div>
              </div>
            </div>
          `;
    }).join('')}

        <script>
          function adjustFontSize() {
            const elements = document.querySelectorAll('.content-text');
            elements.forEach(el => {
              let size = 14;
              el.style.fontSize = size + 'px';
              while (el.scrollHeight > 35 && size > 7) {
                size -= 0.5;
                el.style.fontSize = size + 'px';
              }
            });
          }
          window.onload = function() {
            adjustFontSize();
          };
        </script>
      </body>
      </html>
    `;
  },

  renderRows(items: Item[], startNum: number, options: ExportOptions) {
    const rows = [];
    for (let i = 0; i < 25; i++) {
      const item = items[i];
      const num = startNum + i;

      let questionContent = '';
      let answerContent = '';

      if (item) {
        if (options.mode === 'both') {
          questionContent = item.question;
          answerContent = item.answer;
        } else if (options.mode === 'word_only') {
          questionContent = item.question;
          answerContent = '';
        } else if (options.mode === 'meaning_only') {
          questionContent = item.answer;
          answerContent = '';
        }
      }

      rows.push(`
        <tr>
          <td class="num-col">${num}</td>
          <td class="content-col"><span class="content-text">${questionContent}</span></td>
          <td class="content-col"><span class="content-text">${answerContent}</span></td>
        </tr>
      `);
    }
    return rows.join('');
  }
};
