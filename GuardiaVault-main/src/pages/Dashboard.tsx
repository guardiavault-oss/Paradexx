import React from 'react';
import { Shield, Key, FileText, Activity } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">GuardiaVault Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Shield className="h-12 w-12 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Vaults</p>
                <p className="text-2xl font-semibold">3</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Key className="h-12 w-12 text-green-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Stored Passwords</p>
                <p className="text-2xl font-semibold">24</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <FileText className="h-12 w-12 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Secure Notes</p>
                <p className="text-2xl font-semibold">12</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Activity className="h-12 w-12 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Recent Activity</p>
                <p className="text-2xl font-semibold">5</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Items */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">Recent Items</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
                <div className="flex items-center">
                  <Key className="h-5 w-5 text-gray-500 mr-3" />
                  <div>
                    <p className="font-medium">GitHub Account</p>
                    <p className="text-sm text-gray-500">Updated 2 hours ago</p>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-800">View</button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-500 mr-3" />
                  <div>
                    <p className="font-medium">API Keys Document</p>
                    <p className="text-sm text-gray-500">Updated yesterday</p>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-800">View</button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
                <div className="flex items-center">
                  <Key className="h-5 w-5 text-gray-500 mr-3" />
                  <div>
                    <p className="font-medium">Email Account</p>
                    <p className="text-sm text-gray-500">Updated 3 days ago</p>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-800">View</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
