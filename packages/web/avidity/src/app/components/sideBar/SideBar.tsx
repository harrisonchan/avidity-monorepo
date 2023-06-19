import React, { useState } from 'react';

interface SideBarProps {
  items: string[];
  onSelectedItemChange: (_c: string) => void;
}

export default function SideBar(props: SideBarProps) {
  const [selectedItem, setSelectedItem] = useState(props.items[0] ?? '');
  return (
    <div>
      {props.items.map((item) => (
        <div>{item}</div>
      ))}
    </div>
  );
}
