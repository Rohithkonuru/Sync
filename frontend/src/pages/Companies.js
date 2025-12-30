import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { companyService, jobService } from '../services/api';
import { FiBuilding, FiMapPin, FiGlobe, FiBriefcase } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Companies = () => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    name: '',
    industry: '',
  });

  useEffect(() => {
    loadCompanies();
  }, [filters]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await companyService.getCompanies(filters);
      setCompanies(data);
    } catch (error) {
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Companies</h1>
        {user?.user_type === 'recruiter' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Create Company
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name
            </label>
            <input
              type="text"
              value={filters.name}
              onChange={(e) => handleFilterChange('name', e.target.value)}
              placeholder="Search companies..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry
            </label>
            <input
              type="text"
              value={filters.industry}
              onChange={(e) => handleFilterChange('industry', e.target.value)}
              placeholder="Filter by industry..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Companies Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No companies found. Try adjusting your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateCompanyModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={async () => {
            setShowCreateModal(false);
            await loadCompanies();
          }}
        />
      )}
    </div>
  );
};

const CompanyCard = ({ company }) => {
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  useEffect(() => {
    loadCompanyJobs();
  }, [company.id]);

  const loadCompanyJobs = async () => {
    try {
      setLoadingJobs(true);
      const data = await companyService.getCompanyJobs(company.id);
      setJobs(data);
    } catch (error) {
      console.error('Error loading company jobs:', error);
    } finally {
      setLoadingJobs(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
      <div className="flex items-start space-x-4 mb-4">
        {company.logo ? (
          <img
            src={company.logo}
            alt={company.name}
            className="w-16 h-16 rounded-lg object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-primary-600 flex items-center justify-center text-white text-2xl font-bold">
            {company.name?.[0] || 'C'}
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-1">{company.name}</h3>
          {company.industry && (
            <p className="text-sm text-gray-600">{company.industry}</p>
          )}
        </div>
      </div>

      {company.location && (
        <div className="flex items-center text-gray-600 mb-2">
          <FiMapPin className="w-4 h-4 mr-1" />
          <span className="text-sm">{company.location}</span>
        </div>
      )}

      {company.website && (
        <div className="flex items-center text-gray-600 mb-2">
          <FiGlobe className="w-4 h-4 mr-1" />
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary-600 hover:underline"
          >
            {company.website}
          </a>
        </div>
      )}

      {company.description && (
        <p className="text-gray-700 text-sm mb-4 line-clamp-3">
          {company.description}
        </p>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center text-gray-600">
          <FiBriefcase className="w-4 h-4 mr-1" />
          <span className="text-sm">
            {loadingJobs ? 'Loading...' : `${jobs.length} Open Jobs`}
          </span>
        </div>
        <Link
          to={`/companies/${company.id}`}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
};

const CreateCompanyModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    location: '',
    industry: '',
    size: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await companyService.createCompany(formData);
      toast.success('Company created successfully!');
      onSuccess();
    } catch (error) {
      toast.error('Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Create Company</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              required
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Industry
              </label>
              <input
                type="text"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Companies;

