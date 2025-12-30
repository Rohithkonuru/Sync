import React, { useState } from 'react';
import { Card, Badge, Button } from '../../ui';
import { FiAward, FiPlus, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const SkillsWidget = ({ skills = [], onAddSkill, onRemoveSkill, editable = true }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (newSkill.trim()) {
      onAddSkill(newSkill.trim());
      setNewSkill('');
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <FiAward className="text-purple-500" /> Skills
        </h3>
        {editable && (
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            {isEditing ? 'Done' : 'Edit'}
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {skills.map((skill, idx) => (
          <Badge key={idx} variant="neutral" className="bg-gray-100 text-gray-700">
            {skill}
            {isEditing && (
              <button 
                onClick={() => onRemoveSkill(skill)} 
                className="ml-1 text-gray-400 hover:text-red-500"
              >
                <FiX className="w-3 h-3" />
              </button>
            )}
          </Badge>
        ))}
        {skills.length === 0 && !isEditing && (
          <p className="text-sm text-gray-500">No skills added yet.</p>
        )}
      </div>

      {isEditing && (
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Add skill..."
            className="flex-1 text-sm border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <Button type="submit" size="sm" disabled={!newSkill.trim()}>Add</Button>
        </form>
      )}
    </Card>
  );
};

export default SkillsWidget;
