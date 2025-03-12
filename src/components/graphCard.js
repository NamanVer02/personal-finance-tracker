import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";


// const COLORS = ["#8B5CF6", "#A78BFA", "#C4B5FD", "#DDD6FE", "#EDE9FE"];
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

function GraphCard({ title, value, change, changeType, data }) {
  const darkMode = localStorage.getItem("darkMode");

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

  return (
    <div className="rounded-xl bg-gray-100 shadow-neumorphic p-6 w-full flex flex-col h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</h3>
      </div>
      <div className="text-xl font-bold text-gray-700 mb-4">{value}</div>
      
      <div className="flex-grow flex justify-center items-center">
        <div className="aspect-square w-52 h-52 rounded-full shadow-neumorphic-inset flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={darkMode === "enabled" ? 0 : 2}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip content={customTooltip} />
              {/* <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="18"
                fontWeight="bold"
                fill="#000"
              >
                {`$${data.reduce((accumulator, current) => accumulator + current.value, 0)}`}
              </text> */}
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-3 gap-x-2 gap-y-2 text-xs text-gray-600 dark:text-gray-300">
        {data.map((category, index) => (
          <div key={index} className="flex items-center">
            <div 
              className="w-2 h-2 rounded-full mr-1.5 flex-shrink-0" 
              style={{ 
                backgroundColor: COLORS[index % COLORS.length]
              }}
            />
            <span className="truncate">{category.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GraphCard;