"use client";

import { useState } from "react";
import { Edit, Check, Trash, ListTodo, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

interface TodoSectionProps {
  initialTodos: any[];
  userId: string;
}

export default function TodoSection({ initialTodos, userId }: TodoSectionProps) {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');

  const [todoList, setTodoList] = useState(initialTodos);
  const [newTodoText, setNewTodoText] = useState("");
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [todoOpen, setTodoOpen] = useState(false);

  const completedCount = todoList.filter((item) => item.is_completed).length;

  const addTodo = async () => {
    if (newTodoText.trim() === "") return;

    try {
      const res = await fetch('/api/db/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          title: newTodoText,
          is_completed: false,
        }),
      });

      const { data } = await res.json();
      setTodoList([data, ...todoList]);
      setNewTodoText("");
    } catch (error) {
      console.error("Error adding todo:", error);
    }
  };

  const toggleTodo = async (id: number, currentStatus: boolean) => {
    try {
      await fetch('/api/db/todos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          is_completed: !currentStatus,
          completed_at: !currentStatus ? new Date().toISOString() : null,
        }),
      });

      setTodoList((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_completed: !currentStatus } : item
        )
      );
    } catch (error) {
      console.error("Error toggling todo:", error);
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      await fetch(`/api/db/todos?id=${id}`, { method: 'DELETE' });
      setTodoList((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  };

  const startEditingTodo = (id: number, text: string) => {
    setEditingTodoId(id);
    setEditingText(text);
  };

  const saveEditedTodo = async () => {
    if (!editingTodoId) return;

    try {
      await fetch('/api/db/todos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTodoId,
          title: editingText,
        }),
      });

      setTodoList((prev) =>
        prev.map((item) =>
          item.id === editingTodoId ? { ...item, title: editingText } : item
        )
      );
      setEditingTodoId(null);
      setEditingText("");
    } catch (error) {
      console.error("Error updating todo:", error);
    }
  };

  return (
    <div className="w-full mt-2">
      <button
        onClick={() => setTodoOpen(!todoOpen)}
        className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg flex items-center w-full justify-between"
      >
        <div className="flex items-center">
          <ListTodo className="h-4 w-4 mr-2" />
          {t('todoList')} ({completedCount}/{todoList.length})
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${todoOpen ? 'rotate-180' : ''}`} />
      </button>

      {todoOpen && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex w-full gap-2 mb-2">
            <input
              type="text"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTodo()}
              placeholder={t('addTodo')}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-pink-300"
            />
            <button
              onClick={addTodo}
              className="bg-pink-500 hover:bg-pink-600 text-white font-bold px-3 py-2 rounded text-sm"
            >
              {tCommon('add')}
            </button>
          </div>
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {todoList.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between bg-white p-2 rounded shadow-sm text-sm"
              >
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="checkbox"
                    checked={item.is_completed}
                    onChange={() => toggleTodo(item.id, item.is_completed)}
                    className="accent-pink-500"
                  />
                  {editingTodoId === item.id ? (
                    <input
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveEditedTodo()}
                      className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  ) : (
                    <span className={item.is_completed ? "line-through text-gray-500" : ""}>
                      {item.title}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {editingTodoId === item.id ? (
                    <button onClick={saveEditedTodo} className="text-green-600 hover:text-green-800 p-1">
                      <Check className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={() => startEditingTodo(item.id, item.title)} className="text-yellow-600 hover:text-yellow-800 p-1">
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => deleteTodo(item.id)} className="text-red-600 hover:text-red-800 p-1">
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {todoList.length === 0 && (
            <p className="text-center text-gray-500 text-sm py-2">{t('noTodosYet')}</p>
          )}
        </div>
      )}
    </div>
  );
}
