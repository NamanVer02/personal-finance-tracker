import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = [
  "#8B5CF6",  // Purple-500
  "#6B46C1",  // Darker Purple
  "#9B4DCA",  // Slightly redder Purple
  "#4C51BF",  // Dark Blue
  "#2C5282",  // Navy Blue
  "#319795",  // Teal
  "#38B2AC",  // Light Teal
  "#F6AD55",  // Amber
  "#ED8936",  // Orange
  "#F56565",  // Red
  "#ED64A6",  // Pink
];

function GraphCard({ title, value, data }) {
  const darkMode = localStorage.getItem("darkMode");
  const [chartVisible, setChartVisible] = useState(false);
  const formattedData = Object.keys(data).map((key) => ({
    name: key,
    value: data[key],
  }));

  // Control when the pie chart should become visible
  useEffect(() => {
    const animateSequence = async () => {
      // Wait for the container to animate in
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for container animation
      setChartVisible(true);
    };
    
    animateSequence();
  }, []);

  const customTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-2 rounded-md shadow-md border border-gray-100 dark:border-gray-700">
          <p className="text-sm font-medium">{`${payload[0].name}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  const legendVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.div
      className="rounded-xl bg-gray-100 shadow-neumorphic p-6 w-full flex flex-col h-full"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</h3>
      </motion.div>
      <motion.div 
        className="text-xl font-bold text-gray-700 mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        {value}
      </motion.div>
      
      <div className="flex-grow flex justify-center items-center">
        <AnimatePresence>
          {chartVisible && (
            <motion.div
              className="aspect-square w-52 h-52 rounded-full shadow-neumorphic-inset flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={formattedData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={darkMode === "enabled" ? 0 : 2}
                    animationDuration={1500}
                    animationEasing="ease-in-out"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {formattedData.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip content={customTooltip} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <motion.div 
        className="mt-4 grid grid-cols-3 gap-x-2 gap-y-2 text-xs text-gray-600 dark:text-gray-300"
        variants={legendVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        {formattedData.map((category, index) => (
          <motion.div 
            key={index} 
            className="flex items-center"
            variants={itemVariants}
          >
            <div 
              className="w-2 h-2 rounded-full mr-1.5 flex-shrink-0" 
              style={{ 
                backgroundColor: COLORS[index % COLORS.length]
              }}
            />
            <span className="truncate">{category.name}</span>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

export default GraphCard;