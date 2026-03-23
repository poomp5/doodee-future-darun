import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';

// Helper to convert BigInt fields to string for JSON serialization
const serializeTodo = (todo: any) => ({
  ...todo,
  id: todo.id.toString(),
});

// GET /api/db/tasks - Get user's tasks (using user_todos table)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const todos = await prisma.user_todos.findMany({
      where: { user_id: session.user.id },
      orderBy: [{ created_at: 'asc' }],
    });

    // Group tasks by category (or date if category is a date string)
    const tasksByCategory: Record<string, string[]> = {};
    todos.forEach((todo) => {
      const key = todo.category || 'general';
      if (!tasksByCategory[key]) {
        tasksByCategory[key] = [];
      }
      tasksByCategory[key].push(todo.title);
    });

    return NextResponse.json(tasksByCategory);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST /api/db/tasks - Add new task
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { task_date, task_content, title, category } = body;

    // Support both old format (task_date, task_content) and new format (title, category)
    const taskTitle = title || task_content;
    const taskCategory = category || task_date;

    if (!taskTitle) {
      return NextResponse.json({ error: 'title or task_content is required' }, { status: 400 });
    }

    const todo = await prisma.user_todos.create({
      data: {
        user_id: session.user.id,
        title: taskTitle,
        category: taskCategory,
      },
    });

    return NextResponse.json(serializeTodo(todo));
  } catch (error) {
    console.error('Error adding task:', error);
    return NextResponse.json({ error: 'Failed to add task' }, { status: 500 });
  }
}

// DELETE /api/db/tasks - Delete task
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('id');
    const taskDate = searchParams.get('date');
    const taskContent = searchParams.get('content');

    // Support both delete by ID and delete by date+content
    if (taskId) {
      await prisma.user_todos.delete({
        where: {
          id: BigInt(taskId),
          user_id: session.user.id,
        },
      });
    } else if (taskDate && taskContent) {
      // Find and delete by category and title
      const todo = await prisma.user_todos.findFirst({
        where: {
          user_id: session.user.id,
          category: taskDate,
          title: taskContent,
        },
      });
      if (todo) {
        await prisma.user_todos.delete({
          where: { id: todo.id },
        });
      }
    } else {
      return NextResponse.json({ error: 'id or (date and content) are required' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
