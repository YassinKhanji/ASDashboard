"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DeleteStaffButton({ id, name }: { id: string; name: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/personnel/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh(); // Refresh the page to show updated list
      } else {
        alert("Failed to delete staff member.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      title="Delete Staff"
      className="p-2 rounded-full text-text-secondary hover:bg-red-500/10 hover:text-red-500 transition-colors disabled:opacity-50"
    >
      <Trash2 size={16} />
    </button>
  );
}
