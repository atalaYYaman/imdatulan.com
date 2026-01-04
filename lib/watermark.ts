import { PDFDocument, rgb, degrees } from 'pdf-lib'

export async function addWatermark(fileBuffer: Buffer): Promise<Buffer> {
    const pdfDoc = await PDFDocument.load(fileBuffer)
    const pages = pdfDoc.getPages()

    pages.forEach(page => {
        const { width, height } = page.getSize()
        page.drawText('NOD', {
            x: width / 2 - 100, // Approximate centering
            y: height / 2,
            size: 150,
            color: rgb(0.8, 0.2, 0.2), // Reddish for visibility
            opacity: 0.2,
            rotate: degrees(45),
        })
    })

    const savedBytes = await pdfDoc.save()
    return Buffer.from(savedBytes)
}
