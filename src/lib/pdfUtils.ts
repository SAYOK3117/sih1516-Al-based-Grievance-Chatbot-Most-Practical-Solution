/* 
 * Demo acknowledgement — generated entirely client-side, not a legally binding or cryptographically verified government document.
 */
export const generateGrievancePdf = async (element: HTMLElement, grievanceId: string): Promise<void> => {
  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    width: 800
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(`Grievance-Acknowledgement-${grievanceId}.pdf`);
};
