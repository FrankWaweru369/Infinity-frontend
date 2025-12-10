import { useState, useEffect } from 'react';

export default function DataSaverToggle() {
  const [dataSaver, setDataSaver] = useState(false);

  useEffect(() => {
    // Load user preference
    const saved = localStorage.getItem('dataSaver');
    if (saved) setDataSaver(JSON.parse(saved));
  }, []);

  const toggleDataSaver = () => {
    const newValue = !dataSaver;
    setDataSaver(newValue);
    localStorage.setItem('dataSaver', JSON.stringify(newValue));
    alert(`Data Saver ${newValue ? 'ON' : 'OFF'}. Reels will use less data.`);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleDataSaver}
        className={`px-4 py-2 rounded-full transition ${
          dataSaver ? 'bg-green-600' : 'bg-gray-300'
        }`}
      >
        {dataSaver ? '🌿 Data Saver ON' : '💧 Data Saver OFF'}
      </button>
      <span className="text-sm text-gray-600">
        {dataSaver ? 'Saving your data bundle' : 'Using full quality'}
      </span>
    </div>
  );
}
