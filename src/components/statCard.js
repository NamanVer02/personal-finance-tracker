import { ArrowDown, ArrowUp } from "lucide-react";

function StatCard({ title, value, change, changeType }) {
  return (
    <div
      className="rounded-lg outline outline-1 outline-gray-200 p-5"
      id="test"
    >
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold text-gray-700">{value}</div>
        <div className="flex items-center justify-between mt-2">
          {changeType === 'positive' && <ArrowUp className="text-green-500"/>}
          {changeType === 'negative' && <ArrowDown className="text-red-500"/>}
        </div>
      </div>
    </div>
  );
}

export default StatCard;
