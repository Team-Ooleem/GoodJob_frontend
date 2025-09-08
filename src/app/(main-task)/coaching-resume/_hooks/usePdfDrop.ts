'use client';

import { useEffect } from 'react';
import * as fabric from 'fabric';
import { useCanvasStore } from '../_stores';

export function usePdfDrop(canvasRef: React.RefObject<HTMLCanvasElement>) {
    const canvas = useCanvasStore((store) => store.canvasInstance);

    useEffect(() => {
        if (!canvas || !canvasRef.current) return;

        const el = canvasRef.current.parentElement;
        if (!el) return;

        const handleDrop = async (e: DragEvent) => {
            e.preventDefault();
            console.log('🎯 드롭 이벤트 감지됨');

            if (!e.dataTransfer) return;

            const file = e.dataTransfer.files[0];
            if (!file || file.type !== 'application/pdf') {
                console.log('❌ PDF 파일이 아님:', file?.type);
                return;
            }

            console.log('📄 PDF 파일 감지:', file.name);

            try {
                const arrayBuffer = await file.arrayBuffer();
                console.log('📊 ArrayBuffer 생성 완료:', arrayBuffer.byteLength, 'bytes');

                // pdf.js + worker 설정
                const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');
                pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                console.log('📖 PDF 로드 완료:', pdf.numPages, '페이지');

                // 각 페이지를 순차적으로 처리 (Promise.all 대신 for문 사용)
                for (let i = 1; i <= pdf.numPages; i++) {
                    console.log(`🔄 페이지 ${i} 처리 중...`);

                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 1.5 });

                    console.log(`📐 페이지 ${i} 크기:`, viewport.width, 'x', viewport.height);

                    const canvasEl = document.createElement('canvas');
                    const context = canvasEl.getContext('2d')!;
                    canvasEl.width = viewport.width;
                    canvasEl.height = viewport.height;

                    // PDF 페이지를 캔버스에 렌더링
                    await page.render({
                        canvasContext: context,
                        viewport,
                    }).promise;

                    console.log(`✅ 페이지 ${i} 렌더링 완료`);

                    // 캔버스를 이미지 데이터로 변환
                    const dataUrl = canvasEl.toDataURL('image/png', 0.8);
                    console.log(
                        `🖼️ 페이지 ${i} 이미지 데이터 생성:`,
                        dataUrl.substring(0, 50) + '...',
                    );

                    // Fabric v6: FabricImage 사용 + await 버전
                    try {
                        const img = await fabric.FabricImage.fromURL(dataUrl);
                        console.log(`🎨 페이지 ${i} Fabric 이미지 생성 완료:`, img);

                        if (!img) {
                            console.error(`❌ 페이지 ${i} Fabric 이미지 생성 실패`);
                            continue;
                        }

                        // 2열 그리드 레이아웃
                        const pagesPerRow = 2;
                        const pageWidth = 800;
                        const spacing = 30;
                        const startX = 100;
                        const startY = 100;

                        const row = Math.floor((i - 1) / pagesPerRow);
                        const col = (i - 1) % pagesPerRow;

                        const x = startX + col * (pageWidth + spacing);
                        const y = startY + row * (img.height * (pageWidth / img.width) + spacing);

                        // 이미지 설정
                        img.set({
                            left: x,
                            top: y,
                            scaleX: pageWidth / img.width,
                            scaleY: pageWidth / img.width,
                            selectable: true,
                            hasControls: true,
                            hasBorders: true,
                        });

                        // 메타데이터 추가
                        (img as any).pageNumber = i;
                        (img as any).isPdfPage = true;

                        // 캔버스에 추가
                        canvas.add(img);
                        canvas.renderAll();

                        console.log(`✅ 페이지 ${i} 캔버스에 추가 완료`);
                    } catch (imgError) {
                        console.error(`❌ 페이지 ${i} Fabric 이미지 생성 오류:`, imgError);
                    }
                }

                console.log('🎉 모든 페이지 처리 완료!');
            } catch (error) {
                console.error('❌ PDF 처리 중 오류:', error);
                alert('PDF 처리 중 오류가 발생했습니다: ' + error.message);
            } finally {
                el.style.opacity = '1';
                el.style.backgroundColor = 'transparent';
            }
        };

        const handleDragOver = (e: DragEvent) => {
            e.preventDefault();

            // 드래그 중인 파일이 PDF인지 확인
            const items = e.dataTransfer?.items;
            if (items) {
                for (let i = 0; i < items.length; i++) {
                    if (items[i].type === 'application/pdf') {
                        // 시각적 피드백
                        el.style.opacity = '0.8';
                        el.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
                        break;
                    }
                }
            }
        };

        const handleDragLeave = (e: DragEvent) => {
            e.preventDefault();

            // 실제로 요소를 벗어났는지 확인 (자식 요소로 이동하는 경우 제외)
            const rect = el.getBoundingClientRect();
            const x = e.clientX;
            const y = e.clientY;

            el.style.opacity = '1';
            el.style.backgroundColor = 'transparent';
        };

        // 이벤트 리스너 등록
        el.addEventListener('drop', handleDrop);
        el.addEventListener('dragover', handleDragOver);
        el.addEventListener('dragleave', handleDragLeave);

        return () => {
            el.removeEventListener('drop', handleDrop);
            el.removeEventListener('dragover', handleDragOver);
            el.removeEventListener('dragleave', handleDragLeave);
        };
    }, [canvas, canvasRef]);
}
