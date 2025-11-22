import { Briefcase, Code, ShoppingBag, Megaphone, Headphones } from 'lucide-react';
import { RoleType, roleConfigs } from '../lib/interviewLogic';

interface RoleSelectionProps {
  onSelectRole: (role: RoleType) => void;
}

const roleIcons: Record<RoleType, typeof Briefcase> = {
  sales: Briefcase,
  engineer: Code,
  retail_associate: ShoppingBag,
  marketing: Megaphone,
  customer_service: Headphones,
};

export default function RoleSelection({ onSelectRole }: RoleSelectionProps) {
  const roles: RoleType[] = ['sales', 'engineer', 'retail_associate', 'marketing', 'customer_service'];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Role</h2>
        <p className="text-gray-600">Select the position you'd like to practice interviewing for</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role) => {
          const Icon = roleIcons[role];
          const config = roleConfigs[role];

          return (
            <button
              key={role}
              onClick={() => onSelectRole(role)}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-1 text-left group border-2 border-transparent hover:border-blue-500"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                  <Icon className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{config.title}</h3>
                  <p className="text-sm text-gray-600">{config.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
