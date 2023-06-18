import React from 'react';
import { GoalCardProps } from '@shared/types';
// import './GoalCard.css';

export default function GoalCard(props: GoalCardProps) {
  return (
    <div>
      <h3>{props.title}</h3>
      {props.description ? <p>{props.description}</p> : null}
      <div className="bg-red-600 rounded-xl" style={{ color: 'hotpink' }}>
        <div className="flex flex-col p-8 rounded-xl bg-white shadow-xl translate-x-4 translate-y-4 w-96 md:w-auto">
          <img src="https://www.dstny.se/app/uploads/telia_pp_rgb.png.webp" className="w-12" />
          <div className="mt-3 font-semibold text-lg">Telia Mobil 15GB</div>
          <div className="text-sm font-light w-60 md:w-auto">Unlimited calls</div>
          <div className="my-4">
            <span className="font-bold text-base">953,-</span>
            <span className="font-light text-sm">/month</span>
          </div>

          <button className="bg-[#F4F5FA] px-4 py-3 rounded-full  border border-[#F0F0F6] shadow-xl mt-4">Add subscription</button>
        </div>
      </div>
    </div>
  );
}
