import { motion, AnimatePresence } from "framer-motion";
import { X, PhoneCall } from "lucide-react";

export const EmergencyModal = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-t-4 border-blue-500 text-center relative"
          >
            <div className="absolute top-4 right-4 cursor-pointer text-gray-400 hover:text-gray-700" onClick={onClose}>
              <X size={24} />
            </div>

            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
              <PhoneCall size={32} />
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">You are not alone 💙</h2>
            <p className="text-gray-600 mb-6">
              We are here to support you. Please reach out to someone who can help right now.
            </p>

            <div className="flex flex-col gap-3">
              <a 
                href="tel:+912227546669"
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
              >
                Call: +91-22-27546669
              </a>
              <button 
                onClick={onClose}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
