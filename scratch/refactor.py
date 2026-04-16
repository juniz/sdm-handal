import re

with open('src/app/dashboard/profile/page.js', 'r') as f:
    content = f.read()

# 1. Imports
content = content.replace(
    'import { removeClientToken } from "@/lib/client-auth";',
    'import { removeClientToken } from "@/lib/client-auth";\nimport EducationHistorySection from "./EducationHistorySection";'
)

# 2. State
content = content.replace(
    '\tconst [educationHistory, setEducationHistory] = useState([]);\n\tconst [loading, setLoading] = useState(false);\n\tconst [error, setError] = useState("");\n\tconst [success, setSuccess] = useState(false);\n\tconst [showAddEducation, setShowAddEducation] = useState(false);\n\tconst [selectedEducation, setSelectedEducation] = useState(null);',
    '\tconst [loading, setLoading] = useState(false);\n\tconst [error, setError] = useState("");\n\tconst [success, setSuccess] = useState(false);'
)

# 3. resetForm
content = content.replace(
    '\t\tsetLoading(false);\n\t\tsetPendidikanList([]);\n\t\tsetShowAddEducation(false);\n\t\tsetSelectedEducation(null);',
    '\t\tsetLoading(false);\n\t\tsetPendidikanList([]);'
)

# Remove handlers
handlers_regex = r'\tconst handleEditEducation \= \(\w+\) \=\> \{[\s\S]*?setShowAddEducation\(false\);\n\t\};\n'
content = re.sub(handlers_regex, '', content)

# Remove fetch riwayat in EditProfileModal
fetch_regex = r'\s*\/\/ Fetch riwayat pendidikan\n\s*const educationResponse = await fetch\("\/api\/profile\/education"\);\n\s*const educationData = await educationResponse\.json\(\);\n\n\s*if \(educationData\.status === 200\) \{\n\s*setEducationHistory\(educationData\.data\);\n\s*\}\n'
content = re.sub(fetch_regex, '', content)

# Remove AddEducationModal inside EditProfileModal
modal_regex = r'\t\t\t\t<AddEducationModal\s+isOpen=\{showAddEducation\}[\s\S]*?pendidikanList=\{pendidikanList\}\n\t\t\t\/>\n'
content = re.sub(modal_regex, '', content)

# Remove commented out block (lines 501-602 approx)
# Search for {/* Riwayat Pendidikan */} to pulse />
riwayat_comment_regex = r'\s*\{\/\* Riwayat Pendidikan \*\/\}\n\s*\{\/\* <div className="mb-6">[\s\S]*?<\/div> \*\/\}\n'
content = re.sub(riwayat_comment_regex, '\n', content)


# Remove the 3 huge components: AddEducationModal, EducationDocumentModal, ProfileEducationHistory
huge_components_regex = r'\/\/ Komponen Modal untuk Menambah\/Edit Riwayat Pendidikan[\s\S]*?(?=export default function ProfilePage)'
content = re.sub(huge_components_regex, '', content)

# Render update
content = content.replace(
    '<ProfileEducationHistory educationHistory={educationHistory} />',
    '<EducationHistorySection initialData={educationHistory} />'
)

with open('src/app/dashboard/profile/page.js', 'w') as f:
    f.write(content)

print("Refactoring complete.")
