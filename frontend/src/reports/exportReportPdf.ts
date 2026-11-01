import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

const PAGE_WIDTH_IN = 8.27
const PAGE_HEIGHT_IN = 11.69
const CSS_PX_PER_IN = 96

async function renderReportPdf(
  element: HTMLElement,
  orientation: 'portrait' | 'landscape' = 'portrait'
) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])
  const pageWidthIn = orientation === 'landscape' ? PAGE_HEIGHT_IN : PAGE_WIDTH_IN
  const pageHeightIn = orientation === 'landscape' ? PAGE_WIDTH_IN : PAGE_HEIGHT_IN

  const clone = element.cloneNode(true) as HTMLElement
  clone.classList.add('wl-pdf-capture')
  clone.style.width = `${pageWidthIn}in`
  clone.style.maxWidth = `${pageWidthIn}in`
  clone.style.minHeight = `${pageHeightIn}in`
  clone.style.margin = '0'
  clone.style.position = 'fixed'
  clone.style.left = '-10000px'
  clone.style.top = '0'
  clone.style.zIndex = '-1'
  clone.style.background = '#ffffff'
  document.body.appendChild(clone)

  try {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: Math.round(pageWidthIn * CSS_PX_PER_IN),
      windowHeight: Math.round(pageHeightIn * CSS_PX_PER_IN),
    })

    const imgData = canvas.toDataURL('image/png', 1.0)
    const pdf = new jsPDF({ orientation, unit: 'in', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height)
    const imgWidth = canvas.width * ratio
    const imgHeight = canvas.height * ratio
    const x = (pageWidth - imgWidth) / 2
    const y = (pageHeight - imgHeight) / 2

    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight)
    return pdf
  } finally {
    clone.remove()
  }
}

export async function exportReportToPdf(
  element: HTMLElement,
  filename: string,
  orientation: 'portrait' | 'landscape' = 'portrait'
) {
  const pdf = await renderReportPdf(element, orientation)

  if (Capacitor.isNativePlatform()) {
    const dataUri = pdf.output('datauristring')
    const base64 = dataUri.slice(dataUri.indexOf(',') + 1)
    const path = `WesleyLedger/Reports/${filename}`
    const result = await Filesystem.writeFile({
      path,
      data: base64,
      directory: Directory.Documents,
      recursive: true,
    })

    // The PDF is already saved locally; the native sheet lets the user open or share it.
    await Share.share({
      title: filename,
      text: 'WesleyLedger quarterly report',
      url: result.uri,
      dialogTitle: 'Open or share report',
    })
    return
  }

  pdf.save(filename)
}
