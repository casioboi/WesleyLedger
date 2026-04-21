import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

export async function exportReportToPdf(element: HTMLElement, filename: string) {
  const clone = element.cloneNode(true) as HTMLElement
  clone.classList.add('wl-pdf-capture')
  clone.style.width = '794px'
  clone.style.maxWidth = '794px'
  clone.style.margin = '0'
  clone.style.position = 'fixed'
  clone.style.left = '-10000px'
  clone.style.top = '0'
  clone.style.zIndex = '-1'
  clone.style.background = '#ffffff'
  document.body.appendChild(clone)

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve())
  })

  const canvas = await html2canvas(clone, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 794,
    windowHeight: 1123,
  })
  clone.remove()

  const imgData = canvas.toDataURL('image/png', 1.0)
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 10
  const usableWidth = pageWidth - 2 * margin
  const usableHeight = pageHeight - 2 * margin
  const ratio = Math.min(usableWidth / canvas.width, usableHeight / canvas.height)
  const imgWidth = canvas.width * ratio
  const imgHeight = canvas.height * ratio
  const x = (pageWidth - imgWidth) / 2
  const y = (pageHeight - imgHeight) / 2

  pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight)

  pdf.save(filename)
}
