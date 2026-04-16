const fs = require('fs');

let content = fs.readFileSync('src/app/dashboard/profile/page.js', 'utf8');

// 1. Import
content = content.replace(
    'import { LogOut, User, Lock, Edit, Camera, MapPin, Building2, Briefcase, Calendar, CreditCard, GraduationCap, Users } from "lucide-react";',
    'import { LogOut, User, Lock, Edit, Camera, MapPin, Building2, Briefcase, Calendar, CreditCard, GraduationCap, Users } from "lucide-react";\nimport EducationHistorySection from "./EducationHistorySection";'
);

// 2. State
content = content.replace(
    `\tconst [educationHistory, setEducationHistory] = useState([]);
\tconst [loading, setLoading] = useState(false);
\tconst [error, setError] = useState("");
\tconst [success, setSuccess] = useState(false);
\tconst [showAddEducation, setShowAddEducation] = useState(false);
\tconst [selectedEducation, setSelectedEducation] = useState(null);`,
    `\tconst [loading, setLoading] = useState(false);
\tconst [error, setError] = useState("");
\tconst [success, setSuccess] = useState(false);`
);

// 3. resetForm
content = content.replace(
    `\t\tsetLoading(false);
\t\tsetPendidikanList([]);
\t\tsetShowAddEducation(false);
\t\tsetSelectedEducation(null);`,
    `\t\tsetLoading(false);
\t\tsetPendidikanList([]);`
);

// Remove specific blocks using powerful Regex matching or specific boundaries
// Remove handlers
const handlersRegex = /\tconst handleEditEducation \= \(\w+\) \=\> \{[\s\S]*?setShowAddEducation\(false\);\n\t\};\n/g;
content = content.replace(handlersRegex, '');

// Remove fetch riwayat in EditProfileModal
const fetchRiwayatRegex = /\t\t\t\t\/\/ Fetch riwayat pendidikan\n\t\t\t\tconst educationResponse = await fetch\("\/api\/profile\/education"\);\n\t\t\t\tconst educationData = await educationResponse\.json\(\);\n\n\t\t\t\tif \(educationData\.status === 200\) \{\n\t\t\t\t\tsetEducationHistory\(educationData\.data\);\n\t\t\t\t\}\n/g;
content = content.replace(fetchRiwayatRegex, '');

// Remove AddEducationModal inside EditProfileModal
const innerModalRegex = /\t\t\t\t<AddEducationModal[\s\S]*?pendidikanList=\{pendidikanList\}\n\t\t\t\t\/>\n/g;
content = content.replace(innerModalRegex, '');

// Remove the 3 huge components: AddEducationModal, EducationDocumentModal, ProfileEducationHistory
// It starts with "// Komponen Modal untuk Menambah/Edit Riwayat Pendidikan"
// and ends right before "export default function ProfilePage() {"
const hugeComponentsRegex = /\/\/ Komponen Modal untuk Menambah\/Edit Riwayat Pendidikan[\s\S]*?(?=export default function ProfilePage)/;
content = content.replace(hugeComponentsRegex, '');

// Render update
content = content.replace(
    '<ProfileEducationHistory educationHistory={educationHistory} />',
    '<EducationHistorySection initialData={educationHistory} />'
);

fs.writeFileSync('src/app/dashboard/profile/page.js', content, 'utf8');
console.log('Refactoring complete.');
