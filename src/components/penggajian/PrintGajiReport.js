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
 * @param {boolean} groupByContract - Group by contract start date
 */
export const printGajiReport = async (bulan, tahun, jenis = "Gaji", departemen = null, groupByContract = false) => {
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
        const addPageHeader = (pdf, contractSubLabel = null) => {
            pdf.setFontSize(11);
            pdf.setFont("arial", "bold");
            pdf.text("POLRI DAERAH JAWA TIMUR", pdf.internal.pageSize.width / 4, 15, { align: "center" });
            pdf.text("BIDANG KEDOKTERAN DAN KESEHATAN", pdf.internal.pageSize.width / 4, 20, { align: "center" });
            pdf.text("RUMAH SAKIT BHAYANGKARA TK. III NGANJUK", pdf.internal.pageSize.width / 4, 25, { align: "center" });
            const textWidth = pdf.getTextWidth("RUMAH SAKIT BHAYANGKARA TK. III NGANJUK");
            pdf.setLineWidth(0.2);
            pdf.line(pdf.internal.pageSize.width / 4 - textWidth / 2, 26, pdf.internal.pageSize.width / 4 + textWidth / 2, 26);

            pdf.setFontSize(12);
            pdf.text(jenisLabel, pdf.internal.pageSize.width / 2, 38, { align: "center" });
            pdf.text(`BULAN ${periodeBulan} ${periodeTahun}`, pdf.internal.pageSize.width / 2, 44, { align: "center" });
            pdf.text("RUMAH SAKIT BHAYANGKARA TK. III NGANJUK", pdf.internal.pageSize.width / 2, 50, { align: "center" });

            if (contractSubLabel) {
                pdf.setFontSize(10);
                pdf.setFont("helvetica", "bold");
                pdf.text(`TMT KONTRAK: ${contractSubLabel}`, pdf.internal.pageSize.width / 2, 55, { align: "center" });
            }
        };


        // Format contract date label (Month & Year)
        const formatBulanTahunLabel = (dateStr) => {
            if (!dateStr || dateStr === "0000-00-00") return "BELUM ADA KONTRAK";
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return "BELUM ADA KONTRAK";
            return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" }).toUpperCase();
        };

        const formatTanggalShort = (dateStr) => {
            if (!dateStr || dateStr === "0000-00-00") return "-";
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return "-";
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        };

        // Prepare table columns definition
        const columns = groupByContract ? [
            { header: "NO.", dataKey: "no" },
            { header: "NAMA", dataKey: "nama" },
            { header: "TGL KONTRAK", dataKey: "tgl_kontrak" },
            { header: "PANGKAT", dataKey: "pangkat" },
            { header: "NIP", dataKey: "nip" },
            { header: "JABATAN", dataKey: "jabatan" },
            { header: "JUMLAH", dataKey: "jumlah" },
            { header: "BPJS\nKESEHATAN", dataKey: "bpjs_kes" },
            { header: "BPJS\nTENAGA KERJA", dataKey: "bpjs_tk" },
            { header: "JUMLAH\nDITERIMA", dataKey: "total" },
            { header: "1", dataKey: "ttd1" },
            { header: "2", dataKey: "ttd2" }
        ] : [
            { header: "NO.", dataKey: "no" },
            { header: "NAMA", dataKey: "nama" },
            { header: "PANGKAT", dataKey: "pangkat" },
            { header: "NIP", dataKey: "nip" },
            { header: "JABATAN", dataKey: "jabatan" },
            { header: "JUMLAH", dataKey: "jumlah" },
            { header: "BPJS\nKESEHATAN", dataKey: "bpjs_kes" },
            { header: "BPJS\nTENAGA KERJA", dataKey: "bpjs_tk" },
            { header: "JUMLAH\nDITERIMA", dataKey: "total" },
            { header: "1", dataKey: "ttd1" },
            { header: "2", dataKey: "ttd2" }
        ];

        const head = groupByContract ? [
            [
                { content: "NO.", rowSpan: 2 },
                { content: "NAMA", rowSpan: 2 },
                { content: "TGL KONTRAK", rowSpan: 2 },
                { content: "PANGKAT", rowSpan: 2 },
                { content: "NIP", rowSpan: 2 },
                { content: "JABATAN", rowSpan: 2 },
                { content: "JUMLAH", rowSpan: 2 },
                { content: "BPJS\nKESEHATAN", rowSpan: 2 },
                { content: "BPJS\nTENAGA KERJA", rowSpan: 2 },
                { content: "JUMLAH\nDITERIMA", rowSpan: 2 },
                { content: "TANDA TANGAN", colSpan: 2, styles: { halign: "center" } }
            ],
            [
                { content: "1", styles: { halign: "center" } },
                { content: "2", styles: { halign: "center" } }
            ]
        ] : [
            [
                { content: "NO.", rowSpan: 2 },
                { content: "NAMA", rowSpan: 2 },
                { content: "PANGKAT", rowSpan: 2 },
                { content: "NIP", rowSpan: 2 },
                { content: "JABATAN", rowSpan: 2 },
                { content: "JUMLAH", rowSpan: 2 },
                { content: "BPJS\nKESEHATAN", rowSpan: 2 },
                { content: "BPJS\nTENAGA KERJA", rowSpan: 2 },
                { content: "JUMLAH\nDITERIMA", rowSpan: 2 },
                { content: "TANDA TANGAN", colSpan: 2, styles: { halign: "center" } }
            ],
            [
                { content: "1", styles: { halign: "center" } },
                { content: "2", styles: { halign: "center" } }
            ]
        ];

        // Column styles (A4 Landscape = 277mm)
        const columnStyles = groupByContract ? {
            no: { halign: "center", cellWidth: 10 },
            nama: { cellWidth: 38 },
            tgl_kontrak: { halign: "center", cellWidth: 22 },
            pangkat: { halign: "center", cellWidth: 15 },
            nip: { halign: "center", cellWidth: 15 },
            jabatan: { cellWidth: 25 },
            jumlah: { halign: "right", cellWidth: 24 },
            bpjs_kes: { halign: "right", cellWidth: 22 },
            bpjs_tk: { halign: "right", cellWidth: 22 },
            total: { halign: "right", cellWidth: 24 },
            ttd1: { halign: "left", cellWidth: 30 },
            ttd2: { halign: "left", cellWidth: 30 }
        } : {
            no: { halign: "center", cellWidth: 12 },
            nama: { cellWidth: 45 },
            pangkat: { halign: "center", cellWidth: 16 },
            nip: { halign: "center", cellWidth: 16 },
            jabatan: { cellWidth: 28 },
            jumlah: { halign: "right", cellWidth: 26 },
            bpjs_kes: { halign: "right", cellWidth: 24 },
            bpjs_tk: { halign: "right", cellWidth: 24 },
            total: { halign: "right", cellWidth: 26 },
            ttd1: { halign: "left", cellWidth: 30 },
            ttd2: { halign: "left", cellWidth: 30 }
        };

        // Column indices for totals
        const jumlahColIdx = groupByContract ? 6 : 5;
        const bpjsKesColIdx = groupByContract ? 7 : 6;
        const bpjsTkColIdx = groupByContract ? 8 : 7;
        const totalColIdx = groupByContract ? 9 : 8;
        const normalHeaderColCount = groupByContract ? 10 : 9;

        // Determine groups by Month & Year of contract
        let groupsToRender = [];
        if (groupByContract) {
            const groupsMap = new Map();
            result.data.forEach(item => {
                let key = "NO_KONTRAK";
                if (item.mulai_kontrak && item.mulai_kontrak !== "0000-00-00") {
                    const d = new Date(item.mulai_kontrak);
                    if (!isNaN(d.getTime())) {
                        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    }
                }
                if (!groupsMap.has(key)) {
                    groupsMap.set(key, {
                        key,
                        label: formatBulanTahunLabel(item.mulai_kontrak),
                        items: []
                    });
                }
                groupsMap.get(key).items.push(item);
            });
            groupsToRender = Array.from(groupsMap.values());
        } else {
            groupsToRender = [{ key: "ALL", label: null, items: result.data }];
        }

        // Render each group
        for (let gIdx = 0; gIdx < groupsToRender.length; gIdx++) {
            const group = groupsToRender[gIdx];
            if (gIdx > 0) {
                pdf.addPage();
            }

            addPageHeader(pdf, group.label);

            const rows = group.items.map((item, index) => {
                const isGaji = item.jenis && item.jenis.toString().trim().toUpperCase() === "GAJI";
                const bpjsKesehatan = isGaji ? parseFloat(settings.bpjs_kesehatan_nominal || 0) : 0;
                const bpjsTK = isGaji ? parseFloat(settings.bpjs_ketenagakerjaan_nominal || 0) : 0;
                const jumlahDiterima = parseFloat(item.gaji) - bpjsKesehatan - bpjsTK;
                
                const isOdd = (index + 1) % 2 !== 0;

                const rowObj = {
                    originalIndex: index,
                    itemRef: item,
                    no: index + 1,
                    nama: item.nama || "-",
                    pangkat: "-",
                    nip: "-",
                    jabatan: item.jabatan || "-",
                    jumlah: `Rp ${formatNumber(item.gaji)}`,
                    bpjs_kes: `Rp ${formatNumber(bpjsKesehatan)}`,
                    bpjs_tk: `Rp ${formatNumber(bpjsTK)}`,
                    total: `Rp ${formatNumber(jumlahDiterima)}`,
                    ttd1: isOdd ? `${index + 1}. ....................` : "",
                    ttd2: !isOdd ? `${index + 1}. ....................` : ""
                };

                if (groupByContract) {
                    rowObj.tgl_kontrak = formatTanggalShort(item.mulai_kontrak);
                }

                return rowObj;
            });

            // Track page totals per group
            const pageTotals = {}; 
            const cumulativeTotals = {}; 
            const lastIndexOnPage = {}; 
            let runningGaji = 0;
            let runningBPJSKes = 0;
            let runningBPJSTK = 0;
            let runningDiterima = 0;

            const startY = group.label ? 58 : 60;

            autoTable(pdf, {
                startY: startY,
                head: head,
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
                columnStyles: columnStyles,
                willDrawCell: (data) => {
                    if (data.section === "foot") {
                        const p = data.pageNumber;
                        const isTotalLastPage = lastIndexOnPage[p] === (group.items.length - 1);
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

                        if (totalsToUse) {
                            if (data.column.index === jumlahColIdx) data.cell.text = [`Rp ${formatNumber(totalsToUse.gaji)}`];
                            if (data.column.index === bpjsKesColIdx) data.cell.text = [`Rp ${formatNumber(totalsToUse.bpjsKes)}`];
                            if (data.column.index === bpjsTkColIdx) data.cell.text = [`Rp ${formatNumber(totalsToUse.bpjsTk)}`];
                            if (data.column.index === totalColIdx) data.cell.text = [`Rp ${formatNumber(totalsToUse.diterima)}`];
                        }
                    }
                },
                didDrawCell: (data) => {
                    if (data.section === "body" && data.column.index === 0) {
                        const p = data.pageNumber;
                        if (!pageTotals[p]) {
                            pageTotals[p] = { gaji: 0, bpjsKes: 0, bpjsTk: 0, diterima: 0 };
                        }
                        
                        const rowData = data.row.raw;
                        const item = rowData.itemRef;
                        const gaji = parseFloat(item.gaji || 0);
                        const bpjsKes = Math.round(gaji * 0.01);
                        const bpjsTK = Math.round(gaji * 0.02);
                        const diterima = gaji - bpjsKes - bpjsTK;

                        pageTotals[p].gaji += gaji;
                        pageTotals[p].bpjsKes += bpjsKes;
                        pageTotals[p].bpjsTk += bpjsTK;
                        pageTotals[p].diterima += diterima;

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

                        lastIndexOnPage[p] = rowData.originalIndex;
                    }

                    if (data.section === "body") {
                        const rowData = data.row.raw;
                        const item = rowData.itemRef;
                        if (item && item.tanda_tangan && String(item.tanda_tangan).trim() !== "") {
                            const isOdd = (rowData.no % 2 !== 0);
                            const isTargetCol = (isOdd && data.column.dataKey === "ttd1") || (!isOdd && data.column.dataKey === "ttd2");
                            if (isTargetCol) {
                                try {
                                    const cell = data.cell;
                                    let imgData = String(item.tanda_tangan).trim();
                                    const format = imgData.includes("image/jpeg") || imgData.includes("image/jpg") ? "JPEG" : "PNG";
                                    
                                    if (!imgData.startsWith("data:image/")) {
                                        imgData = `data:image/png;base64,${imgData}`;
                                    }

                                    pdf.setFillColor(255, 255, 255);
                                    pdf.rect(cell.x + 0.3, cell.y + 0.3, cell.width - 0.6, cell.height - 0.6, 'F');
                                    
                                    pdf.setFontSize(7);
                                    pdf.setFont("helvetica", "normal");
                                    pdf.setTextColor(0, 0, 0);
                                    pdf.text(`${rowData.no}.`, cell.x + 1, cell.y + 3.5);

                                    pdf.addImage(
                                        imgData,
                                        format,
                                        cell.x + 5,
                                        cell.y + 0.5,
                                        cell.width - 6,
                                        cell.height - 1
                                    );
                                } catch (imgError) {
                                    console.error("Gagal menggambar tanda tangan digital:", imgError);
                                }
                            }
                        }
                    }
                },
                didDrawPage: (data) => {
                    if (data.pageNumber > 1 && cumulativeTotals[data.pageNumber - 1]) {
                        const prevTotals = cumulativeTotals[data.pageNumber - 1];
                        const headerY = 20; 
                        const broughtForwardY = 32; 
                        const headerHeight = 12;
                        const rowHeight = 8;
                        
                        const tableColumns = data.table.columns;
                        const marginLeft = data.settings.margin.left;
                        
                        const colX = [];
                        let currentX = marginLeft;
                        tableColumns.forEach(col => {
                            colX.push(currentX);
                            currentX += col.width;
                        });
                        const tableWidth = currentX - marginLeft;
                        
                        pdf.setFontSize(8);
                        pdf.setFont("helvetica", "bold");
                        pdf.setDrawColor(0);
                        pdf.setLineWidth(0.1);

                        tableColumns.forEach((col, i) => {
                            pdf.setFillColor(245, 245, 245);
                            pdf.setDrawColor(0, 0, 0);
                            pdf.setTextColor(0, 0, 0);

                            if (i < normalHeaderColCount) {
                                pdf.rect(colX[i], headerY, col.width, headerHeight, 'FD');
                                const titleText = (col.raw && col.raw.header) || col.title || col.header || "";
                                const headerLines = titleText.split('\n');
                                if (headerLines.length > 1) {
                                    pdf.text(headerLines[0], colX[i] + col.width / 2, headerY + 4.5, { align: "center" });
                                    pdf.text(headerLines[1], colX[i] + col.width / 2, headerY + 8.5, { align: "center" });
                                } else {
                                    pdf.text(titleText, colX[i] + col.width / 2, headerY + 6.5, { align: "center" });
                                }
                            } else if (i === normalHeaderColCount) {
                                const ttdWidth = tableColumns[normalHeaderColCount].width + tableColumns[normalHeaderColCount + 1].width;
                                pdf.setFillColor(245, 245, 245);
                                pdf.setDrawColor(0, 0, 0);
                                pdf.setTextColor(0, 0, 0);
                                pdf.rect(colX[normalHeaderColCount], headerY, ttdWidth, 6, 'FD');
                                pdf.text("TANDA TANGAN", colX[normalHeaderColCount] + ttdWidth / 2, headerY + 4, { align: "center" });

                                pdf.setFillColor(245, 245, 245);
                                pdf.setDrawColor(0, 0, 0);
                                pdf.setTextColor(0, 0, 0);
                                pdf.rect(colX[normalHeaderColCount], headerY + 6, tableColumns[normalHeaderColCount].width, 6, 'FD');
                                pdf.text("1", colX[normalHeaderColCount] + tableColumns[normalHeaderColCount].width / 2, headerY + 10, { align: "center" });

                                pdf.setFillColor(245, 245, 245);
                                pdf.setDrawColor(0, 0, 0);
                                pdf.setTextColor(0, 0, 0);
                                pdf.rect(colX[normalHeaderColCount + 1], headerY + 6, tableColumns[normalHeaderColCount + 1].width, 6, 'FD');
                                pdf.text("2", colX[normalHeaderColCount + 1] + tableColumns[normalHeaderColCount + 1].width / 2, headerY + 10, { align: "center" });
                            }
                        });

                        pdf.setFontSize(8);
                        pdf.setFont("helvetica", "bold");
                        pdf.setFillColor(255, 255, 255);
                        
                        pdf.rect(marginLeft, broughtForwardY, tableWidth, rowHeight, 'FD');
                        pdf.text("JUMLAH PINDAHAN", colX[1] + 2, broughtForwardY + 5, { align: "left" });
                        
                        if (tableColumns[jumlahColIdx]) pdf.text(`Rp ${formatNumber(prevTotals.gaji)}`, colX[jumlahColIdx] + tableColumns[jumlahColIdx].width - 1, broughtForwardY + 5, { align: "right" });
                        if (tableColumns[bpjsKesColIdx]) pdf.text(`Rp ${formatNumber(prevTotals.bpjsKes)}`, colX[bpjsKesColIdx] + tableColumns[bpjsKesColIdx].width - 1, broughtForwardY + 5, { align: "right" });
                        if (tableColumns[bpjsTkColIdx]) pdf.text(`Rp ${formatNumber(prevTotals.bpjsTk)}`, colX[bpjsTkColIdx] + tableColumns[bpjsTkColIdx].width - 1, broughtForwardY + 5, { align: "right" });
                        if (tableColumns[totalColIdx]) pdf.text(`Rp ${formatNumber(prevTotals.diterima)}`, colX[totalColIdx] + tableColumns[totalColIdx].width - 1, broughtForwardY + 5, { align: "right" });
                        
                        let separatorX = marginLeft;
                        tableColumns.forEach((col, i) => {
                            separatorX += col.width;
                            if (i < tableColumns.length - 1) {
                                pdf.line(separatorX, broughtForwardY, separatorX, broughtForwardY + rowHeight);
                            }
                        });
                        
                        pdf.setFont("helvetica", "normal");
                    }
                },
                showFoot: 'everyPage',
                showHead: 'firstPage',
                foot: [[
                    { content: "JUMLAH DIPINDAHKAN", colSpan: groupByContract ? 6 : 5, styles: { halign: "left", fontStyle: "bold", cellPadding: { left: 5, top: 2 } } },
                    { content: "", styles: { halign: "right", fontStyle: "bold" } },
                    { content: "", styles: { halign: "right", fontStyle: "bold" } },
                    { content: "", styles: { halign: "right", fontStyle: "bold" } },
                    { content: "", styles: { halign: "right", fontStyle: "bold" } },
                    { content: "", colSpan: 2 }
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

            // Add Footer signatures for this group after table
            const finalY = pdf.lastAutoTable.finalY + 10;
            const pageHeight = pdf.internal.pageSize.height;
            const pageWidth = pdf.internal.pageSize.width;

            let currentY = finalY;
            if (currentY + 50 > pageHeight) {
                pdf.addPage();
                currentY = 20;
            }

            pdf.setFontSize(10);
            pdf.setFont("helvetica", "normal");
            
            pdf.text("MENGETAHUI", 40, currentY, { align: "center" });
            pdf.setFont("helvetica", "bold");
            pdf.text("KEPALA RUMAH SAKIT BHAYANGKARA TK. III NGANJUK", 40, currentY + 5, { align: "center", maxWidth: 60 });
            
            pdf.setLineWidth(0.2);
            pdf.line(10, currentY + 40, 70, currentY + 40);
            pdf.text(settings.karumkit_nama, 40, currentY + 39, { align: "center" });
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(8);
            const karumkitNRP = settings.karumkit_nip.replace(/NRP\s+/i, '');
            pdf.text(`${settings.karumkit_pangkat} NRP ${karumkitNRP}`, 40, currentY + 44, { align: "center" });

            pdf.setFontSize(10);
            const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
            pdf.text(`NGANJUK, ${today}`, pageWidth - 40, currentY, { align: "center" });
            pdf.setFont("helvetica", "bold");
            pdf.text("BENDAHARA PENGELUARAN", pageWidth - 40, currentY + 5, { align: "center" });
            
            pdf.line(pageWidth - 70, currentY + 40, pageWidth - 10, currentY + 40);
            pdf.text(settings.bendahara_nama, pageWidth - 40, currentY + 39, { align: "center" });
            pdf.setFontSize(8);
            const bendaharaNIP = settings.bendahara_nip.replace(/NIP\s+/i, '');
            pdf.text(`${settings.bendahara_pangkat} NIP ${bendaharaNIP}`, pageWidth - 40, currentY + 44, { align: "center" });
        }

        // Preview PDF in new tab
        const blob = pdf.output('blob');
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');

    } catch (error) {
        console.error("Error generating PDF with autoTable:", error);
        throw error;
    }
};
