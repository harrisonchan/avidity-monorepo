'use client';
import React, { useState } from 'react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Input,
  Label,
} from '@web/components';
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
        <Link key={item.link + idx} href={item.link}>
          <Button
            className={selectedItemIdx === idx ? 'bg-primary-light text-primary hover:bg-primary-light' : ''}
            key={item.title + idx}
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
    <div className="flex flex-col h-screen align-center items-center p-4 pt-2 mr-4 bg-background rounded-r-2xl">
      <h1>Avidity</h1>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>
            <Avatar className="h-8 w-8 mr-1">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>User</AvatarFallback>
            </Avatar>
            <h4>Harrison</h4>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              Profile
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              Billing
              <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              Settings
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              Keyboard shortcuts
              <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>Team</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>Email</DropdownMenuItem>
                  <DropdownMenuItem>Message</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>More...</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuItem>
              New Team
              <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem>GitHub</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuItem disabled>API</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            Log out
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog>
        <DialogTrigger asChild>
          <Button>Edit Profile</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>Make changes to your profile here. Click save when you're done.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" value="Pedro Duarte" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input id="username" value="@peduarte" className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex flex-row items-center"></div>
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
