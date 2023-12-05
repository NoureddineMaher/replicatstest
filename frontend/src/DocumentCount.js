import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const DocumentCount = () => {
  const [superheroesCount, setSuperheroesCount] = useState(null);
  const [namesCount, setNamesCount] = useState(null);

  useEffect(() => {
    const socket = io('http://localhost:3001', {
      transports: ['websocket'],
    });

    // Listen for documentCount updates for "superheroes" collection
    socket.on('documentCount', ({ count }) => {
      setSuperheroesCount(count);
    });

    // Listen for documentNamesCount updates for "names" collection
    socket.on('documentNamesCount', ({ countNames }) => {
      setNamesCount(countNames);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div>
      <h2>Document Counts</h2>
      <p>Number of superheroes: {superheroesCount}</p>
      <p>Number of names: {namesCount}</p>
    </div>
  );
};

export default DocumentCount;
