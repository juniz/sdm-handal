import Cookies from "js-cookie";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const GQL_ENDPOINT = `${BACKEND_URL}/graphql`;

async function gql(query, variables = {}) {
  const headers = { "Content-Type": "application/json" };

  if (typeof window !== "undefined") {
    let token = Cookies.get("auth_token") || localStorage.getItem("auth_token_backup");

    // Auto session restore
    if (!token) {
      try {
        console.log("No client token, attempting to restore session...");
        const sessionRes = await fetch("/api/auth/session");
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          if (sessionData.token) {
            token = sessionData.token;
            Cookies.set("auth_token", token, {
              expires: 7,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
            });
            localStorage.setItem("auth_token_backup", token);
            localStorage.setItem("auth_token_timestamp", Date.now().toString());
          }
        }
      } catch (err) {
        console.error("Failed to auto-restore session:", err);
      }
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(GQL_ENDPOINT, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors) {
    const msg = json.errors[0]?.message ?? "GraphQL error";
    throw new Error(msg);
  }
  return json.data;
}

export async function fetchProfileDetail() {
  const data = await gql(`
    query {
      sdmProfile {
        id
        username
        nama
        departemen
        departemen_name
        jabatan
        tmp_lahir
        tgl_lahir
        alamat
        photo
        jk
        pendidikan
        kota
        bidang
        kode_kelompok
        mulai_kerja
        ms_kerja
        npwp
        no_ktp
        rekening
        mulai_kontrak
        stts_aktif
        jbtn
      }
    }
  `);
  return data.sdmProfile;
}

export async function mutationUpdateProfile(input) {
  const data = await gql(`
    mutation UpdateProfile($input: UpdateSdmProfileInput!) {
      updateSdmProfile(input: $input)
    }
  `, { input });
  return data.updateSdmProfile;
}

export async function fetchEducationHistory() {
  const data = await gql(`
    query {
      sdmEducationHistory {
        id
        pendidikan
        sekolah
        jurusan
        thn_lulus
        kepala
        pendanaan
        keterangan
        status
        berkas
      }
    }
  `);
  return data.sdmEducationHistory;
}

export async function mutationCreateEducation(input) {
  const data = await gql(`
    mutation CreateEducation($input: CreateSdmEducationInput!) {
      createSdmEducation(input: $input) {
        id
        pendidikan
        sekolah
        jurusan
        thn_lulus
        kepala
        pendanaan
        keterangan
        status
        berkas
      }
    }
  `, { input });
  return data.createSdmEducation;
}

export async function mutationUpdateEducation(input) {
  const data = await gql(`
    mutation UpdateEducation($input: UpdateSdmEducationInput!) {
      updateSdmEducation(input: $input)
    }
  `, { input });
  return data.updateSdmEducation;
}

export async function mutationDeleteEducation(pendidikan, sekolah) {
  const data = await gql(`
    mutation DeleteEducation($pendidikan: String!, $sekolah: String!) {
      deleteSdmEducation(pendidikan: $pendidikan, sekolah: $sekolah)
    }
  `, { pendidikan, sekolah });
  return data.deleteSdmEducation;
}

export async function fetchSeminarHistory() {
  const data = await gql(`
    query {
      sdmSeminarHistory {
        id
        tingkat
        jenis
        nama_seminar
        peranan
        mulai
        selesai
        penyelengara
        tempat
        berkas
      }
    }
  `);
  return data.sdmSeminarHistory;
}

export async function mutationCreateSeminar(input) {
  const data = await gql(`
    mutation CreateSeminar($input: CreateSdmSeminarInput!) {
      createSdmSeminar(input: $input) {
        id
        tingkat
        jenis
        nama_seminar
        peranan
        mulai
        selesai
        penyelengara
        tempat
        berkas
      }
    }
  `, { input });
  return data.createSdmSeminar;
}

export async function mutationUpdateSeminar(input) {
  const data = await gql(`
    mutation UpdateSeminar($input: UpdateSdmSeminarInput!) {
      updateSdmSeminar(input: $input)
    }
  `, { input });
  return data.updateSdmSeminar;
}

export async function mutationDeleteSeminar(nama_seminar, mulai) {
  const data = await gql(`
    mutation DeleteSeminar($nama_seminar: String!, $mulai: String!) {
      deleteSdmSeminar(nama_seminar: $nama_seminar, mulai: $mulai)
    }
  `, { nama_seminar, mulai });
  return data.deleteSdmSeminar;
}

export async function fetchPendidikanList() {
  const data = await gql(`
    query {
      sdmPendidikanList {
        tingkat
      }
    }
  `);
  return data.sdmPendidikanList;
}

export async function mutationUpdatePassword(oldPass, newPass) {
  const data = await gql(`
    mutation ChangePassword($oldPass: String!, $newPass: String!) {
      changeSdmPassword(oldPass: $oldPass, newPass: $newPass)
    }
  `, { oldPass, newPass });
  return data.changeSdmPassword;
}

export async function fetchPrintCvData() {
  const data = await gql(`
    query {
      sdmPrintCv {
        pegawai {
          id
          username
          nama
          departemen
          departemen_name
          jabatan
          tmp_lahir
          tgl_lahir
          alamat
          photo
          jk
          pendidikan
          kota
          bidang
          kode_kelompok
          mulai_kerja
          ms_kerja
          npwp
          no_ktp
          rekening
          mulai_kontrak
          stts_aktif
          jbtn
        }
        jabatan {
          jabatan
          tgl_sk
        }
        pendidikan {
          id
          pendidikan
          sekolah
          jurusan
          thn_lulus
          kepala
          pendanaan
          keterangan
          status
          berkas
        }
        seminar {
          id
          tingkat
          jenis
          nama_seminar
          peranan
          mulai
          selesai
          penyelengara
          tempat
          berkas
        }
        penghargaan {
          nama_penghargaan
          tanggal
          instansi
          pejabat_pemberi
        }
        gaji {
          pangkatjabatan
          gapok
          no_sk
          tgl_sk
        }
      }
    }
  `);
  return data.sdmPrintCv;
}
