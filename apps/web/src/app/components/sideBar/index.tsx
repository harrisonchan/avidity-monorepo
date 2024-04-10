import Link from 'next/link';
import React from 'react';

function SideBar() {
  return (
    <div className="flex flex-col h-screen align-center p-4 pt-2 mr-4 bg-slate-300">
      <button className="text-3xl font-bold mb-2">
        <Link href="/">Avidity</Link>
      </button>
      <div className="flex-1 flex flex-col">
        <button>Schedule</button>
        <button>
          <Link href="/post/new">Create Goal</Link>
        </button>
        <button>Statistics</button>
      </div>
      <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Sign Out</button>
    </div>
  );
}

export default SideBar;
