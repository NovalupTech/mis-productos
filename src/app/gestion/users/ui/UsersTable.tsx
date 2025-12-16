'use client';

import { changeUserRole } from '@/actions';
import type { User } from '@/interfaces';

interface Props {
  users: User[];
}

export const UsersTable = ({ users }: Props) => {


  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-200 border-b">
            <tr>
              <th
                scope="col"
                className="text-sm font-medium text-gray-900 px-6 py-4 text-left"
              >
                Email
              </th>
              <th
                scope="col"
                className="text-sm font-medium text-gray-900 px-6 py-4 text-left"
              >
                Nombre completo
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="bg-white border-b transition duration-300 ease-in-out hover:bg-gray-100"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  { user.email }
                </td>
                <td className="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                  { user.name }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            <p className="text-sm font-semibold text-gray-900 mb-1">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        ))}
      </div>
    </>
  );
};