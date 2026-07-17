import { getInitials } from '../../utils/helpers';

const COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500',
  'bg-orange-500', 'bg-pink-500', 'bg-teal-500', 'bg-indigo-500',
];

export default function Avatar({ employee, size = 'md' }) {
  const sizes = {
    xs:  'w-6 h-6 text-[10px]',
    sm:  'w-8 h-8 text-xs',
    md:  'w-10 h-10 text-sm',
    lg:  'w-14 h-14 text-lg',
    xl:  'w-20 h-20 text-2xl',
  };
  const color = COLORS[(employee?.id?.charCodeAt(3) || 0) % COLORS.length];

  if (employee?.profilePicture) {
    return (
      <img
        src={employee.profilePicture}
        alt=""
        className={`${sizes[size]} rounded-full object-cover ring-2 ring-white flex-shrink-0`}
      />
    );
  }
  return (
    <div className={`${sizes[size]} ${color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ring-2 ring-white`}>
      {getInitials(employee?.firstName, employee?.lastName)}
    </div>
  );
}
