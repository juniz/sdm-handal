import moment from "moment-timezone";

// Fungsi untuk format tanggal Indonesia
const formatTanggalIndo = (tanggal) => {
	const bulan = [
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
	const date = moment(tanggal);
	return `${date.format("DD")} ${
		bulan[parseInt(date.format("MM"))]
	} ${date.format("YYYY")}`;
};

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

// Generate HTML sederhana untuk PDF (tanpa CSS kompleks, menggunakan table layout)
export const generateSlipGajiHTMLSimple = (gajiData, pegawaiData) => {
	const periodeBulan = formatBulanIndo(gajiData.periode_bulan);
	const periodeTahun = gajiData.periode_tahun;
	const tanggalCetak = formatTanggalIndo(new Date());

	// Format rupiah
	const formatRupiah = (angka) => {
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			minimumFractionDigits: 0,
		}).format(angka);
	};

	// Gunakan table layout untuk kompatibilitas dengan html2canvas
	return `
		<div style="width: 794px; min-height: 1123px; padding: 60px; font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; color: #000000; background-color: #ffffff; box-sizing: border-box;">
			<!-- Header dengan Logo -->
			<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: none;">
				<tr>
					<td style="width: 80px; vertical-align: middle; border: none; padding: 0;">
						<img src="/logo.png" alt="Logo" style="width: 70px; height: 70px; object-fit: contain;" crossorigin="anonymous" />
					</td>
					<td style="text-align: center; vertical-align: middle; border: none; padding: 0;">
						<div style="font-size: 16pt; font-weight: bold; margin-bottom: 5px; color: #000000;">POLRI DAERAH JAWA TIMUR</div>
						<div style="font-size: 14pt; font-weight: bold; margin-bottom: 3px; color: #000000;">BIDANG KEDOKTERAN DAN KESEHATAN</div>
						<div style="font-size: 12pt; font-weight: bold; margin-top: 5px; color: #000000;">RUMAH SAKIT BHAYANGKARA TK. III NGANJUK</div>
					</td>
					<td style="width: 80px; border: none; padding: 0;"></td>
				</tr>
			</table>
			<div style="border-bottom: 2px solid #000000; margin-bottom: 15px;"></div>
			
			<!-- Title -->
			<div style="text-align: center; font-size: 14pt; font-weight: bold; margin: 20px 0; text-decoration: underline; color: #000000;">SLIP GAJI</div>
			
			<!-- Periode -->
			<div style="text-align: center; margin-bottom: 20px; font-weight: bold; color: #000000;">
				Periode: ${periodeBulan} ${periodeTahun}
			</div>
			
			<!-- Info Pegawai menggunakan table -->
			<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: none;">
				<tr>
					<td style="width: 150px; font-weight: bold; color: #000000; padding: 4px 0; border: none;">NIK:</td>
					<td style="color: #000000; padding: 4px 0; border: none;">${pegawaiData.nik || "-"}</td>
				</tr>
				<tr>
					<td style="width: 150px; font-weight: bold; color: #000000; padding: 4px 0; border: none;">Nama:</td>
					<td style="color: #000000; padding: 4px 0; border: none;">${pegawaiData.nama || "-"}</td>
				</tr>
				<tr>
					<td style="width: 150px; font-weight: bold; color: #000000; padding: 4px 0; border: none;">Jabatan:</td>
					<td style="color: #000000; padding: 4px 0; border: none;">${pegawaiData.jbtn || "-"}</td>
				</tr>
				<tr>
					<td style="width: 150px; font-weight: bold; color: #000000; padding: 4px 0; border: none;">Departemen:</td>
					<td style="color: #000000; padding: 4px 0; border: none;">${pegawaiData.departemen_name || "-"}</td>
				</tr>
			</table>
			
			<!-- Rincian Gaji -->
			<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
				<thead>
					<tr>
						<th style="width: 30%; border: 1px solid #000000; padding: 8px; text-align: center; font-weight: bold; background-color: #f0f0f0; color: #000000;">Keterangan</th>
						<th style="width: 70%; border: 1px solid #000000; padding: 8px; text-align: center; font-weight: bold; background-color: #f0f0f0; color: #000000;">Jumlah</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td style="border: 1px solid #000000; padding: 8px; color: #000000; background-color: #ffffff;">Jenis</td>
						<td style="border: 1px solid #000000; padding: 8px; color: #000000; background-color: #ffffff;">${gajiData.jenis}</td>
					</tr>
					<tr>
						<td style="border: 1px solid #000000; padding: 8px; color: #000000; font-weight: bold; font-size: 13pt; background-color: #ffffff;">TOTAL GAJI</td>
						<td style="border: 1px solid #000000; padding: 8px; text-align: right; color: #000000; font-weight: bold; font-size: 13pt; background-color: #ffffff;">${formatRupiah(gajiData.gaji)}</td>
					</tr>
				</tbody>
			</table>
			
			<!-- Footer menggunakan table -->
			<table style="width: 100%; border-collapse: collapse; margin-top: 40px; border: none;">
				<tr>
					<td style="width: 50%; text-align: center; vertical-align: top; color: #000000; padding: 10px; border: none;">
						<div>Nganjuk, ${tanggalCetak}</div>
						<div style="margin-top: 20px;">Yang Menerima</div>
						<div style="margin-top: 60px; border-top: 1px solid #000000; padding-top: 5px; display: inline-block; min-width: 150px;">
							${pegawaiData.nama || ""}
						</div>
					</td>
					<td style="width: 50%; text-align: center; vertical-align: top; color: #000000; padding: 10px; border: none;">
						<div>Mengetahui</div>
						<div style="margin-top: 20px;">KEPALA RUMAH SAKIT</div>
						<div style="margin-top: 60px; border-top: 1px solid #000000; padding-top: 5px; display: inline-block; min-width: 200px;">
							drg. WAHYU ARI PRANANTO, M.A.R.S.<br>
							<span style="text-decoration: overline;">AJUN KOMISARIS BESAR POLISI NRP 76030927</span>
						</div>
					</td>
				</tr>
			</table>
		</div>
	`;
};

