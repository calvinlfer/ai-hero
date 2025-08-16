import { Timer } from 'lucide-react';

interface RateLimitedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RateLimitedModal = ({ isOpen, onClose }: RateLimitedModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-gray-900 p-6 shadow-xl">
        <div className="flex gap-2 justify-end">
          <Timer className="text-gray-200" />
          <h2 className="mb-4 text-xl font-semibold text-gray-200">
            You have made too many requests today
          </h2>
        </div>
        <p className="mb-6 text-gray-400">
          Please try again tomorrow.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded px-4 py-2 text-gray-400 hover:text-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
