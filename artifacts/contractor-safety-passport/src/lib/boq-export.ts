import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SafetyBoqItem } from './boq-store';

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(val);
};

export const exportBoqPdf = (items: SafetyBoqItem[], projectName: string) => {
  const doc = new jsPDF('landscape');
  
  doc.setFontSize(16);
  doc.text('Bill of Quantities (BOQ) SMKK', 14, 20);
  
  doc.setFontSize(12);
  doc.text(`Proyek: ${projectName || 'Semua Proyek / Umum'}`, 14, 28);
  
  const tableData = items.map((item, index) => [
    index + 1,
    item.description,
    item.category,
    item.volume,
    item.unit,
    formatCurrency(item.unitPrice),
    formatCurrency(item.volume * item.unitPrice),
    item.risk,
    item.stage,
    item.controlNeed
  ]);
  
  const totalCost = items.reduce((acc, curr) => acc + (curr.volume * curr.unitPrice), 0);

  autoTable(doc, {
    startY: 35,
    head: [['No', 'Uraian Pekerjaan', 'Kategori', 'Vol', 'Sat', 'Harga Satuan', 'Total Harga', 'Risiko', 'Tahapan', 'Kebutuhan Pengendalian']],
    body: [
      ...tableData,
      [{ content: 'Total Keseluruhan', colSpan: 6, styles: { halign: 'right', fontStyle: 'bold' } }, { content: formatCurrency(totalCost), styles: { fontStyle: 'bold' } }, '', '', '']
    ],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [0, 102, 204] },
    columnStyles: {
      0: { cellWidth: 10 },
      3: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' }
    }
  });

  doc.save(`BOQ_SMKK_${projectName ? projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'Draft'}.pdf`);
};

export const exportBoqCsv = (items: SafetyBoqItem[], projectName: string) => {
  const headers = ['No', 'Uraian Pekerjaan', 'Kategori', 'Volume', 'Satuan', 'Harga Satuan', 'Total Harga', 'Risiko', 'Tahapan', 'Kebutuhan Pengendalian'];
  
  const rows = items.map((item, index) => [
    index + 1,
    `"${item.description.replace(/"/g, '""')}"`,
    `"${item.category}"`,
    item.volume,
    `"${item.unit}"`,
    item.unitPrice,
    item.volume * item.unitPrice,
    `"${item.risk}"`,
    `"${item.stage}"`,
    `"${item.controlNeed.replace(/"/g, '""')}"`
  ]);
  
  const totalCost = items.reduce((acc, curr) => acc + (curr.volume * curr.unitPrice), 0);
  rows.push(['', '"Total Keseluruhan"', '', '', '', '', totalCost, '', '', '']);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `BOQ_SMKK_${projectName ? projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'Draft'}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};