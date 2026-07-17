// src/pages/recruitment/ResumeInfo.jsx
import { useState, useEffect } from 'react';
import { getStore, STORAGE_KEYS } from '../../utils/store';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import { Clipboard, FileText } from 'lucide-react';

// Simple extraction helpers (mirroring the logic in ResumeExtractorModal)
function extractInfoFromText(text) {
  const lower = text.toLowerCase();
  const expMatch = text.match(/(\d+)\s*\+?\s*(?:years?|yrs?)/i);
  const years = expMatch ? expMatch[1] : '';
  const skillKeywords = ['javascript', 'python', 'react', 'node', 'sql', 'java', 'typescript', 'html', 'css', 'aws', 'docker', 'kubernetes', 'git', 'agile'];
  const foundSkills = skillKeywords.filter((s) => lower.includes(s));
  const skills = foundSkills.join(', ');
  const roleMatch = text.match(/(?:role|position|title|as)[:\s]+([A-Z][A-Za-z\s]*(?:Engineer|Developer|Manager|Lead|Senior|Junior|Analyst))/i);
  const role = roleMatch ? roleMatch[1].trim() : '';
  // A very naive name extraction – take the first line that looks like a name (two words capitalized)
  const nameMatch = text.match(/^[A-Z][a-z]+\s+[A-Z][a-z]+/m);
  const name = nameMatch ? nameMatch[0].trim() : '';
  return { name, skills, yearsOfExperience: years, role };
}

export default function ResumeInfo() {
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState(null); // candidate id
  const [extracted, setExtracted] = useState({});
  const [manual, setManual] = useState({
    currentCTC: '',
    expectedCTC: '',
    immediateJoining: false,
    noticePeriod: '',
  });

  useEffect(() => {
    const data = getStore(STORAGE_KEYS.CANDIDATES) || [];
    setCandidates(data);
  }, []);

  const handleExtract = async (cand) => {
    if (!cand.resume) {
      alert('No resume data available for this candidate');
      return;
    }
    const prefix = cand.resume.split(',')[0];
    const isBase64 = /base64/.test(prefix);
    let text = '';
    // Check if PDF
    const isPdf = /application\/pdf/.test(prefix);
    if (isPdf) {
      // PDF extraction using pdfjs
      setLoading(true);
      try {
        const base64 = cand.resume.split(',')[1] || '';
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
        let fullText = '';
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const content = await page.getTextContent();
          const strings = content.items.map(item => item.str);
          fullText += strings.join(' ') + '\n';
        }
        text = fullText;
      } catch (e) {
        console.error('PDF extraction failed', e);
        alert('Failed to extract text from PDF');
      }
      setLoading(false);
    } else if (isBase64) {
      try {
        const decoded = atob(cand.resume.split(',')[1] || '');
        text = decoded;
      } catch (e) {
        console.error('Failed to decode resume', e);
      }
    } else {
      text = cand.resume;
    }
    const info = extractInfoFromText(text);
    setExtracted(info);
    setSelected(cand.id);
    // reset manual fields
    setManual({ currentCTC: '', expectedCTC: '', immediateJoining: false, noticePeriod: '' });
  };

  const handleCopy = async () => {
    const { name, skills, yearsOfExperience, role } = extracted;
    const { currentCTC, expectedCTC, immediateJoining, noticePeriod } = manual;
    const clipboardText = `Name: ${name}\nSkills: ${skills}\nYears of Experience: ${yearsOfExperience}\nRole: ${role}\nCurrent CTC: ${currentCTC}\nExpected CTC: ${expectedCTC}\nImmediate Joining: ${immediateJoining ? 'Yes' : 'No'}\nNotice Period: ${noticePeriod}`;
    try {
      await navigator.clipboard.writeText(clipboardText);
      alert('Information copied to clipboard');
    } catch (e) {
      console.error(e);
      alert('Failed to copy to clipboard');
    }
  };

  const updateManual = (field, value) => {
    setManual((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="page-title">Resume Information</h1>
      <div className="card p-4">
        <h2 className="section-title mb-4">Candidates</h2>
        <table className="w-full border">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Resume File</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-2">{c.firstName} {c.lastName}</td>
                <td className="p-2">{c.resumeName || '—'}</td>
                <td className="p-2 text-center">
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => handleExtract(c)}
                    disabled={loading}
                  >
                    {loading ? 'Extracting...' : <><FileText className="inline mr-1" /> Extract</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="card p-4 space-y-4">
          <h2 className="section-title">Extracted & Manual Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Name</label>
              <input className="input" value={extracted.name || ''} readOnly />
            </div>
            <div>
              <label className="label">Role</label>
              <input className="input" value={extracted.role || ''} readOnly />
            </div>
            <div>
              <label className="label">Years of Experience</label>
              <input className="input" value={extracted.yearsOfExperience || ''} readOnly />
            </div>
            <div>
              <label className="label">Skills</label>
              <input className="input" value={extracted.skills || ''} readOnly />
            </div>
            <div>
              <label className="label">Current CTC</label>
              <input
                className="input"
                value={manual.currentCTC}
                onChange={(e) => updateManual('currentCTC', e.target.value)}
                placeholder="e.g., 80,000"
              />
            </div>
            <div>
              <label className="label">Expected CTC</label>
              <input
                className="input"
                value={manual.expectedCTC}
                onChange={(e) => updateManual('expectedCTC', e.target.value)}
                placeholder="e.g., 100,000"
              />
            </div>
            <div className="flex items-center">
              <label className="label mr-2">Immediate Joining</label>
              <input
                type="checkbox"
                checked={manual.immediateJoining}
                onChange={(e) => updateManual('immediateJoining', e.target.checked)}
              />
            </div>
            <div>
              <label className="label">Notice Period</label>
              <input
                className="input"
                value={manual.noticePeriod}
                onChange={(e) => updateManual('noticePeriod', e.target.value)}
                placeholder="e.g., 30 days"
              />
            </div>
          </div>
          <button className="btn btn-primary mt-4" onClick={handleCopy}>
            <Clipboard className="inline mr-1" /> Copy to Clipboard
          </button>
        </div>
      )}
    </div>
  );
}
