import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IoHome, IoAdd, IoSettings, IoColorPalette } from 'react-icons/io5';
import { daisyUIThemeArr } from '@web/types';
import { toTitleCase } from '@shared/utils';
import useUtilStore from '@web/stores/useUtilStore';

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
        className={`p-2 transition-colors rounded-lg text-primary-content shadow-xl bg-primary hover:bg-secondary hover:text-white focus:outline-none focus:ring focus:ring-secondary-focus focus:ring-offset-secondary-content focus:ring-offset-2 ${
          props.isSelected && 'bg-secondary-focus text-secondary-content'
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
  const setTheme = useUtilStore.use.setTheme();
  return (
    <div
      className={`relative flex flex-col h-screen bg-base-300 p-5 pt-8 ${
        sideBarOpen ? 'w-80' : 'w-24'
      } duration-300 rounded-br-3xl rounded-tr-3xl z-10`}>
      {/* <div className="inline-flex">
        <IoHappy className="text-4xl block rounded-full cursor-pointer float-left bg-amber-300 mr-2 text-amber-700" />
        <h1 className={`text-white origin-left font-medium text-2xl ${!sideBarOpen && 'scale-0'}`}>Avidity</h1>
      </div> */}
      <div className="flex flex-row">
        <div>
          <div className="items-center">
            {TABS.map((item, idx) => (
              <div className={`self-center ${idx !== TABS.length - 1 && 'mb-3'}`}>
                <SideBarItem icon={item.icon} isSelected={currentTab === item.link} onClick={() => onItemClick(item)} link={item.link} />
              </div>
            ))}
          </div>
          {/* <div className="dropdown dropdown-top place-self-end bottom-10 absolute">
            <label tabIndex={1} className="btn m-1">
              Set Theme
            </label>
            <ul tabIndex={1} className="dropdown-content menu shadow bg-base-100 rounded-box w-52">
              {daisyUIThemeArr.map((_t) => (
                <li onClick={() => setTheme(_t)}>
                  <a>{toTitleCase(_t)}</a>
                </li>
              ))}
            </ul>
          </div> */}
          <button
            onClick={() => {}}
            className={`absolute bottom-10 dropdown dropdown-top p-2 transition-colors rounded-lg text-primary-content shadow-xl bg-primary hover:bg-secondary hover:text-white focus:outline-none focus:ring focus:ring-secondary-focus focus:ring-offset-secondary-content focus:ring-offset-2`}>
            <IoColorPalette className="text-3xl rounded-full cursor-pointer" />
            {/* <label tabIndex={1} className="btn m-1">
              Set Theme
            </label> */}
            <ul tabIndex={1} className="dropdown-content menu shadow bg-base-100 rounded-box w-52">
              {daisyUIThemeArr.map((_t) => (
                <li onClick={() => setTheme(_t)}>
                  <a className="text-base-content">{toTitleCase(_t)}</a>
                </li>
              ))}
            </ul>
          </button>
        </div>
        <div className={`flex-1 items-center duration-300 ${!sideBarOpen && 'opacity-0'}`}>hello world</div>
        <div className={`flex-1 items-center duration-300 ${!sideBarOpen && 'opacity-0'}`}>hello world 2</div>
      </div>
    </div>
  );
}
