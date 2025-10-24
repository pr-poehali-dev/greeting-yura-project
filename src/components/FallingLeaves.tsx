import { useEffect, useState } from 'react';

interface Leaf {
  id: number;
  left: number;
  animationDuration: number;
  animationDelay: number;
  size: number;
  emoji: string;
}

const FallingLeaves = () => {
  const [leaves, setLeaves] = useState<Leaf[]>([]);

  useEffect(() => {
    const leafEmojis = ['🍂', '🍁', '🌿', '🍃'];
    const newLeaves: Leaf[] = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDuration: 8 + Math.random() * 7,
      animationDelay: Math.random() * 5,
      size: 20 + Math.random() * 15,
      emoji: leafEmojis[Math.floor(Math.random() * leafEmojis.length)]
    }));
    setLeaves(newLeaves);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
      {leaves.map((leaf) => (
        <div
          key={leaf.id}
          className="absolute animate-fall"
          style={{
            left: `${leaf.left}%`,
            animationDuration: `${leaf.animationDuration}s`,
            animationDelay: `${leaf.animationDelay}s`,
            fontSize: `${leaf.size}px`,
            top: '-50px'
          }}
        >
          {leaf.emoji}
        </div>
      ))}
    </div>
  );
};

export default FallingLeaves;
