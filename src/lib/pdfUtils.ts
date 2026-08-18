/* 
 * Demo acknowledgement — generated entirely client-side, not a legally binding or cryptographically verified government document.
 */
export const generateGrievancePdf = async (element: HTMLElement, grievanceId: string): Promise<void> => {
  try {
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    // Clone element to ensure it's in the DOM and renderable by html2canvas
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.position = 'absolute';
    clone.style.top = '0';
    clone.style.left = '-9999px';
    clone.style.zIndex = '-9999';
    document.body.appendChild(clone);

    // Give browser a moment to layout the clone
    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: 800
    });

    document.body.removeChild(clone);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Grievance-Acknowledgement-${grievanceId}.pdf`);
  } catch (error) {
    console.error("PDF generation failed:", error);
    throw error;
  }
};
