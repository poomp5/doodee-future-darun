"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale"; // Import Thai locale

const TodoListView = () => {
  const [tasksByDate, setTasksByDate] = useState<Record<string, string[]>>({});
  const [completed, setCompleted] = useState<Record<string, boolean[]>>({});

  useEffect(() => {
    const saved = localStorage.getItem("calendar_tasks");
    if (saved) setTasksByDate(JSON.parse(saved));
  }, []);

  const today = new Date(); // Get today's date
  const todayKey = format(today, "yyyy-MM-dd");
  const formattedToday = format(today, "PPP", { locale: th }); // Format date for display (e.g., 15 ต.ค. 2024)
  const tasks = tasksByDate[todayKey] || [];

  return (
    <div className="w-full mb-4">
      {/* Updated heading to include the formatted date */}
      <h2 className="text-md font-bold mb-4">
        สิ่งที่ต้องทำวันนี้ <span className="text-gray-500 font-medium">({formattedToday})</span>
      </h2>
      {tasks.length === 0 ? (
        <p className="text-sm text-gray-500">ยังไม่มีรายการวันนี้</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <input
                type="checkbox"
                className="accent-pink-500"
                checked={completed[todayKey]?.[idx] || false}
                onChange={() =>
                  setCompleted((prev) => {
                    const newState = { ...prev };
                    const arr = [...(newState[todayKey] || [])];
                    arr[idx] = !arr[idx];
                    newState[todayKey] = arr;
                    return newState;
                  })
                }
              />
              <span
                className={`text-sm ${
                  completed[todayKey]?.[idx] ? "line-through text-gray-400" : ""
                }`}
              >
                {task}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TodoListView;
