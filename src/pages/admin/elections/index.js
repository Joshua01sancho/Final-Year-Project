import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  BarChart3, 
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreVertical
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthProvider';
import { apiClient } from '../../../lib/api';
import Navbar from '../../../components/common/Navbar';
import Footer from '../../../components/common/Footer';
import toast from 'react-hot-toast';

const AdminElectionsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [elections, setElections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedElection, setSelectedElection] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      loadElections();
    }
  }, [isAuthenticated, user]);

  const loadElections = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getElections();
      if (response.success) {
        setElections(response.data || []);
      } else {
        setError('Failed to load elections');
      }
    } catch (err) {
      setError('Failed to load elections');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteElection = async () => {
    if (!selectedElection) return;

    try {
      const response = await apiClient.deleteElection(selectedElection.id);
      if (response.success) {
        toast.success('Election deleted successfully');
        loadElections();
        setShowDeleteModal(false);
        setSelectedElection(null);
      } else {
        toast.error(response.error || 'Failed to delete election');
      }
    } catch (err) {
      toast.error('Failed to delete election');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Clock className="h-3 w-3 mr-1" />
            Draft
          </span>
        );
      case 'ended':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Ended
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error-100 text-error-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-error-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Manage Elections - Admin Dashboard</title>
      </Head>

      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        <main className="flex-grow py-8">
          <div className="container-responsive">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Manage Elections
                </h1>
                <p className="text-gray-600">
                  Create, edit, and monitor all elections in the system
                </p>
              </div>
              <Link
                href="/admin/elections/create"
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Election
              </Link>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg">
                <p className="text-error-700">{error}</p>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="stats-card">
                <div className="flex items-center">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Elections</p>
                    <p className="text-2xl font-bold text-gray-900">{elections.length}</p>
                  </div>
                </div>
              </div>

              <div className="stats-card">
                <div className="flex items-center">
                  <div className="p-2 bg-success-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-success-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {elections.filter(e => e.status === 'active').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="stats-card">
                <div className="flex items-center">
                  <div className="p-2 bg-warning-100 rounded-lg">
                    <Clock className="h-6 w-6 text-warning-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Draft</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {elections.filter(e => e.status === 'draft').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="stats-card">
                <div className="flex items-center">
                  <div className="p-2 bg-error-100 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-error-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Ended</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {elections.filter(e => e.status === 'ended').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Elections List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : elections.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No elections found</h3>
                <p className="text-gray-600 mb-6">Get started by creating your first election.</p>
                <Link href="/admin/elections/create" className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Election
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {elections.map((election) => (
                  <div key={election.id} className="card hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {election.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {election.description}
                        </p>
                        {getStatusBadge(election.status)}
                      </div>
                      <div className="dropdown">
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        <div className="dropdown-menu">
                          <Link
                            href={`/admin/elections/${election.id}`}
                            className="dropdown-item"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                          <Link
                            href={`/admin/elections/${election.id}/edit`}
                            className="dropdown-item"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                          <Link
                            href={`/admin/elections/${election.id}/analytics`}
                            className="dropdown-item"
                          >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Analytics
                          </Link>
                          <button
                            onClick={() => {
                              setSelectedElection(election);
                              setShowDeleteModal(true);
                            }}
                            className="dropdown-item text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>
                          {formatDate(election.startDate)} - {formatDate(election.endDate)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        <span>{election.candidates?.length || 0} candidates</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex space-x-2">
                        <Link
                          href={`/admin/elections/${election.id}`}
                          className="btn-secondary flex-1 text-center"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Link>
                        <Link
                          href={`/admin/elections/${election.id}/edit`}
                          className="btn-primary flex-1 text-center"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        <Footer />

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Delete Election
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{selectedElection?.title}"? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteElection}
                  className="btn-error flex-1"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminElectionsPage; 