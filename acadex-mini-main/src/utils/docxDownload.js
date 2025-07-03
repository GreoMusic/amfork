import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";

export const downloadDocx = async (responseArray, filename) => {
  // Create dynamic paragraphs based on the response array
  if (typeof responseArray != "object") {
  }
  const paragraphs = responseArray.map((content) => {
    if (content == "\n")
      return new Paragraph({
        children: [new TextRun("\n")],
      });
    else
      return new Paragraph({
        children: [
          new TextRun({
            text: content, // Each item in the array becomes a paragraph
          }),
        ],
      });
  });

  const doc = new Document({
    sections: [
      {
        children: paragraphs, // Inject dynamic paragraphs into the document
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${filename} - feedback.docx`);
};
