
import React, { useState } from 'react';
import { Users, Search, Shield, Mail, Settings, Lock } from 'lucide-react';

const initialUsers = [
    { id: 1, name: 'Jane Doe', email: 'jane.doe@acme.com', role: 'General User', region: 'Global', status: 'Active', riskProfile: 'Low' },
    { id: 2, name: 'John Smith', email: 'john.smith@acme.com', role: 'Admin', region: 'North America', status: 'Active', riskProfile: 'Low' },
    { id: 3, name: 'Sarah Connor', email: 'sarah.c@acme.com', role: 'General User', region: 'Europe', status: 'Inactive', riskProfile: 'High' },
    { id: 4, name: 'Mike Ross', email: 'mike.ross@acme.com', role: 'General User', region: 'APAC', status: 'Active', riskProfile: 'Medium' },
    { id: 5, name: 'Jessica Pearson', email: 'j.pearson@acme.com', role: 'Admin', region: 'Global', status: 'Active', riskProfile: 'Low' },
];

export const UserManagement: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [users] = useState(initialUsers);
    const [selectedUser, setSelectedUser] = useState<number | null>(null);

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="relative w-96">
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="bg-[#E2000F] text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#c2000d] transition-colors shadow-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Add New User
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Risk Profile</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${selectedUser === user.id ? 'bg-indigo-50/50' : ''}`} onClick={() => setSelectedUser(user.id)}>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 border border-slate-200">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 text-sm">{user.name}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Mail className="h-3 w-3" /> {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${user.role === 'Admin' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                                            <Shield className="h-3 w-3" />
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${user.riskProfile === 'High' ? 'bg-red-500' :
                                                user.riskProfile === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                                                }`}></div>
                                            <span className="text-xs font-medium text-slate-700">{user.riskProfile} Risk</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors">
                                            <Settings className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Permissions Panel */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 h-fit">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Lock className="h-4 w-4 text-slate-400" />
                        Permissions & Access
                    </h3>
                    {selectedUser ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">View Compliance Scores</span>
                                <input type="checkbox" defaultChecked className="toggle" />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">Modify Visual Rules</span>
                                <input type="checkbox" defaultChecked={users.find(u => u.id === selectedUser)?.role === 'Admin'} className="toggle" />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">Approve High-Risk Assets</span>
                                <input type="checkbox" defaultChecked={users.find(u => u.id === selectedUser)?.role === 'Admin'} className="toggle" />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">Export Audit Logs</span>
                                <input type="checkbox" defaultChecked={users.find(u => u.id === selectedUser)?.role === 'Admin'} className="toggle" />
                            </div>
                            <hr className="border-slate-200" />
                            <div className="text-xs text-slate-400">
                                User ID: {selectedUser} • Region Lock: {users.find(u => u.id === selectedUser)?.region}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-slate-400 py-8 text-sm">
                            Select a user to configure permissions.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
