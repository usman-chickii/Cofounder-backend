import { mdToPdf } from "md-to-pdf";

export async function generatePdf(
  markdown: string,
  title = "document.pdf"
): Promise<Buffer> {
  // 1. Convert markdown → PDF

  const pdf = await mdToPdf(
    { content: markdown },
    {
      dest: undefined, // don't write to file
      pdf_options: {
        format: "a4",
        printBackground: true,
      },
    }
  );

  if (!pdf?.content) {
    throw new Error("PDF generation failed");
  }

  return pdf.content; // Buffer
}
