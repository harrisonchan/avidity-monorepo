'use client';
import React, { useEffect, useState } from 'react';
import { Button, ButtonProps } from '@web/components';
import Link from 'next/link';

type SideBarMenuProps = {
  items: { title: string; link: string }[];
  selectedItemIdx?: number;
};

function SideBarMenu(props: SideBarMenuProps) {
  const [selectedItemIdx, setSelectedItemIdx] = useState(props.selectedItemIdx ?? -1);
  return (
    <div className="flex flex-col">
      {props.items.map((item, idx) => (
        <Link href={item.link}>
          <Button
            className={selectedItemIdx === idx ? 'bg-primary-light text-primary hover:bg-primary-light' : ''}
            key={idx}
            onClick={() => {
              setSelectedItemIdx(idx);
            }}>
            {item.title}
          </Button>
        </Link>
      ))}
    </div>
  );
}

function SideBar() {
  return (
    <div className="flex flex-col h-screen align-center p-4 pt-2 mr-4 bg-background rounded-r-2xl">
      {/* <Button>Today</Button>
      <SideBarMenuItem isSelected={false}>Scheduler</SideBarMenuItem> */}
      <SideBarMenu
        items={[
          { title: 'Hi', link: '/' },
          { title: 'Today', link: '/' },
          { title: 'Tomorrow', link: '/' },
          { title: 'Add Goal', link: '/add/goal' },
          { title: 'Post', link: '/post/new' },
        ]}
        selectedItemIdx={1}
      />
    </div>
  );
}

export default SideBar;
