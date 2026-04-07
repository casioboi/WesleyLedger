import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

export async function exportReportToPdf(element: HTMLElement, filename: string) {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  })

  const imgData = canvas.toDataURL('image/png', 1.0)
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 10
  const usableWidth = pageWidth - 2 * margin
  const usableHeight = pageHeight - 2 * margin
  const imgWidth = usableWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let heightLeft = imgHeight
  let y = margin

  pdf.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight)
  heightLeft -= usableHeight

  while (heightLeft > 0) {
    y = margin - (imgHeight - heightLeft)
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight)
    heightLeft -= usableHeight
  }

  pdf.save(filename)
}
