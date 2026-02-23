"use client";

/**
 * PrintGajiReport Component
 * Generates a printable salary report matching the provided design
 */

// Format nama bulan Indonesia
const formatBulanIndo = (bulan) => {
    const bulanNama = [
        "",
        "JANUARI",
        "FEBRUARI",
        "MARET",
        "APRIL",
        "MEI",
        "JUNI",
        "JULI",
        "AGUSTUS",
        "SEPTEMBER",
        "OKTOBER",
        "NOVEMBER",
        "DESEMBER",
    ];
    return bulanNama[bulan] || "";
};

// Format currency without symbol for table
const formatNumber = (value) => {
    return new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: 0
    }).format(value);
};


/**
 * Generate PDF report using autoTable for proper page breaks
 * @param {number} bulan - Month number (1-12)
 * @param {number} tahun - Year
 * @param {string} jenis - Type: 'Gaji' or 'Jasa'
 * @param {string} departemen - Department ID (optional)
 */
export const printGajiReport = async (bulan, tahun, jenis = "Gaji", departemen = null) => {
    try {
        // Import libraries
        const { jsPDF } = await import("jspdf");
        const { default: autoTable } = await import("jspdf-autotable");

        // Fetch data from API
        const params = new URLSearchParams({
            bulan: bulan.toString(),
            tahun: tahun.toString(),
            jenis
        });
        if (departemen) {
            params.append("departemen", departemen);
        }

        const response = await fetch(`/api/gaji-pegawai/print?${params}`);
        const result = await response.json();

        if (result.status !== "success") {
            throw new Error(result.message || "Gagal mengambil data");
        }

        if (result.data.length === 0) {
            throw new Error("Tidak ada data gaji untuk periode ini");
        }

        const settings = result.settings || {
            karumkit_nama: "drg. WAHYU ARI PRANANTO, M.A.R.S.",
            karumkit_pangkat: "AJUN KOMISARIS BESAR POLISI",
            karumkit_nip: "NRP 76030927",
            bendahara_nama: "SUNARTI, S. Kep., Ns",
            bendahara_pangkat: "PENDA",
            bendahara_nip: "NIP 197801202014122001",
            bpjs_kesehatan_nominal: 10000, 
            bpjs_ketenagakerjaan_nominal: 20000 
        };

        const periodeBulan = formatBulanIndo(result.summary.periode.bulan);
        const periodeTahun = result.summary.periode.tahun;
        const jenisLabel = result.summary.jenis === "Gaji" ? "GAJI TENAGA KONTRAK" : "JASA TENAGA KONTRAK";

        // Create PDF (landscape A4: 297mm x 210mm)
        const pdf = new jsPDF({
            orientation: "l",
            unit: "mm",
            format: "a4",
            compress: true
        });

        // Set font
        pdf.setFont("helvetica", "normal");

        // Helper for text alignment and styling
        const addPageHeader = (pdf) => {
            pdf.setFontSize(11);
            pdf.setFont("arial", "bold");
            pdf.text("POLRI DAERAH JAWA TIMUR", pdf.internal.pageSize.width / 4, 15, { align: "center" });
            pdf.text("BIDANG KEDOKTERAN DAN KESEHATAN", pdf.internal.pageSize.width / 4, 20, { align: "center" });
            pdf.text("RUMAH SAKIT BHAYANGKARA TK. III NGANJUK", pdf.internal.pageSize.width / 4, 25, { align: "center" });
            const textWidth = pdf.getTextWidth("RUMAH SAKIT BHAYANGKARA TK. III NGANJUK");
            pdf.setLineWidth(0.2);
            pdf.line(pdf.internal.pageSize.width / 4 - textWidth / 2, 26, pdf.internal.pageSize.width / 4 + textWidth / 2, 26);

            pdf.setFontSize(12);
            pdf.text(jenisLabel, pdf.internal.pageSize.width / 2, 40, { align: "center" });
            pdf.text(`BULAN ${periodeBulan} ${periodeTahun}`, pdf.internal.pageSize.width / 2, 46, { align: "center" });
            pdf.text("RUMAH SAKIT BHAYANGKARA TK. III NGANJUK", pdf.internal.pageSize.width / 2, 52, { align: "center" });
        };

        // Prepare table data
        const columns = [
            { header: "NO.", dataKey: "no" },
            { header: "NAMA", dataKey: "nama" },
            { header: "PANGKAT", dataKey: "pangkat" },
            { header: "NIP", dataKey: "nip" },
            { header: "JABATAN", dataKey: "jabatan" },
            { header: "JUMLAH", dataKey: "jumlah" },
            { header: "BPJS\nKESEHATAN", dataKey: "bpjs_kes" },
            { header: "BPJS\nTENAGA KERJA", dataKey: "bpjs_tk" },
            { header: "JUMLAH\nDITERIMA", dataKey: "total" }
        ];

        const rows = result.data.map((item, index) => {
            const isGaji = item.jenis && item.jenis.toString().trim().toUpperCase() === "GAJI";
            const bpjsKesehatan = isGaji ? parseFloat(settings.bpjs_kesehatan_nominal || 0) : 0;
            const bpjsTK = isGaji ? parseFloat(settings.bpjs_ketenagakerjaan_nominal || 0) : 0;
            const jumlahDiterima = parseFloat(item.gaji) - bpjsKesehatan - bpjsTK;
            
            const isOdd = (index + 1) % 2 !== 0;

            return {
                originalIndex: index,
                no: index + 1,
                nama: item.nama || "-",
                pangkat: "-",
                nip: "-",
                jabatan: item.jabatan || "-",
                jumlah: `Rp ${formatNumber(item.gaji)}`,
                bpjs_kes: `Rp ${formatNumber(bpjsKesehatan)}`,
                bpjs_tk: `Rp ${formatNumber(bpjsTK)}`,
                total: `Rp ${formatNumber(jumlahDiterima)}`,
                tt1: isOdd ? "" : "",
                tt2: !isOdd ? "" : ""
            };
        });

        // Add header to the first page
        addPageHeader(pdf);

        // Store totals
        const pageTotals = {}; // Original page specific totals
        const cumulativeTotals = {}; // Cumulative totals for Brought Forward logic
        const lastIndexOnPage = {}; // Track the last index processed on each page
        let runningGaji = 0;
        let runningBPJSKes = 0;
        let runningBPJSTK = 0;
        let runningDiterima = 0;

        // Add Table using autoTable (handles page breaks automatically)
        autoTable(pdf, {
            startY: 60,
            columns: columns,
            body: rows,
            theme: "grid",
            headStyles: {
                fillColor: [245, 245, 245],
                textColor: [0, 0, 0],
                fontStyle: "bold",
                halign: "center",
                valign: "middle",
                lineWidth: 0.1,
                lineColor: [0, 0, 0],
                fontSize: 8
            },
            bodyStyles: {
                textColor: [0, 0, 0],
                lineWidth: 0.1,
                lineColor: [0, 0, 0],
                fontSize: 8,
                valign: "middle",
                cellPadding: 2
            },
            columnStyles: {
                no: { halign: "center", cellWidth: 10 },
                nama: { cellWidth: 60 },
                pangkat: { halign: "center", cellWidth: 22 },
                nip: { halign: "center", cellWidth: 22 },
                jabatan: { cellWidth: 35 },
                jumlah: { halign: "right", cellWidth: 31 },
                bpjs_kes: { halign: "right", cellWidth: 28 },
                bpjs_tk: { halign: "right", cellWidth: 28 },
                total: { halign: "right", cellWidth: 31 }
            },
            didParseCell: (data) => {
                // No need to merge TT header anymore as it is removed
            },
            willDrawCell: (data) => {
                // Update footer text and values before drawing
                if (data.section === "foot") {
                    const p = data.pageNumber;
                    const isTotalLastPage = lastIndexOnPage[p] === (result.data.length - 1);
                    const totalsToUse = isTotalLastPage ? cumulativeTotals[p] : pageTotals[p];

                    if (data.column.index === 0) {
                        data.cell.styles.halign = "left";
                        data.cell.styles.cellPadding = { left: 5, top: 2 };
                        
                        if (isTotalLastPage) {
                            data.cell.text = ["TOTAL"];
                        } else {
                            data.cell.text = ["JUMLAH DIPINDAHKAN"];
                        }
                    }

                    // Update the footer numeric values
                    if (data.column.index === 5) data.cell.text = [`Rp ${formatNumber(totalsToUse.gaji)}`];
                    if (data.column.index === 6) data.cell.text = [`Rp ${formatNumber(totalsToUse.bpjsKes)}`];
                    if (data.column.index === 7) data.cell.text = [`Rp ${formatNumber(totalsToUse.bpjsTk)}`];
                    if (data.column.index === 8) data.cell.text = [`Rp ${formatNumber(totalsToUse.diterima)}`];
                }
            },
            didDrawCell: (data) => {
                // Track totals per page from body rows
                if (data.section === "body" && data.column.index === 0) {
                    const p = data.pageNumber;
                    if (!pageTotals[p]) {
                        pageTotals[p] = { gaji: 0, bpjsKes: 0, bpjsTk: 0, diterima: 0 };
                    }
                    
                    const rowData = data.row.raw;
                    const item = result.data[rowData.originalIndex];
                    const gaji = parseFloat(item.gaji || 0);
                    const bpjsKes = Math.round(gaji * 0.01);
                    const bpjsTK = Math.round(gaji * 0.02);
                    const diterima = gaji - bpjsKes - bpjsTK;

                    pageTotals[p].gaji += gaji;
                    pageTotals[p].bpjsKes += bpjsKes;
                    pageTotals[p].bpjsTk += bpjsTK;
                    pageTotals[p].diterima += diterima;

                    // Cumulative
                    runningGaji += gaji;
                    runningBPJSKes += bpjsKes;
                    runningBPJSTK += bpjsTK;
                    runningDiterima += diterima;
                    
                    cumulativeTotals[p] = {
                        gaji: runningGaji,
                        bpjsKes: runningBPJSKes,
                        bpjsTk: runningBPJSTK,
                        diterima: runningDiterima
                    };

                    // Track last index to detect last page in footer
                    lastIndexOnPage[p] = rowData.originalIndex;
                }
            },
            didDrawPage: (data) => {
                // If this is page 2 or more, we need to draw the Header and "JUMLAH PINDAHAN" row manually
                if (data.pageNumber > 1 && cumulativeTotals[data.pageNumber - 1]) {
                    const prevTotals = cumulativeTotals[data.pageNumber - 1];
                    const headerY = 20; 
                    const broughtForwardY = 32; 
                    const headerHeight = 12;
                    const rowHeight = 8;
                    
                    // Get current table geometry
                    const tableColumns = data.table.columns;
                    const marginLeft = data.settings.margin.left;
                    
                    // Calculate column X positions
                    const colX = [];
                    let currentX = marginLeft;
                    tableColumns.forEach(col => {
                        colX.push(currentX);
                        currentX += col.width;
                    });
                    const tableWidth = currentX - marginLeft;
                    
                    // --- 1. Draw Header Manually ---
                    pdf.setFontSize(8);
                    pdf.setFont("helvetica", "bold");
                    pdf.setDrawColor(0);
                    pdf.setLineWidth(0.1);
                    pdf.setFillColor(245, 245, 245); // Header grey background
                    
                    tableColumns.forEach((col, i) => {
                        // Reset colors for each cell to be absolutely sure
                        pdf.setFillColor(245, 245, 245);
                        pdf.setDrawColor(0, 0, 0);
                        pdf.rect(colX[i], headerY, col.width, headerHeight, 'FD');
                        
                        pdf.setTextColor(0, 0, 0);
                        
                        // Access header text from raw definition or title
                        const titleText = (col.raw && col.raw.header) || col.title || col.header || "";
                        const headerLines = titleText.split('\n');
                        
                        if (headerLines.length > 1) {
                            pdf.text(headerLines[0], colX[i] + col.width / 2, headerY + 5, { align: "center" });
                            pdf.text(headerLines[1], colX[i] + col.width / 2, headerY + 9, { align: "center" });
                        } else {
                            pdf.text(titleText, colX[i] + col.width / 2, headerY + 7, { align: "center" });
                        }
                    });

                    // --- 2. Draw Brought Forward Row Manually ---
                    pdf.setFontSize(8);
                    pdf.setFont("helvetica", "bold");
                    pdf.setFillColor(255, 255, 255); // White background
                    
                    // Draw the row box
                    pdf.rect(marginLeft, broughtForwardY, tableWidth, rowHeight, 'FD');
                    
                    // Label aligned with NAMA column (index 1)
                    pdf.text("JUMLAH PINDAHAN", colX[1] + 2, broughtForwardY + 5, { align: "left" });
                    
                    // Totals in their respective columns
                    if (tableColumns[5]) pdf.text(`Rp ${formatNumber(prevTotals.gaji)}`, colX[5] + tableColumns[5].width - 1, broughtForwardY + 5, { align: "right" });
                    if (tableColumns[6]) pdf.text(`Rp ${formatNumber(prevTotals.bpjsKes)}`, colX[6] + tableColumns[6].width - 1, broughtForwardY + 5, { align: "right" });
                    if (tableColumns[7]) pdf.text(`Rp ${formatNumber(prevTotals.bpjsTk)}`, colX[7] + tableColumns[7].width - 1, broughtForwardY + 5, { align: "right" });
                    if (tableColumns[8]) pdf.text(`Rp ${formatNumber(prevTotals.diterima)}`, colX[8] + tableColumns[8].width - 1, broughtForwardY + 5, { align: "right" });
                    
                    // Draw vertical separators exactly at column boundaries for Brought Forward row
                    let separatorX = marginLeft;
                    tableColumns.forEach((col, i) => {
                        separatorX += col.width;
                        if (i < tableColumns.length - 1) {
                            pdf.line(separatorX, broughtForwardY, separatorX, broughtForwardY + rowHeight);
                        }
                    });
                    
                    // Reset font for next operations
                    pdf.setFont("helvetica", "normal");
                }
            },
            showFoot: 'everyPage',
            showHead: 'firstPage',
            foot: [[
                { content: "JUMLAH DIPINDAHKAN", colSpan: 5, styles: { halign: "left", fontStyle: "bold", cellPadding: { left: 5, top: 2 } } },
                { content: "", styles: { halign: "right", fontStyle: "bold" } },
                { content: "", styles: { halign: "right", fontStyle: "bold" } },
                { content: "", styles: { halign: "right", fontStyle: "bold" } },
                { content: "", styles: { halign: "right", fontStyle: "bold" } }
            ]],
            footStyles: {
                fillColor: [255, 255, 255],
                textColor: [0, 0, 0],
                lineWidth: 0.1,
                lineColor: [0, 0, 0]
            },
            margin: { top: 40, bottom: 15, left: 10, right: 10 },
            pageBreak: "auto",
            rowPageBreak: "avoid"
        });


        // Add Footer signatures after the table
        const finalY = pdf.lastAutoTable.finalY + 10;
        const pageHeight = pdf.internal.pageSize.height;
        const pageWidth = pdf.internal.pageSize.width;

        // Check if there is enough space for footer, otherwise new page
        let currentY = finalY;
        if (currentY + 50 > pageHeight) {
            pdf.addPage();
            currentY = 20;
        }

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        
        // Left Footer
        pdf.text("MENGETAHUI", 40, currentY, { align: "center" });
        pdf.setFont("helvetica", "bold");
        pdf.text("KEPALA RUMAH SAKIT BHAYANGKARA TK. III NGANJUK", 40, currentY + 5, { align: "center", maxWidth: 60 });
        
        pdf.setLineWidth(0.2);
        pdf.line(10, currentY + 40, 70, currentY + 40);
        pdf.text(settings.karumkit_nama, 40, currentY + 39, { align: "center" });
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        // Karumkit: Pangkat + NRP
        const karumkitNRP = settings.karumkit_nip.replace(/NRP\s+/i, '');
        pdf.text(`${settings.karumkit_pangkat} NRP ${karumkitNRP}`, 40, currentY + 44, { align: "center" });

        // Right Footer
        pdf.setFontSize(10);
        const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
        pdf.text(`NGANJUK, ${today}`, pageWidth - 40, currentY, { align: "center" });
        pdf.setFont("helvetica", "bold");
        pdf.text("BENDAHARA PENGELUARAN", pageWidth - 40, currentY + 5, { align: "center" });
        
        pdf.line(pageWidth - 70, currentY + 40, pageWidth - 10, currentY + 40);
        pdf.text(settings.bendahara_nama, pageWidth - 40, currentY + 39, { align: "center" });
        pdf.setFontSize(8);
        // Bendahara: Pangkat + NIP
        const bendaharaNIP = settings.bendahara_nip.replace(/NIP\s+/i, '');
        pdf.text(`${settings.bendahara_pangkat} NIP ${bendaharaNIP}`, pageWidth - 40, currentY + 44, { align: "center" });

        // Preview PDF in new tab
        const blob = pdf.output('blob');
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        
        // Optionally still allow download if needed, but preview was requested
        // pdf.save(fileName);

    } catch (error) {
        console.error("Error generating PDF with autoTable:", error);
        throw error;
    }
};
