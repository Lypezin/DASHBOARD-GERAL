import { notFound } from 'next/navigation';
import { FolhasPreview } from './preview';

export default function FolhasSmokePage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <FolhasPreview />;
}
