const StatusBadge = ({ status }) => {
  const baseClasses =
    'inline-block rounded-full px-3.5 py-1.5 text-sm font-semibold uppercase tracking-wide';

  const getStatusClasses = () => {
    switch (status) {
      case 'GREEN':
      case 'VERIFIED':
        return 'bg-green-100 text-green-800';

      case 'YELLOW':
      case 'FLAGGED':
        return 'bg-yellow-100 text-yellow-800';

      case 'RED':
      case 'REJECTED':
        return 'bg-red-100 text-red-800';

      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  return (
    <span className={`${baseClasses} ${getStatusClasses()}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
