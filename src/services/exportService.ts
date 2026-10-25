import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { ElectionResultsSummary } from '../types/election';

export class ExportService {
  private formatDate(isoString?: string | null): string {
    if (!isoString) return '-';
    try {
      return new Date(isoString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  }

  /**
   * Generates a formal A4 PDF report of the election results.
   */
  exportToPdf(results: ElectionResultsSummary): { success: boolean; error?: string } {
    try {
      if (!results || results.candidateResults.length === 0) {
        return { success: false, error: 'Tidak ada data hasil pemilihan untuk diekspor.' };
      }

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();

      // Top Institutional Accent Bar
      doc.setFillColor(16, 29, 53); // Navy Primary
      doc.rect(0, 0, pageWidth, 8, 'F');
      doc.setFillColor(201, 164, 92); // Gold Accent
      doc.rect(0, 8, pageWidth, 2, 'F');

      // Title & Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(16, 29, 53);
      doc.text(results.electionTitle || 'PEMILIHAN RESMI ELEKTRONIK', pageWidth / 2, 22, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(201, 164, 92);
      doc.text('BERITA ACARA & LAPORAN HASIL AKHIR PEMILIHAN', pageWidth / 2, 29, { align: 'center' });

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(14, 33, pageWidth - 14, 33);

      // Election Summary Metadata Box
      doc.setFillColor(243, 245, 249);
      doc.roundedRect(14, 37, pageWidth - 28, 30, 3, 3, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);

      doc.text('Status Pemilihan', 18, 44);
      doc.text('Waktu Mulai Voting', 18, 51);
      doc.text('Waktu Ditutup', 18, 58);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 29, 53);
      doc.text(': SELESAI / RESMI DITUTUP', 55, 44);
      doc.text(`: ${this.formatDate(results.startedAt)}`, 55, 51);
      doc.text(`: ${this.formatDate(results.closedAt)}`, 55, 58);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('Total Suara Sah Masuk', 115, 44);
      doc.text('Jumlah Kandidat', 115, 51);
      doc.text('Tingkat Partisipasi', 115, 58);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 29, 53);
      doc.text(`: ${results.totalVotes} Suara`, 155, 44);
      doc.text(`: ${results.candidateResults.length} Orang`, 155, 51);
      doc.text(': 100% Suara Terverifikasi', 155, 58);

      // Section: Results Table
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 29, 53);
      doc.text('TABULASI PEROLEHAN SUARA KANDIDAT', 14, 75);

      const tableData = results.candidateResults.map((item, index) => [
        (index + 1).toString(),
        `No. 0${item.candidate.candidate_number}`,
        item.candidate.name + (item.candidate.title_or_role ? `\n(${item.candidate.title_or_role})` : ''),
        `${item.voteCount} Suara`,
        `${item.percentage.toFixed(2)}%`,
        item.isWinner ? 'Pemenang' : item.isTied ? 'Imbang (Tie)' : '-',
      ]);

      autoTable(doc, {
        startY: 79,
        head: [['Peringkat', 'No. Urut', 'Nama Lengkap Kandidat', 'Perolehan Suara', 'Persentase', 'Keterangan']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [16, 29, 53],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'center',
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [30, 41, 59],
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 16 },
          1: { halign: 'center', cellWidth: 20 },
          2: { cellWidth: 66 },
          3: { halign: 'center', cellWidth: 26 },
          4: { halign: 'center', cellWidth: 24 },
          5: { halign: 'center', cellWidth: 30 },
        },
        margin: { left: 14, right: 14 },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finalY = (doc as any).lastAutoTable?.finalY || 140;

      // Section: Conclusion Box
      doc.setFillColor(253, 251, 247);
      doc.setDrawColor(201, 164, 92);
      doc.roundedRect(14, finalY + 8, pageWidth - 28, 28, 3, 3, 'FD');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 29, 53);
      doc.text('KESIMPULAN PENETAPAN HASIL PEMILIHAN:', 18, finalY + 16);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      if (results.isZeroVotes) {
        doc.text('Tidak ada suara masuk dalam pemilihan ini. Pemenang tidak dapat ditetapkan.', 18, finalY + 24);
      } else if (results.isTie) {
        const leaderNames = results.winners.map((w) => w.name).join(' dan ');
        doc.text(`HASIL SERI / IMBANG: Perolehan suara tertinggi terbagi rata antara: ${leaderNames}.`, 18, finalY + 23);
        doc.text('Penetapan tindak lanjut diserahkan kepada sidang musyawarah resmi panitia.', 18, finalY + 29);
      } else {
        const winner = results.winners[0];
        const winnerResult = results.candidateResults.find((r) => r.candidate.id === winner?.id);
        doc.text(
          `Berdasarkan suara terbanyak yang sah, ${winner?.name} ditetapkan sebagai PEMENANG TERPILIH`,
          18,
          finalY + 23
        );
        doc.text(
          `dengan perolehan ${winnerResult?.voteCount} suara (${winnerResult?.percentage.toFixed(2)}% dari total suara sah).`,
          18,
          finalY + 29
        );
      }

      // Footer
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setDrawColor(226, 232, 240);
      doc.line(14, pageHeight - 16, pageWidth - 14, pageHeight - 16);

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Dokumen resmi dihasilkan oleh Sistem E-Voting Kiosk pada ${new Date().toLocaleString('id-ID')}`,
        14,
        pageHeight - 10
      );
      doc.text('Halaman 1 dari 1', pageWidth - 14, pageHeight - 10, { align: 'right' });

      // Trigger Download in browser, or output buffer in test runner
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        doc.save(`Laporan_Hasil_Pemilihan_${Date.now()}.pdf`);
      } else {
        doc.output('arraybuffer');
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Gagal menghasilkan berkas PDF.' };
    }
  }

  /**
   * Generates a structured Excel (.xlsx) spreadsheet of the election results.
   */
  exportToExcel(results: ElectionResultsSummary): { success: boolean; error?: string } {
    try {
      if (!results || results.candidateResults.length === 0) {
        return { success: false, error: 'Tidak ada data hasil pemilihan untuk diekspor.' };
      }

      // Metadata Rows
      const metadata = [
        ['E-VOTING KIOSK — REKAPITULASI RESMI HASIL PEMILIHAN'],
        ['Nama Pemilihan', results.electionTitle || 'Pemilihan Resmi'],
        ['Status Pemilihan', 'SELESAI (CLOSED)'],
        ['Waktu Mulai', this.formatDate(results.startedAt)],
        ['Waktu Ditutup', this.formatDate(results.closedAt)],
        ['Total Suara Sah Masuk', results.totalVotes],
        ['Jumlah Kandidat', results.candidateResults.length],
        [], // Empty separator
        ['No.', 'Nomor Urut', 'Nama Kandidat', 'Jabatan / Keterangan', 'Jumlah Suara', 'Persentase (%)', 'Status'],
      ];

      // Candidate Result Rows
      const rows = results.candidateResults.map((item, index) => [
        index + 1,
        item.candidate.candidate_number,
        item.candidate.name,
        item.candidate.title_or_role || '-',
        item.voteCount, // stored as true number
        item.percentage, // stored as true number
        item.isWinner ? 'Pemenang Terpilih' : item.isTied ? 'Hasil Seri (Tie)' : 'Tidak Terpilih',
      ]);

      // Conclusion Row
      let conclusion = '';
      if (results.isZeroVotes) {
        conclusion = 'Tidak ada suara sah masuk.';
      } else if (results.isTie) {
        conclusion = `Hasil Seri antara: ${results.winners.map((w) => w.name).join(', ')}`;
      } else {
        conclusion = `Pemenang Terpilih: ${results.winners[0]?.name}`;
      }

      const summaryRows = [
        [],
        ['TOTAL SUARA SAH', '', '', '', results.totalVotes, 100.0, ''],
        ['KESIMPULAN AKHIR', conclusion],
        [],
        ['Waktu Ekspor Dokumen', new Date().toLocaleString('id-ID')],
      ];

      const worksheetData = [...metadata, ...rows, ...summaryRows];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Auto-fit column widths
      worksheet['!cols'] = [
        { wch: 6 },
        { wch: 12 },
        { wch: 42 },
        { wch: 28 },
        { wch: 16 },
        { wch: 16 },
        { wch: 20 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Hasil Voting');

      // Trigger Download in browser or generate buffer in test runner
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        XLSX.writeFile(workbook, `Rekapitulasi_Hasil_Pemilihan_${Date.now()}.xlsx`);
      } else {
        XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Gagal menghasilkan berkas Excel.' };
    }
  }

  /**
   * Generates a PDF report for a specific Announcement Session
   */
  exportSessionToPdf(
    session: { name: string; selection_method: string; candidate_limit: number },
    candidates: Array<{ candidate: { candidate_number: number; name: string; title_or_role?: string }; voteCount: number; percentage: number; rank: number }>,
    electionTitle = 'PEMILIHAN JENDRAL 5102'
  ): { success: boolean; error?: string } {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();

      // Top Institutional Accent Bar
      doc.setFillColor(28, 28, 30); // Primary Dark Grey
      doc.rect(0, 0, pageWidth, 8, 'F');
      doc.setFillColor(212, 175, 55); // Gold Accent
      doc.rect(0, 8, pageWidth, 2, 'F');

      // Title & Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(28, 28, 30);
      doc.text(electionTitle, pageWidth / 2, 22, { align: 'center' });

      doc.setFontSize(12);
      doc.setTextColor(212, 175, 55);
      doc.text(`BERITA ACARA SESI: ${session.name.toUpperCase()}`, pageWidth / 2, 29, { align: 'center' });

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(14, 33, pageWidth - 14, 33);

      const tableData = candidates.map((item) => [
        `Peringkat #${item.rank}`,
        `No. 0${item.candidate.candidate_number}`,
        item.candidate.name + (item.candidate.title_or_role ? `\n(${item.candidate.title_or_role})` : ''),
        `${item.voteCount} Suara`,
        `${item.percentage.toFixed(2)}%`,
      ]);

      autoTable(doc, {
        startY: 42,
        head: [['Peringkat', 'No. Urut', 'Nama Lengkap Kandidat', 'Perolehan Suara', 'Persentase']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [28, 28, 30],
          textColor: [212, 175, 55],
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'center',
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [30, 41, 59],
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 26 },
          1: { halign: 'center', cellWidth: 22 },
          2: { cellWidth: 80 },
          3: { halign: 'center', cellWidth: 26 },
          4: { halign: 'center', cellWidth: 26 },
        },
        margin: { left: 14, right: 14 },
      });

      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        doc.save(`Pengumuman_${session.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Gagal menghasilkan berkas PDF acara.' };
    }
  }

  /**
   * Generates an Excel report for a specific Announcement Session
   */
  exportSessionToExcel(
    session: { name: string; selection_method: string },
    candidates: Array<{ candidate: { candidate_number: number; name: string; title_or_role?: string }; voteCount: number; percentage: number; rank: number }>,
    electionTitle = 'PEMILIHAN JENDRAL 5102'
  ): { success: boolean; error?: string } {
    try {
      const rows = candidates.map((item) => [
        item.rank,
        item.candidate.candidate_number,
        item.candidate.name,
        item.candidate.title_or_role || '-',
        item.voteCount,
        `${item.percentage.toFixed(2)}%`,
      ]);

      const worksheetData = [
        [electionTitle],
        [`Sesi Acara: ${session.name}`],
        [`Metode Seleksi: ${session.selection_method}`],
        [],
        ['Peringkat', 'No. Urut', 'Nama Lengkap Kandidat', 'Daerah/Konsulat', 'Perolehan Suara', 'Persentase'],
        ...rows,
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Pengumuman');

      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        XLSX.writeFile(workbook, `Pengumuman_${session.name.replace(/\s+/g, '_')}_${Date.now()}.xlsx`);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Gagal menghasilkan berkas Excel acara.' };
    }
  }
}

export const exportService = new ExportService();
