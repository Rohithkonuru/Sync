import React from 'react';

const mockViewers = [
  { id: '1', name: 'Google', when: '2 days ago' },
  { id: '2', name: 'Amazon', when: '1 week ago' },
  { id: '3', name: 'Meta', when: '2 weeks ago' },
];

const ProfileViewsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile Views</h1>
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {mockViewers.map((viewer) => (
            <div key={viewer.id} className="p-4 flex items-center justify-between">
              <span className="font-medium text-gray-800">{viewer.name}</span>
              <span className="text-sm text-gray-500">{viewer.when}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileViewsPage;
