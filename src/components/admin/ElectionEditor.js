import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, Users, Calendar, Settings, Vote } from 'lucide-react';

const ElectionEditor = ({ election = null, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'draft',
    type: 'single',
    isPublic: true,
    maxSelections: 1,
    instructions: '',
    candidates: [],
  });

  const [newCandidate, setNewCandidate] = useState({
    name: '',
    party: '',
    description: '',
    imageUrl: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (election) {
      setFormData({
        title: election.title || '',
        description: election.description || '',
        startDate: election.startDate ? new Date(election.startDate).toISOString().split('T')[0] : '',
        endDate: election.endDate ? new Date(election.endDate).toISOString().split('T')[0] : '',
        status: election.status || 'draft',
        type: election.type || 'single',
        isPublic: election.isPublic !== undefined ? election.isPublic : true,
        maxSelections: election.maxSelections || 1,
        instructions: election.instructions || '',
        candidates: election.candidates || [],
      });
    }
  }, [election]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (formData.candidates.length < 2) newErrors.candidates = 'At least 2 candidates are required';
    if (formData.type === 'multiple' && formData.maxSelections < 1) {
      newErrors.maxSelections = 'Max selections must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const addCandidate = () => {
    if (!newCandidate.name.trim()) {
      setErrors(prev => ({ ...prev, newCandidate: 'Candidate name is required' }));
      return;
    }

    const candidate = {
      id: Date.now().toString(),
      ...newCandidate,
      position: formData.candidates.length + 1,
    };

    setFormData(prev => ({
      ...prev,
      candidates: [...prev.candidates, candidate],
    }));

    setNewCandidate({
      name: '',
      party: '',
      description: '',
      imageUrl: '',
    });

    setErrors(prev => ({ ...prev, newCandidate: '' }));
  };

  const removeCandidate = (id) => {
    setFormData(prev => ({
      ...prev,
      candidates: prev.candidates.filter(c => c.id !== id),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const electionData = {
      ...formData,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      createdAt: election ? election.createdAt : new Date(),
      updatedAt: new Date(),
    };

    onSave(electionData);
  };

  const votingTypes = [
    { value: 'single', label: 'Single Choice', description: 'Voters select one candidate' },
    { value: 'multiple', label: 'Multiple Choice', description: 'Voters can select multiple candidates' },
    { value: 'ranked', label: 'Ranked Choice', description: 'Voters rank candidates in order of preference' },
  ];

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'ended', label: 'Ended' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {election ? 'Edit Election' : 'Create New Election'}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={onCancel}
              className="btn-secondary"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="btn-primary"
            >
              <Save className="h-4 w-4 mr-2" />
              {election ? 'Update Election' : 'Create Election'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Election Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`input ${errors.title ? 'input-error' : ''}`}
                placeholder="Enter election title"
              />
              {errors.title && <p className="error-text">{errors.title}</p>}
            </div>

            <div>
              <label className="label">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="input"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className={`input ${errors.description ? 'input-error' : ''}`}
              placeholder="Describe the election and its purpose"
            />
            {errors.description && <p className="error-text">{errors.description}</p>}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Start Date *</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className={`input ${errors.startDate ? 'input-error' : ''}`}
              />
              {errors.startDate && <p className="error-text">{errors.startDate}</p>}
            </div>

            <div>
              <label className="label">End Date *</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className={`input ${errors.endDate ? 'input-error' : ''}`}
              />
              {errors.endDate && <p className="error-text">{errors.endDate}</p>}
            </div>
          </div>

          {/* Voting Configuration */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Vote className="h-5 w-5 mr-2" />
              Voting Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Voting Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="input"
                >
                  {votingTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  {votingTypes.find(t => t.value === formData.type)?.description}
                </p>
              </div>

              {formData.type === 'multiple' && (
                <div>
                  <label className="label">Max Selections</label>
                  <input
                    type="number"
                    name="maxSelections"
                    value={formData.maxSelections}
                    onChange={handleInputChange}
                    min="1"
                    className={`input ${errors.maxSelections ? 'input-error' : ''}`}
                  />
                  {errors.maxSelections && <p className="error-text">{errors.maxSelections}</p>}
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="label">Voting Instructions</label>
              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleInputChange}
                rows={2}
                className="input"
                placeholder="Instructions for voters (e.g., 'Select one candidate for President')"
              />
            </div>

            <div className="mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  Public Election (visible to all voters)
                </span>
              </label>
            </div>
          </div>

          {/* Candidates */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Candidates
            </h3>

            {errors.candidates && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{errors.candidates}</p>
              </div>
            )}

            {/* Add Candidate Form */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Add New Candidate</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Name *</label>
                  <input
                    type="text"
                    value={newCandidate.name}
                    onChange={(e) => setNewCandidate(prev => ({ ...prev, name: e.target.value }))}
                    className={`input ${errors.newCandidate ? 'input-error' : ''}`}
                    placeholder="Candidate name"
                  />
                  {errors.newCandidate && <p className="error-text">{errors.newCandidate}</p>}
                </div>

                <div>
                  <label className="label">Party</label>
                  <input
                    type="text"
                    value={newCandidate.party}
                    onChange={(e) => setNewCandidate(prev => ({ ...prev, party: e.target.value }))}
                    className="input"
                    placeholder="Political party"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="label">Description</label>
                  <textarea
                    value={newCandidate.description}
                    onChange={(e) => setNewCandidate(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="input"
                    placeholder="Brief description of the candidate"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="label">Image URL</label>
                  <input
                    type="url"
                    value={newCandidate.imageUrl}
                    onChange={(e) => setNewCandidate(prev => ({ ...prev, imageUrl: e.target.value }))}
                    className="input"
                    placeholder="https://example.com/candidate-image.jpg"
                  />
                </div>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={addCandidate}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Candidate
                </button>
              </div>
            </div>

            {/* Candidates List */}
            <div className="space-y-3">
              {formData.candidates.map((candidate, index) => (
                <div key={candidate.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-medium">{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{candidate.name}</h4>
                      {candidate.party && (
                        <p className="text-sm text-gray-600">{candidate.party}</p>
                      )}
                      {candidate.description && (
                        <p className="text-sm text-gray-500">{candidate.description}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCandidate(candidate.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {formData.candidates.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No candidates added yet</p>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ElectionEditor; 