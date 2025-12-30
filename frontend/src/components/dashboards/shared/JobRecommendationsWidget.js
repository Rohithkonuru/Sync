import React, { useState } from 'react';
import { Card, Badge, Button } from '../../ui';
import { FiBriefcase, FiBookmark, FiMapPin, FiSend } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import EnhancedApplicationForm from '../../EnhancedApplicationForm';

const JobRecommendationsWidget = ({ jobs = [], title = "Recommended for You" }) => {
  const navigate = useNavigate();
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <Button variant="ghost" size="sm" className="text-orange-600" onClick={() => navigate('/jobs')}>
          View All
        </Button>
      </div>
      
      {jobs.slice(0, 3).map((job) => (
        <Card key={job.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)}>
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
              {job.company_logo ? (
                <img src={job.company_logo} alt={job.company_name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <FiBriefcase className="text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 truncate">{job.title}</h4>
              <p className="text-sm text-gray-600 truncate">{job.company_name} • {job.location || 'Remote'}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="neutral" className="bg-gray-100 text-gray-600">{job.type || 'Full-time'}</Badge>
                {job.match_score && (
                  <Badge variant="success" className="bg-green-50 text-green-700">{job.match_score}% Match</Badge>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end justify-between shrink-0">
              <button className="text-gray-400 hover:text-orange-500" onClick={(e) => { e.stopPropagation(); /* handle save */ }}>
                <FiBookmark />
              </button>
              <span className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(job.created_at || Date.now()))}
              </span>
            </div>
          </div>
        </Card>
      ))}
      
      {jobs.length === 0 && (
        <Card>
          <p className="text-center text-gray-500 py-4">No recommendations yet.</p>
        </Card>
      )}

      {showApplyModal && selectedJob && (
        <EnhancedApplicationForm
          jobId={selectedJob.id || selectedJob._id}
          jobTitle={selectedJob.title}
          onClose={() => {
            setShowApplyModal(false);
            setSelectedJob(null);
          }}
          onSuccess={() => {
            setShowApplyModal(false);
            setSelectedJob(null);
            // Optionally refresh jobs or show success message
          }}
        />
      )}
    </div>
  );
};

export default JobRecommendationsWidget;
