import React from 'react';
import { Card, Button } from '../../ui';
import { FiAward, FiPlus } from 'react-icons/fi';

const CertificationsCard = ({ certifications = [], editable = true }) => {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <FiAward className="text-yellow-500" /> Certifications
        </h3>
        {editable && (
          <button className="text-blue-600 hover:text-blue-700 text-sm">
            <FiPlus />
          </button>
        )}
      </div>
      <div className="space-y-3">
        {certifications.map((cert) => (
          <div key={cert.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
            <div className="bg-white p-1.5 rounded shadow-sm">
              <FiAward className="text-yellow-600 w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{cert.name}</p>
              <p className="text-xs text-gray-500">{cert.issuer} • {cert.date}</p>
            </div>
          </div>
        ))}
        {editable && (
          <Button variant="ghost" size="sm" fullWidth className="text-gray-500 text-xs border-dashed border">
            + Upload Certificate
          </Button>
        )}
      </div>
    </Card>
  );
};

export default CertificationsCard;
