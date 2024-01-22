import { useParams } from 'react-router-dom';

export default function Schedule() {
  const { date } = useParams();
  return <div>{date}</div>;
}
