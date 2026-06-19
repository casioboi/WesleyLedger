import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const PAGE_WIDTH_IN = 8.27
const PAGE_HEIGHT_IN = 11.69
const CSS_PX_PER_IN = 96

export async function exportReportToPdf(element: HTMLElement, filename: string) {
  const clone = element.cloneNode(true) as HTMLElement
  clone.classList.add('wl-pdf-capture')
  clone.style.width = `${PAGE_WIDTH_IN}in`
  clone.style.maxWidth = `${PAGE_WIDTH_IN}in`
  clone.style.minHeight = `${PAGE_HEIGHT_IN}in`
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
    windowWidth: Math.round(PAGE_WIDTH_IN * CSS_PX_PER_IN),
    windowHeight: Math.round(PAGE_HEIGHT_IN * CSS_PX_PER_IN),
  })
  clone.remove()

  const imgData = canvas.toDataURL('image/png', 1.0)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: 'a4',
  })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height)
  const imgWidth = canvas.width * ratio
  const imgHeight = canvas.height * ratio
  const x = (pageWidth - imgWidth) / 2
  const y = (pageHeight - imgHeight) / 2

  pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight)

  pdf.save(filename)
}
