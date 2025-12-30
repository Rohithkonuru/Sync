import React from 'react';
import { Card, Button } from '../../ui';
import { FiBookOpen, FiEdit2 } from 'react-icons/fi';

const EducationCard = ({ education = [], editable = true }) => {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <FiBookOpen className="text-blue-500" /> Education
        </h3>
        {editable && (
          <button className="text-blue-600 hover:text-blue-700 text-sm">Edit</button>
        )}
      </div>
      <div className="space-y-4">
        {education.map((edu, idx) => (
          <div key={idx} className="relative pl-4 border-l-2 border-gray-100">
            <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-blue-500"></div>
            <h4 className="font-medium text-gray-900">{edu.school}</h4>
            <p className="text-sm text-gray-600">{edu.degree}</p>
            <p className="text-xs text-gray-500 mt-1">{edu.year} • GPA: {edu.gpa}</p>
          </div>
        ))}
        {education.length === 0 && (
          <p className="text-sm text-gray-500">No education details added.</p>
        )}
      </div>
    </Card>
  );
};

export default EducationCard;
