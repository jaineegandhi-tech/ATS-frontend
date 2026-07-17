import { useState, useEffect } from 'react';
import { Upload, Copy, X, Download } from 'lucide-react';
import { getDocument } from 'pdfjs-dist/build/pdf';
import { jsPDF } from 'jspdf';
import Modal from './Modal';

export default function ResumeExtractorModal({ isOpen, onClose, onSave, existingData = {}, resumeFile = null }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [formData, setFormData] = useState({
    yearsOfExperience: '',
    skills: '',
    expertise: '',
    currentCTC: '',
    expectedCTC: '',
    negotiable: false,
    noticePeriod: '',
    immediateJoining: false,
  });
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        yearsOfExperience: existingData.yearsOfExperience || '',
        skills: existingData.skills || '',
        expertise: existingData.expertise || '',
        currentCTC: existingData.currentCTC || '',
        expectedCTC: existingData.expectedCTC || '',
        negotiable: existingData.negotiable || false,
        noticePeriod: existingData.noticePeriod || '',
        immediateJoining: existingData.immediateJoining || false,
      });
      setSelectedFile(null);
      setExtractedText('');
      setShowPreview(false);
    }
  }, [isOpen, existingData]);

  useEffect(() => {
    if (isOpen && resumeFile) handleFile(resumeFile);
  }, [isOpen, resumeFile]);

  const handleFile = async (file) => {
    setSelectedFile(file);
    if (file.type.includes('pdf')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          fullText += content.items.map(item => item.str).join(' ') + '\n';
        }
        setExtractedText(fullText);
        suggestValues(fullText);
      } catch (err) {
        console.error('Failed to parse PDF:', err);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (e) => { setExtractedText(e.target.result); suggestValues(e.target.result); };
      reader.readAsText(file);
    }
  };

  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const suggestValues = (text) => {
    const lower = text.toLowerCase();
    const expMatch = text.match(/(\d+)\s*\+?\s*(years?|yrs?)/i);
    if (expMatch) setFormData(prev => ({ ...prev, yearsOfExperience: expMatch[1] }));
    const skillKeywords = ['javascript','python','react','node','sql','java','typescript','html','css','aws','docker','kubernetes','git','agile'];
    const found = skillKeywords.filter(s => lower.includes(s));
    if (found.length) setFormData(prev => ({ ...prev, skills: found.join(', ') }));
  };

  const handleFormChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const copyToClipboard = () => {
    const tableData = `Years of Experience\t${formData.yearsOfExperience}\nSkills\t${formData.skills}\nExpertise\t${formData.expertise}\nCurrent CTC\t${formData.currentCTC}\nExpected CTC\t${formData.expectedCTC}\nNegotiable\t${formData.negotiable ? 'Yes' : 'No'}\nNotice Period\t${formData.noticePeriod}\nImmediate Joining\t${formData.immediateJoining ? 'Yes' : 'No'}`;
    navigator.clipboard.writeText(tableData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAsTable = () => {
    const doc = new jsPDF();
    doc.setFillColor(249, 168, 212);
    doc.roundedRect(20, 15, 12, 12, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('ATS', 23, 23);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text('Candidate Information Summary', 38, 21);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Applicant Tracking System · Telephonic Interview Info', 38, 26);
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.5);
    doc.line(20, 32, 190, 32);
    doc.setFillColor(248, 250, 252);
    doc.rect(20, 38, 170, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text('FIELD', 24, 44);
    doc.text('VALUE', 90, 44);
    doc.line(20, 48, 190, 48);

    const rows = [
      ['Years of Experience', formData.yearsOfExperience || '—'],
      ['Skills', formData.skills || '—'],
      ['Expertise', formData.expertise || '—'],
      ['Current CTC', formData.currentCTC || '—'],
      ['Expected CTC', formData.expectedCTC || '—'],
      ['Negotiable', formData.negotiable ? 'Yes' : 'No'],
      ['Notice Period', formData.noticePeriod || '—'],
      ['Immediate Joining', formData.immediateJoining ? 'Yes' : 'No'],
    ];

    let currentY = 56;
    doc.setFontSize(10);
    rows.forEach(([field, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(field, 24, currentY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      if (field === 'Skills' && value.length > 50) {
        const lines = doc.splitTextToSize(value, 95);
        doc.text(lines, 90, currentY);
        currentY += (lines.length * 5) + 3;
      } else {
        doc.text(value, 90, currentY);
        currentY += 8;
      }
      doc.setDrawColor(241, 245, 249);
      doc.line(20, currentY - 3, 190, currentY - 3);
      currentY += 5;
    });

    doc.setDrawColor(226, 232, 240);
    doc.line(20, 272, 190, 272);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 280);
    doc.text('Confidential · Internal HR Use Only', 138, 280);
    doc.save('candidate_info.pdf');
  };

  if (!isOpen) return null;

  return (
    <Modal title={showPreview ? 'Telephonic Interview Info – Preview' : 'Telephonic Interview Info'} onClose={onClose} size="lg">
      <div className="space-y-4">
        {!showPreview ? (
          <>
            <div className="mb-4">
              {!selectedFile ? (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-6 cursor-pointer hover:border-primary hover:bg-slate-50/50 transition-colors">
                  <Upload size={20} className="text-gray-400 mb-1" />
                  <p className="text-sm text-gray-600 font-medium">Click to upload resume</p>
                  <p className="text-xs text-gray-400 mt-0.5">PDF or text file · Max 10MB</p>
                  <input type="file" accept=".pdf,.txt,.doc,.docx" className="hidden" onChange={handleResumeUpload} />
                </label>
              ) : (
                <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary-600">
                      <Upload size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">{selectedFile.name}</p>
                      <p className="text-xs text-gray-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedFile(null); setExtractedText(''); }} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <X size={15} />
                  </button>
                </div>
              )}
            </div>

            {extractedText && (
              <div className="border border-gray-100 rounded-xl p-4 mb-4 max-h-40 overflow-y-auto bg-gray-50/50">
                <h3 className="font-semibold text-xs text-gray-500 uppercase tracking-wide mb-2">Extracted Text Preview</h3>
                <pre className="whitespace-pre-wrap text-xs text-gray-600 font-mono leading-relaxed">{extractedText}</pre>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="label">Years of Experience</label>
                  <input type="number" className="input" value={formData.yearsOfExperience} onChange={e => handleFormChange('yearsOfExperience', e.target.value)} />
                </div>
                <div>
                  <label className="label">Skills (comma separated)</label>
                  <input type="text" className="input" value={formData.skills} onChange={e => handleFormChange('skills', e.target.value)} />
                </div>
                <div>
                  <label className="label">Expertise</label>
                  <input type="text" className="input" value={formData.expertise} onChange={e => handleFormChange('expertise', e.target.value)} />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="label">Current CTC</label>
                  <input type="text" className="input" value={formData.currentCTC} onChange={e => handleFormChange('currentCTC', e.target.value)} />
                </div>
                <div>
                  <label className="label">Expected CTC</label>
                  <input type="text" className="input" value={formData.expectedCTC} onChange={e => handleFormChange('expectedCTC', e.target.value)} />
                </div>
                <div>
                  <label className="label">Notice Period</label>
                  <input type="text" className="input" value={formData.noticePeriod} onChange={e => handleFormChange('noticePeriod', e.target.value)} />
                </div>
                <div className="flex flex-col gap-3 pt-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" checked={formData.negotiable} onChange={e => handleFormChange('negotiable', e.target.checked)} />
                    Negotiable
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" checked={formData.immediateJoining} onChange={e => handleFormChange('immediateJoining', e.target.checked)} />
                    Immediate Joining
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
              <button onClick={onClose} className="btn btn-secondary">Cancel</button>
              <button onClick={() => setShowPreview(true)} className="btn btn-primary">Preview</button>
            </div>
          </>
        ) : (
          <>
            <div className="border border-gray-100 rounded-xl overflow-hidden mb-4">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="table-th">Field</th>
                    <th className="table-th">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Years of Experience', formData.yearsOfExperience],
                    ['Skills', formData.skills],
                    ['Expertise', formData.expertise],
                    ['Current CTC', formData.currentCTC],
                    ['Expected CTC', formData.expectedCTC],
                    ['Negotiable', formData.negotiable ? 'Yes' : 'No'],
                    ['Notice Period', formData.noticePeriod],
                    ['Immediate Joining', formData.immediateJoining ? 'Yes' : 'No'],
                  ].map(([label, value]) => (
                    <tr key={label} className="table-row">
                      <td className="table-td font-medium text-gray-500">{label}</td>
                      <td className="table-td font-semibold text-gray-900">{value || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
              <button onClick={() => setShowPreview(false)} className="btn btn-secondary">Back</button>
              <button onClick={copyToClipboard} className="btn btn-secondary flex items-center gap-1.5">
                <Copy size={15} />{copied ? 'Copied!' : 'Copy'}
              </button>
              <button onClick={downloadAsTable} className="btn btn-secondary flex items-center gap-1.5">
                <Download size={15} />Export
              </button>
              <button onClick={() => { onSave(formData); onClose(); }} className="btn btn-primary">Save</button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
