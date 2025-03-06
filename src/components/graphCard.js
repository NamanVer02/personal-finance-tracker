function GraphCard({ title, value, change, changeType }) {
  return (
    <div className="rounded-lg bg-gray-100 shadow-neumorphic p-6" id="test">
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      </div>
      <div className="text-2xl font-bold text-gray-700">{value}</div>
      <div className="mt-4 w-full rounded-lg" />
      <div className="mt-2 flex items-center gap-2">
        <div
          className={`text-xs px-2 py-0.5 rounded ${
            changeType === "positive" ? "text-purple-600" : "text-red-600"
          }`}
        >
          {change}
        </div>
      </div>
    </div>
  );
}

export default GraphCard;
