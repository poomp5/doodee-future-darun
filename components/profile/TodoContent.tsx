"use client";

import { useState } from "react";
import { Plus, Check, Edit, Trash, ListTodo, Calendar, Sparkles, ExternalLink, CheckCircle2, Circle } from "lucide-react";
import { showToast } from "@/lib/toast";
import { useTranslations } from "next-intl";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";

interface TodoContentProps {
  userId: string;
  todos: any[];
  interestedFaculties: any[];
}

export default function TodoContent({ userId, todos: initialTodos, interestedFaculties }: TodoContentProps) {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');

  const [todos, setTodos] = useState(initialTodos);
  const [newTodoText, setNewTodoText] = useState("");
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const confirmDialog = useConfirmDialog();

  const completedCount = todos.filter((item) => item.is_completed).length;
  const activeCount = todos.length - completedCount;

  const addTodo = async () => {
    if (newTodoText.trim() === "") {
      showToast.error(t('todo.errorsFillRequired'));
      return;
    }

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

      if (!res.ok) throw new Error('Failed to create todo');

      const { data } = await res.json();
      setTodos([data, ...todos]);
      setNewTodoText("");
      showToast.success(t('todo.successAdded'));
    } catch (error) {
      console.error("Error adding todo:", error);
      showToast.error(t('todo.errorsCannotAdd'));
    }
  };

  const toggleTodo = async (id: number, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/db/todos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          is_completed: !currentStatus,
          completed_at: !currentStatus ? new Date().toISOString() : null,
        }),
      });

      if (!res.ok) throw new Error('Failed to toggle todo');

      setTodos((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_completed: !currentStatus } : item
        )
      );
    } catch (error) {
      console.error("Error toggling todo:", error);
      showToast.error(t('todo.errorsCannotUpdate'));
    }
  };

  const deleteTodo = (id: number) => {
    confirmDialog.open({
      title: t('todo.deleteTitle'),
      description: t('todo.deleteConfirm'),
      confirmText: tCommon('delete'),
      cancelText: tCommon('cancel'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/db/todos?id=${id}`, { method: 'DELETE' });

          if (!res.ok) throw new Error('Failed to delete todo');

          setTodos((prev) => prev.filter((item) => item.id !== id));
          showToast.success(t('todo.successDeleted'));
        } catch (error) {
          console.error("Error deleting todo:", error);
          showToast.error(t('todo.errorsCannotDelete'));
        }
      }
    });
  };

  const startEditingTodo = (id: number, text: string) => {
    setEditingTodoId(id);
    setEditingText(text);
  };

  const saveEditedTodo = async () => {
    if (!editingTodoId) return;
    if (editingText.trim() === "") {
      showToast.error(t('todo.errorsFillRequired'));
      return;
    }

    try {
      const res = await fetch('/api/db/todos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTodoId,
          title: editingText,
        }),
      });

      if (!res.ok) throw new Error('Failed to update todo');

      setTodos((prev) =>
        prev.map((item) =>
          item.id === editingTodoId ? { ...item, title: editingText } : item
        )
      );
      setEditingTodoId(null);
      setEditingText("");
      showToast.success(t('todo.successUpdated'));
    } catch (error) {
      console.error("Error updating todo:", error);
      showToast.error(t('todo.errorsCannotUpdate'));
    }
  };

  const generateAITodos = async () => {
    if (interestedFaculties.length === 0) {
      showToast.error(t('todo.errorsSelectFacultyFirst'));
      return;
    }

    setIsGenerating(true);
    showToast.info(t('todo.infoGenerating'));

    // TODO: Implement AI generation based on dream faculties
    // For now, show a placeholder message
    setTimeout(() => {
      setIsGenerating(false);
      showToast.info(t('todo.errorsAiDeveloping'));
    }, 2000);
  };

  const activeTodos = todos.filter(todo => !todo.is_completed);
  const completedTodos = todos.filter(todo => todo.is_completed);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ListTodo className="w-6 h-6 sm:w-7 sm:h-7 text-pink-600" />
              {t('todo.title')}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {t('todo.subtitle')}
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <div className="text-sm break-words">
              <span className="text-gray-600">{t('todo.remaining')}: </span>
              <span className="font-semibold text-pink-600">{activeCount}</span>
              <span className="text-gray-400 mx-1">•</span>
              <span className="text-gray-600">{t('todo.completed')}: </span>
              <span className="font-semibold text-green-600">{completedCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Todo Form */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Plus className="w-5 h-5 text-pink-600" />
          {t('todo.addNew')}
        </h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
            placeholder={t('todo.placeholder')}
            className="w-full sm:flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
          <button
            onClick={addTodo}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            {tCommon('add')}
          </button>
        </div>
      </div>

      {/* AI Generation Section */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-2">
              {t('todo.aiGenerate')}
            </h3>
            <p className="text-sm text-gray-600 mb-4 break-words">
              {t('todo.aiDescription')}
            </p>
            {interestedFaculties.length > 0 && (
              <div className="mb-4 p-3 bg-white rounded-lg border border-purple-200">
                <p className="text-xs font-medium text-gray-700 mb-2">{t('todo.yourDreamFaculties')}:</p>
                <div className="space-y-1">
                  {interestedFaculties.slice(0, 3).map((faculty, idx) => (
                    <div key={faculty.id} className="text-sm text-gray-800 flex items-center gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-pink-100 text-pink-600 text-xs flex items-center justify-center font-semibold">
                        {idx + 1}
                      </span>
                      <span className="break-words">{faculty.program_name_th || faculty.faculty_name_th}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={generateAITodos}
              disabled={isGenerating || interestedFaculties.length === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-pulse' : ''}`} />
              {isGenerating ? t('todo.generating') : t('todo.aiGenerate')}
            </button>
            {interestedFaculties.length === 0 && (
              <p className="text-xs text-gray-500 mt-2">
                {t('todo.selectFacultyFirst')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Active Todos */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Circle className="w-5 h-5 text-pink-600" />
          {t('todo.active', { count: activeCount })}
        </h3>

        {activeTodos.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-1">{t('todo.noActive')}</p>
            <p className="text-sm text-gray-400">{t('todo.getStarted')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeTodos.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-pink-300 hover:bg-pink-50/50 transition-all group"
              >
                <button
                  onClick={() => toggleTodo(item.id, item.is_completed)}
                  className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 border-gray-400 hover:border-pink-600 transition-colors flex items-center justify-center"
                >
                  {item.is_completed && <Check className="w-4 h-4 text-pink-600" />}
                </button>

                {editingTodoId === item.id ? (
                  <input
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEditedTodo();
                      if (e.key === "Escape") {
                        setEditingTodoId(null);
                        setEditingText("");
                      }
                    }}
                    className="flex-1 min-w-0 px-3 py-2 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    autoFocus
                  />
                ) : (
                  <span className="flex-1 min-w-0 text-gray-800 break-words whitespace-normal leading-relaxed">{item.title}</span>
                )}

                <div className="flex-shrink-0 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  {editingTodoId === item.id ? (
                    <>
                      <button
                        onClick={saveEditedTodo}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title={tCommon('save')}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingTodoId(null);
                          setEditingText("");
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title={tCommon('cancel')}
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditingTodo(item.id, item.title)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title={tCommon('edit')}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTodo(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title={tCommon('delete')}
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Todos */}
      {completedTodos.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            {t('todo.completedList', { count: completedCount })}
          </h3>

          <div className="space-y-2">
            {completedTodos.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50 group"
              >
                <button
                  onClick={() => toggleTodo(item.id, item.is_completed)}
                  className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-green-600 hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-white" />
                </button>

                <span className="flex-1 min-w-0 text-gray-500 line-through break-words whitespace-normal">{item.title}</span>

                <div className="flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => deleteTodo(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title={tCommon('delete')}
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Google Calendar Integration (Future Feature) */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              {t('todo.calendarFeature')}
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </h4>
            <p className="text-sm text-gray-600 break-words">
              {t('todo.calendarDesc')}
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog.dialog}
    </div>
  );
}
