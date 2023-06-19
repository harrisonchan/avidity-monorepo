import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IoHome, IoAdd, IoSettings } from 'react-icons/io5';

interface SideBarItemProps {
  icon?: React.ReactNode;
  onClick?: () => void;
  isSelected?: boolean;
  link: string;
}

function SideBarItem(props: SideBarItemProps) {
  const onClick = () => {
    props.onClick && props.onClick();
  };
  return (
    <Link to={'/' + props.link}>
      <button
        onClick={onClick}
        className={`p-2 transition-colors rounded-lg text-gray-700 shadow-xl bg-slate-100 hover:bg-indigo-800 hover:text-white focus:outline-none focus:ring focus:ring-indigo-600 focus:ring-offset-white focus:ring-offset-2 ${
          props.isSelected && 'bg-indigo-800 text-white'
        }`}>
        {props.icon ?? null}
      </button>
    </Link>
  );
}

interface SideBarProps {
  onSelectedTabChange?: (_c: string) => void;
}

type TabItem = {
  link: string;
  icon: React.ReactNode;
  subItems?: TabItem[];
};

const TABS: TabItem[] = [
  { link: 'home', icon: <IoHome className="text-3xl rounded-full cursor-pointer" /> },
  { link: 'add-goal', icon: <IoAdd className="text-3xl rounded-full cursor-pointer" /> },
  {
    link: 'settings',
    icon: <IoSettings className="text-3xl rounded-full cursor-pointer" />,
    subItems: [{ link: 'Account Settings', icon: <IoSettings className="text-3xl rounded-full cursor-pointer" /> }],
  },
];

export default function SideBar(props: SideBarProps) {
  const [sideBarOpen, setSideBarOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(TABS[0].link ?? '');
  const onItemClick = (item: TabItem) => {
    if (item.subItems) currentTab === item.link && sideBarOpen ? setSideBarOpen(false) : setSideBarOpen(true);
    else setSideBarOpen(false);
    setCurrentTab(item.link);
  };
  return (
    <div
      className={`relative flex flex-col h-screen bg-red-500 p-5 pt-8 ${
        sideBarOpen ? 'w-80' : 'w-24'
      } duration-300 rounded-br-3xl rounded-tr-3xl z-10`}>
      {/* <div className="inline-flex">
        <IoHappy className="text-4xl block rounded-full cursor-pointer float-left bg-amber-300 mr-2 text-amber-700" />
        <h1 className={`text-white origin-left font-medium text-2xl ${!sideBarOpen && 'scale-0'}`}>Avidity</h1>
      </div> */}
      <div className="flex flex-row">
        <div className="mr-3">
          {TABS.map((item, idx) => (
            <div className={`${idx !== TABS.length - 1 && 'mb-3'}`}>
              <SideBarItem icon={item.icon} isSelected={currentTab === item.link} onClick={() => onItemClick(item)} link={item.link} />
            </div>
          ))}
        </div>
        <div className={`flex-1 items-center duration-300 ${!sideBarOpen && 'opacity-0'}`}>hello wolrd</div>
      </div>
    </div>
  );
}
