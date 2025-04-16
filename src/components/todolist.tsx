"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../app/lib/firebase";

type Task = {
  id: string;
  text: string;
  completed: boolean;
  deadline: string;
};

export default function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: string }>(
    {}
  );

  useEffect(() => {
    const fetchTasks = async () => {
      const querySnapshot = await getDocs(collection(db, "tasks"));
      const tasksData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
      setTasks(tasksData);
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeRemaining: { [key: string]: string } = {};
      tasks.forEach((task) => {
        newTimeRemaining[task.id] = calculateTimeRemaining(task.deadline);
      });
      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks]);

  const calculateTimeRemaining = (deadline: string): string => {
    const deadlineTime = new Date(deadline).getTime();
    const now = new Date().getTime();
    const difference = deadlineTime - now;

    if (difference <= 0) return "Waktu habis!";

    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return `${hours}j ${minutes}m ${seconds}d`;
  };

  const addTask = async (): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      title: "Tambahkan tugas baru",
      html:
        '<input id="swal-input1" class="swal2-input" placeholder="Nama tugas">' +
        '<input id="swal-input2" type="datetime-local" class="swal2-input">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Tambah",
      cancelButtonText: "Batal",
      preConfirm: () => {
        const taskName = (
          document.getElementById("swal-input1") as HTMLInputElement
        )?.value;
        const taskDeadline = (
          document.getElementById("swal-input2") as HTMLInputElement
        )?.value;

        if (!taskName || !taskDeadline) {
          Swal.showValidationMessage(
            "Harap isi Nama Tugas dan Tanggal Deadline!"
          );
          return false; // Prevent form submission
        }

        return [taskName, taskDeadline];
      },
    });

    if (formValues) {
      const [taskName, taskDeadline] = formValues;

      const newTask: Omit<Task, "id"> = {
        text: taskName,
        completed: false,
        deadline: taskDeadline,
      };
      const docRef = await addDoc(collection(db, "tasks"), newTask);
      setTasks([...tasks, { id: docRef.id, ...newTask }]);
    }
  };

  const toggleTask = async (id: string): Promise<void> => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    const taskRef = doc(db, "tasks", id);
    await updateDoc(taskRef, {
      completed: updatedTasks.find((task) => task.id === id)?.completed,
    });
  };

  const deleteTask = async (id: string): Promise<void> => {
    const result = await Swal.fire({
      title: "Yakin ingin menghapus?",
      text: "Tugas ini akan dihapus secara permanen!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
      background: "#ffffff",
      color: "#333333",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (result.isConfirmed) {
      await deleteDoc(doc(db, "tasks", id));
      setTasks(tasks.filter((task) => task.id !== id));

      // Notifikasi setelah berhasil dihapus
      await Swal.fire({
        title: "Terhapus!",
        text: "Tugas berhasil dihapus.",
        icon: "success",
        background: "#ffffff",
        color: "#333333",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  const editTask = async (task: Task): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      title: "Edit tugas",
      html:
        `<input id="swal-input1" class="swal2-input" placeholder="Nama tugas" value="${task.text}">` +
        `<input id="swal-input2" type="datetime-local" class="swal2-input" value="${task.deadline}">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Simpan",
      cancelButtonText: "Batal",
      preConfirm: () => {
        const taskName = (
          document.getElementById("swal-input1") as HTMLInputElement
        )?.value;
        const taskDeadline = (
          document.getElementById("swal-input2") as HTMLInputElement
        )?.value;

        if (!taskName || !taskDeadline) {
          Swal.showValidationMessage(
            "Harap isi Nama Tugas dan Tanggal Deadline!"
          );
          return false; // Prevent form submission
        }

        return [taskName, taskDeadline];
      },
    });

    if (formValues) {
      const [taskName, taskDeadline] = formValues;

      const updatedTask: Task = {
        ...task,
        text: taskName,
        deadline: taskDeadline,
      };
      await updateDoc(doc(db, "tasks", task.id), updatedTask);
      setTasks(
        tasks.map((t) => (t.id === task.id ? { ...t, ...updatedTask } : t))
      );
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-4 bg-gray-900 text-white shadow-lg rounded-lg">
      <h1 className="text-3xl text-center text-emerald-400 font-bold mb-6">
        📝 To-Do List
      </h1>
      <div className="flex justify-center mb-6">
        <button
          onClick={addTask}
          className="bg-emerald-600 hover:bg-emerald-700 px-6 py-2 rounded-md text-white font-semibold text-sm"
        >
          + Tambah Tugas
        </button>
      </div>
      <ul>
        <AnimatePresence>
          {tasks.map((task) => {
            const timeLeft = calculateTimeRemaining(task.deadline);
            const isExpired = timeLeft === "Waktu habis!";
            const taskColor = task.completed
              ? "bg-green-800"
              : isExpired
              ? "bg-red-800"
              : "bg-yellow-700";

            return (
              <motion.li
                key={task.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className={`flex flex-col justify-between p-4 mb-4 rounded-lg ${taskColor}`}
              >
                <div className="flex justify-between items-start">
                  <span
                    onClick={() => toggleTask(task.id)}
                    className={`cursor-pointer text-base ${
                      task.completed
                        ? "line-through text-gray-400"
                        : "font-semibold text-white"
                    }`}
                  >
                    {task.text}
                  </span>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded text-sm w-24"
                    >
                      Hapus
                    </button>
                    <button
                      onClick={() => editTask(task)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm w-24"
                    >
                      Edit
                    </button>
                  </div>
                </div>
                <p className="text-sm mt-2 text-gray-200">
                  📅 Deadline: {new Date(task.deadline).toLocaleString()}
                </p>
                <p className="text-xs font-semibold text-gray-300">
                  ⏳ {timeRemaining[task.id] || "Menghitung..."}
                </p>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
