import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { SSTDocument, SSTDocumentType } from "../types";

// Use intersection type to preserve jsPDF methods while adding autoTable
type jsPDFWithAutoTable = jsPDF & {
  autoTable: (options: any) => void;
  lastAutoTable: { finalY: number };
};

export const generateDocumentPDF = (doc: SSTDocument, companyName: string = "ZELCON INDUSTRIAL") => {
  const pdf = new jsPDF({ orientation: 'portrait' }) as jsPDFWithAutoTable;
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  
  // --- HEADER ---
  pdf.setFillColor(15, 23, 42); // Slate 900 (Zelcon Color)
  pdf.rect(0, 0, pageWidth, 20, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text("ZELCON", 14, 13);
  
  pdf.setFontSize(10);
  pdf.text("Sistema de Gestión Integral", pageWidth - 14, 13, { align: 'right' });

  // --- INFO BLOCK ---
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(14);
  pdf.text(doc.type, 14, 30);
  
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Empresa: ${companyName}`, 14, 38);
  pdf.text(`Título: ${doc.title}`, 14, 44);
  pdf.text(`Fecha: ${doc.createdAt}`, 14, 50);
  pdf.text(`Elaborado por: ${doc.createdBy}`, 14, 56);
  pdf.text(`Estado: ${doc.status}`, 14, 62);
  pdf.text(`ID Documento: ${doc.id}`, pageWidth - 14, 38, { align: 'right' });

  let finalY = 70;

  // --- CONTENT BY TYPE ---

  if (doc.type === SSTDocumentType.IPERC && doc.data && doc.data.matrix) {
     const data = doc.data;
     
     // 1. Cabecera Específica IPERC
     pdf.setFontSize(9);
     pdf.text(`Tarea: ${data.metadata.task}`, 14, finalY);
     finalY += 6;
     pdf.text(`Área: ${data.metadata.area}  |  Hora: ${data.metadata.time}`, 14, finalY);
     finalY += 10;

     // 2. Trabajadores
     const workerData = data.workers.map((w: any) => [w.name, 'Firma Digital Verificada']);
     pdf.autoTable({
         startY: finalY,
         head: [['Trabajador', 'Firma']],
         body: workerData,
         theme: 'plain',
         styles: { fontSize: 8, cellPadding: 1 },
         headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' }
     });
     finalY = pdf.lastAutoTable.finalY + 5;

     // 3. Matriz IPERC Principal
     const matrixBody = data.matrix.map((row: any) => [
         row.danger,
         row.risk,
         `${row.evaluation.val} (${row.evaluation.label})`,
         row.control,
         `${row.residual.val} (${row.residual.label})`
     ]);

     pdf.autoTable({
      startY: finalY,
      head: [['Peligro', 'Riesgo', 'Eval IPERC', 'Medida de Control', 'Riesgo Residual']],
      body: matrixBody,
      theme: 'grid',
      headStyles: { fillColor: [192, 57, 43], fontSize: 8 }, // Red for IPERC
      styles: { fontSize: 8 },
      columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 35 },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 50 },
          4: { cellWidth: 20, halign: 'center' }
      },
      didParseCell: (data: any) => {
          // Color coding for evaluation cells
          if (data.section === 'body' && (data.column.index === 2 || data.column.index === 4)) {
             const valStr = data.cell.raw;
             if (valStr.includes('ALTO')) {
                 data.cell.styles.fillColor = [231, 76, 60]; // Red
                 data.cell.styles.textColor = [255, 255, 255];
             } else if (valStr.includes('MEDIO')) {
                 data.cell.styles.fillColor = [241, 196, 15]; // Yellow
                 data.cell.styles.textColor = [0, 0, 0];
             } else if (valStr.includes('BAJO')) {
                 data.cell.styles.fillColor = [46, 204, 113]; // Green
                 data.cell.styles.textColor = [255, 255, 255];
             }
          }
      }
    });
    finalY = pdf.lastAutoTable.finalY + 10;
    
    // 4. Supervisor & Evidence
    if (data.supervisor) {
        // Check if we need a page break
        if(finalY > pageHeight - 50) {
            pdf.addPage();
            finalY = 20;
        }

        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.text("DATOS DEL SUPERVISOR:", 14, finalY);
        finalY += 5;
        pdf.setFont("helvetica", "normal");
        pdf.text(`Nombre: ${data.supervisor.name || '---'}`, 14, finalY);
        pdf.text(`Hora Revisión: ${data.supervisor.time || '---'}`, 80, finalY);
        finalY += 6;
        pdf.text(`Medida Correctiva: ${data.supervisor.measure || 'Ninguna'}`, 14, finalY);
        finalY += 10;
    }

    // 5. Risk Legend Table (At the end, like the image)
    if(finalY > pageHeight - 60) {
        pdf.addPage();
        finalY = 20;
    }

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("INFORMACIÓN IMPORTANTE - NIVEL DE RIESGO", 14, finalY);
    finalY += 4;

    pdf.autoTable({
        startY: finalY,
        head: [['NIVEL DE RIESGO', 'DESCRIPCIÓN', 'PLAZO CORRECCIÓN']],
        body: [
            ['ALTO', 'Riesgo intolerable, requiere controles inmediatos. Si no se puede controlar el PELIGRO se paralizan los trabajos operacionales en la labor.', '0-24 HORAS'],
            ['MEDIO', 'Iniciar medidas para eliminar/reducir el riesgo. Evaluar si la acción se puede ejecutar de manera inmediata', '0-72 HORAS'],
            ['BAJO', 'Este riesgo puede ser tolerable.', '1 MES']
        ],
        theme: 'grid',
        headStyles: { fillColor: [50, 50, 50], textColor: 255, fontSize: 8, halign: 'center' },
        styles: { fontSize: 8 },
        columnStyles: {
            0: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
            2: { cellWidth: 30, halign: 'center' }
        },
        didParseCell: (data: any) => {
            if (data.section === 'body' && data.column.index === 0) {
                if (data.cell.raw === 'ALTO') {
                    data.cell.styles.fillColor = [231, 76, 60];
                    data.cell.styles.textColor = [255, 255, 255];
                } else if (data.cell.raw === 'MEDIO') {
                    data.cell.styles.fillColor = [241, 196, 15];
                } else if (data.cell.raw === 'BAJO') {
                    data.cell.styles.fillColor = [46, 204, 113];
                    data.cell.styles.textColor = [255, 255, 255];
                }
            }
        }
    });
    finalY = pdf.lastAutoTable.finalY + 10;

    // 6. Evidence Photo
    if(data.evidence) {
        if(finalY > pageHeight - 80) {
            pdf.addPage();
            finalY = 20;
        }
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.text("EVIDENCIA FOTOGRÁFICA:", 14, finalY);
        finalY += 5;
        try {
            pdf.addImage(data.evidence, 'JPEG', 14, finalY, 80, 60);
        } catch(e) {
            console.error("Error adding image to PDF", e);
        }
    }
  } 
  else if (doc.type === SSTDocumentType.ATS && Array.isArray(doc.data)) {
    // ATS TABLE (Legacy structure support)
    pdf.autoTable({
      startY: finalY,
      head: [['Paso', 'Pasos de la Tarea', 'Peligros', 'Medidas de Control']],
      body: doc.data.map((row: any, i: number) => [
        i + 1,
        row.step || '',
        row.hazard || '',
        row.control || ''
      ]),
      theme: 'grid',
      headStyles: { fillColor: [230, 126, 34] }, // Orange for ATS
    });
    finalY = pdf.lastAutoTable.finalY + 10;
  }
  else if (doc.type === SSTDocumentType.CHECKLIST && typeof doc.data === 'object') {
    // CHECKLIST TABLE
    const items = Object.entries(doc.data);
    pdf.autoTable({
      startY: finalY,
      head: [['Item de Inspección', 'Estado']],
      body: items.map(([key, value]) => [
        key,
        value ? 'CONFORME' : 'NO CONFORME'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [39, 174, 96] }, // Green for Checklist
    });
    finalY = pdf.lastAutoTable.finalY + 10;
  }
  else if (doc.type === SSTDocumentType.PETAR) {
      // Simple text for PETAR
      pdf.setFontSize(10);
      pdf.text("Este permiso certifica que se han verificado las condiciones de seguridad.", 14, finalY);
      finalY += 10;
  }

  // --- APPROVAL SECTION ---
  if (doc.status === 'Approved') {
      pdf.setDrawColor(39, 174, 96); // Green border
      pdf.setLineWidth(0.5);
      pdf.rect(14, finalY, pageWidth - 28, 25);
      
      pdf.setTextColor(39, 174, 96);
      pdf.setFont("helvetica", "bold");
      pdf.text("DOCUMENTO APROBADO DIGITALMENTE", 20, finalY + 8);
      
      pdf.setTextColor(0,0,0);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text(`Aprobado por: ${doc.approvedBy || 'Supervisor SST'}`, 20, finalY + 16);
      if(doc.approvalComment) {
        pdf.text(`Notas: ${doc.approvalComment}`, 20, finalY + 22);
      }
  }

  // --- SIGNATURES AREA (Placeholder for printing) ---
  const signatureY = pageHeight - 30;
  if(finalY < signatureY) {
    pdf.setDrawColor(0, 0, 0);
    pdf.line(20, signatureY, 80, signatureY); // Line 1
    pdf.line(110, signatureY, 170, signatureY); // Line 2
    
    pdf.setFontSize(8);
    pdf.text("Firma del Trabajador", 50, signatureY + 5, { align: 'center' });
    pdf.text("Firma del Supervisor", 140, signatureY + 5, { align: 'center' });
  }

  // Save
  pdf.save(`ZELCON_${doc.type}_${doc.title.replace(/\s+/g, '_')}.pdf`);
};
