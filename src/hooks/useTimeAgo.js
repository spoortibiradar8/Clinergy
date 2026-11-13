import { useState, useEffect } from 'react';

export function useTimeAgo(timestamp) {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    if (!timestamp) {
      setTimeAgo('Just now');
      return;
    }

    const updateTimeAgo = () => {
      const now = new Date();
      const past = new Date(timestamp);
      
      if (isNaN(past.getTime())) {
          setTimeAgo('Just now');
          return;
      }

      const diffInSeconds = Math.floor((now - past) / 1000);

      if (diffInSeconds < 10) {
        setTimeAgo('Just now');
      } else if (diffInSeconds < 60) {
        setTimeAgo(`${diffInSeconds} seconds ago`);
      } else if (diffInSeconds < 3600) {
        setTimeAgo(`${Math.floor(diffInSeconds / 60)} minutes ago`);
      } else if (diffInSeconds < 86400) {
        setTimeAgo(`${Math.floor(diffInSeconds / 3600)} hours ago`);
      } else {
        setTimeAgo(`${Math.floor(diffInSeconds / 86400)} days ago`);
      }
    };

    updateTimeAgo();
    const intervalId = setInterval(updateTimeAgo, 5000); // 5 sec is smooth

    return () => clearInterval(intervalId);
  }, [timestamp]);

  return timeAgo;
}
