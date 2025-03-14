import { ArrowDown, ArrowUp } from "lucide-react";
import { motion } from "framer-motion";

function StatCard({ title, value, change, changeType }) {
  return (
    <motion.div
      className="rounded-lg outline outline-1 outline-gray-200 p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <motion.div 
        className="flex items-center justify-between pb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      </motion.div>
      <div className="flex items-center justify-between">
        <motion.div 
          className="text-2xl font-bold text-gray-700"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4, type: "spring" }}
        >
          {value}
        </motion.div>
        <motion.div 
          className="flex items-center justify-between mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          {changeType === 'positive' && <ArrowUp className="text-green-500"/>}
          {changeType === 'negative' && <ArrowDown className="text-red-500"/>}
        </motion.div>
      </div>
    </motion.div>
  );
}

export default StatCard;